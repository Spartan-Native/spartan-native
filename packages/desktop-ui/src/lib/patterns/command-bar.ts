import { FocusKeyManager, type FocusableOption } from '@angular/cdk/a11y';
import { Directionality } from '@angular/cdk/bidi';
import { CdkMenuTrigger } from '@angular/cdk/menu';
import type { ConnectedPosition } from '@angular/cdk/overlay';
import { NgTemplateOutlet } from '@angular/common';
import {
  afterRenderEffect,
  booleanAttribute,
  ChangeDetectionStrategy,
  Component,
  computed,
  contentChild,
  DestroyRef,
  Directive,
  effect,
  ElementRef,
  inject,
  InjectionToken,
  Injector,
  input,
  isDevMode,
  numberAttribute,
  signal,
  TemplateRef,
  untracked,
  viewChild,
} from '@angular/core';
import { NgIcon } from '@ng-icons/core';
import { injectPlatformFamily, injectSkin, skinFamily, type Skin } from '@spartan-native/theme';
import { SnTooltip } from '../controls/tooltip';
import type { SnMenuItem } from '../menubar/menu-model';
import { SnMenuTemplates } from '../menubar/menu-templates';

/** How each skin lays out its command surface. */
interface CommandBarLayout {
  /** The label shows next to (or under) the icon; otherwise commands are icon-only. */
  readonly labels: boolean;
  /** Where the title sits when `titlePosition` is `auto`. */
  readonly title: 'start' | 'center';
  /** The commands come before the title (GNOME's header bar). */
  readonly commandsFirst: boolean;
  /** The overflow button: `…` (Windows, macOS), a hamburger (GNOME, KDE) or `⋮` (ChromeOS). */
  readonly overflowGlyph: 'dots' | 'menu' | 'vertical';
}

const LAYOUT: Record<Skin, CommandBarLayout> = {
  win: { labels: true, title: 'start', commandsFirst: false, overflowGlyph: 'dots' },
  w10: { labels: true, title: 'start', commandsFirst: false, overflowGlyph: 'dots' },
  mac: { labels: false, title: 'start', commandsFirst: false, overflowGlyph: 'dots' },
  macc: { labels: false, title: 'start', commandsFirst: false, overflowGlyph: 'dots' },
  gtk: { labels: false, title: 'center', commandsFirst: true, overflowGlyph: 'menu' },
  qt: { labels: true, title: 'start', commandsFirst: false, overflowGlyph: 'menu' },
  cros: { labels: false, title: 'start', commandsFirst: false, overflowGlyph: 'vertical' },
  web: { labels: false, title: 'center', commandsFirst: true, overflowGlyph: 'menu' },
};

/** Where the title sits: the skin's own place, or forced to the start or the center. */
export type SnCommandBarTitlePosition = 'auto' | 'start' | 'center';

/**
 * What the bar does when it is too narrow: `auto` first drops the labels (on skins that show
 * them), then moves commands into the overflow menu, lowest `priority` first; `none` does neither.
 */
export type SnCommandBarCollapse = 'auto' | 'none';

/** @internal How a command reaches its bar: through DI, also from a template rendered by `[commands]`. */
const SN_COMMAND_BAR = new InjectionToken<SnCommandBar>('SnCommandBar');

/**
 * The secondary commands as your own menu, shown by the bar's overflow button (Windows `…`,
 * macOS `…`, GNOME/KDE menu button, ChromeOS `⋮`). Put a stock menu inside, e.g. hlmDropdownMenu:
 *
 * ```html
 * <ng-template snCommandOverflow>
 *   <div hlmDropdownMenu>
 *     <button hlmDropdownMenuItem>Rename</button>
 *   </div>
 * </ng-template>
 * ```
 *
 * It is used while the bar has nothing of its own to put in the menu. Once commands collapse
 * into the overflow (or are `secondary`, or `overflowItems` is set), the bar draws the menu
 * itself: prefer `secondary` commands and `overflowItems` with a collapsing bar.
 */
@Directive({ selector: 'ng-template[snCommandOverflow]' })
export class SnCommandOverflow {
  readonly template = inject(TemplateRef);
}

/**
 * A group of commands that belong together: on macOS 26 each group is its own Liquid Glass
 * capsule, elsewhere groups are divided by a separator (Windows, GNOME, KDE) or a gap (ChromeOS).
 *
 * ```html
 * <sn-command-group label="History">
 *   <button snCommand icon="lucideUndo2" label="Undo"></button>
 *   <button snCommand icon="lucideRedo2" label="Redo"></button>
 * </sn-command-group>
 * ```
 */
