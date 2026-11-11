# Spartan Native: follow-ups

The UI was rebuilt on `@spartan-native/theme`, `@spartan-native/helm`, `@spartan-native/desktop-ui` and
`@spartan-native/host-wails` (tarballs in `frontend/libs/`). These are the open items.

## 1. Verify in the real Wails window

Checked on macOS 27.2 by running the built app with `SPARTAN_NATIVE_DEBUG=1` and reading the Go service's log
(this session had no screen access, so nothing visual could be seen or clicked):

- [x] **Host wiring:** the Go service is registered and answers `wailsHost()`: `Platform() → macos 27.2.1 skin=mac`, `Appearance() → accent #007aff, dark`, before the first render.
- [x] **macOS menu bar:**
  - The menu is set through the host (`SetApplicationMenu`).
  - Fixed: while locked, the app installed the full File / Go menu, whose items would reach the backend before the keyring was read.
  - Now the locked app gets only the system's App / Edit / Window menus (`SetApplicationMenu(3 items)`), and the full menu after unlocking.
- [x] **Native dialogs:** the adapter maps `message` / `pickFolder` to the Go service's `Message` / `PickFolder`; the app reaches them through `host.dialogs`.

Still to check by eye (or give the terminal Screen Recording permission, or turn on computer use, so it can be
checked from a session):

- [ ] **macOS:** the traffic lights sit over the hidden-inset title bar, with room left for them by `<sn-title-bar windowControls="native">`.
- [ ] **Live OS changes:** switch System Settings → Appearance, or the accent colour, while the app runs. The log should show a new `Appearance()`, and the window should follow.
- [ ] **Settings → General:** Light / Dark and a fixed accent override the OS; Auto / System go back to it.
- [ ] **Shortcuts and dialogs:** ⌘R, ⌘[ and ⌘] work through the menu bar. Push to Tempo shows the OS alert as a sheet, and Choose folder… opens the OS picker.
- [ ] **Windows and Linux** (not available here): the window is frameless; the title bar drags it, and its caption buttons minimize, maximize and close it. Closing quits the app.
- [ ] **Hidden windows:** the hidden HRmaster / Google Chat windows keep their default frame and still work.

## 2. Library issues to fix in spartan-native

- [x] **`sn-settings-group` banner landmark:** it renders a `<header>`, which becomes a stray banner landmark wherever the group isn't inside `<main>`, e.g. in a modal sheet (CDK overlay). The app avoids groups in sheets (`welcome-sheet`, `export-sheet` use a labelled `<section>` with `sn-settings-row`s instead). Once fixed, the sheets can go back to `sn-settings-group`.
  - **Done in spartan-native:** the group heading is a `div` now (`e2d25de`). The sheets can go back to `sn-settings-group`.
- [x] **`@ng-icons` peer range:** desktop-ui declares `@ng-icons/core ^33.4.0`, so the app had to lower `@ng-icons` from 36 to 33.4. Widen the peer range and move the app back to 36.
  - **Done in spartan-native:** desktop-ui accepts `@ng-icons/core >=32.0.0` (`e2d25de`). Move the app back to 36.
- [x] **Go service isn't published:** `github.com/spartan-native/host-wails/native` is vendored into `third_party/spartan-native-host-wails` with a `replace` in `go.mod`. Publish the module (or ship it in the host-wails package) and drop the vendored copy.
  - **Done in spartan-native:** the Go module is `github.com/spartan-native/host-wails` (repository Spartan-Native/host-wails), installed with `go get` at the npm package's version. Drop `third_party/` and the `replace`.
- [x] **Storybook helper is incomplete:**
  - `@spartan-native/theme/storybook` needs `@storybook/addon-themes`.
  - The manager addon (`storybook/manager`) isn't in the tarball.
  - So `.storybook/preview.ts` builds its own OS / scheme / accent toolbar on `staticHost()`. Switch to `spartanNativePreview()` once the full entry point ships.
  - **Done in spartan-native:** `@storybook/addon-themes` is an optional peer of the theme, and the manager addon ships as `@spartan-native/theme/storybook/manager` (`e2d25de`). Switch to `spartanNativePreview()`.
- [x] **No `host-web` tarball:** in a plain browser (`ng serve`, Storybook) the app uses `staticHost()`, which doesn't follow the browser's light/dark setting. Use `isWails() ? wailsHost() : webHost()` in `app.config.ts` once `@spartan-native/host-web` is available.
  - **Done in spartan-native:** `npm run pack:libs` packs host-web too. Use `isWails() ? wailsHost() : webHost()`.
