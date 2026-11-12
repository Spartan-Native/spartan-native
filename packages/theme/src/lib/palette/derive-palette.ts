/**
 * derivePalette(): one accent color in, every theme color out.
 * The algorithm, step by step, is in the repository's docs/03-theme-tokens.md.
 */
import type { ColorScheme, Skin } from '../contract/native-host';
import {
  adjustLightness as adjL,
  ensureContrast as ensure,
  fromHsl,
  mix,
  normalizeHex,
  readableOn as onText,
  rgba,
  toHsl,
} from './color';

/** Every color token. Keys map 1:1 to `--sn-color-<kebab-key>` (see palette-css-vars.ts). */
export interface Palette {
  /** Backdrop behind materials: a gradient on Windows 11 and macOS 26, `bg` elsewhere. */
  wall: string;
  bg: string;
  /** Surface; translucent on macOS 26. */
  surface: string;
  surfaceSolid: string;
  fg: string;
  fgMuted: string;
  accent: string;
  primary: string;
  primaryFg: string;
  /** Primary darkened by 12 % lightness (Fluent bottom edge). */
  primaryEdge: string;
  secondary: string;
  secondaryFg: string;
  /** The accent as text, ≥ 4.5:1 on `bg`. */
  accentText: string;
  muted: string;
  border: string;
  ring: string;
  danger: string;
  dangerFg: string;
  success: string;
  successFg: string;
  warning: string;
  warningFg: string;
  /** Hairline control borders. */
  stroke: string;
  /** Bottom edge of Fluent controls. */
  strokeBottom: string;
  /** Unchecked checkbox / radio / switch outline. */
  controlStrong: string;
  /** Switch and slider track. */
  track: string;
  /** Neutral control fill (GTK buttons and entries). */
  control: string;
  hover: string;
  acrylic: string;
  glass: string;
  glassBorder: string;
  glassHighlight: string;
  segmentOn: string;
  scrim: string;
  toast: string;
  inputStroke: string;
  sidebar: string;
}

export interface DeriveOptions {
  skin: Skin;
  accent: string;
  scheme: ColorScheme;
  reduceTransparency?: boolean;
}

type Base = 'win' | 'mac' | 'gtk' | 'qt';

/** Per-platform neutrals: [background, surface, foreground]. */
const NEUTRALS: Record<Base, Record<ColorScheme, [string, string, string]>> = {
  win: { light: ['#f3f3f3', '#fbfbfb', '#1a1a1a'], dark: ['#202020', '#2b2b2b', '#ffffff'] },
  mac: { light: ['#f2f2f4', '#ffffff', '#1d1d1f'], dark: ['#1e1e21', '#2c2c2f', '#f5f5f7'] },
  gtk: { light: ['#fafafb', '#ffffff', '#2e2e32'], dark: ['#222226', '#36363a', '#ffffff'] },
  qt: { light: ['#eff0f1', '#ffffff', '#232629'], dark: ['#202326', '#141618', '#fcfcfc'] },
};

const BASE_OF: Record<Skin, Base> = {
  win: 'win', w10: 'win', mac: 'mac', macc: 'mac', gtk: 'gtk', cros: 'gtk', qt: 'qt', web: 'gtk',
};

/** Semantic color at a fixed hue that borrows the accent's saturation and lightness. */
function semantic(accent: string, hue: number, dark: boolean): string {
  const [, s0, l0] = toHsl(accent);
  const s = Math.max(0.55, Math.min(0.85, s0));
  const l = Math.max(0.42, Math.min(0.52, l0)) + (dark ? 0.08 : 0);
  return fromHsl(hue, s, l);
}

