# AGENTS.md: @spartan-native/desktop-ui

Instructions for AI coding agents building an Angular app with `@spartan-native/desktop-ui`.

## What this package is

Layer 03 of Spartan Native (optional). These are the pieces stock spartan/ui doesn't have: **window chrome**, the **patterns each OS is known for**, **menus**, and the **desktop controls** spartan lacks. Each component changes its _layout_ per OS, not just its colors, and follows the skin live.

It requires `@spartan-native/theme` (with `provideSpartanNative()`) and `@spartan-native/helm`. Its styles are component-scoped, so there is no extra stylesheet to load. Icon inputs (`icon="lucideClock"`) take an `@ng-icons` name you've registered with `provideIcons()`.

**Before building something yourself, check this list.** If an OS pattern below fits, use it instead of composing spartan cards and buttons by hand.

## Components (`import … from '@spartan-native/desktop-ui'`)

Import groups: `SnDesktopUiImports` (everything), `SnWindowImports`, `SnControlsImports`, `SnMenuImports`, `SnSettingsImports`, `SnPlatformImports`, `SnCommandBarImports`, `SnCoachMarkImports`, `SnInspectorImports`, `SnSidebarNavImports`, `SnSplitButtonImports`, `SnTreeImports`, `SnStatusBarImports`, `SnAssistantImports`, `SnChecklistImports`, or the single classes `SnModalSheet`, `SnStatusPage`, `SnNumberBox` and `SnTooltip`.

### Window chrome

| Element | Inputs / outputs | Slots |
| --- | --- | --- |
| `<sn-title-bar>` | `title`, `subtitle`, `windowControls: 'custom' \| 'native'`, `buttons`, `maximized`; `(minimize)` `(maximize)` `(close)` | `[snTitleBarIcon]`, `[snTitleBarStart]`, `[snTitleBarEnd]` |
| `<sn-window-controls>` | `buttons`, `maximized`, `linuxAll`, `nativeActions` (default `true`: calls the host's window); same outputs | none |
| `<sn-status-bar>` + `[snStatusItem]` | `ariaLabel`; item: `live` (announces changes) | `[snStatusBarEnd]` |

- The title bar is already a drag region for Electron, Wails and Tauri. Don't add your own `app-region` or `--wails-draggable`.
- With a host that owns the window (`wailsHost()`), the window buttons minimize, maximize and close the real window by themselves.
- Use `windowControls="native"` when the OS draws the buttons itself (Electron `titleBarOverlay`, PWA Window Controls Overlay, a macOS hidden-inset or overlay title bar). The bar leaves room for them where the **real** OS draws them, so a Mac dressed as another skin keeps the space for its traffic lights.

### OS patterns

| Element | Use it for | Key API |
| --- | --- | --- |
| `<sn-command-bar>` + `button[snCommand]` + `<sn-command-group>` | A toolbar of commands (Windows CommandBar, macOS toolbar, GNOME header bar) | bar: `title` (a heading; `headingLevel`, default 1), `titlePosition: 'auto' \| 'start' \| 'center'`, `commands` (a `TemplateRef` of commands declared elsewhere, e.g. by the page), `overflowItems: SnMenuItem[]`, `collapse: 'auto' \| 'none'`, `ariaLabel`, `overflowLabel`; command: `label` (required), `icon`, `disabled`, `hideLabel`, `variant: 'default' \| 'accent'`, `priority` (lower collapses first), `secondary` (always in the overflow menu); group: `label`; slots `[snCommandBarStart]`, `[snCommandBarEnd]`, and `ng-template[snCommandOverflow]` (your own overflow menu, used only while nothing has collapsed) |
| `<sn-sidebar-nav>` > `<sn-sidebar-section>` > `a[snSidebarItem]` | App navigation | section: `title`; item: `active`, `icon`, `badge` |
| `<sn-settings-group>` + `<sn-settings-row>` | Settings and preferences screens | group: `title`, `description`; row: `title` (required), `subtitle`; slot `[snSettingsIcon]`; the control goes in the row's content |
| `<sn-status-page>` | Empty, error and "nothing here" states | `icon`, `title` (required), `description`; content = actions |
| `<sn-modal-sheet>` | A modal form (macOS sheet, ContentDialog, AdwDialog, …) | `[(open)]`, `title` (required), `role`; buttons `[snSheetCancel]`, `[snSheetPrimary]`, and `[snSheetSecondary]` for a third button that doesn't close the sheet (Back, Don't Save); put `snSheetHost` on the window frame so the macOS sheet hangs from the title bar |
| `<sn-assistant>` + `ng-template[snAssistantPage]` | A step-by-step setup flow (Windows wizard, macOS Setup Assistant, GNOME pages with dots, KDE QWizard) | `[(step)]`, `cancelable`, `backLabel`, `nextLabel`, `finishLabel`, `cancelLabel`, `progressLabel`; `(finish)`, `(cancel)`; page: `title` (required), `canContinue`. Put it in an `sn-modal-sheet` without sheet buttons for a modal assistant |
| `<sn-checklist>` + `<sn-checklist-item>` | A get-started list of setup tasks that tick off | item: `title` (required), `done`, `keepAction`, `doneLabel`, `todoLabel`; content = description; slot `[snChecklistAction]` |
| `<sn-inspector-layout>` > `<sn-inspector>` > `<sn-inspector-section>` > `<sn-inspector-property>` | A details/properties side panel | inspector: `[(open)]`, `title` (required), `icon`; section: `title`; property: `label` (required) |
| `<sn-coach-mark>` + `[snCoachMarkFor]` | Teaching tips and onboarding callouts anchored to a control | `title` (required), `icon`, `placement`, `[(open)]`, `closeLabel`; slots `[snCoachMarkHero]`, `[snCoachMarkAction]` (secondary first, primary last); anchor: `[snCoachMarkFor]="tip"` |

