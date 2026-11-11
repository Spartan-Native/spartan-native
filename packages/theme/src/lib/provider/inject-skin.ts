import { DOCUMENT } from '@angular/common';
import { DestroyRef, inject, type Signal, signal } from '@angular/core';
import type { Skin } from '../contract/native-host';
import { SpartanNativeTheme } from './spartan-native-theme';

/** The OS family a skin belongs to: what window chrome and shortcuts follow. */
export type PlatformFamily = 'windows' | 'macos' | 'linux' | 'chromeos' | 'web';

export function skinFamily(skin: Skin): PlatformFamily {
  switch (skin) {
    case 'win':
    case 'w10':
      return 'windows';
    case 'mac':
    case 'macc':
      return 'macos';
    case 'gtk':
    case 'qt':
      return 'linux';
    case 'cros':
      return 'chromeos';
    default:
      return 'web';
  }
}

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
