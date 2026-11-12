import { ChangeDetectionStrategy, Component, input, linkedSignal, signal } from '@angular/core';
import { NgIcon, provideIcons } from '@ng-icons/core';
import { lucideFile, lucideFolder, lucideHardDrive, lucideImage, lucideMusic } from '@ng-icons/lucide';
import { moduleMetadata, type Meta, type StoryObj } from '@storybook/angular';
import { SnTreeImports } from '../lib/controls/tree';

/** The folders in a backup, as Harbor's restore browser shows them. */
@Component({
  selector: 'sn-tree-demo',
  imports: [NgIcon, SnTreeImports],
  providers: [provideIcons({ lucideFile, lucideFolder, lucideHardDrive, lucideImage, lucideMusic })],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="pane">
      <sn-tree
        aria-label="Backup contents"
        [multiple]="multiple()"
        [(selection)]="selection"
        (activated)="opened.set($event)"
      >
        <sn-tree-item value="nas" label="Office NAS" icon="lucideHardDrive" [expanded]="true">
          <sn-tree-item value="docs" label="Documents" icon="lucideFolder" [expanded]="true">
            <sn-tree-item value="taxes" label="Taxes" icon="lucideFolder">
              <sn-tree-item value="taxes/2025" label="2025.pdf" icon="lucideFile" />
              <sn-tree-item value="taxes/2026" label="2026.pdf" icon="lucideFile" />
            </sn-tree-item>
            <sn-tree-item value="work" label="Work" icon="lucideFolder" [expanded]="true">
              <sn-tree-item value="budget" label="Budget 2026.xlsx" icon="lucideFile" />
              <sn-tree-item value="report" label="Q4 Report.pdf" icon="lucideFile" />
            </sn-tree-item>
            <sn-tree-item value="notes" label="Meeting notes.md" icon="lucideFile" />
          </sn-tree-item>
          <sn-tree-item value="photos" label="Photos" icon="lucideImage">
            @if (counts()) {
              <span snTreeItemEnd class="count">1,204</span>
            }
            <sn-tree-item value="photos/2026" label="2026" icon="lucideFolder" />
          </sn-tree-item>
          <sn-tree-item
            value="music"
            label="Music"
            icon="lucideMusic"
            [expandable]="lazy()"
            (expandedChange)="load($event)"
          >
            @if (counts()) {
              <span snTreeItemEnd class="count">312</span>
            }
            @for (album of albums(); track album) {
              <sn-tree-item [value]="'music/' + album" [label]="album" icon="lucideFolder" />
            }
          </sn-tree-item>
        </sn-tree-item>
      </sn-tree>
    </div>
    <p class="note">Selected: {{ selection().join(', ') || 'nothing' }} · opened: {{ opened() ?? '–' }}</p>
  `,
  styles: `
    .pane {
      width: 18rem;
      max-height: 22rem;
      overflow: auto;
      background: var(--sn-content-bg, var(--sn-color-bg));
      border: 1px solid var(--sn-color-border);
      border-radius: var(--sn-radius-surface);
    }
    .count {
      color: var(--sn-color-fg-muted);
      font-size: var(--sn-font-size-small);
    }
    .note {
      margin: 1rem 0 0;
      color: var(--sn-color-fg-muted);
      font-size: var(--sn-font-size-small);
    }
  `,
})
class TreeDemo {
  /** Allow Ctrl/⌘-click and Shift-click selection. */
  readonly multiple = input(false);
  /** Show counts in the trailing slot. */
  readonly counts = input(false);
  /** Music loads its albums when it first opens. */
  readonly lazy = input(false);
  readonly initialSelection = input<string[]>(['budget']);

  protected readonly selection = linkedSignal<readonly string[]>(() => this.initialSelection());
  protected readonly opened = signal<string | null>(null);
  protected readonly albums = linkedSignal(() => (this.lazy() ? [] : ['Jazz', 'Live recordings']));

  protected load(open: boolean): void {
    if (open && this.albums().length === 0) setTimeout(() => this.albums.set(['Jazz', 'Live recordings']), 400);
  }
}

/**
 * A hierarchical list: WinUI TreeView on Windows, NSOutlineView on macOS, a GtkTreeExpander list on GNOME,
 * a Breeze QTreeView on KDE and the Files tree on ChromeOS. Click into it, then use the arrows:
 * → opens, ← closes or goes to the parent, type a name to jump.
 */
const meta: Meta = {
  title: 'Desktop UI/Controls/Tree view',
  decorators: [moduleMetadata({ imports: [TreeDemo] })],
};
export default meta;

const stage = (content: string) => `<div style="padding: 2rem">${content}</div>`;

export const Default: StoryObj = {
  render: () => ({ template: stage(`<sn-tree-demo />`) }),
};

export const MultipleSelection: StoryObj = {
  name: 'Multiple selection',
  render: () => ({
    template: stage(`<sn-tree-demo [multiple]="true" [initialSelection]="['budget', 'report', 'notes']" />`),
  }),
};

export const TrailingContent: StoryObj = {
  name: 'Trailing content and lazy children',
  render: () => ({ template: stage(`<sn-tree-demo [counts]="true" [lazy]="true" [initialSelection]="['photos']" />`) }),
};
