# 03 — Theme tokens & accent derivation

> **Describes:** what is built, in `@spartan-native/theme`. The code is `derivePalette()` in `src/lib/palette/derive-palette.ts`; the variable names are in `styles/contract/`.

Every color comes from one input: the system accent (`#rrggbb`). It is combined with per-platform neutrals for light and dark, then text colors are pushed until they reach WCAG contrast. The algorithm comes from the design mockups; the short names in the algorithm below (`bg`, `atext`, `mfg`, …) are the mockups' names, and the table maps them to the real variables.

## Inputs

| Input | Values | Source |
| --- | --- | --- |
| `skin` | `win` `w10` `mac` `macc` `gtk` `qt` `cros` (`web`) | `PlatformInfo.skin`, user override |
| `accent` | `#rrggbb`; default `#0078d4` | `AppearanceState.accent` |
| `scheme` | `light` / `dark` | OS |
| `reduceTransparency` | boolean | OS |
| `textScale` | 1, 1.25, 1.5, 1.75, 2 | OS (Windows, GNOME); in-app on macOS (Q9) |
| `contrast` | `normal` / `more` / `forced` | OS. `forced` hands the colors to the OS; `more` has no palette rules yet (Q6) |
| window focused | boolean | host window events |

Accent swatches used in the mockups and the tests: Windows blue `#0078D4`, macOS blue `#007AFF`, GNOME blue `#3584E4`, KDE blue `#3DAEE9`, purple `#9141AC`, orange `#E66100`, green `#26A269`, pink `#D56199`.

## Token contract

Every color token is `--sn-color-<name>`, one per key of the `Palette` type (`fgMuted` → `--sn-color-fg-muted`). `styles/contract/_spartan-bridge.scss` maps them onto spartan/ui's own variable names, which is what makes stock components follow the accent before any skin restyles them.

| Mockup name | Variable | spartan/ui name it feeds | Meaning |
| --- | --- | --- | --- |
| `bg` | `--sn-color-bg` | `--background` | Window background |
| `wall` | `--sn-color-wall` | — | Backdrop behind materials (gradient on win/mac; equal to bg elsewhere) |
| `surf` | `--sn-color-surface` | — | Surface; translucent (60% alpha) on `mac` |
| `surf-solid` | `--sn-color-surface-solid` | `--card`, `--popover` | Opaque version of surface |
| `fg` | `--sn-color-fg` | `--foreground` and the other `*-foreground` on neutral surfaces | Body text |
| `mfg` | `--sn-color-fg-muted` | `--muted-foreground` | Secondary text, ≥ 4.5:1 on bg |
| `primary` / `pfg` | `--sn-color-primary` / `--sn-color-primary-fg` | `--primary` / `--primary-foreground` | Accent fill and the text on it |
| `primary-b` | `--sn-color-primary-edge` | — | Primary darkened by 12% lightness (Fluent bottom edge) |
| `secondary` / `sfg` | `--sn-color-secondary` / `--sn-color-secondary-fg` | `--secondary` / `--secondary-foreground` | Accent-tinted surface and its text |
| — | `--sn-color-accent` | `--ring` | The accent itself |
| `atext` | `--sn-color-accent-text` | — | Accent used as text, ≥ 4.5:1 on bg |
| muted | `--sn-color-muted` | `--muted` | Accent-tinted bg |
| `border` | `--sn-color-border` | `--border`, `--input` | Divider and outline |
| `inp-b` | `--sn-color-input-stroke` | — | Input bottom stroke (Fluent) |
| `ring` | `--sn-color-ring` | — | Accent at 50% alpha |
| `dest` / `dfg` | `--sn-color-danger` / `-fg` | `--destructive` | Error |
| `ok` / `okfg` | `--sn-color-success` / `-fg` | — | Success |
| `warn` / `warnfg` | `--sn-color-warning` / `-fg` | — | Warning |
| `stroke`, `stroke-b` | `--sn-color-stroke`, `--sn-color-stroke-bottom` | — | Hairline control borders |
| `strong` | `--sn-color-control-strong` | — | Unchecked checkbox/radio/switch outline |
| `trk` | `--sn-color-track` | — | Switch/slider track |
| `btnbg` | `--sn-color-control` | — | Neutral button fill (gtk/qt) |
| `hover` | `--sn-color-hover` | `--accent` (spartan's hover fill) | Hover fill |
| `acrylic` | `--sn-color-acrylic` | — | Menu/flyout material (90% alpha surface) |
| `glass`, `glass-b`, `glass-hi` | `--sn-color-glass`, `-glass-border`, `-glass-highlight` | — | Liquid Glass fill, edge and top highlight |
| `seg-on` | `--sn-color-segment-on` | — | Selected segmented-control item |
| `scrim` | `--sn-color-scrim` | — | Modal backdrop |
| `toastbg` | `--sn-color-toast` | — | Toast background |
| `sidebg` | `--sn-color-sidebar` | `--sidebar` | Sidebar fill |
| `font`, `fs` | `--sn-font-sans`, `--sn-font-size` | `--font-sans` | Per-skin font stack and base size |
| `ts` | `--sn-text-scale` | — | Text scale; the root font size is `16px × --sn-text-scale`, so every `rem` grows with it |

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

`--sn-text-scale` sets the root font size, so every `rem` grows with the OS text size. Skin sizes are written with the `px()` function in `styles/_functions.scss` (`px(32)` → `2rem`), so controls grow with their text instead of clipping it.

## What the unit tests check

`derive-palette.spec.ts` checks, for every skin × light/dark × the 8 swatches:

- `fg`, `mfg` and `atext` reach ≥ 4.5:1 on `bg`, and `pfg` reaches ≥ 3:1 on `primary`. (`sfg` is contrast-checked by the algorithm but has no test of its own.) On `cros` light, `atext` gets the same contrast check as every other skin; the mockups' algorithm skipped it there (Q12).
- An invalid accent falls back to `#0078d4`.
- The output is deterministic.

After changing `derivePalette()`, run `npm run theme:palette` to regenerate the static palettes in `styles/contract/_palette-defaults.scss`, which make the theme work as plain CSS.
