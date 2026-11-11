import { moduleMetadata, type Meta, type StoryObj } from '@storybook/angular';
import { HlmButtonImports } from '@spartan-ng/helm/button';
import { SnPlatformIf } from '../lib/platform/platform-if';

const stage = (content: string) =>
  `<div style="padding: 2rem; display: flex; flex-direction: column; gap: 0.75rem; max-width: 40rem">${content}</div>`;

/**
 * `*snPlatformIf` renders its template only on the given skins or families, and switches live with the OS.
 * Switch the OS in the toolbar.
 */
const meta: Meta = {
  title: 'Desktop UI/Platform/Platform if',
  decorators: [moduleMetadata({ imports: [SnPlatformIf, HlmButtonImports] })],
};
export default meta;
type Story = StoryObj;

/** Family form with `else`: one text for macOS, another everywhere else. */
export const Family: Story = {
  render: () => ({
    template: stage(`
      <p *snPlatformIf="'macos'; else elsewhere" style="margin: 0">Harbor's settings are in the app menu: Harbor → Settings…</p>
      <ng-template #elsewhere><p style="margin: 0">Harbor's settings are in the window: ☰ → Settings.</p></ng-template>`),
  }),
};

/** Skin form with `else`: tells Windows 10 apart from Windows 11, and KDE apart from GNOME. */
export const Skin: Story = {
  render: () => ({
    template: stage(`
      <p *snPlatformIf="'w10'; else notW10" style="margin: 0">Windows 10: Harbor runs from the notification area.</p>
      <ng-template #notW10><p style="margin: 0">Not Windows 10.</p></ng-template>
      <p *snPlatformIf="'qt'; else notKde" style="margin: 0">KDE Plasma: Harbor also shows in System Settings → Backups.</p>
      <ng-template #notKde><p style="margin: 0">Not KDE Plasma.</p></ng-template>`),
  }),
};

/** List form: a mix of families and skins. Here, an Exit button on desktop Linux and Windows only. */
export const List: Story = {
  render: () => ({
    props: { where: ['windows', 'gtk', 'qt'] },
    template: stage(`
      <div *snPlatformIf="where; else noExit"><button hlmBtn variant="outline">Exit Harbor</button></div>
      <ng-template #noExit><p style="margin: 0">No Exit button here: macOS quits from the app menu, ChromeOS from the shelf.</p></ng-template>`),
  }),
};

/** Every skin with its own line: exactly one shows. */
export const EverySkin: Story = {
  name: 'Every skin',
  render: () => ({
    template: stage(`
      <p *snPlatformIf="'win'" style="margin: 0">Windows 11 (<code>win</code>)</p>
      <p *snPlatformIf="'w10'" style="margin: 0">Windows 10 (<code>w10</code>)</p>
      <p *snPlatformIf="'mac'" style="margin: 0">macOS 26 (<code>mac</code>)</p>
      <p *snPlatformIf="'macc'" style="margin: 0">macOS 13–15 (<code>macc</code>)</p>
      <p *snPlatformIf="'gtk'" style="margin: 0">GNOME (<code>gtk</code>)</p>
      <p *snPlatformIf="'qt'" style="margin: 0">KDE Plasma (<code>qt</code>)</p>
      <p *snPlatformIf="'cros'" style="margin: 0">ChromeOS (<code>cros</code>)</p>
      <p *snPlatformIf="'web'" style="margin: 0">Unknown OS (<code>web</code>)</p>`),
  }),
};
