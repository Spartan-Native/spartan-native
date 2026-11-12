import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { NgIcon, provideIcons } from '@ng-icons/core';
import { lucideGauge, lucideHistory } from '@ng-icons/lucide';
import { moduleMetadata, type Meta, type StoryObj } from '@storybook/angular';
import { HlmLabelImports } from '@spartan-ng/helm/label';
import { SnNumberBox } from '../lib/controls/number-box';
import { SnSettingsGroup, SnSettingsRow } from '../lib/patterns/settings';

/** Harbor's retention settings: number boxes in settings rows. */
@Component({
  selector: 'sn-number-box-demo',
  imports: [NgIcon, SnNumberBox, SnSettingsGroup, SnSettingsRow],
  providers: [provideIcons({ lucideGauge, lucideHistory })],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <sn-settings-group title="Retention" description="How much history Harbor keeps.">
      <sn-settings-row title="Keep versions" subtitle="Older versions are removed">
        <ng-icon snSettingsIcon name="lucideHistory" />
        <sn-number-box ariaLabel="Keep versions" [(value)]="versions" [min]="1" [max]="100" />
      </sn-settings-row>
      <sn-settings-row title="Upload limit" subtitle="MB/s, 0 for no limit">
        <ng-icon snSettingsIcon name="lucideGauge" />
        <sn-number-box ariaLabel="Upload limit in MB/s" [(value)]="limit" [min]="0" [step]="0.5" [decimals]="1" />
      </sn-settings-row>
    </sn-settings-group>
    <p class="note">
      Keep {{ versions() ?? '–' }} versions · limit {{ limit() ?? '–' }} MB/s. Try ↑ ↓, PgUp, or type 4*12.
    </p>
  `,
  styles: `
    :host {
      display: block;
      max-width: 36rem;
    }
    .note {
      margin: 1rem 0 0;
      color: var(--sn-color-fg-muted);
      font-size: var(--sn-font-size-small);
    }
  `,
})
class NumberBoxDemo {
  protected readonly versions = signal<number | null>(30);
  protected readonly limit = signal<number | null>(2.5);
}

/**
 * A number field with step buttons: Fluent NumberBox on Windows, a field with an NSStepper on macOS,
 * GtkSpinButton on GNOME, a Breeze QSpinBox on KDE and an M3 field with − / + on ChromeOS.
 */
const meta: Meta<SnNumberBox> = {
  title: 'Desktop UI/Controls/Number box',
  component: SnNumberBox,
  decorators: [moduleMetadata({ imports: [NumberBoxDemo, HlmLabelImports] })],
};
export default meta;
type Story = StoryObj<SnNumberBox>;

const stage = (content: string) =>
  `<div style="padding: 2rem; display: flex; flex-direction: column; gap: 1.25rem">${content}</div>`;

export const Default: Story = {
  render: () => ({
    template: stage(`
      <div style="display: flex; flex-direction: column; gap: 0.5rem; align-items: flex-start">
        <label hlmLabel for="nb-copies">Copies to keep</label>
        <sn-number-box inputId="nb-copies" [value]="3" [min]="1" [max]="10" />
      </div>`),
  }),
};

export const InSettings: Story = {
  name: 'In settings rows',
  render: () => ({ template: stage(`<sn-number-box-demo />`) }),
};

export const States: Story = {
  render: () => ({
    template: stage(`
      <div style="display: grid; grid-template-columns: auto auto; gap: 0.75rem 1.5rem; align-items: center; justify-content: start">
        <span>At the maximum</span><sn-number-box ariaLabel="At the maximum" [value]="10" [max]="10" />
        <span>Empty</span><sn-number-box ariaLabel="Empty" placeholder="Auto" />
        <span>No step buttons</span><sn-number-box ariaLabel="No step buttons" [value]="1024" [spinButtons]="false" />
        <span>Disabled</span><sn-number-box ariaLabel="Disabled" [value]="5" disabled />
      </div>`),
  }),
};
