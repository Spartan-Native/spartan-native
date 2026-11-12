import { ChangeDetectionStrategy, Component, input, linkedSignal, signal } from '@angular/core';
import { moduleMetadata, type Meta, type StoryObj } from '@storybook/angular';
import { HlmButtonImports } from '@spartan-ng/helm/button';
import { HlmInputImports } from '@spartan-ng/helm/input';
import { HlmLabelImports } from '@spartan-ng/helm/label';
import { HlmSelectImports } from '@spartan-ng/helm/select';
import { HlmSwitchImports } from '@spartan-ng/helm/switch';
import { SnModalSheet } from '../lib/patterns/modal-sheet';
import { SnTitleBar } from '../lib/window/title-bar';

/** A Harbor window (title bar + destinations list) that owns the sheet, so the macOS sheet hangs from its title bar. */
@Component({
  selector: 'sn-modal-sheet-demo',
  imports: [
    HlmButtonImports,
    HlmInputImports,
    HlmLabelImports,
    HlmSelectImports,
    HlmSwitchImports,
    SnModalSheet,
    SnTitleBar,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="sn-window window" snSheetHost>
      <sn-title-bar title="Harbor Backup" />
      <div class="body">
        <ul>
          @for (d of destinations(); track d) {
            <li>
              <span>{{ d }}</span>
              <button hlmBtn variant="ghost" size="sm" (click)="removing.set(d); open.set(true)">Remove</button>
            </li>
          }
        </ul>
        <button hlmBtn (click)="removing.set(''); open.set(true)">Add destination</button>
      </div>

      @if (removing()) {
        <sn-modal-sheet [(open)]="open" role="alertdialog" [title]="'Remove ' + removing() + '?'">
          <p class="text">Backups already on this destination stay there, but Harbor stops backing up to it.</p>
          <button hlmBtn variant="outline" snSheetCancel>Cancel</button>
          <button hlmBtn variant="destructive" snSheetPrimary (click)="remove()">Remove</button>
        </sn-modal-sheet>
      } @else {
        <sn-modal-sheet [(open)]="open" title="New destination">
          <div class="field">
            <label hlmLabel for="dest-name">Name</label>
            <input hlmInput id="dest-name" [value]="name()" (input)="name.set($any($event.target).value)" />
          </div>
          <div class="field">
            <label hlmLabel id="dest-type">Type</label>
            <hlm-select [value]="'Network share'">
              <hlm-select-trigger aria-labelledby="dest-type"><hlm-select-value /></hlm-select-trigger>
              <hlm-select-content *hlmSelectPortal>
                <hlm-select-item value="Network share">Network share</hlm-select-item>
                <hlm-select-item value="External drive">External drive</hlm-select-item>
                <hlm-select-item value="Cloud storage">Cloud storage</hlm-select-item>
              </hlm-select-content>
            </hlm-select>
          </div>
          <div class="row">
            <label hlmLabel id="dest-encrypt">Encrypt backups</label>
            <hlm-switch [checked]="true" aria-labelledby="dest-encrypt" />
          </div>
          <button hlmBtn variant="outline" snSheetCancel>Cancel</button>
          <button hlmBtn snSheetPrimary [disabled]="!name()" (click)="create()">Create</button>
        </sn-modal-sheet>
      }
    </div>
  `,
  styles: `
    .window {
      max-width: 40rem;
    }
    .body {
      display: flex;
      flex-direction: column;
      align-items: flex-start;
      gap: 1rem;
      padding: 1.5rem;
      min-height: 22rem;
      background: var(--sn-color-bg);
    }
    ul {
      align-self: stretch;
      margin: 0;
      padding: 0;
      list-style: none;
    }
    li {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 0.25rem 0;
      border-bottom: 1px solid var(--sn-color-border);
    }
    .field {
      display: flex;
      flex-direction: column;
      gap: 0.375rem;
    }
    .row {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 1rem;
    }
    .text {
      margin: 0;
    }
  `,
})
class ModalSheetDemo {
  /** Open on first load. */
  readonly startOpen = input(false);
  /** Show the destructive confirmation instead of the form. */
  readonly confirm = input(false);

  protected readonly open = linkedSignal(() => this.startOpen());
  protected readonly removing = linkedSignal<string>(() => (this.confirm() ? 'Office NAS' : ''));
  protected readonly name = signal('Studio share');
  protected readonly destinations = signal(['Home drive', 'Office NAS']);

  protected create(): void {
    this.destinations.update((list) => [...list, this.name()]);
    this.open.set(false);
  }

  protected remove(): void {
    const target = this.removing();
    this.destinations.update((list) => list.filter((d) => d !== target));
    this.open.set(false);
  }
}

/**
 * A modal form that changes layout per OS: a sheet on macOS, a ContentDialog on Windows,
 * an AdwDialog on GNOME, a framed QDialog on KDE and an M3 dialog on ChromeOS.
 * Switch the OS in the toolbar.
 */
const meta: Meta = {
  title: 'Desktop UI/Patterns/Modal sheet',
  decorators: [moduleMetadata({ imports: [ModalSheetDemo] })],
  // Open sheets are modal: in the docs page they get their own frame so they don't trap the page.
  parameters: { docs: { story: { inline: false, height: '32rem' } } },
};
export default meta;

export const OpenOnLoad: StoryObj = {
  name: 'Open on load',
  render: () => ({ template: `<div style="padding: 2rem"><sn-modal-sheet-demo [startOpen]="true" /></div>` }),
};

export const OpenedByButton: StoryObj = {
  name: 'Opened by a button',
  render: () => ({ template: `<div style="padding: 2rem"><sn-modal-sheet-demo /></div>` }),
};

export const DestructiveConfirmation: StoryObj = {
  name: 'Destructive confirmation',
  render: () => ({
    template: `<div style="padding: 2rem"><sn-modal-sheet-demo [startOpen]="true" [confirm]="true" /></div>`,
  }),
};
