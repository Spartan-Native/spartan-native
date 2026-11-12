/*
 * Public API surface of @spartan-native/host-web: the NativeHost for browsers and PWAs.
 *
 *   provideSpartanNative({ host: webHost() })
 */
export { webHost } from './lib/web-host';
export type { WebHostOptions } from './lib/web-host';
export { fromClientHints, fromUserAgent } from './lib/detect-platform';
export { readDisplayMode, watchDisplayMode } from './lib/display-mode';
export type { DisplayMode } from './lib/display-mode';
