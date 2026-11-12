import { ChangeDetectionStrategy, Component, input, linkedSignal, signal } from '@angular/core';
import { NgIcon, provideIcons } from '@ng-icons/core';
import { lucideRefreshCw } from '@ng-icons/lucide';
import { moduleMetadata, type Meta, type StoryObj } from '@storybook/angular';
import { HlmButtonImports } from '@spartan-ng/helm/button';
import { SnCoachMark, SnCoachMarkFor, type CoachMarkPlacement } from '../lib/patterns/coach-mark';
import { SnTitleBar } from '../lib/window/title-bar';

/** A Harbor window with a "Sync" button in its toolbar; the coach mark points at it. */
@Component({
  selector: 'sn-coach-mark-demo',
  imports: [HlmButtonImports, NgIcon, SnCoachMark, SnCoachMarkFor, SnTitleBar],
  providers: [provideIcons({ lucideRefreshCw })],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="sn-window window">
      <sn-title-bar title="Harbor Backup" />
      <div
        class="body"
        [class.side]="placement() === 'start' || placement() === 'end'"
        [class.top]="placement() === 'top'"
      >
        <div class="toolbar">
          <button hlmBtn variant="outline" [snCoachMarkFor]="tip" (click)="tip.toggle()">
            <ng-icon name="lucideRefreshCw" /> Sync
          </button>
        </div>
        <p class="status">{{ status() }}</p>
      </div>
    </div>
    <sn-coach-mark #tip title="Sync across devices" [placement]="placement()" [(open)]="open">
      Turn on sync to keep your backups available on every device you sign in to.
      <button snCoachMarkAction hlmBtn variant="secondary" (click)="answer('Not now')">Not now</button>
      <button snCoachMarkAction hlmBtn (click)="answer('Sync turned on')">Turn on</button>
    </sn-coach-mark>
  `,
  styles: `
    .window {
      max-width: 40rem;
    }
    .body {
      display: flex;
      flex-direction: column;
      gap: 1rem;
      padding: 1rem 1.5rem;
      min-height: 16rem;
      background: var(--sn-color-bg);
    }
    .body.top {
      flex-direction: column-reverse;
    }
    .body.side {
      flex-direction: row;
      align-items: center;
      justify-content: space-between;
    }
    .toolbar {
      display: flex;
      justify-content: flex-end;
    }
    .body.side .toolbar {
      order: 1;
    }
    .status {
      margin: 0;
      color: var(--sn-color-fg-muted);
    }
  `,
})
class CoachMarkDemo {
  /** Open on first load. */
  readonly startOpen = input(false);
  readonly placement = input<CoachMarkPlacement>('bottom');

  protected readonly open = linkedSignal(() => this.startOpen());
  protected readonly status = signal('Sync is off.');

  protected answer(status: string): void {
    this.status.set(status);
    this.open.set(false);
  }
}

/**
 * An anchored, non-modal teaching popup: a TeachingTip on Windows, an NSPopover on macOS,
 * a GtkPopover on GNOME, a Kirigami popup on KDE and a rich tooltip on ChromeOS.
 * Switch the OS in the toolbar.
 */
const meta: Meta = {
  title: 'Desktop UI/Patterns/Coach mark',
  decorators: [moduleMetadata({ imports: [CoachMarkDemo] })],
  // The coach mark lives in the top layer: in the docs page each story gets its own frame.
  parameters: { docs: { story: { inline: false, height: '24rem' } } },
};
export default meta;

export const OpenOnLoad: StoryObj = {
  name: 'Open on load',
  render: () => ({ template: `<div style="padding: 2rem"><sn-coach-mark-demo [startOpen]="true" /></div>` }),
};

export const Toggle: StoryObj = {
  name: 'Toggled by the anchor',
  render: () => ({ template: `<div style="padding: 2rem"><sn-coach-mark-demo /></div>` }),
};

export const Placement: StoryObj<{ placement: CoachMarkPlacement }> = {
  name: 'Placement',
  args: { placement: 'start' },
  argTypes: { placement: { control: 'inline-radio', options: ['top', 'bottom', 'start', 'end'] } },
  render: (args) => ({
    props: args,
    template: `<div style="padding: 2rem"><sn-coach-mark-demo [startOpen]="true" [placement]="placement" /></div>`,
  }),
};
