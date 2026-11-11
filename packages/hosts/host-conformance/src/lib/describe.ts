import type { NativeHost } from '@spartan-native/theme';
import { CHECKS, type HostDriver, SkipCheck } from './conformance';

type Describe = (name: string, body: () => void) => void;
type It = (name: string, body: () => Promise<void> | void) => void;

interface TestGlobals {
  describe?: Describe;
  it?: It;
}

/** What a factory returns: a fresh host, and optionally a driver that simulates the OS. */
export interface HostUnderTest {
  host: NativeHost;
  driver?: HostDriver;
}

/**
 * Registers the conformance suite with the test runner in use (Vitest, Jest, Jasmine:
 * anything with global `describe` / `it`). Each check becomes one test, so a
 * failure names exactly what is wrong. Skipped checks pass and say why.
 *
 * ```ts
 * // host-wails/src/lib/wails-host.spec.ts
 * describeHostConformance('wailsHost', () => ({ host: wailsHost({ runtime: fakeWailsRuntime() }), driver }));
 * ```
 */
export function describeHostConformance(name: string, factory: () => HostUnderTest | Promise<HostUnderTest>): void {
  const g = globalThis as TestGlobals;
  if (!g.describe || !g.it) throw new Error('describeHostConformance needs global describe/it (enable your runner\'s globals).');
  const { describe, it } = g as Required<TestGlobals>;

  describe(`${name} · host conformance`, () => {
    for (const check of CHECKS) {
      it(check.title, async () => {
        const { host, driver = {} } = await factory();
        try {
          await check.run(host, driver);
        } catch (e) {
          if (!(e instanceof SkipCheck)) throw e;
          // Runners differ in how they skip at runtime; log it and pass.
          console.info(`[${name}] skipped "${check.title}": ${e.message}`);
        }
      });
    }
  });
}
