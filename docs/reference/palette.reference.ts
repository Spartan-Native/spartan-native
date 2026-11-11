/**
 * Reference port of the accent-derivation code in the Spartan Native design mockups
 * (reference/design-source/*.dc.html, class Component → tokens/tk/m3/solid).
 * The logic is unchanged; only the types and names are added. Use it as the starting point and
 * golden source for @spartan-native/theme's derivePalette(), not as production code.
 */

export type Skin = 'win' | 'w10' | 'mac' | 'macc' | 'gtk' | 'qt' | 'cros';
type Base = 'win' | 'mac' | 'gtk' | 'qt';
type RGB = [number, number, number];

const DEFAULT_ACCENT = '#0078d4';

// ---------- color helpers ----------
export function h2r(hex: string): RGB {
  let h = String(hex || '').replace('#', '');
  if (h.length === 3) h = h.split('').map((x) => x + x).join('');
  if (!/^[0-9a-fA-F]{6}$/.test(h)) h = DEFAULT_ACCENT.slice(1);
  const n = parseInt(h, 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}
export function r2h(a: number[]): string {
  return '#' + a.map((v) => Math.max(0, Math.min(255, Math.round(v))).toString(16).padStart(2, '0')).join('');
}
export function mix(a: string, b: string, t: number): string {
  const A = h2r(a), B = h2r(b);
  return r2h(A.map((v, i) => v + (B[i] - v) * t));
}
export function rgba(hex: string, a: number): string {
  const [r, g, b] = h2r(hex);
  return `rgba(${r},${g},${b},${a})`;
}
export function hsl(hex: string): [number, number, number] {
  const [R, G, B] = h2r(hex), r = R / 255, g = G / 255, b = B / 255;
  const mx = Math.max(r, g, b), mn = Math.min(r, g, b);
  let h = 0, s = 0;
  const l = (mx + mn) / 2;
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
  const c = (1 - Math.abs(2 * l - 1)) * s, x = c * (1 - Math.abs(((h / 60) % 2) - 1)), m = l - c / 2;
  let r = 0, g = 0, b = 0;
  if (h < 60) { r = c; g = x; } else if (h < 120) { r = x; g = c; } else if (h < 180) { g = c; b = x; }
  else if (h < 240) { g = x; b = c; } else if (h < 300) { r = x; b = c; } else { r = c; b = x; }
  return r2h([(r + m) * 255, (g + m) * 255, (b + m) * 255]);
}
export function adjL(hex: string, d: number): string {
  const [h, s, l] = hsl(hex);
  return fromHsl(h, s, Math.max(0, Math.min(1, l + d)));
}
export function lum(hex: string): number {
  const w = [0.2126, 0.7152, 0.0722];
  return h2r(hex).reduce((a, v, i) => {
    v /= 255;
    return a + w[i] * (v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4));
  }, 0);
}
/** WCAG 2 contrast ratio */
export function cr(a: string, b: string): number {
  const x = lum(a), y = lum(b);
  return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05);
}
/** Step lightness by ±0.03 (max 40 steps) until the contrast ratio is reached. */
export function ensure(fg: string, bg: string, ratio: number, lighten: boolean): string {
  let c = fg;
  for (let i = 0; i < 40 && cr(c, bg) < ratio; i++) c = adjL(c, lighten ? 0.03 : -0.03);
  return c;
}
export function onText(bg: string): string {
  return cr('#ffffff', bg) >= 3 ? '#ffffff' : '#111111';
}
function sem(acc: string, hue: number, dark: boolean): string {
  const [, s0, l0] = hsl(acc);
  const s = Math.max(0.55, Math.min(0.85, s0));
  const l = Math.max(0.42, Math.min(0.52, l0)) + (dark ? 0.08 : 0);
  return fromHsl(hue, s, l);
}

// ---------- palette ----------
export interface Palette {
  cls: string; wall: string; bg: string; surf: string; surfSolid: string; fg: string; mfg: string;
  primary: string; pfg: string; primaryB: string; secondary: string; sfg: string; atext: string;
  muted: string; border: string; ring: string; dest: string; dfg: string; ok: string; okfg: string;
  warn: string; warnfg: string; stroke: string; strokeB: string; strong: string; trk: string;
  btnbg: string; hover: string; acrylic: string; glass: string; glassB: string; glassHi: string;
  segOn: string; scrim: string; toastbg: string; inpB: string; sidebg: string;
}

const NEUTRALS: Record<Base, { light: [string, string, string]; dark: [string, string, string] }> = {
  win: { light: ['#f3f3f3', '#fbfbfb', '#1a1a1a'], dark: ['#202020', '#2b2b2b', '#ffffff'] },
  mac: { light: ['#f2f2f4', '#ffffff', '#1d1d1f'], dark: ['#1e1e21', '#2c2c2f', '#f5f5f7'] },
  gtk: { light: ['#fafafb', '#ffffff', '#2e2e32'], dark: ['#222226', '#36363a', '#ffffff'] },
  qt: { light: ['#eff0f1', '#ffffff', '#232629'], dark: ['#202326', '#141618', '#fcfcfc'] },
};

