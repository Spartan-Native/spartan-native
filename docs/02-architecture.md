# 02 — Architecture & packages

The project ships as five layers. Only the first is required. Each layer adds to the one below it, and the UI never knows which runtime it is in.

```
 ┌──────────────────────────────────────────────────────────────┐
 │  Your Angular app (stock spartan/ui brain + helm components) │
 └──────────────┬───────────────────────────────────────────────┘
                │ reads CSS variables / injects NATIVE_HOST
 ┌──────────────▼──────────────┐   ┌─────────────────────────────┐
 │ 03 @spartan-native/desktop-ui│   │ 05 spartan-native-plugin    │
 │    title bars, OS patterns   │   │    (Claude Code dev tooling)│
 ├──────────────────────────────┤   └─────────────────────────────┘
 │ 02 @spartan-native/helm      │
 │    per-OS component skins    │
 ├──────────────────────────────┤
 │ 01 @spartan-native/theme     │◄── required; plain CSS + TS
 │    tokens, derivePalette(),  │
 │    NativeHost interface      │
 └──────────────▲───────────────┘
                │ implements NativeHost
 ┌──────────────┴───────────────────────────────────────────────┐
 │ 04 @spartan-native/host-{web|wails|tauri|electron|dotnet}    │
 └──────────────────────────────────────────────────────────────┘
```

## Packages

| # | Package | Badge | Depends on | Works in |
| --- | --- | --- | --- | --- |
| 01 | `@spartan-native/theme` | Plain CSS · required | spartan/ui tokens | Browser, PWA, any desktop shell |
| 02 | `@spartan-native/helm` | Optional · desktop behaviors | theme | Browser, PWA, any desktop shell |
| 03 | `@spartan-native/desktop-ui` | Optional | theme (helm once it needs behaviors) | Desktop shells; PWA (title bar via Window Controls Overlay) |
| 04 | `@spartan-native/host-*` | Per runtime | theme (provider interface) | Web, Wails, Tauri, Electron, Photino.NET |
| 05 | `spartan-native-plugin` | Dev tooling | all packages (as reference) | Claude Code |

### 01 `@spartan-native/theme`

Plain CSS variables plus a small TypeScript function that turns one accent color into a full palette. It works with stock spartan/ui in any browser.

- The token contract: `--primary`, `--secondary`, `--ring`, `--ts` and the rest (see [03](03-theme-tokens.md)).
- Accent derivation with contrast checks.
- Variable sets per platform × light/dark × contrast × transparency × text size.
- A Tailwind preset and the platform provider interface (`NativeHost`, `provideSpartanNative`).

### 02 `@spartan-native/helm`

Desktop **behaviors** for stock spartan components. *(Decided during implementation: the per-OS component skins live in `@spartan-native/theme`, so one package makes stock spartan look native. Helm adds behavior.)*

- The desktop selection model for lists and tables (`snSelectable`): click, Shift/Ctrl/⌘-click, arrows, Home/End, type-ahead, Ctrl/⌘+A, Esc.
- Default and cancel buttons (`snDefaultAction`, `snCancelAction`): Enter and Esc in dialogs and forms.
- Next: the controls spartan lacks (segmented control, number box, split button, status bar, tree view). See [05](05-components.md).
- Its styles read the theme's tokens only; no per-OS rules.

### 03 `@spartan-native/desktop-ui`

The pieces stock spartan does not have: window chrome and the larger patterns each OS is known for.

- Title bar: custom, native caption overlay or Window Controls Overlay.
- CommandBar / Toolbar / HeaderBar, TeachingTip, Inspector.
- PreferencesGroup / SettingsCard, StatusPage, a menubar adapter.
- Shortcut formatter (⌘ vs Ctrl) and a `*platformIf` structural directive.

### 04 `@spartan-native/host-*`

Adapters that read the real system settings and expose window and OS services. Each one passes the same conformance tests.

- `host-web`: browser APIs for web and PWA.
- `host-wails` (Go module; its own repository, [`Spartan-Native/host-wails`](https://github.com/Spartan-Native/host-wails)) and `host-tauri` (Rust plugin crate, Tauri v2).
- `host-electron` (main-process module + preload) and `host-dotnet` (C# library for Photino.NET).
- Capability flags, so components degrade gracefully. See [07](07-host-adapters.md).

### 05 `spartan-native-plugin` (Claude Code)

Packages the conventions so new screens follow them automatically.

- A skill with the pattern mapping and the token contract.
- Commands: `new-app`, `add-screen`, `audit`.
- A `native-ui-reviewer` agent.
- A hook that flags hard-coded colors after each edit.

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
| Go + Wails | `@spartan-native/host-wails` | `wailsHost()` | Go module `github.com/spartan-native/host-wails` (repository [`Spartan-Native/host-wails`](https://github.com/Spartan-Native/host-wails)) | WebView2 · WKWebView · WebKitGTK |
| Rust + Tauri | `@spartan-native/host-tauri` | `tauriHost()` | Rust plugin crate (Tauri v2) | WebView2 · WKWebView · WebKitGTK |
| TS + Electron | `@spartan-native/host-electron` | `electronHost()` | main-process module + preload | bundled Chromium |
| .NET + Photino | `@spartan-native/host-dotnet` | `dotnetHost()` | C# library for Photino.NET | WebView2 · WKWebView · WebKitGTK |

### What `provideSpartanNative` should do (derived from the design)

1. Resolve `PlatformInfo` from the host and pick the `Skin`. The user may override it.
2. Read `AppearanceState` and call `derivePalette(skin, accent, scheme, …)`.
3. Write the variables onto `document.documentElement`. Set classes for the skin (`t-<skin>`), `dark`, `rt` (reduced transparency) and `inactive` (window not focused). Set `--ts` for text scale.
4. Subscribe to `onAppearanceChange` and window focus events, and re-apply live.
5. Expose signals (e.g. `skin()`, `scheme()`, `textScale()`, `capabilities()`) for components and `*platformIf`.

## Proposed repository layout

The design implies an Nx-style monorepo. This layout is a recommendation, not a recorded decision.

```
spartan-native/
  packages/
    theme/            @spartan-native/theme      (CSS + TS, Tailwind preset)
    helm/             @spartan-native/helm       (skins, behaviors)
    desktop-ui/       @spartan-native/desktop-ui
    hosts/
      host-web/  host-electron/  host-tauri/ (+ Rust crate)
      host-dotnet/ (+ C# project)
      host-conformance/ shared conformance test suite
  apps/
    playground/       docs playground (replaces the design canvas)
  tools/plugin/       spartan-native-plugin
  docs/               this folder
```

In its own repositories: [`Spartan-Native/host-wails`](https://github.com/Spartan-Native/host-wails) (the Wails adapter, npm package and Go module) and [`Spartan-Native/harbor`](https://github.com/Spartan-Native/harbor) (the sample app, see [08](08-sample-app.md)).
