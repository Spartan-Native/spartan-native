import { booleanAttribute, ChangeDetectionStrategy, Component, computed, Directive, input } from '@angular/core';
import { injectSkin, skinFamily } from '@spartan-native/theme';

/**
 * One piece of information in an `<sn-status-bar>`: "4 items", "1 selected · 48 KB",
 * "Last backup 09:12". The bar separates items the way the OS does (spacing on Windows 11,
 * vertical rules on Windows 10 and KDE, commas on macOS).
 *
 * `live` makes a screen reader announce changes to this item (e.g. a progress message);
 * leave it off for text that changes on every selection, so it doesn't interrupt.
 */
@Directive({
  selector: '[snStatusItem]',
  host: {
    'data-slot': 'sn-status-item',
    '[attr.role]': "live() ? 'status' : null",
  },
})
export class SnStatusItem {
  readonly live = input(false, { transform: booleanAttribute });
}

/**
 * The window's status bar, along the bottom edge:
 *  - Windows 11: File Explorer's status bar, small text, items spaced apart, no rules
 *  - Windows 10: the classic status bar, items divided by vertical rules
 *  - macOS 26 / 13–15: Finder's status bar, small centered text, items joined by commas
 *  - GNOME: a GtkActionBar at the bottom of an AdwToolbarView (start · end)
 *  - KDE: Dolphin's status bar, items divided by rules, extra controls (zoom, free space) at the end
 *  - ChromeOS: a slim M3 footer, muted label-medium text
 *
 * ```html
 * <sn-status-bar>
 *   <span snStatusItem>4 items</span>
 *   <span snStatusItem>1 selected · 48 KB</span>
 *   <span snStatusItem snStatusBarEnd>1.2 TB free</span>
 * </sn-status-bar>
 * ```
 *
 * `[snStatusBarEnd]` items go to the trailing edge (on macOS they join the centered text).
 * It carries `sn-chrome`, so the theme dims it when the window is inactive.
 */
@Component({
  selector: 'sn-status-bar',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    'data-slot': 'sn-status-bar',
    class: 'sn-chrome',
    role: 'group',
    '[attr.aria-label]': 'ariaLabel()',
    '[attr.data-family]': 'family()',
    '[attr.data-skin]': 'skin()',
  },
  template: `
    <div class="start"><ng-content /></div>
    <div class="end"><ng-content select="[snStatusBarEnd]" /></div>
  `,
  styleUrl: './status-bar.scss',
})
export class SnStatusBar {
  /** Accessible name of the bar. */
  readonly ariaLabel = input('Status');
  protected readonly skin = injectSkin();
  protected readonly family = computed(() => skinFamily(this.skin()));
}

export const SnStatusBarImports = [SnStatusBar, SnStatusItem] as const;
