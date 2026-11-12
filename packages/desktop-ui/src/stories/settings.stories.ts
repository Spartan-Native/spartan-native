import { NgIcon, provideIcons } from '@ng-icons/core';
import {
  lucideBattery,
  lucideChevronRight,
  lucideClock,
  lucideFolder,
  lucideRefreshCw,
  lucideShieldCheck,
} from '@ng-icons/lucide';
import { moduleMetadata, type Meta, type StoryObj } from '@storybook/angular';
import { HlmButtonImports } from '@spartan-ng/helm/button';
import { HlmSelectImports } from '@spartan-ng/helm/select';
import { HlmSwitchImports } from '@spartan-ng/helm/switch';
import { SnSettingsGroup, SnSettingsRow } from '../lib/patterns/settings';

const stage = (content: string) =>
  `<div style="padding: 2rem; display: flex; flex-direction: column; gap: 1.5rem; max-width: 35rem">${content}</div>`;

const automatic = `
  <sn-settings-row title="Automatic backups" subtitle="Run in the background">
    <ng-icon snSettingsIcon name="lucideClock" />
    <hlm-switch [checked]="true" aria-label="Automatic backups" />
  </sn-settings-row>`;
const frequency = `
  <sn-settings-row title="Frequency" subtitle="How often to back up">
    <ng-icon snSettingsIcon name="lucideRefreshCw" />
    <hlm-select [value]="'Every hour'">
      <hlm-select-trigger aria-label="Frequency"><hlm-select-value /></hlm-select-trigger>
      <hlm-select-content *hlmSelectPortal>
        <hlm-select-item value="Every hour">Every hour</hlm-select-item>
        <hlm-select-item value="Every 6 hours">Every 6 hours</hlm-select-item>
        <hlm-select-item value="Daily">Daily</hlm-select-item>
      </hlm-select-content>
    </hlm-select>
  </sn-settings-row>`;
const excluded = `
  <sn-settings-row title="Excluded folders" subtitle="3 folders">
    <ng-icon snSettingsIcon name="lucideFolder" />
    <button hlmBtn variant="ghost" size="icon-sm" aria-label="Edit excluded folders"><ng-icon name="lucideChevronRight" /></button>
  </sn-settings-row>`;

/**
 * A settings list drawn as each OS draws its settings: SettingsCards on Windows 11, a grouped Form on macOS,
 * an AdwPreferencesGroup on GNOME, a Kirigami FormLayout on KDE, M3 list rows in a card on ChromeOS.
 */
const meta: Meta<SnSettingsGroup> = {
  title: 'Desktop UI/Patterns/Settings list',
  component: SnSettingsGroup,
  decorators: [
    moduleMetadata({
      imports: [SnSettingsRow, HlmButtonImports, HlmSelectImports, HlmSwitchImports, NgIcon],
      providers: [
        provideIcons({
          lucideBattery,
          lucideChevronRight,
          lucideClock,
          lucideFolder,
          lucideRefreshCw,
          lucideShieldCheck,
        }),
      ],
    }),
  ],
};
export default meta;
type Story = StoryObj<SnSettingsGroup>;

/** The Harbor "Backups" group: a switch row, a select row and a navigation row. */
export const Default: Story = {
  render: () => ({
    template: stage(`
      <sn-settings-group title="Backups" description="Choose when and how backups run.">
        ${automatic}${frequency}${excluded}
      </sn-settings-group>`),
  }),
};

/** Rows whose control is a switch, with and without a subtitle. */
export const SwitchRows: Story = {
  name: 'Switch rows',
  render: () => ({
    template: stage(`
      <sn-settings-group title="Backups">
        ${automatic}
        <sn-settings-row title="Back up on battery">
          <ng-icon snSettingsIcon name="lucideBattery" />
          <hlm-switch aria-label="Back up on battery" />
        </sn-settings-row>
        <sn-settings-row title="Encrypt backups" subtitle="AES-256, with a key stored in the system keychain">
          <ng-icon snSettingsIcon name="lucideShieldCheck" />
          <hlm-switch [checked]="true" aria-label="Encrypt backups" />
        </sn-settings-row>
      </sn-settings-group>`),
  }),
};

/** A row whose control is a select. */
export const SelectRow: Story = {
  name: 'Select row',
  render: () => ({ template: stage(`<sn-settings-group title="Schedule">${frequency}</sn-settings-group>`) }),
};

/** A navigation row: it opens a sub-page, so its control is a chevron button with an accessible name. */
export const NavigationRow: Story = {
  name: 'Navigation row',
  render: () => ({ template: stage(`<sn-settings-group title="Files">${excluded}</sn-settings-group>`) }),
};

/** Several groups on one page, one without a description and one without any header. */
export const MultipleGroups: Story = {
  name: 'Multiple groups',
  render: () => ({
    template: stage(`
      <sn-settings-group title="Backups" description="Choose when and how backups run.">${automatic}${frequency}</sn-settings-group>
      <sn-settings-group title="Security">
        <sn-settings-row title="Encrypt backups" subtitle="AES-256, with a key stored in the system keychain">
          <ng-icon snSettingsIcon name="lucideShieldCheck" />
          <hlm-switch [checked]="true" aria-label="Encrypt backups" />
        </sn-settings-row>
      </sn-settings-group>
      <sn-settings-group>${excluded}</sn-settings-group>`),
  }),
};
