import { ChangeDetectionStrategy, Component, computed, inject, signal, viewChild } from '@angular/core';
import { NgIcon, provideIcons } from '@ng-icons/core';
import {
  lucideCalendarCheck,
  lucideCalendarClock,
  lucideCopy,
  lucideFolder,
  lucidePause,
  lucidePencil,
  lucidePlay,
  lucidePlus,
  lucideTrash2,
  lucideX,
} from '@ng-icons/lucide';
import { SnCommandBarImports, SnModalSheet, SnPlatformImports, SnStatusPage } from '@spartan-native/desktop-ui';
import { SnSelectableImports } from '@spartan-native/helm';
import { injectSkin, skinFamily } from '@spartan-native/theme';
import { toast } from '@spartan-ng/brain/sonner';
import { HlmAlertDialog, HlmAlertDialogImports } from '@spartan-ng/helm/alert-dialog';
import { HlmBadgeImports } from '@spartan-ng/helm/badge';
import { HlmButtonImports } from '@spartan-ng/helm/button';
import { HlmCalendarImports } from '@spartan-ng/helm/calendar';
import { HlmCheckboxImports } from '@spartan-ng/helm/checkbox';
import { HlmContextMenuImports } from '@spartan-ng/helm/context-menu';
import { HlmDatePickerImports } from '@spartan-ng/helm/date-picker';
import { HlmDropdownMenuImports } from '@spartan-ng/helm/dropdown-menu';
import { HlmFieldImports } from '@spartan-ng/helm/field';
import { HlmHoverCardImports } from '@spartan-ng/helm/hover-card';
import { HlmInputImports } from '@spartan-ng/helm/input';
import { HlmInputGroupImports } from '@spartan-ng/helm/input-group';
import { HlmKbdImports } from '@spartan-ng/helm/kbd';
import { HlmSelectImports } from '@spartan-ng/helm/select';
import { HlmSliderImports } from '@spartan-ng/helm/slider';
import { HlmSwitchImports } from '@spartan-ng/helm/switch';
import { HlmTableImports } from '@spartan-ng/helm/table';
import { HlmToggleGroupImports } from '@spartan-ng/helm/toggle-group';
import { HlmTooltipImports } from '@spartan-ng/helm/tooltip';
import {
  formatSize,
  FREQUENCIES,
  HarborStore,
  WEEKDAYS,
  type Frequency,
  type Schedule,
  type Weekday,
} from '../../data/harbor-store';

/** The demo's "now": Thu 12 March 2026, 09:12. */
const NOW = new Date(2026, 2, 12, 9, 12);
const TODAY = new Date(2026, 2, 12);

const pad = (n: number) => String(n).padStart(2, '0');
const toIso = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
const weekday = (d: Date): Weekday => WEEKDAYS[(d.getDay() + 6) % 7];
const sameDay = (a: Date, b: Date) => a.toDateString() === b.toDateString();
const dayLabel = (d: Date) => d.toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'long' });
const startOf = (s: Pick<Schedule, 'startDate'>) => (s.startDate ? new Date(`${s.startDate}T00:00`) : TODAY);

/** Whether a schedule runs at some point on day `d`. */
function runsOn(s: Schedule, d: Date): boolean {
  if (d < startOf(s) && !sameDay(d, startOf(s))) return false;
  if (s.frequency === 'Every hour' || s.frequency === 'Every 4 hours') return true;
  return s.days.length === 0 || s.days.includes(weekday(d));
}

/** The next run after now (or after the start date), as an ISO date-time. */
function nextRunOf(s: Schedule): string {
  const start = startOf(s);
  const from = start > NOW ? start : NOW;
  const step = s.frequency === 'Every hour' ? 1 : s.frequency === 'Every 4 hours' ? 4 : 0;
  if (step) {
    const d = new Date(from);
    d.setMinutes(0, 0, 0);
    do d.setHours(d.getHours() + 1);
    while (d.getHours() % step);
    return toIso(d);
  }
  const [h, m] = s.time.split(':').map(Number);
  for (let i = 0; i < 8; i++) {
    const d = new Date(from.getFullYear(), from.getMonth(), from.getDate() + i, h, m);
    if (d > from && runsOn(s, d)) return toIso(d);
  }
  return toIso(from);
}

/** "Today, 10:00", "Tomorrow, 02:00", "Sun 15 March, 18:00". */
function formatRun(iso: string): string {
  const d = new Date(iso);
  const time = `${pad(d.getHours())}:${pad(d.getMinutes())}`;
  const diff = Math.round((new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime() - TODAY.getTime()) / 86_400_000);
  return `${diff === 0 ? 'Today' : diff === 1 ? 'Tomorrow' : dayLabel(d)}, ${time}`;
}

/** The New / Edit schedule form. */
interface Draft {
  id: string | null;
  name: string;
  sources: string[];
  destinationId: string;
  frequency: Frequency;
  days: Weekday[];
  time: string;
  startDate: Date;
  keepDays: number;
  onBattery: boolean;
}

