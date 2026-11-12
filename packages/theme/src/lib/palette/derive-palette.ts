/**
 * derivePalette(): one accent color in, every theme color out.
 *
 * 1. Start from the platform's own neutrals (background, surface, text) and tint them
 *    slightly toward the accent.
 * 2. Derive every other color from those three and the accent by mixing, then push text
 *    colors until they reach WCAG contrast.
 * 3. Apply the skin's adjustments (KDE, Windows 10, classic macOS), reduced transparency,
 *    and on ChromeOS replace most colors with a Material 3 tonal palette.
 *
 * The same algorithm, written out as formulas, is in the repository's docs/03-theme-tokens.md.
 */
import type { ColorScheme, Skin } from '../contract/native-host';
import { adjustLightness, ensureContrast, fromHsl, mix, normalizeHex, readableOn, rgba, toHsl } from './color';

/**
 * Every color token. Each key becomes a CSS variable `--sn-color-<kebab-key>` (see
 * palette-css-vars.ts), in this order.
 */
export interface Palette {
  // --- Surfaces -----------------------------------------------------------------------------
  /** Backdrop behind materials: a gradient on Windows 11 and macOS 26, `bg` elsewhere. */
  wall: string;
  /** Window background. */
  bg: string;
  /** Cards, panels and popovers; translucent on macOS 26. */
  surface: string;
  /** `surface` without transparency. */
  surfaceSolid: string;

  // --- Text ---------------------------------------------------------------------------------
  /** Body text. */
  fg: string;
  /** Secondary text, ≥ 4.5:1 on `bg`. */
  fgMuted: string;

  // --- Accent -------------------------------------------------------------------------------
  /** The accent exactly as the OS reports it. */
  accent: string;
  /** Filled accent controls (default button, checked switch); the platform's own shade of the accent. */
  primary: string;
  /** Text on `primary`. */
  primaryFg: string;
  /** `primary` 12 % darker: the bottom edge of Fluent accent buttons. */
  primaryEdge: string;
  /** Accent-tinted surface (secondary buttons, tonal selection). */
  secondary: string;
  /** Text on `secondary`, ≥ 4.5:1. */
  secondaryFg: string;
  /** The accent as text, ≥ 4.5:1 on `bg`. */
  accentText: string;
  /** Background lightly tinted with the accent (muted areas, skeletons). */
  muted: string;
  /** Dividers and outlines. */
  border: string;
  /** Focus ring: the accent at 50 % alpha. */
  ring: string;

  // --- Status -------------------------------------------------------------------------------
  /** Errors and destructive actions. */
  danger: string;
  /** Text on `danger`. */
  dangerFg: string;
  success: string;
  /** Text on `success`. */
  successFg: string;
  warning: string;
  /** Text on `warning`. */
  warningFg: string;

  // --- Controls -----------------------------------------------------------------------------
  /** Hairline control borders. */
  stroke: string;
  /** Bottom edge of Fluent controls. */
  strokeBottom: string;
  /** Unchecked checkbox / radio / switch outline. */
  controlStrong: string;
  /** Switch and slider track. */
  track: string;
  /** Neutral control fill (GTK and KDE buttons and entries). */
  control: string;
  /** Hover fill for rows, menu items and flat buttons. */
  hover: string;

  // --- Materials ----------------------------------------------------------------------------
  /** Windows 11 menus and flyouts: the surface at 90 % alpha, under a blur. */
  acrylic: string;
  /** macOS Liquid Glass fill. */
  glass: string;
  /** Edge of a glass surface. */
  glassBorder: string;
  /** Inset top highlight of a glass surface. */
  glassHighlight: string;

  // --- Specific parts -----------------------------------------------------------------------
  /** The selected item of a segmented control. */
  segmentOn: string;
  /** Backdrop behind modal dialogs. */
  scrim: string;
  /** Toast background (dark in both schemes). */
  toast: string;
  /** Input bottom stroke (Fluent text fields). */
  inputStroke: string;
  /** Sidebar fill. */
  sidebar: string;
}

export interface DeriveOptions {
  skin: Skin;
  accent: string;
  scheme: ColorScheme;
  reduceTransparency?: boolean;
}

/** WCAG AA contrast for body text. */
const TEXT_CONTRAST = 4.5;

/** The four sets of platform neutrals. Every skin starts from one of them. */
type NeutralSet = 'win' | 'mac' | 'gtk' | 'qt';

interface Neutrals {
  background: string;
  surface: string;
  foreground: string;
}

