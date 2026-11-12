# Contributing to Spartan Native

Thanks for helping. This guide covers setting up the workspace, the rules the packages follow, and how changes get released. By taking part you agree to the [code of conduct](CODE_OF_CONDUCT.md). Report security problems privately, as described in [SECURITY.md](SECURITY.md).

## Requirements

| Tool         | Version                                                     |
| ------------ | ----------------------------------------------------------- |
| Node.js      | `^24.15.0 \|\| >=26.0.0`; **26** for development (`.nvmrc`) |
| npm          | ≥ 11 (`engine-strict=true` in `.npmrc`)                     |
| Angular      | 22.2 (CLI 22.2.6)                                           |
| spartan/ui   | `@spartan-ng/brain` 1.9, `@spartan-ng/cli` 1.9              |
| TypeScript   | ~6.0.3 (Angular 22 requires `>=6.0 <6.1`)                   |
| Tailwind CSS | 4.3 (required by spartan/ui)                                |
| Storybook    | 10.6 (`@storybook/angular`)                                 |

```bash
nvm install   # reads .nvmrc → Node 26
nvm use
npm install
```

If `ng` says your Node.js is too old, your shell is not on the `.nvmrc` version: run `nvm use`.

## Layout

```
spartan-native/
├── packages/                 Angular libraries (ng-packagr), published as @spartan-native/*
│   ├── theme/                tokens, derivePalette(), the seven skins, provider        [Storybook :6006]
│   ├── helm/                 desktop behaviors: selection model, default/cancel buttons [Storybook :6007]
│   ├── desktop-ui/           window chrome, OS patterns, desktop controls              [Storybook :6008]
│   └── hosts/                runtime adapters behind the NativeHost contract
│       ├── host-web/         browser / PWA
│       ├── host-conformance/ the test suite every adapter must pass
│       └── host-electron/    Electron (scaffold, not published)
├── apps/playground/          docs playground
├── libs/spartan-ui/          stock spartan/ui helm components (generated, never edited)
├── tools/claude-plugin/      Claude Code plugin and agent skill (not part of the Angular build)
├── scripts/                  build, pack and release helpers
└── docs/                     the design specification, images and design sources
```

These parts live in their own repositories:

