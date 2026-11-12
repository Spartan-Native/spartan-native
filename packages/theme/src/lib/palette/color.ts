/**
 * Small, dependency-free color helpers used by derivePalette().
 * All inputs are `#rgb` / `#rrggbb`; invalid input falls back to the default accent.
 */
import { DEFAULT_ACCENT } from '../contract/native-host';

export type Rgb = [number, number, number];
export type Hsl = [h: number, s: number, l: number];

/** `#rgb` or `#rrggbb` → [r, g, b] in 0–255. */
export function hexToRgb(hex: string): Rgb {
  let digits = String(hex || '').replace('#', '');
  if (digits.length === 3) digits = [...digits].map((digit) => digit + digit).join('');
  if (!/^[0-9a-fA-F]{6}$/.test(digits)) digits = DEFAULT_ACCENT.slice(1);
  const value = parseInt(digits, 16);
  return [(value >> 16) & 255, (value >> 8) & 255, value & 255];
}

/** [r, g, b] (rounded and clamped to 0–255) → `#rrggbb`. */
export function rgbToHex(rgb: readonly number[]): string {
  const channel = (value: number) =>
    Math.max(0, Math.min(255, Math.round(value)))
      .toString(16)
      .padStart(2, '0');
  return '#' + rgb.map(channel).join('');
}

/** Normalises any accepted input to lower-case `#rrggbb`. */
export function normalizeHex(hex: string): string {
  return rgbToHex(hexToRgb(hex));
}

/** Linear RGB interpolation from `a` (t = 0) to `b` (t = 1). */
export function mix(a: string, b: string, t: number): string {
  const from = hexToRgb(a);
  const to = hexToRgb(b);
  return rgbToHex(from.map((value, i) => value + (to[i] - value) * t));
}

/** `#rrggbb` → `rgba(r,g,b,alpha)`. */
export function rgba(hex: string, alpha: number): string {
  const [r, g, b] = hexToRgb(hex);
  return `rgba(${r},${g},${b},${alpha})`;
}

/** `#rrggbb` → [hue 0–360, saturation 0–1, lightness 0–1]. */
export function toHsl(hex: string): Hsl {
  const [r, g, b] = hexToRgb(hex).map((channel) => channel / 255);
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const l = (max + min) / 2;
  let h = 0;
  let s = 0;
  if (max !== min) {
    const range = max - min;
    s = l > 0.5 ? range / (2 - max - min) : range / (max + min);
    if (max === r) h = (g - b) / range + (g < b ? 6 : 0);
    else if (max === g) h = (b - r) / range + 2;
    else h = (r - g) / range + 4;
    h *= 60;
  }
  return [h, s, l];
}

/** [hue (any angle), saturation 0–1, lightness 0–1] → `#rrggbb`. */
export function fromHsl(h: number, s: number, l: number): string {
  h = ((h % 360) + 360) % 360;
  const chroma = (1 - Math.abs(2 * l - 1)) * s;
  const second = chroma * (1 - Math.abs(((h / 60) % 2) - 1)); // the second-largest channel
  const lift = l - chroma / 2; // added to every channel
  let r = 0;
  let g = 0;
  let b = 0;
  if (h < 60) [r, g] = [chroma, second];
  else if (h < 120) [r, g] = [second, chroma];
  else if (h < 180) [g, b] = [chroma, second];
  else if (h < 240) [g, b] = [second, chroma];
  else if (h < 300) [r, b] = [second, chroma];
  else [r, b] = [chroma, second];
  return rgbToHex([(r + lift) * 255, (g + lift) * 255, (b + lift) * 255]);
}

/** Shift HSL lightness by `delta`, clamped to 0–1. */
export function adjustLightness(hex: string, delta: number): string {
  const [h, s, l] = toHsl(hex);
  return fromHsl(h, s, Math.max(0, Math.min(1, l + delta)));
}

/** WCAG 2 relative luminance, 0 (black) to 1 (white). */
export function relativeLuminance(hex: string): number {
  const weights = [0.2126, 0.7152, 0.0722];
  return hexToRgb(hex).reduce((sum, value, i) => {
    const c = value / 255;
    const linear = c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
    return sum + weights[i] * linear;
  }, 0);
}

/** WCAG 2 contrast ratio between two colors. */
export function contrastRatio(a: string, b: string): number {
  const luminanceA = relativeLuminance(a);
  const luminanceB = relativeLuminance(b);
  return (Math.max(luminanceA, luminanceB) + 0.05) / (Math.min(luminanceA, luminanceB) + 0.05);
}

/**
 * Step `fg` lightness by ±0.03 (max 40 steps) until it reaches `ratio` against `bg`.
 * `lighten` = true in dark mode, false in light mode.
 */
export function ensureContrast(fg: string, bg: string, ratio: number, lighten: boolean): string {
  let color = fg;
  for (let step = 0; step < 40 && contrastRatio(color, bg) < ratio; step++) {
    color = adjustLightness(color, lighten ? 0.03 : -0.03);
  }
  return color;
}

/** White text when it reaches 3:1 on `bg`, otherwise near-black. */
export function readableOn(bg: string): string {
  return contrastRatio('#ffffff', bg) >= 3 ? '#ffffff' : '#111111';
}