- [x] **`snSelectable` and inputs in rows:** it handles type-ahead / Space on every keydown in a row, which swallows typing in an `<input>` inside a selectable row. Review therefore edits through an inspector instead of inline fields. If inline editing in selectable tables is wanted, the directive should ignore events from editable elements.
  - **Done in spartan-native:** keys typed into inputs, textareas, selects and contenteditable elements in a row go to the field (`e2d25de`).

### Missing in desktop-ui and theme (found building the header, the setup guide and the look settings)

Each item names the app-side workaround to remove once the library has it. The most valuable are the command
groups, commands placed from elsewhere, overflow, and the skin / OS split.

**Command bar (`sn-command-bar`)**

- [x] **Centred title on every skin:** each skin fixes where the title goes (left on Windows and macOS, centred on GNOME). For the Finder-style header the shell draws its own centred `<h1>` in the start slot and measures both sides with a ResizeObserver to keep it clear of them (`fitTitle()` in `shell.component.ts`). Wanted: a title position option (start / centre) that avoids collisions itself.
  - **Done in spartan-native:** `<sn-command-bar titlePosition="center">`: centered while both sides fit, moves aside instead of overlapping. Drop `fitTitle()` and the shell's own `<h1>`.
- [x] **Title is not a heading:** it renders a `<span>`, so the app supplies its own `<h1>`. Wanted: heading semantics for the title.
  - **Done in spartan-native:** the title is `role="heading"` with `headingLevel` (default 1; 0 turns it off).
- [x] **No command groups:** the bar has one toolbar, a single glass capsule on macOS 26. For several capsules the app copies the glass look into `shell.component.css` (`.header[data-skin='mac'] .group`) and adds dividers for the other skins, against the "no per-OS styling in app code" rule. Wanted: an `sn-command-group`, drawn per skin (capsule on macOS, separator on Windows / GNOME).
  - **Done in spartan-native:** `<sn-command-group label="…">`: a Liquid Glass capsule per group on macOS 26, separators on Windows/GNOME/KDE, a gap on ChromeOS. Remove the copied glass CSS.
- [x] **Commands declared in another component lose the bar:** `snCommand` finds its bar through DI, so buttons a page declares and the shell shows (`ui/page-commands`, `<ng-template wlPageCommands>`) get no bar: no skin icon-only mode and no arrow-key focus movement. Wanted: a supported way to place commands into the bar from elsewhere (a bar outlet, or explicit registration).
  - **Done in spartan-native:** `<sn-command-bar [commands]="pageCommandsTemplate">`: commands from the template register with the bar (icon-only mode, overflow, arrow keys). Pass the `wlPageCommands` template instead of rendering it in the start slot.
- [x] **No overflow:** when the bar is too narrow, commands overlap. The app now relies on icon-only commands and hiding the title. Wanted: WinUI-style primary / secondary commands that collapse into ⋯ by priority, or labels that drop automatically.
  - **Done in spartan-native:** when the bar is too narrow it drops the labels (Windows, KDE), then moves commands into the overflow menu by `priority` (lower first); `secondary` commands always live there, `overflowItems` adds entries. Note: once commands collapse, the bar draws the menu itself instead of a `snCommandOverflow` template.
- [x] **No accent command:** accent exists only on `sn-split-button` (a different size). The icon-only Collect button is coloured in app CSS (`.header .collect`). Wanted: `variant="accent"` on `snCommand`.
  - **Done in spartan-native:** `<button snCommand variant="accent">`. Remove `.header .collect`.
- [x] **Plain tooltips:** with `hideLabel` the label becomes the browser's `title` tooltip, not a skin tooltip.
  - **Done in spartan-native:** icon-only commands use the new `snTooltip` (the skin's tooltip, via the theme's tooltip hook); it is also usable on any element.

**Window chrome and theme**

- [x] **Skin and real OS are one setting:**
  - With macOS dressed as another skin (Settings → General → Look like), `sn-title-bar` lays out for that skin's controls while the traffic lights stay at the start. The shell patches this with `.mac-lights.mac-lights.mac-lights` (a specificity hack).
  - The shell derives the real OS from `theme.platform()` for the window buttons, the macOS menu bar and shortcut keys. Library parts such as `snShortcut` still follow the skin, so they'd likely show Ctrl on a Mac dressed as Windows (not confirmed on screen).
  - Wanted: a "platform family" signal for behaviour separate from the skin, and title-bar padding based on where the native controls really are.
  - **Done in spartan-native:** the theme has `nativeSkin()` / `platformFamily()` and `injectPlatformFamily()` / `injectNativeSkin()` (the real OS, whatever skin is picked; also `<html data-sn-platform>`). `snShortcut`, the menubar (accelerators, F10, the macOS menu bar) and context menus follow it. `sn-title-bar windowControls="native"` leaves room where the real OS draws its buttons (`data-native`). Remove `.mac-lights.mac-lights.mac-lights` and the shell's own platform derivation.
