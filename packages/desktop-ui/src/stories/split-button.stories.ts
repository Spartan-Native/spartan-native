import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { NgIcon, provideIcons } from '@ng-icons/core';
import { lucideCloudUpload, lucideFolder, lucideHistory, lucideShieldCheck } from '@ng-icons/lucide';
import { moduleMetadata, type Meta, type StoryObj } from '@storybook/angular';
import { HlmButtonImports } from '@spartan-ng/helm/button';
import { HlmDropdownMenuImports } from '@spartan-ng/helm/dropdown-menu';
import { SnSplitButtonImports } from '../lib/controls/split-button';

/** Split buttons next to plain buttons, so the parts can be compared with the skin's own. */
@Component({
  selector: 'sn-split-button-demo',
  imports: [HlmButtonImports, HlmDropdownMenuImports, NgIcon, SnSplitButtonImports],
  providers: [provideIcons({ lucideCloudUpload, lucideFolder, lucideHistory, lucideShieldCheck })],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="row">
      <sn-split-button
        label="Back up now"
        icon="lucideCloudUpload"
        variant="accent"
        (triggered)="log.set('Back up now')"
      >
        <ng-template snSplitButtonMenu>
          <div hlmDropdownMenu class="menu">
            <button hlmDropdownMenuItem (triggered)="log.set('Back up Documents only')">
              <ng-icon name="lucideFolder" /> Documents only
            </button>
            <button hlmDropdownMenuItem (triggered)="log.set('Back up Photos only')">
              <ng-icon name="lucideFolder" /> Photos only
            </button>
            <hlm-dropdown-menu-separator />
            <button hlmDropdownMenuItem (triggered)="log.set('Verify last backup')">
              <ng-icon name="lucideShieldCheck" /> Verify last backup
            </button>
          </div>
        </ng-template>
      </sn-split-button>
      <sn-split-button label="Restore" icon="lucideHistory" (triggered)="log.set('Restore')">
        <ng-template snSplitButtonMenu>
          <div hlmDropdownMenu class="menu">
            <button hlmDropdownMenuItem (triggered)="log.set('Restore to original location')">
              To the original location
            </button>
            <button hlmDropdownMenuItem (triggered)="log.set('Restore to…')">To another folder…</button>
          </div>
        </ng-template>
      </sn-split-button>
      <button hlmBtn variant="outline">Cancel</button>
    </div>
    <p class="log">Last action: {{ log() }}</p>
  `,
  styles: `
    .row {
      display: flex;
      flex-wrap: wrap;
      align-items: center;
      gap: 0.75rem;
    }
    .menu {
      min-width: 14rem;
    }
    .log {
      margin: 1rem 0 0;
      color: var(--sn-color-fg-muted);
      font-size: var(--sn-font-size-small);
    }
  `,
})
class SplitButtonDemo {
  protected readonly log = signal('none');
}

/**
 * An action joined to a menu of alternatives: Fluent SplitButton on Windows, NSComboButton on macOS,
 * AdwSplitButton on GNOME, a QToolButton menu on KDE and the M3 split button on ChromeOS. Each part is
 * drawn by the skin's own button styles.
 */
const meta: Meta = {
  title: 'Desktop UI/Controls/Split button',
  decorators: [moduleMetadata({ imports: [SplitButtonDemo, SnSplitButtonImports, HlmDropdownMenuImports] })],
};
export default meta;

const stage = (content: string) => `<div style="padding: 2rem; min-height: 14rem">${content}</div>`;

export const Default: StoryObj = {
  render: () => ({ template: stage(`<sn-split-button-demo />`) }),
};

export const Small: StoryObj = {
  render: () => ({
    template: stage(`
      <div style="display: flex; gap: 0.75rem">
        <sn-split-button small label="Back up now" variant="accent"><ng-template snSplitButtonMenu><div hlmDropdownMenu><button hlmDropdownMenuItem>Documents only</button></div></ng-template></sn-split-button>
        <sn-split-button small label="Restore"><ng-template snSplitButtonMenu><div hlmDropdownMenu><button hlmDropdownMenuItem>To another folder…</button></div></ng-template></sn-split-button>
      </div>`),
  }),
};

export const Disabled: StoryObj = {
  render: () => ({
    template: stage(`
      <div style="display: flex; gap: 0.75rem">
        <sn-split-button disabled label="Back up now" variant="accent"><ng-template snSplitButtonMenu><div hlmDropdownMenu><button hlmDropdownMenuItem>Documents only</button></div></ng-template></sn-split-button>
        <sn-split-button disabled label="Restore"><ng-template snSplitButtonMenu><div hlmDropdownMenu><button hlmDropdownMenuItem>To another folder…</button></div></ng-template></sn-split-button>
      </div>`),
  }),
};
