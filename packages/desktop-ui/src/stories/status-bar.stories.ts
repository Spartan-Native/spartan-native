import { ChangeDetectionStrategy, Component, computed, input, signal } from '@angular/core';
import { NgIcon, provideIcons } from '@ng-icons/core';
import { lucideFile, lucideFileImage, lucideFileSpreadsheet, lucideFileText, lucideLoader } from '@ng-icons/lucide';
import { moduleMetadata, type Meta, type StoryObj } from '@storybook/angular';
import { HlmProgressImports } from '@spartan-ng/helm/progress';
import { SnStatusBarImports } from '../lib/window/status-bar';
import { SnTitleBar } from '../lib/window/title-bar';

const FILES = [
  { name: 'Budget 2026.xlsx', size: 48, icon: 'lucideFileSpreadsheet' },
  { name: 'Q4 Report.pdf', size: 2400, icon: 'lucideFileText' },
  { name: 'Meeting notes.md', size: 6, icon: 'lucideFile' },
  { name: 'Roadmap.png', size: 1100, icon: 'lucideFileImage' },
];

const kb = (n: number) => (n >= 1000 ? `${(n / 1000).toFixed(1)} MB` : `${n} KB`);

/** A Harbor window: a file list with the status bar under it. Click files to change the counts. */
@Component({
  selector: 'sn-status-bar-demo',
  imports: [HlmProgressImports, NgIcon, SnStatusBarImports, SnTitleBar],
  providers: [provideIcons({ lucideFile, lucideFileImage, lucideFileSpreadsheet, lucideFileText, lucideLoader })],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="sn-window window">
      <sn-title-bar title="Harbor Backup" subtitle="Office NAS" />
      <ul class="files" aria-label="Files">
        @for (f of files; track f.name) {
          <li>
            <button type="button" class="file" [attr.aria-pressed]="selected().has(f.name)" (click)="toggle(f.name)">
              <ng-icon [name]="f.icon" aria-hidden="true" />
              <span class="name">{{ f.name }}</span>
              <span class="size">{{ size(f.size) }}</span>
            </button>
          </li>
        }
      </ul>
      <sn-status-bar>
        <span snStatusItem>{{ files.length }} items</span>
        @if (selected().size) {
          <span snStatusItem>{{ selected().size }} selected · {{ size(selectedSize()) }}</span>
        }
        @if (progress()) {
          <span snStatusItem live><ng-icon name="lucideLoader" aria-hidden="true" /> Backing up… 62 %</span>
        }
        @if (progress()) {
          <span snStatusItem snStatusBarEnd>
            <hlm-progress class="meter" [value]="62" aria-label="Backup progress"><hlm-progress-indicator /></hlm-progress>
          </span>
        }
        <span snStatusItem snStatusBarEnd>1.2 TB free</span>
      </sn-status-bar>
    </div>
  `,
  styles: `
    .window { max-width: 40rem; display: flex; flex-direction: column; }
    .files { margin: 0; padding: 0.5rem; list-style: none; background: var(--sn-color-bg); min-height: 11rem; }
    .file {
      all: unset; box-sizing: border-box; display: flex; align-items: center; gap: 0.75rem; width: 100%;
      min-height: var(--sn-row-height); padding-inline: 0.75rem; border-radius: var(--sn-list-item-radius);
    }
    .file:hover { background: var(--sn-color-hover); }
    .file[aria-pressed='true'] { background: var(--sn-row-selected-bg); color: var(--sn-row-selected-fg); }
    .file:focus-visible { outline: var(--sn-row-focus-ring); outline-offset: -2px; }
    .file ng-icon { font-size: 1.125rem; color: var(--sn-color-fg-muted); }
    .name { flex: 1; }
    .size { color: var(--sn-color-fg-muted); font-size: var(--sn-font-size-small); }
    .meter { width: 6rem; }
  `,
})
class StatusBarDemo {
  /** Show a running backup: a live item and a progress bar at the end. */
  readonly progress = input(false);
  /** The files selected at first. */
  readonly initialSelection = input<string[]>(['Budget 2026.xlsx']);

  protected readonly files = FILES;
  protected readonly size = kb;
  protected readonly picked = signal<Set<string> | null>(null);
  protected readonly selected = computed(() => this.picked() ?? new Set(this.initialSelection()));
  protected readonly selectedSize = computed(() =>
    FILES.filter((f) => this.selected().has(f.name)).reduce((sum, f) => sum + f.size, 0),
  );

  protected toggle(name: string): void {
    const next = new Set(this.selected());
    if (next.has(name)) next.delete(name);
    else next.add(name);
    this.picked.set(next);
  }
}

/**
 * The window's status bar: File Explorer's on Windows 11, the classic ruled bar on Windows 10, Finder's
 * centered text on macOS, a GtkActionBar on GNOME, Dolphin's on KDE and a slim footer on ChromeOS.
 */
const meta: Meta = {
  title: 'Desktop UI/Window/Status bar',
  decorators: [moduleMetadata({ imports: [StatusBarDemo] })],
};
export default meta;

export const Default: StoryObj = {
  render: () => ({ template: `<div style="padding: 2rem"><sn-status-bar-demo /></div>` }),
};

export const WithProgress: StoryObj = {
  name: 'With progress',
  render: () => ({ template: `<div style="padding: 2rem"><sn-status-bar-demo [progress]="true" /></div>` }),
};

export const NothingSelected: StoryObj = {
  name: 'Nothing selected',
  render: () => ({ template: `<div style="padding: 2rem"><sn-status-bar-demo [initialSelection]="[]" /></div>` }),
};
