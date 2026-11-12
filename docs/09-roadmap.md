# 09 — Roadmap

> **Describes:** what is built and what is left, as of `0.1.0`. Released changes are in the [changelog](../CHANGELOG.md).

The project was planned in six phases. Phases 01 to 03 are done; 04 to 06 are mostly done.

| # | Phase | State | What it covered |
| --- | --- | --- | --- |
| 01 | Design mockups | Done | Components, the six OS patterns and a sample app across every platform, all interactive |
| 02 | Token contract & spike | Done | The `--sn-*` variables, the `NativeHost` interface, and proof that stock spartan/ui components can be restyled from CSS alone (they can: no component templates were forked) |
| 03 | Theme + helm | Done | `derivePalette()`, the seven skins with every state, `provideSpartanNative()`, the selection model, default/cancel buttons, dialog button order, visual regression tests |
| 04 | Host adapters | Mostly done | Web/PWA, Wails, Tauri and Photino.NET implemented and passing the conformance suite; Electron open |
| 05 | Desktop UI & integration | Mostly done | Title bar, the six OS patterns, menubar adapter, native context menus, `forced-colors` support; window effects and Snap Layouts open |
| 06 | Gaps & tooling | Partly done | Tree view, number box, split button and status bar done; the agent skill done; playground and plugin commands open |

## What is left

**Host adapters**

- `@spartan-native/host-electron`: the adapter itself. Today it is a scaffold and is not published.
- `host-tauri` and `host-dotnet` read the OS and pass the conformance suite, but have not yet run inside a real app window. The check is a Tauri and a Photino.NET shell for the Harbor sample app.
- `NotificationHost`: the shape of the notifications service ([Q2](10-open-questions.md)).

**Theme**

- A derived palette for `contrast: more` ([Q6](10-open-questions.md)). `forced-colors` already works: system colors take over.
- A style sheet for the generic `web` skin ([Q4](10-open-questions.md)). Today it gets the token defaults only.
- A Tailwind preset (in the original plan; not built).

**Desktop UI**

- Window materials through the host: Mica and acrylic on Windows, vibrancy on macOS. The CSS materials work today; the native window effects behind them don't.
- Snap Layouts on the Windows maximize button.

**Tooling**

- A public docs playground that shows every component and pattern on every skin. `apps/playground` is still the Angular CLI starter.
- Claude Code plugin: the skill and its templates are done. Planned but not built: the commands `new-app`, `add-screen` and `audit`, a `native-ui-reviewer` agent, and a hook that flags hard-coded colors.
