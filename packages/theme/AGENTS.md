# AGENTS.md: @spartan-native/theme

Instructions for AI coding agents building an Angular app with `@spartan-native/theme`.

## What this package is

Layer 01 of Spartan Native, and the only required layer. It makes **stock spartan/ui (`@spartan-ng/helm/*`) components** look native on Windows 11/10, macOS 26/13–15, GNOME, KDE Plasma and ChromeOS. They follow the OS accent, light/dark, contrast, text size, transparency and window focus. It does this with CSS only, so you never fork a spartan template.

It also owns the **host contract** (`NativeHost`), which every `@spartan-native/host-*` adapter implements.

| Package | Layer | Use it for |
| --- | --- | --- |
| `@spartan-native/theme` | 01 (required) | Skins, tokens, palette, `provideSpartanNative()`, the host contract |
| `@spartan-native/helm` | 02 | Desktop behaviors: selection model, Enter/Esc buttons, dialog button order |
| `@spartan-native/desktop-ui` | 03 | Title bar, OS patterns, menus, tree, number box, split button, status bar |
| `@spartan-native/host-*` | 04 | Reading the real OS (`host-web`, `host-wails`, `host-tauri`, `host-dotnet`; Electron is a scaffold) |

## Set up an app

```ts
// app.config.ts: pick ONE host; the rest of the app never changes per runtime
import { provideSpartanNative, staticHost } from '@spartan-native/theme';
import { webHost } from '@spartan-native/host-web';

export const appConfig: ApplicationConfig = {
  providers: [provideSpartanNative({ host: webHost() })],
  // Storybook / tests / demos: staticHost({ skin: 'mac', scheme: 'dark' })
};
```

```scss
// src/theme.scss: load AFTER Tailwind + the spartan preset (angular.json "styles": ["src/styles.css", "src/theme.scss"])
@use '@spartan-native/theme/styles/spartan-native';
@use '@spartan-native/helm/styles/spartan-native-helm'; // if you use @spartan-native/helm
```

`provideSpartanNative()` reads the host before the first render, so the app never flashes the wrong skin.

## Public API (`import … from '@spartan-native/theme'`)

### Angular

