# Public release plan

A work order for preparing `spartan-native` for a public GitHub release. It is written to be handed to an agent (or a person) phase by phase. Each task names the files, what is wrong, what to do, and how to know it is done.

Reviewed at commit `109ed73` (`main`), 2026-11-12. Delete this file when the work is finished.

## How to use this file

- Do the phases in order. Phase 0 is decisions only the owner can make; ask before starting anything that depends on them.
- One phase per branch and pull request. Phase 3 (formatting) must be its own commit with no other change in it.
- Read `AGENTS.md` first. In short: never run `npm run test:visual`; keep each package's `AGENTS.md` and the skill in `tools/claude-plugin` in sync with any public API change.
- The shell's default Node may be too old for the Angular CLI. Run `nvm use` (reads `.nvmrc`, Node 26) before any `npm` or `ng` command.
- After each phase, run `npm test -- --watch=false` and `npm run build:libs`. Both pass today (7 projects, 158 tests).
- Never edit `libs/spartan-ui/` by hand. It is stock spartan/ui output and must stay stock.
- Do not change behavior, public names or rendered CSS unless a task says so. Phases 2 to 5 are refactors: the tests and the visual baselines must come out the same. When a task touches SCSS, say so in the summary and ask the owner to run `npm run test:visual`.

## Progress

Branch `public-release-prep` (not committed yet).

**Decisions taken** (by the owner: D1, D2; recommended defaults applied: D3, D7, D8):

