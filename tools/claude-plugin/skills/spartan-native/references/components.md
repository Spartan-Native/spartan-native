# What to use for what

Find the need, use the component. Inputs and slots are in each package's `AGENTS.md` (`node_modules/@spartan-native/<package>/AGENTS.md`). If nothing fits, compose stock spartan components; don't draw your own.

Import groups: desktop-ui `SnDesktopUiImports` (everything) or one group (`SnWindowImports`, `SnSidebarNavImports`, `SnCommandBarImports`, `SnSettingsImports`, `SnStatusBarImports`, `SnMenuImports`, `SnPlatformImports`, `SnTreeImports`, `SnInspectorImports`, `SnSplitButtonImports`, `SnCoachMarkImports`, `SnModalSheet`, `SnStatusPage`, `SnNumberBox`). helm: `SnSelectableImports`, `SnDialogActionsImports`. spartan: `Hlm<Name>Imports` from `@spartan-ng/helm/<name>`.

## Window and navigation

| Need | Use | Package |
| --- | --- | --- |
| Window frame / background | `<div class="sn-window" snSheetHost>` | theme + desktop-ui |
| Title bar with min/max/close | `<sn-title-bar title="…">` (`windowControls="native"` when the OS draws the buttons) | desktop-ui |
| Window buttons somewhere else (e.g. in the macOS sidebar) | `<sn-window-controls>` | desktop-ui |
| App navigation down the side | `<sn-sidebar-nav class="sn-sidebar">` > `<sn-sidebar-section>` > `a[snSidebarItem]` / `button[snSidebarItem]` | desktop-ui |
| Main content area | `<main class="sn-content">` | theme |
| Tabs inside a page | `hlm-tabs` | spartan |
| App menu bar (File, Edit, …) | `<sn-menubar [menu]="menu">` | desktop-ui |
| Status line at the bottom | `<sn-status-bar>` + `[snStatusItem]` | desktop-ui |

## Commands

| Need | Use | Package |
| --- | --- | --- |
| Toolbar over a view (New, Share, Delete) | `<sn-command-bar title="…">` + `button[snCommand]`; `<sn-command-group>` for capsules/dividers, `variant="accent"` for the main action, `priority` / `secondary` for what collapses into the overflow, `titlePosition="center"` for a centered title | desktop-ui |
| A page's own commands in the shell's bar | `<sn-command-bar [commands]="pageCommandsTemplate">` (not a separate toolbar) | desktop-ui |
| Standard button | `<button hlmBtn variant="outline">` | spartan |
| Suggested / primary action | `<button hlmBtn>` (default variant = accent) | spartan |
| Flat / toolbar-style button | `<button hlmBtn variant="ghost">` | spartan |
| Destructive action | `<button hlmBtn variant="destructive">` | spartan |
| Button with a menu of alternatives | `<sn-split-button>` + `ng-template[snSplitButtonMenu]` | desktop-ui |
| Right-click menu | `[snContextMenu]="items"` | desktop-ui |
| Dropdown menu from a button | `hlmDropdownMenu` + `[hlmDropdownMenuTrigger]` | spartan |
| Show a keyboard shortcut | `<kbd snShortcut="mod+shift+s">` | desktop-ui |

## Data

| Need | Use | Package |
| --- | --- | --- |
| Selectable list (files, messages) | `snSelectable` + `snSelectableItem [value]="id"` | helm |
| Selectable table | `<table hlmTable snSelectable="grid">` + `<tr hlmTr snSelectableItem>` | spartan + helm |
| Folder-like hierarchy | `<sn-tree>` + `<sn-tree-item>` | desktop-ui |
| Details / properties side panel | `<sn-inspector-layout>` > `<sn-inspector>` > `<sn-inspector-section>` > `<sn-inspector-property>` | desktop-ui |
| Card | `hlmCard` | spartan |
| Status tag | `<span hlmBadge class="sn-tone-success">` (`success`, `warning`, `danger`, `accent`) | spartan + theme |
| Empty / error state filling a view | `<sn-status-page icon title description>` | desktop-ui |
| Inline message next to content | `hlmAlert` (+ `sn-tone-*`) | spartan |
| Progress | `hlm-progress`, `hlm-spinner` | spartan |
| Toast | `hlm-toaster` + `toast()` from `@spartan-ng/brain/sonner` | spartan |

## Forms and settings

| Need | Use | Package |
| --- | --- | --- |
| Settings / preferences screen | `<sn-settings-group title>` + `<sn-settings-row title subtitle>`, control as row content | desktop-ui |
| Text field | `<input hlmInput>`, `<textarea hlmTextarea>`, labelled with `hlmLabel` | spartan |
| Number with spin buttons | `<sn-number-box>` (works with `ngModel` / `formControl`) | desktop-ui |
| On/off | `hlm-switch` (settings), `hlm-checkbox` (forms, lists) | spartan |
| One of a few | `hlm-radio-group`, or `hlm-toggle-group` for a segmented control | spartan |
| One of many | `hlm-select` or `hlm-native-select` | spartan |
| Range | `hlm-slider` | spartan |
| Enter submits, Esc cancels | `snDefaultAction` / `snCancelAction` on the buttons | helm |

## Dialogs and overlays

| Need | Use | Package |
| --- | --- | --- |
| Short modal form (New item…) | `<sn-modal-sheet [(open)] title>` + `[snSheetCancel]` / `[snSheetPrimary]` (+ `[snSheetSecondary]` for Back / Don't Save) | desktop-ui |
| Step-by-step setup (wizard, Setup Assistant) | `<sn-assistant>` + `ng-template[snAssistantPage]`, in an `sn-modal-sheet` without sheet buttons | desktop-ui |
| "Get started" task list | `<sn-checklist>` + `<sn-checklist-item [done]>` + `[snChecklistAction]` | desktop-ui |
| Confirmation ("Delete 3 files?") | `<sn-modal-sheet role="alertdialog">` or `hlm-alert-dialog` | desktop-ui / spartan |
| Larger dialog | `hlm-dialog` (footer buttons get OS order automatically) | spartan + helm |
| Button row outside a dialog in OS order | `snDialogButtons` on the row | helm |
| Onboarding / teaching tip | `<sn-coach-mark>` + `[snCoachMarkFor]` | desktop-ui |
| Tooltip | `[snTooltip]="text"` (the skin's tooltip) or `hlmTooltip` | desktop-ui / spartan |
| Native open / save / folder / message dialog | `inject(NATIVE_HOST).dialogs?.openFile(…)` etc. | theme (host) |

## Per-OS differences

| Need | Use |
| --- | --- |
| Different content per OS ("menu bar" vs "system tray") | `*snPlatformIf="'macos'; else other"` |
| Current skin in code | `injectSkin()` → `'win' \| 'w10' \| 'mac' \| 'macc' \| 'gtk' \| 'qt' \| 'cros' \| 'web'`; `skinFamily(skin)` → `'windows' \| 'macos' \| 'linux' \| 'chromeos' \| 'web'` |
| Runtime in code | `inject(SpartanNativeTheme).runtime` → `'wails' \| 'tauri' \| 'dotnet' \| 'web' \| …` |
| Optional host feature | `theme.capability('fileDialogs') !== 'none'` |
| The real OS for behavior (keys, native window buttons), whatever skin the user picked | `injectPlatformFamily()` (not `skinFamily(injectSkin()())`) |
| A "Look like" / appearance settings screen | `SKIN_OPTIONS`, `TEXT_SCALE_OPTIONS`, `SKIN_LABELS` from the theme in `sn-settings-row`s; `theme.override(…)`; `provideSpartanNative({ persist: true })` to keep the choice |
