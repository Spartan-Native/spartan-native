import { moduleMetadata, type Meta, type StoryObj } from '@storybook/angular';
import {
  AlertsShowcase,
  AllShowcases,
  ButtonsShowcase,
  CardBadgesShowcase,
  FieldsShowcase,
  OverlaysShowcase,
  ProgressTabsShowcase,
  SelectionShowcase,
  TableFormShowcase,
} from './support/showcases';

/**
 * Stock spartan/ui components, themed.
 * Pick the OS and transparency in the toolbar, light/dark with Storybook's theme switcher,
 * and the accent color in Controls.
 */
const meta: Meta = {
  title: 'Theme/Spartan components',
  decorators: [
    moduleMetadata({
      imports: [
        AlertsShowcase,
        TableFormShowcase,
        AllShowcases,
        ButtonsShowcase,
        CardBadgesShowcase,
        FieldsShowcase,
        ProgressTabsShowcase,
        SelectionShowcase,
        OverlaysShowcase,
      ],
    }),
  ],
};
export default meta;

/** Wraps a showcase in a padded stage. */
const stage = (inner: string) => ({
  template: `<div style="padding: 32px; min-height: 100vh; box-sizing: border-box">${inner}</div>`,
});

export const AllComponents: StoryObj = {
  name: 'All components',
  render: () => stage('<sn-all-showcases />'),
};

export const Buttons: StoryObj = {
  name: 'Buttons',
  render: () => stage('<sn-buttons-showcase />'),
};

export const TextFields: StoryObj = {
  name: 'Text fields & select',
  render: () => stage('<sn-fields-showcase />'),
};

export const SelectionControls: StoryObj = {
  name: 'Switch, checkbox & radio',
  render: () => stage('<sn-selection-showcase />'),
};

export const ProgressAndTabs: StoryObj = {
  name: 'Slider, progress & tabs',
  render: () => stage('<sn-progress-tabs-showcase />'),
};

export const CardAndBadges: StoryObj = {
  name: 'Card & badges',
  render: () => stage('<sn-card-badges-showcase />'),
};

export const Overlays: StoryObj = {
  name: 'Menus, dialogs & tooltips',
  render: () => stage('<sn-overlays-showcase />'),
};

export const Alerts: StoryObj = {
  name: 'Alerts',
  render: () => stage('<sn-alerts-showcase />'),
};

export const TableAndForm: StoryObj = {
  name: 'Table, separator & field',
  render: () => stage('<sn-table-form-showcase />'),
};
