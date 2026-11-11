import { NgTemplateOutlet } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { NgIcon, provideIcons } from '@ng-icons/core';
import {
  lucideCloud,
  lucideEllipsis,
  lucideEye,
  lucideEyeOff,
  lucideFolderOpen,
  lucideHardDrive,
  lucideKeyRound,
  lucideLayoutGrid,
  lucideLayoutList,
  lucideLock,
  lucideLockOpen,
  lucidePencil,
  lucidePlus,
  lucideServer,
  lucideShieldCheck,
  lucideTerminal,
  lucideTrash2,
} from '@ng-icons/lucide';
import { SnCoachMarkImports, SnModalSheet, SnStatusPage } from '@spartan-native/desktop-ui';
import { injectSkin, skinFamily } from '@spartan-native/theme';
import { toast } from '@spartan-ng/brain/sonner';
import { HlmAlertImports } from '@spartan-ng/helm/alert';
import { HlmAlertDialogImports } from '@spartan-ng/helm/alert-dialog';
import { HlmBadgeImports } from '@spartan-ng/helm/badge';
import { HlmButtonImports } from '@spartan-ng/helm/button';
import { HlmCardImports } from '@spartan-ng/helm/card';
import { HlmComboboxImports } from '@spartan-ng/helm/combobox';
import { HlmDropdownMenuImports } from '@spartan-ng/helm/dropdown-menu';
import { HlmEmptyImports } from '@spartan-ng/helm/empty';
import { HlmFieldImports } from '@spartan-ng/helm/field';
import { HlmInputImports } from '@spartan-ng/helm/input';
import { HlmInputGroupImports } from '@spartan-ng/helm/input-group';
import { HlmInputOtpImports } from '@spartan-ng/helm/input-otp';
import { HlmItemImports } from '@spartan-ng/helm/item';
import { HlmLabelImports } from '@spartan-ng/helm/label';
import { HlmNativeSelectImports } from '@spartan-ng/helm/native-select';
import { HlmProgressImports } from '@spartan-ng/helm/progress';
import { HlmSpinnerImports } from '@spartan-ng/helm/spinner';
import { HlmSwitchImports } from '@spartan-ng/helm/switch';
import { HlmTabsImports } from '@spartan-ng/helm/tabs';
import { HlmToggleGroupImports } from '@spartan-ng/helm/toggle-group';
import { HlmTooltipImports } from '@spartan-ng/helm/tooltip';
import { type Destination, type DestinationKind, HarborStore } from '../../data/harbor-store';

const KINDS: { kind: DestinationKind; label: string; icon: string }[] = [
  { kind: 'nas', label: 'Network share', icon: 'lucideServer' },
  { kind: 'usb', label: 'USB drive', icon: 'lucideHardDrive' },
  { kind: 'cloud', label: 'Cloud', icon: 'lucideCloud' },
  { kind: 'sftp', label: 'SFTP', icon: 'lucideTerminal' },
];

/** Devices found on the network (fixed demo data), with their capacity in GB. */
const DEVICES = [
  { name: 'office-nas', totalGb: 4000 },
  { name: 'media-server', totalGb: 8000 },
  { name: 'backup-pi', totalGb: 2000 },
];

/** Drives currently plugged in (fixed demo data). */
const DRIVES = [
  { name: 'Backup Drive', mount: '/Volumes/Backup Drive 2', totalGb: 1000 },
  { name: 'Samsung T7', mount: '/Volumes/Samsung T7', totalGb: 2000 },
];

/** 1240 → "1.2 TB", 312 → "312 GB". */
function formatGb(gb: number): string {
  return gb >= 1000 ? `${+(gb / 1000).toFixed(1)} TB` : `${gb} GB`;
}

