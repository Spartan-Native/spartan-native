import { ChangeDetectionStrategy, Component, computed, input, signal } from '@angular/core';
import { NgIcon, provideIcons } from '@ng-icons/core';
import {
  lucideClock,
  lucideCloud,
  lucideFileArchive,
  lucideFileImage,
  lucideFileSpreadsheet,
  lucideFileText,
  lucideHistory,
  lucideHouse,
  lucideInfo,
  lucideServer,
  lucideSettings,
  lucideUsb,
} from '@ng-icons/lucide';
import { moduleMetadata, type Meta, type StoryObj } from '@storybook/angular';
import { SnSelectableImports } from '@spartan-native/helm';
import { HlmButtonImports } from '@spartan-ng/helm/button';
import { HlmSwitchImports } from '@spartan-ng/helm/switch';
import { SnInspectorImports } from '../lib/patterns/inspector';
import { SnSidebarNavImports } from '../lib/patterns/sidebar-nav';
import { SnTitleBar } from '../lib/window/title-bar';

interface BackupFile {
  id: string;
  name: string;
  icon: string;
  kind: string;
  size: string;
  modified: string;
}

const FILES: BackupFile[] = [
  { id: 'report', name: 'Q3 report.pdf', icon: 'lucideFileText', kind: 'PDF document', size: '2.4 MB', modified: 'Today, 09:12' },
  { id: 'budget', name: 'Budget 2026.xlsx', icon: 'lucideFileSpreadsheet', kind: 'Excel spreadsheet', size: '48 KB', modified: 'Yesterday, 17:40' },
  { id: 'notes', name: 'Meeting notes.md', icon: 'lucideFileText', kind: 'Markdown text', size: '6 KB', modified: 'Today, 08:40' },
  { id: 'roadmap', name: 'Roadmap.png', icon: 'lucideFileImage', kind: 'PNG image', size: '1.1 MB', modified: 'Monday, 14:05' },
  { id: 'photos', name: 'Photos 2025.zip', icon: 'lucideFileArchive', kind: 'ZIP archive', size: '820 MB', modified: '12 Oct, 11:30' },
];

const ICONS = {
  lucideClock,
  lucideCloud,
  lucideFileArchive,
  lucideFileImage,
  lucideFileSpreadsheet,
  lucideFileText,
  lucideHistory,
  lucideHouse,
  lucideInfo,
  lucideServer,
  lucideSettings,
  lucideUsb,
};

