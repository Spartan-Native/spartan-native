/**
 * Small, dependency-free color helpers used by derivePalette().
 * All inputs are `#rgb` / `#rrggbb`; invalid input falls back to the default accent.
 */
import { DEFAULT_ACCENT } from '../contract/native-host';

export type Rgb = [number, number, number];
export type Hsl = [h: number, s: number, l: number];

export function hexToRgb(hex: string): Rgb {
  let h = String(hex || '').replace('#', '');
  if (h.length === 3)
    h = h
      .split('')
      .map((x) => x + x)
      .join('');
  if (!/^[0-9a-fA-F]{6}$/.test(h)) h = DEFAULT_ACCENT.slice(1);
  const n = parseInt(h, 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

export function rgbToHex(rgb: readonly number[]): string {
  return (
    '#' +
    rgb
      .map((v) =>
        Math.max(0, Math.min(255, Math.round(v)))
          .toString(16)
          .padStart(2, '0'),
      )
      .join('')
  );
}

/** Normalises any accepted input to lower-case `#rrggbb`. */
export function normalizeHex(hex: string): string {
  return rgbToHex(hexToRgb(hex));
}

/** Linear RGB interpolation from `a` (t = 0) to `b` (t = 1). */
export function mix(a: string, b: string, t: number): string {
  const A = hexToRgb(a),
    B = hexToRgb(b);
  return rgbToHex(A.map((v, i) => v + (B[i] - v) * t));
}

export function rgba(hex: string, alpha: number): string {
  const [r, g, b] = hexToRgb(hex);
  return `rgba(${r},${g},${b},${alpha})`;
}

export function toHsl(hex: string): Hsl {
  const [R, G, B] = hexToRgb(hex);
  const r = R / 255,
    g = G / 255,
    b = B / 255;
  const mx = Math.max(r, g, b),
    mn = Math.min(r, g, b);
  const l = (mx + mn) / 2;
  let h = 0,
    s = 0;
  if (mx !== mn) {
    const d = mx - mn;
    s = l > 0.5 ? d / (2 - mx - mn) : d / (mx + mn);
    if (mx === r) h = (g - b) / d + (g < b ? 6 : 0);
    else if (mx === g) h = (b - r) / d + 2;
    else h = (r - g) / d + 4;
    h *= 60;
  }
  return [h, s, l];
}

export function fromHsl(h: number, s: number, l: number): string {
  h = ((h % 360) + 360) % 360;
  const c = (1 - Math.abs(2 * l - 1)) * s;
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
  const m = l - c / 2;
  let r = 0,
    g = 0,
    b = 0;
  if (h < 60) [r, g] = [c, x];
  else if (h < 120) [r, g] = [x, c];
  else if (h < 180) [g, b] = [c, x];
  else if (h < 240) [g, b] = [x, c];
  else if (h < 300) [r, b] = [x, c];
  else [r, b] = [c, x];
  return rgbToHex([(r + m) * 255, (g + m) * 255, (b + m) * 255]);
}

/** Shift HSL lightness by `delta`, clamped to 0–1. */
export function adjustLightness(hex: string, delta: number): string {
  const [h, s, l] = toHsl(hex);
  return fromHsl(h, s, Math.max(0, Math.min(1, l + delta)));
}

export function relativeLuminance(hex: string): number {
  const w = [0.2126, 0.7152, 0.0722];
  return hexToRgb(hex).reduce((acc, v, i) => {
    const c = v / 255;
    return acc + w[i] * (c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4));
  }, 0);
}

/** WCAG 2 contrast ratio between two colors. */
export function contrastRatio(a: string, b: string): number {
  const x = relativeLuminance(a),
    y = relativeLuminance(b);
  return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05);
}

/**
 * Step `fg` lightness by ±0.03 (max 40 steps) until it reaches `ratio` against `bg`.
 * `lighten` = true in dark mode, false in light mode.
 */
export function ensureContrast(fg: string, bg: string, ratio: number, lighten: boolean): string {
  let c = fg;
  for (let i = 0; i < 40 && contrastRatio(c, bg) < ratio; i++) c = adjustLightness(c, lighten ? 0.03 : -0.03);
  return c;
}

/** White text when it reaches 3:1 on `bg`, otherwise near-black. */
export function readableOn(bg: string): string {
  return contrastRatio('#ffffff', bg) >= 3 ? '#ffffff' : '#111111';
}