@Component({
  selector: 'sn-command-group',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    'data-slot': 'sn-command-group',
    role: 'group',
    '[attr.aria-label]': 'label() || null',
  },
  template: '<ng-content />',
})
export class SnCommandGroup {
  /** Accessible name of the group. */
  readonly label = input('');
}

/**
 * One command in an `<sn-command-bar>`: an icon and a label.
 * The label is visible on Windows and KDE; on macOS, GNOME and ChromeOS the command is
 * icon-only, the label stays as its accessible name and shows as the skin's tooltip.
 * Without `icon`, project your own `<svg>`/`<ng-icon>`, or none (then the label always shows).
 *
 * When the bar runs out of room, commands move into its overflow menu, lowest `priority` first.
 * `secondary` commands always live there.
 */
@Component({
  // eslint-disable-next-line @angular-eslint/component-selector -- an attribute on a real <button>, so it keeps native button behavior
  selector: 'button[snCommand]',
  imports: [NgIcon],
  hostDirectives: [SnTooltip],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    'data-slot': 'sn-command',
    type: 'button',
    '[attr.tabindex]': 'tabbable() ? 0 : -1',
    '[disabled]': 'isDisabled()',
    '[attr.data-icon-only]': 'iconOnly() ? "" : null',
    '[attr.data-variant]': 'variant() === "accent" ? "accent" : null',
  },
  template: `
    @if (icon()) {
      <ng-icon [name]="icon()" aria-hidden="true" />
    }
    <ng-content />
    <span class="label">{{ label() }}</span>
  `,
})
export class SnCommand implements FocusableOption {
  readonly icon = input('');
  readonly label = input.required<string>();
  // eslint-disable-next-line @angular-eslint/no-input-rename -- the `disabled` getter below is FocusableOption's, so the input needs another name
  readonly isDisabled = input(false, { alias: 'disabled', transform: booleanAttribute });
  /** Show only the icon on every OS (the label stays as accessible name and tooltip). */
  readonly hideLabel = input(false, { transform: booleanAttribute });
  /** `accent`: the window's main action, filled with the accent color (Fluent accent, macOS prominent). */
  readonly variant = input<'default' | 'accent'>('default');
  /** Commands with a lower priority move into the overflow menu first. Default: 0. */
  readonly priority = input(0, { transform: numberAttribute });
  /** Always in the overflow menu, never in the bar (WinUI secondary commands). */
  readonly secondary = input(false, { transform: booleanAttribute });

  /** Set by the bar: the one command in the tab order (roving tabindex). */
  readonly tabbable = signal(true);
  /** Set by the bar: in the overflow menu instead of the bar. */
  readonly collapsed = signal(false);

  readonly element = inject<ElementRef<HTMLButtonElement>>(ElementRef).nativeElement;
  private readonly bar = inject(SN_COMMAND_BAR, { optional: true });
  protected readonly iconOnly = computed(() => this.hideLabel() || !!this.bar?.iconOnly() || !!this.bar?.compact());

  constructor() {
    const tooltip = inject(SnTooltip, { self: true });
    effect(() => tooltip.text.set(this.iconOnly() ? this.label() : ''));
    if (this.bar) {
      this.bar.register(this);
      inject(DestroyRef).onDestroy(() => this.bar!.unregister(this));
    }
  }

  /** For the key manager: collapsed commands are skipped like disabled ones. */
  get disabled(): boolean {
    return this.isDisabled() || this.collapsed();
  }

  focus(): void {
    this.element.focus();
  }

  /** @internal Moves the command into (or out of) the overflow menu, right away in the DOM so the bar can measure. */
  setCollapsed(collapsed: boolean): void {
    this.element.toggleAttribute('data-collapsed', collapsed);
    this.collapsed.set(collapsed);
  }
}

