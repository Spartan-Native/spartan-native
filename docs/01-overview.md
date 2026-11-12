# 01 — Overview & scope

> **Describes:** the goals and scope the project was designed for, and the state of each native behavior today.

**Tagline:** "Native on every desktop. One Angular codebase."

Spartan Native is a theme layer for stock spartan/ui. It does not fork spartan. Components stay identical and read one shared set of CSS variables. Each platform skin changes geometry, materials and states. A host adapter feeds in the user's real OS settings.

## Goals

1. An Angular + spartan/ui app looks native on each supported OS without per-OS component code.
2. It respects settings the user has already chosen in the OS: accent, light/dark, contrast, transparency, text size and window focus.
3. It works in a plain browser with CSS only. Native shells are optional, layered add-ons.
4. One contract, `NativeHost`, sits between the UI and every runtime, so swapping the runtime changes one line in `app.config.ts`.

## Supported platforms (skins)

| Skin id | Platform | Design language | Font | Base size |
| --- | --- | --- | --- | --- |
| `win` | Windows 11 | Fluent: Mica and acrylic, accent selection pill, caption buttons | Segoe UI Variable Text | 14px |
| `w10` | Windows 10 | Flat Fluent, no Mica: square controls, solid surfaces, accent used unchanged | Segoe UI | 14px |
| `mac` | macOS 26 | Liquid Glass: glass surfaces, capsule controls, traffic lights, sheets, inspector | SF Pro Text (system) | 13px |
| `macc` | macOS 13–15 ("classic") | Vibrancy instead of glass, rounded-rectangle buttons, pre-26 control sizes | SF Pro Text (system) | 13px |
| `gtk` | GNOME · GTK 4 / Adwaita | Header bars, boxed lists, pill buttons, AdwStatusPage-style empty states | Adwaita Sans / Cantarell | 14px |
| `qt` | KDE · Qt 6 / Breeze | Accent-outline hover, accent-filled selection, Kirigami-style forms and placeholders | Noto Sans | 13px |
| `cros` | ChromeOS · Material 3 | Tonal palette from the accent, pill buttons, tonal selection; aimed at installed PWAs | Roboto / Google Sans | 14px |
| `web` | Generic web fallback | Used when the OS is unknown; token defaults only, no style sheet of its own (Q4) | — | — |

## Native behaviors

| Behavior | Detail | Status |
| --- | --- | --- |
| System accent | Read from Windows, macOS, GNOME and KDE. Every other color is derived from it, with contrast checked. | Done |
| Light & dark | Follows the OS setting live, with per-platform neutrals, not one generic dark theme. | Done |
| Reduce transparency | Mica, acrylic and Liquid Glass fall back to solid surfaces. | Done |
| Text size 100–200% | Text scales and controls grow with it, as in WinUI, AppKit, GTK and Qt. Steps: 100, 125, 150, 175, 200%. | Done |
| Inactive window state | Selections turn grey, traffic lights dim and Mica turns solid when the window loses focus. | Done |
| Desktop selection model | Shift- and Ctrl/⌘-click, arrow keys, Home/End and type-ahead in lists and tables. | Done |
| Per-OS conventions | ⌘ vs Ctrl shortcuts, dialog button order, Enter for the default button, Esc to cancel. | Done |
| High contrast | Windows contrast themes and `forced-colors`, with system colors taking over. | `forced-colors` done; a palette for `contrast: more` is open (Q6) |
| Native menus & window effects | Context menus beyond the window, the macOS Edit menu, Snap Layouts and vibrancy through the host bridge. | Native app and context menus done (macOS global menu bar through the hosts); window effects and Snap Layouts open |

## In scope

- `@spartan-native/theme`: tokens, accent derivation, and the per-OS skins for the stock spartan components.
- `@spartan-native/helm`: desktop behaviors (list/table selection model, default and cancel buttons, dialog button order).
- `@spartan-native/desktop-ui`: window chrome, OS signature patterns, the controls spartan lacks, shortcut formatting.
- `@spartan-native/host-*`: adapters for web/PWA, Wails, Tauri and Photino.NET; Electron is planned.
- The `spartan-native` Claude Code plugin, with the conventions as an agent skill.
- A docs playground and the Harbor Backup sample app (in its own repository, [`Spartan-Native/harbor`](https://github.com/Spartan-Native/harbor)).

## Out of scope

- Mobile platforms (iOS, Android). ChromeOS is covered only as a desktop/PWA target.
- Rewriting spartan components. Skins restyle stock `hlm` components from CSS only; no component template is forked.
- Pixel-perfect copies of OS controls. The target is "feels native": correct geometry, materials, states and behaviors.

## Glossary

- **spartan/ui**: Angular UI library made of `brain` (headless, `brn-*`) and `helm` (styled, `hlm-*`) primitives, themed with shadcn-style CSS variables.
- **Skin**: one platform's set of variables plus its CSS rules (`.t-win`, `.t-mac`, …).
- **Host**: the runtime bridge that implements `NativeHost`.
- **Counterpart**: an OS pattern rebuilt as the closest native equivalent on another OS (see [06](06-os-patterns.md)).
