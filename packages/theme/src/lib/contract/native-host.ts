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

/** Native app & context menus. Specified in phase 05 (docs/10-open-questions.md, Q2). */
export type MenuHost = Record<string, never>;

/** OS notifications. Specified in phase 05 (docs/10-open-questions.md, Q2). */
export type NotificationHost = Record<string, never>;

export interface NativeHost {
  readonly runtime: 'web' | 'wails' | 'tauri' | 'electron' | 'dotnet' | 'static';
  readonly capabilities: HostCapabilities;
  platform(): Promise<PlatformInfo>;
  appearance(): Promise<AppearanceState>;
  onAppearanceChange(cb: (state: AppearanceState) => void): Unsubscribe;
  readonly window: WindowHost;
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
