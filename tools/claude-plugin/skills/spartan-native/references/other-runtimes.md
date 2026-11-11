# Electron

`@spartan-native/host-electron` is a **scaffold**. It exports no working API. Don't install it, and don't write code against `electronHost()`.

(Tauri and Photino.NET have their own hosts: [host-tauri.md](host-tauri.md), [host-dotnet.md](host-dotnet.md).)

Until it ships, use `webHost()` from `@spartan-native/host-web`. It runs inside Electron's Chromium and gives the browser's capabilities:

- Appearance (scheme, contrast, motion, text size) works. The accent is Chromium's fixed blue, not the OS accent.
- No window buttons through the host. `<sn-title-bar>` still draws them and is a drag region for Electron (`app-region`). Wire its `(minimize)`, `(maximize)` and `(close)` outputs to Electron's window API **in the root component only**, behind a single service, so components stay runtime-free.
- No native menus: `<sn-menubar>` and `[snContextMenu]` draw in the page.
- File dialogs through File System Access.

If the OS draws the window buttons (Electron `titleBarOverlay`), use `<sn-title-bar windowControls="native">`.

When the host is released, only the `host:` line in `app.config.ts` changes. Check `node_modules/@spartan-native/host-electron/AGENTS.md` for its status.
