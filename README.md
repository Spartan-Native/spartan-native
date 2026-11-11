# Spartan Native

**Native on every desktop. One Angular codebase.**

![One Harbor Backup window cut into seven vertical slices, each rendered in a different skin: Windows 11 light, Windows 10 dark, macOS 26 light, macOS 13–15 dark, GNOME light, KDE dark, ChromeOS light](docs/images/hero-one-app-seven-skins.png)

<sub>The same app window, unchanged, in all seven skins: Windows 11 · Windows 10 · macOS 26 · macOS 13–15 · GNOME · KDE · ChromeOS, alternating light and dark. Rendered from the design mockups.</sub>

Spartan Native is a native-look theme for [spartan/ui](https://spartan.ng) (Angular). It does not fork spartan. Your components stay the same and read one shared set of CSS variables. A **skin** changes their geometry, materials and states to match each OS, and a **host adapter** feeds in the settings the user already chose in the OS: accent color, light/dark, contrast, transparency, text size and window focus. The same app runs in a browser/PWA and in Wails, Tauri, Electron or Photino.NET. Only one line of `app.config.ts` changes per runtime.

> **Status:** `@spartan-native/theme` is implemented for **Windows 11, macOS 26 and GNOME**, with a Storybook and the Harbor Backup sample app. `@spartan-native/helm` has its first desktop behaviors (selection model, default/cancel buttons), and `@spartan-native/desktop-ui` its first window chrome and OS patterns (title bar, window controls, settings list, status page, shortcuts). `@spartan-native/host-web` reads the OS settings live in any browser (and Harbor installs as a PWA), and `@spartan-native/host-conformance` tests every adapter. `@spartan-native/host-wails` reads the real OS settings through a Go service (Harbor runs as a Wails desktop app). Tauri, Electron and Photino are still scaffolds. The full spec is in [`docs/`](docs/README.md); the next steps are in the [roadmap](docs/09-roadmap.md).

---

## Concepts

### 1. One accent → every color

Everything starts from a single input: the **system accent color**. `derivePalette()` mixes it with each platform's own light and dark neutrals. Text colors are then adjusted until they reach WCAG 4.5:1 contrast, and semantic colors (error, success, warning) borrow the accent's saturation. Change the accent in the OS and the whole app follows.

![Derived palette: the twelve tokens per platform in light and dark](docs/images/theme-derived-palette.jpg)

→ [Theme tokens & accent derivation](docs/03-theme-tokens.md)

### 2. Seven skins, one set of tokens

Every skin reads the same variables, so components stay identical while geometry, materials and states follow the platform: Fluent's Mica and acrylic on Windows 11, flat square controls on Windows 10, Liquid Glass capsules on macOS 26, vibrancy on macOS 13–15, Adwaita on GNOME, Breeze on KDE, and a Material 3 tonal palette on ChromeOS. A skin is a class on the document root (`t-win`, `t-mac`, …), combined with `dark`, `rt` (reduced transparency) and `inactive` (window not focused).

![The seven platform skins with their buttons, switch and checkbox](docs/images/project-platform-skins.jpg)

→ [Platform skins](docs/04-platform-skins.md) · [Components](docs/05-components.md)

### 3. Settings users already chose, respected everywhere

Theming makes an app *look* native. These behaviors make it *feel* native: live light/dark switching, solid surfaces when the user reduces transparency, text sizes from 100 to 200% with controls that grow, greyed-out selections when the window loses focus, the desktop selection model (Shift/Ctrl/⌘-click, arrow keys, type-ahead), and per-OS conventions such as ⌘ vs Ctrl, dialog button order and Enter/Esc.

![Native behaviors and their status in the design](docs/images/project-native-behaviors.jpg)

### 4. Start with plain CSS, add only what you need

The project is five layers. Only the first is required. Each one builds on the layer below, so an app can stop at plain CSS in a browser or go all the way to native window effects.

![The five packages, and the same settings screen built up one layer at a time](docs/images/project-packages-and-layers.jpg)

| # | Package | What it adds |
| --- | --- | --- |
| 01 | [`@spartan-native/theme`](packages/theme) | Tokens, `derivePalette()`, the `NativeHost` contract, `provideSpartanNative()`. **Required.** |
| 02 | [`@spartan-native/helm`](packages/helm) | Desktop behaviors: the list/table selection model, default (Enter) and cancel (Esc) buttons |
| 03 | [`@spartan-native/desktop-ui`](packages/desktop-ui) | Window chrome and OS signature patterns spartan doesn't have |
| 04 | [`@spartan-native/host-*`](packages/hosts) | Bridges to the real OS settings, one per runtime |
| 05 | [`spartan-native-plugin`](tools/claude-plugin) | Claude Code plugin that applies the conventions automatically |

→ [Architecture & packages](docs/02-architecture.md)

### 5. OS patterns and their counterparts

Each OS has signature patterns, such as Windows' CommandBar, the macOS Sheet and Inspector, and GNOME's PreferencesGroup and StatusPage. `desktop-ui` builds each pattern once. It renders natively on its home OS and as the closest equivalent everywhere else.

![Settings list: AdwPreferencesGroup on GNOME and its counterparts on the other platforms](docs/images/desktop-ui-settings-list.jpg)

→ [OS patterns](docs/06-os-patterns.md)

### 6. One contract, five runtimes

Every runtime adapter implements the same `NativeHost` interface. Each adapter reports what its runtime can do as `native`, `partial` or `none` for every capability. Components check these flags and fall back gracefully, so the theme and components never know which runtime they're in.

```ts
// app.config.ts: the only line that changes per runtime
import { provideSpartanNative } from '@spartan-native/theme';
import { wailsHost } from '@spartan-native/host-wails';   // or webHost, tauriHost, electronHost, dotnetHost

export const appConfig = {
  providers: [provideSpartanNative({ host: wailsHost() })],
};
```

![Capability matrix per adapter and the shared NativeHost contract](docs/images/project-host-adapters.jpg)

→ [Host contract & adapters](docs/07-host-adapters.md)

### Roadmap

![Roadmap: design mockups → token contract & spike → theme + helm → host adapters → desktop UI → gaps & tooling](docs/images/project-roadmap.jpg)

→ [Roadmap & milestones](docs/09-roadmap.md) · [Open questions](docs/10-open-questions.md)

---

## Workspace

### Requirements

| Tool | Version |
| --- | --- |
| Node.js | `^24.15.0 \|\| >=26.0.0`; **26** for development (`.nvmrc`) |
| npm | ≥ 11 (`engine-strict=true` in `.npmrc`) |
| Angular | 22.2 (CLI 22.2.6) |
| spartan/ui | `@spartan-ng/brain` 1.9.0, `@spartan-ng/cli` 1.9.0 |
| TypeScript | ~6.0.3 (Angular 22 requires `>=6.0 <6.1`) |
| Tailwind CSS | 4.3 (required by spartan/ui) |
| Storybook | 10.6 (`@storybook/angular`) |

```bash
nvm install   # reads .nvmrc → Node 26
nvm use
npm install
```

### Layout

```
spartan-native/
├── packages/                     Angular libraries (ng-packagr), published as @spartan-native/*
│   ├── theme/            01  tokens, derivePalette(), skins for win/mac/gtk, provider     [Storybook :6006]
│   ├── helm/             02  desktop behaviors: selection model, default/cancel buttons [Storybook :6007]
│   ├── desktop-ui/       03  title bar, window controls, settings list, status page      [Storybook :6008]
│   └── hosts/            04  runtime adapters behind the NativeHost contract
│       ├── host-web/             browser / PWA (implemented)
│       ├── host-wails/           Go + Wails v3 (+ native/ Go module) (implemented)
│       ├── host-tauri/           Rust + Tauri v2  (+ native/ Rust crate)
│       ├── host-electron/        Electron         (+ native/ main + preload)
│       ├── host-dotnet/          Photino.NET      (+ native/ C# library)
│       └── host-conformance/     the test suite every adapter must pass (implemented)
├── apps/
│   ├── playground/           docs playground (the living spec)
│   ├── harbor-backup/        Harbor Backup sample app (browser, installable PWA)
│   └── harbor-desktop/       Harbor as a Wails v3 desktop app (Go)
├── libs/spartan-ui/           stock spartan/ui helm components (generated, never edited; workspace-local)
├── tools/claude-plugin/  05  Claude Code plugin (not part of the Angular build)
└── docs/                     the implementation spec, images and design sources
```

### Dependency graph

```
theme  ◄── helm  ◄── desktop-ui
  ▲
  └──── host-web · host-wails · host-tauri · host-electron · host-dotnet · host-conformance
```

Each library declares Angular, spartan/ui and its sibling `@spartan-native/*` packages as **peer dependencies**. The root `package.json` holds the actual installed versions.

**Path mapping:** in the root `tsconfig.json`, `@spartan-native/*` points to library **sources**, so apps, specs and Storybook work without a build. Each library's `tsconfig.lib.json` points its siblings at `dist/`, which is what ng-packagr needs. So build in dependency order with `npm run build:libs`.

### Commands

| Command | What it does |
| --- | --- |
| `npm start` | Serve the playground |
| `npm run start:harbor` | Serve the Harbor Backup sample app |
| `npm run start:harbor-desktop` | Build and run Harbor as a Wails desktop app (needs Go) |
| `npm run build:libs` | Build all libraries in dependency order into `dist/` |
| `npm run build` | Libraries, then both apps |
| `npm test` | Unit tests (Vitest via `@angular/build:unit-test`) |
| `npm run storybook:theme` / `:helm` / `:desktop-ui` | Interactive Storybook for one lower layer |
| `npm run build-storybook:<lib>` | Static Storybook into `dist/storybook/<lib>` |
| `npx ng g @spartan-ng/cli:ui <name>` | Add a stock spartan helm component to `libs/spartan-ui` (config: `components.json`) |
| `npm run theme:palette` | Regenerate the static default palettes after changing `derivePalette()` |

### Package boundaries

Every package under `packages/` is meant to become its own repository later, so a package only ever refers to the packages it depends on, **by package name**:

- **npm workspaces** link `@spartan-native/*` into `node_modules`, so `@use '@spartan-native/theme/styles/spartan-native'` and `import … from '@spartan-native/theme'` work exactly as they will from npm.
- **Workspace glue lives at the root, not in packages:** `tsconfig.json` maps `@spartan-native/*` to sources (apps, tests, Storybook), and `tsconfig.lib.json` maps them to `dist/` for library builds. Packages only `extends` these.
- **Stock spartan components** (`libs/spartan-ui`) are reached through spartan's `@spartan-ng/helm/*` alias, never by path.
- Each package's `devDependencies` list what its own Storybook needs.

### Storybook

Each Storybook is self-contained in its project's `.storybook/` folder. They share the toolbar by importing `@spartan-native/theme/storybook`: OS and transparency in the toolbar, light/dark from Storybook's theme switcher, and the system accent as a color picker in Controls.

| Command | Shows |
| --- | --- |
| `npm run storybook:theme` (:6006) | The stock spartan/ui components, themed |
| `npm run storybook:helm` (:6007) | The selection model on a list and a table, and default/cancel buttons |
| `npm run storybook:desktop-ui` (:6008) | Title bar, settings list, status page, shortcuts and `*snPlatformIf` on every OS |
| `npm run storybook:harbor` (:6010) | The Harbor Backup window, with text size and window focus added to the toolbar |

## Docs

| | |
| --- | --- |
| [Overview](docs/01-overview.md) | [Architecture](docs/02-architecture.md) |
| [Tokens & palette](docs/03-theme-tokens.md) | [Platform skins](docs/04-platform-skins.md) |
| [Components](docs/05-components.md) | [OS patterns](docs/06-os-patterns.md) |
| [Host adapters](docs/07-host-adapters.md) | [Sample app](docs/08-sample-app.md) |
| [Roadmap](docs/09-roadmap.md) | [Open questions](docs/10-open-questions.md) |

<sub>Images are rendered from the design canvas "Spartan Native Theme — Wails" (`docs/reference/design-source/`) with the scripts in `docs/reference/screenshot-tools/`. Platform names are trademarks of their respective owners.</sub>
