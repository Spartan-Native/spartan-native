# Changelog

All notable changes to the `@spartan-native/*` packages are listed here. Every package in this repository shares one version number, and a release publishes all of them together.

The format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and the project uses [Semantic Versioning](https://semver.org/). Until `1.0.0`, a minor version may contain breaking changes; they are called out under **Changed**.

## [Unreleased]

### Added

- `@spartan-native/desktop-ui`: `SnAlert`, alerts and confirmations in one call: `show(options)` resolves the pressed button's id and `confirm(message, options)` a yes or no. It uses the host's native alert when there is one, and otherwise an in-page `alertdialog` sheet with the default button focused and Esc answering `cancelId`.
- `@spartan-native/desktop-ui`: `[snResizable]`, for side panels the user can resize by dragging their inner edge (`<sn-sidebar-nav>`, `<sn-inspector>` or any panel). The width is a share of the parent and can be remembered per key; double-click resets it; ← → Home End work from the keyboard.
- `@spartan-native/desktop-ui`: `collapsed` on `<sn-sidebar-nav>` folds it to icons. Labels and section titles stay for screen readers and show as tooltips, and badges become a mark on the icon. Items without an icon keep their (short) content, and the new `tooltip` input on an item says what its tooltip shows.
- `@spartan-native/desktop-ui`: `<sn-search-field>`, the platform's search field (magnifier, clear button, Esc empties it first). It works with `[(value)]`, `ngModel` and reactive forms.
- `@spartan-native/desktop-ui`: `SnPageCommands` and `<ng-template snPageCommands>`, so a page can put its commands into the shell's `<sn-command-bar [commands]>`.
- `@spartan-native/theme`: eight categorical colors, `--sn-color-category-1` … `-8` (`category1` … `category8` in `Palette`), for chart series, tags and calendars. They come from each platform's named colors and are each at least 3:1 against the background.

### Fixed

- `@spartan-native/desktop-ui`: `<sn-sidebar-nav>` items keep their look when they are also a spartan menu trigger. The styles now hang on the `sn-sidebar-item` class, because `hlmDropdownMenuTrigger` replaces the item's `data-slot`.
- `@spartan-native/desktop-ui`: `<sn-modal-sheet role="alertdialog">` no longer puts the role on its own empty host element as well as on the dialog.

## [0.2.0] - 2026-11-12

### Added

- `@spartan-native/helm`: the constants `SELECTION_PAGE_SIZE` and `TYPEAHEAD_RESET_MS`, the values the selection model uses for Page Up/Down and type-ahead.
- MIT license, contributing guide, code of conduct and security policy.
- CI on pull requests: unit tests, library builds and a check of every package's published contents.

### Changed

- Packages are published to npmjs.org instead of GitHub Packages. No `.npmrc` or token is needed to install them.

### Removed

- Helpers that were public only by accident (through `export *`), with no users in this or the sibling repositories: `coachMarkPositions`, `coachMarkSide`, `nextIndex` and `itemsWithAccelerators` from `@spartan-native/desktop-ui`, and `detectPlatform`, `NavigatorLike` and `UserAgentDataLike` from `@spartan-native/host-web` (`webHost().platform()` gives the same result).
- `@spartan-native/host-electron` is no longer published. It has no implementation yet and returns once it does.

## [0.1.0] - 2026-11-12

First release.

### Added

- `@spartan-native/theme`: the token contract, `derivePalette()`, the `NativeHost` contract, `provideSpartanNative()`, and skins for Windows 11 and 10, macOS 26 and 13–15, GNOME, KDE Plasma and ChromeOS.
- `@spartan-native/helm`: the desktop selection model for lists and tables, default and cancel buttons, and dialog buttons in each OS's order.
- `@spartan-native/desktop-ui`: title bar, window controls, status bar, command bar, coach mark, modal sheet, inspector, sidebar navigation, settings list, status page, assistant, checklist, split button, number box, tree view, tooltip, shortcut formatting, `*snPlatformIf`, and the menubar adapter with context menus.
- `@spartan-native/host-web`: OS settings from browser APIs, live, for browsers and installed PWAs.
- `@spartan-native/host-conformance`: the test suite every host adapter must pass.

[Unreleased]: https://github.com/Spartan-Native/spartan-native/compare/v0.2.0...HEAD
[0.2.0]: https://github.com/Spartan-Native/spartan-native/compare/v0.1.0...v0.2.0
[0.1.0]: https://github.com/Spartan-Native/spartan-native/releases/tag/v0.1.0
