# AGENTS.md: @spartan-native/host-dotnet

Instructions for AI coding agents.

## Status: scaffold, nothing to use yet

This will be the `NativeHost` adapter for **Photino.NET** (Layer 04), with a C# library as its native side. It exports **no working API yet**: the only export is a scaffold marker. Don't import it in an app, and don't write code against a planned `dotnetHost()`.

## What to use instead

- Use `webHost()` from `@spartan-native/host-web`. It runs inside Photino.NET's webview too, with browser-level capabilities: no window buttons, no native menus, and file dialogs only where the webview has File System Access.
- `<sn-title-bar>` from `@spartan-native/desktop-ui` is already a drag region for Photino.NET. Wire its `(minimize)`, `(maximize)` and `(close)` outputs to Photino.NET's own window API until this adapter exists.

## When it's implemented

It will implement the contract from `@spartan-native/theme` (`NativeHost`, with the optional `menus` and `dialogs` services), pass `@spartan-native/host-conformance`, and be used the same way as every host:

```ts
provideSpartanNative({ host: dotnetHost() })
```

Implementers: follow `@spartan-native/host-wails` (its own repository, `Spartan-Native/host-wails`) as the reference adapter, and run `describeHostConformance` against a fake runtime.
