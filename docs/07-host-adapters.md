# 07 — Host contract & adapters

Every adapter implements the same `NativeHost` interface and shares the same types. The adapters differ in how much each runtime can do natively. Components check capability flags and fall back gracefully. The support levels below are planned and will be confirmed in the adapter spike.

## Shared contract (`@spartan-native/theme`)

The contract below is as designed. `WindowHost`, `MenuHost`, `DialogHost`, `Capability` and `Unsubscribe` are now specified in `packages/theme/src/lib/contract/native-host.ts`; `NotificationHost` is still open (see Q2).

**Menus** (`MenuHost`, optional): `setApplicationMenu(menu)`, `showContextMenu(menu, { x, y })` and `onAction(cb)`. A menu is plain `MenuItem` data (label, `type` normal/checkbox/radio/separator, `accelerator` in the portable `mod+shift+s` notation, `enabled`, `checked`, `role`, `submenu`, `id`), so it crosses into Go, Rust, Node or .NET. A chosen item is reported by its `id`; roles are handled by the OS. A host offers `menus` exactly when `nativeMenus` isn't `none` (a conformance check).

**Dialogs** (`DialogHost`, optional): `openFile({ filters, multiple })`, `saveFile({ filters, fileName })`, `pickFolder()` and, where the OS has one, `message({ kind, message, buttons, defaultId, cancelId })`. A chosen file is a `PickedFile`: native hosts give its `path`; the browser has no paths and gives a File System Access `handle`. A cancelled dialog resolves to `[]` or `null`, never rejects. A host offers `dialogs` exactly when `fileDialogs` isn't `none` (a conformance check). `host-web` has no `message()`: draw an `hlm-alert-dialog` there.

```ts
// Implemented by every adapter, consumed by every component.
export interface NativeHost {
  readonly runtime: 'web' | 'wails' | 'tauri' | 'electron' | 'dotnet';
  readonly capabilities: HostCapabilities;
  platform(): Promise<PlatformInfo>;          // OS, version, desktop → skin
  appearance(): Promise<AppearanceState>;
  onAppearanceChange(cb: (s: AppearanceState) => void): Unsubscribe;
  readonly window: WindowHost;                // focus, effects, title bar
  readonly menus?: MenuHost;                  // native app & context menus
  readonly dialogs?: DialogHost;              // file dialogs and alerts
  readonly notifications?: NotificationHost;
}

export interface AppearanceState {
  skin: Skin;                                 // from PlatformInfo, user can override
  accent: string;                             // #rrggbb
  scheme: 'light' | 'dark';
  contrast: 'normal' | 'more' | 'forced';
  reduceTransparency: boolean;
  reduceMotion: boolean;
  textScale: number;                          // 1 = 100 %
}

export type Skin = 'win' | 'w10' | 'mac' | 'macc' | 'gtk' | 'qt' | 'cros' | 'web';

export interface PlatformInfo {
  os: 'windows' | 'macos' | 'linux' | 'chromeos' | 'unknown';
  version: string | null;                     // '10.0.22631', '26.1', '15.6' …
  build: number | null;                       // Windows: ≥ 22000 means Windows 11
  desktop: 'gnome' | 'kde' | 'cinnamon' | 'xfce' | 'other' | null;
  skin: Skin;                                 // resolved via the fallback table
  confidence: 'exact' | 'hint' | 'unknown';
}

export type HostCapabilities = Record<Capability, 'native' | 'partial' | 'none'>;
```

## Skin resolution (fallback table, derived)

The design names a "fallback table" but does not spell it out. This table is a proposal to confirm.

| Detected | Skin |
| --- | --- |
| windows, build ≥ 22000 | `win` |
| windows, build < 22000 | `w10` |
| macos ≥ 26 | `mac` |
| macos 13–15 (and older) | `macc` |
| linux, desktop `gnome` (also cinnamon, xfce?) | `gtk` |
| linux, desktop `kde` | `qt` |
| chromeos | `cros` |
| unknown (plain web, no hints) | `web` (or a user choice) |

## Capability matrix

N = native · P = partial or fallback · X = not available (components fall back).

