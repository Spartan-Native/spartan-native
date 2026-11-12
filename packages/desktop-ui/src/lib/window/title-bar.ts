import { booleanAttribute, ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';
import { injectNativeSkin, injectSkin, skinFamily, type Skin } from '@spartan-native/theme';
import { SnWindowControls, type WindowButton } from './window-controls';

/** Windows, KDE and ChromeOS show the app icon in the title bar; macOS and GNOME don't. */
const APP_ICON: Record<Skin, boolean> = {
  win: true,
  w10: true,
  mac: false,
  macc: false,
  gtk: false,
  qt: true,
  cros: true,
  web: false,
};

/**
 * A complete title bar, laid out the way each OS does it:
 *  - Windows 11 (`win`) / Windows 10 (`w10`): app icon and title on the left, caption buttons on the right
 *  - macOS 26 (`mac`): traffic lights on the left, title centered, a 38px unified bar
 *  - macOS 13–15 (`macc`): the classic 28px title bar, lights inset 8px, title centered
 *  - GNOME (`gtk`): an AdwHeaderBar, bold title centered, close button on the right
 *  - KDE Plasma (`qt`): the Breeze title bar: app icon on the left, title centered,
 *    minimize / maximize / close on the right
 *  - ChromeOS (`cros`): the caption bar: app icon and title on the left, round M3 caption buttons on the right
 *
 * The bar is a window drag region for Electron/Chromium (`app-region`), Wails
 * (`--wails-draggable`) and Tauri (`data-tauri-drag-region`); buttons inside are not.
 * It carries `sn-chrome`, so the theme dims it when the window is inactive.
 *
 * ```html
 * <sn-title-bar title="Harbor Backup" (close)="host.close()">
 *   <img snTitleBarIcon src="icon.svg" alt="" />
 *   <button hlmBtn variant="ghost" snTitleBarEnd>…</button>
 * </sn-title-bar>
 * ```
 *
 * Set `windowControls="native"` when the OS draws its own buttons
 * (Electron titleBarOverlay, Window Controls Overlay, a macOS hidden-inset title bar): space is
 * left for them where the real OS puts them, so a Mac dressed as Windows keeps the room for its
 * traffic lights at the start, and the layout of the rest follows the skin.
 */
@Component({
  selector: 'sn-title-bar',
  imports: [SnWindowControls],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    'data-slot': 'sn-title-bar',
    class: 'sn-chrome',
    role: 'banner',
    'data-tauri-drag-region': '',
    '[attr.data-family]': 'family()',
    '[attr.data-skin]': 'skin()',
    '[attr.data-controls]': 'windowControls()',
    // where the OS draws its own buttons follows the real OS, not the skin
    '[attr.data-native]': 'windowControls() === "native" ? nativeSkin() : null',
  },
  template: `
    @if (family() === 'macos' && windowControls() === 'custom') {
      <sn-window-controls
        [buttons]="buttons()"
        (close)="close.emit()"
        (minimize)="minimize.emit()"
        (maximize)="maximize.emit()"
      />
    }
    <div class="start">
      @if (showIcon()) {
        <ng-content select="[snTitleBarIcon]" />
      }
      <ng-content select="[snTitleBarStart]" />
    </div>
    <div class="title">
      <span class="text">{{ title() }}</span>
      @if (subtitle()) {
        <span class="subtitle">{{ subtitle() }}</span>
      }
    </div>
    <div class="end">
      <ng-content select="[snTitleBarEnd]" />
    </div>
    @if (family() !== 'macos' && windowControls() === 'custom') {
      <sn-window-controls
        [buttons]="buttons()"
        [maximized]="maximized()"
        (close)="close.emit()"
        (minimize)="minimize.emit()"
        (maximize)="maximize.emit()"
      />
    }
  `,
  styleUrl: './title-bar.scss',
})
export class SnTitleBar {
  /** The window title. */
  readonly title = input('');
  /** A second, smaller line under the title. */
  readonly subtitle = input('');
  /** `custom`: draw the window buttons · `native`: the OS draws them (leave space). */
  readonly windowControls = input<'custom' | 'native'>('custom');
  /** Which window buttons to draw. Close is always drawn. */
  readonly buttons = input<readonly WindowButton[]>(['minimize', 'maximize', 'close']);
  /** Show the restore glyph instead of maximize. */
  readonly maximized = input(false, { transform: booleanAttribute });

  readonly minimize = output<void>();
  readonly maximize = output<void>();
  // eslint-disable-next-line @angular-eslint/no-output-native -- public API named after the window action; the DOM `close` event doesn't bubble, so it can't collide
  readonly close = output<void>();

  protected readonly skin = injectSkin();
  protected readonly family = computed(() => skinFamily(this.skin()));
  /** The real OS's skin: where and how big its own window buttons are. */
  protected readonly nativeSkin = injectNativeSkin();
  protected readonly showIcon = computed(() => APP_ICON[this.skin()]);
}
