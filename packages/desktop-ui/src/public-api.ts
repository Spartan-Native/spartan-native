/*
 * Public API surface of @spartan-native/desktop-ui:
 * window chrome, OS signature patterns, desktop controls, menus and platform helpers.
 */

// Window chrome
export * from './lib/window/window-controls';
export * from './lib/window/title-bar';
export * from './lib/window/status-bar';

// OS patterns
export * from './lib/patterns/settings';
export * from './lib/patterns/status-page';
export * from './lib/patterns/command-bar';
export * from './lib/patterns/coach-mark';
export * from './lib/patterns/modal-sheet';
export * from './lib/patterns/inspector';
export * from './lib/patterns/sidebar-nav';
export * from './lib/patterns/assistant';
export * from './lib/patterns/checklist';

// Desktop controls spartan doesn't have
export * from './lib/controls/split-button';
export * from './lib/controls/number-box';
export * from './lib/controls/tree';
export * from './lib/controls/tooltip';

// Menus: the application menu bar and context menus, native through the host where it can
export * from './lib/menubar/menu-model';
export * from './lib/menubar/native-menus';
export * from './lib/menubar/menubar';
export * from './lib/menubar/context-menu';

// Platform helpers
export * from './lib/platform/shortcut';
export * from './lib/platform/platform-if';

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