### Controls spartan doesn't have

| Element | Key API |
| --- | --- |
| `<sn-split-button>` + `ng-template[snSplitButtonMenu]` | `label` (required), `icon`, `variant: 'standard' \| 'accent'`, `small`, `disabled`, `menuLabel`; `(triggered)` |
| `<sn-number-box>` | `[(value)]` or `formControl` / `ngModel` (it's a ControlValueAccessor), `min`, `max`, `step`, `largeStep`, `decimals`, `spinButtons`, `acceptsExpression` (`2*8+1`), `disabled`, `placeholder`, `ariaLabel` |
| `[snTooltip]` | `snTooltip` (the text), `snTooltipDisabled`. The skin's own tooltip on hover and keyboard focus; visual only, so give the element its own accessible name |
| `<sn-tree>` + `<sn-tree-item>` | tree: `[(selection)]`, `multiple`, `(activated)`; item: `value`, `label` (required), `icon`, `[(expanded)]`, `expandable`; nest items for children; slot `[snTreeItemEnd]` |

### Menus

One `SnMenuItem[]` definition feeds both the menu bar and context menus. With a host that has native menus, they're the OS's own (the macOS global menu bar, OS context menus). Otherwise they're drawn in the page with the skin's menu styles.

```ts
const menu: SnMenuItem[] = [
  { role: 'appMenu' }, // macOS only; dropped elsewhere
  {
    label: 'File',
    submenu: [
      { label: 'New backup…', accelerator: 'mod+n', action: () => this.create() },
      { type: 'separator' },
      { role: 'close' },
    ],
  },
  { role: 'editMenu' },
];
```

```html
<sn-menubar [menu]="menu" />
<!-- native: 'auto' | 'always' | 'never' -->
<li [snContextMenu]="fileMenu(file)">{{ file.name }}</li>
<!-- snContextMenuNative, snContextMenuDisabled -->
```

- `SnMenuItem` is the contract's `MenuItem` (`id`, `label`, `type` normal/checkbox/radio/separator, `accelerator`, `enabled`, `checked`, `role`, `submenu`) plus an `action` function.
- Write accelerators in the portable notation: `mod+shift+s`, `alt+f4`, `delete`, `f2`. `mod` is ⌘ on macOS and Ctrl elsewhere.
- The menu bar binds its accelerators. Context menus only _show_ them, so bind those shortcuts where the selection lives.
- For menus built in code, use the `SnNativeMenus` service. Helpers: `toHostMenu()`, `tidyMenu()`, `inPageMenu()`, `matchesAccelerator()`, `runEditCommand()`.

### Platform helpers

| API | Use |
| --- | --- |
| `<kbd snShortcut="mod+shift+s">` | Shows a shortcut the OS's way (`⇧⌘S` or `Ctrl+Shift+S`). Follows the **real** OS (the keyboard), not the skin |
| `formatShortcut(shortcut, family)` | The same, in code |
| `*snPlatformIf="'macos'; else other"` | Renders per skin (`'mac'`, `'qt'`, …), per family (`'windows'`, `'macos'`, `'linux'`, `'chromeos'`, `'web'`) or for a list of them; updates live |

## Rules

1. **Never write OS shortcuts or OS names by hand** ("Ctrl+S", "⌘S"). Use `snShortcut` or `formatShortcut()`.
2. **Don't branch on the user agent.** Use `*snPlatformIf` or `injectSkin()` for the look, and `injectPlatformFamily()` (from the theme) for behavior that follows the real OS: the keyboard, where the OS draws window buttons. The menu bar, context menus and `snShortcut` already do.
3. **Use these components for the window frame.** A typical shell is `<div class="sn-window" snSheetHost>`, then `<sn-title-bar>`, then `<sn-sidebar-nav class="sn-sidebar">` beside `<main class="sn-content">`, with `<sn-status-bar>` at the bottom.
4. **Mark dialog buttons**: `snSheetPrimary` / `snSheetCancel` / `snSheetSecondary` in `sn-modal-sheet`, and helm's `snDefaultAction` / `snCancelAction` in spartan dialogs.
5. Don't restyle these components per OS from app code. They read the theme's tokens, and every host element carries `data-family` and `data-skin` if you really need a hook.
6. They support Windows contrast themes (`forced-colors`) already. Don't add colors that break that, such as backgrounds without a border.
7. **Command bars:** give each command a `priority` when some matter more, mark rarely used ones `secondary`, and use `<sn-command-group>` instead of styling your own capsules or dividers. Commands a page owns go through the bar's `[commands]` template, so they keep the bar's icon-only mode, overflow and arrow-key navigation.
