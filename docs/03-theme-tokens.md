# 03 — Theme tokens & accent derivation

Every color comes from one input: the system accent (`#rrggbb`). It is combined with per-platform neutrals for light and dark, then text colors are pushed until they reach WCAG contrast. The algorithm below is taken from the mockup code, and [`reference/palette.reference.ts`](reference/palette.reference.ts) ports it to typed TypeScript.

## Inputs

| Input | Values | Source |
| --- | --- | --- |
| `skin` | `win` `w10` `mac` `macc` `gtk` `qt` `cros` (`web`) | `PlatformInfo.skin`, user override |
| `accent` | `#rrggbb`; default `#0078D4` | `AppearanceState.accent` |
| `scheme` | `light` / `dark` | OS |
| `reduceTransparency` | boolean | OS |
| `textScale` | 1, 1.25, 1.5, 1.75, 2 | OS (Windows, GNOME); in-app setting on macOS |
| `contrast` | `normal` / `more` / `forced` | OS. Planned: not in the mockups yet |
| window focused | boolean | host window events |

Accent swatches used in the mockups: Windows blue `#0078D4`, macOS blue `#007AFF`, GNOME blue `#3584E4`, KDE blue `#3DAEE9`, purple `#9141AC`, orange `#E66100`, green `#26A269`, pink `#D56199`.

## Token contract

The mockup names are short. The "proposed contract name" column maps each to spartan/ui (shadcn-style) names where one exists. Freeze the final names in phase 2. This is open question Q1.

| Mockup var | Proposed contract name | Meaning |
| --- | --- | --- |
| `--bg` | `--background` | Window background |
| `--wall` | `--sn-wall` | Backdrop behind materials (gradient on win/mac; equal to bg elsewhere) |
| `--surf` | `--card` / `--popover` | Surface; translucent (60% alpha) on `mac` |
| `--surf-solid` | `--sn-surface-solid` | Opaque version of surface |
| `--fg` | `--foreground` | Body text |
| `--mfg` | `--muted-foreground` | Secondary text, ≥ 4.5:1 on bg |
| `--primary` / `--pfg` | `--primary` / `--primary-foreground` | Accent fill and the text on it |
| `--primary-b` | `--sn-primary-edge` | Primary darkened by 12% lightness (Fluent bottom edge) |
| `--secondary` / `--sfg` | `--secondary` / `--secondary-foreground` | Accent-tinted surface and its text |
| `--atext` | `--sn-accent-text` | Accent used as text, ≥ 4.5:1 on bg |
| muted | `--muted` | Accent-tinted bg |
| `--border` | `--border` | Divider and outline |
| `--inp-b` | `--input` | Input bottom stroke (Fluent) |
| `--ring` | `--ring` | Accent at 50% alpha |
| `--dest` / `--dfg` | `--destructive` / `--destructive-foreground` | Error |
| `--ok` / `--okfg` | `--sn-success` / `-foreground` | Success |
| `--warn` / `--warnfg` | `--sn-warning` / `-foreground` | Warning |
| `--stroke`, `--stroke-b` | `--sn-stroke`, `--sn-stroke-bottom` | Hairline control borders |
| `--strong` | `--sn-strong` | Unchecked checkbox/radio/switch outline |
| `--trk` | `--sn-track` | Switch/slider track |
| `--btnbg` | `--sn-control` | Neutral button fill (gtk/qt) |
| `--hover` | `--accent` (spartan hover) | Hover fill |
| `--acrylic` | `--sn-acrylic` | Menu/flyout material (90% alpha surface) |
| `--glass`, `--glass-b`, `--glass-hi` | `--sn-glass`, `--sn-glass-border`, `--sn-glass-highlight` | Liquid Glass fill, edge and top highlight |
| `--seg-on` | `--sn-segment-on` | Selected segmented-control item |
| `--scrim` | `--sn-scrim` | Modal backdrop |
| `--toastbg` | `--sn-toast` | Toast background |
| `--sidebg` | `--sn-sidebar` | Sidebar fill |
| `--font`, `--fs` | `--sn-font`, `--sn-font-size` | Per-skin font stack and base size |
| `--ts` | `--ts` | Text scale multiplier; `font-size: calc(var(--fs) * var(--ts))` |

## Algorithm

### Helpers

- `mix(a, b, t)`: linear RGB interpolation from `a` toward `b`.
- `hsl`, `fromHsl`, and `adjL(hex, d)`, which shifts HSL lightness by `d`, clamped to 0–1.
- `cr(a, b)`: the WCAG 2 contrast ratio from relative luminance.
- `ensure(fg, bg, ratio, lighten)`: step `fg` lightness by ±0.03, up to 40 times, until `cr ≥ ratio`. It lightens in dark mode and darkens in light mode.
- `onText(bg)`: returns `#ffffff` when white reaches 3:1 on `bg`, else `#111111`.
- `sem(acc, hue, dark)`: a semantic color at a fixed hue that borrows the accent's saturation, clamped to 0.55–0.85, and lightness, clamped to 0.42–0.52, +0.08 in dark mode. Hues: destructive 356, success 145, warning 38.

### Per-platform neutrals `[bg, surface, fg]`

| Base | Light | Dark |
| --- | --- | --- |
| win | `#f3f3f3` `#fbfbfb` `#1a1a1a` | `#202020` `#2b2b2b` `#ffffff` |
| mac | `#f2f2f4` `#ffffff` `#1d1d1f` | `#1e1e21` `#2c2c2f` `#f5f5f7` |
| gtk | `#fafafb` `#ffffff` `#2e2e32` | `#222226` `#36363a` `#ffffff` |
| qt | `#eff0f1` `#ffffff` `#232629` | `#202326` `#141618` `#fcfcfc` |

