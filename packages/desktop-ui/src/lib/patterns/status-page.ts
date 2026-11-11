import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { NgIcon } from '@ng-icons/core';
import { injectSkin, skinFamily } from '@spartan-native/theme';

/**
 * A full-page empty or status state:
 *  - Windows 11 (`win`) / Windows 10 (`w10`): a Fluent empty state (accent glyph in a tinted circle,
 *    subtitle-size title)
 *  - macOS 26 (`mac`) / macOS 13–15 (`macc`): ContentUnavailableView (medium grey icon, bold title)
 *  - GNOME (`gtk`): AdwStatusPage (128px faded icon, big heavy title, pill buttons)
 *  - KDE Plasma (`qt`): Kirigami PlaceholderMessage (faded 64px icon, muted level-2 heading)
 *  - ChromeOS (`cros`): the Material 3 empty state (icon in a primary-container circle, light headline)
 *
 * `icon` is an @ng-icons name the app has registered with provideIcons().
 * Buttons go in the content.
 *
 * ```html
 * <sn-status-page icon="lucideArchive" title="No backups yet" description="Add a destination to start protecting your files.">
 *   <button hlmBtn>Add destination</button>
 * </sn-status-page>
 * ```
 */
@Component({
  selector: 'sn-status-page',
  imports: [NgIcon],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    'data-slot': 'sn-status-page',
    role: 'status',
    '[attr.data-family]': 'family()',
    '[attr.data-skin]': 'skin()',
  },
  template: `
    @if (icon()) {
      <ng-icon class="icon" [name]="icon()" aria-hidden="true" />
    }
    <h2>{{ title() }}</h2>
    @if (description()) {
      <p>{{ description() }}</p>
    }
    <div class="actions"><ng-content /></div>
  `,
  styleUrl: './status-page.scss',
})
export class SnStatusPage {
  /** An @ng-icons name registered with provideIcons(). Leave empty for no icon. */
  readonly icon = input('');
  /** The headline. */
  readonly title = input.required<string>();
  /** A sentence that says what to do next. */
  readonly description = input('');
  protected readonly skin = injectSkin();
  protected readonly family = computed(() => skinFamily(this.skin()));
}
