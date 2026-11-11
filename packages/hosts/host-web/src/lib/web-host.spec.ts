import { describeHostConformance, type HostDriver } from '@spartan-native/host-conformance';
import type { AppearanceState } from '@spartan-native/theme';
import { fromClientHints, fromUserAgent } from './detect-platform';
import { webHost } from './web-host';

/** A browser window whose media queries, accent and focus a test can change. */
function fakeBrowser(init: { dark?: boolean; accent?: string | null; platform?: string; platformVersion?: string } = {}) {
  const state = {
    dark: init.dark ?? false,
    moreContrast: false,
    forced: false,
    reduceTransparency: false,
    reduceMotion: false,
    accent: init.accent === undefined ? 'rgb(230, 97, 0)' : init.accent,
    focused: true,
  };
  const QUERY_STATE: Record<string, keyof typeof state> = {
    '(prefers-color-scheme: dark)': 'dark',
    '(prefers-contrast: more)': 'moreContrast',
    '(forced-colors: active)': 'forced',
    '(prefers-reduced-transparency: reduce)': 'reduceTransparency',
    '(prefers-reduced-motion: reduce)': 'reduceMotion',
  };
  const lists = new Map<string, EventTarget & { media: string; readonly matches: boolean }>();
  const matchMedia = (q: string) => {
    if (!lists.has(q)) {
      const target = new EventTarget() as EventTarget & { media: string; matches: boolean };
      Object.defineProperty(target, 'media', { value: q });
      Object.defineProperty(target, 'matches', { get: () => !!state[QUERY_STATE[q]] });
      lists.set(q, target);
    }
    return lists.get(q)!;
  };
  const events = new EventTarget();
  vi.spyOn(document, 'hasFocus').mockImplementation(() => state.focused);

  const win = {
    document,
    navigator: {
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
      userAgentData: init.platform
        ? { platform: init.platform, getHighEntropyValues: async () => ({ platformVersion: init.platformVersion }) }
        : undefined,
    },
    CSS: { supports: (_p: string, v: string) => v === 'AccentColor' && state.accent !== null },
    matchMedia,
    getComputedStyle: (el: Element) =>
      (el as HTMLElement).style.color === 'accentcolor' || (el as HTMLElement).style.cssText.includes('AccentColor')
        ? ({ color: state.accent ?? '' } as CSSStyleDeclaration)
        : window.getComputedStyle(el),
    addEventListener: events.addEventListener.bind(events),
    removeEventListener: events.removeEventListener.bind(events),
  } as unknown as Window;

  const driver: HostDriver = {
    setAppearance(patch: Partial<AppearanceState>) {
      if (patch.scheme) state.dark = patch.scheme === 'dark';
      if (patch.reduceTransparency !== undefined) state.reduceTransparency = patch.reduceTransparency;
      for (const [q, key] of Object.entries(QUERY_STATE)) {
        if (key === 'dark' || key === 'reduceTransparency') matchMedia(q).dispatchEvent(new Event('change'));
      }
    },
    setFocused(focused: boolean) {
      state.focused = focused;
      events.dispatchEvent(new Event(focused ? 'focus' : 'blur'));
    },
  };
  return { win, state, driver };
}

afterEach(() => vi.restoreAllMocks());

// The shared suite every adapter must pass
describeHostConformance('webHost', () => {
  const { win, driver } = fakeBrowser({ platform: 'Windows', platformVersion: '15.0.0' });
  return { host: webHost({ window: win }), driver };
});

