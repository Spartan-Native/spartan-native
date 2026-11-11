/*
 * Public API surface of @spartan-native/desktop-ui:
 * window chrome, OS signature patterns and platform helpers.
 */

// Window chrome
export * from './lib/window/window-controls';
export * from './lib/window/title-bar';

// OS patterns
export * from './lib/patterns/settings';
export * from './lib/patterns/status-page';
export * from './lib/patterns/command-bar';
export * from './lib/patterns/coach-mark';
export * from './lib/patterns/modal-sheet';
export * from './lib/patterns/inspector';
export * from './lib/patterns/sidebar-nav';

// Platform helpers
export * from './lib/platform/shortcut';
export * from './lib/platform/platform-if';

import { SnCoachMarkImports } from './lib/patterns/coach-mark';
import { SnCommandBarImports } from './lib/patterns/command-bar';
import { SnInspectorImports } from './lib/patterns/inspector';
import { SnModalSheet } from './lib/patterns/modal-sheet';
import { SnSettingsGroup, SnSettingsRow } from './lib/patterns/settings';
import { SnSidebarNavImports } from './lib/patterns/sidebar-nav';
import { SnStatusPage } from './lib/patterns/status-page';
import { SnPlatformIf } from './lib/platform/platform-if';
import { SnShortcut } from './lib/platform/shortcut';
import { SnTitleBar } from './lib/window/title-bar';
import { SnWindowControls } from './lib/window/window-controls';

export const SnWindowImports = [SnTitleBar, SnWindowControls] as const;
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
  ...SnPlatformImports,
] as const;