function baseTokens(p: Base, acc: string, dark: boolean): Palette {
  const [N0, N1, fg] = NEUTRALS[p][dark ? 'dark' : 'light'];
  const H = hsl(acc);
  const bg = mix(N0, acc, p === 'win' ? 0.05 : 0.03);
  const surf = mix(N1, acc, dark ? 0.04 : 0.015);
  let primary = acc;
  if (p === 'win') primary = dark ? fromHsl(H[0], H[1], Math.min(0.8, Math.max(H[2] + 0.2, 0.68))) : adjL(acc, -0.06);
  if (p === 'mac' && dark) primary = adjL(acc, 0.04);
  const atext = ensure(acc, bg, 4.5, dark);
  const secondary = mix(surf, acc, dark ? 0.22 : 0.12);
  const dest = sem(acc, 356, dark), ok = sem(acc, 145, dark), warn = sem(acc, 38, dark);
  let wall = bg;
  if (p === 'mac') {
    wall = `radial-gradient(60% 90% at 10% 10%, ${rgba(fromHsl(H[0] + 35, Math.max(H[1], 0.5), dark ? 0.4 : 0.7), dark ? 0.5 : 0.45)}, transparent 70%), ` +
      `radial-gradient(55% 80% at 92% 95%, ${rgba(acc, dark ? 0.45 : 0.32)}, transparent 70%), ${bg}`;
  } else if (p === 'win') {
    wall = `linear-gradient(135deg, ${mix(bg, acc, dark ? 0.1 : 0.08)}, ${bg} 60%)`;
  }
  return {
    cls: `t-${p}${dark ? ' dark' : ''}`,
    wall, bg, surf: p === 'mac' ? rgba(surf, 0.6) : surf, surfSolid: surf, fg,
    mfg: ensure(mix(mix(fg, acc, 0.12), bg, 0.38), bg, 4.5, dark),
    primary, pfg: onText(primary), primaryB: adjL(primary, -0.12),
    secondary, sfg: ensure(atext, secondary, 4.5, dark), atext,
    muted: mix(bg, acc, dark ? 0.08 : 0.06),
    border: mix(mix(bg, fg, dark ? 0.18 : 0.14), acc, 0.12), ring: rgba(acc, 0.5),
    dest, dfg: onText(dest), ok, okfg: onText(ok), warn, warnfg: onText(warn),
    stroke: rgba(fg, dark ? 0.08 : 0.07), strokeB: rgba(fg, dark ? 0.05 : 0.16),
    strong: mix(bg, fg, p === 'win' ? 0.55 : 0.3),
    trk: mix(mix(bg, fg, dark ? 0.22 : 0.16), acc, 0.08),
    btnbg: mix(mix(bg, fg, dark ? 0.1 : 0.08), acc, 0.05),
    hover: mix(surf, fg, 0.06),
    acrylic: rgba(surf, 0.9),
    glass: rgba(mix(surf, acc, 0.05), dark ? 0.42 : 0.5),
    glassB: dark ? 'rgba(255,255,255,.12)' : 'rgba(255,255,255,.65)',
    glassHi: dark ? 'rgba(255,255,255,.14)' : 'rgba(255,255,255,.9)',
    segOn: dark ? mix(bg, '#ffffff', 0.16) : '#ffffff',
    scrim: p === 'mac' ? 'rgba(0,0,0,.18)' : 'rgba(0,0,0,.32)',
    toastbg: dark ? '#48484d' : '#2f2f33',
    inpB: rgba(fg, dark ? 0.55 : 0.45),
    sidebg: mix(bg, fg, dark ? 0.06 : 0.04),
  };
}

function solid(t: Palette): Palette {
  return { ...t, wall: t.bg, surf: t.surfSolid, acrylic: t.surfSolid, glass: t.surfSolid, glassB: t.stroke, glassHi: 'transparent', cls: t.cls + ' rt' };
}

