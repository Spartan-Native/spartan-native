# 10 — Open questions

> **Describes:** design decisions. The open ones first, then the ones already made, with where the answer lives in the code. Question numbers never change, so links to them stay valid.

## Open

| # | Question | Context |
| --- | --- | --- |
| Q2 | What does `NotificationHost` look like? | `WindowHost`, `MenuHost` (plain `MenuItem` data, actions reported by id), `DialogHost` (file dialogs and alerts), `Capability` and `Unsubscribe` are specified in `packages/theme/src/lib/contract/native-host.ts`. `NotificationHost` is still an empty placeholder type. |
| Q3 | Is Wails the primary desktop target? | The design canvas was titled "… — Wails" and showed Wails as the default adapter, while the original build order put it fourth. In practice it was the first native host built, and the Harbor sample app runs on it. |
| Q4 | What is the `web` skin? | It is in the `Skin` type and is what `resolveSkin()` returns for an unknown OS, but it has no style sheet: it gets the token defaults only. A neutral skin, or stock spartan? |
| Q6 | How should `contrast: more` change the derived palette? | `forced` already works: system colors take over (`forced-colors`). `more` has no rules yet. |
| Q9 | Where does the macOS text size come from? | The capability matrix says "in-app on macOS", because macOS has no system-wide text size setting that apps read. Should the app offer a setting, and should the hosts store it? |
| Q10 | Support policy: browser matrix | Decided: MIT license, npmjs.org, one shared version, fixes for the latest release only (see below). Still open: which browsers `host-web` supports. |

## Decided

| # | Question | Decision |
| --- | --- | --- |
| Q1 | Final token names | Every token is `--sn-*` (colors `--sn-color-*`). `packages/theme/styles/contract/_spartan-bridge.scss` maps them onto spartan's names (`--background`, `--primary`, `--radius`, …). |
| Q5 | Dialog button order per OS | Windows and KDE: default · other · Cancel. macOS: other ‹gap› Cancel · default. GNOME: Cancel · other · default. ChromeOS and `web`: other · Cancel · default. Skins set `--sn-dialog-order-*`; `@spartan-native/helm` applies them to dialog footers and `[snDialogButtons]`. |
| Q7 | Which Linux desktops map to `gtk`? | Every Linux desktop except KDE: GNOME, Cinnamon, XFCE and unknown ones. KDE maps to `qt`. See `resolveSkin()` in `packages/theme/src/lib/skin/resolve-skin.ts`. |
| Q8 | Can the user override the skin and accent in the app? | Yes. `SpartanNativeTheme.override()` overrides any part of the appearance and `followSystem()` drops the overrides; `provideSpartanNative({ persist: true })` keeps them between launches. |
| Q10 | Support policy | MIT license. The packages are published to npmjs.org under the `@spartan-native` scope, all at one shared version. Only the latest release gets fixes (`SECURITY.md`). The minimum Angular and spartan/ui versions are the packages' peer dependencies. The browser matrix is still open (above). |
| Q11 | Trademark use | Platform names describe compatibility only. The README and `NOTICE` say they are trademarks of their respective owners and that the project is not affiliated with or endorsed by them. |
| Q12 | Contrast bug on ChromeOS light | Fixed in `derivePalette()`: the Material 3 accent text is contrast-checked like every other skin's, and tests cover it. (With the mockups' algorithm, `#3DAEE9` reached only 4.23:1 and `#26A269` only 3.06:1 on the surface.) |
