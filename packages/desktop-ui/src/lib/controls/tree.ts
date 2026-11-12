import { Directionality } from '@angular/cdk/bidi';
import {
  afterNextRender,
  ChangeDetectionStrategy,
  Component,
  computed,
  DestroyRef,
  effect,
  ElementRef,
  inject,
  Injector,
  input,
  model,
  output,
  signal,
  untracked,
} from '@angular/core';
import { NgIcon } from '@ng-icons/core';
import {
  selectionAll,
  selectionClick,
  selectionMoveBy,
  selectionMoveTo,
  selectionToggleActive,
  type SelectionModifiers,
  type SelectionState,
  typeaheadIndex,
} from '@spartan-native/helm';
import { injectSkin, skinFamily, type Skin } from '@spartan-native/theme';

const TYPEAHEAD_RESET_MS = 600;
const PAGE = 10;

/** Skins whose expander is a disclosure triangle (the others draw a chevron). */
const TRIANGLE: readonly Skin[] = ['mac', 'macc', 'gtk', 'web'];

/** Document order of two elements, for Array.sort. */
function domOrder(a: { element: Element }, b: { element: Element }): number {
  if (a.element === b.element) return 0;
  return a.element.compareDocumentPosition(b.element) & Node.DOCUMENT_POSITION_FOLLOWING ? -1 : 1;
}

/**
 * A hierarchical list (folders, sections, a document outline) with the desktop selection model:
 *  - Windows 11: WinUI TreeView, chevrons, the accent pill on the selected row
 *  - Windows 10: square rows, chevrons, accent-tinted selection
 *  - macOS 26 / 13–15: NSOutlineView, disclosure triangles, accent selection that turns grey
 *    when the tree loses focus
 *  - GNOME: a GtkListView with GtkTreeExpander, triangles, neutral rounded selection
 *  - KDE: a Breeze QTreeView, chevrons, accent-filled selection (muted without focus)
 *  - ChromeOS: the Files app tree, chevrons, tonal pill selection
 *
 * Items nest in markup; any depth, `@for` and `@if` work. Values must be unique in the tree.
 *
 * ```html
 * <sn-tree aria-label="Folders" [(selection)]="folder" (activated)="open($event)">
 *   <sn-tree-item value="docs" label="Documents" icon="lucideFolder" [(expanded)]="docsOpen">
 *     <sn-tree-item value="docs/taxes" label="Taxes" icon="lucideFolder" />
 *     <sn-tree-item value="docs/work" label="Work" icon="lucideFolder" />
 *   </sn-tree-item>
 *   <sn-tree-item value="photos" label="Photos" icon="lucideFolder" />
 * </sn-tree>
 * ```
 *
 * Mouse: click selects, Ctrl/⌘-click and Shift-click with `multiple`, the expander or a
 * double-click on a parent opens and closes it, double-click on a leaf activates.
 * Keyboard: ↑ ↓ Home End PgUp PgDn move (Shift extends, Ctrl/⌘ moves focus only with `multiple`),
 * → opens or goes to the first child, ← closes or goes to the parent, `*` opens all siblings,
 * Enter activates, Space selects (Ctrl+Space toggles), Ctrl/⌘+A selects all, type to jump.
 */
@Component({
  selector: 'sn-tree',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    'data-slot': 'sn-tree',
    role: 'tree',
    '[attr.aria-multiselectable]': 'multiple() || null',
    '[attr.data-family]': 'family()',
    '[attr.data-skin]': 'skin()',
    '[attr.data-triangle]': "triangle() ? '' : null",
    '(keydown)': 'onKeydown($event)',
  },
  template: `<ng-content />`,
  styleUrl: './tree.scss',
})
export class SnTree<K = unknown> {
  /** Allow more than one selected item. */
  readonly multiple = input(false);
  /** The selected values, in visible order. Two-way bindable. */
  readonly selection = model<readonly K[]>([]);
  /** Enter, or a double-click on an item without children. */
  readonly activated = output<K>();

  protected readonly skin = injectSkin();
  protected readonly family = computed(() => skinFamily(this.skin()));
  /** @internal */
  readonly triangle = computed(() => TRIANGLE.includes(this.skin()));
  private readonly dir = inject(Directionality, { optional: true });
  private readonly injector = inject(Injector);