| Capability | Group | Web + PWA | Go + Wails | Rust + Tauri | TS + Electron | .NET + Photino |
| --- | --- | --- | --- | --- | --- | --- |
| System accent | Appearance | P: configured; CSS `AccentColor` where supported | N: per-OS Go code + portal | N: plugin per OS + portal | N: `systemPreferences`; portal on Linux | N: WinRT · AppKit · D-Bus |
| Light / dark | Appearance | N: `prefers-color-scheme` | N: runtime events | N: theme events | N: `nativeTheme` | N: OS events |
| High contrast | Appearance | N: `forced-colors`, `prefers-contrast` | P: via CSS media queries | P: via CSS media queries | N: `nativeTheme` | P: via CSS media queries |
| Reduce transparency | Appearance | P: media query where supported | N: read from OS | N: read from OS | N: `nativeTheme` | N: read from OS |
| Text size | Appearance | P: browser font size | N: Windows & GNOME; in-app on macOS | N: same | N: same | N: same |
| Window focus | Window | N: focus / blur events | N: window events | N: window events | N: BrowserWindow events | N: window events |
| Mica · acrylic · vibrancy | Window | X: glass blurs page content only | N: Mica, translucent macOS | N: window effects | N: `backgroundMaterial`, vibrancy | P: limited by Photino |
| Custom title bar | Window | P: Window Controls Overlay (Chromium) | N: frameless + drag regions | N: overlay or frameless | N: `titleBarOverlay` | P: frameless only |
| Native menus & context menus | OS services | X: HTML menus | N on macOS (global menu bar + context menus); P on Windows/Linux (context menus; the app menu reaches only new, framed windows) | N: Menu API | N: Menu API | P: limited |
| Notifications | OS services | P: Notification API, needs permission | P: varies by version | N: notification plugin | N: built in | P: via OS APIs |
| Taskbar / dock progress | OS services | P: app badge only | P: custom native code | N: `setProgressBar` | N: `setProgressBar` | P: custom native code |
| File dialogs | OS services | P: File System Access (Chromium) | N: runtime dialogs | N: dialog plugin | N: dialog module | N: Photino dialogs |
| OS version & skin | Platform | P: UA Client Hints, Chromium only | N: `RtlGetVersion` · sysctl · env | N: native version APIs | N: `os.release()` · `getSystemVersion()` | N: `Environment.OSVersion` |
| GTK vs Qt detection | Linux | X: not detectable | N: `XDG_CURRENT_DESKTOP` | N: `XDG_CURRENT_DESKTOP` | N: `XDG_CURRENT_DESKTOP` | N: `XDG_CURRENT_DESKTOP` |

## Adapter order and conformance

> **Implemented:** `@spartan-native/host-wails` (Go service per OS; passes the suite; verified on macOS; in its own repository, [`Spartan-Native/host-wails`](https://github.com/Spartan-Native/host-wails)), `@spartan-native/host-web` (passes the suite) and `@spartan-native/host-conformance` (12 checks; the live ones run when the adapter's test supplies a driver). The web column of the matrix above is now measured, not planned. One finding: Chromium returns a fixed `AccentColor` (`#0075ff`), so the web accent is real only on Firefox and Safari.

- **Order:** Web/PWA from day one, then Electron → Tauri → Wails → Photino.NET.
- **Conformance:** every adapter must pass the same suite. It should check contract shape, capability flags that match real behavior, live change events (scheme, accent, focus), skin resolution, and graceful fallback when a capability is `none`.
- **Wails note:** the canvas is titled "Spartan Native Theme — Wails" and Wails is the default adapter shown on the project page. Treat Wails as the primary desktop target for dogfooding, even though it comes fourth in the build order (see Q3).

## Native-side sources per OS (from the matrix)

- **Windows:** WinRT `UISettings` (accent, text scale), the registry or `RtlGetVersion` (build), DWM (Mica/acrylic).
- **macOS:** AppKit `NSColor.controlAccentColor`, effective appearance, accessibility display options (reduce transparency or contrast), vibrancy/NSVisualEffectView.
- **Linux:** the XDG Desktop Portal Settings (`org.freedesktop.appearance` color-scheme, accent-color, contrast) over D-Bus, `XDG_CURRENT_DESKTOP`, and GNOME `text-scaling-factor`.
