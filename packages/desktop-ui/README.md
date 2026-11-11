# @spartan-native/desktop-ui

**Layer 03 · optional.** The pieces stock spartan doesn't have: **window chrome** and the **patterns each OS is known for**. Each component changes its *layout* per OS, not just its colors, and follows the skin live.

> Status: **implemented for all seven skins** (Windows 11 and 10, macOS 26 and 13–15, GNOME, KDE Plasma, ChromeOS): title bar, window controls, the six OS patterns (command bar, coach mark, modal sheet, inspector, settings list, status page), sidebar navigation, shortcut formatting and `*snPlatformIf`. Not yet: the menubar adapter, which waits for the host's menu contract. Spec: [`06-os-patterns.md`](../../docs/06-os-patterns.md).

## Components

| Component | Windows 11 / 10 | macOS 26 / 13–15 | GNOME | KDE Plasma | ChromeOS |
| --- | --- | --- | --- | --- | --- |
| `<sn-title-bar>` | icon + title left, caption buttons right | traffic lights left, title centered | header bar, bold centered title | Breeze title bar | caption bar, round buttons |
| `<sn-window-controls>` | – □ × (close turns red) | ● ● ● (grey when inactive) | round × (all three with `linuxAll`) | Breeze glyph buttons | M3 round caption buttons |
| `<sn-command-bar>` | **CommandBar** | unified NSToolbar | AdwHeaderBar | KToolBar | top app bar |
| `<sn-coach-mark>` + `[snCoachMarkFor]` | **TeachingTip** | NSPopover | GtkPopover | Kirigami popup | rich tooltip |
| `<sn-modal-sheet>` | ContentDialog | **sheet** from the title bar | AdwDialog, buttons in the header bar | window-modal dialog | M3 dialog |
| `<sn-inspector-layout>` + `<sn-inspector>` | SplitView pane | **Inspector** | AdwOverlaySplitView | Dolphin information panel | side sheet |
| `<sn-sidebar-nav>` | accent pill (10: 4px bar) | accent fill, grey when inactive | neutral rounded selection | accent-filled selection | tonal pill |
| `<sn-settings-group>` + `<sn-settings-row>` | SettingsCards (10: plain rows) | grouped Form section | **AdwPreferencesGroup** | Kirigami FormLayout | settings list in a tonal card |
| `<sn-status-page>` | Fluent empty state | ContentUnavailableView | **AdwStatusPage** | PlaceholderMessage | M3 empty state |
| `<kbd snShortcut="mod+shift+s">` | Ctrl+Shift+S | ⇧⌘S | Ctrl+Shift+S | Ctrl+Shift+S | Ctrl+Shift+S |
| `*snPlatformIf="'macos'; else other"` | renders per skin (`'mac'`) or family (`'macos'`, `'windows'`, `'linux'`) | | | | |

**Bold** marks the OS a pattern comes from. Each component has a docs page in Storybook (*Desktop UI* → the component → *Docs*) with the per-OS table, live examples, usage, the full API and accessibility notes.

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

<sn-status-page icon="lucideArchive" title="No backups yet" description="Add a destination to start protecting your files.">
  <button hlmBtn>Add destination</button>
</sn-status-page>
```

**Window integration:** the title bar is a drag region for Electron/Chromium (`app-region`), Wails (`--wails-draggable`) and Tauri (`data-tauri-drag-region`). Its buttons are excluded. `windowControls="native"` leaves room for buttons the OS draws itself (Electron `titleBarOverlay`, Window Controls Overlay). The buttons only emit `minimize` / `maximize` / `close`; a host adapter will wire them to the real window later.

**Inactive window:** the chrome carries `sn-chrome`, so the theme dims it, and the macOS lights turn grey.

## How it follows the OS

Every component reads `injectSkin()` from `@spartan-native/theme`: the theme service when `provideSpartanNative()` is present, otherwise the `data-sn-skin` attribute on `<html>`. Styles are component-scoped SCSS reading the theme's tokens, one block per family or skin (`:host([data-family='macos'])`, `:host([data-skin='qt'])`). Every host carries `data-slot`, `data-family` and `data-skin`. Sizes are in rem, so everything grows with the OS text size.

## Structure

| Path | Purpose |
| --- | --- |
| `src/lib/window/` | `SnTitleBar`, `SnWindowControls` |
| `src/lib/patterns/` | `SnCommandBar`, `SnCoachMark`, `SnModalSheet`, `SnInspector…`, `SnSidebarNav…`, `SnSettingsGroup`, `SnSettingsRow`, `SnStatusPage` |
| `src/lib/platform/` | `formatShortcut()`, `SnShortcut`, `SnPlatformIf` |
| `src/lib/menubar/` | next: the menubar adapter (global macOS menu bar through the host) |
| `src/stories/` | one stories file per component |
| `src/docs/` | one docs page (MDX) per component |

Imports: `SnWindowImports`, `SnCommandBarImports`, `SnCoachMarkImports`, `SnModalSheet`, `SnInspectorImports`, `SnSidebarNavImports`, `SnSettingsImports`, `SnStatusPage`, `SnPlatformImports`, or `SnDesktopUiImports` for everything.

## Dependencies

`@spartan-native/theme`, `@ng-icons/core` and `@angular/cdk` (peers: overlay, dialog, menu and a11y for the coach mark, modal sheet and command bar), Angular `^22.2.0`. The stories also use stock spartan/ui (`@spartan-ng/helm/*`); the library itself doesn't.

## Next

The menubar adapter, once the host's menu contract (`MenuHost`) is specified; native context menus, window effects and Snap Layouts through the host ([09](../../docs/09-roadmap.md), phase 05).

## Commands

```bash
npm run storybook:desktop-ui   # http://localhost:6008
npx ng test desktop-ui
npx ng build desktop-ui
npm run test:visual -- --project=desktop-ui   # 371 screenshots: every story on all seven skins (+ dark)
```
