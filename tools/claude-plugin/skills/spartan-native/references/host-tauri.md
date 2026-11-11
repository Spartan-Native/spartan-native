# Tauri v2 (Rust) desktop app

Read `node_modules/@spartan-native/host-tauri/AGENTS.md` after this. It has the full API.

`@spartan-native/host-tauri` has two halves:

| Half | Where | Does |
| --- | --- | --- |
| Rust plugin | crate `tauri-plugin-spartan-native` (git dependency) | Reads the real OS accent, scheme, contrast, transparency, motion, text size; pushes changes; owns the window actions; shows native menus and file/message dialogs |
| TS adapter | npm `@spartan-native/host-tauri` | `tauriHost()`: implements the host contract over the plugin's commands |

Both halves are released together from one tag, so **use the same version of each**: `@spartan-native/host-tauri@1.2.3` with the crate at `tag = "v1.2.3"`. They talk through command and event names, which change between versions; a mismatched pair fails at runtime, not at build time.

## Layout of a Tauri project

```
my-app/
├── src/ …             the Angular app (setup.md applies here; frontendDist points at its build)
└── src-tauri/
    ├── Cargo.toml     tauri-plugin-dialog + tauri-plugin-spartan-native
    ├── src/lib.rs     registers both plugins
    ├── capabilities/default.json
    ├── tauri.conf.json, tauri.macos.conf.json
```

## 1. Frontend packages

Do the shared setup in `setup.md`, then:

```bash
npm install @spartan-native/host-tauri @spartan-native/host-web @tauri-apps/api
```

`host-web` is the fallback so the same frontend runs in a browser during development (`ng serve`) and in Storybook.

## 2. Rust plugin

The crate lives in a private GitHub repository. Let Cargo fetch it with the git CLI and a token that can read it (the same token as for the npm package works):

```bash
git config --global url."https://${GITHUB_TOKEN}@github.com/".insteadOf "https://github.com/"
export CARGO_NET_GIT_FETCH_WITH_CLI=true
```

```toml
# src-tauri/Cargo.toml
[dependencies]
tauri-plugin-dialog = "2"
tauri-plugin-spartan-native = { git = "https://github.com/spartan-native/host-tauri", tag = "v1.2.3" }   # same version as the npm package
```

Start `src-tauri/src/lib.rs` from `templates/tauri/lib.rs`. The important lines:

```rust
.plugin(tauri_plugin_dialog::init())           // the plugin's dialogs use it
.plugin(tauri_plugin_spartan_native::init())
```

Options: `tauri_plugin_spartan_native::Builder::default().skin("gtk").poll_interval(Duration::from_millis(500)).build()`. Set `SPARTAN_NATIVE_DEBUG=1` to log what the OS reports.

Add the plugin's permission to the window's capability (`templates/tauri/capabilities/default.json`): `"spartan-native:default"`, plus `"core:window:allow-start-dragging"` so the title bar can drag the window.

## 3. The window

| OS | Tauri window config | In the frontend |
| --- | --- | --- |
| Windows, Linux | `"decorations": false` (`tauri.conf.json`) | `<sn-title-bar>` draws title and window buttons; they act on the real window |
| macOS | `"titleBarStyle": "Overlay"`, `"hiddenTitle": true`, decorations on (`tauri.macos.conf.json`) | The OS draws the traffic lights. Use `<sn-title-bar windowControls="native">` |

`templates/tauri/tauri.conf.json` and `tauri.macos.conf.json` set this up (Tauri merges the platform file over the main one), and `templates/shell` picks `windowControls` to match. `<sn-title-bar>` is already a `data-tauri-drag-region`: don't add your own.

## 4. Provider

```ts
import { isTauri, tauriHost } from '@spartan-native/host-tauri';
import { webHost } from '@spartan-native/host-web';

provideSpartanNative({ host: isTauri() ? tauriHost() : webHost() })
```

## 5. Native services through the host

Never call `@tauri-apps/api` or the plugin's commands from components. Use the host, as in `host-wails.md` §5: `host.dialogs?.openFile(…)` gives files with a `path`; `host.dialogs?.message?.(…)` takes **at most three buttons** (OK / OK-Cancel / Yes-No-Cancel slots with your labels), always with `defaultId` and `cancelId`. Menus: `<sn-menubar>` and `[snContextMenu]` from desktop-ui; native on macOS, context menus native everywhere.

## 6. Build

```bash
npx tauri build      # runs the Angular build (beforeBuildCommand), then cargo
```

Needs Rust and the Tauri v2 prerequisites (WebView2 on Windows, WebKitGTK 4.1 on Linux).

## Testing without Tauri

`tauriHost({ runtime: fake })` takes a fake runtime (`invoke`, `listen`). For a custom adapter, run `describeHostConformance` from `@spartan-native/host-conformance`.
