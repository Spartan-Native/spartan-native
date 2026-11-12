# AGENTS.md: @spartan-native/host-web

Instructions for AI coding agents building an Angular app with `@spartan-native/host-web`.

## What this package is

The `NativeHost` adapter for browsers and installed PWAs (Layer 04). It implements the contract from `@spartan-native/theme` using browser APIs only, and has no native side. Hand it to `provideSpartanNative()`, and the theme and every component follow the OS live.

```ts
import { provideSpartanNative } from '@spartan-native/theme';
import { webHost } from '@spartan-native/host-web';

providers: [provideSpartanNative({ host: webHost() })];
// in a desktop shell, fall back to it: isWails() ? wailsHost() : webHost()
```

## Public API (`import … from '@spartan-native/host-web'`)

| Symbol | Use |
| --- | --- |
| `webHost({ accent?, skin?, window? })` | The host. `accent` applies where the browser hides the OS accent, and `skin` forces a skin |
| `watchDisplayMode(cb)` / `readDisplayMode(win)` | `'browser' \| 'standalone' \| 'overlay'`. `overlay` means an installed PWA with Window Controls Overlay: use `<sn-title-bar windowControls="native">` |
| `fromClientHints()`, `fromUserAgent()` | Platform detection, exposed for tests |

## What the app gets

| Service | Available | Notes |
| --- | --- | --- |
| Appearance (scheme, contrast, motion, transparency, text size) | always | Live, through media queries |
| Accent | Firefox and Safari | Chromium hides the OS accent, so `systemAccent` is `'none'` there and the platform's stock accent is used. Offer an in-app accent picker: `theme.override({ accent })` |
| `window` | focus only | No `minimize`, `toggleMaximize` or `close`: the browser owns the window |
| `menus` | never | `<sn-menubar>` and `[snContextMenu]` draw in the page automatically |
| `dialogs` | Chromium (File System Access) | `openFile`, `saveFile`, `pickFolder` give a `PickedFile` with a `handle` and **no `path`**. There's no `message()`: use an `hlm-alert-dialog` |
| `notifications` | never | Not specified yet |

## Rules

1. Check before using an optional service: `host.dialogs?.openFile(…)`, `theme.capability('fileDialogs') !== 'none'`.
2. To read a picked file in the browser, use `(file.handle as FileSystemFileHandle).getFile()`. Don't expect `path`.
3. GNOME and KDE can't be told apart in a browser, so GTK is assumed. Let the user pick the skin, or pass `skin: 'qt'`.
4. Don't call `matchMedia`, `AccentColor` or the File System Access API directly in components. Use the theme service or the host.
