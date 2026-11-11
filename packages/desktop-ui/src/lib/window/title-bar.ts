import { booleanAttribute, ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';
import { injectSkin, skinFamily } from '@spartan-native/theme';
import { SnWindowControls, type WindowButton } from './window-controls';

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
 * (Electron titleBarOverlay, Window Controls Overlay): space is left for them.
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
  },
  template: `
    @if (family() === 'macos' && windowControls() === 'custom') {
      <sn-window-controls [buttons]="buttons()" (close)="close.emit()" (minimize)="minimize.emit()" (maximize)="maximize.emit()" />
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
  readonly close = output<void>();

  protected readonly skin = injectSkin();
  protected readonly family = computed(() => skinFamily(this.skin()));
  /** Windows, KDE and ChromeOS show the app icon in the title bar; macOS and GNOME don't. */
  protected readonly showIcon = computed(() => this.family() === 'windows' || this.skin() === 'qt' || this.skin() === 'cros');
}
