import { provideIcons } from '@ng-icons/core';
import { lucideCloudUpload, lucideSearch, lucideWifiOff } from '@ng-icons/lucide';
import { moduleMetadata, type Meta, type StoryObj } from '@storybook/angular';
import { HlmButtonImports } from '@spartan-ng/helm/button';
import { SnStatusPage } from '../lib/patterns/status-page';

const stage = (content: string) =>
  `<div style="padding: 2rem"><div class="sn-window" style="max-width: 40rem; background: var(--sn-color-bg)">${content}</div></div>`;

/**
 * A full-page empty or status state: AdwStatusPage on GNOME, ContentUnavailableView on macOS, a Fluent empty
 * state on Windows, a Kirigami PlaceholderMessage on KDE, the Material 3 empty state on ChromeOS.
 */
const meta: Meta<SnStatusPage> = {
  title: 'Desktop UI/Patterns/Status page',
  component: SnStatusPage,
  decorators: [moduleMetadata({ imports: [HlmButtonImports], providers: [provideIcons({ lucideCloudUpload, lucideSearch, lucideWifiOff })] })],
};
export default meta;
type Story = StoryObj<SnStatusPage>;

/** The Harbor empty state: icon, title, description and one action. */
export const Default: Story = {
  render: () => ({
    template: stage(`
      <sn-status-page icon="lucideCloudUpload" title="No backups yet" description="Add a destination to start protecting your files.">
        <button hlmBtn>Add destination</button>
      </sn-status-page>`),
  }),
};

/** A primary and a secondary action. */
export const TwoActions: Story = {
  name: 'Two actions',
  render: () => ({
    template: stage(`
      <sn-status-page icon="lucideWifiOff" title="Office NAS is offline" description="Harbor will retry when the destination is reachable again.">
        <button hlmBtn>Retry now</button>
        <button hlmBtn variant="outline">Choose another destination</button>
      </sn-status-page>`),
  }),
};

/** No actions: an informational state, e.g. an empty search. */
export const WithoutActions: Story = {
  name: 'Without actions',
  render: () => ({
    template: stage(`<sn-status-page icon="lucideSearch" title="No results" description="No files in this backup match “invoice”." />`),
  }),
};

/** Title only: no icon, no description, no actions. */
export const TitleOnly: Story = {
  name: 'Title only',
  render: () => ({ template: stage(`<sn-status-page title="Nothing to restore" />`) }),
};