function baseTokens(p: Base, acc: string, dark: boolean): Palette {
  const [n0, n1, fg] = NEUTRALS[p][dark ? 'dark' : 'light'];
  const [h, s, l] = toHsl(acc);
  const bg = mix(n0, acc, p === 'win' ? 0.05 : 0.03);
  const surface = mix(n1, acc, dark ? 0.04 : 0.015);

  let primary = acc;
  if (p === 'win') primary = dark ? fromHsl(h, s, Math.min(0.8, Math.max(l + 0.2, 0.68))) : adjL(acc, -0.06);
  if (p === 'mac' && dark) primary = adjL(acc, 0.04);

  const accentText = ensure(acc, bg, 4.5, dark);
  const secondary = mix(surface, acc, dark ? 0.22 : 0.12);
  const danger = semantic(acc, 356, dark);
  const success = semantic(acc, 145, dark);
  const warning = semantic(acc, 38, dark);

  let wall = bg;
  if (p === 'mac') {
    const tint = rgba(fromHsl(h + 35, Math.max(s, 0.5), dark ? 0.4 : 0.7), dark ? 0.5 : 0.45);
    wall =
      `radial-gradient(60% 90% at 10% 10%, ${tint}, transparent 70%), ` +
      `radial-gradient(55% 80% at 92% 95%, ${rgba(acc, dark ? 0.45 : 0.32)}, transparent 70%), ${bg}`;
  } else if (p === 'win') {
    wall = `linear-gradient(135deg, ${mix(bg, acc, dark ? 0.1 : 0.08)}, ${bg} 60%)`;
  }

  return {
    wall,
    bg,
    surface: p === 'mac' ? rgba(surface, 0.6) : surface,
    surfaceSolid: surface,
    fg,
    fgMuted: ensure(mix(mix(fg, acc, 0.12), bg, 0.38), bg, 4.5, dark),
    accent: acc,
    primary,
    primaryFg: onText(primary),
    primaryEdge: adjL(primary, -0.12),
    secondary,
    secondaryFg: ensure(accentText, secondary, 4.5, dark),
    accentText,
    muted: mix(bg, acc, dark ? 0.08 : 0.06),
    border: mix(mix(bg, fg, dark ? 0.18 : 0.14), acc, 0.12),
    ring: rgba(acc, 0.5),
    danger,
    dangerFg: onText(danger),
    success,
    successFg: onText(success),
    warning,
    warningFg: onText(warning),
    stroke: rgba(fg, dark ? 0.08 : 0.07),
    strokeBottom: rgba(fg, dark ? 0.05 : 0.16),
    controlStrong: mix(bg, fg, p === 'win' ? 0.55 : 0.3),
    track: mix(mix(bg, fg, dark ? 0.22 : 0.16), acc, 0.08),
    control: mix(mix(bg, fg, dark ? 0.1 : 0.08), acc, 0.05),
    hover: mix(surface, fg, 0.06),
    acrylic: rgba(surface, 0.9),
    glass: rgba(mix(surface, acc, 0.05), dark ? 0.42 : 0.5),
    glassBorder: dark ? 'rgba(255,255,255,.12)' : 'rgba(255,255,255,.65)',
    glassHighlight: dark ? 'rgba(255,255,255,.14)' : 'rgba(255,255,255,.9)',
    segmentOn: dark ? mix(bg, '#ffffff', 0.16) : '#ffffff',
    scrim: p === 'mac' ? 'rgba(0,0,0,.18)' : 'rgba(0,0,0,.32)',
    toast: dark ? '#48484d' : '#2f2f33',
    inputStroke: rgba(fg, dark ? 0.55 : 0.45),
    sidebar: mix(bg, fg, dark ? 0.06 : 0.04),
  };
}

/** Reduced transparency: every material becomes its solid surface. */
function solid(t: Palette): Palette {
  return {
    ...t,
    wall: t.bg,
    surface: t.surfaceSolid,
    acrylic: t.surfaceSolid,
    glass: t.surfaceSolid,
    glassBorder: t.stroke,
    glassHighlight: 'transparent',
  };
}

