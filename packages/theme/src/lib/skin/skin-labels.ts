import type { ColorScheme, ContrastPreference, Skin, StyledSkin } from '../contract/native-host';
import { STYLED_SKINS, TEXT_SCALES } from '../contract/native-host';

/** The display name of each skin, for settings screens ("Look like: Windows 11"). */
export const SKIN_LABELS: Readonly<Record<Skin, string>> = {
  win: 'Windows 11',
  w10: 'Windows 10',
  mac: 'macOS 26',
  macc: 'macOS 13–15',
  gtk: 'GNOME',
  qt: 'KDE Plasma',
  cros: 'ChromeOS',
  web: 'Web',
};

/** The display name of each color scheme. */
export const SCHEME_LABELS: Readonly<Record<ColorScheme, string>> = { light: 'Light', dark: 'Dark' };

/** The display name of each contrast preference. */
export const CONTRAST_LABELS: Readonly<Record<ContrastPreference, string>> = {
  normal: 'Standard',
  more: 'Increased',
  forced: 'Contrast theme',
};

/** One choice of a settings control: a value and its label. */
export interface SnOption<T> {
  readonly value: T;
  readonly label: string;
}

/** The skins a user can pick from (every styled skin), labelled. */
export const SKIN_OPTIONS: readonly SnOption<StyledSkin>[] = STYLED_SKINS.map((value) => ({
  value,
  label: SKIN_LABELS[value],
}));

/** The supported text sizes, labelled as percentages ("125 %"). */
export const TEXT_SCALE_OPTIONS: readonly SnOption<number>[] = TEXT_SCALES.map((value) => ({
  value,
  label: `${Math.round(value * 100)} %`,
}));
