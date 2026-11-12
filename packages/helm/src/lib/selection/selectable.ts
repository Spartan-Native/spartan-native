import { DOCUMENT } from '@angular/common';
import {
  computed,
  contentChildren,
  Directive,
  effect,
  ElementRef,
  forwardRef,
  inject,
  InjectionToken,
  input,
  model,
  output,
  signal,
  untracked,
} from '@angular/core';
import { injectSkin } from '@spartan-native/theme';
import {
  selectionAll,
  selectionClear,
  selectionClick,
  selectionMoveBy,
  selectionMoveTo,
  selectionSync,
  selectionToggleActive,
  type SelectionModifiers,
  type SelectionState,
  typeaheadIndex,
} from './selection-model';

/** listbox: a list of options · grid: table rows */
export type SelectableRole = 'listbox' | 'grid';

const PAGE = 10;
const TYPEAHEAD_RESET_MS = 600;
let nextId = 0;

interface SelectableParent<K> {
  readonly role: () => SelectableRole;
  isSelected(key: K): boolean;
  isActive(key: K): boolean;
  click(key: K, event: MouseEvent): void;
  activate(key: K): void;
}

const SN_SELECTABLE = new InjectionToken<SelectableParent<unknown>>('SN_SELECTABLE');

/**
 * One selectable row: an option in a list, or a `<tr>` in a table.
 *
 * ```html
 * <div snSelectableItem [value]="file.id">{{ file.name }}</div>
 * ```
 */
@Directive({
  selector: '[snSelectableItem]',
  exportAs: 'snSelectableItem',
  host: {
    'data-slot': 'sn-selectable-item',
    '[id]': 'id',
    '[attr.role]': "parent.role() === 'grid' ? 'row' : 'option'",
    '[attr.aria-selected]': 'selected()',
    '[attr.data-selected]': "selected() ? '' : null",
    '[attr.data-active]': "active() ? '' : null",
    '(mousedown)': 'onMouseDown($event)',
    '(click)': 'parent.click(value(), $event)',
    '(dblclick)': 'parent.activate(value())',
  },
})
export class SnSelectableItem<K = unknown> {
  protected readonly parent = inject(SN_SELECTABLE) as SelectableParent<K>;
  readonly element = inject<ElementRef<HTMLElement>>(ElementRef).nativeElement;

  /**
   * The key this row stands for (required in practice). Declared optional because the
   * list reads its rows while Angular is still binding them.
   */
  readonly value = input<K>(undefined as K);
  /** Text used for type-ahead; defaults to the row's text. */
  readonly label = input<string | undefined>(undefined, { alias: 'snSelectableLabel' });

  readonly id = `sn-selectable-item-${nextId++}`;
  readonly selected = computed(() => this.parent.isSelected(this.value()));
  readonly active = computed(() => this.parent.isActive(this.value()));

  typeaheadLabel(): string {
    return (this.label() ?? this.element.textContent ?? '').trim();
  }

  protected onMouseDown(event: MouseEvent): void {
    // Shift-click must extend the selection, not select text
    if (event.shiftKey) event.preventDefault();
  }
}

/**
 * A list or table with the desktop selection model.
 *
 * ```html
 * <div snSelectable [(selection)]="selected" (activated)="open($event)">
 *   @for (f of files; track f.id) {
 *     <div snSelectableItem [value]="f.id">{{ f.name }}</div>
 *   }
 * </div>
 *
 * <table hlmTable snSelectable="grid" [(selection)]="selected">…<tr hlmTr snSelectableItem [value]="row.id">…</table>
 * ```
 *
 * Mouse: click, Ctrl/⌘-click, Shift-click, double-click to activate.
 * Keyboard: ↑ ↓ Home End PageUp PageDown (Shift extends, Ctrl moves focus only),
 * Space (Ctrl+Space toggles), Ctrl/⌘+A, Esc clears, Enter activates, type-ahead.
 * On macOS ⌘ replaces Ctrl, and ⌘↑ / ⌘↓ jump to the first / last row.
 */
@Directive({
  selector: '[snSelectable]',
  exportAs: 'snSelectable',
  providers: [{ provide: SN_SELECTABLE, useExisting: forwardRef(() => SnSelectable) }],
  host: {
    'data-slot': 'sn-selectable',
    tabindex: '0',
    '[attr.role]': 'role()',
    '[attr.aria-multiselectable]': 'multiple()',
    '[attr.aria-activedescendant]': 'activeId()',
    '(keydown)': 'onKeydown($event)',
    '(focus)': 'onFocus()',
  },
})
export class SnSelectable<K = unknown> implements SelectableParent<K> {
  private readonly doc = inject(DOCUMENT);
  private readonly skin = injectSkin();

  /** `snSelectable` or `snSelectable="listbox"` for lists, `snSelectable="grid"` for tables. */
  readonly role = input<SelectableRole, SelectableRole | ''>('listbox', {
    alias: 'snSelectable',
    transform: (v) => (v === 'grid' ? 'grid' : 'listbox'),
  });
  /** Allow more than one selected row. */
  readonly multiple = input(true);
  /** The selected keys, in row order. Two-way bindable. */
  readonly selection = model<readonly K[]>([]);
  /** Enter or double-click on a row. */
  readonly activated = output<K>();

