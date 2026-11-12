# @spartan-native/desktop-ui

**Layer 03 · optional.** The pieces stock spartan doesn't have: **window chrome** and the **patterns each OS is known for**. Each component changes its _layout_ per OS, not just its colors, and follows the skin live.

> Status: **implemented for all seven skins** (Windows 11 and 10, macOS 26 and 13–15, GNOME, KDE Plasma, ChromeOS): title bar, window controls, status bar, the six OS patterns (command bar, coach mark, modal sheet, inspector, settings list, status page), an assistant and a setup checklist, sidebar navigation, a skinned tooltip, the desktop controls spartan lacks (split button, number box, tree view), shortcut formatting and `*snPlatformIf`, and the menubar adapter with context menus (native through the host, in the page otherwise). Every component also follows Windows contrast themes (`forced-colors`). Spec: [`06-os-patterns.md`](https://github.com/Spartan-Native/spartan-native/blob/main/docs/06-os-patterns.md).

## Components

| Component | Windows 11 / 10 | macOS 26 / 13–15 | GNOME | KDE Plasma | ChromeOS |
| --- | --- | --- | --- | --- | --- |
| `<sn-title-bar>` | icon + title left, caption buttons right | traffic lights left, title centered | header bar, bold centered title | Breeze title bar | caption bar, round buttons |
| `<sn-window-controls>` | – □ × (close turns red) | ● ● ● (grey when inactive) | round × (all three with `linuxAll`) | Breeze glyph buttons | M3 round caption buttons |
| `<sn-status-bar>` + `[snStatusItem]` | Explorer status bar (10: ruled items) | Finder status bar, centered | GtkActionBar | Dolphin status bar | slim M3 footer |
| `<sn-command-bar>` | **CommandBar** | unified NSToolbar | AdwHeaderBar | KToolBar | top app bar |
| `<sn-coach-mark>` + `[snCoachMarkFor]` | **TeachingTip** | NSPopover | GtkPopover | Kirigami popup | rich tooltip |
| `<sn-modal-sheet>` | ContentDialog | **sheet** from the title bar | AdwDialog, buttons in the header bar | window-modal dialog | M3 dialog |
| `<sn-assistant>` | wizard: Step n of m, Back · Next · Cancel | Setup Assistant page, Go Back · Continue | pages with a header bar and dots | **QWizard** with the step list | M3 flow with dots |
| `<sn-checklist>` | numbered setup tasks that tick off, the same on every skin (accent tick) |  |  |  |  |
| `[snTooltip]` | Fluent ToolTip card | help tag | inverse bubble | framed tooltip | M3 plain tooltip |
| `<sn-inspector-layout>` + `<sn-inspector>` | SplitView pane | **Inspector** | AdwOverlaySplitView | Dolphin information panel | side sheet |
| `<sn-sidebar-nav>` | accent pill (10: 4px bar) | accent fill, grey when inactive | neutral rounded selection | accent-filled selection | tonal pill |
| `<sn-settings-group>` + `<sn-settings-row>` | SettingsCards (10: plain rows) | grouped Form section | **AdwPreferencesGroup** | Kirigami FormLayout | settings list in a tonal card |
| `<sn-status-page>` | Fluent empty state | ContentUnavailableView | **AdwStatusPage** | PlaceholderMessage | M3 empty state |
| `<sn-menubar>` | in-window menu bar | **global menu bar** with a native host; in-window otherwise | in-window menu bar | in-window menu bar | in-window menu bar |
| `[snContextMenu]` | OS context menu with a native host; otherwise the skin's menu at the pointer |  |  |  |  |
| `<sn-split-button>` | Fluent SplitButton | NSComboButton (split) | AdwSplitButton | QToolButton MenuButtonPopup | M3 split button |
| `<sn-number-box>` | NumberBox, inline ∧ ∨ | field + NSStepper | GtkSpinButton − + | QSpinBox, stacked arrows | M3 field with − + |
| `<sn-tree>` + `<sn-tree-item>` | TreeView, chevrons, accent pill | NSOutlineView, triangles | GtkTreeExpander list | Breeze QTreeView | Files app tree |
| `<kbd snShortcut="mod+shift+s">` | Ctrl+Shift+S | ⇧⌘S | Ctrl+Shift+S | Ctrl+Shift+S | Ctrl+Shift+S |
| `*snPlatformIf="'macos'; else other"` | renders per skin (`'mac'`) or family (`'macos'`, `'windows'`, `'linux'`) |  |  |  |  |

**Bold** marks the OS a pattern comes from. Each component has a docs page in Storybook (_Desktop UI_ → the component → _Docs_) with the per-OS table, live examples, usage, the full API and accessibility notes.

```html
<sn-title-bar title="Harbor Backup" subtitle="Office NAS" (close)="host.close()" (minimize)="host.minimize()">
  <img snTitleBarIcon src="icon.svg" alt="" />
  <button snTitleBarEnd hlmBtn variant="ghost" size="icon-sm" aria-label="Search">…</button>
</sn-title-bar>

<sn-settings-group title="Backups" description="Choose when and how backups run.">
  <sn-settings-row title="Automatic backups" subtitle="Run in the background">
    <ng-icon snSettingsIcon name="lucideClock" />
    <hlm-switch [checked]="true" aria-label="Automatic backups" />
  </sn-settings-row>
</sn-settings-group>

<sn-status-page
  icon="lucideArchive"
  title="No backups yet"
  description="Add a destination to start protecting your files."
>
  <button hlmBtn>Add destination</button>
</sn-status-page>
```

**Window integration:** the title bar is a drag region for Electron/Chromium (`app-region`), Wails (`--wails-draggable`) and Tauri (`data-tauri-drag-region`). Its buttons are excluded. `windowControls="native"` leaves room for buttons the OS draws itself (Electron `titleBarOverlay`, Window Controls Overlay). The buttons only emit `minimize` / `maximize` / `close`; a host adapter will wire them to the real window later.

**Inactive window:** the chrome carries `sn-chrome`, so the theme dims it, and the macOS lights turn grey.

**Borrowed skin styles:** the split button's parts carry the theme's button hook and the number box's field carries its text-field hook, so they are drawn by the skin's own button and field styles (every state included). Their sheets only lay the parts out.

**Contrast themes:** under `forced-colors: active`, selections and hovers use `Highlight` / `HighlightText`, and surfaces that were only outlined by a shadow (sheet, coach mark, settings cards, macOS lights) get a `CanvasText` edge.

## How it follows the OS

Every component reads `injectSkin()` from `@spartan-native/theme`: the theme service when `provideSpartanNative()` is present, otherwise the `data-sn-skin` attribute on `<html>`. Styles are component-scoped SCSS reading the theme's tokens, one block per family or skin (`:host([data-family='macos'])`, `:host([data-skin='qt'])`). Every host carries `data-slot`, `data-family` and `data-skin`. Sizes are in rem, so everything grows with the OS text size.

## Structure

| Path | Purpose |
| --- | --- |
| `src/lib/window/` | `SnTitleBar`, `SnWindowControls`, `SnStatusBar` |
| `src/lib/patterns/` | `SnCommandBar`, `SnCommandGroup`, `SnCoachMark`, `SnModalSheet`, `SnAssistant`, `SnChecklist`, `SnInspector…`, `SnSidebarNav…`, `SnSettingsGroup`, `SnSettingsRow`, `SnStatusPage` |
| `src/lib/controls/` | `SnSplitButton`, `SnNumberBox`, `SnTree…`: desktop controls spartan doesn't have |
| `src/lib/platform/` | `formatShortcut()`, `SnShortcut`, `SnPlatformIf` |
| `src/lib/menubar/` | `SnMenubar`, `SnContextMenu`, `SnNativeMenus` and the menu model (`SnMenuItem`, `toHostMenu()`, `inPageMenu()`) |
| `src/stories/` | one stories file per component |
| `src/docs/` | one docs page (MDX) per component |

Imports: `SnWindowImports` (with the status bar), `SnControlsImports`, `SnMenuImports`, `SnSplitButtonImports`, `SnNumberBox`, `SnTreeImports`, `SnStatusBarImports`, `SnCommandBarImports`, `SnCoachMarkImports`, `SnModalSheet`, `SnAssistantImports`, `SnChecklistImports`, `SnTooltip`, `SnInspectorImports`, `SnSidebarNavImports`, `SnSettingsImports`, `SnStatusPage`, `SnPlatformImports`, or `SnDesktopUiImports` for everything.

## Dependencies

`@spartan-native/theme`, `@spartan-native/helm` (the tree view uses its selection model), `@ng-icons/core`, `@angular/cdk` (overlay, dialog, menu, a11y and bidi for the coach mark, modal sheet, command bar, split button and tree) and `@angular/forms` (the number box is a `ControlValueAccessor`), Angular `^22.2.0`. The stories also use stock spartan/ui (`@spartan-ng/helm/*`); the library itself doesn't.

**Menus:** `<sn-menubar>` and `[snContextMenu]` take one `SnMenuItem[]` definition. With a host that has native menus (`wailsHost()`), the macOS menu bar is the system's global one and context menus are the OS's; chosen items come back by id and run their `action`. Without one, both are drawn in the page with the theme's menubar and dropdown-menu hooks, and the menubar binds the accelerators.

## Next

Window effects and Snap Layouts through the host. See the [roadmap](https://github.com/Spartan-Native/spartan-native/blob/main/docs/09-roadmap.md).

## Commands

```bash
npm run storybook:desktop-ui   # http://localhost:6008
npx ng test desktop-ui
npx ng build desktop-ui
npm run test:visual -- --project=desktop-ui   # 511 screenshots: every story on all seven skins (+ dark)
```
