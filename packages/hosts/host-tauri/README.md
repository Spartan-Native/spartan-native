# @spartan-native/host-tauri

**Layer 04 · host adapter for Rust + Tauri v2.** It implements the `NativeHost` contract from `@spartan-native/theme`, so the theme and components never know which runtime they are in. Renders in WebView2 · WKWebView · WebKitGTK.

> Status: scaffold. No implementation yet. Spec: [`07-host-adapters.md`](../../../docs/07-host-adapters.md) (contract and capability matrix).

## Contract and capabilities

The highlighted column in the design shows Wails; every adapter fills in its own column of this matrix.

![Capability matrix per adapter and the shared NativeHost contract](../../../docs/images/project-host-adapters.jpg)

## Usage (planned)

```ts
// app.config.ts: the only line that changes per runtime
import { provideSpartanNative } from '@spartan-native/theme';
import { tauriHost } from '@spartan-native/host-tauri';

export const appConfig = {
  providers: [provideSpartanNative({ host: tauriHost() })],
};
```

## Structure

| Path | Purpose |
| --- | --- |
| `src/lib/` | TypeScript side of the adapter: `tauriHost()` returning a `NativeHost`, with its capability flags. |
| `native/` | Native side: Rust plugin crate (Tauri v2). Not part of the npm package. |
| `src/public-api.ts` | The package entry point. |

## Requirements

- Must pass `@spartan-native/host-conformance`.
- Capabilities the runtime cannot provide are reported as `'none'` or `'partial'`, never thrown.

## Commands

```bash
npx ng build host-tauri
npx ng test host-tauri
```
