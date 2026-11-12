import {
  booleanAttribute,
  ChangeDetectionStrategy,
  Component,
  computed,
  DestroyRef,
  inject,
  input,
  output,
  signal,
} from '@angular/core';
import { injectSkin, skinFamily, SpartanNativeTheme } from '@spartan-native/theme';

export type WindowButton = 'minimize' | 'maximize' | 'close';

/**
 * The window's own buttons, drawn the way the OS draws them:
 *  - Windows 11 (`win`): minimize / maximize / close caption buttons on the right; close turns red
 *  - Windows 10 (`w10`): the same caption buttons with square glyphs and the Windows 10 red
 *  - macOS 26 (`mac`) and macOS 13–15 (`macc`): the traffic lights (close / minimize / zoom);
 *    glyphs appear on hover; grey when the window is inactive
 *  - GNOME (`gtk`): a round close button, the GNOME default button layout (`linuxAll` adds the other two)
 *  - KDE Plasma (`qt`): Breeze buttons: chevron minimize / maximize and a close cross;
 *    a circle appears on hover, red for close
 *  - ChromeOS (`cros`): Material 3 round caption buttons
 *
 * Use it inside <sn-title-bar>, or on its own wherever your layout puts it
 * (on macOS the lights often sit at the top of the sidebar).
 *
 * ```html
 * <sn-window-controls />   <!-- in Wails, Tauri, … the buttons act on the real window -->
 * <sn-window-controls [nativeActions]="false" (close)="confirmAndClose()" />
 * ```
 *
 * With a host that owns a window (wailsHost(), …) the buttons minimize, maximize and close
 * it, and the maximize glyph follows the real state. The outputs always fire too.
 */
@Component({
  selector: 'sn-window-controls',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    'data-slot': 'sn-window-controls',
    class: 'sn-chrome',
    role: 'group',
    'aria-label': 'Window',
    '[attr.data-family]': 'family()',
    '[attr.data-skin]': 'skin()',
  },
  template: `
    @switch (look()) {
      @case ('macos') {
        <button type="button" class="light close" aria-label="Close" (click)="act('close')">
          <svg viewBox="0 0 10 10" aria-hidden="true"><path d="M3 3l4 4M7 3l-4 4" /></svg>
        </button>
        <button type="button" class="light minimize" aria-label="Minimize" (click)="act('minimize')">
          <svg viewBox="0 0 10 10" aria-hidden="true"><path d="M2.5 5h5" /></svg>
        </button>
        <button type="button" class="light zoom" aria-label="Zoom" (click)="act('maximize')">
          <svg viewBox="0 0 10 10" aria-hidden="true"><path d="M3 6.8V3h3.8M7 3.2V7H3.2" /></svg>
        </button>
      }
      @case ('gnome') {
        @if (show('minimize') && linuxAll()) {
          <button type="button" class="round" aria-label="Minimize" (click)="act('minimize')">
            <svg viewBox="0 0 16 16" aria-hidden="true"><path d="M4.5 11.5h7" /></svg>
          </button>
        }
        @if (show('maximize') && linuxAll()) {
          <button
            type="button"
            class="round"
            [attr.aria-label]="isMaximized() ? 'Restore' : 'Maximize'"
            (click)="act('maximize')"
          >
            <svg viewBox="0 0 16 16" aria-hidden="true"><rect x="4.5" y="4.5" width="7" height="7" rx="1" /></svg>
          </button>
        }
        <button type="button" class="round" aria-label="Close" (click)="act('close')">
          <svg viewBox="0 0 16 16" aria-hidden="true"><path d="M5 5l6 6M11 5l-6 6" /></svg>
        </button>
      }
      @default {
        <!-- Windows, KDE Breeze and ChromeOS: minimize, maximize, close on the right -->
        @if (show('minimize')) {
          <button type="button" class="caption" aria-label="Minimize" (click)="act('minimize')">
            <svg viewBox="0 0 10 10" aria-hidden="true">
              @if (look() === 'kde') {
                <path d="M1.5 3.5L5 7l3.5-3.5" />
              } @else {
                <path d="M0 5h10" />
              }
            </svg>
          </button>
        }
        @if (show('maximize')) {
          <button
            type="button"
            class="caption"
            [attr.aria-label]="isMaximized() ? 'Restore' : 'Maximize'"
            (click)="act('maximize')"
          >
            <svg viewBox="0 0 10 10" aria-hidden="true">
              @if (look() === 'kde') {
                @if (isMaximized()) {
                  <path d="M5 1.5L8.5 5 5 8.5 1.5 5z" />
                } @else {
                  <path d="M1.5 6.5L5 3l3.5 3.5" />
                }
              } @else if (isMaximized()) {
                <path d="M2.5 2.5V1h6.5v6.5H7.5M1 2.5h6.5V9H1z" />
              } @else {
                <rect
                  x="0.5"
                  y="0.5"
                  width="9"
                  height="9"
                  [attr.rx]="skin() === 'w10' ? 0 : look() === 'cros' ? 1.5 : 1"
                />
              }
            </svg>
          </button>
        }
        <button type="button" class="caption close" aria-label="Close" (click)="act('close')">
          <svg viewBox="0 0 10 10" aria-hidden="true"><path d="M0.5 0.5l9 9M9.5 0.5l-9 9" /></svg>
        </button>
      }
    }
  `,
  styleUrl: './window-controls.scss',
})
export class SnWindowControls {
  /** Which buttons to show. Close is always shown. */
  readonly buttons = input<readonly WindowButton[]>(['minimize', 'maximize', 'close']);
  /** Show the restore glyph instead of maximize (all but macOS). */
  readonly maximized = input(false, { transform: booleanAttribute });
  /** GNOME shows only close by default; set to show minimize and maximize too. */
  readonly linuxAll = input(false, { transform: booleanAttribute });

