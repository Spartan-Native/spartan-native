# TODO: split host-wails and Harbor out of spartan-native

Two things leave this repository:

1. **`@spartan-native/host-wails`** (TypeScript adapter + Go service). Already split into its own repository: `Spartan-Native/host-wails`, local clone `../host-wails`, first commit `433058f`.
2. **The Harbor sample app**, both `apps/harbor-backup` (Angular app, Storybook, visual test) and `apps/harbor-desktop` (Wails shell). It goes to a new repository, `Spartan-Native/harbor`, where it can later get more desktop shells (Tauri, Electron, .NET) next to Wails.

After both, spartan-native contains only the published packages (theme, helm, desktop-ui, host-web, host-conformance, the scaffold hosts), the playground, docs and the agent skill.

Delete this file when everything is done.

---

## 0. Background: what changed in host-wails

- **Go module path:** `github.com/spartan-native/host-wails/native` → `github.com/spartan-native/host-wails` (public package at the repository root, still `package spartannative`).
- **Go install:** `go get github.com/spartan-native/host-wails@vX.Y.Z` with `GOPRIVATE=github.com/spartan-native/*` and git auth. The npm package no longer ships `native/`, and the `replace … node_modules` setup is gone.
- **Bound method names:** `DEFAULT_SERVICE` is `github.com/spartan-native/host-wails.Service`, because Wails names methods after the Go package path. The old copy in this repo and the new repo are **not compatible**: never pair old Go code with the new npm package, or the reverse.
- **Versions:** npm package and Go module are released together from one `vX.Y.Z[-beta[.N]]` tag and must be used at the same version.
- **Theme dependency:** peer range `@spartan-native/theme` `^0.1.0`.
- **Layout (as restructured after the first commit):** npm workspace in `npm/`, package in `npm/projects/host-wails/`, build output `npm/dist/host-wails`, OS readers in `internal/`.

## 1. host-wails repository (`../host-wails`)

- [ ] Commit the restructuring that's still uncommitted there (`npm/projects/…`, `internal/…`, `Makefile`, `doc.go`, workflow changes). Check that `README.md` and `AGENTS.md` name the same internal folder as the code (`internal/appearance` vs `internal/osappearance`).
- [ ] Create the GitHub repository `Spartan-Native/host-wails` (the name must match the Go module path), add it as `origin`, push `main`.
- [ ] Once step 2 below is done: in `npm/`, run `npm install`, commit `npm/package-lock.json`, push. CI should go green.
- [ ] Tag the first release (e.g. `v0.1.0`) so Harbor can depend on it.

## 2. Publish what host-wails and Harbor need from this repo

- [ ] Release spartan-native at a version that satisfies `^0.1.0` (tag `v0.1.0` or `v0.1.0-beta.1`). If you pick another version, change the ranges in `../host-wails/npm/package.json` and `../host-wails/npm/projects/host-wails/package.json`.
- [ ] In the GitHub settings of each `@spartan-native/*` package (theme, helm, desktop-ui, host-web, host-conformance), under **Manage Actions access**, give **read** access to the `host-wails` and `harbor` repositories.

## 3. Create the Harbor repository (`../harbor`)

### Move with history

- [ ] `git subtree split --prefix=apps/harbor-backup -b harbor-backup-split` and `--prefix=apps/harbor-desktop -b harbor-desktop-split` in spartan-native, then merge both branches into a new repo under subfolders (e.g. `git read-tree`/`git merge -s ours --allow-unrelated-histories` into `app/` and `desktop/wails/`), or use `git filter-repo --path apps/harbor-backup --path apps/harbor-desktop` on a fresh clone. Delete the temporary branches here afterwards.

### Suggested layout

```text
harbor/
├── app/                  Angular app (was apps/harbor-backup): src/, public/, .storybook/, e2e/
├── desktop/
│   └── wails/            Wails shell (was apps/harbor-desktop): main.go, go.mod, scripts/build.mjs
│   (tauri/, electron/, dotnet/ later)
├── angular.json, package.json, tsconfig.json, .npmrc, .nvmrc
├── components/ui/        spartan helm components (was libs/spartan-ui here)
├── playwright.config.ts
└── .github/workflows/    CI
```

### Make it stand alone

