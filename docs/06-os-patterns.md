# 06 — OS patterns & counterparts (`@spartan-native/desktop-ui`)

> **Describes:** what is built. Each pattern is one component; its Storybook page (`npm run storybook:desktop-ui`) shows it on every skin.

The design takes two signature patterns from each OS family and rebuilds each one with the same tokens as the closest native equivalent on every other platform. Each pattern is one Angular component. It renders the native form on its home OS and the counterpart elsewhere.

| Pattern | Component | Origin | Windows (11/10) | macOS (26/classic) | GNOME · GTK | KDE · Qt | ChromeOS · M3 |
| --- | --- | --- | --- | --- | --- | --- | --- |
| Command surface | `<sn-command-bar>` | Windows · CommandBar | **CommandBar (native)** | Unified NSToolbar | AdwHeaderBar | KToolBar | Top app bar |
| Coach mark | `<sn-coach-mark>` | Windows · TeachingTip | **TeachingTip (native)** | NSPopover | GtkPopover | Kirigami popup | Rich tooltip |
| Modal form | `<sn-modal-sheet>` | macOS · Sheet | ContentDialog | **Sheet (native)** | AdwDialog | Window-modal QDialog | M3 dialog |
| Detail side panel | `<sn-inspector>` | macOS · Inspector | SplitView pane | **Inspector (native)** | AdwOverlaySplitView | Information panel (Dolphin-style) | Side sheet |
| Settings list | `<sn-settings-group>` | GTK · AdwPreferencesGroup | SettingsCard | Grouped Form section | **PreferencesGroup + rows (native)** | Kirigami FormLayout | Settings list |
| Empty state | `<sn-status-page>` | GTK · AdwStatusPage | Empty-state page | ContentUnavailableView | **AdwStatusPage (native)** | Kirigami PlaceholderMessage | Empty state |

## Demo content per pattern

The Storybook stories reproduce the design's demo content:

- **Command surface:** a "Documents" title with New / Share / Delete commands over a file list (Budget 2026.xlsx 48 KB, Q4 Report.pdf 2.4 MB, Meeting notes.md 6 KB, Roadmap.png 1.1 MB).
- **Coach mark:** anchored to a "Sync" button. Title "Sync across devices", body "Turn on sync to keep your backups available on every device you sign in to.", actions Not now / Turn on.
- **Modal form:** "New destination" with Name, Type (Network share) and an Encrypt backups switch, plus Cancel / Create. The macOS sheet hangs from the title bar. GTK puts Cancel and Create in the header bar.
- **Detail side panel:** a file list with an inspector showing name, Kind, Size, "Modified Today, 09:12", a Keep offline switch and a Show versions button. The list supports ↑ ↓ Home End and type-ahead.
- **Settings list:** "Backups — Choose when and how backups run." Rows: Automatic backups (Run in the background, switch), Frequency (How often to back up, "Every hour" select), Excluded folders (3 folders, navigation row).
- **Empty state:** "No backups yet — Add a destination to start protecting your files." with an Add destination button.

## Other desktop-ui pieces

| Piece | Notes |
| --- | --- |
| Title bar | Three modes: a custom drawn bar, the native caption overlay (Electron `titleBarOverlay`, Tauri overlay, Wails frameless + drag regions), or Window Controls Overlay for PWAs. Includes Windows caption buttons, macOS traffic lights and the GTK header bar. |
| Sidebar navigation | As in the sample app; the selected item uses the platform selection idiom. |
| Menubar adapter | `<sn-menubar>`: macOS uses the global menu bar through the host when it has native menus; elsewhere an in-window menu bar drawn with the skin's menubar and menu styles. One `SnMenuItem[]` definition; roles become the OS's items natively and Edit / Window menus in the page. |
| Context menus | `[snContextMenu]`: the OS's own context menu through the host, otherwise an in-page menu at the pointer. |
| Shortcut formatter (`snShortcut`) | ⌘ vs Ctrl, following the real OS, plus the delete and rename glyphs (see [04](04-platform-skins.md#shortcut-glyphs)). |
| `*snPlatformIf` | Structural directive per skin or OS family, with `else`: `*snPlatformIf="'macos'; else other"`, `*snPlatformIf="['windows', 'linux']"`, `*snPlatformIf="'qt'"`. |
| Status bar | Explorer's status bar · classic ruled bar (Windows 10) · Finder's centered text · GtkActionBar · Dolphin's bar · M3 footer. Items opt in to being announced (`live`). |
| Split button | Fluent SplitButton · NSComboButton · AdwSplitButton · QToolButton MenuButtonPopup · M3 split button. The parts use the skin's own button styles. |
| Number box | Fluent NumberBox (inline ∧ ∨, math input) · field + NSStepper · GtkSpinButton · Breeze QSpinBox · M3 field with − / +. |
| Tree view | WinUI TreeView · NSOutlineView · GtkTreeExpander · Breeze QTreeView · Files app tree; helm's selection model over the visible items. |
