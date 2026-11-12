import {
  type AppearanceState,
  CAPABILITIES,
  type NativeHost,
  type PlatformInfo,
  type Skin,
} from '@spartan-native/theme';

/**
 * Lets the suite simulate the OS, so the live-event checks can run.
 * Adapters that can't be driven in a test omit it; those checks are then skipped.
 */
export interface HostDriver {
  /** Change what the OS reports (e.g. flip dark mode, change the accent). */
  setAppearance?(patch: Partial<AppearanceState>): void | Promise<void>;
  /** Focus or blur the window. */
  setFocused?(focused: boolean): void | Promise<void>;
}

export type CheckStatus = 'pass' | 'fail' | 'skip';

export interface CheckResult {
  readonly id: string;
  readonly title: string;
  readonly status: CheckStatus;
  readonly detail?: string;
}

export interface ConformanceReport {
  readonly runtime: string;
  readonly passed: boolean;
  readonly results: readonly CheckResult[];
}

const RUNTIMES = ['web', 'wails', 'tauri', 'electron', 'dotnet', 'static'];
const SKINS: Skin[] = ['win', 'w10', 'mac', 'macc', 'gtk', 'qt', 'cros', 'web'];
const OSES = ['windows', 'macos', 'linux', 'chromeos', 'unknown'];
const DESKTOPS = ['gnome', 'kde', 'cinnamon', 'xfce', 'other', null];
const LEVELS = ['native', 'partial', 'none'];

/** One check: throws to fail, throws SkipCheck to skip. */
export interface Check {
  readonly id: string;
  readonly title: string;
  run(host: NativeHost, driver: HostDriver): Promise<void> | void;
}

class CheckFailed extends Error {}

/** Thrown when a check can't run for this host (e.g. no driver to simulate the OS). */
export class SkipCheck extends Error {}

const expect = (ok: unknown, message: string) => {
  if (!ok) throw new CheckFailed(message);
};
const skip = (reason: string): never => {
  throw new SkipCheck(reason);
};

/** Waits until `cb` has been called (or the timeout passes) and returns what it received. */
function capture<T>(subscribe: (cb: (v: T) => void) => () => void, timeoutMs = 500) {
  const received: T[] = [];
  const unsubscribe = subscribe((v) => received.push(v));
  const next = (count = 1) =>
    new Promise<T[]>((resolve) => {
      const started = Date.now();
      const poll = () =>
        received.length >= count || Date.now() - started > timeoutMs ? resolve(received) : setTimeout(poll, 5);
      poll();
    });
  return { received, unsubscribe, next };
}

export function validatePlatform(p: PlatformInfo): void {
  expect(OSES.includes(p.os), `platform().os is "${p.os}"; expected one of ${OSES.join(', ')}`);
  expect(SKINS.includes(p.skin), `platform().skin is "${p.skin}"; expected one of ${SKINS.join(', ')}`);
  expect(['exact', 'hint', 'unknown'].includes(p.confidence), `platform().confidence is "${p.confidence}"`);
  expect(p.version === null || typeof p.version === 'string', 'platform().version must be a string or null');
  expect(p.build === null || Number.isInteger(p.build), 'platform().build must be an integer or null');
  expect(DESKTOPS.includes(p.desktop), `platform().desktop is "${p.desktop}"`);
}

