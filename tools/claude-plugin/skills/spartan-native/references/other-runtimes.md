# Electron, Tauri, Photino.NET

`@spartan-native/host-electron`, `@spartan-native/host-tauri` and `@spartan-native/host-dotnet` are **scaffolds**. They export no working API. Don't install them, and don't write code against `electronHost()`, `tauriHost()` or `dotnetHost()`.

Until they ship, use `webHost()` from `@spartan-native/host-web`. It runs inside every one of these webviews and gives the browser's capabilities:

- Appearance (scheme, contrast, motion, text size) works. The accent depends on the webview engine.
- No window buttons through the host. `<sn-title-bar>` still draws them and is a drag region for Electron (`app-region`) and Tauri (`data-tauri-drag-region`). Wire its `(minimize)`, `(maximize)` and `(close)` outputs to the runtime's own window API **in the root component only**, behind a single service, so components stay runtime-free.
- No native menus: `<sn-menubar>` and `[snContextMenu]` draw in the page.
- File dialogs only where the webview supports File System Access.

If the OS draws the window buttons (Electron `titleBarOverlay`, Tauri overlay title bar), use `<sn-title-bar windowControls="native">`.

When one of these hosts is released, only the `host:` line in `app.config.ts` changes. Check `node_modules/@spartan-native/host-<runtime>/AGENTS.md` for its status.