  /** Act on the host's real window (when it has one). Default: true. */
  readonly nativeActions = input(true, { transform: booleanAttribute });

  readonly minimize = output<void>();
  readonly maximize = output<void>();
  // eslint-disable-next-line @angular-eslint/no-output-native -- public API named after the window action; the DOM `close` event doesn't bubble, so it can't collide
  readonly close = output<void>();

  protected readonly skin = injectSkin();
  protected readonly family = computed(() => skinFamily(this.skin()));
  /** Which button set to draw: KDE and ChromeOS have their own, the web family shares GNOME's. */
  protected readonly look = computed(() => {
    const skin = this.skin();
    if (skin === 'qt') return 'kde';
    if (skin === 'cros') return 'cros';
    const family = this.family();
    return family === 'macos' || family === 'windows' ? family : 'gnome';
  });

  private readonly hostWindow = inject(SpartanNativeTheme, { optional: true })?.window;
  private readonly hostMaximized = signal(false);
  protected readonly isMaximized = computed(() => this.maximized() || this.hostMaximized());

  constructor() {
    const off = this.hostWindow?.onMaximizedChange?.((m) => this.hostMaximized.set(m));
    if (off) inject(DestroyRef).onDestroy(off);
    void this.hostWindow?.isMaximized?.().then((m) => this.hostMaximized.set(m));
  }

  protected act(action: WindowButton): void {
    if (action === 'minimize') this.minimize.emit();
    if (action === 'maximize') this.maximize.emit();
    if (action === 'close') this.close.emit();
    if (!this.nativeActions() || !this.hostWindow) return;
    if (action === 'minimize') void this.hostWindow.minimize?.();
    if (action === 'maximize') void this.hostWindow.toggleMaximize?.();
    if (action === 'close') void this.hostWindow.close?.();
  }

  protected show(button: WindowButton): boolean {
    return this.buttons().includes(button);
  }
}
