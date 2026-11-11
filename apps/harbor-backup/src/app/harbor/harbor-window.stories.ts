import type { Meta, StoryObj } from '@storybook/angular';
import type { Skin } from '@spartan-native/theme';
import { type HarborFrame, type HarborPage, HarborWindow } from './harbor-window';

/**
 * The Harbor Backup main window. Try every OS, dark mode, an accent, 150 % text and an inactive window.
 * `frame` shows how the window looks in a browser tab (mock) and installed as a PWA.
 */
const meta: Meta<HarborWindow> = {
  title: 'Harbor Backup/Window',
  component: HarborWindow,
};
export default meta;

const render =
  (frame: HarborFrame, page: HarborPage = 'Overview'): StoryObj<HarborWindow>['render'] =>
  (_args, { globals }) => ({
    props: { skin: (globals['skin'] as Skin) ?? 'win', frame, page },
    template:
      frame === 'mock'
        ? `<div style="min-height: 100vh; display: grid; place-items: center; padding: 40px 24px; box-sizing: border-box">
             <harbor-window [skin]="skin" [frame]="frame" [page]="page" /></div>`
        : `<harbor-window [skin]="skin" [frame]="frame" [page]="page" />`,
  });

export const Window: StoryObj<HarborWindow> = { name: 'In a browser tab', render: render('mock') };
export const Installed: StoryObj<HarborWindow> = { name: 'Installed (OS title bar)', render: render('native') };
export const InstalledOverlay: StoryObj<HarborWindow> = { name: 'Installed (title bar overlay)', render: render('overlay') };

// One story per menu point, in a browser tab
export const Schedules: StoryObj<HarborWindow> = { name: 'Page · Schedules', render: render('mock', 'Schedules') };
export const Destinations: StoryObj<HarborWindow> = { name: 'Page · Destinations', render: render('mock', 'Destinations') };
export const RestoreFiles: StoryObj<HarborWindow> = { name: 'Page · Restore files', render: render('mock', 'Restore files') };
export const Settings: StoryObj<HarborWindow> = { name: 'Page · Settings', render: render('mock', 'Settings') };
