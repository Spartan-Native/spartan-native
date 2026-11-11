import { ChangeDetectionStrategy, Component, computed, DestroyRef, inject, signal } from '@angular/core';
import { NgIcon, provideIcons } from '@ng-icons/core';
import {
  lucideCopy,
  lucideFileArchive,
  lucideFileImage,
  lucideFiles,
  lucideFileSpreadsheet,
  lucideFileText,
  lucideFolder,
  lucideFolderInput,
  lucideFolderOpen,
  lucideFolderX,
  lucideHistory,
  lucideInfo,
  lucideRotateCcw,
} from '@ng-icons/lucide';
import { SnInspectorImports, SnModalSheet, SnPlatformImports } from '@spartan-native/desktop-ui';
import { SnSelectableImports } from '@spartan-native/helm';
import { toast } from '@spartan-ng/brain/sonner';
import { HlmAlertImports } from '@spartan-ng/helm/alert';
import { HlmAutocompleteImports } from '@spartan-ng/helm/autocomplete';
import { HlmBadgeImports } from '@spartan-ng/helm/badge';
import { HlmBreadcrumbImports } from '@spartan-ng/helm/breadcrumb';
import { HlmButtonImports } from '@spartan-ng/helm/button';
import { HlmContextMenuImports } from '@spartan-ng/helm/context-menu';
import { HlmDropdownMenuImports } from '@spartan-ng/helm/dropdown-menu';
import { HlmEmptyImports } from '@spartan-ng/helm/empty';
import { HlmInputGroupImports } from '@spartan-ng/helm/input-group';
import { HlmItemImports } from '@spartan-ng/helm/item';
import { HlmKbdImports } from '@spartan-ng/helm/kbd';
import { HlmLabelImports } from '@spartan-ng/helm/label';
import { HlmProgressImports } from '@spartan-ng/helm/progress';
import { HlmRadioGroupImports } from '@spartan-ng/helm/radio-group';
import { HlmResizableImports } from '@spartan-ng/helm/resizable';
import { HlmScrollAreaImports } from '@spartan-ng/helm/scroll-area';
import { HlmSelectImports } from '@spartan-ng/helm/select';
import { HlmSkeletonImports } from '@spartan-ng/helm/skeleton';
import { HlmTableImports } from '@spartan-ng/helm/table';
import { NgScrollbar } from 'ngx-scrollbar';
import { type FileEntry, formatSize, HarborStore, type Snapshot } from '../../data/harbor-store';

type Conflict = 'keep' | 'replace' | 'skip';

/** Files created after the oldest snapshot: they are missing from snapshots taken before this one. */
const FIRST_SNAPSHOT: Record<string, string> = { f4: 's2', f5: 's2', f6: 's2', f8: 's2', f9: 's2' };

const KIND_ICON: Record<string, string> = {
  Spreadsheet: 'lucideFileSpreadsheet',
  'PNG image': 'lucideFileImage',
  'ZIP archive': 'lucideFileArchive',
};

const CONFLICT_LABEL: Record<Conflict, string> = { keep: 'kept both copies', replace: 'replaced existing files', skip: 'skipped existing files' };

