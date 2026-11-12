# Browser and installed PWA

Read `node_modules/@spartan-native/host-web/AGENTS.md` after this.

```bash
npm install @spartan-native/host-web
```

```ts
import { webHost } from '@spartan-native/host-web';

provideSpartanNative({ host: webHost() });
// webHost({ accent: '#0a84ff' })  accent where the browser hides the OS accent (Chromium)
// webHost({ skin: 'qt' })         force a skin (a browser can't tell GNOME from KDE; GTK is assumed)
```

## What works in a browser

| Service | Available |
| --- | --- |
| Scheme, contrast, motion, transparency, text size | Always, live |
| OS accent | Firefox and Safari. Chromium hides it: offer an accent picker with `theme.override({ accent })` |
| Window buttons | No. The browser owns the window |
| Native menus | No. `<sn-menubar>` and `[snContextMenu]` draw in the page automatically |
| File dialogs | Chromium only (File System Access). A `PickedFile` has a `handle`, **no `path`**. No `message()`: use `hlm-alert-dialog` |

Read a picked file with `await (file.handle as FileSystemFileHandle).getFile()`.

## The window frame in a browser

| Display mode (`watchDisplayMode(cb)`) | What to render |
| --- | --- |
| `browser` (a tab) | Usually no title bar. Start the layout at the sidebar |
| `standalone` (installed PWA, OS title bar) | No title bar |
| `overlay` (installed PWA with Window Controls Overlay) | `<sn-title-bar windowControls="native">`: the OS draws the buttons |

`templates/shell` handles these cases.
