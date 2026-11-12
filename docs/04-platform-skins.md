# 04 — Platform skins

> **Describes:** the design rules the skins in `@spartan-native/theme` (`styles/skins/`) implement. Where a number here and a skin's `_tokens.scss` differ, the skin is right. Color names such as `--wall` and `--acrylic` are the mockups' short names; [03](03-theme-tokens.md#token-contract) maps them to the real `--sn-color-*` variables.

Seven skins read one set of tokens. Components stay the same, while geometry, materials and states follow each platform. Each skin is a class on the root (`t-win`, `t-w10`, `t-mac`, `t-macc`, `t-gtk`, `t-qt`, `t-cros`), plus `dark`, `rt` (reduced transparency) and `inactive` (window not focused). `w10` and `macc` add to their parent skin: `t-win t-w10` and `t-mac t-macc`.

| Skin   | Root classes   | Folder in `styles/skins/`                         |
| ------ | -------------- | ------------------------------------------------- |
| `win`  | `t-win`        | `win11/`                                          |
| `w10`  | `t-win t-w10`  | `win10/` (overrides on top of `win11/`)           |
| `mac`  | `t-mac`        | `macos26/`                                        |
| `macc` | `t-mac t-macc` | `macos-classic/` (overrides on top of `macos26/`) |
| `gtk`  | `t-gtk`        | `gtk/`                                            |
| `qt`   | `t-qt`         | `kde/`                                            |
| `cros` | `t-cros`       | `chromeos/`                                       |

The skins were ported from the mockups' CSS, which is archived in [`reference/component-skins.mockup.css`](reference/component-skins.mockup.css).

## Key metrics (px, at 100% text size)

| Control | win (11) | w10 | mac (26) | gtk | qt | cros |
| --- | --- | --- | --- | --- | --- | --- |
| Base font size | 14 | 14 | 13 | 14 | 13 | 14 |
| Button height / radius | 32 / 4 | 32 / 2 (2px border) | 30 / pill | 34 / 6, bold | 32 / 5 | 36 / pill, outlined |
| Input height / radius | 32 / 4, accent bottom stroke | 32 / 0, 2px border | 28 / 8 | 34 / 6, filled | 32 / 5 | 40 / 4, outlined |
| Checkbox | 20, r4 | 20, r0, 2px | 16, r5 | 20, r6 | 18, r3 | 18, r2, 2px |
| Radio | 20 | 20, 2px | 16 | 20 | 18 | 20, 2px |
| Switch track / knob | 40×20 / 12 | 44×20 / 10 | 44×24 / 26×20 | 48×26 / 20 | 36×18 / 16 | 52×32 / 16 |
| Tab height / radius | 40 / 4 | — | 26 / pill (segmented) | 30 / 6, bold | 34 / 5 5 0 0 | 48 / underline |
| Menu radius | 8, acrylic + blur 30 | 0 | 14, glass | 12, solid | 5 | 4, padding 8 |
| Menu item | — | — | 26 high, r8 | r6 | 30 high, r4 | 40 high, r0 |
| Card radius | 8 + stroke | 0 | 22 | 12 + shadow | 5 + border | 12 + elevation |
| Dialog radius | 8 | 0 | 26, centered | 14, centered | 6 | 28 |
| Badge radius | 4 | — | — | — | — | 8 |

## Materials

| Skin | Window backdrop | Menus / flyouts | Panels |
| --- | --- | --- | --- |
| win | Mica-like gradient (`--wall`) | Acrylic: `--acrylic` + `backdrop-filter: blur(30px)` | solid `--surf` |
| w10 | flat `--bg` | solid | solid |
| mac | Liquid Glass wallpaper gradient | glass (`.sn-glass`): `--glass`, `blur(22px) saturate(180%)`, `--glass-b` border, inset `--glass-hi` top highlight | translucent `--surf` (60%) |
| macc | flat `--bg` | vibrancy (glass at 72–80% alpha, no highlight) | — |
| gtk / qt | flat `--bg` | solid `--surf` + shadow | solid |
| cros | M3 surface | `--glass` (= container) | tonal containers |

**Reduced transparency (`.rt`)** turns every `backdrop-filter` off (`!important`) and swaps glass and acrylic for solid surfaces. The token side is described in [03](03-theme-tokens.md).

## Inactive window (`.inactive`)

| Skin | Rule |
| --- | --- |
| win | Background becomes solid `--bg` (Mica off); blur off; title-bar text at 45% fg; app icon greyscale at 60% opacity |
| mac | Traffic lights grey (`fg` 22%); selected rows, nav items and command items go to neutral grey (`fg` 14%) with `--fg` text; primary button becomes glass with `--fg` text; titles go to `--mfg` |
| gtk | Header bar, sidebar header and sheet header contents at 55% opacity |
| qt | Title bar to `--mfg`; selection becomes `mix(primary 30%, surf)` |
| cros | Title bar text to `--mfg` |

## Windows 10 specifics

The Windows 10 skin uses square corners and 2px borders. Neutral buttons are filled with `fg 20%` over `bg`. On hover the border is `fg 45%`, and on press the fill is `fg 40%`. Primary pressed is `mix(primary 80%, fg)`. A focused input gets a 2px `--primary` border. Sliders have a 2px track and an 8×24 accent thumb. Progress is 4px with square ends. Selection is `mix(primary 30%, surf-solid)`. Menus, cards, dialogs, tables and the like have no radius.

## Shortcut glyphs

|                 | mac / macc | all others |
| --------------- | ---------- | ---------- |
| Modifier prefix | `⌘`        | `Ctrl+`    |
| Delete          | `⌘⌫`       | `Del`      |
| Rename          | `↩`        | `F2`       |

`snShortcut` in `@spartan-native/desktop-ui` writes these, following the real OS rather than the skin.