`w10` uses the win neutrals and `macc` uses mac. `cros` starts from gtk, then its own Material 3 palette replaces it (below).

### Base tokens

```
bg        = mix(N.bg, acc, win ? .05 : .03)
surf      = mix(N.surface, acc, dark ? .04 : .015)
fg        = N.fg
primary   = acc
            win light: adjL(acc, -.06)
            win dark:  hsl(h, s, clamp(l + .2, .68, .8))
            mac dark:  adjL(acc, +.04)
pfg       = onText(primary)
atext     = ensure(acc, bg, 4.5)
secondary = mix(surf, acc, dark ? .22 : .12);   sfg = ensure(atext, secondary, 4.5)
muted     = mix(bg, acc, dark ? .08 : .06)
mfg       = ensure(mix(mix(fg, acc, .12), bg, .38), bg, 4.5)
border    = mix(mix(bg, fg, dark ? .18 : .14), acc, .12)
dest/ok/warn = sem(acc, 356/145/38, dark);  *fg = onText(*)
ring      = rgba(acc, .5)
stroke    = rgba(fg, dark ? .08 : .07);  strokeB = rgba(fg, dark ? .05 : .16)
strong    = mix(bg, fg, win ? .55 : .30)
trk       = mix(mix(bg, fg, dark ? .22 : .16), acc, .08)
btnbg     = mix(mix(bg, fg, dark ? .10 : .08), acc, .05)
hover     = mix(surf, fg, .06)
acrylic   = rgba(surf, .9)
glass     = rgba(mix(surf, acc, .05), dark ? .42 : .50)
glassB    = dark ? rgba(255,255,255,.12) : rgba(255,255,255,.65)
glassHi   = dark ? rgba(255,255,255,.14) : rgba(255,255,255,.90)
segOn     = dark ? mix(bg, #fff, .16) : #fff
scrim     = mac ? rgba(0,0,0,.18) : rgba(0,0,0,.32)
toastbg   = dark ? #48484d : #2f2f33
inpB      = rgba(fg, dark ? .55 : .45)
sidebg    = mix(bg, fg, dark ? .06 : .04)
surf (mac only, as applied) = rgba(surf, .6)
wall  mac: two radial gradients (accent hue +35° at top-left, accent at bottom-right) over bg
      win: linear-gradient(135deg, mix(bg, acc, dark ? .10 : .08), bg 60%)
      other: bg
```

### Skin overrides

- **qt:** `btnbg = mix(dark ? #292c30 : #fcfcfc, acc, .02)`, `strong = mix(bg, fg, dark ? .5 : .45)`, `border = mix(mix(bg, fg, dark ? .25 : .2), acc, .08)`, `hover = mix(surfSolid, acc, dark ? .25 : .15)` (Breeze accent hover).
- **w10:** `wall = bg`, `acrylic = surfSolid`, `primary = acc` unchanged, `pfg = onText(acc)`.
- **macc:** `wall = bg`, `glass = rgba(surfSolid, dark ? .72 : .80)`, `glassB = stroke`, `glassHi = transparent` (vibrancy, not glass).
- **Reduced transparency** (`rt`) applies to every skin. `wall = bg`, and `surf`, `acrylic` and `glass` become `surfSolid`. `glassB = stroke`, `glassHi = transparent`. The `.rt` class disables all `backdrop-filter`.
- **cros (Material 3):** a tonal palette at the accent hue `h`, with chroma `sc = clamp(s, .35, .8)`:

| Role | Light (s, l) | Dark (s, l) | Maps to |
| --- | --- | --- | --- |
| primary | sc, .40 | sc, .80 | primary, atext |
| on-primary | `#ffffff` | sc, .20 | pfg |
| primary-container / on- | sc·.9, .90 / sc, .15 | sc, .30 / sc, .90 | glassB / glassHi |
| secondary-container / on- | .25, .88 / .30, .18 | .20, .30 / .25, .88 | secondary, segOn / sfg |
| surface | .15, .985 | .12, .07 | bg, wall |
| container low / – / high / highest | .12, .96 / .945 / .925 / .10, .90 | .10, .10 / .12 / .15 / .18 | surf, sidebg / hover, glass / btnbg, acrylic / trk |
| on-surface / variant | .08, .11 / .08, .30 | .08, .90 / .08, .80 | fg / strong, mfg (ensured 4.5) |
| outline / variant | .06, .47 / .08, .79 | .06, .58 / .08, .30 | border, inpB / stroke |
| inverse surface / primary | .06, .19 / sc, .80 | .06, .90 / sc, .40 | toastbg / primaryB |
| error / on-error | `#b3261e` / `#fff` | `#f2b8b5` / `#601410` | dest / dfg |

### Text size

`--ts` multiplies the base font size. Controls must grow with it, so use `em`/`calc` sizes and never fixed px heights for text-bearing controls. The mockups grow preview heights by `1 + (ts − 1) × 0.8`.

## Acceptance checks for the theme package

- For every skin × light/dark × the 8 swatches, plus random accents: `fg`, `mfg`, `atext` and `sfg` reach ≥ 4.5:1 on their backgrounds, and `pfg` on `primary` reaches ≥ 3:1. Write these as unit tests.
  - **Known failure in the mockup algorithm:** on `cros` light, `atext` is the M3 primary with no contrast check. With KDE blue `#3DAEE9` it reaches only 4.23:1, and with green `#26A269` only 3.06:1. Every other skin/accent/scheme combination of the 8 swatches passes. Fix this by running `ensure()` on the M3 `atext` (see Q12).
- An invalid accent falls back to `#0078D4`.
- Output is deterministic: the same inputs give the same hex values as the reference port.
