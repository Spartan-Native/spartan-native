import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { moduleMetadata, type Meta, type StoryObj } from '@storybook/angular';
import { HlmButtonImports } from '@spartan-ng/helm/button';
import { HlmCardImports } from '@spartan-ng/helm/card';
import { HlmDialogImports } from '@spartan-ng/helm/dialog';
import { HlmInputImports } from '@spartan-ng/helm/input';
import { HlmLabelImports } from '@spartan-ng/helm/label';
import { HlmTextareaImports } from '@spartan-ng/helm/textarea';
import { SnDialogActionsImports } from '../lib/actions/dialog-actions';

@Component({
  selector: 'sn-dialog-actions-demo',
  imports: [HlmButtonImports, HlmCardImports, HlmDialogImports, HlmInputImports, HlmLabelImports, HlmTextareaImports, SnDialogActionsImports],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <form hlmCard (submit)="$event.preventDefault()">
      <div hlmCardHeader>
        <h3 hlmCardTitle>New destination</h3>
        <p hlmCardDescription>Enter saves, Esc cancels, from any field. Enter in the notes adds a line.</p>
      </div>
      <div hlmCardContent class="fields">
        <label hlmLabel for="da-name">Name</label>
        <input hlmInput id="da-name" value="Office NAS" />
        <label hlmLabel for="da-path">Path</label>
        <input hlmInput id="da-path" value="smb://nas.local/backups" />
        <label hlmLabel for="da-notes">Notes</label>
        <textarea hlmTextarea id="da-notes" rows="2"></textarea>
      </div>
      <div hlmCardFooter class="actions">
        <button hlmBtn variant="outline" type="button" snCancelAction (click)="log.set('Cancelled')">Cancel</button>
        <button hlmBtn type="button" snDefaultAction (click)="log.set('Saved')">Create</button>
      </div>
    </form>

    <hlm-dialog>
      <button hlmBtn variant="outline" hlmDialogTrigger>Open as a dialog…</button>
      <hlm-dialog-content *hlmDialogPortal="let ctx">
        <hlm-dialog-header>
          <h3 hlmDialogTitle>Rename backup</h3>
          <p hlmDialogDescription>Press Enter to rename.</p>
        </hlm-dialog-header>
        <input hlmInput value="Photos → NAS" aria-label="Backup name" />
        <hlm-dialog-footer>
          <button hlmBtn variant="outline" hlmDialogClose (click)="log.set('Rename cancelled')">Cancel</button>
          <button hlmBtn hlmDialogClose snDefaultAction (click)="log.set('Renamed')">Rename</button>
        </hlm-dialog-footer>
      </hlm-dialog-content>
    </hlm-dialog>

    <p class="status" aria-live="polite">Last action: {{ log() }}</p>
  `,
  styles: `
    :host { display: flex; flex-direction: column; gap: 16px; max-width: 420px; align-items: flex-start; }
    form { width: 100%; }
    .fields { display: grid; gap: 6px; }
    .actions { justify-content: flex-end; gap: 8px; }
    .status { margin: 0; font-size: var(--sn-font-size-small); color: var(--sn-color-fg-muted); }
  `,
})
export class DialogActionsDemo {
  protected readonly log = signal('none yet');
}

/** snDefaultAction (Enter) and snCancelAction (Esc) in a form and in a spartan dialog. */
const meta: Meta = {
  title: 'Helm/Default & cancel buttons',
  decorators: [moduleMetadata({ imports: [DialogActionsDemo] })],
};
export default meta;

export const FormAndDialog: StoryObj = {
  name: 'Form and dialog',
  render: () => ({ template: `<div style="padding: 32px"><sn-dialog-actions-demo /></div>` }),
};
