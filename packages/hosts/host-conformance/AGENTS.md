# AGENTS.md: @spartan-native/host-conformance

Instructions for AI coding agents writing or testing a `NativeHost` adapter.

## What this package is

The test suite every `@spartan-native/host-*` adapter must pass. It has no framework dependency: use it from Vitest, Jest or Jasmine, or call it as a plain function. An app doesn't need it at runtime. Use it in adapter tests, or in a custom host you write for your own runtime.

## Public API (`import … from '@spartan-native/host-conformance'`)

| Symbol | Use |
| --- | --- |
| `describeHostConformance(name, () => ({ host, driver? }))` | Registers one test per check in the current runner |
| `checkHostConformance(host, driver?)` | Runs every check and resolves `{ runtime, passed, results: [{ id, title, status, detail? }] }`. Never throws |
| `CHECKS`, `Check`, `SkipCheck` | The checks themselves, for custom runners |
| `HostDriver` | `{ setAppearance?(patch), setFocused?(focused) }`: lets the suite simulate the OS so the live checks run |
| `validatePlatform()`, `validateAppearance()` | Shape validators for an adapter's own tests |

```ts
describeHostConformance('myHost', () => {
  const runtime = fakeRuntime();
  return {
    host: myHost({ runtime }),
    driver: { setAppearance: (p) => runtime.emitTheme(p), setFocused: (f) => runtime.emitFocus(f) },
  };
});
```

## What a host must satisfy

- `runtime` is known. Every capability is `native`, `partial` or `none`. `platform()` and `appearance()` return valid shapes, and their skins agree.
- `menus` is present **exactly** when `nativeMenus !== 'none'`, with `onAction` plus `setApplicationMenu` or `showContextMenu`.
- `dialogs` is present **exactly** when `fileDialogs !== 'none'`, with `openFile`, `saveFile` and `pickFolder` (`message` is optional).
- Every subscribe returns an unsubscribe function that's safe to call twice. Nothing throws for capabilities reported as `none`.
- With a driver: appearance and focus changes are notified, and stop after unsubscribing.

## Rules for adapter authors

1. Report capabilities honestly. Use `partial` when it works only in some cases, and leave an optional service out entirely instead of shipping one that throws.
2. A cancelled dialog resolves `[]` or `null`. It must never reject.
3. Every new adapter's spec runs `describeHostConformance` with a fake runtime and a driver.
