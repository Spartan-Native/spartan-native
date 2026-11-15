import { ChangeDetectionStrategy, Component, inject, input, signal } from '@angular/core';
import { moduleMetadata, type Meta, type StoryObj } from '@storybook/angular';
import { HlmButtonImports } from '@spartan-ng/helm/button';
import { SnAlert } from '../lib/patterns/alert';

@Component({
  selector: 'sn-alert-demo',
  imports: [HlmButtonImports],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="sn-window window" snSheetHost>
      @if (kind() === 'confirm') {
        <button hlmBtn variant="outline" (click)="confirm()">Delete “Q3 report.pdf”…</button>
      } @else {
        <button hlmBtn variant="outline" (click)="save()">Close “Report.md”…</button>
      }
      <p>Answer: {{ answer() }}</p>
    </div>
  `,
  styles: `
    .window {
      display: flex;
      flex-wrap: wrap;
      align-items: center;
      gap: 0.75rem;
      max-width: 40rem;
      padding: 2rem;
    }
    p {
      flex-basis: 100%;
      margin: 0;
      color: var(--sn-color-fg-muted);
    }
  `,
})
class AlertDemo {
  readonly kind = input<'confirm' | 'save'>('confirm');
  private readonly alert = inject(SnAlert);
  protected readonly answer = signal('—');

  protected async confirm() {
    const yes = await this.alert.confirm('Delete “Q3 report.pdf”?', {
      kind: 'warning',
      confirmLabel: 'Delete',
    });
    this.answer.set(yes ? 'deleted' : 'kept');
  }

  protected async save() {
    const id = await this.alert.show({
      kind: 'warning',
      title: 'Save changes to “Report.md”?',
      message: 'Your changes are lost if you don’t save them.',
      buttons: [
        { id: 'save', label: 'Save' },
        { id: 'discard', label: "Don't Save" },
        { id: 'cancel', label: 'Cancel' },
      ],
      defaultId: 'save',
      cancelId: 'cancel',
    });
    this.answer.set(id ?? 'dismissed');
  }
}

/**
 * `SnAlert`: in Storybook there is no native alert, so this is the in-page one. Enter presses the default
 * button, Esc the cancel button.
 */
const meta: Meta = {
  title: 'Desktop UI/Patterns/Alert',
  decorators: [moduleMetadata({ imports: [AlertDemo] })],
};
export default meta;

export const Confirm: StoryObj = {
  render: () => ({ template: `<sn-alert-demo />` }),
};

export const SaveChanges: StoryObj = {
  name: 'Save changes',
  render: () => ({ template: `<sn-alert-demo kind="save" />` }),
};
