# AGENTS.md

Instructions for AI coding agents working in this repository.

## Do not run the visual tests unless asked

**Never run `npm run test:visual`** (or `playwright test` / `npx playwright test` directly) unless the user explicitly asks for it.

It builds two Storybooks (theme, desktop-ui) and then takes Playwright screenshots for every skin × scheme. It is very heavy and takes a long time. Don't run it to "verify" a change, and don't run it as part of a general test pass.

To check a change, use the lighter commands instead:

| Command              | Use it for                               |
| -------------------- | ---------------------------------------- |
| `npm test`           | Unit tests                               |
| `npm run build:libs` | Checking that the packages still compile |
| `ng build <project>` | Building a single package or app         |

If a change probably affects the screenshots (skin CSS, tokens, component styles), say so in your summary and suggest that the user run `npm run test:visual`. Don't run it yourself.

## Package AGENTS.md files

Each published package has its own `AGENTS.md`, written for agents that build apps **with** the package. It covers what the package exports, how to set it up, and the rules for using it. It ships inside the built package, through the `assets` entry in each `ng-package.json`, so it ends up in `node_modules/@spartan-native/<package>/AGENTS.md`.

| Package | File |
| --- | --- |
| `@spartan-native/theme` | `packages/theme/AGENTS.md` |
| `@spartan-native/helm` | `packages/helm/AGENTS.md` |
| `@spartan-native/desktop-ui` | `packages/desktop-ui/AGENTS.md` |
| `@spartan-native/host-web`, `-conformance` | `packages/hosts/<host>/AGENTS.md` |
| `@spartan-native/host-electron` | `packages/hosts/host-electron/AGENTS.md` (scaffold, not published: "don't use yet") |

`@spartan-native/host-wails`, `-tauri` and `-dotnet` live in their own repositories (`Spartan-Native/host-wails`, `Spartan-Native/host-tauri`, `Spartan-Native/host-dotnet`), each with its own `AGENTS.md`.

The packages that are published to npm are listed in `scripts/libraries.mjs`. Before you add a package to that list, give it `license`, `repository`, `homepage`, `bugs` and `publishConfig.access: "public"` in its `package.json` and a `LICENSE` file in its folder. Then run `npm run build:libs && npm run check:packages`.

**Keep them in sync.** When you add, rename or remove a public export, input, slot, token or host service, update that package's `AGENTS.md` in the same change. These files must only refer to other packages by name (`@spartan-native/theme`), never by repo path, because the repo isn't there once the package is installed.

## The agent skill (`tools/claude-plugin`)

`tools/claude-plugin/skills/spartan-native` is a skill (and Claude Code plugin, listed in `.claude-plugin/marketplace.json`) for agents building apps **with** the packages. It links the package `AGENTS.md` files together and ships ready templates. When a change affects app setup, the host list, which component to use for a need, or anything a template uses, update `SKILL.md`, `references/` or `templates/` in the same change.
