import { moduleMetadata, type Meta, type StoryObj } from '@storybook/angular';
import { AssistantShowcase, ChartShowcase, ConversationShowcase } from './support/catalog-chat';
import { DatesShowcase, InputExtrasShowcase, PickersShowcase, TogglesShowcase } from './support/catalog-forms';
import { ContainersShowcase, DisclosureShowcase, DisplayShowcase, SidebarShowcase } from './support/catalog-layout';
import { CommandShowcase, NavigationShowcase, PopupsShowcase } from './support/catalog-navigation';

/**
 * The rest of the spartan/ui catalog, stock, under the theme.
 * Most of these have no platform skin yet: they follow the palette, fonts and
 * text size through spartan's variables, and get their per-OS shape later.
 */
const meta: Meta = {
  title: 'Theme/Spartan catalog',
  decorators: [
    moduleMetadata({
      imports: [
        PickersShowcase,
        DatesShowcase,
        InputExtrasShowcase,
        TogglesShowcase,
        NavigationShowcase,
        PopupsShowcase,
        CommandShowcase,
        DisclosureShowcase,
        DisplayShowcase,
        ContainersShowcase,
        SidebarShowcase,
        ConversationShowcase,
        AssistantShowcase,
        ChartShowcase,
      ],
    }),
  ],
};
export default meta;

// A solid window background, not the wallpaper: stock components are built for an
// opaque surface, and their translucent fills lose contrast over the macOS/Mica gradient.
const stage = (inner: string) => ({
  template: `<div style="padding: 2rem; min-height: 100vh; box-sizing: border-box; background: var(--sn-color-bg); color: var(--sn-color-fg)">${inner}</div>`,
});

export const Pickers: StoryObj = {
  name: 'Combobox, autocomplete & native select',
  render: () => stage('<sn-pickers-showcase />'),
};
export const Dates: StoryObj = { name: 'Calendar & date picker', render: () => stage('<sn-dates-showcase />') };
export const InputExtras: StoryObj = {
  name: 'Input group, OTP & kbd',
  render: () => stage('<sn-input-extras-showcase />'),
};
export const Toggles: StoryObj = {
  name: 'Toggle, toggle group & button group',
  render: () => stage('<sn-toggles-showcase />'),
};
export const Navigation: StoryObj = {
  name: 'Menubar, breadcrumb, pagination & navigation menu',
  render: () => stage('<sn-navigation-showcase />'),
};
export const Popups: StoryObj = {
  name: 'Popover, hover card, context menu, sheet, drawer & toast',
  render: () => stage('<sn-popups-showcase />'),
};
export const Command: StoryObj = { name: 'Command palette', render: () => stage('<sn-command-showcase />') };
export const Disclosure: StoryObj = {
  name: 'Accordion & collapsible',
  render: () => stage('<sn-disclosure-showcase />'),
};
export const Display: StoryObj = {
  name: 'Avatar, item, empty, skeleton, spinner & typography',
  render: () => stage('<sn-display-showcase />'),
};
export const Containers: StoryObj = {
  name: 'Aspect ratio, scroll area, resizable & carousel',
  render: () => stage('<sn-containers-showcase />'),
};
export const Sidebar: StoryObj = { name: 'Sidebar', render: () => stage('<sn-sidebar-showcase />') };
export const Conversation: StoryObj = {
  name: 'Message, bubble, attachment, code block & marker',
  render: () => stage('<sn-conversation-showcase />'),
};
export const Assistant: StoryObj = { name: 'Trace & questionnaire', render: () => stage('<sn-assistant-showcase />') };
export const Chart: StoryObj = { name: 'Chart', render: () => stage('<sn-chart-showcase />') };
