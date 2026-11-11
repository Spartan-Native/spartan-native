# 10 — Open questions

The mockups leave these open. Resolve them in phase 02 and record each answer here. Also check the claude.ai project chats: decisions made there were not available when these docs were written.

| # | Question | Context / suggestion |
| --- | --- | --- |
| Q1 | ~~Final token names~~ **Decided:** every token is `--sn-*` (colors `--sn-color-*`); `contract/_spartan-bridge.scss` maps them onto spartan's names (`--background`, `--primary`, `--radius`, …). | See `packages/theme/src/styles/contract/`. |
| Q2 | Exact shape of `WindowHost`, `MenuHost`, `NotificationHost`, `Capability` and `Unsubscribe`. **Mostly decided:** `WindowHost`, `MenuHost` (plain `MenuItem` data, actions reported by id), `DialogHost` (file dialogs and alerts), `Capability` and `Unsubscribe` are in `contract/native-host.ts`; `NotificationHost` is still open. | Named in the contract but not specified. Derive `Capability` keys from the 14 matrix rows ([07](07-host-adapters.md)). |
| Q3 | Is Wails the primary target? | The canvas is titled "… — Wails" and Wails is the default adapter on the project page, but the build order puts it fourth. Confirm the priority. |
| Q4 | What is the `web` skin? | It is in the `Skin` type but has no mockup. Is it a neutral skin, or just stock spartan? |
| Q5 | ~~Dialog button order per OS.~~ **Decided:** Windows and KDE: default · other · Cancel; macOS: other ‹gap› Cancel · default; GNOME: Cancel · other · default; ChromeOS and `web`: other · Cancel · default. Skins set `--sn-dialog-order-*`; `@spartan-native/helm` applies them to dialog footers and `[snDialogButtons]`. | Listed as a convention; the mockup shows Don't save / Cancel / Save. Define it per skin (e.g. Windows: primary on the left of Cancel; macOS/GNOME: primary on the right). |
| Q6 | How should high contrast (`contrast` = `more` or `forced`) change the derived palette? | It is "Planned"; there are no rules yet. With `forced-colors`, system colors take over. |
| Q7 | Which Linux desktops map to `gtk`? | Cinnamon, XFCE and "other" are in `PlatformInfo.desktop`, but the fallback table is not specified. |
| Q8 | Can the user override the skin and accent in the app? | `AppearanceState.skin` says "user can override". Should this be a settings UI and persisted? |
| Q9 | macOS text size | The matrix says "in-app on macOS". Where does that setting live? |
| Q10 | Support policy | Minimum Angular and spartan/ui versions, the browser matrix for host-web, licensing, and package scope (`@spartan-native`) availability on npm. |
| Q11 | Trademark use | The project page shows runtime logos ("trademarks of their respective owners"). Confirm this for public docs. |
| Q12 | ~~Contrast bug on ChromeOS light~~ **Fixed** in `derivePalette()`: the M3 accent text is now contrast-checked (covered by tests). | M3 `atext` (= primary at L 0.40) is not contrast-checked: `#3DAEE9` gives 4.23:1 and `#26A269` gives 3.06:1 on the surface. Apply `ensure(atext, bg, 4.5)` in the cros branch, or accept M3 tone 40 as-is. |
