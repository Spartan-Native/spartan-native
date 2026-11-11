# Spartan Native — implementation handover

![One app window sliced across the seven platform skins](images/hero-one-app-seven-skins.png)

Spartan Native is a native-look theme for [spartan/ui](https://spartan.ng) (Angular). One Angular codebase follows the system accent, light/dark, contrast, transparency and text size, and looks at home on Windows 11/10, macOS 26 and earlier, GNOME, KDE and ChromeOS. It runs in the browser/PWA and in desktop shells (Wails, Tauri, Electron, Photino.NET).

**Status:** design only (interactive mockups). No package code exists yet. This folder is the spec for the next phase: the token contract and spike.

## Source

| Item | Where |
| --- | --- |
| Design canvas "Spartan Native Theme — Wails" (4 interactive artboards, last updated 2026-11-08) | https://claude.ai/artifact/U2b7sNrNTSv6Hf5XrXgW1a |
| claude.ai project "Angular Native" | https://claude.ai/project/01a1bcd9-9719-7403-ab84-41b5fae11c75 |
| Artboard sources (copied, version `1794212021-6beb`) | [`reference/design-source/`](reference/design-source/) |
| All mockup CSS, extracted | [`reference/component-skins.mockup.css`](reference/component-skins.mockup.css) |

> **Gap:** these docs were built from the canvas artifact alone. The project's chat conversations could not be read with the available tools, so decisions made only in chat are not captured. Before you start, skim the project chats and add anything missing to [`10-open-questions.md`](10-open-questions.md).

## Reading order

| # | Doc | What it answers |
| --- | --- | --- |
| 01 | [Overview & scope](01-overview.md) | Goals, platforms, the native behaviors, what is in or out of scope |
| 02 | [Architecture & packages](02-architecture.md) | The five package layers, dependencies, Angular wiring |
| 03 | [Theme tokens & accent derivation](03-theme-tokens.md) | The CSS variable contract and the algorithm that builds every color from one accent |
| 04 | [Platform skins](04-platform-skins.md) | The seven skins: fonts, metrics, materials, inactive-window and reduced-transparency rules |
| 05 | [Components](05-components.md) | The 28 spartan/helm components that get skins, plus the desktop interaction rules |
| 06 | [OS patterns](06-os-patterns.md) | Six signature OS patterns and their counterparts on each platform (`desktop-ui`) |
| 07 | [Host contract & adapters](07-host-adapters.md) | The `NativeHost` interface, the five adapters and the capability matrix |
| 08 | [Sample app: Harbor Backup](08-sample-app.md) | The reference app used to validate everything end to end |
| 09 | [Roadmap & milestones](09-roadmap.md) | Phases with deliverables and exit criteria |
| 10 | [Open questions](10-open-questions.md) | Decisions the mockups leave open |

`images/` holds screenshots rendered from the design artboards, used by the READMEs. To regenerate them, run `reference/screenshot-tools/capture.mjs` and then `compose.mjs` (Playwright + local Chrome, loading `reference/design-source/` together with the design runtime from the canvas artifact as `support.js`).

`reference/palette.reference.ts` is a typed port of the mockups' color code. It is the starting point for `@spartan-native/theme`'s `derivePalette()`.

## How to view the mockups

Open the canvas link above. It has two pages. **Previews** holds the component comparison, the sample app and the OS patterns. **Project page** holds the marketing/overview page. Every artboard is interactive: pick the platform, accent, text size, reduced transparency and window focus, then drag the strip at the bottom of a panel to compare light and dark.
