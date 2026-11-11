import { computed, Injectable, signal } from '@angular/core';

// ============================================================================
//  Harbor's demo data and actions, shared by every page.
//  Fixed data (no Date.now()) so the app and its screenshots are deterministic.
// ============================================================================

export type Tone = 'success' | 'warning' | 'danger' | 'accent';

export type DestinationKind = 'nas' | 'usb' | 'cloud' | 'sftp';

export interface Destination {
  id: string;
  name: string;
  kind: DestinationKind;
  /** Where on the destination: a share path, mount point or bucket. */
  path: string;
  usedGb: number;
  totalGb: number;
  status: 'online' | 'offline' | 'syncing';
  /** Human-readable, e.g. "Today, 09:12". */
  lastBackup: string;
  encrypted: boolean;
}

export type Frequency = 'Every hour' | 'Every 4 hours' | 'Daily' | 'Weekly';
export type Weekday = 'Mon' | 'Tue' | 'Wed' | 'Thu' | 'Fri' | 'Sat' | 'Sun';

export interface Schedule {
  id: string;
  name: string;
  /** Source folders, e.g. ['~/Documents', '~/Desktop']. */
  sources: string[];
  destinationId: string;
  frequency: Frequency;
  /** For Daily/Weekly: which days it runs. */
  days: Weekday[];
  /** 24 h, e.g. "02:00". */
  time: string;
  enabled: boolean;
  /** How long versions are kept, in days. */
  keepDays: number;
  /** ISO date of the next run (fixed demo data). */
  nextRun: string;
  lastResult: { label: string; tone: Tone };
  /** ISO date the schedule starts on (Schedules page). */
  startDate?: string;
  /** Also run on battery power (Schedules page). */
  onBattery?: boolean;
}

export interface Snapshot {
  id: string;
  /** ISO date-time, fixed. */
  at: string;
  label: string;
  sizeGb: number;
  destinationId: string;
  files: number;
}

export interface FileEntry {
  id: string;
  name: string;
  /** Folder path inside the backup, e.g. "Documents/Finance". */
  folder: string;
  kind: string;
  sizeKb: number;
  modified: string;
  versions: number;
}

export interface Activity {
  title: string;
  detail: string;
  status: string;
  tone: Tone;
}

export const WEEKDAYS: Weekday[] = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
export const FREQUENCIES: Frequency[] = ['Every hour', 'Every 4 hours', 'Daily', 'Weekly'];

/** Human-readable size: 48 KB, 2.4 MB, 1.1 GB. */
export function formatSize(kb: number): string {
  if (kb < 1024) return `${kb} KB`;
  if (kb < 1024 * 1024) return `${(kb / 1024).toFixed(1)} MB`;
  return `${(kb / 1024 / 1024).toFixed(1)} GB`;
}

let nextId = 100;

@Injectable({ providedIn: 'root' })
export class HarborStore {
  // --- Destinations -----------------------------------------------------------
  readonly destinations = signal<Destination[]>([
    { id: 'nas', name: 'Office NAS', kind: 'nas', path: 'smb://office-nas/Backups', usedGb: 1240, totalGb: 4000, status: 'online', lastBackup: 'Today, 09:12', encrypted: true },
    { id: 'cloud', name: 'Harbor Cloud', kind: 'cloud', path: 'harbor://eu-central/office', usedGb: 312, totalGb: 1000, status: 'syncing', lastBackup: 'Yesterday, 22:40', encrypted: true },
    { id: 'usb', name: 'USB drive', kind: 'usb', path: '/Volumes/Backup Drive', usedGb: 845, totalGb: 1000, status: 'offline', lastBackup: 'Yesterday, 18:03', encrypted: false },
  ]);

  destination(id: string): Destination | undefined {
    return this.destinations().find((d) => d.id === id);
  }

  addDestination(d: Omit<Destination, 'id' | 'usedGb' | 'status' | 'lastBackup'>): Destination {
    const created: Destination = { ...d, id: `dest-${nextId++}`, usedGb: 0, status: 'online', lastBackup: 'Never' };
    this.destinations.update((list) => [...list, created]);
    return created;
  }

