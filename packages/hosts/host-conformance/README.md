# @spartan-native/host-conformance

**The test suite every `@spartan-native/host-*` adapter must pass.** It is framework-free. Use it from any test runner, or as a function that returns a report.

> Status: **implemented.** `webHost` and `staticHost` pass it. Spec: [`07-host-adapters.md`](../../../docs/07-host-adapters.md).

## In a test runner (Vitest, Jest, Jasmine)

```ts
import { describeHostConformance } from '@spartan-native/host-conformance';

describeHostConformance('wailsHost', () => {
  const runtime = fakeWailsRuntime();
  return {
    host: wailsHost({ runtime }),
    // optional: lets the suite simulate the OS, so the live checks run too
    driver: {
      setAppearance: (patch) => runtime.emitThemeChange(patch),
      setFocused: (focused) => runtime.emitFocus(focused),
    },
  };
});
```

Each check becomes one test, so a failure names exactly what is wrong. Without a driver, the live checks are skipped (logged) rather than failed.

## As a function

```ts
const report = await checkHostConformance(host, driver);
report.passed;   // false if any check failed
report.results;  // [{ id, title, status: 'pass' | 'fail' | 'skip', detail? }]
```

## The checks

| id | Checks |
| --- | --- |
| `runtime` | `runtime` is a known runtime |
| `capabilities` | every capability is present and is `native`, `partial` or `none` |
| `platform` | `platform()` resolves a valid `PlatformInfo` |
| `appearance` | `appearance()` resolves a valid `AppearanceState` (`#rrggbb` accent, enums, booleans, text scale) |
| `skin-agrees` | `appearance().skin` equals `platform().skin` |
| `focus` | `window.isFocused()` resolves a boolean |
| `unsubscribe` | subscriptions return an unsubscribe function, safe to call twice |
| `graceful` | nothing throws for capabilities reported as `none` |
| `live-appearance` | *(driver)* an OS change is notified, with the new values |
| `live-appearance-stops` | *(driver)* no notifications after unsubscribe |
| `live-focus` | *(driver)* focus changes are notified |

Validators `validatePlatform()` and `validateAppearance()` are exported for adapters' own tests.
