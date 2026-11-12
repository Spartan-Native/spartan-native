# 02 — Architecture & packages

> **Describes:** what is built. The workspace layout for contributors is in [CONTRIBUTING.md](../CONTRIBUTING.md#layout).

The project ships as five layers. Only the first is required. Each layer adds to the one below it, and the UI never knows which runtime it is in.

```
 ┌──────────────────────────────────────────────────────────────┐
 │  Your Angular app (stock spartan/ui brain + helm components) │
 └──────────────┬───────────────────────────────────────────────┘
                │ reads CSS variables / injects SpartanNativeTheme
 ┌──────────────▼───────────────┐   ┌─────────────────────────────┐
 │ 03 @spartan-native/desktop-ui│   │ 05 spartan-native plugin    │
 │    window chrome, OS patterns│   │    (Claude Code agent skill)│
 ├──────────────────────────────┤   └─────────────────────────────┘
 │ 02 @spartan-native/helm      │
 │    desktop behaviors         │
 ├──────────────────────────────┤
 │ 01 @spartan-native/theme     │◄── required; CSS + a little TS
 │    tokens, derivePalette(),  │
 │    the seven skins,          │
 │    NativeHost interface      │
 └──────────────▲───────────────┘
                │ implements NativeHost
 ┌──────────────┴───────────────────────────────────────────────┐
 │ 04 @spartan-native/host-{web|wails|tauri|dotnet|electron}    │
 └──────────────────────────────────────────────────────────────┘
```

## Packages

| # | Package | Role | Depends on | Works in |
| --- | --- | --- | --- | --- |
| 01 | `@spartan-native/theme` | Required | spartan/ui | Browser, PWA, any desktop shell |
| 02 | `@spartan-native/helm` | Optional · desktop behaviors | theme | Browser, PWA, any desktop shell |
| 03 | `@spartan-native/desktop-ui` | Optional · window chrome and OS patterns | theme, helm | Desktop shells; browser and PWA (title bar through Window Controls Overlay) |
| 04 | `@spartan-native/host-*` | One per runtime | theme (the `NativeHost` interface) | Web, Wails, Tauri, Photino.NET; Electron planned |
| 05 | `spartan-native` plugin | Dev tooling | all packages (as reference) | Claude Code |

### 01 `@spartan-native/theme`

CSS variables plus a small TypeScript layer that turns one accent color into a full palette. It works with stock spartan/ui in any browser, even without Angular.

- The token contract: `--sn-color-*` for colors, `--sn-*` for sizes, fonts and materials, and `--sn-text-scale`. A bridge maps them onto spartan's own variable names (see [03](03-theme-tokens.md)).
- `derivePalette()`: accent derivation with contrast checks.
- The per-OS component skins for the stock spartan components, keyed on root classes (see [04](04-platform-skins.md)).
- The `NativeHost` interface, `staticHost()`, `provideSpartanNative()` and the `SpartanNativeTheme` service.

### 02 `@spartan-native/helm`

Desktop **behaviors** for stock spartan components. It has no per-OS styling of its own: its styles read the theme's tokens.

- The desktop selection model for lists and tables (`snSelectable`): click, Shift/Ctrl/⌘-click, arrows, Home/End, type-ahead, Ctrl/⌘+A, Esc. The pure selection functions are exported too.
- Default and cancel buttons (`snDefaultAction`, `snCancelAction`): Enter and Esc in dialogs and forms.
- Dialog buttons in each OS's order (`[snDialogButtons]` and hlm dialog footers).

### 03 `@spartan-native/desktop-ui`

The pieces stock spartan does not have: window chrome, the patterns each OS is known for, and desktop controls.

- Title bar, window controls and status bar.
- The six OS patterns: command bar, coach mark, modal sheet, inspector, settings list and status page (see [06](06-os-patterns.md)), plus sidebar navigation, an assistant and a setup checklist.
- Controls spartan lacks: split button, number box, tree view, and a skinned tooltip.
- The menubar adapter and context menus: native through the host where it can, drawn in the page otherwise.
- Shortcut formatting (⌘ vs Ctrl) and the `*snPlatformIf` structural directive.

### 04 `@spartan-native/host-*`

Adapters that read the real system settings and expose window and OS services. Each one passes the same conformance suite, `@spartan-native/host-conformance`. Components check each adapter's capability flags and fall back gracefully (see [07](07-host-adapters.md)).

- `host-web`: browser APIs, for web and PWA. In this repository.
- `host-wails` (Go module), `host-tauri` (Rust plugin crate, Tauri v2) and `host-dotnet` (C# library for Photino.NET), each in its own repository: [`Spartan-Native/host-wails`](https://github.com/Spartan-Native/host-wails), [`Spartan-Native/host-tauri`](https://github.com/Spartan-Native/host-tauri), [`Spartan-Native/host-dotnet`](https://github.com/Spartan-Native/host-dotnet).
- `host-electron` (main-process module + preload): planned; a scaffold in this repository, not published.

### 05 `spartan-native` plugin (Claude Code)

`tools/claude-plugin` packages the conventions so that an agent building an app follows them: a skill with setup steps per runtime, the pattern mapping, the styling rules and ready templates. Commands, a reviewer agent and a hook are planned (see the [roadmap](09-roadmap.md)).

## Angular wiring

Only the host line changes per runtime:

```ts
// app.config.ts
import { provideSpartanNative } from '@spartan-native/theme';
import { wailsHost } from '@spartan-native/host-wails';

export const appConfig = {
  providers: [provideSpartanNative({ host: wailsHost() })],
};
```

| Runtime | Package | Factory | Native side | Renders in |
| --- | --- | --- | --- | --- |
| Web + PWA | `@spartan-native/host-web` | `webHost()` | none (browser APIs only) | any modern browser |
| Go + Wails | `@spartan-native/host-wails` | `wailsHost()` | Go module `github.com/spartan-native/host-wails` | WebView2 · WKWebView · WebKitGTK |
| Rust + Tauri | `@spartan-native/host-tauri` | `tauriHost()` | Rust plugin crate `tauri-plugin-spartan-native` | WebView2 · WKWebView · WebKitGTK |
| .NET + Photino | `@spartan-native/host-dotnet` | `dotnetHost()` | NuGet package `SpartanNative.Photino` | WebView2 · WKWebView · WebKitGTK |
| TS + Electron (planned) | `@spartan-native/host-electron` | `electronHost()` | main-process module + preload | bundled Chromium |
| None (tests, Storybook, a fixed look) | `@spartan-native/theme` | `staticHost()` | none | anywhere |

### What `provideSpartanNative()` does

1. Asks the host for `PlatformInfo` and `AppearanceState` before the first render, and picks the skin. The user's overrides win (`overrides`, or stored ones with `persist`).
2. Calls `derivePalette()` for the skin, accent and scheme.
3. Writes the colors as variables onto `document.documentElement`, with `--sn-text-scale`, and sets the classes for the skin (`t-<skin>`), `dark`, `rt` (reduced transparency), `inactive` (window not focused), `hc` and `reduce-motion`.
4. Subscribes to `onAppearanceChange` and the window focus events, and re-applies live.
5. Provides `SpartanNativeTheme`, whose signals (`skin()`, `scheme()`, `textScale()`, `platformFamily()`, …) components and `*snPlatformIf` read.
