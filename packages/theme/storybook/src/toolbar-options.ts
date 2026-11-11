// What the Storybook toolbar offers. Shared by the preview (Angular) and the toolbar
// addon (manager/, React), so it must not import anything at runtime.
import type { Skin } from '@spartan-native/theme';

/** The OS family, which picks the icon in the toolbar. */
export type OsFamily = 'windows' | 'apple' | 'linux' | 'chrome';

/** The skins offered in the OS toolbar. */
export const STORYBOOK_SKINS: { value: Skin; title: string; family: OsFamily }[] = [
  { value: 'win', title: 'Windows 11', family: 'windows' },
  { value: 'w10', title: 'Windows 10', family: 'windows' },
  { value: 'mac', title: 'macOS 26', family: 'apple' },
  { value: 'macc', title: 'macOS 13–15', family: 'apple' },
  { value: 'gtk', title: 'GNOME · GTK 4', family: 'linux' },
  { value: 'qt', title: 'KDE Plasma', family: 'linux' },
  { value: 'cros', title: 'ChromeOS', family: 'chrome' },
];

/** Preset accent colors: the platforms' default accents plus a few common picks. */
export const ACCENT_PRESETS: { value: string; title: string }[] = [
  { value: '#0078d4', title: 'Windows blue' },
  { value: '#007aff', title: 'macOS blue' },
  { value: '#3584e4', title: 'GNOME blue' },
  { value: '#9141ac', title: 'Purple' },
  { value: '#e66100', title: 'Orange' },
  { value: '#26a269', title: 'Green' },
  { value: '#d56199', title: 'Pink' },
];
