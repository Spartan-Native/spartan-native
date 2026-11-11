# TODO: finish splitting out the hosts and Harbor

host-wails now lives in `Spartan-Native/host-wails`, Harbor in `Spartan-Native/harbor`; both repositories are created and pushed. host-tauri and host-dotnet were split out after them, with their native sides implemented (ports of the host-wails Go service): local clones `../host-tauri` and `../host-dotnet`, committed but **not pushed, and their GitHub repositories don't exist yet**. This list is what's left **in spartan-native**; the other repositories have their own `TODO.md`. Delete this file (and `REPO_SPLIT.md`) when everything is done.

## 1. The `0.1.0` release (urgent)

- [ ] The `0.1.0` tag points at `e4cd896` (`main`), which is **before** the split. Its `release.yml` still publishes `host-wails`, so this release puts the **old** `@spartan-native/host-wails@0.1.0` on GitHub Packages: built from `packages/hosts/host-wails`, calling `github.com/spartan-native/host-wails/native.Service`. That one doesn't work with the Go module `github.com/spartan-native/host-wails`, and it blocks the host-wails repository from publishing its own `0.1.0` (GitHub Packages refuses an existing version).
  - If the run is still going: cancel it before the publish step reaches `host-wails`.
  - If it already published: delete the `@spartan-native/host-wails` package version `0.1.0` (package settings → Manage versions), or delete the whole package so the host-wails repository can recreate it linked to itself. Or skip `0.1.0` and release host-wails as `0.1.1` (then change `^0.1.0` → `^0.1.1` in Harbor's `package.json`).
- [ ] Check the other packages published: theme, helm, desktop-ui, host-web, host-conformance (and the scaffold hosts) at `0.1.0`.
- [ ] The same tag also publishes the old **scaffolds** `@spartan-native/host-tauri@0.1.0` and `@spartan-native/host-dotnet@0.1.0` (exports nothing but a marker), linked to this repository. Delete those package versions (or the packages) on GitHub Packages before the host-tauri and host-dotnet repositories publish their own `0.1.0`, or release those as `0.1.1`.

## 2. Land the split

- [ ] Push `repo-split-todo` and merge it into `main` (commit `654bd60` removes host-wails and Harbor, and a later commit removes host-tauri and host-dotnet; both update the docs, the release workflow and the agent skill).
- [ ] Future release tags come from `main` after that merge, so they no longer publish host-wails, host-tauri or host-dotnet.

## 3. Package access

- [ ] In the GitHub settings of each `@spartan-native/*` package (theme, helm, desktop-ui, host-web, host-conformance), under **Manage Actions access**, give **read** access to the `host-wails`, `host-tauri`, `host-dotnet` and `harbor` repositories. Without it, their CI can't `npm ci`.

## 4. host-tauri and host-dotnet

- [ ] Create `Spartan-Native/host-tauri` and `Spartan-Native/host-dotnet` on GitHub, add them as `origin` in `../host-tauri` and `../host-dotnet`, push `main`. Then follow each repository's `TODO.md` (lockfile, CI, first release, a check in a real window).
- [ ] Harbor: add `desktop/tauri/` and `desktop/dotnet/` shells (the agent skill's `templates/tauri` and `templates/dotnet` are a start), with `isTauri() ? tauriHost() : isPhotino() ? dotnetHost() : …` in `app.config.ts`. That is the end-to-end check neither host has had yet.

## 5. Visual tests

- [ ] Harbor's screenshots left this repository, so `npm run test:visual` now covers theme and desktop-ui only. Run it when convenient to confirm the baselines still match.
