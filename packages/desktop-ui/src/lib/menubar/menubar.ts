import { CdkMenuBar, CdkMenuItem, CdkMenuTrigger } from '@angular/cdk/menu';
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  DestroyRef,
  effect,
  ElementRef,
  inject,
  input,
  untracked,
  viewChild,
} from '@angular/core';
import { injectSkin, skinFamily, SpartanNativeTheme } from '@spartan-native/theme';
import { inPageMenu, itemsWithAccelerators, matchesAccelerator, type SnMenuItem } from './menu-model';
import { SnMenuTemplates } from './menu-templates';
import { SnNativeMenus } from './native-menus';

/** auto: native on macOS when the host can · always: native whenever the host can · never: in the page */
export type SnMenubarNative = 'auto' | 'always' | 'never';

/**
 * The application menu, from one menu definition:
 *  - macOS with a host that has native menus (Wails): the global menu bar at the top of the
 *    screen. Nothing is drawn in the window, and the OS handles the shortcuts.
 *  - Everywhere else (Windows, Linux, ChromeOS, and macOS in a browser): an in-window menu bar,
 *    drawn by the skin's menubar and menu styles, with the shortcuts bound in the page.
 *
 * Roles become the OS's own items natively (`appMenu`, `editMenu`, `windowMenu`, `quit`, …); in
 * the page `editMenu` and `windowMenu` become Edit and Window menus that act on the focused field
 * and the host's window, and the macOS-only roles are left out.
 *
 * ```ts
 * readonly menu = computed<SnMenuItem[]>(() => [
 *   { role: 'appMenu' },
 *   { label: 'File', submenu: [
 *     { label: 'New backup…', accelerator: 'mod+n', action: () => this.create() },
 *     { label: 'Pause backups', type: 'checkbox', checked: this.paused(), action: () => this.togglePause() },
 *     { type: 'separator' },
 *     { role: 'close' },
 *   ]},
 *   { role: 'editMenu' },
 *   { role: 'windowMenu' },
 * ]);
 * ```
 * ```html
 * <sn-menubar [menu]="menu()" />
 * ```
 *
 * Pass a new array to update it (a `computed` is the easy way): the native menu is sent again.
 * In the page: F10 focuses the bar (Windows, Linux), ← → move between menus, ↓ or Enter opens one.
 */
@Component({
  selector: 'sn-menubar',
  imports: [CdkMenuBar, CdkMenuItem, CdkMenuTrigger, SnMenuTemplates],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    'data-slot': 'sn-menubar',
    class: 'sn-chrome',
    '[attr.data-family]': 'family()',
    '[attr.data-skin]': 'skin()',
    '[attr.data-native]': "isNative() ? '' : null",
    '(document:keydown)': 'onDocumentKeydown($event)',
    '(document:focusin)': 'onDocumentFocusin($event)',
  },
  template: `
    @if (!isNative()) {
      <div cdkMenuBar data-slot="menubar" class="bar" [attr.aria-label]="ariaLabel()">
        @for (item of pageMenu(); track $index) {
          @if (item.submenu) {
            <button
              type="button"
              cdkMenuItem
              data-slot="menubar-trigger"
              class="trigger"
              [cdkMenuTriggerFor]="templates.menu()"
              [cdkMenuTriggerData]="{ $implicit: item.submenu }"
              [cdkMenuItemDisabled]="item.enabled === false"
            >
              {{ item.label }}
            </button>
          } @else if (item.type !== 'separator') {
            <button
              type="button"
              cdkMenuItem
              data-slot="menubar-trigger"
              class="trigger"
              [cdkMenuItemDisabled]="item.enabled === false"
              (cdkMenuItemTriggered)="item.action?.()"
            >
              {{ item.label }}
            </button>
          }
        }
      </div>
    }
    <sn-menu-templates #templates [family]="family()" [beforeRun]="restoreFocus" />
  `,
  styleUrl: './menubar.scss',
})
export class SnMenubar {
  /** The menus: top-level items with a `submenu` (or a role such as `editMenu`). */
  readonly menu = input.required<readonly SnMenuItem[]>();
  /** When to use the host's native menu bar. Default: `auto` (macOS only). */
  readonly native = input<SnMenubarNative>('auto');
  /** Accessible name of the in-page bar. */
  readonly ariaLabel = input('Application menu');

  protected readonly skin = injectSkin();
  protected readonly family = computed(() => skinFamily(this.skin()));
  private readonly menus = inject(SnNativeMenus);
  private readonly hostWindow = inject(SpartanNativeTheme, { optional: true })?.window;
  private readonly element = inject<ElementRef<HTMLElement>>(ElementRef).nativeElement;
  private readonly bar = viewChild(CdkMenuBar, { read: ElementRef });

  /** The menu bar is the host's native one. */
  readonly isNative = computed(() => {
    const mode = this.native();
    if (mode === 'never' || !this.menus.canSetApplicationMenu) return false;
    return mode === 'always' || this.family() === 'macos';
  });

  /** The menu as drawn in the page: roles replaced by ordinary items. */
  protected readonly pageMenu = computed(() =>
    inPageMenu(this.menu(), this.family(), {
      minimize: this.hostWindow?.minimize && (() => void this.hostWindow!.minimize!()),
      toggleMaximize: this.hostWindow?.toggleMaximize && (() => void this.hostWindow!.toggleMaximize!()),
      close: this.hostWindow?.close && (() => void this.hostWindow!.close!()),
    }),
  );
  private readonly accelerated = computed(() => itemsWithAccelerators(this.pageMenu()));

  /** The field that had the focus before the menu bar took it (Edit commands act on it). */
  private lastFocus: HTMLElement | null = null;
  protected readonly restoreFocus = () => this.lastFocus?.isConnected && this.lastFocus.focus();

  constructor() {
    let sent = false;
    effect(() => {
      if (!this.isNative()) return;
      const menu = this.menu();
      sent = true;
      untracked(() => void this.menus.setApplicationMenu(menu));
    });
    // Give the app menu back to the OS default when the bar goes away
    inject(DestroyRef).onDestroy(() => {
      if (sent) void this.menus.setApplicationMenu([]);
    });
  }

  protected onDocumentKeydown(event: KeyboardEvent): void {
    if (this.isNative() || event.defaultPrevented || event.repeat) return;
    // F10 focuses the menu bar (Windows, GNOME, KDE)
    if (event.key === 'F10' && !event.shiftKey && !event.ctrlKey && !event.altKey && !event.metaKey && this.family() !== 'macos') {
      const first = this.bar()?.nativeElement.querySelector('[data-slot="menubar-trigger"]:not([aria-disabled="true"])') as HTMLElement | null;
      if (first) {
        event.preventDefault();
        first.focus();
      }
      return;
    }
    const family = this.family();
    const item = this.accelerated().find((i) => i.enabled !== false && matchesAccelerator(event, i.accelerator!, family));
    if (!item) return;
    event.preventDefault();
    item.action?.();
  }

  protected onDocumentFocusin(event: FocusEvent): void {
    const target = event.target as HTMLElement | null;
    if (!target || this.element.contains(target)) return;
    if (target.closest('.cdk-overlay-container')) return; // the open menu
    this.lastFocus = target;
  }
}
