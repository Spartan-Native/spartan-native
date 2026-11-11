import { DestroyRef, inject, type Signal, signal } from '@angular/core';
import { type DisplayMode, watchDisplayMode } from '@spartan-native/host-web';

/** The app's display mode as a signal: 'browser' tab, installed 'standalone', or 'overlay' (Window Controls Overlay). */
export function injectDisplayMode(): Signal<DisplayMode> {
  const mode = signal<DisplayMode>('browser');
  inject(DestroyRef).onDestroy(watchDisplayMode((m) => mode.set(m)));
  return mode.asReadonly();
}
