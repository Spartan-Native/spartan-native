import type { Palette } from './derive-palette';

const kebab = (key: string) => key.replace(/[A-Z]|\d+/g, (c) => '-' + c.toLowerCase());

/** `fgMuted` → `--sn-color-fg-muted`, `category1` → `--sn-color-category-1`. The names match styles/contract/_tokens.scss. */
export function paletteVarName(key: keyof Palette): string {
  return `--sn-color-${kebab(key)}`;
}

/** The palette as CSS custom properties. */
export function paletteToCssVars(palette: Palette): Record<string, string> {
  const out: Record<string, string> = {};
  for (const key of Object.keys(palette) as (keyof Palette)[]) out[paletteVarName(key)] = palette[key];
  return out;
}