export function validateAppearance(a: AppearanceState): void {
  expect(SKINS.includes(a.skin), `appearance().skin is "${a.skin}"`);
  expect(/^#[0-9a-f]{6}$/i.test(a.accent), `appearance().accent is "${a.accent}"; expected #rrggbb`);
  expect(a.scheme === 'light' || a.scheme === 'dark', `appearance().scheme is "${a.scheme}"`);
  expect(['normal', 'more', 'forced'].includes(a.contrast), `appearance().contrast is "${a.contrast}"`);
  expect(typeof a.reduceTransparency === 'boolean', 'appearance().reduceTransparency must be a boolean');
  expect(typeof a.reduceMotion === 'boolean', 'appearance().reduceMotion must be a boolean');
  expect(
    typeof a.textScale === 'number' && a.textScale >= 0.5 && a.textScale <= 4,
    `appearance().textScale is ${a.textScale}`,
  );
}

/** The checks, in order. Exported so runners can show them as separate tests. */
export const CHECKS: readonly Check[] = [
  {
    id: 'runtime',
    title: 'declares a known runtime',
    run: (h) =>
      expect(RUNTIMES.includes(h.runtime), `runtime is "${h.runtime}"; expected one of ${RUNTIMES.join(', ')}`),
  },
  {
    id: 'capabilities',
    title: 'reports every capability as native, partial or none',
    run: (h) => {
      for (const c of CAPABILITIES) {
        expect(c in h.capabilities, `capability "${c}" is missing`);
        expect(LEVELS.includes(h.capabilities[c]), `capability "${c}" is "${h.capabilities[c]}"`);
      }
    },
  },
  {
    id: 'platform',
    title: 'platform() resolves a valid PlatformInfo',
    run: async (h) => validatePlatform(await h.platform()),
  },
  {
    id: 'appearance',
    title: 'appearance() resolves a valid AppearanceState',
    run: async (h) => validateAppearance(await h.appearance()),
  },
  {
    id: 'skin-agrees',
    title: 'appearance().skin agrees with platform().skin',
    run: async (h) => {
      const [p, a] = await Promise.all([h.platform(), h.appearance()]);
      expect(p.skin === a.skin, `platform().skin is "${p.skin}" but appearance().skin is "${a.skin}"`);
    },
  },
  {
    id: 'focus',
    title: 'window.isFocused() resolves a boolean',
    run: async (h) => expect(typeof (await h.window.isFocused()) === 'boolean', 'isFocused() must resolve a boolean'),
  },
  {
    id: 'menus-match-capability',
    title: 'menus are present exactly when nativeMenus is not none',
    run: (h) => {
      const level = h.capabilities.nativeMenus;
      const m = h.menus;
      if (level === 'none') {
        expect(!m, 'nativeMenus is "none" but the host has menus');
        return;
      }
      expect(m, `nativeMenus is "${level}" but the host has no menus`);
      expect(typeof m!.onAction === 'function', 'menus.onAction must be a function');
      expect(m!.setApplicationMenu || m!.showContextMenu, 'menus must offer setApplicationMenu() or showContextMenu()');
      const off = m!.onAction(() => undefined);
      expect(typeof off === 'function', 'menus.onAction must return an unsubscribe function');
      off();
      off();
    },
  },
  {
    id: 'dialogs-match-capability',
    title: 'dialogs are present exactly when fileDialogs is not none',
    run: (h) => {
      const level = h.capabilities.fileDialogs;
      const d = h.dialogs;
      if (level === 'none') {
        expect(!d, 'fileDialogs is "none" but the host has dialogs');
        return;
      }
      expect(d, `fileDialogs is "${level}" but the host has no dialogs`);
      for (const m of ['openFile', 'saveFile', 'pickFolder'] as const)
        expect(typeof d![m] === 'function', `dialogs.${m} must be a function`);
      expect(
        d!.message === undefined || typeof d!.message === 'function',
        'dialogs.message must be a function when present',
      );
    },
  },
  {
    id: 'unsubscribe',
    title: 'subscriptions return an unsubscribe function that can be called twice',
    run: (h) => {
      const offA = h.onAppearanceChange(() => undefined);
      const offF = h.window.onFocusChange(() => undefined);
      expect(typeof offA === 'function' && typeof offF === 'function', 'subscribe must return a function');
      offA();
      offA();
      offF();
      offF();
    },
  },
  {
    id: 'graceful',
    title: "never throws for capabilities it reports as 'none'",
    run: async (h) => {
      // Optional services must be absent rather than throwing when unsupported.
      if (h.capabilities.nativeMenus === 'none')
        expect(h.menus === undefined || typeof h.menus === 'object', 'menus must be undefined or an object');
      if (h.capabilities.notifications === 'none')
        expect(
          h.notifications === undefined || typeof h.notifications === 'object',
          'notifications must be undefined or an object',
        );
      await h.platform();
      await h.appearance();
    },
  },
  {
    id: 'live-appearance',
    title: 'notifies appearance changes, with the new values',
    run: async (h, d) => {
      if (!d.setAppearance) skip('no driver.setAppearance');
      const before = await h.appearance();
      const scheme = before.scheme === 'dark' ? 'light' : 'dark';
      const sub = capture<AppearanceState>((cb) => h.onAppearanceChange(cb));
      await d.setAppearance!({ scheme });
      const got = await sub.next();
      sub.unsubscribe();
      expect(got.length > 0, 'onAppearanceChange did not fire after the scheme changed');
      validateAppearance(got[got.length - 1]);
      expect(got[got.length - 1].scheme === scheme, `expected scheme "${scheme}", got "${got[got.length - 1].scheme}"`);
      await d.setAppearance!({ scheme: before.scheme });
    },
  },
  {
    id: 'live-appearance-stops',
    title: 'stops notifying after unsubscribe',
    run: async (h, d) => {
      if (!d.setAppearance) skip('no driver.setAppearance');
      const before = await h.appearance();
      const sub = capture<AppearanceState>((cb) => h.onAppearanceChange(cb), 120);
      sub.unsubscribe();
      await d.setAppearance!({ scheme: before.scheme === 'dark' ? 'light' : 'dark' });
      const got = await sub.next();
      await d.setAppearance!({ scheme: before.scheme });
      expect(got.length === 0, 'onAppearanceChange fired after unsubscribe');
    },
  },
  {
    id: 'live-focus',
    title: 'notifies window focus changes',
    run: async (h, d) => {
      if (!d.setFocused) skip('no driver.setFocused');
      const sub = capture<boolean>((cb) => h.window.onFocusChange(cb));
      await d.setFocused!(false);
      await d.setFocused!(true);
      const got = await sub.next(2);
      sub.unsubscribe();
      expect(got.includes(false) && got[got.length - 1] === true, `expected [false … true], got [${got.join(', ')}]`);
    },
  },
];

/**
 * Runs every check against a host and returns a report. Never throws.
 *
 * ```ts
 * const report = await checkHostConformance(wailsHost(), driver);
 * if (!report.passed) console.table(report.results);
 * ```
 */
export async function checkHostConformance(host: NativeHost, driver: HostDriver = {}): Promise<ConformanceReport> {
  const results: CheckResult[] = [];
  for (const check of CHECKS) {
    try {
      await check.run(host, driver);
      results.push({ id: check.id, title: check.title, status: 'pass' });
    } catch (e) {
      const skipped = e instanceof SkipCheck;
      results.push({
        id: check.id,
        title: check.title,
        status: skipped ? 'skip' : 'fail',
        detail: e instanceof Error ? e.message : String(e),
      });
    }
  }
  return { runtime: host.runtime, passed: results.every((r) => r.status !== 'fail'), results };
}
