import { ChangeDetectionStrategy, Component, computed, input, linkedSignal, signal } from '@angular/core';
import { NgIcon, provideIcons } from '@ng-icons/core';
import {
  lucideFile,
  lucideFileImage,
  lucideFileSpreadsheet,
  lucideFileText,
  lucideFolderInput,
  lucideInfo,
  lucideLink,
  lucidePencil,
  lucidePlus,
  lucideShare2,
  lucideTrash2,
} from '@ng-icons/lucide';
import { moduleMetadata, type Meta, type StoryObj } from '@storybook/angular';
import { HlmDropdownMenuImports } from '@spartan-ng/helm/dropdown-menu';
import { injectSkin, skinFamily } from '@spartan-native/theme';
import { SnCommandBarImports } from '../lib/patterns/command-bar';
import { SnTitleBar } from '../lib/window/title-bar';
import { SnWindowControls } from '../lib/window/window-controls';

interface DocFile {
  name: string;
  size: string;
  icon: string;
}

const FILES: DocFile[] = [
  { name: 'Budget 2026.xlsx', size: '48 KB', icon: 'lucideFileSpreadsheet' },
  { name: 'Q4 Report.pdf', size: '2.4 MB', icon: 'lucideFileText' },
  { name: 'Meeting notes.md', size: '6 KB', icon: 'lucideFile' },
  { name: 'Roadmap.png', size: '1.1 MB', icon: 'lucideFileImage' },
];

/**
 * A Harbor window: the "Documents" command bar over the file list. On macOS and GNOME the
 * command bar is the title bar (unified toolbar / header bar), so it carries the window controls;
 * elsewhere a title bar sits above it.
 */
@Component({
  selector: 'sn-command-bar-demo',
  imports: [HlmDropdownMenuImports, NgIcon, SnCommandBarImports, SnTitleBar, SnWindowControls],
  providers: [
    provideIcons({
      lucideFile,
      lucideFileImage,
      lucideFileSpreadsheet,
      lucideFileText,
      lucideFolderInput,
      lucideInfo,
      lucideLink,
      lucidePencil,
      lucidePlus,
      lucideShare2,
      lucideTrash2,
    }),
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="sn-window window">
      @if (!unified()) {
        <sn-title-bar title="Harbor Backup" />
      }
      <sn-command-bar title="Documents">
        @if (family() === 'macos') {
          <sn-window-controls snCommandBarStart />
        }
        <button snCommand icon="lucidePlus" label="New" (click)="create()"></button>
        <button snCommand icon="lucideShare2" label="Share" [disabled]="!selected()" (click)="log.set('Shared ' + selected())"></button>
        <button snCommand icon="lucideTrash2" label="Delete" [disabled]="!selected()" (click)="remove()"></button>
        @if (overflow()) {
          <ng-template snCommandOverflow>
            <div hlmDropdownMenu class="menu">
              <button hlmDropdownMenuItem [disabled]="!selected()" (triggered)="log.set('Rename')"><ng-icon name="lucidePencil" /> Rename</button>
              <button hlmDropdownMenuItem [disabled]="!selected()" (triggered)="log.set('Copy link')"><ng-icon name="lucideLink" /> Copy link</button>
              <button hlmDropdownMenuItem [disabled]="!selected()" (triggered)="log.set('Move to…')"><ng-icon name="lucideFolderInput" /> Move to…</button>
              <hlm-dropdown-menu-separator />
              <button hlmDropdownMenuItem (triggered)="log.set('Properties')"><ng-icon name="lucideInfo" /> Properties</button>
            </div>
          </ng-template>
        }
        @if (family() !== 'macos' && unified()) {
          <sn-window-controls snCommandBarEnd />
        }
      </sn-command-bar>
      <ul class="files" aria-label="Documents">
        @for (f of files(); track f.name) {
          <li>
            <button type="button" class="file" [attr.aria-pressed]="selected() === f.name" (click)="selected.set(selected() === f.name ? '' : f.name)">
              <ng-icon [name]="f.icon" aria-hidden="true" />
              <span class="name">{{ f.name }}</span>
              <span class="size">{{ f.size }}</span>
            </button>
          </li>
        }
      </ul>
      <p class="status">{{ selected() || 'Nothing selected' }} · {{ log() }}</p>
    </div>
  `,
  styles: `
    .window { max-width: 40rem; display: flex; flex-direction: column; }
    .files { margin: 0; padding: 0.5rem; list-style: none; background: var(--sn-color-bg); min-height: 12rem; }
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
    .status { margin: 0; padding: 0.375rem 1rem; font-size: var(--sn-font-size-small); color: var(--sn-color-fg-muted); background: var(--sn-color-bg); border-top: 1px solid var(--sn-color-border); }
    .menu { min-width: 12rem; }
  `,
})
class CommandBarDemo {
  /** Show the overflow menu with secondary commands. */
  readonly overflow = input(false);
  /** The file selected at first: none disables Share and Delete. */
  readonly initialSelection = input('Budget 2026.xlsx');

  private readonly skin = injectSkin();
  protected readonly family = computed(() => skinFamily(this.skin()));
  /** macOS unified toolbar and GNOME header bar double as the title bar. */
  protected readonly unified = computed(() => this.family() === 'macos' || this.skin() === 'gtk' || this.skin() === 'web');
  protected readonly files = signal(FILES);
  protected readonly selected = linkedSignal(() => this.initialSelection());
  protected readonly log = signal('no command yet');

  protected create(): void {
    const name = `Untitled ${this.files().length + 1}.md`;
    this.files.update((list) => [...list, { name, size: '0 KB', icon: 'lucideFile' }]);
    this.selected.set(name);
    this.log.set('New');
  }

  protected remove(): void {
    const name = this.selected();
    this.files.update((list) => list.filter((f) => f.name !== name));
    this.selected.set('');
    this.log.set('Deleted ' + name);
  }
}

/**
 * The window's command surface: a CommandBar on Windows, a unified toolbar on macOS, an
 * AdwHeaderBar on GNOME, a KToolBar on KDE and a top app bar on ChromeOS, from the same markup.
 * Switch the OS in the toolbar. Tab into the bar, then use ← → Home End.
 */
const meta: Meta = {
  title: 'Desktop UI/Patterns/Command bar',
  decorators: [moduleMetadata({ imports: [CommandBarDemo] })],
};
export default meta;

export const InAWindow: StoryObj = {
  name: 'In a window',
  render: () => ({ template: `<div style="padding: 2rem"><sn-command-bar-demo /></div>` }),
};

export const WithOverflow: StoryObj = {
  name: 'With overflow commands',
  render: () => ({ template: `<div style="padding: 2rem; min-height: 22rem"><sn-command-bar-demo [overflow]="true" /></div>` }),
};

export const DisabledCommands: StoryObj = {
  name: 'Disabled commands',
  render: () => ({ template: `<div style="padding: 2rem"><sn-command-bar-demo initialSelection="" [overflow]="true" /></div>` }),
};
