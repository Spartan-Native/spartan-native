import { ChangeDetectionStrategy, Component } from '@angular/core';
import { FormControl, ReactiveFormsModule, Validators } from '@angular/forms';
import { NgIcon, provideIcons } from '@ng-icons/core';
import {
  lucideCircleAlert,
  lucideCircleCheck,
  lucideEllipsis,
  lucideInfo,
  lucidePlus,
  lucideRefreshCw,
  lucideTriangleAlert,
} from '@ng-icons/lucide';
import { HlmAlertImports } from '@spartan-ng/helm/alert';
import { HlmAlertDialogImports } from '@spartan-ng/helm/alert-dialog';
import { HlmBadgeImports } from '@spartan-ng/helm/badge';
import { HlmButtonImports } from '@spartan-ng/helm/button';
import { HlmCardImports } from '@spartan-ng/helm/card';
import { HlmCheckboxImports } from '@spartan-ng/helm/checkbox';
import { HlmDialogImports } from '@spartan-ng/helm/dialog';
import { HlmDropdownMenuImports } from '@spartan-ng/helm/dropdown-menu';
import { HlmFieldImports } from '@spartan-ng/helm/field';
import { HlmInputImports } from '@spartan-ng/helm/input';
import { HlmLabelImports } from '@spartan-ng/helm/label';
import { HlmProgressImports } from '@spartan-ng/helm/progress';
import { HlmRadioGroupImports } from '@spartan-ng/helm/radio-group';
import { HlmSelectImports } from '@spartan-ng/helm/select';
import { HlmSeparatorImports } from '@spartan-ng/helm/separator';
import { HlmSliderImports } from '@spartan-ng/helm/slider';
import { HlmSwitchImports } from '@spartan-ng/helm/switch';
import { HlmTableImports } from '@spartan-ng/helm/table';
import { HlmTabsImports } from '@spartan-ng/helm/tabs';
import { HlmTextareaImports } from '@spartan-ng/helm/textarea';
import { HlmTooltipImports } from '@spartan-ng/helm/tooltip';

// Stock spartan/ui components, used exactly as an app would. The theme does the rest.

export const SHARED_STYLES = `
  :host { display: flex; flex-direction: column; gap: 0.875rem; }
  .row { display: flex; flex-wrap: wrap; align-items: center; gap: 0.625rem; }
  .field { display: flex; flex-direction: column; gap: 0.375rem; max-width: 20rem; }
  .caption { margin: 0; font-size: var(--sn-font-size-small); color: var(--sn-color-fg-muted); }
`;

@Component({
  selector: 'sn-buttons-showcase',
  imports: [HlmButtonImports, NgIcon],
  providers: [provideIcons({ lucidePlus, lucideRefreshCw })],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="row">
      <button hlmBtn>Back up now</button>
      <button hlmBtn variant="outline">Pause</button>
      <button hlmBtn variant="secondary">Restore</button>
      <button hlmBtn variant="ghost">View files</button>
      <button hlmBtn variant="destructive">Delete</button>
      <button hlmBtn variant="link">Learn more</button>
    </div>
    <div class="row">
      <button hlmBtn size="sm">Small</button>
      <button hlmBtn variant="outline" size="sm">Small</button>
      <button hlmBtn variant="outline" size="icon" aria-label="Add"><ng-icon name="lucidePlus" /></button>
      <button hlmBtn variant="ghost" size="icon" aria-label="Refresh"><ng-icon name="lucideRefreshCw" /></button>
      <button hlmBtn disabled>Disabled</button>
      <button hlmBtn variant="outline" disabled>Disabled</button>
    </div>
    <p class="caption">default → accent · outline → standard · ghost → flat/subtle</p>
  `,
  styles: SHARED_STYLES,
})
export class ButtonsShowcase {}

@Component({
  selector: 'sn-fields-showcase',
  imports: [HlmInputImports, HlmLabelImports, HlmSelectImports, HlmTextareaImports],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="field">
      <label hlmLabel for="sc-name">Device name</label>
      <input hlmInput id="sc-name" value="Office laptop" />
    </div>
    <div class="field">
      <label hlmLabel for="sc-email">Email</label>
      <input hlmInput id="sc-email" type="email" placeholder="you@example.com" />
    </div>
    <div class="field">
      <span hlmLabel>Frequency</span>
      <hlm-select [value]="'Every hour'">
        <hlm-select-trigger aria-label="Frequency"><hlm-select-value /></hlm-select-trigger>
        <hlm-select-content *hlmSelectPortal>
          <hlm-select-item value="Every hour">Every hour</hlm-select-item>
          <hlm-select-item value="Daily">Daily</hlm-select-item>
          <hlm-select-item value="Weekly">Weekly</hlm-select-item>
        </hlm-select-content>
      </hlm-select>
    </div>
    <div class="field">
      <label hlmLabel for="sc-notes">Release notes</label>
      <textarea hlmTextarea id="sc-notes" rows="3">Faster incremental backups.</textarea>
    </div>
  `,
  styles: SHARED_STYLES,
})
export class FieldsShowcase {}

