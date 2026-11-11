# TODO: split host-wails and Harbor out of spartan-native

Two things leave this repository:

1. **`@spartan-native/host-wails`** (TypeScript adapter + Go service). Already split into its own repository: `Spartan-Native/host-wails`, local clone `../host-wails`, first commit `433058f`.
2. **The Harbor sample app**, both `apps/harbor-backup` (Angular app, Storybook, visual test) and `apps/harbor-desktop` (Wails shell). It goes to a new repository, `Spartan-Native/harbor`, where it can later get more desktop shells (Tauri, Electron, .NET) next to Wails.

After both, spartan-native contains only the published packages (theme, helm, desktop-ui, host-web, host-conformance, the scaffold hosts), the playground, docs and the agent skill.

Delete this file when everything is done.

**Status (2026-11-11):** all local work is done and committed locally (host-wails `cd5478f`, harbor `e05301e`, spartan-native on this branch). What's left is pushing, releasing and the GitHub settings (unticked boxes below), plus two follow-ups that need the releases:

- **Harbor `package-lock.json`:** run `npm install` in `../harbor` once the `@spartan-native/*` packages (including host-wails) are on GitHub Packages at `^0.1.0`, and commit the lockfile (CI uses `npm ci`).
- **Harbor `go.sum`:** `desktop/wails/go.mod` requires `github.com/spartan-native/host-wails v0.1.0`; after that tag exists, run `go mod tidy` in `desktop/wails` and commit `go.sum`.
- **Harbor CI secret:** the Wails job needs `HOST_WAILS_TOKEN` (fine-grained token, Contents: read on `Spartan-Native/host-wails`), because the workflow's `GITHUB_TOKEN` can't read another private repository.

Verified locally with tarballs of the freshly built packages: host-wails npm tests (19) and build; Harbor unit tests, app build, Storybook build and `build:desktop:wails` (against the local host-wails checkout through a temporary `go.work`).

---

## 0. Background: what changed in host-wails

- **Go module path:** `github.com/spartan-native/host-wails/native` → `github.com/spartan-native/host-wails` (public package at the repository root, still `package spartannative`).
- **Go install:** `go get github.com/spartan-native/host-wails@vX.Y.Z` with `GOPRIVATE=github.com/spartan-native/*` and git auth. The npm package no longer ships `native/`, and the `replace … node_modules` setup is gone.
- **Bound method names:** `DEFAULT_SERVICE` is `github.com/spartan-native/host-wails.Service`, because Wails names methods after the Go package path. The old copy in this repo and the new repo are **not compatible**: never pair old Go code with the new npm package, or the reverse.
- **Versions:** npm package and Go module are released together from one `vX.Y.Z[-beta[.N]]` tag and must be used at the same version.
- **Theme dependency:** peer range `@spartan-native/theme` `^0.1.0`.
- **Layout (as restructured after the first commit):** npm workspace in `npm/`, package in `npm/projects/host-wails/`, build output `npm/dist/host-wails`, OS readers in `internal/`.

## 1. host-wails repository (`../host-wails`)

- [x] Commit the restructuring that's still uncommitted there (`npm/projects/…`, `internal/…`, `Makefile`, `doc.go`, workflow changes). Check that `README.md` and `AGENTS.md` name the same internal folder as the code (`internal/appearance` vs `internal/osappearance`).
- [ ] Create the GitHub repository `Spartan-Native/host-wails` (the name must match the Go module path), add it as `origin`, push `main`.
- [ ] Once step 2 below is done: in `npm/`, run `npm install`, commit `npm/package-lock.json`, push. CI should go green.
- [ ] Tag the first release (e.g. `v0.1.0`) so Harbor can depend on it.

## 2. Publish what host-wails and Harbor need from this repo

