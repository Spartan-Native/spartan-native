import { withThemeByClassName } from '@storybook/addon-themes';
import type { Decorator, Preview } from '@storybook/angular';
import { applySpartanNative, DEFAULT_ACCENT, type Skin } from '@spartan-native/theme';

export { ACCENT_PRESETS, STORYBOOK_SKINS, type OsFamily } from './toolbar-options';

export interface SpartanNativePreviewOptions {
  /** Add a text-size toolbar (100–200 %). Default: false. */
  textSize?: boolean;
  /** Add a window-focus toggle (focused / inactive). Default: false. */
  windowFocus?: boolean;
}

/**
 * Applies the toolbar globals and the light/dark switcher to <html>,
 * exactly like provideSpartanNative() does in an app.
 */
export const withSpartanNative: Decorator = (story, context) => {
  const g = context.globals;
  applySpartanNative(document.documentElement, {
    skin: (g['skin'] as Skin) ?? 'win',
    scheme: g['theme'] === 'dark' ? 'dark' : 'light',
    accent: (g['accent'] as string) || DEFAULT_ACCENT,
    reduceTransparency: g['transparency'] === 'reduced',
    textScale: Number(g['textScale'] ?? 1),
    focused: g['window'] !== 'inactive',
    contrast: g['contrast'] === 'more' ? 'more' : 'normal',
    reduceMotion: false,
  });
  document.body.style.background = 'var(--sn-color-wall)';
  document.body.style.margin = '0';
  // At least as tall as the viewport: the body background paints the whole canvas, and on a
  // short story a gradient wallpaper (macOS, Windows Mica) would otherwise repeat in bands.
  document.body.style.minHeight = '100vh';
  return story();
};

/**
 * A complete Storybook preview for Spartan Native.
 *
 * ```ts
 * // .storybook/preview.ts
 * import { spartanNativePreview } from '@spartan-native/theme/storybook';
 * export default spartanNativePreview();
 *
 * // .storybook/manager.tsx: the toolbar (OS with icons, switches, accent swatches)
 * import '@spartan-native/theme/storybook/manager';
 * ```
 *
 * The OS, transparency, contrast, window-focus and accent globals have no `toolbar`
 * entry here: the manager addon draws them as an OS select, toggle buttons and an
 * accent picker. Only the text size uses Storybook's own toolbar dropdown.
 */
export function spartanNativePreview(options: SpartanNativePreviewOptions = {}): Preview {
  const globalTypes: NonNullable<Preview['globalTypes']> = {
    skin: { description: 'Operating system' },
    transparency: { description: 'Reduce transparency (OS accessibility setting): normal | reduced' },
    contrast: { description: 'Increase contrast (OS accessibility setting): normal | more' },
    accent: { description: 'The accent color the OS reports. Every theme color is derived from it.' },
  };
  const initialGlobals: Record<string, unknown> = {
    skin: 'win',
    transparency: 'normal',
    contrast: 'normal',
    accent: DEFAULT_ACCENT,
  };

  if (options.textSize) {
    globalTypes['textScale'] = {
      description: 'OS text size',
      toolbar: {
        title: 'Text size',
        icon: 'zoom',
        items: ['1', '1.25', '1.5', '1.75', '2'].map((v) => ({ value: v, title: `${Number(v) * 100}%` })),
        dynamicTitle: true,
      },
    };
    initialGlobals['textScale'] = '1';
  }
  if (options.windowFocus) {
    globalTypes['window'] = { description: 'Window focus: focused | inactive' };
    initialGlobals['window'] = 'focused';
  }

  return {
    globalTypes,
    initialGlobals,
    decorators: [
      withSpartanNative,
      // Storybook's standard light/dark switcher; withSpartanNative reads its `theme` global.
      withThemeByClassName({ themes: { light: 'light', dark: 'dark' }, defaultTheme: 'light' }),
    ],
    parameters: {
      layout: 'fullscreen',
      controls: { expanded: true },
      a11y: { test: 'todo' },
    },
  };
}
