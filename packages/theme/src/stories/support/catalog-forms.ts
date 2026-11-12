import { ChangeDetectionStrategy, Component, computed, signal } from '@angular/core';
import { NgIcon, provideIcons } from '@ng-icons/core';
import {
  lucideBell,
  lucideChevronDown,
  lucideCopy,
  lucideFolder,
  lucideLayoutGrid,
  lucideLayoutList,
  lucidePin,
  lucideRefreshCw,
  lucideSearch,
} from '@ng-icons/lucide';
import { HlmAutocompleteImports } from '@spartan-ng/helm/autocomplete';
import { HlmButtonImports } from '@spartan-ng/helm/button';
import { HlmButtonGroupImports } from '@spartan-ng/helm/button-group';
import { HlmCalendarImports } from '@spartan-ng/helm/calendar';
import { HlmComboboxImports } from '@spartan-ng/helm/combobox';
import { HlmDatePickerImports } from '@spartan-ng/helm/date-picker';
import { HlmInputGroupImports } from '@spartan-ng/helm/input-group';
import { HlmInputOtpImports } from '@spartan-ng/helm/input-otp';
import { HlmKbdImports } from '@spartan-ng/helm/kbd';
import { HlmLabelImports } from '@spartan-ng/helm/label';
import { HlmNativeSelectImports } from '@spartan-ng/helm/native-select';
import { HlmToggleImports } from '@spartan-ng/helm/toggle';
import { HlmToggleGroupImports } from '@spartan-ng/helm/toggle-group';
import { SHARED_STYLES } from './showcases';

// Stock spartan/ui form extras, used exactly as an app would. Dates are fixed for stable screenshots.

const DESTINATIONS = ['Local NAS', 'External drive', 'Harbor Cloud', 'S3 bucket', 'SFTP server'];
const FILES = [
  'Documents/Invoices',
  'Documents/Taxes 2025',
  'Photos/Lisbon trip',
  'Photos/Family',
  'Projects/harbor-site',
  'Music/Library',
];