/**
 * The window's command surface, with the same markup on every OS:
 *  - Windows 11: a CommandBar, title left, commands right with the label beside the icon, `…` overflow
 *  - Windows 10: the same, labels under the icons, square
 *  - macOS 26: a unified toolbar, title left, icon-only commands in Liquid Glass capsules (macOS 13–15: plain bezels)
 *  - GNOME: an AdwHeaderBar, commands at the start, title centered, menu button at the end
 *  - KDE: a KToolBar, title then commands with text beside the icon, menu button at the end
 *  - ChromeOS: an M3 top app bar, title left, round icon actions right, `⋮` overflow
 *
 * The title is a heading (`headingLevel`, default 1) and goes where the skin puts it, or where
 * `titlePosition` says. A centered title stays centered while it fits and moves aside instead
 * of running under the commands.
 *
 * The commands form one `role="toolbar"`: Tab enters it once, ← → Home End move between
 * commands (disabled ones are skipped), ↓ or Enter on the overflow button opens its menu.
 * When the bar is too narrow, labels drop first (Windows, KDE), then commands move into the
 * overflow menu by `priority`.
 *
 * ```html
 * <sn-command-bar title="Documents">
 *   <button snCommand icon="lucidePlus" label="New" variant="accent" (click)="create()"></button>
 *   <sn-command-group label="Selection">
 *     <button snCommand icon="lucideShare2" label="Share" priority="1"></button>
 *     <button snCommand icon="lucideTrash2" label="Delete" [disabled]="!selection()"></button>
 *   </sn-command-group>
 *   <button snCommand icon="lucidePencil" label="Rename" secondary></button>
 * </sn-command-bar>
 * ```
 *
 * Commands declared elsewhere (a page's commands shown by the shell's bar): pass them as a
 * template, `<sn-command-bar [commands]="page.commands()">`. Commands in it work exactly like
 * projected ones.
 *
 * Extra content: `[snCommandBarStart]` (e.g. a back button, or the window controls when the
 * bar is the title bar) and `[snCommandBarEnd]` (e.g. a search field). It carries `sn-chrome`,
 * so the theme dims it when the window is inactive.
 */
@Component({
  selector: 'sn-command-bar',
  imports: [CdkMenuTrigger, NgTemplateOutlet, SnCommand, SnMenuTemplates],
  providers: [{ provide: SN_COMMAND_BAR, useExisting: SnCommandBar }],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    'data-slot': 'sn-command-bar',
    class: 'sn-chrome',
    // `title` is an input here, not a tooltip for the whole bar
    '[attr.title]': 'null',
    '[attr.data-family]': 'family()',
    '[attr.data-skin]': 'skin()',
    '[attr.data-title]': 'resolvedTitlePosition()',
    '(keydown)': 'onKeydown($event)',
    '(focusin)': 'onFocusin($event)',
  },
  template: `
    <div class="lead">
      <ng-content select="[snCommandBarStart]" />
      @if (commandsLead()) {
        <ng-container [ngTemplateOutlet]="toolbar" />
      }
    </div>
    @if (title()) {
      <span
        #titleEl
        class="title"
        [attr.role]="headingLevel() ? 'heading' : null"
        [attr.aria-level]="headingLevel() || null"
        >{{ title() }}</span
      >
    }
    <div class="trail">
      <div class="cluster">
        @if (!commandsLead()) {
          <ng-container [ngTemplateOutlet]="toolbar" />
        }
        <button
          snCommand
          hideLabel
          class="more"
          [label]="overflowLabel()"
          [cdkMenuTriggerFor]="menuItems().length ? menus.menu() : (overflow()?.template ?? null)"
          [cdkMenuTriggerData]="{ $implicit: menuItems() }"
          [cdkMenuPosition]="menuPosition"
        >
          @switch (moreGlyph()) {
            @case ('menu') {
              <svg viewBox="0 0 16 16" aria-hidden="true"><path d="M2.5 4h11M2.5 8h11M2.5 12h11" /></svg>
            }
            @case ('vertical') {
              <svg viewBox="0 0 16 16" aria-hidden="true">
                <circle cx="8" cy="3" r="1.4" />
                <circle cx="8" cy="8" r="1.4" />
                <circle cx="8" cy="13" r="1.4" />
              </svg>
            }
            @default {
              <svg viewBox="0 0 16 16" aria-hidden="true">
                <circle cx="3" cy="8" r="1.3" />
                <circle cx="8" cy="8" r="1.3" />
                <circle cx="13" cy="8" r="1.3" />
              </svg>
            }
          }
        </button>
      </div>
      <ng-content select="[snCommandBarEnd]" />
    </div>
    <ng-template #toolbar>
      <div class="commands" role="toolbar" [attr.aria-label]="ariaLabel() || title() || null">
        <ng-content />
        @if (commands(); as extra) {
          <ng-container [ngTemplateOutlet]="extra" [ngTemplateOutletInjector]="commandInjector" />
        }
      </div>
    </ng-template>
    <sn-menu-templates #menus [family]="platform()" />
  `,
  styleUrl: './command-bar.scss',
})
export class SnCommandBar {
  readonly title = input('');
  /** Where the title goes. `auto`: the skin's place (centered on GNOME, at the start elsewhere). */
  readonly titlePosition = input<SnCommandBarTitlePosition>('auto');
  /** The title's heading level (`role="heading"`). 0: not a heading. Default: 1. */
  readonly headingLevel = input(1, { transform: numberAttribute });
  /** Accessible name of the toolbar; defaults to `title`. */
  readonly ariaLabel = input('');
  /** Accessible name and tooltip of the overflow button. */
  readonly overflowLabel = input('More options');
  /** Commands declared somewhere else, e.g. by the current page. Rendered after the projected ones. */
  readonly commands = input<TemplateRef<unknown> | null>(null);
  /** More entries for the overflow menu, after the collapsed and secondary commands. */
  readonly overflowItems = input<readonly SnMenuItem[]>([]);
  /** What happens when the bar is too narrow. Default: `auto`. */
  readonly collapse = input<SnCommandBarCollapse>('auto');