  private readonly registered = signal<readonly SnTreeItem<K>[]>([]);
  /** Bumped after items render or move, so the document order is read again. */
  private readonly orderVersion = signal(0);
  private orderPending = false;
  /** Every item, in document order. */
  private readonly ordered = computed(() => {
    this.orderVersion();
    return [...this.registered()].sort(domOrder);
  });
  /** The items whose ancestors are all open: what the keyboard and Shift ranges walk. */
  private readonly visible = computed(() => this.ordered().filter((item) => item.isVisible()));
  private readonly visibleKeys = computed(() => this.visible().map((i) => i.value()));

  private readonly cursor = signal<Omit<SelectionState<K>, 'selected'>>({ anchor: null, active: null });
  private readonly selectedSet = computed(() => new Set(this.selection()));

  /** The item that holds the single Tab stop. */
  readonly tabStop = computed(() => {
    const visible = this.visible();
    const active = this.cursor().active;
    const selected = this.selectedSet();
    return (
      visible.find((i) => i.value() === active) ?? visible.find((i) => selected.has(i.value())) ?? visible[0] ?? null
    );
  });

  private typeahead = '';
  private typeaheadTimer: ReturnType<typeof setTimeout> | undefined;

  constructor() {
    // Items removed: drop their values from the selection. Not while a value isn't bound yet
    // (on first render the items exist before their inputs are set).
    effect(() => {
      const keys = this.registered().map((i) => i.value());
      if (keys.some((k) => k === undefined)) return;
      untracked(() => {
        const present = new Set(keys);
        const kept = this.selection().filter((k) => present.has(k));
        if (kept.length !== this.selection().length) this.selection.set(kept);
        const { anchor, active } = this.cursor();
        if ((anchor !== null && !present.has(anchor)) || (active !== null && !present.has(active))) {
          this.cursor.set({
            anchor: present.has(anchor as K) ? anchor : null,
            active: present.has(active as K) ? active : null,
          });
        }
      });
    });
    inject(DestroyRef).onDestroy(() => clearTimeout(this.typeaheadTimer));
  }

  // --- Items -------------------------------------------------------------------------------
  /** @internal */
  register(item: SnTreeItem<K>): void {
    this.registered.update((items) => [...items, item]);
    this.reorder();
  }

  /** @internal */
  unregister(item: SnTreeItem<K>): void {
    this.registered.update((items) => items.filter((i) => i !== item));
  }

  /** @internal The direct children of `parent` (null: the top level), in document order. */
  childrenOf(parent: SnTreeItem<K> | null): SnTreeItem<K>[] {
    return this.ordered().filter((i) => i.parent === parent);
  }

  /** @internal */
  isSelected(key: K): boolean {
    return this.selectedSet().has(key);
  }

  /** @internal Focus landed on an item (Tab, click): it becomes the cursor. */
  focused(item: SnTreeItem<K>): void {
    if (this.cursor().active !== item.value()) this.cursor.update((c) => ({ ...c, active: item.value() }));
  }

  /** @internal */
  click(item: SnTreeItem<K>, event: MouseEvent): void {
    const keys = this.visibleKeys();
    this.apply(selectionClick(this.state(), keys, item.value(), this.modifiers(event), this.multiple()));
  }

  /** @internal */
  activate(item: SnTreeItem<K>): void {
    this.activated.emit(item.value());
  }

  /** @internal An item closed: if the cursor or a selection was inside it, it moves to the item. */
  collapsed(item: SnTreeItem<K>): void {
    const inside = (key: K | null) => key !== null && item.descendants().some((d) => d.value() === key);
    const { active } = this.cursor();
    if (!inside(active)) return;
    const hadSelection = this.selection().some(inside);
    const keys = this.visibleKeys();
    const index = keys.indexOf(item.value());
    if (hadSelection && !this.multiple()) {
      this.apply(selectionMoveTo(this.state(), keys, index, {}, false));
    } else {
      this.cursor.update((c) => ({ ...c, active: item.value() }));
    }
    item.element.focus();
  }

