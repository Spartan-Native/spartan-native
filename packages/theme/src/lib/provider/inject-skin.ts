import { DOCUMENT } from '@angular/common';
import { computed, DestroyRef, inject, type Signal, signal } from '@angular/core';
import type { Skin } from '../contract/native-host';
import { type PlatformFamily, skinFamily } from '../skin/skin-family';

export { type PlatformFamily, skinFamily } from '../skin/skin-family';
import { SpartanNativeTheme } from './spartan-native-theme';

/**
 * The active skin as a signal, for components that render differently per OS.
 *
 * With provideSpartanNative() it is the theme service's signal. Without it
 * (Storybook, plain applySpartanNative(), a micro-frontend) it follows the
 * `data-sn-skin` attribute on <html>.
 */
export function injectSkin(): Signal<Skin> {
  const theme = inject(SpartanNativeTheme, { optional: true });
  if (theme) return theme.skin;

  const root = inject(DOCUMENT).documentElement;
  const read = () => (root.dataset['snSkin'] as Skin | undefined) ?? 'web';
  const skin = signal<Skin>(read());
  if (typeof MutationObserver !== 'undefined') {
    const observer = new MutationObserver(() => skin.set(read()));
    observer.observe(root, { attributes: true, attributeFilter: ['data-sn-skin'] });
    inject(DestroyRef).onDestroy(() => observer.disconnect());
  }
  return skin.asReadonly();
}

/**
 * The skin the real OS has (see `SpartanNativeTheme.nativeSkin`), whatever skin the user picked.
 * Use it where the OS itself draws something, e.g. the space its window buttons take.
 *
 * Without provideSpartanNative() it follows the `data-sn-platform` attribute on <html>, and
 * falls back to the active skin.
 */
export function injectNativeSkin(): Signal<Skin> {
  const theme = inject(SpartanNativeTheme, { optional: true });
  if (theme) return theme.nativeSkin;

  const skin = injectSkin();
  const root = inject(DOCUMENT).documentElement;
  const read = () => root.dataset['snPlatform'] as Skin | undefined;
  const platform = signal<Skin | undefined>(read());
  if (typeof MutationObserver !== 'undefined') {
    const observer = new MutationObserver(() => platform.set(read()));
    observer.observe(root, { attributes: true, attributeFilter: ['data-sn-platform'] });
    inject(DestroyRef).onDestroy(() => observer.disconnect());
  }
  return computed(() => platform() ?? skin());
}

/**
 * The real OS family as a signal (see `SpartanNativeTheme.platformFamily`): what the keyboard
 * and the window manager follow, whatever skin the user picked. Use it for behavior (shortcut
 * notation, the macOS menu bar); use `injectSkin()` for the look.
 */
export function injectPlatformFamily(): Signal<PlatformFamily> {
  const theme = inject(SpartanNativeTheme, { optional: true });
  if (theme) return theme.platformFamily;
  const native = injectNativeSkin();
  return computed(() => skinFamily(native()));
}
