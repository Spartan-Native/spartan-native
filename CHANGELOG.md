# Changelog

All notable changes to the `@spartan-native/*` packages are listed here. Every package in this repository shares one version number, and a release publishes all of them together.

The format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and the project uses [Semantic Versioning](https://semver.org/). Until `1.0.0`, a minor version may contain breaking changes; they are called out under **Changed**.

## [Unreleased]

### Added

- MIT license, contributing guide, code of conduct and security policy.
- CI on pull requests: unit tests, library builds and a check of every package's published contents.

### Changed

- Packages are published to npmjs.org instead of GitHub Packages. No `.npmrc` or token is needed to install them.

### Removed

- `@spartan-native/host-electron` is no longer published. It has no implementation yet and returns once it does.

## [0.1.0] - 2026-11-12

First release.

### Added

- `@spartan-native/theme`: the token contract, `derivePalette()`, the `NativeHost` contract, `provideSpartanNative()`, and skins for Windows 11 and 10, macOS 26 and 13–15, GNOME, KDE Plasma and ChromeOS.
- `@spartan-native/helm`: the desktop selection model for lists and tables, default and cancel buttons, and dialog buttons in each OS's order.
- `@spartan-native/desktop-ui`: title bar, window controls, status bar, command bar, coach mark, modal sheet, inspector, sidebar navigation, settings list, status page, assistant, checklist, split button, number box, tree view, tooltip, shortcut formatting, `*snPlatformIf`, and the menubar adapter with context menus.
- `@spartan-native/host-web`: OS settings from browser APIs, live, for browsers and installed PWAs.
- `@spartan-native/host-conformance`: the test suite every host adapter must pass.

[Unreleased]: https://github.com/Spartan-Native/spartan-native/compare/v0.1.0...HEAD
[0.1.0]: https://github.com/Spartan-Native/spartan-native/releases/tag/v0.1.0