- [x] **Overrides aren't persisted:** `override()` lasts for the session. The app saves the look in its settings, mirrors it to localStorage (`shared/appearance.ts`) and passes it as `overrides` at bootstrap so the window opens in it before unlocking. Wanted: a persist option or a storage hook.
  - **Done in spartan-native:** `provideSpartanNative({ host, persist: true })` (or `{ key, storage }`) stores the overrides and applies them before the first render. Remove `shared/appearance.ts`'s localStorage mirror.
- [x] **No appearance-settings piece:** the app builds its own rows for skin, transparency, contrast, animations and text size, plus the skins' display names ("Windows 11", "KDE Plasma", …). Wanted: an `sn-appearance-settings` component, or at least exported skin labels.
  - **Done in spartan-native:** the theme exports `SKIN_LABELS`, `SKIN_OPTIONS`, `TEXT_SCALE_OPTIONS`, `SCHEME_LABELS`, `CONTRAST_LABELS`. No `sn-appearance-settings` component: desktop-ui can't ship spartan's form controls, so the rows stay app code, but the labels can go.

**Sheets and onboarding**

- [x] **`sn-modal-sheet` has two footer buttons only:** `snSheetCancel` always closes the sheet, so there is no place for Back. The setup guide (`welcome-sheet`) uses a clickable page strip instead. Wanted: a secondary slot that doesn't close.
  - **Done in spartan-native:** `[snSheetSecondary]` places a third button that doesn't close the sheet (Back, Don't Save).
- [x] **No assistant pattern:** the guide's pages and Next / Done logic are app code. Wanted: an assistant component (macOS Setup Assistant, a Windows wizard, a GNOME carousel).
  - **Done in spartan-native:** `<sn-assistant>` + `ng-template[snAssistantPage]` (Windows wizard, macOS Setup Assistant, GNOME pages with dots, KDE QWizard step list, ChromeOS flow), with `[(step)]`, `canContinue`, `(finish)`, `(cancel)`. Put it in an `sn-modal-sheet`.
- [x] **No setup-checklist pattern:** numbered / ticked rows, each with an action (`ui/setup-checklist`). Nice to have.
  - **Done in spartan-native:** `<sn-checklist>` + `<sn-checklist-item [done]>` + `[snChecklistAction]`.

**Small things**

- [x] **Lists in alerts lose their markers:** Tailwind's reset removes them inside `hlmAlertDescription`; `ui/token-help` sets `list-style: decimal` again. The helm alert styles could cover lists.
  - **Done in spartan-native:** the theme restores list markers in `hlmAlertDescription` and dialog descriptions. Remove the `list-style` in `ui/token-help`.
- [ ] **No legend or copy-button pattern:** `ui/source-legend` and `ui/copy-button` are app-side. Low priority; the legend depends on the chart palette (see Data-viz colours below).

## 3. App-side leftovers

- [ ] **macOS dark Storybook story:** `Pages/Shell → Mac OS Dark` reports its accessibility result without enforcing it (`a11y: { test: 'todo' }`), because axe can't measure contrast through the macOS 26 materials. Re-check it by hand, or enforce it once axe can measure it.
- [ ] **Data-viz colours:** the day-state and work-source colours are app tokens (`--wl-*` in `src/styles.css`); the theme has no palette for categorical colours. Where a meaning matches a theme token (success, warning, primary), the token is used; leave, meeting, chat, period and leave-source are fixed hues with dark variants. Revisit if the theme gains a chart palette.
- [ ] **Bundle size:** the initial bundle is ~1.1 MB (all seven skins, ~240 kB of CSS), so the budget was raised to 1.3 MB warning / 1.6 MB error. This doesn't matter for a binary-embedded app, but per-skin CSS loading would bring it down.
- [ ] **`@spartan-native/host-conformance`:** installed as a dev dependency but unused. It's for host-adapter authors; remove it, or use it if the app ever writes its own host.
- [ ] **Mac app compatibility:** the Go settings now accept and default to `accentColor: "system"`. These keys are new in this app (the Mac app has no appearance settings), but check that the Mac app ignores the value if a database moves between them.
