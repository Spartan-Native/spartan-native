/*
 * Public API surface of @spartan-native/theme.
 * Styles: import '@spartan-native/theme/styles/spartan-native.scss' (see README).
 */

// Host contract (implemented by the @spartan-native/host-* adapters)
export * from './lib/contract/native-host';
export * from './lib/contract/static-host';

// Palette
export * from './lib/palette/color';
export * from './lib/palette/derive-palette';
export * from './lib/palette/palette-css-vars';

// Skins
export * from './lib/skin/resolve-skin';
export * from './lib/skin/skin-labels';

// Angular integration
export * from './lib/provider/apply-appearance';
export * from './lib/provider/spartan-native-theme';
export * from './lib/provider/provide-spartan-native';
export * from './lib/provider/inject-skin';