const NEUTRALS: Record<NeutralSet, Record<ColorScheme, Neutrals>> = {
  win: {
    light: { background: '#f3f3f3', surface: '#fbfbfb', foreground: '#1a1a1a' },
    dark: { background: '#202020', surface: '#2b2b2b', foreground: '#ffffff' },
  },
  mac: {
    light: { background: '#f2f2f4', surface: '#ffffff', foreground: '#1d1d1f' },
    dark: { background: '#1e1e21', surface: '#2c2c2f', foreground: '#f5f5f7' },
  },
  gtk: {
    light: { background: '#fafafb', surface: '#ffffff', foreground: '#2e2e32' },
    dark: { background: '#222226', surface: '#36363a', foreground: '#ffffff' },
  },
  qt: {
    light: { background: '#eff0f1', surface: '#ffffff', foreground: '#232629' },
    dark: { background: '#202326', surface: '#141618', foreground: '#fcfcfc' },
  },
};

/** Which neutrals each skin starts from. ChromeOS replaces most of them with Material 3 later. */
const NEUTRAL_SET: Record<Skin, NeutralSet> = {
  win: 'win',
  w10: 'win',
  mac: 'mac',
  macc: 'mac',
  gtk: 'gtk',
  cros: 'gtk',
  qt: 'qt',
  web: 'gtk',
};

/** Hues of the status colors. */
const HUE = { danger: 356, success: 145, warning: 38 };

const clamp = (min: number, max: number, value: number) => Math.max(min, Math.min(max, value));

/**
 * A status color: a fixed hue that borrows the accent's saturation and lightness, kept in a
 * range where the color still reads as red, green or amber. A little lighter in dark mode.
 */
function statusColor(accent: string, hue: number, dark: boolean): string {
  const [, accentSaturation, accentLightness] = toHsl(accent);
  const saturation = clamp(0.55, 0.85, accentSaturation);
  const lightness = clamp(0.42, 0.52, accentLightness) + (dark ? 0.08 : 0);
  return fromHsl(hue, saturation, lightness);
}

/** `primary`: the accent as each platform shades it for filled controls. */
function primaryFor(neutralSet: NeutralSet, accent: string, dark: boolean): string {
  if (neutralSet === 'win') {
    // Fluent: a lighter accent shade in dark mode, a slightly darker one in light mode.
    const [hue, saturation, lightness] = toHsl(accent);
    return dark
      ? fromHsl(hue, saturation, Math.min(0.8, Math.max(lightness + 0.2, 0.68)))
      : adjustLightness(accent, -0.06);
  }
  if (neutralSet === 'mac' && dark) return adjustLightness(accent, 0.04);
  return accent;
}

/** `wall`: the backdrop that glass and Mica blur. */
function wallFor(neutralSet: NeutralSet, accent: string, bg: string, dark: boolean): string {
  if (neutralSet === 'mac') {
    // Two soft light sources: the accent hue turned 35° at the top left, the accent at the bottom right.
    const [hue, saturation] = toHsl(accent);
    const tint = rgba(fromHsl(hue + 35, Math.max(saturation, 0.5), dark ? 0.4 : 0.7), dark ? 0.5 : 0.45);
    return (
      `radial-gradient(60% 90% at 10% 10%, ${tint}, transparent 70%), ` +
      `radial-gradient(55% 80% at 92% 95%, ${rgba(accent, dark ? 0.45 : 0.32)}, transparent 70%), ${bg}`
    );
  }
  if (neutralSet === 'win') {
    // Mica: the background, tinted toward the accent in the top-left corner.
    return `linear-gradient(135deg, ${mix(bg, accent, dark ? 0.1 : 0.08)}, ${bg} 60%)`;
  }
  return bg;
}

