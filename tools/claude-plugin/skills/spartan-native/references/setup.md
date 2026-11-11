# Shared Angular setup

These steps apply to every runtime. The host-specific steps come after them, in `host-wails.md`, `host-tauri.md`, `host-dotnet.md`, `host-web.md` or `other-runtimes.md`.

Requirements: Angular 22+, Tailwind CSS 4, spartan/ui (`@spartan-ng/brain` 1.9+).

## 1. Install

The `@spartan-native/*` packages are published privately to GitHub Packages, not npmjs.com. Point the scope at that registry in the app's `.npmrc`, with a GitHub token that has `read:packages` and access to the Spartan-Native organization:

```ini
@spartan-native:registry=https://npm.pkg.github.com
//npm.pkg.github.com/:_authToken=${GITHUB_TOKEN}
```

Stable releases are on the `latest` dist-tag; betas are on `beta` (`npm install @spartan-native/theme@beta`). Install every `@spartan-native/*` package at the same version.

```bash
# spartan/ui + Tailwind (skip what the app already has)
npm install @spartan-ng/brain @angular/cdk tailwindcss @tailwindcss/postcss tw-animate-css \
  class-variance-authority clsx tailwind-merge @ng-icons/core @ng-icons/lucide
npm install -D @spartan-ng/cli
npx ng g @spartan-ng/cli:init

# Spartan Native: theme is required, helm and desktop-ui are strongly recommended for apps
npm install @spartan-native/theme @spartan-native/helm @spartan-native/desktop-ui

# One host (or two, for Wails with a browser fallback). See the host reference.
npm install @spartan-native/host-web
```

Then generate the spartan components you use. They're copied into the app and reached through the `@spartan-ng/helm/*` alias:

```bash
npx ng g @spartan-ng/cli:ui button input label switch table dialog alert-dialog dropdown-menu tabs
```

Never edit the generated components. Spartan Native restyles them from CSS through their `data-slot` attributes, and an edited copy can stop matching.

## 2. Styles

Two stylesheets, in this order, in the build target's `styles` in `angular.json`:

```json
"styles": ["src/styles.css", "src/theme.scss"]
```

- `src/styles.css`: Tailwind and the spartan preset. See `templates/setup/styles.css`.
- `src/theme.scss`: the Spartan Native skins. See `templates/setup/theme.scss`. It must load **after** Tailwind.

PostCSS config at the project root (`.postcssrc.json`):

```json
{ "plugins": { "@tailwindcss/postcss": {} } }
```

## 3. Providers

`app.config.ts` gets `provideSpartanHlm()` and `provideSpartanNative({ host })`. See `templates/setup/app.config.ts`.

`provideSpartanNative()` reads the host before the first render, so the app never flashes the wrong skin. Everything else (classes on `<html>`, `--sn-color-*` variables, focus and OS changes) is automatic.

## 4. The window frame

Start the root component from `templates/shell`. It renders:

```
.sn-window [snSheetHost]
├── <sn-title-bar>            title + window buttons, the OS's way
├── .body
│   ├── <sn-sidebar-nav class="sn-sidebar">
│   └── <main class="sn-content">  the current page
└── <sn-status-bar>           optional
```

## 5. Let the user override the OS (optional)

```ts
const theme = inject(SpartanNativeTheme);
theme.override({ scheme: 'dark' });       // or { accent: '#0a84ff' }, { skin: 'mac' }
theme.followSystem();                      // back to the OS
```

Live state is on the same service as signals: `theme.skin()`, `theme.scheme()`, `theme.platform()`, `theme.focused()`.

## Don't

- Don't import from deep paths (`@spartan-native/theme/src/...`). Use package roots, plus `@spartan-native/*/styles/*` for SCSS.
- Don't add a second stylesheet that sets colors for spartan components. The skins already do.
- Don't use `matchMedia('(prefers-color-scheme: dark)')` in components. Read `theme.scheme()`.