- [ ] Release spartan-native at a version that satisfies `^0.1.0` (tag `v0.1.0`; note that `0.1.0-beta.1` does **not** satisfy `^0.1.0`, so a beta needs the ranges changed to e.g. `^0.1.0-beta.1`, in Harbor's `package.json` too). If you pick another version, change the ranges in `../host-wails/npm/package.json` and `../host-wails/npm/projects/host-wails/package.json`.
- [ ] In the GitHub settings of each `@spartan-native/*` package (theme, helm, desktop-ui, host-web, host-conformance), under **Manage Actions access**, give **read** access to the `host-wails` and `harbor` repositories.

## 3. Create the Harbor repository (`../harbor`)

### Move with history

- [x] `git subtree split --prefix=apps/harbor-backup -b harbor-backup-split` and `--prefix=apps/harbor-desktop -b harbor-desktop-split` in spartan-native, then merge both branches into a new repo under subfolders (e.g. `git read-tree`/`git merge -s ours --allow-unrelated-histories` into `app/` and `desktop/wails/`), or use `git filter-repo --path apps/harbor-backup --path apps/harbor-desktop` on a fresh clone. Delete the temporary branches here afterwards.

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

- [x] **Angular workspace:** new `angular.json` with the `harbor-backup` project (copy from spartan-native's `angular.json`, paths adjusted: build, serve, test, storybook, build-storybook, service worker config, budgets).
- [x] **Dependencies:** `package.json` with Angular 22, Storybook 10, Tailwind 4, `@spartan-ng/brain`, `@angular/service-worker`, `@ng-icons/*`, `@tanstack/*charts`, `embla-carousel*`, `luxon`, `ngx-scrollbar`, Playwright, and the `@spartan-native/*` packages it imports: `theme`, `helm`, `desktop-ui`, `host-web`, `host-wails` (all from GitHub Packages, `.npmrc` with `@spartan-native:registry=https://npm.pkg.github.com`).
- [x] **spartan helm components:** the app imports ~43 `@spartan-ng/helm/*` entry points that come from `libs/spartan-ui` here. Either copy that folder or regenerate them with `npx ng g @spartan-ng/cli:ui`, and add the `@spartan-ng/helm/*` paths to `tsconfig.json`. Keep any theme-specific edits made to them here.
- [x] **tsconfig:** `app/tsconfig.app.json`, `tsconfig.spec.json` and `.storybook/tsconfig.json` extend `../../tsconfig.json` / `../../../tsconfig.json`; fix the paths. Remove the `@spartan-native/*` source path aliases; imports come from `node_modules`.
- [x] **Storybook:** `.storybook/manager.tsx` imports `../../../packages/theme/storybook/manager`; change to `import '@spartan-native/theme/storybook/manager';` (the theme package exports it). Check `main.ts` and `preview.ts` for other repo paths.
- [x] **Visual test:** `e2e/pages.spec.ts` imports `openStory, SKINS` from `../../../packages/theme/e2e/storybook`. That helper isn't published: copy it into the Harbor repo (or publish it from theme as a testing entry point, and then update `packages/theme/AGENTS.md`). Move the 70 baseline screenshots in `e2e/__screenshots__/darwin` with it. New `playwright.config.ts` with only the `harbor` project (port 6112, `dist/storybook/harbor-backup`).
- [x] **Wails shell:**
  - `go.mod`: replace the `require …/host-wails/native v0.0.0` + `replace => ../../packages/hosts/host-wails/native` pair with `require github.com/spartan-native/host-wails vX.Y.Z` (same version as the npm package), remove the `replace` and its comment, run `go mod tidy`.
  - `main.go`: import `spartannative "github.com/spartan-native/host-wails"`.
  - `scripts/build.mjs`: `root` is `resolve(app, '../..')` and it runs `ng build harbor-backup` there, then copies `dist/harbor-backup/browser`. Fix the paths for the new layout.
  - `frontend/dist/index.html` is tracked as a placeholder (it's modified locally in spartan-native right now; don't carry the local change over).
- [x] **App code:** `app.config.ts` and `app.ts` keep `isWails`/`wailsHost` from `@spartan-native/host-wails`; no change beyond the dependency.
- [x] **Scripts:** `start`, `build`, `storybook`, `build-storybook`, `test`, `test:visual`, `build:desktop:wails` (was `build:harbor-desktop`), `start:desktop:wails`.
- [x] **CI:** install from GitHub Packages (`packages: read`, `NODE_AUTH_TOKEN`), `npm test`, `ng build`, and a Go job that builds `desktop/wails` on macOS. Leave the visual tests out of CI unless you want baselines per runner OS.
- [x] **Docs:** `README.md` (what Harbor is, how to run it in the browser and as a Wails app, how to add another shell), `AGENTS.md` (with the "don't run the visual tests unless asked" rule), move `apps/harbor-backup/README.md` and `apps/harbor-desktop/README.md` content in. Consider moving `docs/08-sample-app.md` there too.
- [ ] Create `Spartan-Native/harbor` on GitHub, push, check CI.

## 4. Clean up spartan-native

### host-wails

- [x] Delete `packages/hosts/host-wails/`.
- [x] `angular.json`: remove the `host-wails` project.
- [x] `package.json`: remove `ng build host-wails` from `build:libs`.
- [x] `tsconfig.json`: remove the `@spartan-native/host-wails` path and the two `packages/hosts/host-wails/tsconfig.*.json` references.
- [x] `tsconfig.lib.json`: remove the `@spartan-native/host-wails` path.
- [x] `scripts/pack-libs.mjs` and `scripts/stamp-release.mjs`: remove `'host-wails'` from `libs`.
- [x] `.github/workflows/release.yml`: remove `host-wails` from the publish loop.

### Harbor

- [x] Delete `apps/harbor-backup/` and `apps/harbor-desktop/`.
- [x] `angular.json`: remove the `harbor-backup` project.
- [x] `package.json`: remove `start:harbor`, `storybook:harbor`, `build-storybook:harbor`, `build:harbor-desktop`, `start:harbor-desktop`; remove `ng build harbor-backup` from `build`; remove `ng run harbor-backup:build-storybook` from `test:visual`.
- [x] `package.json` dependencies: remove what only Harbor used (check each before removing: `@wailsio/runtime`, `@angular/service-worker`, `@tanstack/*charts`, `luxon`, `embla-carousel*`, `ngx-scrollbar`; the theme and desktop-ui Storybooks may still need some).
- [x] `tsconfig.json`: remove the two `apps/harbor-backup/tsconfig.*.json` references.
- [x] `playwright.config.ts`: remove `HARBOR_PORT`, the `harbor` project and its web server.
- [x] If the Storybook test helper (`packages/theme/e2e/storybook`) was published from theme instead of copied, update `packages/theme/AGENTS.md`.

### Lockfile

- [x] Run `npm install` to update `package-lock.json`.

### Repo instructions and docs

- [x] `AGENTS.md`: "builds three Storybooks (theme, desktop-ui, harbor-backup)" → two.
- [x] `README.md`: hero image caption (line ~5) can stay; update the status line (~11), the package tree (~119 host-wails, ~126–127 apps), the layer list (~138), and the scripts tables (~150–151, ~178). Point to the host-wails and harbor repositories.
- [x] `packages/hosts/README.md`: the host-wails row ("`native/` Go module") → link to the repository and the Go module path.
- [x] `docs/02-architecture.md` (~69, ~99, ~124, ~128): package tree and adapter table.
- [x] `docs/07-host-adapters.md` (~89): the "Implemented" note.
- [x] `docs/08-sample-app.md`: says the app is in `apps/harbor-backup` and how to run the visual test; point to the harbor repository (or move the doc there and leave a link). Update `docs/README.md` and `docs/01-overview.md` (~49) accordingly.
- [x] `docs/09-roadmap.md` (~42): "Harbor Backup complete on web + Wails" still fine; check.
- [x] `docs/reference/screenshot-tools/capture.mjs`: captures the Harbor stage for the README hero image. Decide whether it moves to the harbor repository.
- [x] `docs/reference/design-source/*.dc.html`: design sources; leave them.
- [x] `packages/theme/README.md` (~138): "helm, desktop-ui and the Harbor app use it too": still true, just no longer in this repo.
- [x] `packages/hosts/host-conformance/src/lib/describe.ts` (doc comment, ~24): the example path `host-wails/src/lib/wails-host.spec.ts` → the host-wails repository's `npm/projects/host-wails/src/lib/wails-host.spec.ts`, by name not path.
- [x] `packages/hosts/host-electron|host-tauri|host-dotnet/AGENTS.md`: "follow `@spartan-native/host-wails` as the reference adapter" still works by package name; optionally say it lives in its own repository.
- [x] Theme and desktop-ui stories that just use "Harbor" as example copy (`catalog-*.ts`, `*.stories.ts`, `*.mdx`): no change needed.

### Agent skill (`tools/claude-plugin`)

- [x] `skills/spartan-native/references/host-wails.md`: rewrite the Go setup (`go get github.com/spartan-native/host-wails@vX.Y.Z`, `GOPRIVATE`, git auth; copy from the host-wails package's `AGENTS.md`). Remove the "isn't on the Go module proxy" and `replace … node_modules` text. Add the same-version rule.
- [x] `skills/spartan-native/templates/wails/main.go`: import `spartannative "github.com/spartan-native/host-wails"`.
- [x] `skills/spartan-native/templates/setup/app.config.ts`: npm import unchanged; check.
- [x] `skills/spartan-native/SKILL.md`: check the host list and the `node_modules/@spartan-native/host-wails/AGENTS.md` pointer (still valid).
- [x] If the skill points to Harbor as an example app, point to the harbor repository.
- [x] `tools/claude-plugin/README.md`: check the file tree.

## 5. Check

- [x] `grep -rn "host-wails/native\|packages/hosts/host-wails\|apps/harbor" --exclude-dir=node_modules --exclude-dir=dist .` finds nothing (except this file).
- [x] `npm run build:libs`, `npm run build` and `npm test` pass in spartan-native.
- [ ] In the harbor repository: `npm test`, the app build, and the Wails build pass; the Wails app reads the OS accent and dark mode on macOS.
- [ ] The visual tests changed (Harbor's screenshots left this repo). Run `npm run test:visual` yourself in both repositories when convenient.