/** The palette every skin starts from: platform neutrals tinted toward the accent. */
function basePalette(neutralSet: NeutralSet, accent: string, dark: boolean): Palette {
  const neutrals = NEUTRALS[neutralSet][dark ? 'dark' : 'light'];
  const fg = neutrals.foreground;
  const bg = mix(neutrals.background, accent, neutralSet === 'win' ? 0.05 : 0.03);
  const surface = mix(neutrals.surface, accent, dark ? 0.04 : 0.015);

  const primary = primaryFor(neutralSet, accent, dark);
  const accentText = ensureContrast(accent, bg, TEXT_CONTRAST, dark);
  const secondary = mix(surface, accent, dark ? 0.22 : 0.12);
  const danger = statusColor(accent, HUE.danger, dark);
  const success = statusColor(accent, HUE.success, dark);
  const warning = statusColor(accent, HUE.warning, dark);

  return {
    wall: wallFor(neutralSet, accent, bg, dark),
    bg,
    surface: neutralSet === 'mac' ? rgba(surface, 0.6) : surface,
    surfaceSolid: surface,
    fg,
    fgMuted: ensureContrast(mix(mix(fg, accent, 0.12), bg, 0.38), bg, TEXT_CONTRAST, dark),
    accent,
    primary,
    primaryFg: readableOn(primary),
    primaryEdge: adjustLightness(primary, -0.12),
    secondary,
    secondaryFg: ensureContrast(accentText, secondary, TEXT_CONTRAST, dark),
    accentText,
    muted: mix(bg, accent, dark ? 0.08 : 0.06),
    border: mix(mix(bg, fg, dark ? 0.18 : 0.14), accent, 0.12),
    ring: rgba(accent, 0.5),
    danger,
    dangerFg: readableOn(danger),
    success,
    successFg: readableOn(success),
    warning,
    warningFg: readableOn(warning),
    stroke: rgba(fg, dark ? 0.08 : 0.07),
    strokeBottom: rgba(fg, dark ? 0.05 : 0.16),
    controlStrong: mix(bg, fg, neutralSet === 'win' ? 0.55 : 0.3),
    track: mix(mix(bg, fg, dark ? 0.22 : 0.16), accent, 0.08),
    control: mix(mix(bg, fg, dark ? 0.1 : 0.08), accent, 0.05),
    hover: mix(surface, fg, 0.06),
    acrylic: rgba(surface, 0.9),
    glass: rgba(mix(surface, accent, 0.05), dark ? 0.42 : 0.5),
    glassBorder: dark ? 'rgba(255,255,255,.12)' : 'rgba(255,255,255,.65)',
    glassHighlight: dark ? 'rgba(255,255,255,.14)' : 'rgba(255,255,255,.9)',
    segmentOn: dark ? mix(bg, '#ffffff', 0.16) : '#ffffff',
    scrim: neutralSet === 'mac' ? 'rgba(0,0,0,.18)' : 'rgba(0,0,0,.32)',
    toast: dark ? '#48484d' : '#2f2f33',
    inputStroke: rgba(fg, dark ? 0.55 : 0.45),
    sidebar: mix(bg, fg, dark ? 0.06 : 0.04),
  };
}

/** KDE Breeze: its own control fill, stronger outlines, and the accent-tinted hover. */
function breeze(palette: Palette, accent: string, dark: boolean): Palette {
  return {
    ...palette,
    control: mix(dark ? '#292c30' : '#fcfcfc', accent, 0.02),
    controlStrong: mix(palette.bg, palette.fg, dark ? 0.5 : 0.45),
    border: mix(mix(palette.bg, palette.fg, dark ? 0.25 : 0.2), accent, 0.08),
    hover: mix(palette.surfaceSolid, accent, dark ? 0.25 : 0.15),
  };
}

/** Windows 10: no Mica or acrylic, and the accent used unchanged. */
function windows10(palette: Palette, accent: string): Palette {
  return {
    ...palette,
    wall: palette.bg,
    acrylic: palette.surfaceSolid,
    primary: accent,
    primaryFg: readableOn(accent),
    primaryEdge: adjustLightness(accent, -0.12),
  };
}

/** macOS 13–15: vibrancy instead of Liquid Glass (more opaque, no highlight). */
function macosClassic(palette: Palette, dark: boolean): Palette {
  return {
    ...palette,
    wall: palette.bg,
    glass: rgba(palette.surfaceSolid, dark ? 0.72 : 0.8),
    glassBorder: palette.stroke,
    glassHighlight: 'transparent',
  };
}

/** Reduced transparency: every material becomes its solid surface. */
function solid(palette: Palette): Palette {
  return {
    ...palette,
    wall: palette.bg,
    surface: palette.surfaceSolid,
    acrylic: palette.surfaceSolid,
    glass: palette.surfaceSolid,
    glassBorder: palette.stroke,
    glassHighlight: 'transparent',
  };
}

/** The Material 3 color roles ChromeOS uses, at the accent's hue. */
interface Material3Roles {
  primary: string;
  onPrimary: string;
  primaryContainer: string;
  onPrimaryContainer: string;
  secondaryContainer: string;
  onSecondaryContainer: string;
  surface: string;
  surfaceContainerLow: string;
  surfaceContainer: string;
  surfaceContainerHigh: string;
  surfaceContainerHighest: string;
  onSurface: string;
  onSurfaceVariant: string;
  outline: string;
  outlineVariant: string;
  inverseSurface: string;
  inversePrimary: string;
  error: string;
  onError: string;
}