  protected readonly skin = injectSkin();
  protected readonly family = computed(() => skinFamily(this.skin()));
  /** The real OS: how shortcuts in the overflow menu are written. */
  protected readonly platform = injectPlatformFamily();
  private readonly layout = computed(() => LAYOUT[this.skin()]);
  /** macOS, GNOME, ChromeOS: commands show only their icon. */
  readonly iconOnly = computed(() => !this.layout().labels);
  /** The bar dropped the labels to make room. */
  readonly compact = signal(false);
  protected readonly resolvedTitlePosition = computed<'start' | 'center'>(() => {
    const position = this.titlePosition();
    return position === 'auto' ? this.layout().title : position;
  });
  /** GNOME puts the commands at the start of the header bar, before the title. */
  protected readonly commandsLead = computed(() => this.layout().commandsFirst);
  protected readonly moreGlyph = computed(() => this.layout().overflowGlyph);

  protected readonly overflow = contentChild(SnCommandOverflow);
  protected readonly menuPosition: ConnectedPosition[] = [
    { originX: 'end', originY: 'bottom', overlayX: 'end', overlayY: 'top', offsetY: 4 },
    { originX: 'end', originY: 'top', overlayX: 'end', overlayY: 'bottom', offsetY: -4 },
  ];
  protected readonly commandInjector = Injector.create({
    providers: [{ provide: SN_COMMAND_BAR, useValue: this }],
    parent: inject(Injector),
  });

  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef).nativeElement;
  private readonly titleEl = viewChild<ElementRef<HTMLElement>>('titleEl');
  private readonly more = viewChild.required(SnCommand);
  private readonly registered = signal<readonly SnCommand[]>([]);
  /** The commands in document order (projected, grouped, and from `[commands]`). */
  private readonly ordered = signal<readonly SnCommand[]>([]);
  /** The commands currently in the overflow menu, in document order. */
  private readonly collapsedCommands = signal<readonly SnCommand[]>([]);

  /** The overflow menu the bar draws: collapsed and secondary commands, then `overflowItems`. */
  protected readonly menuItems = computed<SnMenuItem[]>(() => {
    const commands: SnMenuItem[] = this.collapsedCommands().map((c) => ({
      label: c.label(),
      enabled: !c.isDisabled(),
      action: () => c.element.click(),
    }));
    const extra = this.overflowItems();
    return commands.length && extra.length ? [...commands, { type: 'separator' }, ...extra] : [...commands, ...extra];
  });

  /** Every command in document order, the overflow button included (it is a command too). */
  private readonly items = this.ordered;
  /** The view exists (fit() measures it). */
  private rendered = false;
  /** Bumped after each fit: which commands are hidden changed. */
  private readonly fitted = signal(0);
  private readonly active = signal<SnCommand | null>(null);
  private readonly keys = new FocusKeyManager(this.items, inject(Injector))
    .withHorizontalOrientation(inject(Directionality, { optional: true })?.value ?? 'ltr')
    .withVerticalOrientation(false)
    .withHomeAndEnd()
    .withWrap();

  constructor() {
    this.keys.change.subscribe(() => this.active.set(this.keys.activeItem));
    // roving tabindex: the last focused command, or the first enabled one, is the tab stop
    effect(() => {
      const items = this.items();
      const active = this.active();
      this.fitted();
      const visible = (i: SnCommand) => !i.disabled && !i.element.hidden;
      const stop = active && items.includes(active) && visible(active) ? active : items.find(visible);
      for (const item of items) item.tabbable.set(item === stop);
    });
    // keep the commands in document order, whichever template they came from
    afterRenderEffect(() => {
      const list = this.registered();
      const sorted = [...list].sort((a, b) =>
        a.element.compareDocumentPosition(b.element) & Node.DOCUMENT_POSITION_FOLLOWING ? -1 : 1,
      );
      const current = untracked(this.ordered);
      if (sorted.length !== current.length || sorted.some((c, i) => c !== current[i])) this.ordered.set(sorted);
    });
    // fit the bar whenever something that changes its width does
    afterRenderEffect(() => {
      this.ordered();
      this.title();
      this.skin();
      this.collapse();
      this.overflowItems();
      this.overflow();
      for (const c of this.ordered()) {
        if (c === untracked(this.more)) continue;
        c.label();
        c.priority();
        c.secondary();
        c.icon();
      }
      untracked(() => {
        this.rendered = true;
        this.fit();
      });
    });
    if (typeof ResizeObserver !== 'undefined') {
      let width = -1;
      const observer = new ResizeObserver(([entry]) => {
        const next = Math.round(entry.contentRect.width);
        if (next === width) return;
        width = next;
        this.fit();
      });
      observer.observe(this.host);
      inject(DestroyRef).onDestroy(() => observer.disconnect());
    }
    // Text gets wider when a web font arrives, without the bar changing size: fit again then.
    const fonts = this.host.ownerDocument.fonts as FontFaceSet | undefined;
    if (fonts?.addEventListener) {
      const refit = () => this.fit();
      void fonts.ready.then(refit);
      fonts.addEventListener('loadingdone', refit);
      inject(DestroyRef).onDestroy(() => fonts.removeEventListener('loadingdone', refit));
    }
    inject(DestroyRef).onDestroy(() => (this.rendered = false));
  }

  /** @internal */
  register(command: SnCommand): void {
    this.registered.update((list) => [...list, command]);
  }

  /** @internal */
  unregister(command: SnCommand): void {
    this.registered.update((list) => list.filter((c) => c !== command));
  }

  /**
   * Makes the commands fit: shows them all, then, while the bar overflows or the title is cut,
   * drops the labels (labelled skins), then collapses commands into the overflow menu, lowest
   * priority first (the later one first on a tie). Works on the DOM directly, so every step is
   * measured before the next.
   */
  private fit(): void {
    if (!this.rendered) return; // before the first render, or destroyed
    const moreCommand = this.more();
    const more = moreCommand.element;
    const commands = this.ordered().filter((c) => c !== moreCommand);
    const title = this.titleEl()?.nativeElement;
    const auto = this.collapse() === 'auto';

    for (const c of commands) c.setCollapsed(c.secondary());
    this.host.removeAttribute('data-compact');
    let compact = false;
    const showMore = () => {
      const collapsed = commands.some((c) => c.collapsed());
      more.hidden = !(collapsed || this.overflowItems().length || this.overflow());
    };
    showMore();

    const overflowing = () =>
      this.host.scrollWidth > this.host.clientWidth + 1 || (!!title && title.scrollWidth > title.clientWidth + 1);

    if (auto && overflowing()) {
      if (!this.iconOnly() && commands.some((c) => c.icon() || c.element.querySelector('svg, ng-icon, img'))) {
        compact = true;
        this.host.setAttribute('data-compact', '');
      }
      const queue = commands
        .map((command, index) => ({ command, index }))
        .filter(({ command }) => !command.secondary())
        .sort((a, b) => a.command.priority() - b.command.priority() || b.index - a.index);
      for (const { command } of queue) {
        if (!overflowing()) break;
        command.setCollapsed(true);
        showMore();
      }
    }

    this.compact.set(compact);
    this.fitted.update((n) => n + 1);
    this.collapsedCommands.set(commands.filter((c) => c.collapsed()));
    if (isDevMode() && this.overflow() && this.menuItems().length) {
      console.warn(
        'sn-command-bar: commands are in the overflow menu, so the snCommandOverflow template is not shown. Use secondary commands or overflowItems instead.',
      );
    }
  }

  protected onKeydown(event: KeyboardEvent): void {
    if (!this.items().some((i) => i.element === event.target)) return;
    this.keys.onKeydown(event);
  }

  protected onFocusin(event: FocusEvent): void {
    const item = this.items().find((i) => i.element === event.target);
    if (item) {
      this.keys.updateActiveItem(item);
      this.active.set(item);
    }
  }
}

export const SnCommandBarImports = [SnCommandBar, SnCommand, SnCommandGroup, SnCommandOverflow] as const;