  // --- Keyboard ----------------------------------------------------------------------------
  protected onKeydown(event: KeyboardEvent): void {
    const item = this.registered().find((i) => i.element === event.target);
    if (!item) return; // a control inside an item's content
    this.orderVersion.update((v) => v + 1); // items may have moved since the last render
    this.cursor.update((c) => ({ ...c, active: item.value() }));

    const keys = this.visibleKeys();
    const state = this.state();
    const mods = this.modifiers(event);
    const multiple = this.multiple();
    const rtl = this.dir?.value === 'rtl';
    const mac = this.family() === 'macos';
    let next: SelectionState<K> | null = null;

    switch (event.key) {
      case 'ArrowDown':
        next =
          mac && event.metaKey
            ? selectionMoveTo(state, keys, keys.length - 1, { range: mods.range }, multiple)
            : selectionMoveBy(state, keys, 1, mods, multiple);
        break;
      case 'ArrowUp':
        next =
          mac && event.metaKey
            ? selectionMoveTo(state, keys, 0, { range: mods.range }, multiple)
            : selectionMoveBy(state, keys, -1, mods, multiple);
        break;
      case 'Home':
        next = selectionMoveTo(state, keys, 0, mods, multiple);
        break;
      case 'End':
        next = selectionMoveTo(state, keys, keys.length - 1, mods, multiple);
        break;
      case 'PageDown':
        next = selectionMoveBy(state, keys, PAGE, mods, multiple);
        break;
      case 'PageUp':
        next = selectionMoveBy(state, keys, -PAGE, mods, multiple);
        break;
      case 'ArrowRight':
      case 'ArrowLeft': {
        const opening = (event.key === 'ArrowRight') !== rtl;
        if (event.altKey || event.ctrlKey || event.metaKey) return;
        if (opening) {
          if (item.hasChildren() && !item.expanded()) {
            item.setExpanded(true);
          } else if (item.expanded()) {
            const first = item.children()[0];
            if (first) next = selectionMoveTo(state, keys, keys.indexOf(first.value()), {}, multiple);
          }
        } else if (item.expanded() && item.hasChildren()) {
          item.setExpanded(false);
        } else if (item.parent) {
          next = selectionMoveTo(state, keys, keys.indexOf(item.parent.value()), {}, multiple);
        }
        if (!next) {
          event.preventDefault();
          return;
        }
        break;
      }
      case '*':
        for (const sibling of this.childrenOf(item.parent)) if (sibling.hasChildren()) sibling.setExpanded(true);
        event.preventDefault();
        return;
      case 'Enter':
        this.activated.emit(item.value());
        event.preventDefault();
        return;
      case ' ':
        if (this.typeahead) return this.onTypeahead(event, keys); // a space inside a type-ahead word
        next = selectionToggleActive(state, keys, mods, multiple);
        break;
      default:
        if ((event.key === 'a' || event.key === 'A') && mods.toggle && !event.altKey) {
          if (!multiple) return;
          next = selectionAll(state, keys, multiple);
          break;
        }
        return this.onTypeahead(event, keys);
    }
    event.preventDefault();
    this.apply(next);
  }

  private onTypeahead(event: KeyboardEvent, keys: readonly K[]): void {
    if (event.key.length !== 1 || event.ctrlKey || event.metaKey || event.altKey) return;
    event.preventDefault();
    clearTimeout(this.typeaheadTimer);
    this.typeahead += event.key;
    this.typeaheadTimer = setTimeout(() => (this.typeahead = ''), TYPEAHEAD_RESET_MS);
    const visible = this.visible();
    const current = keys.indexOf(this.cursor().active as K);
    const index = typeaheadIndex(
      visible.map((i) => i.label()),
      this.typeahead,
      current,
    );
    if (index >= 0) this.apply(selectionMoveTo(this.state(), keys, index, {}, this.multiple()));
  }

  // --- Helpers -----------------------------------------------------------------------------
  private state(): SelectionState<K> {
    return { selected: this.selection(), ...this.cursor() };
  }

  private apply(next: SelectionState<K>): void {
    this.cursor.set({ anchor: next.anchor, active: next.active });
    const prev = this.selection();
    if (prev.length !== next.selected.length || prev.some((k, i) => k !== next.selected[i])) {
      this.selection.set(next.selected);
    }
    // the focus follows the cursor
    const target = this.visible().find((i) => i.value() === next.active);
    if (target && target.element !== target.element.ownerDocument.activeElement) target.element.focus();
  }

  /** ⌘ toggles on macOS, Ctrl everywhere else (Ctrl-click is the context menu on macOS). */
  private modifiers(event: MouseEvent | KeyboardEvent): SelectionModifiers {
    return { range: event.shiftKey, toggle: this.family() === 'macos' ? event.metaKey : event.ctrlKey };
  }

  /** Reads the document order again once the newly registered items are in place. */
  private reorder(): void {
    if (this.orderPending) return;
    this.orderPending = true;
    afterNextRender(
      () => {
        this.orderPending = false;
        this.orderVersion.update((v) => v + 1);
      },
      { injector: this.injector },
    );
  }
}

/**
 * One item of an `<sn-tree>`; nest items inside it for its children. `label` is its text (and
 * the type-ahead text); `icon` an @ng-icons name registered with provideIcons().
 * Extra trailing content (a count, a badge) goes in `[snTreeItemEnd]`.
 *
 * `expandable` shows the expander before the children exist, for lazy loading: listen to
 * `(expandedChange)` and add the children then.
 */
