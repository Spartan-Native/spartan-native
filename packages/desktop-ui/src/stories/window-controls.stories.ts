import type { Meta, StoryObj } from '@storybook/angular';
import { SnWindowControls } from '../lib/window/window-controls';

const stage = (content: string) => `
  <div style="padding: 2rem; display: flex; flex-direction: column; gap: 1rem; align-items: flex-start">${content}</div>
`;
/** A strip the height of a title bar, so Windows caption buttons have something to fill.
 *  Controls sit where the OS puts them: leading on macOS, trailing elsewhere (.storybook/theme.scss). */
const strip = (controls: string) => `<div class="sn-window sn-story-controls-strip">${controls}</div>`;

/**
 * The window's own buttons on their own: caption buttons, traffic lights, header-bar buttons, Breeze
 * buttons or Material caption buttons, depending on the OS. Hover them to see the native states.
 */
const meta: Meta<SnWindowControls> = {
  title: 'Desktop UI/Window/Window controls',
  component: SnWindowControls,
};
export default meta;
type Story = StoryObj<SnWindowControls>;

/** Minimize, maximize and close (GNOME shows only close by default; macOS always shows all three lights). */
export const Default: Story = {
  render: () => ({ template: stage(strip(`<sn-window-controls [nativeActions]="false" />`)) }),
};

/** `maximized`: restore glyph instead of maximize (Windows, KDE, ChromeOS, and GNOME with `linuxAll`). */
export const Maximized: Story = {
  render: () => ({ template: stage(strip(`<sn-window-controls maximized linuxAll [nativeActions]="false" />`)) }),
};

/** `buttons`: only close, for dialogs and utility windows. Close is always shown. */
export const CloseOnly: Story = {
  name: 'Close only',
  render: () => ({
    props: { buttons: ['close'] },
    template: stage(strip(`<sn-window-controls [buttons]="buttons" [nativeActions]="false" />`)),
  }),
};

/** `linuxAll`: GNOME shows minimize and maximize too, for apps that want them. Other OSes are unchanged. */
export const LinuxAll: Story = {
  name: 'GNOME: all buttons',
  render: () => ({ template: stage(strip(`<sn-window-controls linuxAll [nativeActions]="false" />`)) }),
};

/** The outputs fire on every click; `[nativeActions]="false"` stops the buttons acting on the real window. */
export const Events: Story = {
  render: () => ({
    props: { last: 'none', maximized: false },
    template: stage(`
      ${strip(`<sn-window-controls linuxAll [nativeActions]="false" [maximized]="maximized"
        (minimize)="last = 'minimize'" (maximize)="maximized = !maximized; last = 'maximize'" (close)="last = 'close'" />`)}
      <p style="margin: 0; color: var(--sn-color-fg-muted)">Last button: {{ last }}</p>`),
  }),
};

/** Inactive window (toolbar: Window → inactive): grey traffic lights on macOS, dimmed chrome elsewhere. */
export const Inactive: Story = {
  globals: { window: 'inactive' },
  render: () => ({ template: stage(strip(`<sn-window-controls [nativeActions]="false" />`)) }),
};
