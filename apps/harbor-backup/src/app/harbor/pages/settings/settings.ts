import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { NgIcon, provideIcons } from '@ng-icons/core';
import {
  lucideAppWindow,
  lucideArchive,
  lucideBatteryCharging,
  lucideChevronDown,
  lucideClock,
  lucideFolder,
  lucideFolderOpen,
  lucideGauge,
  lucideLanguages,
  lucidePlus,
  lucidePower,
  lucideShieldCheck,
  lucideSunMoon,
  lucideTriangleAlert,
  lucideX,
} from '@ng-icons/lucide';
import { SnPlatformImports, SnSettingsImports } from '@spartan-native/desktop-ui';
import { toast } from '@spartan-ng/brain/sonner';
import { HlmAccordionImports } from '@spartan-ng/helm/accordion';
import { HlmAlertImports } from '@spartan-ng/helm/alert';
import { HlmAlertDialogImports } from '@spartan-ng/helm/alert-dialog';
import { HlmAvatarImports } from '@spartan-ng/helm/avatar';
import { HlmBadgeImports } from '@spartan-ng/helm/badge';
import { HlmButtonImports } from '@spartan-ng/helm/button';
import { HlmCheckboxImports } from '@spartan-ng/helm/checkbox';
import { HlmCollapsibleImports } from '@spartan-ng/helm/collapsible';
import { HlmHoverCardImports } from '@spartan-ng/helm/hover-card';
import { HlmInputGroupImports } from '@spartan-ng/helm/input-group';
import { HlmItemImports } from '@spartan-ng/helm/item';
import { HlmKbdImports } from '@spartan-ng/helm/kbd';
import { HlmLabelImports } from '@spartan-ng/helm/label';
import { HlmNativeSelectImports } from '@spartan-ng/helm/native-select';
import { HlmRadioGroupImports } from '@spartan-ng/helm/radio-group';
import { HlmSelectImports } from '@spartan-ng/helm/select';
import { HlmSliderImports } from '@spartan-ng/helm/slider';
import { HlmSwitchImports } from '@spartan-ng/helm/switch';
import { HlmTabsImports } from '@spartan-ng/helm/tabs';
import { HlmTextareaImports } from '@spartan-ng/helm/textarea';
import { HlmToggleGroupImports } from '@spartan-ng/helm/toggle-group';
import { HlmTypographyImports } from '@spartan-ng/helm/typography';
import { HarborStore } from '../../data/harbor-store';

type Settings = ReturnType<HarborStore['settings']>;

const COMPRESSION: Settings['compression'][] = ['Off', 'Fast', 'Balanced', 'Maximum'];
const LOG_LEVELS: Settings['logLevel'][] = ['Error', 'Warning', 'Info', 'Debug'];

