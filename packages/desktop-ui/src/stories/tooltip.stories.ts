import { ChangeDetectionStrategy, Component } from '@angular/core';
import { NgIcon, provideIcons } from '@ng-icons/core';
import { lucideRefreshCw, lucideSettings } from '@ng-icons/lucide';
import { moduleMetadata, type Meta, type StoryObj } from '@storybook/angular';
import { HlmButtonImports } from '@spartan-ng/helm/button';
import { SnTooltip } from '../lib/controls/tooltip';

@Component({
  selector: 'sn-tooltip-demo',
  imports: [HlmButtonImports, NgIcon, SnTooltip],
  providers: [provideIcons({ lucideRefreshCw, lucideSettings })],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="row">
      <button hlmBtn variant="outline" size="icon" aria-label="Refresh" snTooltip="Refresh">
        <ng-icon name="lucideRefreshCw" />
      </button>
      <button hlmBtn variant="outline" size="icon" aria-label="Settings" snTooltip="Settings">
        <ng-icon name="lucideSettings" />
      </button>
      <button hlmBtn variant="ghost" snTooltip="Backs up every folder in the list now">Back up now</button>
    </div>
  `,
  styles: `
    .row {
      display: flex;
      gap: 0.75rem;
      padding: 3rem 2rem;
    }
  `,
})
class TooltipDemo {}

/**
 * `snTooltip`: the skin's own tooltip (a light card on Windows 11 and macOS, an inverse bubble on
 * GNOME, a framed surface on KDE). Hover a button, or Tab to it.
 */
const meta: Meta = {
  title: 'Desktop UI/Controls/Tooltip',
  decorators: [moduleMetadata({ imports: [TooltipDemo] })],
};
export default meta;

export const Default: StoryObj = {
  render: () => ({ template: `<sn-tooltip-demo />` }),
};