- [ ] **Angular workspace:** new `angular.json` with the `harbor-backup` project (copy from spartan-native's `angular.json`, paths adjusted: build, serve, test, storybook, build-storybook, service worker config, budgets).
- [ ] **Dependencies:** `package.json` with Angular 22, Storybook 10, Tailwind 4, `@spartan-ng/brain`, `@angular/service-worker`, `@ng-icons/*`, `@tanstack/*charts`, `embla-carousel*`, `luxon`, `ngx-scrollbar`, Playwright, and the `@spartan-native/*` packages it imports: `theme`, `helm`, `desktop-ui`, `host-web`, `host-wails` (all from GitHub Packages, `.npmrc` with `@spartan-native:registry=https://npm.pkg.github.com`).
- [ ] **spartan helm components:** the app imports ~43 `@spartan-ng/helm/*` entry points that come from `libs/spartan-ui` here. Either copy that folder or regenerate them with `npx ng g @spartan-ng/cli:ui`, and add the `@spartan-ng/helm/*` paths to `tsconfig.json`. Keep any theme-specific edits made to them here.
- [ ] **tsconfig:** `app/tsconfig.app.json`, `tsconfig.spec.json` and `.storybook/tsconfig.json` extend `../../tsconfig.json` / `../../../tsconfig.json`; fix the paths. Remove the `@spartan-native/*` source path aliases; imports come from `node_modules`.
- [ ] **Storybook:** `.storybook/manager.tsx` imports `../../../packages/theme/storybook/manager`; change to `import '@spartan-native/theme/storybook/manager';` (the theme package exports it). Check `main.ts` and `preview.ts` for other repo paths.
- [ ] **Visual test:** `e2e/pages.spec.ts` imports `openStory, SKINS` from `../../../packages/theme/e2e/storybook`. That helper isn't published: copy it into the Harbor repo (or publish it from theme as a testing entry point, and then update `packages/theme/AGENTS.md`). Move the 70 baseline screenshots in `e2e/__screenshots__/darwin` with it. New `playwright.config.ts` with only the `harbor` project (port 6112, `dist/storybook/harbor-backup`).
- [ ] **Wails shell:**
  - `go.mod`: replace the `require …/host-wails/native v0.0.0` + `replace => ../../packages/hosts/host-wails/native` pair with `require github.com/spartan-native/host-wails vX.Y.Z` (same version as the npm package), remove the `replace` and its comment, run `go mod tidy`.
  - `main.go`: import `spartannative "github.com/spartan-native/host-wails"`.
  - `scripts/build.mjs`: `root` is `resolve(app, '../..')` and it runs `ng build harbor-backup` there, then copies `dist/harbor-backup/browser`. Fix the paths for the new layout.
  - `frontend/dist/index.html` is tracked as a placeholder (it's modified locally in spartan-native right now; don't carry the local change over).
- [ ] **App code:** `app.config.ts` and `app.ts` keep `isWails`/`wailsHost` from `@spartan-native/host-wails`; no change beyond the dependency.
- [ ] **Scripts:** `start`, `build`, `storybook`, `build-storybook`, `test`, `test:visual`, `build:desktop:wails` (was `build:harbor-desktop`), `start:desktop:wails`.
- [ ] **CI:** install from GitHub Packages (`packages: read`, `NODE_AUTH_TOKEN`), `npm test`, `ng build`, and a Go job that builds `desktop/wails` on macOS. Leave the visual tests out of CI unless you want baselines per runner OS.
- [ ] **Docs:** `README.md` (what Harbor is, how to run it in the browser and as a Wails app, how to add another shell), `AGENTS.md` (with the "don't run the visual tests unless asked" rule), move `apps/harbor-backup/README.md` and `apps/harbor-desktop/README.md` content in. Consider moving `docs/08-sample-app.md` there too.
- [ ] Create `Spartan-Native/harbor` on GitHub, push, check CI.

## 4. Clean up spartan-native

### host-wails

- [ ] Delete `packages/hosts/host-wails/`.
- [ ] `angular.json`: remove the `host-wails` project.
- [ ] `package.json`: remove `ng build host-wails` from `build:libs`.
- [ ] `tsconfig.json`: remove the `@spartan-native/host-wails` path and the two `packages/hosts/host-wails/tsconfig.*.json` references.
- [ ] `tsconfig.lib.json`: remove the `@spartan-native/host-wails` path.
- [ ] `scripts/pack-libs.mjs` and `scripts/stamp-release.mjs`: remove `'host-wails'` from `libs`.
- [ ] `.github/workflows/release.yml`: remove `host-wails` from the publish loop.

### Harbor

- [ ] Delete `apps/harbor-backup/` and `apps/harbor-desktop/`.
- [ ] `angular.json`: remove the `harbor-backup` project.
- [ ] `package.json`: remove `start:harbor`, `storybook:harbor`, `build-storybook:harbor`, `build:harbor-desktop`, `start:harbor-desktop`; remove `ng build harbor-backup` from `build`; remove `ng run harbor-backup:build-storybook` from `test:visual`.
- [ ] `package.json` dependencies: remove what only Harbor used (check each before removing: `@wailsio/runtime`, `@angular/service-worker`, `@tanstack/*charts`, `luxon`, `embla-carousel*`, `ngx-scrollbar`; the theme and desktop-ui Storybooks may still need some).
- [ ] `tsconfig.json`: remove the two `apps/harbor-backup/tsconfig.*.json` references.
- [ ] `playwright.config.ts`: remove `HARBOR_PORT`, the `harbor` project and its web server.
- [ ] If the Storybook test helper (`packages/theme/e2e/storybook`) was published from theme instead of copied, update `packages/theme/AGENTS.md`.

### Lockfile

- [ ] Run `npm install` to update `package-lock.json`.

### Repo instructions and docs

- [ ] `AGENTS.md`: "builds three Storybooks (theme, desktop-ui, harbor-backup)" → two.
- [ ] `README.md`: hero image caption (line ~5) can stay; update the status line (~11), the package tree (~119 host-wails, ~126–127 apps), the layer list (~138), and the scripts tables (~150–151, ~178). Point to the host-wails and harbor repositories.
- [ ] `packages/hosts/README.md`: the host-wails row ("`native/` Go module") → link to the repository and the Go module path.
- [ ] `docs/02-architecture.md` (~69, ~99, ~124, ~128): package tree and adapter table.
- [ ] `docs/07-host-adapters.md` (~89): the "Implemented" note.
- [ ] `docs/08-sample-app.md`: says the app is in `apps/harbor-backup` and how to run the visual test; point to the harbor repository (or move the doc there and leave a link). Update `docs/README.md` and `docs/01-overview.md` (~49) accordingly.
- [ ] `docs/09-roadmap.md` (~42): "Harbor Backup complete on web + Wails" still fine; check.
- [ ] `docs/reference/screenshot-tools/capture.mjs`: captures the Harbor stage for the README hero image. Decide whether it moves to the harbor repository.
- [ ] `docs/reference/design-source/*.dc.html`: design sources; leave them.
- [ ] `packages/theme/README.md` (~138): "helm, desktop-ui and the Harbor app use it too": still true, just no longer in this repo.
- [ ] `packages/hosts/host-conformance/src/lib/describe.ts` (doc comment, ~24): the example path `host-wails/src/lib/wails-host.spec.ts` → the host-wails repository's `npm/projects/host-wails/src/lib/wails-host.spec.ts`, by name not path.
- [ ] `packages/hosts/host-electron|host-tauri|host-dotnet/AGENTS.md`: "follow `@spartan-native/host-wails` as the reference adapter" still works by package name; optionally say it lives in its own repository.
- [ ] Theme and desktop-ui stories that just use "Harbor" as example copy (`catalog-*.ts`, `*.stories.ts`, `*.mdx`): no change needed.

### Agent skill (`tools/claude-plugin`)

- [ ] `skills/spartan-native/references/host-wails.md`: rewrite the Go setup (`go get github.com/spartan-native/host-wails@vX.Y.Z`, `GOPRIVATE`, git auth; copy from the host-wails package's `AGENTS.md`). Remove the "isn't on the Go module proxy" and `replace … node_modules` text. Add the same-version rule.
- [ ] `skills/spartan-native/templates/wails/main.go`: import `spartannative "github.com/spartan-native/host-wails"`.
- [ ] `skills/spartan-native/templates/setup/app.config.ts`: npm import unchanged; check.
- [ ] `skills/spartan-native/SKILL.md`: check the host list and the `node_modules/@spartan-native/host-wails/AGENTS.md` pointer (still valid).
- [ ] If the skill points to Harbor as an example app, point to the harbor repository.
- [ ] `tools/claude-plugin/README.md`: check the file tree.

## 5. Check

- [ ] `grep -rn "host-wails/native\|packages/hosts/host-wails\|apps/harbor" --exclude-dir=node_modules --exclude-dir=dist .` finds nothing (except this file).
- [ ] `npm run build:libs`, `npm run build` and `npm test` pass in spartan-native.
- [ ] In the harbor repository: `npm test`, the app build, and the Wails build pass; the Wails app reads the OS accent and dark mode on macOS.
- [ ] The visual tests changed (Harbor's screenshots left this repo). Run `npm run test:visual` yourself in both repositories when convenient.