/** Settings: the app's preferences in tabs; every control saves to store.settings immediately. */
@Component({
  selector: 'harbor-settings',
  imports: [
    NgIcon,
    SnSettingsImports,
    SnPlatformImports,
    HlmAccordionImports,
    HlmAlertImports,
    HlmAlertDialogImports,
    HlmAvatarImports,
    HlmBadgeImports,
    HlmButtonImports,
    HlmCheckboxImports,
    HlmCollapsibleImports,
    HlmHoverCardImports,
    HlmInputGroupImports,
    HlmItemImports,
    HlmKbdImports,
    HlmLabelImports,
    HlmNativeSelectImports,
    HlmRadioGroupImports,
    HlmSelectImports,
    HlmSliderImports,
    HlmSwitchImports,
    HlmTabsImports,
    HlmTextareaImports,
    HlmToggleGroupImports,
    HlmTypographyImports,
  ],
  providers: [
    provideIcons({
      lucideAppWindow,
      lucideArchive,
      lucideBatteryCharging,
      lucideChevronDown,
      lucideClock,
      lucideFolder,
      lucideFolderOpen,
      lucideGauge,
      lucideLanguages,
      lucidePlus,
      lucidePower,
      lucideShieldCheck,
      lucideSunMoon,
      lucideTriangleAlert,
      lucideX,
    }),
  ],
  templateUrl: './settings.html',
  styleUrl: './settings.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HarborSettings {
  protected readonly store = inject(HarborStore);
  protected readonly s = this.store.settings;
  protected readonly compressionLevels = COMPRESSION;
  protected readonly logLevels = LOG_LEVELS;

  protected readonly languages = [
    { value: 'en', label: 'English' },
    { value: 'de', label: 'Deutsch' },
    { value: 'fr', label: 'Français' },
    { value: 'hu', label: 'Magyar' },
    { value: 'ja', label: '日本語' },
  ];

  protected readonly maintainers = [
    { initials: 'AK', name: 'Anna Kovács' },
    { initials: 'JD', name: 'Jonas Diehl' },
    { initials: 'SL', name: 'Sofia Lima' },
  ];

  protected readonly licenses = ['Angular — MIT', 'spartan/ui — MIT', 'Lucide icons — ISC', 'zstd — BSD'];

  protected readonly shortcuts = [
    { label: 'Back up now', keys: 'mod+b' },
    { label: 'New schedule', keys: 'mod+n' },
    { label: 'Restore files', keys: 'mod+r' },
    { label: 'Settings', keys: 'mod+,' },
  ];

  protected readonly bandwidthLabel = computed(() => {
    const mbps = this.s().bandwidthLimitMbps;
    return mbps === 0 ? 'Unlimited' : `${mbps} Mbit/s`;
  });

  protected readonly cacheLabel = computed(() => {
    const mb = this.store.localCacheMb();
    return mb === 0 ? 'Empty' : `${(mb / 1024).toFixed(1)} GB of thumbnails and file indexes`;
  });

  // --- Excluded folders ----------------------------------------------------------
  protected readonly newExclusion = signal('');

  protected isPattern(entry: string): boolean {
    return /[*?[]/.test(entry);
  }

  protected addExclusion(): void {
    const entry = this.newExclusion().trim();
    if (!entry) return;
    if (!this.s().excluded.includes(entry)) {
      this.store.updateSettings({ excluded: [...this.s().excluded, entry] });
    }
    this.newExclusion.set('');
  }

  protected removeExclusion(entry: string): void {
    const before = this.s().excluded;
    this.store.updateSettings({ excluded: before.filter((e) => e !== entry) });
    toast(`“${entry}” is backed up again`, {
      action: { label: 'Undo', onClick: () => this.store.updateSettings({ excluded: before }) },
    });
  }

  // --- Controls whose outputs are untyped -------------------------------------------
  protected setCompression(value: unknown): void {
    const level = COMPRESSION.find((c) => c === value);
    if (level) this.store.updateSettings({ compression: level });
  }

  protected setLogLevel(value: unknown): void {
    const level = LOG_LEVELS.find((l) => l === value);
    if (level) this.store.updateSettings({ logLevel: level });
  }

  protected setAppearance(value: unknown): void {
    if (value === 'System' || value === 'Light' || value === 'Dark') this.store.updateSettings({ appearance: value });
  }

  protected setBandwidth(value: number[]): void {
    this.store.updateSettings({ bandwidthLimitMbps: value[0] ?? 0 });
  }

  // --- Actions ------------------------------------------------------------------------
  protected sendTestNotification(): void {
    toast('Harbor Backup', { description: 'This is a test notification. Notifications are working.' });
  }

  protected openLogsFolder(): void {
    toast('Opened the logs folder', { description: '~/Library/Logs/Harbor Backup' });
  }

  protected checkForUpdates(): void {
    toast.success('Harbor Backup is up to date', { description: 'Version 2.4.0 is the latest version.' });
  }

  protected resetSettings(): void {
    this.store.resetSettings();
    toast('All settings were reset to their defaults');
  }

  protected eraseCache(): void {
    this.store.eraseLocalCache();
    toast('Local cache erased', { description: 'Thumbnails and indexes are rebuilt as needed.' });
  }
}
