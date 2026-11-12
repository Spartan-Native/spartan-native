/**
 * The host contract.
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
  'systemAccent',
  'colorScheme',
  'highContrast',
  'reduceTransparency',
  'textScale',
  'windowFocus',
  'windowMaterial',
  'customTitleBar',
  'nativeMenus',
  'notifications',
  'taskbarProgress',
  'fileDialogs',
  'osVersion',
  'linuxDesktop',
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
  'appMenu',
  'editMenu',
  'windowMenu',
  'about',
  'hide',
  'hideOthers',
  'showAll',
  'quit',
  'undo',
  'redo',
  'cut',
  'copy',
  'paste',
  'selectAll',
  'minimize',
  'zoom',
  'close',
  'toggleFullscreen',
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

/** One entry of a file dialog's type list. */
export interface FileFilter {
  /** Shown in the dialog: `'Images'`. */
  readonly name: string;
  /** Without the dot: `['png', 'jpg']`. `['*']` matches every file. */
  readonly extensions: readonly string[];
}

interface FileDialogOptions {
  /** The dialog's title (not shown by every OS). */
  readonly title?: string;
  /** The text of the confirm button. Default: the OS's own ("Open", "Save", …). */
  readonly buttonLabel?: string;
  /** Native hosts: the folder to start in. Browsers ignore it. */
  readonly directory?: string;
}

export interface OpenFileOptions extends FileDialogOptions {
  readonly filters?: readonly FileFilter[];
  /** Default: false. */
  readonly multiple?: boolean;
}

export interface SaveFileOptions extends FileDialogOptions {
  readonly filters?: readonly FileFilter[];
  /** The suggested file name: `'Report.pdf'`. */
  readonly fileName?: string;
}

export type PickFolderOptions = FileDialogOptions;

/**
 * A file or folder the user chose. Native hosts give a `path`; the browser has no paths
 * and gives a File System Access `handle` instead. `name` is always set.
 */
export interface PickedFile {
  readonly name: string;
  readonly path?: string;
  readonly handle?: FileSystemHandle;
}

/** The OS's own alert. Buttons are listed in reading order; the OS places them its own way. */
export interface MessageOptions {
  /** Default: `'info'`. Picks the icon. */
  readonly kind?: 'info' | 'question' | 'warning' | 'error';
  readonly title?: string;
  readonly message: string;
  /** Default: one "OK" button with id `'ok'`. */
  readonly buttons?: readonly { readonly id: string; readonly label: string }[];
  /** Enter presses this one. */
  readonly defaultId?: string;
  /** Esc (and closing the alert) presses this one. */
  readonly cancelId?: string;
}

/**
 * Native file dialogs and alerts. Optional on NativeHost; present exactly when the
 * `fileDialogs` capability isn't `none`. A cancelled dialog resolves to `[]` or `null`, never rejects.
 */
export interface DialogHost {
  /** Resolves the chosen files, or `[]` when cancelled. */
  openFile(options?: OpenFileOptions): Promise<PickedFile[]>;
  /** Resolves where to save, or `null` when cancelled. */
  saveFile(options?: SaveFileOptions): Promise<PickedFile | null>;
  /** Resolves the chosen folder, or `null` when cancelled. */
  pickFolder(options?: PickFolderOptions): Promise<PickedFile | null>;
  /**
   * Shows the OS's alert and resolves the id of the pressed button (`cancelId` when it was
   * dismissed). Absent where the OS has none (the browser): draw an hlm-alert-dialog instead.
   */
  message?(options: MessageOptions): Promise<string | null>;
}

/** OS notifications. A placeholder: its shape is not specified yet. */
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
  /** File dialogs and alerts; absent when the runtime has none (capability `fileDialogs`). */
  readonly dialogs?: DialogHost;
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