@Component({
  selector: 'sn-pickers-showcase',
  imports: [HlmAutocompleteImports, HlmComboboxImports, HlmLabelImports, HlmNativeSelectImports],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="field">
      <label hlmLabel for="sc-destination">Destination</label>
      <hlm-combobox [value]="'Harbor Cloud'">
        <hlm-combobox-input
          inputId="sc-destination"
          placeholder="Choose a destination"
          triggerAriaLabel="Show destinations"
        />
        <hlm-combobox-content *hlmComboboxPortal>
          <hlm-combobox-empty>No destinations found.</hlm-combobox-empty>
          <div hlmComboboxList>
            @for (destination of destinations; track destination) {
              <hlm-combobox-item [value]="destination" [disabled]="destination === 'SFTP server'">{{
                destination
              }}</hlm-combobox-item>
            }
          </div>
        </hlm-combobox-content>
      </hlm-combobox>
    </div>
    <div class="field">
      <label hlmLabel for="sc-restore-search">Restore files</label>
      <hlm-autocomplete [(search)]="search">
        <hlm-autocomplete-input inputId="sc-restore-search" placeholder="Search backed-up files" />
        <hlm-autocomplete-content *hlmAutocompletePortal>
          <hlm-autocomplete-empty>No files match.</hlm-autocomplete-empty>
          <div hlmAutocompleteList aria-label="Matching files">
            @for (file of filteredFiles(); track file) {
              <hlm-autocomplete-item [value]="file">{{ file }}</hlm-autocomplete-item>
            }
          </div>
        </hlm-autocomplete-content>
      </hlm-autocomplete>
    </div>
    <div class="row">
      <div class="field">
        <label hlmLabel for="sc-retention">Keep versions for</label>
        <hlm-native-select selectId="sc-retention" value="90">
          <option hlmNativeSelectOption value="30">30 days</option>
          <option hlmNativeSelectOption value="90">90 days</option>
          <option hlmNativeSelectOption value="365">1 year</option>
          <optgroup hlmNativeSelectOptGroup label="Advanced">
            <option hlmNativeSelectOption value="forever">Forever</option>
          </optgroup>
        </hlm-native-select>
      </div>
      <div class="field">
        <label hlmLabel for="sc-compression">Compression</label>
        <hlm-native-select selectId="sc-compression" value="fast" disabled>
          <option hlmNativeSelectOption value="fast">Fast</option>
          <option hlmNativeSelectOption value="small">Smallest</option>
        </hlm-native-select>
      </div>
    </div>
  `,
  styles: SHARED_STYLES,
})
export class PickersShowcase {
  protected readonly destinations = DESTINATIONS;
  protected readonly search = signal('');
  protected readonly filteredFiles = computed(() => {
    const q = this.search().toLowerCase();
    return FILES.filter((f) => f.toLowerCase().includes(q));
  });
}

@Component({
  selector: 'sn-dates-showcase',
  imports: [HlmCalendarImports, HlmDatePickerImports, HlmLabelImports],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="row">
      <div class="field">
        <label hlmLabel for="sc-next-run">Next full backup</label>
        <hlm-date-picker [date]="selected" [minDate]="min">
          <hlm-date-picker-trigger buttonId="sc-next-run">Pick a date</hlm-date-picker-trigger>
        </hlm-date-picker>
      </div>
      <div class="field">
        <label hlmLabel for="sc-pause-until">Pause until</label>
        <hlm-date-picker [defaultFocusedDate]="selected">
          <hlm-date-picker-trigger buttonId="sc-pause-until">Pick a date</hlm-date-picker-trigger>
        </hlm-date-picker>
      </div>
    </div>
    <div class="row" style="align-items: flex-start">
      <hlm-calendar [date]="selected" [min]="min" [dateDisabled]="isWeekend" aria-label="Backup calendar" />
      <hlm-calendar-range [startDate]="rangeStart" [endDate]="rangeEnd" aria-label="Snapshot range" />
    </div>
    <p class="caption">Weekends are disabled · snapshot range 9–15 March 2026</p>
  `,
  styles: SHARED_STYLES,
})
export class DatesShowcase {
  protected readonly selected = new Date(2026, 2, 12);
  protected readonly min = new Date(2026, 2, 3);
  protected readonly rangeStart = new Date(2026, 2, 9);
  protected readonly rangeEnd = new Date(2026, 2, 15);
  protected readonly isWeekend = (date: Date) => date.getDay() === 0 || date.getDay() === 6;
}