/** Schedules: the backup schedules, their next runs, and the New / Edit schedule sheet. */
@Component({
  selector: 'harbor-schedules',
  imports: [
    NgIcon,
    SnCommandBarImports,
    SnModalSheet,
    SnPlatformImports,
    SnStatusPage,
    SnSelectableImports,
    HlmAlertDialogImports,
    HlmBadgeImports,
    HlmButtonImports,
    HlmCalendarImports,
    HlmCheckboxImports,
    HlmContextMenuImports,
    HlmDatePickerImports,
    HlmDropdownMenuImports,
    HlmFieldImports,
    HlmHoverCardImports,
    HlmInputImports,
    HlmInputGroupImports,
    HlmKbdImports,
    HlmSelectImports,
    HlmSliderImports,
    HlmSwitchImports,
    HlmTableImports,
    HlmToggleGroupImports,
    HlmTooltipImports,
  ],
  providers: [
    provideIcons({
      lucideCalendarCheck,
      lucideCalendarClock,
      lucideCopy,
      lucideFolder,
      lucidePause,
      lucidePencil,
      lucidePlay,
      lucidePlus,
      lucideTrash2,
      lucideX,
    }),
  ],
  templateUrl: './schedules.html',
  styleUrl: './schedules.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { '(document:keydown)': 'onDocumentKey($event)' },
})
export class HarborSchedules {
  protected readonly store = inject(HarborStore);
  protected readonly frequencies = FREQUENCIES;
  protected readonly weekdays = WEEKDAYS;
  protected readonly today = TODAY;
  protected readonly formatRun = formatRun;
  protected readonly formatSize = formatSize;
  protected readonly destinationName = (id: string) => this.store.destination(id)?.name ?? 'Unknown destination';

  private readonly skin = injectSkin();
  /** Delete is ⌘⌫ on macOS, Del elsewhere. */
  protected readonly deleteShortcut = computed(() => (skinFamily(this.skin()) === 'macos' ? 'mod+backspace' : 'delete'));

  // --- List and selection -------------------------------------------------------
  protected readonly selection = signal<readonly string[]>([]);
  protected readonly selected = computed(() => this.store.schedules().filter((s) => this.selection().includes(s.id)));
  protected readonly single = computed(() => (this.selected().length === 1 ? this.selected()[0] : null));
  protected readonly anyEnabled = computed(() => this.store.schedules().some((s) => s.enabled));
  protected readonly summary = computed(() => {
    const all = this.store.schedules();
    const n = this.selection().length;
    return n ? `${n} of ${all.length} selected` : `${all.length} schedules · ${all.filter((s) => s.enabled).length} active`;
  });

  protected describe(s: Schedule): string {
    if (s.frequency === 'Every hour' || s.frequency === 'Every 4 hours') return 'On the hour';
    const days = s.days.length === 0 || s.days.length === 7 ? 'Every day' : s.days.join(' ');
    return `${days} · ${s.time}`;
  }

  // --- Upcoming runs ----------------------------------------------------------------
  protected readonly day = signal(TODAY);
  protected readonly dayTitle = computed(() => (sameDay(this.day(), TODAY) ? 'Today' : dayLabel(this.day())));
  /** Days from today to the end of March with at least one run (dots in the calendar). */
  protected readonly runDays = computed(() => {
    const enabled = this.store.schedules().filter((s) => s.enabled);
    const days: Date[] = [];
    for (let d = new Date(TODAY); d.getMonth() === 2; d = new Date(d.getFullYear(), 2, d.getDate() + 1)) {
      if (enabled.some((s) => runsOn(s, d))) days.push(d);
    }
    return days;
  });
  protected readonly dayRuns = computed(() =>
    this.store
      .schedules()
      .filter((s) => s.enabled && runsOn(s, this.day()))
      .map((s) => ({
        s,
        when: s.frequency === 'Every hour' || s.frequency === 'Every 4 hours' ? s.frequency : s.time,
      }))
      .sort((a, b) => a.s.time.localeCompare(b.s.time)),
  );

  // --- Actions --------------------------------------------------------------------
  protected toggle(s: Schedule, enabled: boolean): void {
    this.store.updateSchedule(s.id, { enabled, nextRun: nextRunOf(s) });
    toast(enabled ? `“${s.name}” resumed` : `“${s.name}” paused`, {
      description: enabled ? `Next run ${formatRun(nextRunOf(s))}` : 'It won’t run until you turn it back on.',
    });
  }

  protected runNow(list: Schedule[]): void {
    for (const s of list) this.store.updateSchedule(s.id, { lastResult: { label: 'Running', tone: 'accent' } });
    toast(list.length === 1 ? 'Backup started' : `${list.length} backups started`, {
      description: list.map((s) => `${s.name} → ${this.destinationName(s.destinationId)}`).join(' · '),
    });
  }