| Repository                                                                    | What it is                                                               |
| ----------------------------------------------------------------------------- | ------------------------------------------------------------------------ |
| [`Spartan-Native/host-wails`](https://github.com/Spartan-Native/host-wails)   | `@spartan-native/host-wails` (Go + Wails v3) and its Go module           |
| [`Spartan-Native/host-tauri`](https://github.com/Spartan-Native/host-tauri)   | `@spartan-native/host-tauri` (Rust + Tauri v2) and its plugin crate      |
| [`Spartan-Native/host-dotnet`](https://github.com/Spartan-Native/host-dotnet) | `@spartan-native/host-dotnet` (.NET + Photino.NET) and its NuGet package |
| [`Spartan-Native/harbor`](https://github.com/Spartan-Native/harbor)           | The Harbor Backup sample app                                             |

### Dependency graph

```
theme  ◄── helm  ◄── desktop-ui
  ▲
  └──── host-web · host-conformance · host-electron (and the hosts in other repositories)
```

Each library declares Angular, spartan/ui and its sibling `@spartan-native/*` packages as **peer dependencies**. The root `package.json` holds the versions actually installed.

## Commands

| Command                                             | What it does                                                                         |
| --------------------------------------------------- | ------------------------------------------------------------------------------------ |
| `npm start`                                         | Serve the playground                                                                 |
| `npm test`                                          | Unit tests (Vitest through `@angular/build:unit-test`) for every project             |
| `npm run build:libs`                                | Build every library into `dist/`, in dependency order                                |
| `npm run build`                                     | Libraries, then the playground                                                       |
| `npm run check:packages`                            | After `build:libs`: check each package's metadata and tarball contents               |
| `npm run pack:libs`                                 | Build and pack each published package into `dist/tgz`, to install in another project |
| `npm run storybook:theme` / `:helm` / `:desktop-ui` | Interactive Storybook for one package                                                |
| `npm run build-storybook:<lib>`                     | Static Storybook into `dist/storybook/<lib>`                                         |
| `npm run theme:palette`                             | Regenerate the static default palettes after changing `derivePalette()`              |
| `npm run test:visual`                               | Visual regression screenshots (see below)                                            |

### Visual tests

`npm run test:visual` builds the theme and desktop-ui Storybooks and takes a Playwright screenshot of every skin × scheme. It is slow, and the baselines depend on the operating system's fonts and anti-aliasing, so they are not committed and CI does not run them.

Run it locally before and after a change to skin CSS, tokens or component styles: once on `main` (or with `-- --update-snapshots`) to record baselines, then on your branch to compare. Say in the pull request that you did.

## How the workspace is wired

**Path mapping.** In the root `tsconfig.json`, `@spartan-native/*` points to library **sources**, so the apps, unit tests and Storybooks work without a build. Each library's `tsconfig.lib.json` points its siblings at `dist/` instead, which is what ng-packagr needs. That is why `build:libs` builds in dependency order.

**Package boundaries.** Every package under `packages/` could move to its own repository, so a package refers to other packages only **by package name**, never by path:

- npm workspaces link `@spartan-native/*` into `node_modules`, so `@use '@spartan-native/theme/styles/spartan-native'` and `import … from '@spartan-native/theme'` resolve exactly as they will from npm.
- Workspace glue lives at the root: `tsconfig.json` and `tsconfig.lib.json`. Packages only `extends` them.
- Stock spartan components are reached through spartan's `@spartan-ng/helm/*` alias, never by path. The spartan CLI maintains those aliases in `tsconfig.json`.
- Each package's `devDependencies` list what its own Storybook needs, and each `.storybook/` folder is self-contained. The Storybook configuration is duplicated between packages on purpose.

**Published packages.** `scripts/libraries.mjs` lists the packages that go to npm, in dependency order. The pack, check and release scripts all read it. Add a new package there, and add its `ng build` to the `build:libs` script.

## Stock spartan/ui components

`libs/spartan-ui` holds the **unmodified** spartan/ui helm components, generated by the spartan CLI (configuration: `components.json`). **Never edit them by hand.** Spartan Native restyles them from CSS only, so keeping them stock proves the theme works on what real apps have.

```bash
npx ng g @spartan-ng/cli:ui <name>     # add or update one, e.g. dialog
```

After adding one, give it hooks in `packages/theme/styles/_hooks.scss` and a skin partial per platform. The steps are in the theme README, under [Adding a component skin](packages/theme/README.md#adding-a-component-skin).

## Rules for changes

- **Keep the agent docs in sync.** Each published package has an `AGENTS.md` that ships inside it, written for agents that build apps with the package. When you add, rename or remove a public export, input, slot, token or host service, update that package's `AGENTS.md` in the same change. These files refer to other packages by name only, never by repository path.
- **Keep the skill in sync.** When a change affects app setup, the host list, which component to use for a need, or anything a template uses, update `tools/claude-plugin/skills/spartan-native` too.
- **Shipped READMEs use absolute links.** A package's `README.md` is shown on npmjs.com, where relative links out of the package break. Link to `https://github.com/Spartan-Native/spartan-native/blob/main/…` instead. `npm run check:packages` catches this.
- **Generated files** carry a "GENERATED … Do not edit" header. Change their generator and rerun it.
- Add an entry to `CHANGELOG.md` under **Unreleased** for anything a user of the packages would notice.

## Pull requests

1. Branch from `main`.
2. Make the change, with unit tests for new behavior.
3. Run `npm test` and `npm run build:libs`. Run `npm run test:visual` if the change touches styles.
4. Open the pull request and fill in the checklist. CI runs the unit tests, the builds and the package check.

Keep a pull request to one topic. A large mechanical change (formatting, a rename) goes in its own pull request with nothing else in it.

## Releasing

Maintainers only. All `@spartan-native/*` packages in this repository share one version.

1. Move the **Unreleased** entries in `CHANGELOG.md` under a new `## [x.y.z] - YYYY-MM-DD` heading, and update the links at the bottom.
2. Set `"version"` in the root and every package `package.json` to the new version (and the sibling `@spartan-native/*` peer versions), and merge that to `main`.
3. Tag and push: `git tag vx.y.z && git push origin vx.y.z`. A `-beta` or `-beta.n` suffix publishes on the `beta` dist-tag.

`.github/workflows/release.yml` then tests, builds, stamps the tag's version into every package, publishes them to npmjs.org and creates the GitHub Release from the changelog section. The tag decides the published version, even if a `package.json` was not bumped.
