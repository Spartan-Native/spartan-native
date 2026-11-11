import { NgIcon, provideIcons } from '@ng-icons/core';
import { lucidePanelLeft, lucideSearch } from '@ng-icons/lucide';
import { moduleMetadata, type Meta, type StoryObj } from '@storybook/angular';
import { HlmButtonImports } from '@spartan-ng/helm/button';
import { SnTitleBar } from '../lib/window/title-bar';

/** A framed window with a title bar on top and some content under it. */
const frame = (titleBar: string, body = 'Backups · 3 destinations · last run 09:12') => `
  <div style="padding: 2rem">
    <div class="sn-window" style="max-width: 40rem; overflow: hidden">
      ${titleBar}
      <div style="padding: 1.5rem; min-height: 7.5rem; color: var(--sn-color-fg-muted); background: var(--sn-color-bg)">${body}</div>
    </div>
  </div>
`;

const appIcon = `<span snTitleBarIcon style="display: block; border-radius: 0.25rem; background: var(--sn-color-primary)"></span>`;
const search = `<button snTitleBarEnd hlmBtn variant="ghost" size="icon-sm" aria-label="Search"><ng-icon name="lucideSearch" /></button>`;

/**
 * The window's title bar, laid out the way each OS does it. Switch the OS in the toolbar:
 * the controls move, the title re-aligns, and the buttons change shape.
 */
const meta: Meta<SnTitleBar> = {
  title: 'Desktop UI/Window/Title bar',
  component: SnTitleBar,
  decorators: [moduleMetadata({ imports: [HlmButtonImports, NgIcon], providers: [provideIcons({ lucidePanelLeft, lucideSearch })] })],
};
export default meta;
type Story = StoryObj<SnTitleBar>;

/** Custom-drawn window controls, an app icon (Windows, KDE, ChromeOS) and a trailing search button. */
export const Default: Story = {
  render: () => ({
    props: { maximized: false, last: 'none' },
    template: frame(
      `<sn-title-bar title="Harbor Backup" [maximized]="maximized"
         (maximize)="maximized = !maximized; last = 'maximize'" (minimize)="last = 'minimize'" (close)="last = 'close'">
         ${appIcon}${search}
       </sn-title-bar>`,
      `Window content · last button: {{ last }}`,
    ),
  }),
};

/** A second line under the title, e.g. the destination being browsed. */
export const WithSubtitle: Story = {
  name: 'With subtitle',
  render: () => ({
    template: frame(`<sn-title-bar title="Harbor Backup" subtitle="Office NAS">${appIcon}${search}</sn-title-bar>`),
  }),
};

/** Leading content (`snTitleBarStart`): a sidebar toggle next to the title. */
export const WithStartContent: Story = {
  name: 'With start content',
  render: () => ({
    template: frame(`
      <sn-title-bar title="Harbor Backup">
        ${appIcon}
        <button snTitleBarStart hlmBtn variant="ghost" size="icon-sm" aria-label="Toggle sidebar"><ng-icon name="lucidePanelLeft" /></button>
        ${search}
      </sn-title-bar>`),
  }),
};

/** `maximized`: the maximize button shows the restore glyph (KDE: a diamond). */
export const Maximized: Story = {
  render: () => ({
    template: frame(`<sn-title-bar title="Harbor Backup" maximized>${appIcon}</sn-title-bar>`),
  }),
};

/** Only a close button, for a utility window. */
export const CloseOnly: Story = {
  name: 'Close only',
  render: () => ({
    props: { buttons: ['close'] },
    template: frame(`<sn-title-bar title="Restore files" [buttons]="buttons">${appIcon}</sn-title-bar>`),
  }),
};

/**
 * `windowControls="native"`: the OS (Electron `titleBarOverlay`, Tauri overlay, Window Controls Overlay)
 * draws the buttons. The bar draws none and leaves their space free, read from the `titlebar-area-*`
 * environment variables with a per-OS fallback.
 */
export const NativeControls: Story = {
  name: 'Native controls',
  render: () => ({
    template: frame(`<sn-title-bar title="Harbor Backup" windowControls="native">${appIcon}${search}</sn-title-bar>`),
  }),
};

/**
 * The window has lost focus (toolbar: Window → inactive). The bar carries `sn-chrome`, so the theme dims it:
 * grey traffic lights on macOS, faded text on Windows, KDE and ChromeOS, faded contents on GNOME.
 */
export const Inactive: Story = {
  globals: { window: 'inactive' },
  render: () => ({
    template: frame(`<sn-title-bar title="Harbor Backup" subtitle="Office NAS">${appIcon}${search}</sn-title-bar>`),
  }),
};