/** The file list and its inspector: the content of the Harbor "Files" page. */
@Component({
  selector: 'sn-inspector-files-demo',
  imports: [HlmButtonImports, HlmSwitchImports, NgIcon, SnInspectorImports, SnSelectableImports],
  providers: [provideIcons(ICONS)],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <sn-inspector-layout>
      <div class="toolbar">
        <h1>Documents</h1>
        <button hlmBtn variant="ghost" size="icon-sm" aria-label="Show details" [attr.aria-pressed]="open()" (click)="open.set(!open())">
          <ng-icon name="lucideInfo" />
        </button>
      </div>
      <div class="list" snSelectable [multiple]="false" [(selection)]="selection" aria-label="Files">
        @for (f of files; track f.id) {
          <div snSelectableItem [value]="f.id" [snSelectableLabel]="f.name">
            <ng-icon [name]="f.icon" />
            <span class="name">{{ f.name }}</span>
            <span class="meta">{{ f.size }}</span>
          </div>
        }
      </div>

      <sn-inspector [(open)]="open" [title]="file()?.name ?? 'No selection'" [icon]="file()?.icon ?? ''">
        @if (file(); as f) {
          <sn-inspector-section title="General">
            <sn-inspector-property label="Kind">{{ f.kind }}</sn-inspector-property>
            <sn-inspector-property label="Size">{{ f.size }}</sn-inspector-property>
            <sn-inspector-property label="Modified">{{ f.modified }}</sn-inspector-property>
          </sn-inspector-section>
          <sn-inspector-section title="Backup">
            <div class="control-row">
              <span id="keep-offline">Keep offline</span>
              <hlm-switch aria-labelledby="keep-offline" [checked]="offline().has(f.id)" (checkedChange)="setOffline(f.id, $event)" />
            </div>
            <button hlmBtn variant="outline" size="sm" class="versions">Show versions</button>
          </sn-inspector-section>
        } @else {
          <p class="empty">Select a file to see its details.</p>
        }
      </sn-inspector>
    </sn-inspector-layout>
  `,
  styles: `
    :host { display: flex; flex-direction: column; min-height: 0; height: 100%; }
    sn-inspector-layout { flex: 1; }
    .toolbar { display: flex; align-items: center; gap: 0.5rem; padding: 0.75rem 1rem 0.25rem; }
    h1 { flex: 1; margin: 0; font-size: var(--sn-font-size); font-weight: var(--sn-font-weight-strong); }
    .list { display: flex; flex-direction: column; gap: 1px; padding: 0.5rem; outline: none; cursor: default; user-select: none; }
    .list:focus-within [data-selected] .meta { color: inherit; }
    .name { flex: 1; min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
    .meta { color: var(--sn-color-fg-muted); font-size: var(--sn-font-size-small); }
    .control-row { display: flex; align-items: center; justify-content: space-between; gap: 0.75rem; min-height: 2rem; }
    .versions { align-self: flex-start; margin-top: 0.25rem; }
    .empty { margin: 0; color: var(--sn-color-fg-muted); }
  `,
})
class InspectorFilesDemo {
  protected readonly files = FILES;
  protected readonly selection = signal<readonly string[]>(['report']);
  protected readonly file = computed(() => FILES.find((f) => f.id === this.selection()[0]));
  protected readonly offline = signal(new Set(['report']));
  readonly open = signal(true);

  protected setOffline(id: string, on: boolean): void {
    this.offline.update((s) => {
      const next = new Set(s);
      if (on) next.add(id);
      else next.delete(id);
      return next;
    });
  }
}

@Component({
  selector: 'sn-inspector-demo',
  imports: [InspectorFilesDemo],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="sn-window frame" [style.max-width]="width()">
      <main class="sn-content content"><sn-inspector-files-demo /></main>
    </div>
  `,
  styles: `
    .frame { display: flex; height: 26rem; }
    .content { flex: 1; min-width: 0; display: flex; flex-direction: column; }
  `,
})
class InspectorDemo {
  readonly width = input('48rem');
}

/** Sidebar, file list and inspector together in a Harbor window. */
@Component({
  selector: 'sn-inspector-window-demo',
  imports: [InspectorFilesDemo, SnSidebarNavImports, SnTitleBar],
  providers: [provideIcons(ICONS)],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="sn-window frame">
      <sn-title-bar title="Harbor Backup" subtitle="Documents" />
      <div class="body">
        <sn-sidebar-nav aria-label="Sections">
          <sn-sidebar-section title="Backups">
            <button snSidebarItem icon="lucideHouse" [active]="page() === 'Overview'" (click)="page.set('Overview')">Overview</button>
            <button snSidebarItem icon="lucideClock" [active]="page() === 'Schedules'" (click)="page.set('Schedules')">Schedules</button>
            <button snSidebarItem icon="lucideHistory" badge="3" [active]="page() === 'Restore files'" (click)="page.set('Restore files')">Restore files</button>
          </sn-sidebar-section>
          <sn-sidebar-section title="Destinations">
            <button snSidebarItem icon="lucideServer" [active]="page() === 'Office NAS'" (click)="page.set('Office NAS')">Office NAS</button>
            <button snSidebarItem icon="lucideUsb" [active]="page() === 'Backup drive'" (click)="page.set('Backup drive')">Backup drive</button>
            <button snSidebarItem icon="lucideCloud" [active]="page() === 'Cloud'" (click)="page.set('Cloud')">Cloud</button>
          </sn-sidebar-section>
          <sn-sidebar-section>
            <button snSidebarItem icon="lucideSettings" [active]="page() === 'Settings'" (click)="page.set('Settings')">Settings</button>
          </sn-sidebar-section>
        </sn-sidebar-nav>
        <main class="sn-content content"><sn-inspector-files-demo /></main>
      </div>
    </div>
  `,
  styles: `
    .frame { display: flex; flex-direction: column; max-width: 64rem; height: 34rem; }
    .body { display: flex; flex: 1; min-height: 0; }
    .content { flex: 1; min-width: 0; display: flex; flex-direction: column; }
  `,
})
class InspectorWindowDemo {
  protected readonly page = signal('Office NAS');
}

/**
 * The detail side panel. Click into the list and use ↑ ↓ Home End or type a name:
 * the inspector follows the selection. Switch the OS in the toolbar; narrow the frame
 * (the Narrow story) and the panel floats over the list.
 */
const meta: Meta = {
  title: 'Desktop UI/Patterns/Inspector',
  decorators: [moduleMetadata({ imports: [InspectorDemo, InspectorWindowDemo] })],
};
export default meta;

export const Default: StoryObj = {
  name: 'File list with inspector',
  render: () => ({ template: `<div style="padding: 2rem"><sn-inspector-demo /></div>` }),
};

export const Narrow: StoryObj = {
  name: 'Narrow (overlay)',
  render: () => ({ template: `<div style="padding: 2rem"><sn-inspector-demo width="34rem" /></div>` }),
};

export const InWindow: StoryObj = {
  name: 'In a window, with sidebar',
  render: () => ({ template: `<div style="padding: 2rem"><sn-inspector-window-demo /></div>` }),
};
