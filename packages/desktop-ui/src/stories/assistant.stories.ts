import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { moduleMetadata, type Meta, type StoryObj } from '@storybook/angular';
import { HlmButtonImports } from '@spartan-ng/helm/button';
import { HlmInputImports } from '@spartan-ng/helm/input';
import { HlmLabelImports } from '@spartan-ng/helm/label';
import { SnAssistantImports } from '../lib/patterns/assistant';
import { SnChecklistImports } from '../lib/patterns/checklist';
import { SnModalSheet } from '../lib/patterns/modal-sheet';
import { SnTitleBar } from '../lib/window/title-bar';

/** Harbor's first-run setup: an assistant in a sheet, and the checklist it fills in. */
@Component({
  selector: 'sn-assistant-demo',
  imports: [
    HlmButtonImports,
    HlmInputImports,
    HlmLabelImports,
    SnAssistantImports,
    SnChecklistImports,
    SnModalSheet,
    SnTitleBar,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="sn-window window" snSheetHost>
      <sn-title-bar title="Harbor Backup" />
      <div class="body">
        <sn-checklist aria-label="Get started">
          <sn-checklist-item title="Add a destination" [done]="!!destination()">
            Where your backups go: a disk, a NAS or the cloud.
            <button hlmBtn size="sm" variant="outline" snChecklistAction (click)="step.set(1); open.set(true)">
              Add…
            </button>
          </sn-checklist-item>
          <sn-checklist-item title="Choose a schedule" [done]="scheduled()">
            Harbor backs up every hour by default.
            <button hlmBtn size="sm" variant="outline" snChecklistAction (click)="step.set(2); open.set(true)">
              Choose…
            </button>
          </sn-checklist-item>
          <sn-checklist-item title="Run the first backup">
            It can take a while; Harbor keeps going in the background.
            <button hlmBtn size="sm" snChecklistAction>Back up now</button>
          </sn-checklist-item>
        </sn-checklist>
        <button hlmBtn variant="outline" (click)="step.set(0); open.set(true)">Run setup again</button>
      </div>
      <sn-modal-sheet [(open)]="open" title="Set up Harbor">
        <sn-assistant [(step)]="step" (finish)="scheduled.set(true); open.set(false)" (cancel)="open.set(false)">
          <ng-template snAssistantPage title="Welcome to Harbor">
            <p class="text">Harbor keeps copies of your files somewhere safe. Setting it up takes a minute.</p>
          </ng-template>
          <ng-template snAssistantPage title="Where should backups go?" [canContinue]="!!destination()">
            <label hlmLabel for="dest">Destination name</label>
            <input
              hlmInput
              id="dest"
              [value]="destination()"
              (input)="destination.set($any($event.target).value)"
              placeholder="Office NAS"
            />
          </ng-template>
          <ng-template snAssistantPage title="How often?">
            <p class="text">Every hour, while this computer is on. You can change it in Schedules.</p>
          </ng-template>
        </sn-assistant>
      </sn-modal-sheet>
    </div>
  `,
  styles: `
    .window {
      max-width: 40rem;
      min-height: 26rem;
      display: flex;
      flex-direction: column;
    }
    .body {
      display: flex;
      flex-direction: column;
      align-items: flex-start;
      gap: 1rem;
      padding: 1rem 1.5rem;
      background: var(--sn-color-bg);
      flex: 1;
    }
    sn-checklist {
      align-self: stretch;
    }
    .text {
      margin: 0;
    }
  `,
})
class AssistantDemo {
  readonly open = signal(true);
  readonly step = signal(0);
  readonly destination = signal('');
  readonly scheduled = signal(false);
}

/**
 * A step-by-step setup flow (`<sn-assistant>`) in a modal sheet, and the setup checklist
 * (`<sn-checklist>`) it ticks off. Switch the OS: a Windows wizard, a macOS Setup Assistant page,
 * GNOME's header bar with page dots, KDE's step list, an M3 flow on ChromeOS.
 */
const meta: Meta = {
  title: 'Desktop UI/Patterns/Assistant',
  decorators: [moduleMetadata({ imports: [AssistantDemo] })],
};
export default meta;

export const InASheet: StoryObj = {
  name: 'In a sheet, with a checklist',
  render: () => ({ template: `<div style="padding: 2rem"><sn-assistant-demo /></div>` }),
};