@Component({
  selector: 'sn-selection-showcase',
  imports: [HlmCheckboxImports, HlmLabelImports, HlmRadioGroupImports, HlmSwitchImports],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="row">
      <hlm-switch inputId="sw1" [checked]="true" /><label hlmLabel for="sw1">Automatic backups</label>
    </div>
    <div class="row"><hlm-switch inputId="sw2" /><label hlmLabel for="sw2">Back up on battery</label></div>
    <div class="row">
      <hlm-checkbox inputId="cb1" [checked]="true" /><label hlmLabel for="cb1">Encrypt backups</label>
      <hlm-checkbox inputId="cb2" /><label hlmLabel for="cb2">Verify after copy</label>
    </div>
    <hlm-radio-group class="row" [value]="'comfortable'" aria-label="Density">
      <hlm-radio value="compact" inputId="r1"><hlm-radio-indicator indicator />Compact</hlm-radio>
      <hlm-radio value="comfortable" inputId="r2"><hlm-radio-indicator indicator />Comfortable</hlm-radio>
      <hlm-radio value="spacious" inputId="r3"><hlm-radio-indicator indicator />Spacious</hlm-radio>
    </hlm-radio-group>
  `,
  styles: SHARED_STYLES,
})
export class SelectionShowcase {}

@Component({
  selector: 'sn-progress-tabs-showcase',
  imports: [HlmProgressImports, HlmSliderImports, HlmTabsImports],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="field" style="max-width: 22.5rem">
      <p class="caption">Volume</p>
      <hlm-slider [value]="[62]" aria-label="Volume" />
    </div>
    <div class="field" style="max-width: 22.5rem">
      <p class="caption">Syncing files · 45%</p>
      <hlm-progress [value]="45" aria-label="Syncing files"><hlm-progress-indicator /></hlm-progress>
    </div>
    <hlm-tabs tab="appearance">
      <hlm-tabs-list aria-label="Settings sections">
        <button hlmTabsTrigger="general">General</button>
        <button hlmTabsTrigger="appearance">Appearance</button>
        <button hlmTabsTrigger="accounts">Accounts</button>
      </hlm-tabs-list>
      <div hlmTabsContent="general"><p class="caption">Startup, notifications and updates.</p></div>
      <div hlmTabsContent="appearance"><p class="caption">Theme, accent color and transparency.</p></div>
      <div hlmTabsContent="accounts"><p class="caption">Signed-in accounts and sync.</p></div>
    </hlm-tabs>
  `,
  styles: SHARED_STYLES,
})
export class ProgressTabsShowcase {}

