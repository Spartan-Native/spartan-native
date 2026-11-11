---
name: spartan-native
description: Build native-looking Angular desktop and web apps with the @spartan-native packages (theme, helm, desktop-ui, host-wails, host-web). Use when the user wants an app that looks and behaves like a Windows, macOS, GNOME, KDE or ChromeOS app, mentions Spartan Native, spartan/ui or spartan-ng with a native or desktop look, builds a Wails (Go) desktop frontend in Angular, or asks for a window, title bar, sidebar, settings screen, toolbar or dialog that should follow the OS theme. Covers installing the right host for the runtime, wiring provideSpartanNative(), picking components instead of hand-styling, and writing screens as separate .ts/.html/.css files with layout-only CSS.
---

# Spartan Native

Spartan Native makes **stock spartan/ui** (`@spartan-ng/helm/*`) components look and behave native on Windows 11/10, macOS 26/13–15, GNOME, KDE Plasma and ChromeOS. It follows the OS accent, light/dark mode, contrast, text size, transparency and window focus live. The look comes from the packages. **Your app code only arranges components.**

| Package | Layer | What it gives you |
| --- | --- | --- |
| `@spartan-native/theme` | 01, required | Skins, `--sn-*` tokens, `provideSpartanNative()`, the host contract |
| `@spartan-native/helm` | 02 | Desktop behavior: list/table selection, Enter/Esc buttons, OS dialog button order |
| `@spartan-native/desktop-ui` | 03 | Title bar, window controls, sidebar nav, command bar, settings, sheets, inspector, tree, menus, status bar |
| `@spartan-native/host-*` | 04 | Reads the real OS for one runtime: `host-wails`, `host-web` (Electron, Tauri, .NET are not ready yet) |

## 1. Read the package docs first

Every package ships an `AGENTS.md`. **They are the source of truth for the API.** This skill tells you how to put them together; it doesn't repeat every input. Before writing UI, read the ones you use:

```
node_modules/@spartan-native/theme/AGENTS.md        # always
node_modules/@spartan-native/helm/AGENTS.md         # lists, tables, dialogs, forms
node_modules/@spartan-native/desktop-ui/AGENTS.md   # window chrome and OS patterns
node_modules/@spartan-native/host-wails/AGENTS.md   # Wails apps
node_modules/@spartan-native/host-web/AGENTS.md     # browser / PWA, and the fallback
```

If something here disagrees with an installed `AGENTS.md`, the `AGENTS.md` wins (it matches the installed version).

## 2. Set up for the runtime

Ask (or detect) which runtime the app targets, then follow one reference:

| Runtime | Host | Reference |
| --- | --- | --- |
| Go + **Wails v3** desktop app | `wailsHost()` from `@spartan-native/host-wails`, with `webHost()` as the browser fallback | [references/host-wails.md](references/host-wails.md) |
| Browser or installed **PWA** | `webHost()` from `@spartan-native/host-web` | [references/host-web.md](references/host-web.md) |
| Electron, Tauri, Photino.NET | Not ready: use `webHost()` for now | [references/other-runtimes.md](references/other-runtimes.md) |
| Storybook, tests, demos | `staticHost({ skin, scheme })` from `@spartan-native/theme` | none |

Every runtime shares the same Angular setup: [references/setup.md](references/setup.md). Ready files are in [templates/setup](templates/setup).

Only the `host:` line in `app.config.ts` differs between runtimes. Never import a runtime API (`@wailsio/runtime`, Electron, Tauri) in a component.

## 3. Pick components, don't style them

Before you write any markup, find the need in [references/components.md](references/components.md). In order of preference:

1. A **desktop-ui** component (`<sn-title-bar>`, `<sn-sidebar-nav>`, `<sn-command-bar>`, `<sn-settings-group>`, `<sn-modal-sheet>`, `<sn-status-page>`, …). These change *layout* per OS, not just colors.
2. A **stock spartan/ui** component (`hlmBtn`, `hlmInput`, `hlm-switch`, `hlmTable`, `hlm-dialog`, …), plus **helm directives** for desktop behavior (`snSelectable`, `snDefaultAction`, `snCancelAction`).
3. A **material class** from the theme for app-frame surfaces: `sn-window`, `sn-sidebar`, `sn-content`, `sn-chrome`, `sn-glass`, `sn-list-item`, `sn-tone-*`.
4. Only then your own element, with layout CSS and `--sn-*` tokens.