| Symbol | Use |
| --- | --- |
| `provideSpartanNative({ host, overrides?, persist? })` | Wires everything. `overrides` (a `Partial<AppearanceState>`) wins over the OS. `persist: true` keeps the user's overrides in `localStorage` (`spartan-native:overrides`) between launches and applies them before the first render; `persist: { key, storage }` for another key or store. Stored overrides win over `overrides` |
| `SpartanNativeTheme` (inject) | Live state as signals: `appearance()`, `skin()`, `scheme()`, `textScale()`, `platform()`, `nativeSkin()` (the real OS's skin, whatever the user picked), `platformFamily()` (the real OS family), `focused()`, `followsSystem()`, `overrides()`. Fields: `runtime`, `window`, `menus`, `capabilities`. Methods: `override(patch)`, `followSystem()`, `capability(name)` |
| `injectSkin()` | `Signal<Skin>`. Works with or without the provider (falls back to `<html data-sn-skin>`) |
| `skinFamily(skin)` | `'windows' \| 'macos' \| 'linux' \| 'chromeos' \| 'web'` |
| `injectPlatformFamily()`, `injectNativeSkin()` | The **real** OS (family / skin) as a signal, for behavior: shortcut notation, where the OS draws window buttons, the macOS menu bar. A Mac dressed as Windows is still `macos`. Without the provider: `<html data-sn-platform>`, then the skin |
| `SKIN_LABELS`, `SCHEME_LABELS`, `CONTRAST_LABELS`, `SKIN_OPTIONS`, `TEXT_SCALE_OPTIONS` | Display names for an appearance settings screen ("Windows 11", "KDE Plasma", "125 %"); `SnOption<T>` is `{ value, label }` |
| `readStoredOverrides(storage, key?)` | Reads persisted overrides (valid appearance fields only), e.g. to show them before bootstrap |
| `NATIVE_HOST`, `SPARTAN_NATIVE_OPTIONS` | Injection tokens. `inject(NATIVE_HOST)` gives the raw host, e.g. for `dialogs` |

### Without Angular

| Symbol | Use |
| --- | --- |
| `applySpartanNative(root, { ...appearance, focused })` | Writes the classes and `--sn-color-*` variables onto any element |
| `derivePalette({ skin, accent, scheme, reduceTransparency? })`, `paletteToCssVars()`, `paletteVarName()` | One accent → every color token, contrast-checked |
| `resolveSkin(platformInfo)`, `skinClasses(skin)` | OS → skin, skin → `t-*` classes |
| `staticHost(initial)` | A code-controlled host (`set()`, `setFocused()`) for Storybook, tests and in-app skin pickers |
| Color helpers | `normalizeHex`, `mix`, `rgba`, `contrastRatio`, `ensureContrast`, `readableOn`, `hexToRgb`, `toHsl`, … |

### The host contract (types)

`NativeHost` has `runtime`, `capabilities`, `platform()`, `appearance()`, `onAppearanceChange(cb)` and `window` (`WindowHost`). It also has three optional services:

- **`menus?: MenuHost`**: `setApplicationMenu(MenuItem[])`, `showContextMenu(MenuItem[], {x, y})` and `onAction(id ⇒ …)`. Present exactly when `capabilities.nativeMenus !== 'none'`.
- **`dialogs?: DialogHost`**: `openFile({ filters, multiple })` resolves `PickedFile[]`. `saveFile({ filters, fileName })` and `pickFolder()` resolve `PickedFile | null`. The optional `message({ kind, message, buttons, defaultId, cancelId })` resolves a button id. Present exactly when `capabilities.fileDialogs !== 'none'`. A cancelled dialog resolves `[]` or `null` and never rejects. A `PickedFile` has a `path` on native hosts and a File System Access `handle` in the browser.
- **`notifications?`**: not specified yet. Don't use it.

Other exports: `Skin`, `STYLED_SKINS`, `AppearanceState`, `DEFAULT_APPEARANCE`, `PlatformInfo`, `Capability`, `CAPABILITIES`, `CapabilityLevel` (`'native' | 'partial' | 'none'`), `MenuItem`, `MenuRole`, `MENU_ROLES`, `FileFilter`, `TEXT_SCALES`.

```ts
// Always check before using an optional service
const host = inject(NATIVE_HOST);
const [file] = (await host.dialogs?.openFile({ filters: [{ name: 'Images', extensions: ['png', 'jpg'] }] })) ?? [];
```

## Skins

| `Skin` | OS | Root classes |
| --- | --- | --- |
| `win` / `w10` | Windows 11 / 10 | `t-win` / `t-win t-w10` |
| `mac` / `macc` | macOS 26 / 13–15 | `t-mac` / `t-mac t-macc` |
| `gtk` | GNOME (Adwaita) | `t-gtk` |
| `qt` | KDE Plasma (Breeze) | `t-qt` |
| `cros` | ChromeOS (Material 3) | `t-cros` |
| `web` | unknown OS, no skin sheet | none |

State classes on `<html>`: `dark`, `rt` (reduce transparency), `inactive` (window unfocused), `hc` (more/forced contrast), `reduce-motion`. `<html>` also has `data-sn-skin="<skin>"`.

## Styling your own UI: rules

1. **Never hard-code colors.** Use the `--sn-color-*` tokens: `bg`, `fg`, `fg-muted`, `surface`, `surface-solid`, `primary`, `primary-fg`, `accent`, `accent-text`, `border`, `stroke`, `hover`, `muted`, `ring`, `sidebar`, `scrim`, `danger`/`-fg`, `warning`/`-fg`, `success`/`-fg`, `control`, `track`, `glass`, `acrylic`. They're re-derived live from the OS accent and scheme. Tailwind's spartan names (`bg-background`, `text-primary`, …) map onto them too.
2. **Size with rem or the theme's tokens**, not px, so the OS text size (`--sn-text-scale`) scales your UI. Useful tokens: `--sn-control-height`, `--sn-radius-control|surface|overlay`, `--sn-font-size`, `--sn-font-size-small`, `--sn-dialog-padding`, `--sn-row-height`.
3. **Use the material classes for the app frame:** `sn-window`, `sn-sidebar`, `sn-content`, `sn-glass`, `sn-chrome` (dims with the inactive window), `sn-list-item`. For status tints on `hlmBadge` or `hlmAlert`, use `sn-tone-success|warning|danger|accent`.
4. **Use spartan's variants for intent.** `outline` is the platform's standard button, `default` is the accent/suggested action, and `ghost` is flat. Don't restyle components per OS in app code; the skins already do that.
5. **Per-OS logic belongs in templates** through `*snPlatformIf` (desktop-ui) or `injectSkin()`, not in user-agent sniffing. The skin is the *look*; for *behavior* that follows the real OS (keys, native window buttons) use `injectPlatformFamily()`.
6. **Don't persist the appearance yourself.** Use `provideSpartanNative({ persist: true })` instead of mirroring `override()` into storage.
7. **Cascade:** all theme CSS sits in `@layer spartan-native`, after Tailwind's `utilities`. Your unlayered CSS beats the skins, so keep overrides minimal and token-based.
8. **Never use `!important`** to fight a skin. If a skin is wrong, fix the token or the skin file.

## Don't

- Don't import from deep paths like `@spartan-native/theme/src/...`. Use the package root, and the `styles/*` exports for SCSS.
- Don't call OS or runtime APIs (Wails, Electron, `matchMedia` for the scheme) directly in components. Go through `SpartanNativeTheme` or `NATIVE_HOST`.
- Don't assume an optional host service exists. Check `capabilities` or use `?.`.

## Other entry points

- `@spartan-native/theme/storybook`: the Storybook toolbar (skin, accent, scheme, transparency) and the decorator for a project's `.storybook/preview.ts`.
- `@spartan-native/theme/storybook/manager`: the toolbar addon's UI (OS select with icons, transparency, contrast and window switches, accent swatches). Import it for its side effect in `.storybook/manager.ts`: `import '@spartan-native/theme/storybook/manager';`. Without it, those globals have no toolbar controls (only the text size uses Storybook's own dropdown).
- `@spartan-native/theme/styles/*`: the SCSS. `spartan-native.scss` is the entry; `_hooks.scss` holds spartan's `data-slot` selectors.
