/*
 * Public API surface of @spartan-native/desktop-ui:
 * window chrome, OS signature patterns, desktop controls, menus and platform helpers.
 */

// Window chrome
export { SnWindowControls } from './lib/window/window-controls';
export type { WindowButton } from './lib/window/window-controls';
export { SnTitleBar } from './lib/window/title-bar';
export { SnStatusBar, SnStatusBarImports, SnStatusItem } from './lib/window/status-bar';

// OS patterns
export { SnSettingsGroup, SnSettingsRow } from './lib/patterns/settings';
export { SnStatusPage } from './lib/patterns/status-page';
export {
  SnCommand,
  SnCommandBar,
  SnCommandBarImports,
  SnCommandGroup,
  SnCommandOverflow,
} from './lib/patterns/command-bar';
export type { SnCommandBarCollapse, SnCommandBarTitlePosition } from './lib/patterns/command-bar';
export { SnCoachMark, SnCoachMarkFor, SnCoachMarkImports } from './lib/patterns/coach-mark';
export type { CoachMarkPlacement, CoachMarkSide } from './lib/patterns/coach-mark';
export { SnModalSheet } from './lib/patterns/modal-sheet';
export {
  SnInspector,
  SnInspectorImports,
  SnInspectorLayout,
  SnInspectorProperty,
  SnInspectorSection,
} from './lib/patterns/inspector';
export { SnSidebarItem, SnSidebarNav, SnSidebarNavImports, SnSidebarSection } from './lib/patterns/sidebar-nav';
export { SnAssistant, SnAssistantImports, SnAssistantPage } from './lib/patterns/assistant';
export { SnChecklist, SnChecklistImports, SnChecklistItem } from './lib/patterns/checklist';

// Desktop controls spartan doesn't have
export { SnSplitButton, SnSplitButtonImports, SnSplitButtonMenu } from './lib/controls/split-button';
export type { SnSplitButtonVariant } from './lib/controls/split-button';
export { evaluateNumberExpression, SnNumberBox } from './lib/controls/number-box';
export { SnTree, SnTreeImports, SnTreeItem } from './lib/controls/tree';
export { SnTooltip, SnTooltipPanel } from './lib/controls/tooltip';

// Menus: the application menu bar and context menus, native through the host where it can
export { inPageMenu, matchesAccelerator, runEditCommand, tidyMenu, toHostMenu } from './lib/menubar/menu-model';
export type { EditCommand, SnMenuItem, SnMenuWindowActions } from './lib/menubar/menu-model';
export { SnNativeMenus } from './lib/menubar/native-menus';
export { SnMenubar } from './lib/menubar/menubar';
export type { SnMenubarNative } from './lib/menubar/menubar';
export { SnContextMenu } from './lib/menubar/context-menu';

// Platform helpers
export { formatShortcut, SnShortcut } from './lib/platform/shortcut';
export { SnPlatformIf } from './lib/platform/platform-if';
export type { PlatformMatch } from './lib/platform/platform-if';

import { SnCoachMarkImports } from './lib/patterns/coach-mark';
import { SnCommandBarImports } from './lib/patterns/command-bar';
import { SnInspectorImports } from './lib/patterns/inspector';
import { SnContextMenu } from './lib/menubar/context-menu';
import { SnMenubar } from './lib/menubar/menubar';
import { SnModalSheet } from './lib/patterns/modal-sheet';
import { SnNumberBox } from './lib/controls/number-box';
import { SnSettingsGroup, SnSettingsRow } from './lib/patterns/settings';
import { SnSidebarNavImports } from './lib/patterns/sidebar-nav';
import { SnAssistantImports } from './lib/patterns/assistant';
import { SnChecklistImports } from './lib/patterns/checklist';
import { SnSplitButtonImports } from './lib/controls/split-button';
import { SnStatusBarImports } from './lib/window/status-bar';
import { SnStatusPage } from './lib/patterns/status-page';
import { SnTreeImports } from './lib/controls/tree';
import { SnTooltip } from './lib/controls/tooltip';
import { SnPlatformIf } from './lib/platform/platform-if';
import { SnShortcut } from './lib/platform/shortcut';
import { SnTitleBar } from './lib/window/title-bar';
import { SnWindowControls } from './lib/window/window-controls';

export const SnWindowImports = [SnTitleBar, SnWindowControls, ...SnStatusBarImports] as const;
export const SnControlsImports = [...SnSplitButtonImports, SnNumberBox, ...SnTreeImports, SnTooltip] as const;
export const SnMenuImports = [SnMenubar, SnContextMenu] as const;
export const SnSettingsImports = [SnSettingsGroup, SnSettingsRow] as const;
export const SnPlatformImports = [SnPlatformIf, SnShortcut] as const;
export const SnDesktopUiImports = [
  ...SnWindowImports,
  ...SnSettingsImports,
  SnStatusPage,
  ...SnCommandBarImports,
  ...SnCoachMarkImports,
  SnModalSheet,
  ...SnInspectorImports,
  ...SnSidebarNavImports,
  ...SnAssistantImports,
  ...SnChecklistImports,
  ...SnControlsImports,
  ...SnMenuImports,
  ...SnPlatformImports,
] as const;
