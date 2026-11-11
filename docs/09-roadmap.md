# 09 — Roadmap & milestones

The project is at phase 01. The phases and their one-line descriptions come from the design; the deliverables and exit criteria are proposals for the implementation team to confirm.

| # | Phase | When | Scope (from design) |
| --- | --- | --- | --- |
| 01 | Design mockups | Now (done) | 28 components, 6 OS patterns and a sample app across Windows, macOS, GNOME and KDE, all interactive |
| 02 | Token contract & spike | Next | Freeze the variable names and host interface; prove five stock helm components can be restyled from CSS alone |
| 03 | Theme + helm packages | Next | Accent derivation, platform variable sets, per-OS component skins, states and native behaviors |
| 04 | Host adapters | Later | Web/PWA from day one, then Electron → Tauri → Wails → Photino.NET, all passing the same conformance tests |
| 05 | Desktop UI & integration | Later | Title bars, OS patterns, native menus, window effects and Snap Layouts through the bridge |
| 06 | Gaps & tooling | Later | Tree view, number box, split button, status bar; the Claude Code plugin and a docs playground |

## Phase 02: Token contract & spike (start here)

**Deliverables**

1. Set up the monorepo (Angular + spartan/ui; Nx recommended) with `packages/theme` and `apps/playground`.
2. `derivePalette()` ported from [`reference/palette.reference.ts`](reference/palette.reference.ts), with unit tests for contrast and for matching the reference output exactly.
3. Final token names, mapping mockup names to spartan/shadcn names (see [03](03-theme-tokens.md)). Decide which are added `--sn-*` tokens.
4. Final `NativeHost`, `WindowHost`, `MenuHost`, `NotificationHost` and `Capability` types, plus a `host-web` stub.
5. **Spike:** restyle five stock helm components (suggested: Button, Input, Switch, Select, Dialog) for at least win, mac and gtk, using only CSS keyed on `.t-*` classes, with no template forks.

**Exit criteria:** the spike shows stock components are skinnable from CSS alone. If any need template changes, record which and why, and decide between wrapping and contributing upstream.

## Phase 03: Theme + helm

- Variable sets for every skin × scheme × rt × text scale; a Tailwind preset.
- `provideSpartanNative()`: applies the classes and variables and reacts live.
- All 28 component skins with every state; the behaviors from [05](05-components.md).
- Visual regression against the mockups (Playwright screenshots, one per skin × scheme).

## Phase 04: Host adapters

- `host-web` (complete), then Electron, Tauri, Wails (Go module + TS package) and Photino.NET (C# + TS package).
- Shared conformance suite; capability flags checked against reality. Fill in the matrix in [07](07-host-adapters.md) with confirmed values.

## Phase 05: Desktop UI & integration

- Title bar in three modes; the six OS patterns with their counterparts; the menubar adapter; native context menus; window effects; Snap Layouts. (Done: title bar, the six patterns, the menubar adapter and context menus, with Wails as the first native host. Open: window effects, Snap Layouts.)
- High-contrast / `forced-colors` support (currently "Planned"). desktop-ui follows `forced-colors` (done); the derived palette for `contrast: more` is still open (Q6).
- Harbor Backup complete on web + Wails.

## Phase 06: Gaps & tooling

- New components: tree view, number box, split button, status bar (done, in `desktop-ui`).
- `spartan-native-plugin`: skill, commands `new-app`, `add-screen` and `audit`, the `native-ui-reviewer` agent, and a hook against hard-coded colors.
- Public docs playground that replaces the design canvas.