  removeDestination(id: string): void {
    this.destinations.update((list) => list.filter((d) => d.id !== id));
    this.schedules.update((list) => list.filter((s) => s.destinationId !== id));
  }

  renameDestination(id: string, name: string): void {
    this.destinations.update((list) => list.map((d) => (d.id === id ? { ...d, name } : d)));
  }

  /** The Destinations page's "Add destination" coach mark: shown until dismissed once. */
  readonly destinationsTipOpen = signal(true);

  // --- Schedules -----------------------------------------------------------------
  readonly schedules = signal<Schedule[]>([
    { id: 'docs', name: 'Documents', sources: ['~/Documents', '~/Desktop'], destinationId: 'nas', frequency: 'Every hour', days: [], time: '00:00', enabled: true, keepDays: 90, nextRun: '2026-03-12T10:00', lastResult: { label: 'Completed', tone: 'success' } },
    { id: 'photos', name: 'Photos', sources: ['~/Pictures'], destinationId: 'nas', frequency: 'Daily', days: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'], time: '02:00', enabled: true, keepDays: 365, nextRun: '2026-03-13T02:00', lastResult: { label: 'Completed', tone: 'success' } },
    { id: 'projects', name: 'Projects', sources: ['~/Projects'], destinationId: 'cloud', frequency: 'Every 4 hours', days: [], time: '00:00', enabled: true, keepDays: 30, nextRun: '2026-03-12T12:00', lastResult: { label: '14 skipped', tone: 'warning' } },
    { id: 'mail', name: 'Mail archive', sources: ['~/Library/Mail'], destinationId: 'usb', frequency: 'Weekly', days: ['Sun'], time: '18:00', enabled: false, keepDays: 180, nextRun: '2026-03-15T18:00', lastResult: { label: 'Failed', tone: 'danger' } },
  ]);

  addSchedule(s: Omit<Schedule, 'id' | 'nextRun' | 'lastResult'>): Schedule {
    const created: Schedule = { ...s, id: `sched-${nextId++}`, nextRun: '2026-03-13T02:00', lastResult: { label: 'Not run yet', tone: 'accent' } };
    this.schedules.update((list) => [...list, created]);
    return created;
  }

  updateSchedule(id: string, patch: Partial<Schedule>): void {
    this.schedules.update((list) => list.map((s) => (s.id === id ? { ...s, ...patch } : s)));
  }

  removeSchedule(id: string): void {
    this.schedules.update((list) => list.filter((s) => s.id !== id));
  }

  // --- Snapshots and files (Restore) -----------------------------------------------
  readonly snapshots = signal<Snapshot[]>([
    { id: 's5', at: '2026-03-12T09:12', label: 'Today, 09:12', sizeGb: 18.2, destinationId: 'nas', files: 12408 },
    { id: 's4', at: '2026-03-12T08:12', label: 'Today, 08:12', sizeGb: 18.1, destinationId: 'nas', files: 12397 },
    { id: 's3', at: '2026-03-11T22:40', label: 'Yesterday, 22:40', sizeGb: 17.9, destinationId: 'cloud', files: 12350 },
    { id: 's2', at: '2026-03-10T09:00', label: 'Tue 10 March, 09:00', sizeGb: 17.4, destinationId: 'nas', files: 12101 },
    { id: 's1', at: '2026-03-02T09:00', label: 'Mon 2 March, 09:00', sizeGb: 16.8, destinationId: 'nas', files: 11870 },
  ]);

  readonly files: FileEntry[] = [
    { id: 'f1', name: 'Budget 2026.xlsx', folder: 'Documents/Finance', kind: 'Spreadsheet', sizeKb: 48, modified: 'Today, 08:55', versions: 14 },
    { id: 'f2', name: 'Q4 Report.pdf', folder: 'Documents/Finance', kind: 'PDF document', sizeKb: 2458, modified: 'Yesterday, 17:20', versions: 3 },
    { id: 'f3', name: 'Invoices 2025.zip', folder: 'Documents/Finance', kind: 'ZIP archive', sizeKb: 84213, modified: 'Mon 2 March', versions: 1 },
    { id: 'f4', name: 'Meeting notes.md', folder: 'Documents/Notes', kind: 'Markdown', sizeKb: 6, modified: 'Today, 09:05', versions: 22 },
    { id: 'f5', name: 'Roadmap.png', folder: 'Documents/Notes', kind: 'PNG image', sizeKb: 1126, modified: 'Tue 10 March', versions: 2 },
    { id: 'f6', name: 'Contract draft.docx', folder: 'Documents/Legal', kind: 'Word document', sizeKb: 312, modified: 'Wed 4 March', versions: 6 },
    { id: 'f7', name: 'NDA – Northwind.pdf', folder: 'Documents/Legal', kind: 'PDF document', sizeKb: 204, modified: 'Fri 27 Feb', versions: 1 },
    { id: 'f8', name: 'Tax return 2025.pdf', folder: 'Documents/Finance', kind: 'PDF document', sizeKb: 912, modified: 'Thu 5 March', versions: 4 },
    { id: 'f9', name: 'Holiday plan.md', folder: 'Documents/Notes', kind: 'Markdown', sizeKb: 3, modified: 'Sun 8 March', versions: 5 },
  ];

  readonly folders = computed(() => [...new Set(this.files.map((f) => f.folder))].sort());

  // --- Overview ---------------------------------------------------------------------
  readonly paused = signal(false);
  readonly progress = signal(68);

  readonly activity = signal<Activity[]>([
    { title: 'Photos → Office NAS', detail: 'Today, 09:12 · 2.1 GB', status: 'Completed', tone: 'success' },
    { title: 'Projects → Harbor Cloud', detail: 'Yesterday, 22:40 · 14 files skipped', status: 'Warning', tone: 'warning' },
    { title: 'Mail archive → USB drive', detail: 'Yesterday, 18:03 · drive not found', status: 'Failed', tone: 'danger' },
  ]);

  /** Backed-up size per day, last 7 days (GB). For the Overview chart. */
  readonly history = [
    { day: 'Fri 6', gb: 16.9 },
    { day: 'Sat 7', gb: 17.0 },
    { day: 'Sun 8', gb: 17.0 },
    { day: 'Mon 9', gb: 17.3 },
    { day: 'Tue 10', gb: 17.4 },
    { day: 'Wed 11', gb: 17.9 },
    { day: 'Thu 12', gb: 18.2 },
  ];

  // --- Settings (app preferences) ----------------------------------------------------
  readonly settings = signal({
    launchAtLogin: true,
    showInMenuBar: true,
    automaticBackups: true,
    backUpOnBattery: false,
    encrypt: true,
    notifyOnSuccess: false,
    notifyOnFailure: true,
    bandwidthLimitMbps: 40,
    compression: 'Balanced' as 'Off' | 'Fast' | 'Balanced' | 'Maximum',
    excluded: ['node_modules', '.cache', '*.tmp'],
    // Added for the Settings page
    appearance: 'System' as 'System' | 'Light' | 'Dark',
    language: 'en',
    notifyOnWarning: true,
    /** Extra exclusion patterns, one glob per line. */
    excludedPatterns: '**/*.iso\n**/Thumbs.db\n~/Downloads/**',
    logLevel: 'Info' as 'Error' | 'Warning' | 'Info' | 'Debug',
    useSystemProxy: true,
    allowMetered: false,
  });

  updateSettings(patch: Partial<ReturnType<HarborStore['settings']>>): void {
    this.settings.update((s) => ({ ...s, ...patch }));
  }

  /** The settings as shipped, for "Reset all settings". */
  private readonly defaultSettings = this.settings();

  resetSettings(): void {
    this.settings.set(this.defaultSettings);
  }

  /** Thumbnails and file indexes kept on this device (MB). */
  readonly localCacheMb = signal(1840);

  eraseLocalCache(): void {
    this.localCacheMb.set(0);
  }
}