/** Destinations: where backups go (NAS, USB drive, cloud, SFTP). Add, rename, verify and remove them. */
@Component({
  selector: 'harbor-destinations',
  imports: [
    NgIcon,
    NgTemplateOutlet,
    SnCoachMarkImports,
    SnModalSheet,
    SnStatusPage,
    HlmAlertImports,
    HlmAlertDialogImports,
    HlmBadgeImports,
    HlmButtonImports,
    HlmCardImports,
    HlmComboboxImports,
    HlmDropdownMenuImports,
    HlmEmptyImports,
    HlmFieldImports,
    HlmInputImports,
    HlmInputGroupImports,
    HlmInputOtpImports,
    HlmItemImports,
    HlmLabelImports,
    HlmNativeSelectImports,
    HlmProgressImports,
    HlmSpinnerImports,
    HlmSwitchImports,
    HlmTabsImports,
    HlmToggleGroupImports,
    HlmTooltipImports,
  ],
  providers: [
    provideIcons({
      lucideCloud,
      lucideEllipsis,
      lucideEye,
      lucideEyeOff,
      lucideFolderOpen,
      lucideHardDrive,
      lucideKeyRound,
      lucideLayoutGrid,
      lucideLayoutList,
      lucideLock,
      lucideLockOpen,
      lucidePencil,
      lucidePlus,
      lucideServer,
      lucideShieldCheck,
      lucideTerminal,
      lucideTrash2,
    }),
  ],
  templateUrl: './destinations.html',
  styleUrl: './destinations.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HarborDestinations {
  protected readonly store = inject(HarborStore);
  protected readonly kinds = KINDS;
  protected readonly devices = DEVICES.map((d) => d.name);
  protected readonly drives = DRIVES;
  protected readonly formatGb = formatGb;

  private readonly skin = injectSkin();
  /** "Show in Finder" on macOS, "Show in Explorer" on Windows, "Show in Files" elsewhere. */
  protected readonly revealLabel = computed(() => {
    const f = skinFamily(this.skin());
    return f === 'macos' ? 'Show in Finder' : f === 'windows' ? 'Show in Explorer' : 'Show in Files';
  });

  // --- Toolbar ------------------------------------------------------------------------
  protected readonly view = signal<'grid' | 'list'>('grid');
  protected readonly filter = signal<DestinationKind | 'all'>('all');
  protected readonly shown = computed(() => {
    const f = this.filter();
    return this.store.destinations().filter((d) => f === 'all' || d.kind === f);
  });
  protected readonly filterLabel = computed(() => KINDS.find((k) => k.kind === this.filter())?.label ?? '');
  protected readonly tipOpen = this.store.destinationsTipOpen;

  protected setView(v: unknown): void {
    if (v === 'grid' || v === 'list') this.view.set(v);
  }

  protected setFilter(v: unknown): void {
    this.filter.set(typeof v === 'string' && v ? (v as DestinationKind | 'all') : 'all');
  }

  protected icon(kind: DestinationKind): string {
    return KINDS.find((k) => k.kind === kind)!.icon;
  }

  protected percent(d: Destination): number {
    return Math.round((d.usedGb / d.totalGb) * 100);
  }

  // --- Add destination ---------------------------------------------------------------------
  protected readonly adding = signal(false);
  protected readonly submitted = signal(false);
  protected readonly kind = signal<DestinationKind>('nas');
  protected readonly name = signal('');
  protected readonly device = signal<string | null>(null);
  protected readonly drive = signal(DRIVES[0].mount);
  protected readonly pairingCode = signal('');
  protected readonly host = signal('');
  protected readonly port = signal('22');
  protected readonly user = signal('');
  protected readonly password = signal('');
  protected readonly showPassword = signal(false);
  protected readonly encrypt = signal(true);

  /** Validation messages per field; empty when the form can be submitted. */
  protected readonly errors = computed(() => {
    const e: Partial<Record<'name' | 'device' | 'code' | 'host' | 'port' | 'user', string>> = {};
    if (!this.name().trim()) e.name = 'Enter a name.';
    else if (this.store.destinations().some((d) => d.name.toLowerCase() === this.name().trim().toLowerCase()))
      e.name = 'A destination with this name already exists.';
    switch (this.kind()) {
      case 'nas':
        if (!this.device()) e.device = 'Choose a device on your network.';
        break;
      case 'cloud':
        if (!/^\d{6}$/.test(this.pairingCode())) e.code = 'Enter the 6-digit code shown on harbor.cloud/pair.';
        break;
      case 'sftp': {
        if (!this.host().trim()) e.host = 'Enter a host name.';
        const port = Number(this.port());
        if (!Number.isInteger(port) || port < 1 || port > 65535) e.port = 'Use a port from 1 to 65535.';
        if (!this.user().trim()) e.user = 'Enter a user name.';
        break;
      }
    }
    return e;
  });

  protected openAdd(): void {
    this.tipOpen.set(false);
    this.submitted.set(false);
    this.kind.set(this.filter() === 'all' ? 'nas' : (this.filter() as DestinationKind));
    this.name.set('');
    this.device.set(null);
    this.drive.set(DRIVES[0].mount);
    this.pairingCode.set('');
    this.host.set('');
    this.port.set('22');
    this.user.set('');
    this.password.set('');
    this.showPassword.set(false);
    this.encrypt.set(true);
    this.adding.set(true);
  }

  protected setKind(k: string): void {
    this.kind.set(k as DestinationKind);
  }

  protected add(): void {
    this.submitted.set(true);
    if (Object.keys(this.errors()).length) return;
    const kind = this.kind();
    let path = '';
    let totalGb = 1000;
    if (kind === 'nas') {
      path = `smb://${this.device()}/Backups`;
      totalGb = DEVICES.find((d) => d.name === this.device())?.totalGb ?? totalGb;
    } else if (kind === 'usb') {
      const drive = DRIVES.find((d) => d.mount === this.drive()) ?? DRIVES[0];
      path = drive.mount;
      totalGb = drive.totalGb;
    } else if (kind === 'cloud') {
      path = 'harbor://eu-central/' + this.name().trim().toLowerCase().replace(/\s+/g, '-');
    } else {
      path = `sftp://${this.user().trim()}@${this.host().trim()}:${this.port()}/backups`;
      totalGb = 2000;
    }
    const created = this.store.addDestination({ name: this.name().trim(), kind, path, totalGb, encrypted: this.encrypt() });
    this.adding.set(false);
    this.filter.set('all');
    toast.success(`${created.name} added`, {
      description: created.encrypted ? 'Backups to it are encrypted.' : 'Backups to it are not encrypted.',
    });
  }

  // --- Item actions -----------------------------------------------------------------------
  protected verify(d: Destination): void {
    if (d.status === 'offline') {
      toast.error(`Can't verify ${d.name}`, { description: 'The destination is offline. Connect it and try again.' });
      return;
    }
    toast.success(`${d.name} verified`, { description: 'Every backup on it matches its checksum.' });
  }

  protected reveal(d: Destination): void {
    toast(`Opened ${d.path}`);
  }

  protected readonly renaming = signal<Destination | null>(null);
  protected readonly renameOpen = signal(false);
  protected readonly newName = signal('');
  protected readonly renameError = computed(() => {
    const n = this.newName().trim();
    if (!n) return 'Enter a name.';
    const current = this.renaming();
    if (this.store.destinations().some((d) => d.id !== current?.id && d.name.toLowerCase() === n.toLowerCase()))
      return 'A destination with this name already exists.';
    return '';
  });

  protected openRename(d: Destination): void {
    this.newName.set(d.name);
    this.renaming.set(d);
    this.renameOpen.set(true);
  }

  protected rename(): void {
    const d = this.renaming();
    if (!d || this.renameError()) return;
    this.store.renameDestination(d.id, this.newName().trim());
    this.renameOpen.set(false);
    toast.success(`Renamed to ${this.newName().trim()}`);
  }

  /** Kept after the dialog closes so its text doesn't change during the close animation. */
  protected readonly removing = signal<Destination | null>(null);
  protected readonly confirmOpen = signal(false);

  protected askRemove(d: Destination): void {
    this.removing.set(d);
    this.removingSchedules.set(this.store.schedules().filter((s) => s.destinationId === d.id).map((s) => s.name));
    this.confirmOpen.set(true);
  }
  /** The schedules that back up to the destination being removed (they are deleted with it). */
  protected readonly removingSchedules = signal<string[]>([]);

  protected remove(): void {
    const d = this.removing();
    if (!d) return;
    const schedules = this.removingSchedules().length;
    this.store.removeDestination(d.id);
    this.confirmOpen.set(false);
    toast.success(`${d.name} removed`, {
      description: schedules ? `${schedules} schedule${schedules === 1 ? '' : 's'} using it ${schedules === 1 ? 'was' : 'were'} deleted.` : undefined,
    });
  }
}