- D1: MIT. `LICENSE` in the root and in every package folder (ng-packagr copies a package's own `LICENSE` into `dist/`). Copyright holder: Roland Molnár. Third-party notice for `libs/spartan-ui` in `NOTICE`.
- D2: npmjs.org. All published packages have `publishConfig.access: "public"`; nothing points at GitHub Packages any more.
- D3: `host-electron` is built and tested but not published (`"private": true`, left out of `scripts/libraries.mjs`).
- D7: "not affiliated with or endorsed by" wording in the README and `NOTICE`.
- D8: security reports through GitHub private vulnerability reporting (`SECURITY.md`). **Still open:** a contact address for `CODE_OF_CONDUCT.md` (marked `[CONTACT — …]` in the file).
- Still open: D4, D5, D6.

**Done:**

- Phase 1: 1.1–1.10 all done. CI (`ci.yml`) runs tests, `build:libs` and `check:packages`; add `format:check` and `lint` after phase 3.
- Phase 6: 1, 2 and 4 done. `release.yml` publishes to npmjs.org (trusted publishing or `NPM_TOKEN`, provenance when the repository is public, skips versions already on npm) and creates the GitHub Release from `CHANGELOG.md`. `scripts/check-packages.mjs` checks metadata, tarball contents and README links. Fixed: `npm publish "dist/$lib"` was read by npm 11 as a GitHub `owner/repo` shorthand; it is now `./dist/$lib`. 3 (installing the tarballs into a scratch app) and 5 (peer warnings) are not done.
- Phase 5.2: the published-library list is now one file, `scripts/libraries.mjs`, read by the pack, stamp, check and release scripts.
- Phase 2: done.
  - 2.1–2.4: the docs index, roadmap and open questions are rewritten. Every doc says at the top whether it describes what is built or a design. Docs 01–08 were checked against the code (token names, `resolveSkin()`, the `NativeHost` shape, component selectors, the conformance checks). `docs/reference/` is labelled as an unmaintained archive (D4 is still open: the files are kept, not deleted).
  - 2.5–2.9: README, `AGENTS.md` and the package READMEs are updated; `TODO.md` is deleted (its open items are below); design-phase references are removed from source comments, which also produces no change in the generated palette.
  - The "Done when" grep still matches `src/styles.css` (the app's stylesheet); those are correct. The pattern should have been `src/styles/`.
- Version rule: the source `package.json` versions hold the last released version (root set to `0.1.0` to match); the release tag decides the published version.

**Before the first npm release (owner):** create the `spartan-native` organization on npmjs.com (the packages don't exist there yet; the scope itself could not be checked from the CLI), add an `NPM_TOKEN` secret for the first publish, then set up trusted publishing per package and delete the secret.

- Phase 3: done.
  - 3.1: Prettier at 120 columns, with compact markdown tables (`proseWrap: "never"`) and MDX skipped (Prettier only parses MDX 1). The formatting is commit `295783b` alone, listed in `.git-blame-ignore-revs`. Verified: tests, builds, an identical generated palette, and every stylesheet compiles to the same CSS apart from whitespace.
  - 3.2: ESLint 10 with `angular-eslint` 22 and `typescript-eslint` (`eslint.config.mjs`, `npm run lint`); CI runs `format:check` and `lint`. Real fixes: two dead assignments, a story template the linter couldn't parse, a test selector. Each remaining exception carries its reason, inline or in the config.
  - 3.3: Stylelint dropped. `stylelint-config-standard-scss` reports 737 findings, nearly all notation preferences, and two of its rules are wrong here (vendor prefixes Safari still needs, scrollbar pseudo-elements).

- Phase 4: done. Every step was checked against the state before it: unit tests, a byte-identical `derivePalette()` snapshot (8 skins × 2 schemes × reduced transparency × 40 accents, key order included), the generated palette file, and the compiled CSS of all 23 stylesheet entry points.
  - 4.1 `derive-palette.ts` and `color.ts` rewritten for reading; output byte-identical.
  - 4.2 the skin ids are explained on the `Skin` type, in one table in the theme README, and in the theme `AGENTS.md`.
  - 4.3 desktop-ui's per-skin decisions are `Record<Skin, …>` tables.
  - 4.4 `command-bar.ts` split: `command-bar.html`, `command-bar-fit.ts` (`fitCommandBar()`, with unit tests), named setup methods. The tree and number box were left as they are: nothing in them reads badly enough to split.
  - 4.5 `SELECTION_PAGE_SIZE` and `TYPEAHEAD_RESET_MS` exported from helm; one shared document-order helper. `nextId` counters left as planned.
  - 4.6 every `public-api.ts` lists its exports by name. Seven accidental exports removed after checking this and the four sibling repositories (see `CHANGELOG.md`).
  - 4.7 `base/_components.scss` split into `base/components/`; the compiled CSS is cascade-equivalent (same rules, same order, per layer). The banner comment style was left alone.
  - Visual tests: the CSS is equivalent and no component template changed except moving the command bar's into its own file, so the screenshots should not move. Run `npm run test:visual` to confirm.

**Owner tasks moved from `TODO.md`** (deleted in phase 2; the repository split it tracked is already on `main`):

- GitHub Packages still holds the old `0.1.0` packages published from this repository before the split, including the broken `@spartan-native/host-wails@0.1.0` and the scaffold `host-tauri`, `host-dotnet` and `host-electron`. Delete them (package settings → Manage versions) so nobody installs them by accident.
- The sibling repositories (`host-wails`, `host-tauri`, `host-dotnet`, `harbor`) still install from or publish to GitHub Packages. Move them to npmjs.org too, or `harbor` will keep needing a token. Each has its own `TODO.md`.
- `host-tauri` and `host-dotnet`: create the GitHub repositories, push the local clones, and follow each repository's `TODO.md`.
- Harbor: add Tauri and Photino.NET desktop shells (the skill's `templates/tauri` and `templates/dotnet` are a start). That is the end-to-end check neither host has had yet.
- Run `npm run test:visual` to confirm the theme and desktop-ui baselines still match after the split.
- The local branch `repo-split-todo` is merged and can be deleted.

**Next:** phase 5.

## What the review found

The library code is in better shape than the repository around it. Public APIs have useful doc comments, the tests are real, there are no `TODO`s, `any`s or `@ts-ignore`s in `packages/`, and the one generated source file is clearly marked. The work is mostly elsewhere:

1. **The repository does not say it is open source.** No `LICENSE`, no `license` or `repository` field in any `package.json`, no contributing, security or changelog file, and no CI on pull requests.
2. **The documentation still describes the design phase.** `docs/README.md` says "No package code exists yet". Several files link to private claude.ai pages and to migration notes that mean nothing to an outside reader.
3. **Leftovers from generators and scaffolds.** The playground is the untouched Angular CLI starter page, `host-electron` publishes a package that exports one marker constant, and exported design-canvas HTML is checked in.
4. **No enforced code style.** Prettier is configured but 191 files do not match it, and there is no linter.
5. **A handful of real readability problems in the code**, listed in phase 4. They are specific and small.

---

## Phase 0: decisions for the owner

Nothing below can be chosen by an agent. Each item lists a recommendation.

| # | Decision | Recommendation |
| --- | --- | --- |
| D1 | License | MIT, the same as spartan/ui and Angular. Open question Q10 in `docs/10-open-questions.md` is still unanswered on this. |
| D2 | Where packages are published | npmjs.org. `release.yml` publishes to GitHub Packages, which requires a token even to install public packages. That is a real barrier for a public library. Check that the `@spartan-native` scope is free on npm (also Q10). |
| D3 | `@spartan-native/host-electron` | Stop publishing it until it has an implementation. Keep the folder and README as a "planned" note, or remove it from the build, pack and release lists. Publishing an empty package looks abandoned. |
| D4 | `docs/reference/design-source/` and the claude.ai links | Remove the links (they are private and will 404 for everyone else). Either delete the exported `*.dc.html` files and `canvas.json`, or keep them under a clear "archived design export" heading. The screenshot scripts cannot run from a clone anyway, because they need a `support.js` that is not in the repository. |
| D5 | Short skin ids (`win`, `w10`, `mac`, `macc`, `gtk`, `qt`, `cros`, `web`) | Keep them. They are public API, CSS class names and stored in users' `localStorage`. Phase 4 documents them instead of renaming. Renaming is possible only now, before a public `1.0`, so decide deliberately. |
| D6 | `0.1.0` cleanup in `TODO.md` section 1 | Resolve before going public: the old `host-wails`, `host-tauri` and `host-dotnet` `0.1.0` packages on GitHub Packages. If D2 moves to npm, most of that section disappears. |
| D7 | Trademarks (Q11) | The README shows OS names and mockups of OS chrome. Keep the existing "trademarks of their respective owners" line and add "not affiliated with or endorsed by" wording. |
| D8 | Security contact | An address or GitHub private vulnerability reporting, for `SECURITY.md`. |

---

## Phase 1: files a public repository needs

All new files go in the repository root unless noted.

### 1.1 `LICENSE`

The full text of the license chosen in D1, with the year and the copyright holder the owner names.

### 1.2 `package.json` metadata

In the root and in every `packages/**/package.json` (theme, helm, desktop-ui, host-web, host-conformance, host-electron): add `license`, `repository` (with `directory` for each package), `homepage`, `bugs` and `author`. `scripts/stamp-release.mjs` already writes `repository` at release time; make the two agree, and keep `directory`.

Also fix in passing:

- The root `version` is `0.0.0` while the packages are `0.1.0`, and the comments in `scripts/stamp-release.mjs` ("the sources keep their 0.0.0 placeholder versions") and `scripts/pack-libs.mjs` (`spartan-native-theme-0.0.0.tgz`) are out of date. Pick one rule and make the comments true.
- Add `LICENSE` to the `assets` of each `ng-package.json` so it ships in every package, the same way `AGENTS.md` already does.

### 1.3 `CONTRIBUTING.md`

Content to cover, most of it movable from the "Workspace" half of the root `README.md`:

- Requirements and setup (`nvm use`, `npm install`).
- The command table, including "do not run `npm run test:visual` casually" and why.
- Build order and the source-versus-`dist` path mapping.
- Package boundaries: packages refer to each other by name only.
- How to add a component skin (link to the theme README section).
- How to add a stock spartan component, and that `libs/spartan-ui` is never edited.
- The rule that a public API change updates the package `AGENTS.md` and the skill.
- Commit and pull request expectations, and how releases are tagged.

### 1.4 `CODE_OF_CONDUCT.md`

Contributor Covenant 2.1 with the contact from D8.

### 1.5 `SECURITY.md`

Supported versions (latest only), how to report (D8), and what is in scope. Worth one sentence: the host adapters read OS settings and expose file dialogs, so reports about those are welcome.

### 1.6 `CHANGELOG.md`

Keep a Changelog format. Start with `0.1.0` and an "Unreleased" section. Note that every `@spartan-native/*` package shares one version.

### 1.7 `.github/`

- `workflows/ci.yml`: on pull requests and pushes to `main`, run `npm ci`, `npm test -- --watch=false`, `npm run build:libs` and (after phase 3) `npm run format:check` and `npm run lint`. Use `node-version-file: .nvmrc`. No visual tests in CI: the baselines are per operating system and not committed.
- `ISSUE_TEMPLATE/bug_report.yml` (fields: package, version, skin, host/runtime, OS, steps), `ISSUE_TEMPLATE/feature_request.yml`, `ISSUE_TEMPLATE/config.yml`.
- `PULL_REQUEST_TEMPLATE.md` with a short checklist: tests, `AGENTS.md` updated, skill updated, "affects screenshots: yes/no".
- `dependabot.yml` for npm and GitHub Actions.

### 1.8 `.gitattributes`

```
libs/spartan-ui/** linguist-generated=true
packages/theme/styles/contract/_palette-defaults.scss linguist-generated=true
docs/reference/** linguist-documentation=true
package-lock.json linguist-generated=true
```

This collapses generated files in pull request diffs and keeps roughly 600 stock spartan files out of the repository's language statistics.

### 1.9 Third-party notice

`libs/spartan-ui/` is code generated by the spartan CLI and committed here. Check spartan/ui's license and add the required attribution, either in `libs/spartan-ui/README.md` or a root `NOTICE` file.

### 1.10 `.gitignore`

Remove the `# Nx cache` entry (the workspace does not use Nx; there is no `nx.json`) or keep it only if the spartan CLI really creates `.nx/`. Check before deleting.

**Done when:** a stranger landing on the repository can see the license, how to install, how to contribute and how to report a problem, and CI runs on a pull request.

---

## Phase 2: make the documentation true

### 2.1 `docs/README.md` (rewrite)

It is titled "implementation handover" and says "Status: design only… No package code exists yet". Rewrite it as the index of the design documentation for an implemented project. Remove the two claude.ai links, the "Gap: … chat conversations could not be read" note and the "How to view the mockups" section (D4).

### 2.2 `docs/09-roadmap.md`

Line 3 says "The project is at phase 01". The phase sections mix original proposals with inline "(Done: …)" notes. Rewrite as a status table (done, in progress, open) followed by what is actually left: Electron host, window effects, Snap Layouts, `contrast: more` palette, `NotificationHost`, the playground. Also drop "Nx recommended".

### 2.3 `docs/10-open-questions.md`

Remove the sentence about checking the claude.ai project chats. Fix the stale path in Q1: `packages/theme/src/styles/contract/` is now `packages/theme/styles/contract/`. Move decided questions (Q1, Q5, Q12) to a "Decided" section so the open list is only open things. Record the answers to Q10 and Q11 from phase 0.

### 2.4 `docs/01` to `docs/08`

Read each one against the code and fix what describes a plan as the present or the reverse. Known cases: the docs speak of "28 components" in places while `libs/spartan-ui/README.md` lists 66 generated; `docs/08-sample-app.md` describes an app that now lives in another repository. State once, near the top of each file, whether it is specification (design intent) or a description of what is built.

### 2.5 Root `README.md`

- The status paragraph is one 200-word block and contradicts itself: it says the theme is implemented for "Windows 11, macOS 26 and GNOME", while `STYLED_SKINS` and `packages/desktop-ui/README.md` cover all seven. Replace it with a short table: package, state, where it lives.
- The Layout block says "skins for win/mac/gtk". Update it.
- Add near the top: badges (CI, license, npm version), an "Install" section and a 20-line "Quick start" (install, `provideSpartanNative({ host: webHost() })`, the one `@use` line for styles). A visitor currently reads 100 lines before seeing how to use it.
- Move the "Workspace" section to `CONTRIBUTING.md` (1.3) and leave a two-line pointer.
- The image footnote mentions `docs/reference/design-source/`; update it per D4.

### 2.6 `TODO.md`

It is a private migration checklist that names unpushed local clones (`../host-tauri`), a branch (`repo-split-todo`) and a file that no longer exists (`REPO_SPLIT.md`). Finish or move the open items to GitHub issues, then delete the file.

### 2.7 `AGENTS.md` (root)

The package table lists `host-wails`, `host-tauri` and `host-dotnet` as `packages/hosts/<host>/AGENTS.md`. Those folders moved to other repositories. Only `host-web`, `host-conformance` and `host-electron` are here. Fix the table and point to the other repositories by name.

### 2.8 Package READMEs

- Every package README links to `../../docs/…` for its spec and images. Those links work on GitHub but break on the npm page and in `node_modules`. Use absolute GitHub URLs for anything that ships in a package. (The package `AGENTS.md` files already follow this rule.)
- `libs/spartan-ui/README.md` points to `packages/theme/src/styles/_hooks.scss`; the file is `packages/theme/styles/_hooks.scss`.
- `packages/hosts/README.md` and each host README: confirm the status lines after D3.
- `apps/playground/README.md` says "Status: Angular CLI scaffold". See 5.1.

### 2.9 Source comments that point at the design phase

Comments should explain the code to someone who has only the package. Reword these so they stand on their own:

- `packages/theme/src/lib/palette/derive-palette.ts:3` "Ported from the design mockups (docs/reference/…)" and `:197` "Fix for docs/10-open-questions.md Q12".
- `packages/theme/src/lib/contract/native-host.ts:2` "(docs/07-host-adapters.md)".
- `packages/helm/src/lib/actions/dialog-actions.ts:78` "(docs/05, Q5)".
- `packages/desktop-ui/src/lib/patterns/coach-mark.ts:83` "(the mockup order)".
- `packages/hosts/host-electron/src/public-api.ts` "Spec: docs/README.md".
- Stories that say "A Harbor window" (for example `command-bar.stories.ts`): fine to keep the sample app's name, but do not assume the reader knows it.

**Done when:** `git grep -nE 'claude\.ai|No package code|phase 01|REPO_SPLIT|src/styles'` returns nothing outside `libs/`, and no shipped README has a relative link that leaves its package.

---

## Phase 3: one enforced code style

### 3.1 Format the repository once

`.prettierrc` sets `printWidth: 100`, but `npx prettier --check` reports 191 unformatted files under `packages/`, `apps/` and `scripts/`, with many lines over 120 characters (worst: the `desktop-ui` stories, `menus.spec.ts`, `conformance.ts`, `menu-model.ts`).

1. Add `.prettierignore`: `dist`, `libs/spartan-ui`, `docs/reference`, `package-lock.json`, `packages/theme/styles/contract/_palette-defaults.scss`, `**/__screenshots__`.
2. Decide the width first. Component templates and host bindings are long here; `printWidth: 120` will produce fewer awkward wraps than 100. Change `.prettierrc` if so.
3. Add scripts `format` (`prettier --write .`) and `format:check` (`prettier --check .`).
4. Run `npm run format` and commit the result alone, with a message that says it is formatting only. Add the commit hash to a new `.git-blame-ignore-revs`.

Watch for hand-aligned tables that Prettier will reflow badly. Known ones: the one-line arrays in `native-host.ts` (`CAPABILITIES`), `spartan-native-theme.ts` (`APPEARANCE_KEYS`), `web-host.ts` (`STOCK_ACCENT`) and the `material3()` color tables in `derive-palette.ts`. Either accept the reflow or restructure them (4.1 does this for `material3`). Use `// prettier-ignore` sparingly.

### 3.2 Add ESLint

There is no linter. Add `angular-eslint` with `typescript-eslint` (flat config, `eslint.config.js`), a `lint` script and a `lint` target per project. Ignore `libs/spartan-ui`, `dist` and `docs/reference`. Start from the recommended sets plus `@angular-eslint/prefer-on-push-component-change-detection` and the template accessibility rules. Fix what it reports instead of disabling rules; where a rule is genuinely wrong for this codebase, turn it off in the config with a one-line reason.

### 3.3 Stylelint (optional)

`stylelint` with `stylelint-config-standard-scss` for the 155 files under `packages/theme/styles`. Worth it only if it can be configured to accept the existing layer and hook conventions without a wall of overrides. Try it; drop it if not.

**Done when:** `npm run format:check` and `npm run lint` pass locally and in CI.

---

## Phase 4: readability of the library code

Ordered by value. None of these may change behavior or public names.

### 4.1 `packages/theme/src/lib/palette/derive-palette.ts`

This is the file a curious reader opens first, and the hardest to read.

- The imports are renamed to abbreviations: `adjustLightness as adjL`, `ensureContrast as ensure`, `readableOn as onText`. Use the real names.
- Single-letter and cryptic locals: `p`, `acc`, `t`, `c`, `T`, `n0`, `n1`, `s0`, `l0`, `sc`. Rename to `base`, `accent`, `palette`, `tone`, `background`, `surface` and so on.
- `material3()` builds an object with keys `pfg`, `pc`, `opc`, `scn`, `osc`, `onv`, `ov`, `inv`, `invP`, `err`, packed eight to a line. Use the Material 3 role names (`onPrimary`, `primaryContainer`, `onPrimaryContainer`, `secondaryContainer`, `onSurfaceVariant`, `outlineVariant`, `inverseSurface`, …), one per line, and type it.
- Unexplained numbers everywhere (`0.05`, `0.015`, `h + 35`, `0.68`, `4.5`). Name the ones with meaning (`WCAG_AA_TEXT = 4.5`) and add a short comment where a value copies a platform ("Fluent's bottom edge is 12 % darker").
- `Palette` has 37 keys and about a third have doc comments. Document the rest in one line each, or group them under comment headings (surfaces, text, accent, semantic, strokes, materials).
- `packages/theme/src/lib/palette/color.ts` has the same style in small: `A`, `B`, `mx`, `mn`, `d`. Light touch only; the math is standard.

Guard: `derive-palette.spec.ts` must pass unchanged, and `npm run theme:palette` must regenerate `_palette-defaults.scss` byte for byte.

### 4.2 Skin identifiers

Three vocabularies describe the same seven skins:

| Skin id | CSS class       | Folder in `packages/theme/styles/skins` |
| ------- | --------------- | --------------------------------------- |
| `win`   | `.t-win`        | `win11`                                 |
| `w10`   | `.t-win.t-w10`  | `win10`                                 |
| `mac`   | `.t-mac`        | `macos26`                               |
| `macc`  | `.t-mac.t-macc` | `macos-classic`                         |
| `gtk`   | `.t-gtk`        | `gtk`                                   |
| `qt`    | `.t-qt`         | `kde`                                   |
| `cros`  | `.t-cros`       | `chromeos`                              |

Per D5 the ids stay. Make them understandable instead:

- Give the `Skin` type in `native-host.ts` a doc comment with this table (id, platform, toolkit, class), so hovering the type in an editor explains `macc` and `qt`.
- Put the same table once in `packages/theme/README.md` and `packages/theme/AGENTS.md`, and have other documents link to it instead of repeating it.
- `skin-labels.ts` already maps ids to display names; make sure every user-facing string goes through it.

### 4.3 Skin-specific branching in `desktop-ui`

Components decide per-skin behavior with local arrays and inline comparisons, each in its own style:

- `command-bar.ts`: `const LABELLED: readonly Skin[] = ['win', 'w10', 'qt']`, plus `skin === 'gtk' || family() === 'web'` written twice, plus a nested ternary for `moreGlyph`.
- `tree.ts`: `const TRIANGLE = ['mac', 'macc', 'gtk', 'web']`.
- `number-box.ts`: `const PLUS_MINUS = ['gtk', 'cros', 'web']`.
- 13 more inline `skin() === '…'` checks across `packages/desktop-ui/src/lib`.

Do not build a framework for this. Do make it uniform: one small `Record<Skin, …>` per trait at the top of the file that uses it (for example `OVERFLOW_GLYPH: Record<Skin, 'dots' | 'menu' | 'vertical'>`), so adding an eighth skin is a compile error in every place that needs a decision, and the nested ternaries go away.

### 4.4 Split the largest components

- `packages/desktop-ui/src/lib/patterns/command-bar.ts` (493 lines): four classes, a 60-line inline template and the overflow-fitting algorithm in one file. Move the template to `command-bar.html`, and move `fit()` with its measuring helpers into a `command-bar-overflow.ts` that takes the elements as arguments, so the algorithm can be read and tested without the component. Split the constructor's five unrelated blocks into named private methods (`keepDocumentOrder()`, `refitOnResize()`, `refitOnFontLoad()`, …).
- `packages/desktop-ui/src/lib/controls/tree.ts` (438) and `number-box.ts` (382): same treatment where it helps. Do not split for the sake of line counts.
- `private readonly items = this.ordered;` in `command-bar.ts` is a second name for the same signal with a comment that describes something else. Remove the alias.

### 4.5 Small duplications

- Document-order sorting with `compareDocumentPosition` is written out in `tree.ts` (`domOrder`) and again inline in `command-bar.ts`.
- `TYPEAHEAD_RESET_MS = 600` and `PAGE = 10` are declared in both `helm/…/selectable.ts` and `desktop-ui/…/tree.ts`. Export them from `@spartan-native/helm` next to the selection functions that `tree.ts` already imports. (That is a new public export: update `packages/helm/AGENTS.md`.)
- `let nextId = 0` appears in eight files. Leave it. A shared id helper would be more code than it saves.

### 4.6 Public API surface

`packages/theme/src/public-api.ts` uses `export *` for every file, so helpers such as `hexToRgb`, `toHsl`, `readStoredOverrides` and `DEFAULT_PERSIST_KEY` are public by accident, and other packages already import some of them (`host-web` uses `normalizeHex`). Before `1.0`, list the exports by name in each `public-api.ts`, decide which helpers are meant to be public, and mark the rest `@internal` or stop exporting them. Check the four other packages and the three external host repositories for uses first. Update each package `AGENTS.md`.

### 4.7 Skin stylesheets

- Five skins have a `components/` folder with 24 or 25 partials; `win10` and `macos-classic` each have one `_components.scss` (270 and 174 lines) because they are overrides on top of `win11` and `macos26`. That is reasonable, but the folder names do not say so. State it in a comment at the top of each `_index.scss` (win10 already does) and in the theme README's "Adding a component skin" section.
- `win11/components` has a `_navigation.scss` partial that the other four skins lack. Either add it to them or note at its top why it is Windows-only.
- The heavy banner comments (`// ====…====`, `// --- Every variant -----…`) have ragged right edges after edits. Normalize to a plain `// Section name` style, or leave them; do not spend long here.
- `packages/theme/styles/base/_components.scss` is 444 lines of mixed components. Splitting it to mirror the per-skin partials would make "where is the base style for X" answerable by file name.

**Done when:** tests pass unchanged, `npm run build:libs` passes, the generated palette file is identical, and the owner has confirmed `npm run test:visual` for the SCSS changes.

---

## Phase 5: remove scaffolding and generator leftovers

### 5.1 `apps/playground`

`src/app/app.html` (353 lines) is the stock Angular CLI welcome page with its "Delete the template below to get started" banner. `app.ts` holds `title = signal('playground')`, `app.spec.ts` asserts "Hello, playground", and `app.routes.ts` is empty. The README calls it "the living spec".

Choose one:

- **Minimal real playground (recommended):** one page that shows a few stock components and two `desktop-ui` patterns with a skin, scheme and accent switcher, using `webHost()`. About 150 lines, and it doubles as the README's quick-start proof.
- **Remove it:** delete `apps/playground`, its `angular.json` project, the `start` and `build` scripts' use of it, and the README mentions. The three Storybooks already do the job.

### 5.2 `packages/hosts/host-electron`

Per D3. If it stays unpublished: remove it from `build:libs`, `scripts/pack-libs.mjs`, `scripts/stamp-release.mjs` and the publish loop in `release.yml`, and delete `scaffold.spec.ts` (it asserts that an import is defined). Note that the three library lists are maintained by hand in four places with "same list as…" comments; move the list to one JSON or `.mjs` file that all of them read.

### 5.3 Storybook configuration

`packages/{theme,helm,desktop-ui}/.storybook/main.ts` are byte-identical, and so are `preview.ts`, `manager.tsx`, `tailwind.css` and `tsconfig.json` for helm and desktop-ui. This duplication is deliberate (each package is meant to be able to leave for its own repository; see "Package boundaries" in the README). Keep it, and add one comment line at the top of each file saying so, or it will read as copy-paste.

### 5.4 Generated configuration comments

Ten `tsconfig.*.json` files start with the CLI's "To learn more about Typescript configuration file…" comment. Harmless; remove for tidiness when touching those files.

### 5.5 `docs/reference/`

Per D4. `component-skins.mockup.css` (926 lines) and `palette.reference.ts` (213 lines) are superseded by `packages/theme`. If any test compares against `palette.reference.ts`, keep that file and say so at its top; otherwise remove both, or move the whole folder under `docs/archive/` with a README stating that it is historical and unmaintained.

### 5.6 `tools/claude-plugin`

- The skill ships host references and templates for Wails, Tauri and .NET whose packages live in other repositories. Check each reference against the current state of those repositories before release, and say in `tools/claude-plugin/README.md` which package versions the skill was written for.
- The root README lists it as layer "05 `spartan-native-plugin`" while `plugin.json` and `marketplace.json` name it `spartan-native`. Use one name.
- `docs/09-roadmap.md` promises commands (`new-app`, `add-screen`, `audit`), a reviewer agent and a hook. None exist. Move them to the roadmap's open list (2.2).

### 5.7 Root tidy-up

- `components.json`: keep; add a line about it in `CONTRIBUTING.md`.
- `.vscode/`: tracked launch and task files are fine. Check they still name existing projects.
- `tsconfig.json` carries about 66 `@spartan-ng/helm/*` path aliases written by the spartan CLI. Leave as is; mention in `CONTRIBUTING.md` that the CLI maintains them.

---

## Phase 6: release mechanics

1. Rewrite `.github/workflows/release.yml` for the registry chosen in D2. For npm: `registry-url: https://registry.npmjs.org`, `npm publish --access public --provenance`, `id-token: write` permission, and `stamp-release.mjs` no longer forces the GitHub Packages registry. Remove the header comment "private repo = private packages".
2. Have the release job create a GitHub Release from the matching `CHANGELOG.md` section.
3. Add a dry-run job to `ci.yml`: `npm run pack:libs`, then install the tarballs into a scratch Angular app and build it. This catches a broken `exports` map or a missing asset before a tag does.
4. Check each built package with `npm pack --dry-run`: `README.md`, `AGENTS.md`, `LICENSE` and (theme) `styles/` and `storybook/manager.mjs` are present, and nothing else.
5. `@spartan-native/theme` lists `@storybook/angular` and `@storybook/addon-themes` as optional peers for its `/storybook` entry point. Confirm a consumer without Storybook gets no peer warnings.

---

## Before flipping the repository to public

- [ ] Phase 0 decisions recorded (in `docs/10-open-questions.md` where they answer a question).
- [ ] `LICENSE` present and every `package.json` has `license` and `repository`.
- [ ] `git grep -nE 'claude\.ai'` is empty outside `libs/`.
- [ ] `TODO.md` and this file are deleted.
- [ ] Search the full history, not only the working tree, for secrets and private names: `git log -p | grep -nE 'token|secret|password|api[_-]?key'`, or run `gitleaks detect`. The working tree is clean of personal paths and emails today; the history was not checked in this review.
- [ ] Check commit author emails in `git log --format='%an <%ae>' | sort -u` are ones the owner is happy to publish.
- [ ] CI is green on `main`.
- [ ] `npm run test:visual` run by the owner after phases 4 and 5.
- [ ] GitHub settings: description, topics, issue templates visible, private vulnerability reporting on, branch protection on `main`.
- [ ] The four sibling repositories (`host-wails`, `host-tauri`, `host-dotnet`, `harbor`) get the same phase 1 files, or the README links to them will lead to repositories without a license.

## Not checked in this review

- The visual tests were not run (repository rule).
- `libs/spartan-ui` was not reviewed; it is third-party generated code.
- `docs/01` to `docs/08` were sampled, not read line by line against the code. Task 2.4 is that read.
- Git history was not scanned for secrets.
- The sibling repositories were not opened.