/** Restore files: browse a snapshot (folders, files, versions) and restore files from it. */
@Component({
  selector: 'harbor-restore',
  imports: [
    HlmAlertImports,
    HlmAutocompleteImports,
    HlmBadgeImports,
    HlmBreadcrumbImports,
    HlmButtonImports,
    HlmContextMenuImports,
    HlmDropdownMenuImports,
    HlmEmptyImports,
    HlmInputGroupImports,
    HlmItemImports,
    HlmKbdImports,
    HlmLabelImports,
    HlmProgressImports,
    HlmRadioGroupImports,
    HlmResizableImports,
    HlmScrollAreaImports,
    HlmSelectImports,
    HlmSkeletonImports,
    HlmTableImports,
    NgIcon,
    NgScrollbar,
    SnInspectorImports,
    SnModalSheet,
    SnPlatformImports,
    SnSelectableImports,
  ],
  providers: [
    provideIcons({
      lucideCopy,
      lucideFileArchive,
      lucideFileImage,
      lucideFiles,
      lucideFileSpreadsheet,
      lucideFileText,
      lucideFolder,
      lucideFolderInput,
      lucideFolderOpen,
      lucideFolderX,
      lucideHistory,
      lucideInfo,
      lucideRotateCcw,
    }),
  ],
  templateUrl: './restore.html',
  styleUrl: './restore.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HarborRestore {
  protected readonly store = inject(HarborStore);
  protected readonly formatSize = formatSize;

  // --- Snapshot ----------------------------------------------------------------------
  protected readonly snapshotId = signal(this.store.snapshots()[0].id);
  protected readonly snapshot = computed(() => this.snapshotById(this.snapshotId()) ?? this.store.snapshots()[0]);
  protected readonly isLatest = computed(() => this.snapshotId() === this.store.snapshots()[0].id);
  /** A short pause after switching snapshots, as if the index were loading. Starts false for stable screenshots. */
  protected readonly loading = signal(false);
  protected readonly snapshotLabel = (id: string) => this.snapshotById(id)?.label ?? '';

  /** Files present in the chosen snapshot. */
  protected readonly snapshotFiles = computed(() => this.store.files.filter((f) => this.inSnapshot(f, this.snapshot())));

  // --- Folders -----------------------------------------------------------------------
  /** Every folder and its parents ("Documents", "Documents/Finance", …), as tree rows. */
  protected readonly tree = computed(() => {
    const paths = new Set<string>();
    for (const folder of this.store.folders()) {
      const parts = folder.split('/');
      parts.forEach((_, i) => paths.add(parts.slice(0, i + 1).join('/')));
    }
    return [...paths].sort().map((path) => ({
      path,
      name: path.split('/').at(-1)!,
      depth: path.split('/').length - 1,
      count: this.snapshotFiles().filter((f) => this.isUnder(f, path)).length,
    }));
  });
  protected readonly folderSelection = signal<readonly string[]>(['Documents/Finance']);
  protected readonly folder = computed(() => this.folderSelection()[0] ?? 'Documents');
  protected readonly crumbs = computed(() => {
    const parts = this.folder().split('/');
    return parts.map((name, i) => ({ name, path: parts.slice(0, i + 1).join('/') }));
  });

  // --- Files ---------------------------------------------------------------------------
  protected readonly files = computed(() => this.snapshotFiles().filter((f) => this.isUnder(f, this.folder())));
  protected readonly filesSize = computed(() => formatSize(this.files().reduce((sum, f) => sum + f.sizeKb, 0)));
  protected readonly selection = signal<readonly string[]>(['f1']);
  protected readonly selected = computed(() => this.files().filter((f) => this.selection().includes(f.id)));
  protected readonly file = computed(() => (this.selected().length === 1 ? this.selected()[0] : undefined));
  /** Versions of the inspected file: snapshots up to the chosen one that contain it, newest first. */
  protected readonly versions = computed(() => {
    const f = this.file();
    if (!f) return [];
    const at = this.snapshot().at;
    return this.store.snapshots()
      .filter((s) => s.at <= at && this.inSnapshot(f, s))
      .slice(0, f.versions);
  });
  // Closed at first, like the Explorer and Finder details panes: the window is too narrow for three
  // panes at full width. The info button, Enter or a double-click opens it.
  protected readonly infoOpen = signal(false);

  // --- Search ----------------------------------------------------------------------------
  protected readonly search = signal('');
  protected readonly matches = computed(() => {
    const q = this.search().trim().toLowerCase();
    return this.snapshotFiles().filter((f) => `${f.folder}/${f.name}`.toLowerCase().includes(q));
  });
  protected readonly fileName = (f: FileEntry) => f.name;

  // --- Restore -----------------------------------------------------------------------------
  protected readonly restoring = signal<{ title: string; progress: number } | null>(null);
  protected readonly sheetOpen = signal(false);
  protected readonly target = signal('~/Restored files');
  protected readonly conflict = signal<Conflict>('keep');
  /** What the open "Restore to…" sheet will restore. */
  private pending: { ids: readonly string[]; version?: Snapshot } = { ids: [] };
  private timer?: ReturnType<typeof setInterval>;
  private loadTimer?: ReturnType<typeof setTimeout>;

  constructor() {
    inject(DestroyRef).onDestroy(() => {
      clearInterval(this.timer);
      clearTimeout(this.loadTimer);
    });
  }

  protected iconFor(f: FileEntry): string {
    return KIND_ICON[f.kind] ?? 'lucideFileText';
  }

  protected destinationName(s: Snapshot): string {
    return this.store.destination(s.destinationId)?.name ?? 'Unknown destination';
  }

  protected pickSnapshot(id: unknown): void {
    if (typeof id !== 'string' || id === this.snapshotId()) return;
    this.snapshotId.set(id);
    this.loading.set(true);
    clearTimeout(this.loadTimer);
    this.loadTimer = setTimeout(() => this.loading.set(false), 600);
  }

  protected openFolder(path: string | undefined): void {
    // Esc clears the list's selection; keep the current folder (a new array re-selects its row)
    this.folderSelection.set([path ?? this.folder()]);
    const first = this.files()[0];
    this.selection.set(first ? [first.id] : []);
  }

  protected findFile(value: unknown): void {
    const f = value as FileEntry | null;
    if (!f) return;
    this.folderSelection.set([f.folder]);
    this.selection.set([f.id]);
    this.infoOpen.set(true);
  }

  /** Right-click selects the row first unless it is already part of the selection (Finder, Explorer). */
  protected onContextMenu(f: FileEntry): void {
    if (!this.selection().includes(f.id)) this.selection.set([f.id]);
  }

  protected onListKeydown(e: KeyboardEvent): void {
    if (!(e.metaKey || e.ctrlKey) || e.key.toLowerCase() !== 'r' || !this.selected().length) return;
    e.preventDefault();
    if (e.shiftKey) this.openRestoreTo();
    else this.restore(this.selection());
  }

  protected copyPath(f: FileEntry): void {
    const path = `${f.folder}/${f.name}`;
    navigator.clipboard?.writeText(path).catch(() => undefined);
    toast('Path copied', { description: path });
  }

  protected openRestoreTo(version?: Snapshot): void {
    this.pending = { ids: this.selected().map((f) => f.id), version };
    this.sheetOpen.set(true);
  }

  protected confirmRestoreTo(): void {
    const target = this.target().trim();
    if (!target) return;
    this.sheetOpen.set(false);
    this.restore(this.pending.ids, this.pending.version, target);
  }

  protected restore(ids: readonly string[], version = this.snapshot(), target?: string): void {
    const files = this.store.files.filter((f) => ids.includes(f.id));
    if (!files.length || this.restoring()) return;
    const what = files.length === 1 ? `“${files[0].name}”` : `${files.length} files`;
    const where = target ?? 'original location';
    this.restoring.set({ title: `Restoring ${what} to ${where}`, progress: 0 });
    this.timer = setInterval(() => {
      const r = this.restoring();
      if (!r) return clearInterval(this.timer);
      if (r.progress + 20 < 100) {
        this.restoring.set({ ...r, progress: r.progress + 20 });
        return;
      }
      clearInterval(this.timer);
      this.restoring.set(null);
      const how = target ? ` · ${CONFLICT_LABEL[this.conflict()]}` : '';
      toast.success(`Restored ${what}`, { description: `From ${version.label} to ${where}${how}` });
      this.store.activity.update((list) => [
        { title: `Restored ${what}`, detail: `${version.label} → ${where}`, status: 'Restored', tone: 'success' },
        ...list,
      ]);
    }, 250);
  }

  private snapshotById(id: string): Snapshot | undefined {
    return this.store.snapshots().find((s) => s.id === id);
  }

  private inSnapshot(f: FileEntry, s: Snapshot): boolean {
    const first = FIRST_SNAPSHOT[f.id] && this.snapshotById(FIRST_SNAPSHOT[f.id]);
    return !first || first.at <= s.at;
  }

  private isUnder(f: FileEntry, path: string): boolean {
    return f.folder === path || f.folder.startsWith(path + '/');
  }
}
