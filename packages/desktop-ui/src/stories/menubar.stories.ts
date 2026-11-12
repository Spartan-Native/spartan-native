import {
  afterNextRender,
  ChangeDetectionStrategy,
  Component,
  computed,
  ElementRef,
  inject,
  input,
  signal,
} from '@angular/core';
import { moduleMetadata, type Meta, type StoryObj } from '@storybook/angular';
import { SnContextMenu } from '../lib/menubar/context-menu';
import type { SnMenuItem } from '../lib/menubar/menu-model';
import { SnMenubar } from '../lib/menubar/menubar';
import { SnTitleBar } from '../lib/window/title-bar';

const FILES = ['Budget 2026.xlsx', 'Q4 Report.pdf', 'Meeting notes.md', 'Roadmap.png'];

/**
 * A Harbor window with its application menu and a context menu on every file. Storybook has no
 * native host, so both are drawn in the page; in a Wails app on macOS the same menu is the global
 * menu bar, and the context menu is the OS's own.
 */
@Component({
  selector: 'sn-menubar-demo',
  imports: [SnContextMenu, SnMenubar, SnTitleBar],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="sn-window window">
      <sn-title-bar title="Harbor Backup" />
      <sn-menubar [menu]="menu()" />
      <div class="content">
        <label class="field">Search <input type="text" value="invoice" /></label>
        <ul class="files" aria-label="Files">
          @for (f of files; track f) {
            <li tabindex="0" [snContextMenu]="fileMenu(f)">{{ f }}</li>
          }
        </ul>
        <p class="log">Last command: {{ log() }} · Paused: {{ paused() ? 'yes' : 'no' }} · View: {{ view() }}</p>
      </div>
    </div>
  `,
  styles: `
    .window {
      max-width: 40rem;
      display: flex;
      flex-direction: column;
      min-height: 20rem;
    }
    .content {
      display: flex;
      flex-direction: column;
      gap: 0.75rem;
      padding: 1rem;
      background: var(--sn-color-bg);
      flex: 1;
    }
    .field {
      display: flex;
      align-items: center;
      gap: 0.5rem;
    }
    .field input {
      font: inherit;
      padding: 0.25rem 0.5rem;
    }
    .files {
      margin: 0;
      padding: 0;
      list-style: none;
    }
    .files li {
      padding: 0.375rem 0.75rem;
      border-radius: var(--sn-list-item-radius);
      outline-offset: -2px;
    }
    .files li:hover {
      background: var(--sn-color-hover);
    }
    .log {
      margin: 0;
      color: var(--sn-color-fg-muted);
      font-size: var(--sn-font-size-small);
    }
  `,
})
class MenubarDemo {
  /** Open the File menu (or a file's context menu) when the story loads. */
  readonly open = input<'none' | 'file' | 'context'>('none');

  protected readonly files = FILES;
  protected readonly log = signal('none');
  protected readonly paused = signal(false);
  protected readonly view = signal<'list' | 'icons'>('list');
  private readonly element = inject<ElementRef<HTMLElement>>(ElementRef).nativeElement;

  protected readonly menu = computed<SnMenuItem[]>(() => [
    { role: 'appMenu' },
    {
      label: 'File',
      submenu: [
        { label: 'New backup…', accelerator: 'mod+n', action: () => this.log.set('New backup') },
        { label: 'Restore files…', accelerator: 'mod+r', action: () => this.log.set('Restore files') },
        { type: 'separator' },
        {
          label: 'Pause backups',
          type: 'checkbox',
          checked: this.paused(),
          action: () => this.paused.update((p) => !p),
        },
        {
          label: 'Export',
          submenu: [
            { label: 'Settings…', action: () => this.log.set('Export settings') },
            { label: 'Log…', action: () => this.log.set('Export log') },
          ],
        },
        { type: 'separator' },
        { role: 'close' },
      ],
    },
    { role: 'editMenu' },
    {
      label: 'View',
      submenu: [
        { label: 'As list', type: 'radio', checked: this.view() === 'list', action: () => this.view.set('list') },
        { label: 'As icons', type: 'radio', checked: this.view() === 'icons', action: () => this.view.set('icons') },
        { type: 'separator' },
        { role: 'toggleFullscreen' },
      ],
    },
    { role: 'windowMenu' },
    { label: 'Help', submenu: [{ label: 'Harbor Help', accelerator: 'f1', action: () => this.log.set('Help') }] },
  ]);

  protected fileMenu(file: string): SnMenuItem[] {
    return [
      { label: 'Restore', action: () => this.log.set(`Restore ${file}`) },
      { label: 'Show versions', action: () => this.log.set(`Versions of ${file}`) },
      { type: 'separator' },
      { label: 'Rename', accelerator: 'f2', action: () => this.log.set(`Rename ${file}`) },
      { label: 'Delete', accelerator: 'delete', action: () => this.log.set(`Delete ${file}`) },
    ];
  }

  constructor() {
    afterNextRender(() => {
      if (this.open() === 'file') {
        this.element.querySelector<HTMLElement>('[data-slot="menubar-trigger"]')?.click();
      }
      if (this.open() === 'context') {
        const item = this.element.querySelector<HTMLElement>('.files li:nth-child(2)')!;
        const rect = item.getBoundingClientRect();
        item.dispatchEvent(
          new MouseEvent('contextmenu', {
            bubbles: true,
            cancelable: true,
            button: 2,
            clientX: rect.left + 60,
            clientY: rect.top + rect.height / 2,
          }),
        );
      }
    });
  }
}

/**
 * The application menu and context menus, from one menu definition. With a native host (Wails on
 * macOS) the menu bar is the system's global one and the context menus are the OS's; elsewhere they
 * are drawn in the page with the skin's menu styles. Try the shortcuts (Ctrl/⌘+N), F10, and
 * right-click a file.
 */
const meta: Meta = {
  title: 'Desktop UI/Window/Menubar',
  decorators: [moduleMetadata({ imports: [MenubarDemo] })],
};
export default meta;

const stage = (content: string) => `<div style="padding: 2rem; min-height: 26rem">${content}</div>`;

export const InAWindow: StoryObj = {
  name: 'In a window',
  render: () => ({ template: stage(`<sn-menubar-demo />`) }),
};

export const OpenMenu: StoryObj = {
  name: 'Open menu',
  render: () => ({ template: stage(`<sn-menubar-demo open="file" />`) }),
};

export const ContextMenu: StoryObj = {
  name: 'Context menu',
  render: () => ({ template: stage(`<sn-menubar-demo open="context" />`) }),
};