  private readonly items = contentChildren<SnSelectableItem<K>>(SnSelectableItem, { descendants: true });
  private readonly keys = computed(() => this.items().map((i) => i.value()));
  private readonly cursor = signal<Omit<SelectionState<K>, 'selected'>>({ anchor: null, active: null });
  private readonly selectedSet = computed(() => new Set(this.selection()));

  protected readonly activeId = computed(() => {
    const active = this.cursor().active;
    return this.items().find((i) => i.value() === active)?.id ?? null;
  });

  private typeahead = '';
  private typeaheadTimer: ReturnType<typeof setTimeout> | undefined;

  constructor() {
    // Rows removed: drop them from the selection and the cursor.
    // Not while a row's value isn't bound yet: on first render the rows exist before their `value`
    // inputs are set (keys read [null, null, …]), and syncing then would wipe an initial selection
    // such as `[selection]="['f1']"`.
    effect(() => {
      const keys = this.keys();
      if (keys.some((k) => k == null)) return;
      untracked(() => {
        const synced = selectionSync(this.state(), keys);
        if (synced.selected.length !== this.selection().length) this.selection.set(synced.selected);
        this.cursor.set({ anchor: synced.anchor, active: synced.active });
      });
    });
    // Keep the active row in view
    effect(() => {
      const id = this.activeId();
      if (id) untracked(() => this.doc.getElementById(id)?.scrollIntoView?.({ block: 'nearest' }));
    });
  }

  // --- SelectableParent ------------------------------------------------------
  isSelected(key: K): boolean {
    return this.selectedSet().has(key);
  }

  isActive(key: K): boolean {
    return this.cursor().active === key;
  }

  click(key: K, event: MouseEvent): void {
    this.apply(selectionClick(this.state(), this.keys(), key, this.modifiers(event), this.multiple()));
  }

  activate(key: K): void {
    this.activated.emit(key);
  }

  // --- Keyboard --------------------------------------------------------------
  protected onFocus(): void {
    if (this.cursor().active === null) {
      const first = this.selection()[0] ?? this.keys()[0] ?? null;
      this.cursor.update((c) => ({ ...c, active: first }));
    }
  }

  protected onKeydown(event: KeyboardEvent): void {
    // Keys typed into an input, textarea, select or contenteditable inside a row belong to that field
    if (isEditable(event.target, event.currentTarget)) return;
    const keys = this.keys();
    const mods = this.modifiers(event);
    const multiple = this.multiple();
    const state = this.state();
    const mac = this.isMac();
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
      case ' ':
        if (this.typeahead) return this.onTypeahead(event); // a space inside a type-ahead word
        next = selectionToggleActive(state, keys, mods, multiple);
        break;
      case 'Enter':
        if (state.active !== null) {
          event.preventDefault();
          this.activated.emit(state.active);
        }
        return;
      case 'Escape':
        if (state.selected.length === 0) return; // let dialogs handle it
        next = selectionClear(state);
        break;
      default:
        if (mods.toggle && event.key.toLowerCase() === 'a') {
          next = selectionAll(state, keys, multiple);
          break;
        }
        return this.onTypeahead(event);
    }
    event.preventDefault();
    this.apply(next);
  }

  private onTypeahead(event: KeyboardEvent): void {
    if (event.key.length !== 1 || event.ctrlKey || event.metaKey || event.altKey) return;
    event.preventDefault();
    clearTimeout(this.typeaheadTimer);
    this.typeahead += event.key;
    this.typeaheadTimer = setTimeout(() => (this.typeahead = ''), TYPEAHEAD_RESET_MS);

    const items = this.items();
    const current = items.findIndex((i) => i.value() === this.cursor().active);
    const index = typeaheadIndex(
      items.map((i) => i.typeaheadLabel()),
      this.typeahead,
      current,
    );
    if (index >= 0) this.apply(selectionMoveTo(this.state(), this.keys(), index, {}, this.multiple()));
  }

  // --- Helpers ---------------------------------------------------------------
  private state(): SelectionState<K> {
    return { selected: this.selection(), ...this.cursor() };
  }

  private apply(next: SelectionState<K>): void {
    this.cursor.set({ anchor: next.anchor, active: next.active });
    const prev = this.selection();
    if (prev.length !== next.selected.length || prev.some((k, i) => k !== next.selected[i])) {
      this.selection.set(next.selected);
    }
  }

  /** ⌘ toggles on macOS, Ctrl everywhere else (Ctrl-click is the context menu on macOS). */
  private modifiers(event: MouseEvent | KeyboardEvent): SelectionModifiers {
    return { range: event.shiftKey, toggle: this.isMac() ? event.metaKey : event.ctrlKey };
  }

  private isMac(): boolean {
    const skin = this.skin();
    return skin === 'mac' || skin === 'macc';
  }
}

/** True when `target` is an input, textarea, select or contenteditable other than the list itself. */
function isEditable(target: EventTarget | null, host: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement) || target === host) return false;
  return (
    target.isContentEditable ||
    target instanceof HTMLInputElement ||
    target instanceof HTMLTextAreaElement ||
    target instanceof HTMLSelectElement
  );
}

export const SnSelectableImports = [SnSelectable, SnSelectableItem] as const;