@Component({
  selector: 'sn-card-badges-showcase',
  imports: [HlmBadgeImports, HlmButtonImports, HlmCardImports],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section hlmCard style="max-width: 23.75rem">
      <div hlmCardHeader>
        <h3 hlmCardTitle>Cloud sync</h3>
        <p hlmCardDescription>Keep your documents up to date across all of your devices.</p>
      </div>
      <div hlmCardFooter class="row" style="justify-content: flex-end">
        <button hlmBtn variant="ghost">Later</button>
        <button hlmBtn>Turn on</button>
      </div>
    </section>
    <div class="row">
      <span hlmBadge>Primary</span>
      <span hlmBadge variant="secondary">Secondary</span>
      <span hlmBadge variant="outline">Outline</span>
      <span hlmBadge class="sn-tone-success">Completed</span>
      <span hlmBadge class="sn-tone-warning">Warning</span>
      <span hlmBadge class="sn-tone-danger">Failed</span>
    </div>
  `,
  styles: SHARED_STYLES,
})
export class CardBadgesShowcase {}

@Component({
  selector: 'sn-overlays-showcase',
  imports: [
    HlmAlertDialogImports,
    HlmButtonImports,
    HlmDialogImports,
    HlmDropdownMenuImports,
    HlmInputImports,
    HlmLabelImports,
    HlmSelectImports,
    HlmTooltipImports,
    NgIcon,
  ],
  providers: [provideIcons({ lucideEllipsis })],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="row" style="align-items: flex-start; gap: 1.5rem">
      <!-- A menu panel rendered inline, so its look is visible without opening it -->
      <hlm-dropdown-menu style="width: 13.75rem">
        <span hlmDropdownMenuLabel>Backup</span>
        <button hlmDropdownMenuItem>
          Back up now <span hlmDropdownMenuShortcut>{{ mod }}B</span>
        </button>
        <button hlmDropdownMenuItem>
          Restore files… <span hlmDropdownMenuShortcut>{{ mod }}R</span>
        </button>
        <button hlmDropdownMenuItem disabled>Verify archive</button>
        <hlm-dropdown-menu-separator />
        <button hlmDropdownMenuItem variant="destructive">Delete backup</button>
      </hlm-dropdown-menu>

      <div class="field">
        <div class="row">
          <button hlmBtn variant="outline" [hlmDropdownMenuTrigger]="menu">Actions</button>
          <button hlmBtn variant="ghost" size="icon" aria-label="More" hlmTooltip="More actions">
            <ng-icon name="lucideEllipsis" />
          </button>
          <button hlmBtn variant="outline" hlmTooltip="Back up the selected folders now">Hover for a tooltip</button>
        </div>
        <hlm-select [value]="'Every hour'">
          <hlm-select-trigger aria-label="Frequency" style="width: 11.25rem"><hlm-select-value /></hlm-select-trigger>
          <hlm-select-content *hlmSelectPortal>
            <hlm-select-item value="Every hour">Every hour</hlm-select-item>
            <hlm-select-item value="Every 4 hours">Every 4 hours</hlm-select-item>
            <hlm-select-item value="Daily">Daily</hlm-select-item>
            <hlm-select-item value="Weekly">Weekly</hlm-select-item>
          </hlm-select-content>
        </hlm-select>
        <div class="row">
          <hlm-dialog>
            <button hlmBtn variant="outline" hlmDialogTrigger>Edit destination…</button>
            <hlm-dialog-content *hlmDialogPortal="let ctx">
              <hlm-dialog-header>
                <h3 hlmDialogTitle>Edit destination</h3>
                <p hlmDialogDescription>Backups are copied to this folder.</p>
              </hlm-dialog-header>
              <div class="field" style="max-width: none">
                <label hlmLabel for="ov-name">Name</label>
                <input hlmInput id="ov-name" value="Office NAS" />
              </div>
              <hlm-dialog-footer>
                <button hlmBtn variant="outline" hlmDialogClose>Cancel</button>
                <button hlmBtn hlmDialogClose>Save</button>
              </hlm-dialog-footer>
            </hlm-dialog-content>
          </hlm-dialog>

          <hlm-alert-dialog>
            <button hlmBtn variant="destructive" hlmAlertDialogTrigger>Delete backup…</button>
            <hlm-alert-dialog-content *hlmAlertDialogPortal="let ctx">
              <hlm-alert-dialog-header>
                <h3 hlmAlertDialogTitle>Delete “Photos → NAS”?</h3>
                <p hlmAlertDialogDescription>The backup and all of its versions are removed. This can’t be undone.</p>
              </hlm-alert-dialog-header>
              <hlm-alert-dialog-footer>
                <button hlmBtn variant="outline" hlmAlertDialogCancel>Cancel</button>
                <button hlmBtn variant="destructive" hlmAlertDialogAction>Delete</button>
              </hlm-alert-dialog-footer>
            </hlm-alert-dialog-content>
          </hlm-alert-dialog>
        </div>
      </div>
    </div>

    <ng-template #menu>
      <hlm-dropdown-menu style="width: 12.5rem">
        <button hlmDropdownMenuItem>Pause</button>
        <button hlmDropdownMenuItem>View files</button>
        <hlm-dropdown-menu-separator />
        <button hlmDropdownMenuItem>Settings…</button>
      </hlm-dropdown-menu>
    </ng-template>
  `,
  styles: SHARED_STYLES,
})
export class OverlaysShowcase {
  /** Shortcut glyphs follow the active skin, not the machine Storybook runs on. */
  protected get mod(): string {
    const skin = document.documentElement.dataset['snSkin'] ?? '';
    return skin.startsWith('mac') ? '⌘' : 'Ctrl+';
  }
}

