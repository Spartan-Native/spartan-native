import { ChangeDetectionStrategy, Component, computed, signal } from '@angular/core';
import { NgIcon, provideIcons } from '@ng-icons/core';
import {
  lucideFile,
  lucideFileArchive,
  lucideFileImage,
  lucideFileSpreadsheet,
  lucideFileText,
} from '@ng-icons/lucide';
import { moduleMetadata, type Meta, type StoryObj } from '@storybook/angular';
import { HlmBadgeImports } from '@spartan-ng/helm/badge';
import { HlmTableImports } from '@spartan-ng/helm/table';
import { SnSelectableImports } from '../lib/selection/selectable';

interface FileRow {
  id: string;
  name: string;
  icon: string;
  size: string;
  modified: string;
  status: string;
  tone: 'success' | 'warning' | 'danger' | 'accent';
}

const FILES: FileRow[] = [
  {
    id: 'budget',
    name: 'Budget 2026.xlsx',
    icon: 'lucideFileSpreadsheet',
    size: '48 KB',
    modified: 'Yesterday',
    status: 'Syncing',
    tone: 'accent',
  },
  {
    id: 'notes',
    name: 'Meeting notes.md',
    icon: 'lucideFileText',
    size: '6 KB',
    modified: 'Today, 08:40',
    status: 'Synced',
    tone: 'success',
  },
  {
    id: 'report',
    name: 'Q4 Report.pdf',
    icon: 'lucideFile',
    size: '2.4 MB',
    modified: 'Today, 09:12',
    status: 'Synced',
    tone: 'success',
  },
  {
    id: 'readme',
    name: 'Readme.md',
    icon: 'lucideFileText',
    size: '2 KB',
    modified: '3 Nov',
    status: 'Synced',
    tone: 'success',
  },
  {
    id: 'roadmap',
    name: 'Roadmap.png',
    icon: 'lucideFileImage',
    size: '1.1 MB',
    modified: 'Monday',
    status: 'Conflict',
    tone: 'warning',
  },
  {
    id: 'archive',
    name: 'Archive.zip',
    icon: 'lucideFileArchive',
    size: '820 MB',
    modified: '12 Oct',
    status: 'Failed',
    tone: 'danger',
  },
];

const HELP =
  'Click · Shift-click · Ctrl/⌘-click · ↑ ↓ Home End · Shift+arrows · Ctrl/⌘+A · Esc · type to jump · Enter / double-click opens';

@Component({
  selector: 'sn-file-list-demo',
  imports: [NgIcon, SnSelectableImports],
  providers: [provideIcons({ lucideFile, lucideFileArchive, lucideFileImage, lucideFileSpreadsheet, lucideFileText })],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="list" snSelectable [(selection)]="selection" (activated)="opened.set($event)" aria-label="Files">
      @for (f of files; track f.id) {
        <div snSelectableItem [value]="f.id" [snSelectableLabel]="f.name">
          <ng-icon [name]="f.icon" />
          <span class="name">{{ f.name }}</span>
          <span class="meta">{{ f.size }}</span>
        </div>
      }
    </div>
    <p class="status">{{ summary() }}</p>
    <p class="help">{{ help }}</p>
  `,
  styles: `
    :host {
      display: flex;
      flex-direction: column;
      gap: 10px;
      max-width: 420px;
    }
    .list {
      display: flex;
      flex-direction: column;
      gap: 1px;
      padding: 6px;
      border-radius: var(--sn-radius-surface);
      background: var(--sn-color-surface-solid);
      box-shadow: var(--sn-shadow-card);
      border: 1px solid var(--sn-color-stroke);
    }
    .name {
      flex: 1;
    }
    /* derive from currentColor, so it stays readable on the selection fill */
    .meta {
      color: color-mix(in srgb, currentColor 62%, transparent);
      font-size: var(--sn-font-size-small);
    }
    .status {
      margin: 0;
      font-size: var(--sn-font-size-small);
    }
    .help {
      margin: 0;
      font-size: var(--sn-font-size-small);
      color: var(--sn-color-fg-muted);
    }
  `,
})
export class FileListDemo {
  protected readonly help = HELP;
  protected readonly files = FILES;
  protected readonly selection = signal<readonly string[]>(['report']);
  protected readonly opened = signal<string | null>(null);
  protected readonly summary = computed(() => {
    const n = this.selection().length;
    const open = this.opened() ? ` · opened ${FILES.find((f) => f.id === this.opened())?.name}` : '';
    return `${n} selected${open}`;
  });
}

@Component({
  selector: 'sn-file-table-demo',
  imports: [HlmBadgeImports, HlmTableImports, SnSelectableImports],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="frame">
      <table hlmTable snSelectable="grid" [(selection)]="selection" (activated)="opened.set($event)" aria-label="Files">
        <thead hlmTHead>
          <tr hlmTr>
            <th hlmTh>Name</th>
            <th hlmTh>Size</th>
            <th hlmTh>Modified</th>
            <th hlmTh>Status</th>
          </tr>
        </thead>
        <tbody hlmTBody>
          @for (f of files; track f.id) {
            <tr hlmTr snSelectableItem [value]="f.id" [snSelectableLabel]="f.name">
              <td hlmTd>{{ f.name }}</td>
              <td hlmTd class="muted">{{ f.size }}</td>
              <td hlmTd class="muted">{{ f.modified }}</td>
              <td hlmTd>
                <span hlmBadge [class]="'sn-tone-' + f.tone">{{ f.status }}</span>
              </td>
            </tr>
          }
        </tbody>
      </table>
    </div>
    <p class="status">{{ selection().length }} selected{{ opened() ? ' · opened ' + opened() : '' }}</p>
    <p class="help">{{ help }}</p>
  `,
  styles: `
    :host {
      display: flex;
      flex-direction: column;
      gap: 10px;
      max-width: 720px;
    }
    .frame {
      border-radius: var(--sn-radius-surface);
      overflow: hidden;
      background: var(--sn-color-surface-solid);
      border: 1px solid var(--sn-color-stroke);
      box-shadow: var(--sn-shadow-card);
    }
    .muted {
      color: color-mix(in srgb, currentColor 62%, transparent);
    }
    .status {
      margin: 0;
      font-size: var(--sn-font-size-small);
    }
    .help {
      margin: 0;
      font-size: var(--sn-font-size-small);
      color: var(--sn-color-fg-muted);
    }
  `,
})
export class FileTableDemo {
  protected readonly help = HELP;
  protected readonly files = FILES;
  protected readonly selection = signal<readonly string[]>(['budget', 'notes']);
  protected readonly opened = signal<string | null>(null);
}

/**
 * The desktop selection model (snSelectable) on a list and on a spartan table.
 * Click into a list, then try the keyboard. Switch the OS: ⌘ replaces Ctrl on macOS,
 * and the selection turns grey when the list loses focus or the window is inactive.
 */
const meta: Meta = {
  title: 'Helm/Selection',
  decorators: [moduleMetadata({ imports: [FileListDemo, FileTableDemo] })],
};
export default meta;

export const List: StoryObj = {
  name: 'List',
  render: () => ({ template: `<div style="padding: 32px"><sn-file-list-demo /></div>` }),
};

export const Table: StoryObj = {
  name: 'Table',
  render: () => ({ template: `<div style="padding: 32px"><sn-file-table-demo /></div>` }),
};