describe('webHost', () => {
  it('reads the OS settings from the browser', async () => {
    const { win } = fakeBrowser({ dark: true, platform: 'macOS', platformVersion: '26.1.0' });
    const a = await webHost({ window: win }).appearance();
    expect(a).toMatchObject({ skin: 'mac', scheme: 'dark', accent: '#e66100', contrast: 'normal', reduceTransparency: false });
  });

  it('reports live changes to transparency and dark mode', async () => {
    const { win, driver } = fakeBrowser({ platform: 'Linux' });
    const host = webHost({ window: win });
    await host.appearance();
    const seen: AppearanceState[] = [];
    const off = host.onAppearanceChange((s) => seen.push(s));
    await driver.setAppearance!({ reduceTransparency: true });
    await driver.setAppearance!({ scheme: 'dark' });
    off();
    expect(seen.map((s) => [s.reduceTransparency, s.scheme])).toEqual([
      [true, 'light'],
      [true, 'dark'],
    ]);
  });

  it('falls back to the stock accent when AccentColor is unavailable', async () => {
    const { win } = fakeBrowser({ accent: null, platform: 'Linux' });
    const host = webHost({ window: win });
    expect((await host.appearance()).accent).toBe('#3584e4'); // GNOME blue
    expect(host.capabilities.systemAccent).toBe('none');
    expect((await webHost({ window: win, accent: '#9141ac' }).appearance()).accent).toBe('#9141ac');
  });

  it("ignores Chromium's fixed AccentColor and uses the platform's stock accent", async () => {
    const { win } = fakeBrowser({ accent: 'rgb(0, 117, 255)', platform: 'macOS', platformVersion: '26.0.0' });
    const host = webHost({ window: win });
    expect((await host.appearance()).accent).toBe('#007aff'); // macOS blue
    expect(host.capabilities.systemAccent).toBe('none');
  });

  it('honours a skin override', async () => {
    const { win } = fakeBrowser({ platform: 'Windows', platformVersion: '15.0.0' });
    const host = webHost({ window: win, skin: 'gtk' });
    expect((await host.platform()).skin).toBe('gtk');
    expect((await host.appearance()).skin).toBe('gtk');
  });

  it('works without a window (server-side rendering)', async () => {
    const host = webHost({ window: undefined as unknown as Window });
    // no global window either in this call path: the defaults must still validate
    expect(host.runtime).toBe('web');
  });
});

describe('detectPlatform', () => {
  it('tells Windows 11 from 10 with Client Hints', () => {
    expect(fromClientHints('Windows', '15.0.0').skin).toBe('win');
    expect(fromClientHints('Windows', '10.0.0').skin).toBe('w10');
    expect(fromClientHints('Windows', '15.0.0').confidence).toBe('exact');
  });

  it('uses the real macOS version', () => {
    expect(fromClientHints('macOS', '26.1.0').skin).toBe('mac');
    expect(fromClientHints('macOS', '15.6.1').skin).toBe('macc');
  });

  it('falls back to the user-agent string', () => {
    expect(fromUserAgent('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)')).toMatchObject({ os: 'macos', skin: 'mac', confidence: 'hint' });
    expect(fromUserAgent('Mozilla/5.0 (X11; Linux x86_64)')).toMatchObject({ os: 'linux', skin: 'gtk' });
    expect(fromUserAgent('Mozilla/5.0 (X11; CrOS x86_64 14541.0.0)').skin).toBe('cros');
    expect(fromUserAgent('Mozilla/5.0 (iPhone; CPU iPhone OS 18_0)').skin).toBe('web');
  });
});

import { readDisplayMode, watchDisplayMode } from './display-mode';

describe('display mode', () => {
  const fakeWin = (matching: string[], overlayVisible = false) => {
    const overlay = Object.assign(new EventTarget(), { visible: overlayVisible });
    return {
      win: {
        navigator: { windowControlsOverlay: overlay },
        matchMedia: (q: string) => Object.assign(new EventTarget(), { matches: matching.includes(q), media: q }),
      } as unknown as Window,
      overlay,
    };
  };

  it('tells a tab, an installed window and Window Controls Overlay apart', () => {
    expect(readDisplayMode(fakeWin([]).win)).toBe('browser');
    expect(readDisplayMode(fakeWin(['(display-mode: standalone)']).win)).toBe('standalone');
    expect(readDisplayMode(fakeWin(['(display-mode: standalone)'], true).win)).toBe('overlay');
  });

  it('reports overlay geometry changes (the user toggling the title bar)', () => {
    const { win, overlay } = fakeWin(['(display-mode: standalone)'], true);
    const seen: string[] = [];
    const off = watchDisplayMode((m) => seen.push(m), win);
    overlay.visible = false;
    overlay.dispatchEvent(new Event('geometrychange'));
    off();
    expect(seen).toEqual(['overlay', 'standalone']);
  });
});