@Component({
  selector: 'sn-alerts-showcase',
  imports: [HlmAlertImports, NgIcon],
  providers: [provideIcons({ lucideInfo, lucideCircleCheck, lucideTriangleAlert, lucideCircleAlert })],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="field" style="max-width: 30rem">
      <div hlmAlert>
        <ng-icon name="lucideInfo" />
        <h4 hlmAlertTitle>Update available</h4>
        <p hlmAlertDescription>Version 2.4 adds faster incremental backups.</p>
      </div>
      <div hlmAlert class="sn-tone-success">
        <ng-icon name="lucideCircleCheck" />
        <h4 hlmAlertTitle>Backup complete</h4>
        <p hlmAlertDescription>1,204 files copied to Office NAS.</p>
      </div>
      <div hlmAlert class="sn-tone-warning">
        <ng-icon name="lucideTriangleAlert" />
        <h4 hlmAlertTitle>Destination almost full</h4>
        <p hlmAlertDescription>Only 4 GB left on Office NAS.</p>
      </div>
      <div hlmAlert variant="destructive">
        <ng-icon name="lucideCircleAlert" />
        <h4 hlmAlertTitle>Backup failed</h4>
        <p hlmAlertDescription>The destination could not be reached.</p>
      </div>
    </div>
    <p class="caption">default · sn-tone-success · sn-tone-warning · variant="destructive"</p>
  `,
  styles: SHARED_STYLES,
})
export class AlertsShowcase {}

@Component({
  selector: 'sn-table-form-showcase',
  imports: [
    HlmCheckboxImports,
    HlmFieldImports,
    HlmInputImports,
    HlmSeparatorImports,
    HlmTableImports,
    ReactiveFormsModule,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div hlmTableContainer style="max-width: 35rem">
      <table hlmTable>
        <caption hlmTableCaption>
          The second row is selected (data-state="selected").
        </caption>
        <thead hlmTHead>
          <tr hlmTr>
            <th hlmTh>Backup</th>
            <th hlmTh>Destination</th>
            <th hlmTh>Last run</th>
            <th hlmTh>Size</th>
          </tr>
        </thead>
        <tbody hlmTBody>
          <tr hlmTr>
            <td hlmTd>Documents</td>
            <td hlmTd>Office NAS</td>
            <td hlmTd>Today, 09:12</td>
            <td hlmTd>4.2 GB</td>
          </tr>
          <tr hlmTr data-state="selected">
            <td hlmTd>Photos</td>
            <td hlmTd>Office NAS</td>
            <td hlmTd>Yesterday</td>
            <td hlmTd>182 GB</td>
          </tr>
          <tr hlmTr>
            <td hlmTd>Projects</td>
            <td hlmTd>Cloud</td>
            <td hlmTd>Today, 08:00</td>
            <td hlmTd>31 GB</td>
          </tr>
          <tr hlmTr>
            <td hlmTd>Mail</td>
            <td hlmTd>Cloud</td>
            <td hlmTd>Never</td>
            <td hlmTd>—</td>
          </tr>
        </tbody>
        <tfoot hlmTFoot>
          <tr hlmTr>
            <td hlmTd colspan="3">Total</td>
            <td hlmTd>217 GB</td>
          </tr>
        </tfoot>
      </table>
    </div>

    <hlm-separator style="max-width: 35rem" />

    <fieldset hlmFieldSet style="max-width: 22.5rem">
      <legend hlmFieldLegend>Destination</legend>
      <p hlmFieldDescription>Where new backups are written.</p>
      <div hlmField>
        <label hlmFieldLabel for="tf-path">Folder</label>
        <input hlmInput id="tf-path" value="/Volumes/Office NAS/Backups" />
        <p hlmFieldDescription>Must be writable by this account.</p>
      </div>
      <div hlmField>
        <label hlmFieldLabel for="tf-keep">Keep versions for</label>
        <input hlmInput id="tf-keep" type="number" [formControl]="keepDays" />
        <hlm-field-error>Enter at least 1 day.</hlm-field-error>
      </div>
      <div hlmField orientation="horizontal">
        <hlm-checkbox inputId="tf-verify" [checked]="true" />
        <label hlmFieldLabel for="tf-verify">Verify after copy</label>
      </div>
    </fieldset>
  `,
  styles: SHARED_STYLES,
})
export class TableFormShowcase {
  /** Touched and invalid from the start, so the invalid state is visible. */
  protected readonly keepDays = new FormControl(0, [Validators.min(1)]);

  constructor() {
    this.keepDays.markAsTouched();
  }
}

/** Every showcase, in two columns: used by the side-by-side comparison. */
@Component({
  selector: 'sn-all-showcases',
  imports: [
    ButtonsShowcase,
    FieldsShowcase,
    SelectionShowcase,
    ProgressTabsShowcase,
    CardBadgesShowcase,
    AlertsShowcase,
    TableFormShowcase,
    OverlaysShowcase,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <sn-buttons-showcase />
    <sn-selection-showcase />
    <sn-progress-tabs-showcase />
    <sn-fields-showcase />
    <sn-card-badges-showcase />
    <sn-alerts-showcase />
    <sn-table-form-showcase />
    <sn-overlays-showcase />
  `,
  styles: `
    :host {
      display: flex;
      flex-direction: column;
      gap: 1.375rem;
    }
  `,
})
export class AllShowcases {}
