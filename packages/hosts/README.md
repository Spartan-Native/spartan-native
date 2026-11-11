# Host adapters (`packages/hosts`)

**Layer 04.** Each adapter implements the `NativeHost` contract from [`@spartan-native/theme`](../theme), so the theme and components never know which runtime they are in. Only the host line in `app.config.ts` changes per runtime.

> Status: **`host-web`, `host-wails` and `host-conformance` are implemented.** Tauri, Electron and Photino.NET are still scaffolds. Spec: [`07-host-adapters.md`](../../docs/07-host-adapters.md).

| Package | Runtime | Native side | Factory |
| --- | --- | --- | --- |
| [`@spartan-native/host-web`](host-web) | Browser / PWA | none (browser APIs) | `webHost()` |
| [`@spartan-native/host-wails`](host-wails) | Go + Wails | `native/` Go module | `wailsHost()` |
| [`@spartan-native/host-tauri`](host-tauri) | Rust + Tauri v2 | `native/` Rust plugin crate | `tauriHost()` |
| [`@spartan-native/host-electron`](host-electron) | TypeScript + Electron | `native/` main process + preload | `electronHost()` |
| [`@spartan-native/host-dotnet`](host-dotnet) | .NET + Photino.NET | `native/` C# library | `dotnetHost()` |
| [`@spartan-native/host-conformance`](host-conformance) | — (private) | — | `runHostConformance()` |

The planned build order is web/PWA first, then Electron → Tauri → Wails → Photino.NET. Every adapter must pass `host-conformance`. Angular project names stay short (`ng build host-wails`), and build output stays at `dist/host-*`.

![Capability matrix per adapter and the shared NativeHost contract](../../docs/images/project-host-adapters.jpg)