  protected duplicate(s: Schedule): void {
    const { id: _id, nextRun: _next, lastResult: _last, ...rest } = s;
    const copy = this.store.addSchedule({ ...rest, name: `${s.name} copy` });
    this.store.updateSchedule(copy.id, { nextRun: nextRunOf(copy) });
    this.selection.set([copy.id]);
    toast(`Duplicated “${s.name}”`);
  }

  protected pauseAll(): void {
    const enable = !this.anyEnabled();
    for (const s of this.store.schedules()) this.store.updateSchedule(s.id, { enabled: enable });
    toast(enable ? 'All schedules resumed' : 'All schedules paused');
  }

  // --- Delete (confirmed) ----------------------------------------------------------------
  private readonly confirmDelete = viewChild.required<HlmAlertDialog>('confirmDelete');
  protected readonly pendingDelete = signal<Schedule[]>([]);

  protected askDelete(list: Schedule[]): void {
    if (!list.length) return;
    this.pendingDelete.set(list);
    this.confirmDelete().open();
  }

  protected deleteConfirmed(): void {
    const list = this.pendingDelete();
    for (const s of list) this.store.removeSchedule(s.id);
    toast(list.length === 1 ? `Deleted “${list[0].name}”` : `Deleted ${list.length} schedules`, {
      description: 'Backups already made stay on their destinations.',
    });
  }

  // --- New / Edit sheet ----------------------------------------------------------------
  protected readonly sheetOpen = signal(false);
  protected readonly draft = signal<Draft>(this.blankDraft());
  protected readonly needsDays = computed(() => this.draft().frequency === 'Daily' || this.draft().frequency === 'Weekly');
  protected readonly draftValid = computed(() => {
    const d = this.draft();
    return d.name.trim() !== '' && d.sources.length > 0 && !!d.destinationId && (!this.needsDays() || d.days.length > 0);
  });

  private blankDraft(): Draft {
    return {
      id: null,
      name: '',
      sources: [],
      destinationId: this.store.destinations()[0]?.id ?? '',
      frequency: 'Daily',
      days: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'],
      time: '02:00',
      startDate: TODAY,
      keepDays: 90,
      onBattery: false,
    };
  }

  protected openNew(): void {
    this.draft.set(this.blankDraft());
    this.sheetOpen.set(true);
  }

  protected openEdit(s: Schedule | null): void {
    if (!s) return;
    const { lastResult: _r, nextRun: _n, enabled: _e, ...rest } = s;
    this.draft.set({ ...rest, startDate: startOf(s), onBattery: !!s.onBattery });
    this.sheetOpen.set(true);
  }

  protected patch(p: Partial<Draft>): void {
    this.draft.update((d) => ({ ...d, ...p }));
  }

  protected setFrequency(v: unknown): void {
    if (v) this.patch({ frequency: v as Frequency });
  }

  protected setDays(v: unknown): void {
    this.patch({ days: WEEKDAYS.filter((d) => (v as Weekday[] | null)?.includes(d)) });
  }

  protected setSources(text: string): void {
    this.patch({ sources: text.split(',').map((t) => t.trim()).filter(Boolean) });
  }

  /** Browse: the browser's folder picker; we keep the folder's name under the home folder. */
  protected addFolder(input: HTMLInputElement): void {
    const folder = input.files?.[0]?.webkitRelativePath.split('/')[0];
    if (folder) this.patch({ sources: [...new Set([...this.draft().sources, `~/${folder}`])] });
    input.value = '';
  }

  protected save(): void {
    const { id, startDate, ...d } = this.draft();
    const fields = { ...d, name: d.name.trim(), days: this.needsDays() ? d.days : [], startDate: toIso(startDate).slice(0, 10) };
    if (id) {
      const s = { ...this.store.schedules().find((x) => x.id === id)!, ...fields };
      this.store.updateSchedule(id, { ...fields, nextRun: nextRunOf(s) });
      toast(`Saved “${fields.name}”`, { description: `Next run ${formatRun(nextRunOf(s))}` });
    } else {
      const created = this.store.addSchedule({ ...fields, enabled: true });
      this.store.updateSchedule(created.id, { nextRun: nextRunOf(created) });
      this.selection.set([created.id]);
      toast(`Created “${fields.name}”`, { description: `First run ${formatRun(nextRunOf(created))}` });
    }
    this.sheetOpen.set(false);
  }

  // --- Keyboard ---------------------------------------------------------------------
  protected onDocumentKey(e: KeyboardEvent): void {
    if (this.sheetOpen()) return;
    if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'n') {
      e.preventDefault();
      this.openNew();
    }
  }

  protected onTableKey(e: KeyboardEvent): void {
    const mod = e.metaKey || e.ctrlKey;
    if (e.key === 'Delete' || (mod && e.key === 'Backspace')) {
      e.preventDefault();
      this.askDelete(this.selected());
    } else if (mod && e.key.toLowerCase() === 'd' && this.single()) {
      e.preventDefault();
      this.duplicate(this.single()!);
    }
  }
}
