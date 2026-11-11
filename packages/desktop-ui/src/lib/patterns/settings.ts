import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { injectSkin, skinFamily } from '@spartan-native/theme';

let nextId = 0;

/**
 * A group of settings rows, drawn as each OS draws its settings:
 *  - Windows 11 (`win`): a stack of SettingsCards under a section title
 *  - Windows 10 (`w10`): the Settings app's plain list: a light heading, label above each control
 *  - macOS 26 (`mac`): a grouped Form section (small header above an inset rounded glass list)
 *  - macOS 13–15 (`macc`): the same section with the classic corner and vibrancy
 *  - GNOME (`gtk`): AdwPreferencesGroup (bold title above a boxed list)
 *  - KDE Plasma (`qt`): a Kirigami FormLayout (centered section title, "Label:" right-aligned
 *    in one column, controls in the next, help text under the control; icons hidden)
 *  - ChromeOS (`cros`): a Settings list (M3 list rows inside a tonal card)
 *
 * ```html
 * <sn-settings-group title="Backups" description="Choose when and how backups run.">
 *   <sn-settings-row title="Automatic backups" subtitle="Run in the background">
 *     <hlm-switch [checked]="true" aria-label="Automatic backups" />
 *   </sn-settings-row>
 * </sn-settings-group>
 * ```
 */
@Component({
  selector: 'sn-settings-group',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    'data-slot': 'sn-settings-group',
    role: 'group',
    '[attr.aria-labelledby]': 'title() ? headingId : null',
    '[attr.data-family]': 'family()',
    '[attr.data-skin]': 'skin()',
  },
  template: `
    @if (title() || description()) {
      <header>
        @if (title()) {
          <h2 [id]="headingId">{{ title() }}</h2>
        }
        @if (description()) {
          <p>{{ description() }}</p>
        }
      </header>
    }
    <div class="rows"><ng-content /></div>
  `,
  styleUrl: './settings-group.scss',
})
export class SnSettingsGroup {
  /** The group heading (labels the group for assistive tech). */
  readonly title = input('');
  /** A line of explanation under the heading. */
  readonly description = input('');
  protected readonly headingId = `sn-settings-group-${nextId++}`;
  protected readonly skin = injectSkin();
  protected readonly family = computed(() => skinFamily(this.skin()));
}

/**
 * One setting: title, optional subtitle, and its control on the trailing side
 * (Windows 10: below the label; KDE: in the FormLayout's control column).
 * Put an icon in front with `snSettingsIcon` (hidden on Windows 10 and KDE, which don't use them).
 */
@Component({
  selector: 'sn-settings-row',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    'data-slot': 'sn-settings-row',
    '[attr.data-family]': 'family()',
    '[attr.data-skin]': 'skin()',
  },
  template: `
    <ng-content select="[snSettingsIcon]" />
    <div class="text">
      <span class="title">{{ title() }}</span>
      @if (subtitle()) {
        <span class="subtitle">{{ subtitle() }}</span>
      }
    </div>
    <div class="control"><ng-content /></div>
  `,
  styleUrl: './settings-row.scss',
})
export class SnSettingsRow {
  /** The setting's name (on KDE: the FormLayout label). */
  readonly title = input.required<string>();
  /** Help text (on KDE: shown under the control). */
  readonly subtitle = input('');
  protected readonly skin = injectSkin();
  protected readonly family = computed(() => skinFamily(this.skin()));
}