/** ChromeOS: a Material 3 tonal palette at the accent hue. */
function material3(t: Palette, acc: string, dark: boolean): Palette {
  const [h, s] = toHsl(acc);
  const sc = Math.max(0.35, Math.min(0.8, s));
  const T = (sat: number, l: number) => fromHsl(h, sat, l);
  const c = dark
    ? { primary: T(sc, 0.8), pfg: T(sc, 0.2), pc: T(sc, 0.3), opc: T(sc, 0.9), scn: T(0.2, 0.3), osc: T(0.25, 0.88),
        surface: T(0.12, 0.07), low: T(0.1, 0.1), cont: T(0.1, 0.12), high: T(0.1, 0.15), highest: T(0.1, 0.18),
        on: T(0.08, 0.9), onv: T(0.08, 0.8), outline: T(0.06, 0.58), ov: T(0.08, 0.3), inv: T(0.06, 0.9),
        invP: T(sc, 0.4), err: '#f2b8b5', onErr: '#601410' }
    : { primary: T(sc, 0.4), pfg: '#ffffff', pc: T(sc * 0.9, 0.9), opc: T(sc, 0.15), scn: T(0.25, 0.88), osc: T(0.3, 0.18),
        surface: T(0.15, 0.985), low: T(0.12, 0.96), cont: T(0.12, 0.945), high: T(0.12, 0.925), highest: T(0.1, 0.9),
        on: T(0.08, 0.11), onv: T(0.08, 0.3), outline: T(0.06, 0.47), ov: T(0.08, 0.79), inv: T(0.06, 0.19),
        invP: T(sc, 0.8), err: '#b3261e', onErr: '#ffffff' };
  return {
    ...t,
    wall: c.surface, bg: c.surface, surface: c.low, surfaceSolid: c.low, sidebar: c.low,
    fg: c.on, fgMuted: ensure(c.onv, c.surface, 4.5, dark),
    primary: c.primary, primaryFg: c.pfg, primaryEdge: c.invP,
    secondary: c.scn, secondaryFg: c.osc, segmentOn: c.scn,
    // The M3 primary tone isn't contrast-checked by M3 itself, and on some accents it is too
    // weak as text: check it like every other skin's accent text.
    accentText: ensure(c.primary, c.surface, 4.5, dark),
    border: c.outline, inputStroke: c.outline, stroke: c.ov, controlStrong: c.onv, track: c.highest,
    control: c.high, hover: c.cont, acrylic: c.high, glass: c.cont, glassBorder: c.pc, glassHighlight: c.opc,
    toast: c.inv, ring: rgba(c.primary, 0.5), danger: c.err, dangerFg: c.onErr,
  };
}

/** Derive every color token for one skin, scheme and accent. Deterministic. */
export function derivePalette({ skin, accent, scheme, reduceTransparency = false }: DeriveOptions): Palette {
  const acc = normalizeHex(accent);
  const dark = scheme === 'dark';
  let t = baseTokens(BASE_OF[skin], acc, dark);

  if (skin === 'qt') {
    t = {
      ...t,
      control: mix(dark ? '#292c30' : '#fcfcfc', acc, 0.02),
      controlStrong: mix(t.bg, t.fg, dark ? 0.5 : 0.45),
      border: mix(mix(t.bg, t.fg, dark ? 0.25 : 0.2), acc, 0.08),
      hover: mix(t.surfaceSolid, acc, dark ? 0.25 : 0.15),
    };
  }
  if (skin === 'w10') {
    t = { ...t, wall: t.bg, acrylic: t.surfaceSolid, primary: acc, primaryFg: onText(acc), primaryEdge: adjL(acc, -0.12) };
  }
  if (skin === 'macc') {
    t = { ...t, wall: t.bg, glass: rgba(t.surfaceSolid, dark ? 0.72 : 0.8), glassBorder: t.stroke, glassHighlight: 'transparent' };
  }
  if (reduceTransparency) t = solid(t);
  if (skin === 'cros') t = material3(t, acc, dark);
  return t;
}
