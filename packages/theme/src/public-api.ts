/*
 * Public API surface of @spartan-native/theme.
 * Styles: import '@spartan-native/theme/styles/spartan-native.scss' (see README).
 */

// Host contract (implemented by the @spartan-native/host-* adapters)
export {
  CAPABILITIES,
  DEFAULT_ACCENT,
  DEFAULT_APPEARANCE,
  MENU_ROLES,
  STYLED_SKINS,
  TEXT_SCALES,
} from './lib/contract/native-host';
export type {
  AppearanceState,
  Capability,
  CapabilityLevel,
  ColorScheme,
  ContrastPreference,
  DialogHost,
  FileFilter,
  HostCapabilities,
  MenuHost,
  MenuItem,
  MenuRole,
  MessageOptions,
  NativeHost,
  NotificationHost,
  OpenFileOptions,
  PickedFile,
  PickFolderOptions,
  PlatformInfo,
  SaveFileOptions,
  Skin,
  StyledSkin,
  Unsubscribe,
  WindowHost,
} from './lib/contract/native-host';
export { staticHost } from './lib/contract/static-host';
export type { StaticHost } from './lib/contract/static-host';

// Palette
export {
  adjustLightness,
  contrastRatio,
  ensureContrast,
  fromHsl,
  hexToRgb,
  mix,
  normalizeHex,
  readableOn,
  relativeLuminance,
  rgba,
  rgbToHex,
  toHsl,
} from './lib/palette/color';
export type { Hsl, Rgb } from './lib/palette/color';
export { derivePalette } from './lib/palette/derive-palette';
export type { DeriveOptions, Palette } from './lib/palette/derive-palette';
export { paletteToCssVars, paletteVarName } from './lib/palette/palette-css-vars';

// Skins
export { resolveSkin, skinClasses } from './lib/skin/resolve-skin';
export { CONTRAST_LABELS, SCHEME_LABELS, SKIN_LABELS, SKIN_OPTIONS, TEXT_SCALE_OPTIONS } from './lib/skin/skin-labels';
export type { SnOption } from './lib/skin/skin-labels';

// Angular integration
export { applySpartanNative } from './lib/provider/apply-appearance';
export type { ResolvedAppearance } from './lib/provider/apply-appearance';
export {
  DEFAULT_PERSIST_KEY,
  NATIVE_HOST,
  readStoredOverrides,
  SPARTAN_NATIVE_OPTIONS,
  SpartanNativeTheme,
} from './lib/provider/spartan-native-theme';
export type { SpartanNativeOptions, SpartanNativePersistence } from './lib/provider/spartan-native-theme';
export { provideSpartanNative } from './lib/provider/provide-spartan-native';
export { injectNativeSkin, injectPlatformFamily, injectSkin, skinFamily } from './lib/provider/inject-skin';
export type { PlatformFamily } from './lib/provider/inject-skin';