Use spartan's variants for intent: `outline` is the OS's standard button, `default` is the accent (suggested) action, `ghost` is flat. Generate missing spartan components with `npx ng g @spartan-ng/cli:ui <name>` and **never edit them**.

## 4. Write screens as separate files

Every component is three files, the way the templates are:

```
pages/backups/backups.ts     # logic, imports, providers (icons)
pages/backups/backups.html   # the template: components, nothing inline-styled
pages/backups/backups.css    # layout only
```

Use `templateUrl` and `styleUrl`, never inline `template:` or `styles:`. Start from the templates rather than a blank file:

| Template | Use it for |
| --- | --- |
| [templates/shell](templates/shell) | The main window: title bar, sidebar nav, content, status bar; correct on Wails, PWA and browser |
| [templates/pages/list-page](templates/pages/list-page) | A command bar over a selectable table, with an empty state |
| [templates/pages/settings-page](templates/pages/settings-page) | A settings or preferences screen |
| [templates/dialogs/new-item-sheet](templates/dialogs/new-item-sheet) | A modal form with Cancel / primary buttons in OS order |
| [templates/setup](templates/setup) | `app.config.ts`, `styles.css`, `theme.scss`, `angular.json` styles |
| [templates/wails](templates/wails) | `main.go` for a Wails v3 window with the Spartan Native service |

## 5. CSS: layout only

A component's `.css` file positions things. It doesn't decide how they look. Full rules: [references/styling.md](references/styling.md).

**Allowed:** `display`, `flex`/`grid` and their gaps, `inline-size`/`block-size`, `min-*`/`max-*`, `padding`/`margin` for spacing, `overflow`, `position`.
**Not allowed:** colors, backgrounds, borders, radii, shadows, font families, per-OS selectors (`.t-mac …`), `!important`, restyling an `hlm*` or `sn-*` component.
**If you need a value**, use a token: `var(--sn-color-fg-muted)`, `var(--sn-radius-surface)`, `var(--sn-font-size-small)`. Use `rem` (or tokens) for sizes, so the OS text size scales the UI.

## 6. Rules that are easy to get wrong

- **Shortcuts and OS names:** `<kbd snShortcut="mod+s">`, never "Ctrl+S" or "⌘S" in text.
- **Per-OS differences:** `*snPlatformIf="'macos'; else other"` or `injectSkin()`. Never sniff the user agent.
- **Dialog buttons:** mark them (`snSheetPrimary`/`snSheetCancel` in `sn-modal-sheet`, `snDefaultAction`/`snCancelAction` elsewhere) and write them in any order. Never reorder them per OS yourself.
- **Selectable lists and tables:** `snSelectable` + `snSelectableItem` with stable ids. Don't hand-roll click/Shift/Ctrl handling or ARIA.
- **Menus:** one `SnMenuItem[]` for `<sn-menubar>` and `[snContextMenu]`. They become real OS menus where the host supports it.
- **Window drag regions:** `<sn-title-bar>` already is one. Don't add `app-region` or `--wails-draggable` to it.
- **Optional host services** (`dialogs`, `menus`): check before use, `host.dialogs?.openFile(…)`.
- **Icons:** register with `provideIcons({ … })` in the component's `providers`, then pass the name (`icon="lucidePlus"`).

## 7. Before you finish

- [ ] Only the `host:` line knows the runtime; no runtime imports in components.
- [ ] No inline `template:` / `styles:`; every component has its own `.html` and `.css`.
- [ ] `.css` files contain layout only. Search them for `#`, `rgb`, `hsl`, `color:`, `background`, `border`, `shadow`, `!important`, `.t-`, and remove any you find (unless the value is a `var(--sn-*)` token).
- [ ] No spartan component was forked or edited; no `sn-*` component restyled.
- [ ] Every dialog and form with a primary action marks its default and cancel buttons.
- [ ] Shortcuts use `snShortcut` / `formatShortcut()`.