function material3Roles(accent: string, dark: boolean): Material3Roles {
  const [hue, accentSaturation] = toHsl(accent);
  /** The accent's saturation, kept in a range where the tones still look like the accent. */
  const chroma = clamp(0.35, 0.8, accentSaturation);
  const tone = (saturation: number, lightness: number) => fromHsl(hue, saturation, lightness);

  return dark
    ? {
        primary: tone(chroma, 0.8),
        onPrimary: tone(chroma, 0.2),
        primaryContainer: tone(chroma, 0.3),
        onPrimaryContainer: tone(chroma, 0.9),
        secondaryContainer: tone(0.2, 0.3),
        onSecondaryContainer: tone(0.25, 0.88),
        surface: tone(0.12, 0.07),
        surfaceContainerLow: tone(0.1, 0.1),
        surfaceContainer: tone(0.1, 0.12),
        surfaceContainerHigh: tone(0.1, 0.15),
        surfaceContainerHighest: tone(0.1, 0.18),
        onSurface: tone(0.08, 0.9),
        onSurfaceVariant: tone(0.08, 0.8),
        outline: tone(0.06, 0.58),
        outlineVariant: tone(0.08, 0.3),
        inverseSurface: tone(0.06, 0.9),
        inversePrimary: tone(chroma, 0.4),
        error: '#f2b8b5',
        onError: '#601410',
      }
    : {
        primary: tone(chroma, 0.4),
        onPrimary: '#ffffff',
        primaryContainer: tone(chroma * 0.9, 0.9),
        onPrimaryContainer: tone(chroma, 0.15),
        secondaryContainer: tone(0.25, 0.88),
        onSecondaryContainer: tone(0.3, 0.18),
        surface: tone(0.15, 0.985),
        surfaceContainerLow: tone(0.12, 0.96),
        surfaceContainer: tone(0.12, 0.945),
        surfaceContainerHigh: tone(0.12, 0.925),
        surfaceContainerHighest: tone(0.1, 0.9),
        onSurface: tone(0.08, 0.11),
        onSurfaceVariant: tone(0.08, 0.3),
        outline: tone(0.06, 0.47),
        outlineVariant: tone(0.08, 0.79),
        inverseSurface: tone(0.06, 0.19),
        inversePrimary: tone(chroma, 0.8),
        error: '#b3261e',
        onError: '#ffffff',
      };
}

/** ChromeOS: the palette's colors mapped onto Material 3 roles. */
function material3(palette: Palette, accent: string, dark: boolean): Palette {
  const m3 = material3Roles(accent, dark);
  return {
    ...palette,
    wall: m3.surface,
    bg: m3.surface,
    surface: m3.surfaceContainerLow,
    surfaceSolid: m3.surfaceContainerLow,
    sidebar: m3.surfaceContainerLow,
    fg: m3.onSurface,
    fgMuted: ensureContrast(m3.onSurfaceVariant, m3.surface, TEXT_CONTRAST, dark),
    primary: m3.primary,
    primaryFg: m3.onPrimary,
    primaryEdge: m3.inversePrimary,
    secondary: m3.secondaryContainer,
    secondaryFg: m3.onSecondaryContainer,
    segmentOn: m3.secondaryContainer,
    // Material 3 doesn't contrast-check its primary tone, and on some accents it is too weak
    // as text: check it like every other skin's accent text.
    accentText: ensureContrast(m3.primary, m3.surface, TEXT_CONTRAST, dark),
    border: m3.outline,
    inputStroke: m3.outline,
    stroke: m3.outlineVariant,
    controlStrong: m3.onSurfaceVariant,
    track: m3.surfaceContainerHighest,
    control: m3.surfaceContainerHigh,
    hover: m3.surfaceContainer,
    acrylic: m3.surfaceContainerHigh,
    glass: m3.surfaceContainer,
    glassBorder: m3.primaryContainer,
    glassHighlight: m3.onPrimaryContainer,
    toast: m3.inverseSurface,
    ring: rgba(m3.primary, 0.5),
    danger: m3.error,
    dangerFg: m3.onError,
  };
}

/** Derive every color token for one skin, scheme and accent. Deterministic. */
export function derivePalette({ skin, accent, scheme, reduceTransparency = false }: DeriveOptions): Palette {
  const accentHex = normalizeHex(accent);
  const dark = scheme === 'dark';
  let palette = basePalette(NEUTRAL_SET[skin], accentHex, dark);

  if (skin === 'qt') palette = breeze(palette, accentHex, dark);
  if (skin === 'w10') palette = windows10(palette, accentHex);
  if (skin === 'macc') palette = macosClassic(palette, dark);
  if (reduceTransparency) palette = solid(palette);
  if (skin === 'cros') palette = material3(palette, accentHex, dark);
  return palette;
}
