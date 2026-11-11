# spartan-native agent skill and Claude Code plugin

**Layer 05 · dev tooling.** A skill that teaches coding agents to build native-looking Angular apps with the `@spartan-native/*` packages: set up the theme and the right host for the runtime (Wails, browser/PWA), pick desktop-ui and spartan/ui components instead of hand-styling, and write screens as separate `.ts` / `.html` / `.css` files with layout-only CSS.

This folder isn't an npm package and isn't part of the Angular workspace build.

```
tools/claude-plugin/
├── .claude-plugin/plugin.json          Claude Code plugin manifest
└── skills/spartan-native/
    ├── SKILL.md                        entry point: workflow, rules, checklist
    ├── references/
    │   ├── setup.md                    shared Angular + Tailwind + spartan + theme setup
    │   ├── host-wails.md               Go + Wails v3
    │   ├── host-web.md                 browser and PWA
    │   ├── other-runtimes.md           Electron, Tauri, .NET (scaffolds: use webHost)
    │   ├── components.md               "I need X" → which component
    │   └── styling.md                  layout-only CSS rules and tokens
    └── templates/
        ├── setup/                      app.config.ts, styles.css, theme.scss
        ├── wails/main.go               Wails window + Spartan Native service
        ├── shell/                      main window: title bar, sidebar, content, status bar
        ├── pages/list-page/            command bar + selectable table + empty state
        ├── pages/settings-page/        settings groups and rows
        └── dialogs/new-item-sheet/     modal form with OS-ordered buttons
```

The skill points agents at the `AGENTS.md` that ships in every installed package (`node_modules/@spartan-native/<package>/AGENTS.md`) for the full API, and only adds how the pieces fit together.

## Install

### Claude Code (plugin)

From this repository's marketplace (`.claude-plugin/marketplace.json` at the repo root):

```
/plugin marketplace add <owner>/spartan-native      # or a local path to the repo
/plugin install spartan-native@spartan-native
```

### Claude Code (skill only)

Copy the skill folder into the project or your user skills:

```bash
cp -R tools/claude-plugin/skills/spartan-native  <your-app>/.claude/skills/   # this project
cp -R tools/claude-plugin/skills/spartan-native  ~/.claude/skills/            # every project
```

### Other agents

`skills/spartan-native` is a standard Agent Skill (a `SKILL.md` with `name` / `description` front matter plus files it links to). Copy it wherever your agent loads skills from (for example `.agents/skills/`, `~/.codex/skills/`), or point the agent's instructions file (`AGENTS.md`, `.cursor/rules`, `.github/copilot-instructions.md`) at `SKILL.md`:

```md
For UI work, follow skills/spartan-native/SKILL.md and the AGENTS.md files in node_modules/@spartan-native/*.
```

## Keeping it in sync

When a package's public API changes, its own `AGENTS.md` changes first (see the root `AGENTS.md`). Update this skill when the change affects setup, the host list, the component picker in `references/components.md`, or a template.
