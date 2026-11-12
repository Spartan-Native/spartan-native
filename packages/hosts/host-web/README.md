# @spartan-native/host-web

**Layer 04 · host adapter for browsers and installed PWAs.** It implements `NativeHost` from `@spartan-native/theme` with browser APIs only, so an app picks up the OS settings **live**: accent, light/dark, contrast, transparency, motion, text size and window focus.

> Status: **implemented**, and passes `@spartan-native/host-conformance`. Spec: [`07-host-adapters.md`](https://github.com/Spartan-Native/spartan-native/blob/main/docs/07-host-adapters.md).

```ts
// app.config.ts
import { webHost } from '@spartan-native/host-web';
import { provideSpartanNative } from '@spartan-native/theme';

export const appConfig: ApplicationConfig = {
  providers: [provideSpartanNative({ host: webHost() })],
};
```

That's all: `SpartanNativeTheme`, the skins and every component now follow the OS. Overrides from an in-app setting still win (`theme.override({ scheme: 'dark' })`; `theme.followSystem()` drops them).

## What it reads

| Setting | Source | Live | Capability |
| --- | --- | --- | --- |
| Light / dark | `prefers-color-scheme` | ✓ | native |
| Contrast | `prefers-contrast: more`, `forced-colors: active` (Windows contrast themes) | ✓ | native |
| Reduce transparency | `prefers-reduced-transparency` (Chromium, Safari) | ✓ | partial |
| Reduce motion | `prefers-reduced-motion` | ✓ | — |
| Text size | the browser's default font size (`font-size: medium`) | ✓ ResizeObserver | partial |
| Accent | CSS `AccentColor` where the real OS accent is exposed (Firefox, Safari); otherwise `options.accent` or the platform's stock accent | on focus / tab visible | partial |
| Window focus | `focus`, `blur`, `visibilitychange` | ✓ | native |
| OS, version, skin | User-Agent Client Hints (Chromium: real Windows 10/11 and macOS versions), else the user-agent string | once | partial |

The other capabilities are reported honestly: `customTitleBar` (Window Controls Overlay), `notifications`, `taskbarProgress` (app badge) and `fileDialogs` (File System Access) are `partial` where the API exists, else `none`. Window materials, native menus and the Linux desktop are `none`.

Where the File System Access pickers exist (Chromium), `host.dialogs` opens and saves files and picks folders. You get a `handle` back instead of a path. There is no `message()`: browsers have no OS alert with custom buttons.

**Browser limits:**
- **Accent on Chromium (Chrome, Edge, Brave, Electron-free PWAs):** Chromium returns its own fixed blue for `AccentColor` (anti-fingerprinting), so the OS accent can't reach the page. The adapter detects it, reports `systemAccent: 'none'`, and uses the platform's stock accent. Offer an in-app accent picker (`theme.override({ accent })`). The desktop adapters (Wails, Tauri, Electron, Photino) will read the real accent natively.
- **Frozen versions:** without Client Hints, Windows and macOS versions are frozen in the user-agent string. Windows maps to the Windows 11 skin and macOS to macOS 26.
- **Linux desktop:** GNOME vs KDE is not visible to a web page, so GTK is assumed. Pass `skin: 'qt'` to override.

## Display mode (installed apps)

```ts
import { watchDisplayMode } from '@spartan-native/host-web';

const off = watchDisplayMode((mode) => …); // 'browser' | 'standalone' | 'overlay'
```

`'overlay'` means an installed app with Window Controls Overlay: the OS draws only the window buttons, and the app draws its title bar in `env(titlebar-area-*)`. Use it with `<sn-title-bar windowControls="native">` from `@spartan-native/desktop-ui`. The callback fires again when the user toggles the overlay.

## Options

```ts
webHost({
  accent: '#9141ac', // when the browser doesn't expose the system accent
  skin: 'gtk',       // force a skin (e.g. from a user setting)
  window,            // another window / iframe, or a test double
});
```

## Tests

```bash
npx ng test host-web   # the conformance suite + platform detection, accent, live media and focus changes
```

The spec drives a fake browser window (media queries, `AccentColor`, focus) and runs `describeHostConformance('webHost', …)`.