@Component({
  selector: 'sn-input-extras-showcase',
  imports: [HlmInputGroupImports, HlmInputOtpImports, HlmKbdImports, HlmLabelImports, NgIcon],
  providers: [provideIcons({ lucideCopy, lucideFolder, lucideSearch })],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="field">
      <label hlmLabel for="sc-file-filter">Filter files</label>
      <hlm-input-group>
        <input hlmInputGroupInput id="sc-file-filter" placeholder="Search this backup" />
        <hlm-input-group-addon><ng-icon name="lucideSearch" /></hlm-input-group-addon>
        <hlm-input-group-addon align="inline-end"><kbd hlmKbd>⌘K</kbd></hlm-input-group-addon>
      </hlm-input-group>
    </div>
    <div class="field">
      <label hlmLabel for="sc-path">Backup folder</label>
      <hlm-input-group>
        <hlm-input-group-addon><ng-icon name="lucideFolder" /></hlm-input-group-addon>
        <input hlmInputGroupInput id="sc-path" value="~/Documents" />
        <hlm-input-group-addon align="inline-end">
          <button hlmInputGroupButton size="icon-xs" aria-label="Copy path"><ng-icon name="lucideCopy" /></button>
        </hlm-input-group-addon>
      </hlm-input-group>
    </div>
    <div class="field">
      <label hlmLabel for="sc-quota">Storage quota</label>
      <hlm-input-group>
        <input hlmInputGroupInput id="sc-quota" type="number" value="500" />
        <hlm-input-group-addon align="inline-end"><span hlmInputGroupText>GB</span></hlm-input-group-addon>
      </hlm-input-group>
    </div>
    <div class="field">
      <label hlmLabel for="sc-pairing">Pairing code</label>
      <hlm-input-otp [length]="6" value="482" inputId="sc-pairing">
        <hlm-input-otp-group>
          <hlm-input-otp-slot [index]="0" />
          <hlm-input-otp-slot [index]="1" />
          <hlm-input-otp-slot [index]="2" />
        </hlm-input-otp-group>
        <hlm-input-otp-separator />
        <hlm-input-otp-group>
          <hlm-input-otp-slot [index]="3" />
          <hlm-input-otp-slot [index]="4" />
          <hlm-input-otp-slot [index]="5" />
        </hlm-input-otp-group>
      </hlm-input-otp>
    </div>
    <p class="caption">
      Back up now <kbd hlmKbdGroup><kbd hlmKbd>⌘</kbd><kbd hlmKbd>B</kbd></kbd> · Restore
      <kbd hlmKbdGroup><kbd hlmKbd>⇧</kbd><kbd hlmKbd>⌘</kbd><kbd hlmKbd>R</kbd></kbd>
    </p>
  `,
  styles: SHARED_STYLES,
})
export class InputExtrasShowcase {}

@Component({
  selector: 'sn-toggles-showcase',
  imports: [HlmButtonImports, HlmButtonGroupImports, HlmToggleImports, HlmToggleGroupImports, NgIcon],
  providers: [
    provideIcons({ lucideBell, lucideChevronDown, lucideLayoutGrid, lucideLayoutList, lucidePin, lucideRefreshCw }),
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="row">
      <button hlmToggle state="on" aria-label="Pin to menu bar"><ng-icon name="lucidePin" /></button>
      <button hlmToggle aria-label="Notifications"><ng-icon name="lucideBell" /></button>
      <button hlmToggle variant="outline" state="on"><ng-icon name="lucideRefreshCw" />Auto-sync</button>
      <button hlmToggle variant="outline">Verify</button>
      <button hlmToggle variant="outline" disabled>Throttle</button>
    </div>
    <div class="row">
      <hlm-toggle-group type="single" [value]="'grid'" variant="outline" aria-label="File view">
        <button hlmToggleGroupItem value="list" aria-label="List view"><ng-icon name="lucideLayoutList" /></button>
        <button hlmToggleGroupItem value="grid" aria-label="Grid view"><ng-icon name="lucideLayoutGrid" /></button>
      </hlm-toggle-group>
      <hlm-toggle-group type="multiple" [value]="['mon', 'wed']" aria-label="Backup days">
        <button hlmToggleGroupItem value="mon">Mon</button>
        <button hlmToggleGroupItem value="tue">Tue</button>
        <button hlmToggleGroupItem value="wed">Wed</button>
        <button hlmToggleGroupItem value="thu" disabled>Thu</button>
        <button hlmToggleGroupItem value="fri">Fri</button>
      </hlm-toggle-group>
    </div>
    <div class="row">
      <div hlmButtonGroup aria-label="Backup actions">
        <button hlmBtn variant="outline">Back up now</button>
        <button hlmBtn variant="outline" size="icon" aria-label="More backup options">
          <ng-icon name="lucideChevronDown" />
        </button>
      </div>
      <div hlmButtonGroup aria-label="Snapshot">
        <span hlmButtonGroupText>Snapshot</span>
        <button hlmBtn variant="outline">Previous</button>
        <button hlmBtn variant="outline">Next</button>
      </div>
      <div hlmButtonGroup aria-label="Restore">
        <button hlmBtn variant="secondary">Restore</button>
        <hlm-button-group-separator />
        <button hlmBtn variant="secondary">Restore to…</button>
      </div>
    </div>
  `,
  styles: SHARED_STYLES,
})
export class TogglesShowcase {}