function material3(t: Palette, acc: string, dark: boolean): Palette {
  const [h, s] = hsl(acc);
  const sc = Math.max(0.35, Math.min(0.8, s));
  const T = (sat: number, l: number) => fromHsl(h, sat, l);
  const c = dark
    ? { primary: T(sc, 0.8), pfg: T(sc, 0.2), pc: T(sc, 0.3), opc: T(sc, 0.9), scn: T(0.2, 0.3), osc: T(0.25, 0.88),
        surface: T(0.12, 0.07), low: T(0.1, 0.1), cont: T(0.1, 0.12), high: T(0.1, 0.15), highest: T(0.1, 0.18),
        on: T(0.08, 0.9), onv: T(0.08, 0.8), outline: T(0.06, 0.58), ov: T(0.08, 0.3), inv: T(0.06, 0.9), invP: T(sc, 0.4), err: '#f2b8b5', onErr: '#601410' }
    : { primary: T(sc, 0.4), pfg: '#ffffff', pc: T(sc * 0.9, 0.9), opc: T(sc, 0.15), scn: T(0.25, 0.88), osc: T(0.3, 0.18),
        surface: T(0.15, 0.985), low: T(0.12, 0.96), cont: T(0.12, 0.945), high: T(0.12, 0.925), highest: T(0.1, 0.9),
        on: T(0.08, 0.11), onv: T(0.08, 0.3), outline: T(0.06, 0.47), ov: T(0.08, 0.79), inv: T(0.06, 0.19), invP: T(sc, 0.8), err: '#b3261e', onErr: '#ffffff' };
  return {
    ...t,
    cls: `t-cros${dark ? ' dark' : ''}`, wall: c.surface, bg: c.surface, surf: c.low, surfSolid: c.low, fg: c.on,
    mfg: ensure(c.onv, c.surface, 4.5, dark), primary: c.primary, pfg: c.pfg, primaryB: c.invP,
    secondary: c.scn, sfg: c.osc, atext: c.primary, border: c.outline, stroke: c.ov, strong: c.onv, trk: c.highest,
    btnbg: c.high, hover: c.cont, acrylic: c.high, glass: c.cont, glassB: c.pc, glassHi: c.opc, segOn: c.scn,
    toastbg: c.inv, inpB: c.outline, sidebg: c.low, ring: rgba(c.primary, 0.5), dest: c.err, dfg: c.onErr,
  };
}

export interface DeriveOptions {
  skin: Skin;
  accent: string;
  dark: boolean;
  reduceTransparency?: boolean;
}

/** Equivalent of the mockups' tk(p, acc, dark, rt). */
export function derivePalette({ skin, accent, dark, reduceTransparency = false }: DeriveOptions): Palette {
  const acc = r2h(h2r(accent));
  const base: Base = ({ w10: 'win', macc: 'mac', cros: 'gtk' } as Record<string, Base>)[skin] ?? (skin as Base);
  let t = baseTokens(base, acc, dark);
  if (skin === 'qt') {
    t = {
      ...t,
      btnbg: mix(dark ? '#292c30' : '#fcfcfc', acc, 0.02),
      strong: mix(t.bg, t.fg, dark ? 0.5 : 0.45),
      border: mix(mix(t.bg, t.fg, dark ? 0.25 : 0.2), acc, 0.08),
      hover: mix(t.surfSolid, acc, dark ? 0.25 : 0.15),
    };
  }
  if (skin === 'w10') t = { ...t, cls: `t-win t-w10${dark ? ' dark' : ''}`, wall: t.bg, acrylic: t.surfSolid, primary: acc, pfg: onText(acc), primaryB: adjL(acc, -0.12) };
  if (skin === 'macc') t = { ...t, cls: `t-mac t-macc${dark ? ' dark' : ''}`, wall: t.bg, glass: rgba(t.surfSolid, dark ? 0.72 : 0.8), glassB: t.stroke, glassHi: 'transparent' };
  if (reduceTransparency) t = solid(t);
  if (skin === 'cros') t = material3(t, acc, dark);
  return t;
}

/** Mockup var name → CSS custom property (mockup naming; see 03-theme-tokens.md for the proposed contract names). */
export function toCssVars(p: Palette): Record<string, string> {
  return {
    '--wall': p.wall, '--bg': p.bg, '--surf': p.surf, '--surf-solid': p.surfSolid, '--fg': p.fg, '--mfg': p.mfg,
    '--primary': p.primary, '--pfg': p.pfg, '--primary-b': p.primaryB, '--secondary': p.secondary, '--sfg': p.sfg,
    '--atext': p.atext, '--border': p.border, '--ring': p.ring, '--dest': p.dest, '--dfg': p.dfg, '--ok': p.ok,
    '--okfg': p.okfg, '--warn': p.warn, '--warnfg': p.warnfg, '--stroke': p.stroke, '--stroke-b': p.strokeB,
    '--strong': p.strong, '--trk': p.trk, '--btnbg': p.btnbg, '--hover': p.hover, '--acrylic': p.acrylic,
    '--glass': p.glass, '--glass-b': p.glassB, '--glass-hi': p.glassHi, '--seg-on': p.segOn, '--scrim': p.scrim,
    '--toastbg': p.toastbg, '--inp-b': p.inpB, '--sidebg': p.sidebg,
  };
}
