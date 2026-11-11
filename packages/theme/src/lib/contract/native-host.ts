/**
 * The host contract (docs/07-host-adapters.md).
 * Every @spartan-native/host-* adapter implements NativeHost; the theme and the
 * components only ever talk to this interface.
 */

/** Platform skin. `web` is the generic fallback when the OS is unknown. */
export type Skin = 'win' | 'w10' | 'mac' | 'macc' | 'gtk' | 'qt' | 'cros' | 'web';

/** The skins with a full style sheet in this release. */
export const STYLED_SKINS = ['win', 'w10', 'mac', 'macc', 'gtk', 'qt', 'cros'] as const satisfies readonly Skin[];
export type StyledSkin = (typeof STYLED_SKINS)[number];

export type ColorScheme = 'light' | 'dark';
export type ContrastPreference = 'normal' | 'more' | 'forced';

/** The settings the user already chose in the OS. */
export interface AppearanceState {
  /** From PlatformInfo; the user can override it. */
  skin: Skin;
  /** `#rrggbb` */
  accent: string;
  scheme: ColorScheme;
  contrast: ContrastPreference;
  reduceTransparency: boolean;
  reduceMotion: boolean;
  /** 1 = 100 %. Supported steps: 1, 1.25, 1.5, 1.75, 2. */
  textScale: number;
}

export interface PlatformInfo {
  os: 'windows' | 'macos' | 'linux' | 'chromeos' | 'unknown';
  /** '10.0.22631', '26.1', '15.6' … */
  version: string | null;
  /** Windows: ≥ 22000 means Windows 11. */
  build: number | null;
  desktop: 'gnome' | 'kde' | 'cinnamon' | 'xfce' | 'other' | null;
  /** Resolved with resolveSkin(). */
  skin: Skin;
  confidence: 'exact' | 'hint' | 'unknown';
}

/** One key per row of the capability matrix. */
export type Capability =
  | 'systemAccent'
  | 'colorScheme'
  | 'highContrast'
  | 'reduceTransparency'
  | 'textScale'
  | 'windowFocus'
  | 'windowMaterial'
  | 'customTitleBar'
  | 'nativeMenus'
  | 'notifications'
  | 'taskbarProgress'
  | 'fileDialogs'
  | 'osVersion'
  | 'linuxDesktop';

/** Every capability, in matrix order. Adapters and the conformance suite iterate this. */
export const CAPABILITIES: readonly Capability[] = [
  'systemAccent', 'colorScheme', 'highContrast', 'reduceTransparency', 'textScale', 'windowFocus', 'windowMaterial',
  'customTitleBar', 'nativeMenus', 'notifications', 'taskbarProgress', 'fileDialogs', 'osVersion', 'linuxDesktop',
];

export type CapabilityLevel = 'native' | 'partial' | 'none';
export type HostCapabilities = Record<Capability, CapabilityLevel>;

export type Unsubscribe = () => void;

/**
 * Window services. Focus is required; the window actions are optional: hosts that
 * own a real window (Wails, Tauri, Electron, Photino) implement them, and
 * desktop-ui's window controls call them automatically.
 */
export interface WindowHost {
  isFocused(): Promise<boolean>;
  onFocusChange(cb: (focused: boolean) => void): Unsubscribe;

  minimize?(): Promise<void>;
  toggleMaximize?(): Promise<void>;
  close?(): Promise<void>;
  isMaximized?(): Promise<boolean>;
  onMaximizedChange?(cb: (maximized: boolean) => void): Unsubscribe;
}

/**
 * Standard OS menu items the runtime builds itself, with the OS's own label, shortcut and action.
 * The `…Menu` roles are whole submenus (macOS app menu, Edit, Window). Roles the OS doesn't have
 * (the app menu, Hide, Services outside macOS) are left out by the adapter.
 */
export type MenuRole =
  | 'appMenu'
  | 'editMenu'
  | 'windowMenu'
  | 'about'
  | 'hide'
  | 'hideOthers'
  | 'showAll'
  | 'quit'
  | 'undo'
  | 'redo'
  | 'cut'
  | 'copy'
  | 'paste'
  | 'selectAll'
  | 'minimize'
  | 'zoom'
  | 'close'
  | 'toggleFullscreen';

export const MENU_ROLES: readonly MenuRole[] = [
  'appMenu', 'editMenu', 'windowMenu', 'about', 'hide', 'hideOthers', 'showAll', 'quit', 'undo', 'redo',
  'cut', 'copy', 'paste', 'selectAll', 'minimize', 'zoom', 'close', 'toggleFullscreen',
];

/**
 * One entry of a native menu: plain data, so it can cross into Go, Rust, Node or .NET.
 * An item with `submenu` opens a submenu; `type: 'separator'` is a divider (other fields ignored).
 */
export interface MenuItem {
  /** Reported to `MenuHost.onAction` when the item is chosen. Unique within the menu. */
  readonly id?: string;
  readonly label?: string;
  /** Default: `'normal'`. Radio items between two separators form one group. */
  readonly type?: 'normal' | 'checkbox' | 'radio' | 'separator';
  /** A shortcut in the portable notation of desktop-ui's `formatShortcut()`: `mod+shift+s`, `delete`, `f2`. */
  readonly accelerator?: string;
  /** Default: true. */
  readonly enabled?: boolean;
  readonly checked?: boolean;
  /** A standard OS item; label and action come from the OS (a `label` overrides the text). */
  readonly role?: MenuRole;
  readonly submenu?: readonly MenuItem[];
}

/**
 * Native app & context menus. Optional on NativeHost; a host lists only what its runtime
 * can do (capability `nativeMenus`). Chosen items come back through `onAction` by id, from
 * both kinds of menu; roles are handled by the OS and not reported.
 */
export interface MenuHost {
  /**
   * Sets the application menu: the global menu bar on macOS, the window's menu bar elsewhere.
   * Call it again with the whole menu to update labels, `enabled` or `checked`. An empty array
   * removes it.
   */
  setApplicationMenu?(menu: readonly MenuItem[]): Promise<void>;
  /** Shows a native context menu at `x`, `y` (CSS pixels, relative to the window's content). */
  showContextMenu?(menu: readonly MenuItem[], position: { x: number; y: number }): Promise<void>;
  /** An item with an `id` was chosen in either kind of menu. */
  onAction(cb: (id: string) => void): Unsubscribe;
}

/** OS notifications. Specified in phase 05 (docs/10-open-questions.md, Q2). */
export type NotificationHost = Record<string, never>;

export interface NativeHost {
  readonly runtime: 'web' | 'wails' | 'tauri' | 'electron' | 'dotnet' | 'static';
  readonly capabilities: HostCapabilities;
  platform(): Promise<PlatformInfo>;
  appearance(): Promise<AppearanceState>;
  onAppearanceChange(cb: (state: AppearanceState) => void): Unsubscribe;
  readonly window: WindowHost;
  /** Native menus; absent when the runtime has none (then desktop-ui draws them in the page). */
  readonly menus?: MenuHost;
  readonly notifications?: NotificationHost;
}

export const TEXT_SCALES = [1, 1.25, 1.5, 1.75, 2] as const;
export const DEFAULT_ACCENT = '#0078d4';

export const DEFAULT_APPEARANCE: AppearanceState = {
  skin: 'win',
  accent: DEFAULT_ACCENT,
  scheme: 'light',
  contrast: 'normal',
  reduceTransparency: false,
  reduceMotion: false,
  textScale: 1,
};