@Component({
  selector: 'sn-tree-item',
  imports: [NgIcon],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    'data-slot': 'sn-tree-item',
    role: 'treeitem',
    '[attr.aria-level]': 'level()',
    '[attr.aria-expanded]': 'hasChildren() ? expanded() : null',
    '[attr.aria-selected]': 'selected()',
    '[attr.aria-label]': 'label()',
    '[attr.tabindex]': 'tree.tabStop() === this ? 0 : -1',
    '[attr.data-selected]': "selected() ? '' : null",
    '[attr.data-expanded]': "hasChildren() && expanded() ? '' : null",
    '[style.--sn-tree-level]': 'level() - 1',
    '(focus)': 'tree.focused(this)',
  },
  template: `
    <!-- Mouse only: the keyboard is handled on the treeitem host (Enter, Space, ← →), as in the ARIA tree pattern. -->
    <!-- eslint-disable-next-line @angular-eslint/template/click-events-have-key-events, @angular-eslint/template/interactive-supports-focus -->
    <div class="row" (mousedown)="onMouseDown($event)" (click)="tree.click(this, $event)" (dblclick)="onDoubleClick()">
      <!-- eslint-disable-next-line @angular-eslint/template/click-events-have-key-events, @angular-eslint/template/interactive-supports-focus -->
      <span class="expander" (click)="onExpanderClick($event)" (dblclick)="$event.stopPropagation()">
        @if (hasChildren()) {
          @if (tree.triangle()) {
            <svg viewBox="0 0 16 16" aria-hidden="true"><path class="fill" d="M6 4.5v7l5-3.5z" /></svg>
          } @else {
            <svg viewBox="0 0 16 16" aria-hidden="true"><path d="M6 4l4 4-4 4" /></svg>
          }
        }
      </span>
      @if (icon()) {
        <ng-icon class="icon" [name]="icon()" aria-hidden="true" />
      }
      <span class="label">{{ label() }}</span>
      <ng-content select="[snTreeItemEnd]" />
    </div>
    <div role="group" class="children" [hidden]="!expanded()">
      <ng-content />
    </div>
  `,
  styleUrl: './tree.scss',
})
export class SnTreeItem<K = unknown> {
  /** The key this item stands for; unique in the tree. Declared optional because the tree reads its items while Angular is still binding them. */
  readonly value = input<K>(undefined as K);
  readonly label = input.required<string>();
  readonly icon = input('');
  /** Open, showing its children. Two-way bindable. */
  readonly expanded = model(false);
  /** Show the expander even without children (they load when it opens). */
  readonly expandable = input(false);

  readonly element = inject<ElementRef<HTMLElement>>(ElementRef).nativeElement;
  protected readonly tree = inject<SnTree<K>>(SnTree);
  /** The item this one is nested in; null at the top level. */
  readonly parent = inject<SnTreeItem<K>>(SnTreeItem, { optional: true, skipSelf: true });

  readonly level: () => number = computed(() => (this.parent ? this.parent.level() + 1 : 1));
  readonly children = computed(() => this.tree.childrenOf(this));
  readonly hasChildren = computed(() => this.expandable() || this.children().length > 0);
  readonly selected = computed(() => this.tree.isSelected(this.value()));
  /** Every ancestor is open. */
  readonly isVisible: () => boolean = computed(
    () => !this.parent || (this.parent.expanded() && this.parent.isVisible()),
  );

  constructor() {
    this.tree.register(this);
    inject(DestroyRef).onDestroy(() => this.tree.unregister(this));
  }

  /** Every item nested below this one, at any depth. */
  descendants(): SnTreeItem<K>[] {
    return this.children().flatMap((c) => [c, ...c.descendants()]);
  }

  setExpanded(open: boolean): void {
    if (this.expanded() === open) return;
    this.expanded.set(open);
    if (!open) this.tree.collapsed(this);
  }

  protected onMouseDown(event: MouseEvent): void {
    // Shift-click must extend the selection, not select text
    if (event.shiftKey) event.preventDefault();
  }

  protected onExpanderClick(event: MouseEvent): void {
    if (!this.hasChildren()) return;
    event.stopPropagation();
    this.setExpanded(!this.expanded());
    this.element.focus();
  }

  protected onDoubleClick(): void {
    if (this.hasChildren()) this.setExpanded(!this.expanded());
    else this.tree.activate(this);
  }
}

export const SnTreeImports = [SnTree, SnTreeItem] as const;
