import {
  type AppearanceState,
  CAPABILITIES,
  type Capability,
  type CapabilityLevel,
  type HostCapabilities,
  type NativeHost,
  normalizeHex,
  type PlatformInfo,
  type Skin,
  type Unsubscribe,
} from '@spartan-native/theme';
import { detectPlatform, type NavigatorLike } from './detect-platform';
import { supportsFilePickers, webDialogs } from './web-dialogs';

export interface WebHostOptions {
  /** Accent used where the browser does not expose the system accent. Default: the platform's stock accent. */
  accent?: string;
  /** Force a skin instead of detecting it (e.g. a user setting). */
  skin?: Skin;
  /** The window to read from. Default: the global window. For tests and iframes. */
  window?: Window;
}

/** The platforms' stock accents, used when the browser hides the real one. */
const STOCK_ACCENT: Record<string, string> = {
  win: '#0078d4', w10: '#0078d4', mac: '#007aff', macc: '#007aff', gtk: '#3584e4', qt: '#3daee9', cros: '#0b57d0', web: '#0078d4',
};

/**
 * Chromium answers `AccentColor` with its own fixed blue instead of the OS accent
 * (to avoid fingerprinting). That value means "not exposed".
 */
const CHROMIUM_FIXED_ACCENT = '#0075ff';

const QUERIES = {
  dark: '(prefers-color-scheme: dark)',
  moreContrast: '(prefers-contrast: more)',
  forcedColors: '(forced-colors: active)',
  reduceTransparency: '(prefers-reduced-transparency: reduce)',
  reduceMotion: '(prefers-reduced-motion: reduce)',
} as const;

/**
 * NativeHost for browsers and installed PWAs. No native side.
 *
 * | Setting | Source | Live |
 * | --- | --- | --- |
 * | light / dark | `prefers-color-scheme` | yes |
 * | contrast | `prefers-contrast`, `forced-colors` | yes |
 * | reduce transparency | `prefers-reduced-transparency` (where supported) | yes |
 * | reduce motion | `prefers-reduced-motion` | yes |
 * | text size | the browser's default font size | yes (ResizeObserver) |
 * | accent | CSS `AccentColor` where the browser exposes the real one (Firefox, Safari), else `options.accent` / the platform's stock accent | on focus / visibility |
 * | window focus | `focus` / `blur` / `visibilitychange` | yes |
 * | OS and skin | User-Agent Client Hints, else the user-agent string | once |
 * | file dialogs | File System Access pickers (Chromium); absent elsewhere | – |
 *
 * ```ts
 * provideSpartanNative({ host: webHost() })
 * ```
 */
export function webHost(options: WebHostOptions = {}): NativeHost {
  const win: Window | undefined = options.window ?? (typeof window !== 'undefined' ? window : undefined);
  const doc = win?.document;

  const media = (q: string): MediaQueryList | null => (win?.matchMedia ? win.matchMedia(q) : null);
  const matches = (q: string) => media(q)?.matches ?? false;
  /** A media feature the browser understands (unknown ones parse to "not all"). */
  const supportsMedia = (q: string) => {
    const m = media(q);
    return !!m && m.media !== 'not all';
  };
  const css = (win as (Window & { CSS?: { supports?(property: string, value: string): boolean } }) | undefined)?.CSS;
  const supportsAccentColor = !!css?.supports?.('color', 'AccentColor');

  let platformPromise: Promise<PlatformInfo> | null = null;
  const platform = () =>
    (platformPromise ??= detectPlatform((win?.navigator ?? { userAgent: '' }) as unknown as NavigatorLike).then((p) =>
      options.skin ? { ...p, skin: options.skin } : p,
    ));

  // --- Readers ---------------------------------------------------------------
  const probe = doc ? createProbe(doc) : null;

  /** The real system accent, or null when the browser hides it. */
  const systemAccent = (): string | null => {
    if (!supportsAccentColor || !probe || !win) return null;
    const hex = rgbToHex(win.getComputedStyle(probe.accent).color);
    return hex && hex !== CHROMIUM_FIXED_ACCENT ? hex : null;
  };
  const exposesAccent = systemAccent() !== null;

  const readAccent = (skin: Skin): string =>
    systemAccent() ?? normalizeHex(options.accent ?? STOCK_ACCENT[skin] ?? STOCK_ACCENT['web']);

  const readTextScale = (): number => {
    const px = probe?.text.getBoundingClientRect().width ?? 16;
    return px > 0 ? Math.round((px / 16) * 20) / 20 : 1; // 0.05 steps
  };

  const read = (skin: Skin): AppearanceState => ({
    skin,
    accent: readAccent(skin),
    scheme: matches(QUERIES.dark) ? 'dark' : 'light',
    contrast: matches(QUERIES.forcedColors) ? 'forced' : matches(QUERIES.moreContrast) ? 'more' : 'normal',
    reduceTransparency: matches(QUERIES.reduceTransparency),
    reduceMotion: matches(QUERIES.reduceMotion),
    textScale: readTextScale(),
  });

  let skin: Skin = options.skin ?? 'web';
  let last: AppearanceState | null = null;
  const appearance = async () => {
    skin = (await platform()).skin;
    return (last = read(skin));
  };

  // --- Live changes ------------------------------------------------------------
  const appearanceListeners = new Set<(s: AppearanceState) => void>();
  const notify = () => {
    if (appearanceListeners.size === 0) return;
    const next = read(skin);
    if (last && sameAppearance(last, next)) return;
    last = next;
    appearanceListeners.forEach((cb) => cb(next));
  };

  let detach: (() => void) | null = null;
  const attach = () => {
    const offs: (() => void)[] = [];
    for (const q of Object.values(QUERIES)) {
      const m = media(q);
      if (!m) continue;
      m.addEventListener?.('change', notify);
      offs.push(() => m.removeEventListener?.('change', notify));
    }
    if (probe && typeof ResizeObserver !== 'undefined') {
      const ro = new ResizeObserver(notify);
      ro.observe(probe.text);
      offs.push(() => ro.disconnect());
    }
    // the accent has no change event: re-read when the user comes back to the app
    win?.addEventListener('focus', notify);
    doc?.addEventListener('visibilitychange', notify);
    offs.push(() => win?.removeEventListener('focus', notify), () => doc?.removeEventListener('visibilitychange', notify));
    return () => offs.forEach((off) => off());
  };

  const focusListeners = new Set<(f: boolean) => void>();
  const isFocused = () => (doc ? doc.hasFocus() && doc.visibilityState !== 'hidden' : true);
  let focusDetach: (() => void) | null = null;
  const onFocusEvent = () => {
    const f = isFocused();
    focusListeners.forEach((cb) => cb(f));
  };

  // --- Capabilities --------------------------------------------------------------
  const level = (ok: boolean, yes: CapabilityLevel = 'partial'): CapabilityLevel => (ok ? yes : 'none');
  const nav = win?.navigator as (Navigator & { windowControlsOverlay?: unknown; setAppBadge?: unknown; userAgentData?: unknown }) | undefined;
  const support: Partial<Record<Capability, CapabilityLevel>> = {
    // 'none' when the browser hides the OS accent (Chromium answers a fixed blue)
    systemAccent: level(exposesAccent),
    colorScheme: level(supportsMedia(QUERIES.dark), 'native'),
    highContrast: level(supportsMedia(QUERIES.forcedColors) || supportsMedia(QUERIES.moreContrast), 'native'),
    reduceTransparency: level(supportsMedia(QUERIES.reduceTransparency)),
    textScale: level(!!probe),
    windowFocus: level(!!doc, 'native'),
    customTitleBar: level(!!nav && 'windowControlsOverlay' in nav),
    notifications: level(!!win && 'Notification' in win),
    taskbarProgress: level(!!nav && 'setAppBadge' in nav),
    fileDialogs: level(supportsFilePickers(win)),
    osVersion: level(!!nav?.userAgentData),
  };
  const capabilities = Object.fromEntries(CAPABILITIES.map((c) => [c, support[c] ?? 'none'])) as HostCapabilities;

  return {
    runtime: 'web',
    capabilities,
    platform,
    appearance,
    onAppearanceChange(cb): Unsubscribe {
      appearanceListeners.add(cb);
      detach ??= attach();
      return () => {
        appearanceListeners.delete(cb);
        if (appearanceListeners.size === 0) {
          detach?.();
          detach = null;
        }
      };
    },
    window: {
      isFocused: async () => isFocused(),
      onFocusChange(cb): Unsubscribe {
        focusListeners.add(cb);
        if (!focusDetach && win && doc) {
          win.addEventListener('focus', onFocusEvent);
          win.addEventListener('blur', onFocusEvent);
          doc.addEventListener('visibilitychange', onFocusEvent);
          focusDetach = () => {
            win.removeEventListener('focus', onFocusEvent);
            win.removeEventListener('blur', onFocusEvent);
            doc.removeEventListener('visibilitychange', onFocusEvent);
          };
        }
        return () => {
          focusListeners.delete(cb);
          if (focusListeners.size === 0) {
            focusDetach?.();
            focusDetach = null;
          }
        };
      },
    },
    ...(win && supportsFilePickers(win) ? { dialogs: webDialogs(win) } : {}),
  };
}

/** Two hidden elements: one colored with AccentColor, one 1em wide at the browser's default font size. */
function createProbe(doc: Document): { accent: HTMLElement; text: HTMLElement } {
  const host = doc.createElement('div');
  host.setAttribute('aria-hidden', 'true');
  host.dataset['snWebHostProbe'] = '';
  host.style.cssText = 'position:absolute;width:0;height:0;overflow:hidden;visibility:hidden;pointer-events:none';
  const accent = doc.createElement('span');
  accent.style.cssText = 'color:AccentColor';
  const text = doc.createElement('span');
  // `medium` is the user's default font size, independent of the page's root font-size
  text.style.cssText = 'display:block;font-size:medium;width:1em;height:1px';
  host.append(accent, text);
  (doc.body ?? doc.documentElement).append(host);
  return { accent, text };
}

function rgbToHex(color: string): string | null {
  const m = color.match(/rgba?\(\s*(\d+)[\s,]+(\d+)[\s,]+(\d+)/i);
  if (!m) return null;
  return '#' + [m[1], m[2], m[3]].map((v) => Number(v).toString(16).padStart(2, '0')).join('');
}

function sameAppearance(a: AppearanceState, b: AppearanceState): boolean {
  return (
    a.accent === b.accent && a.scheme === b.scheme && a.contrast === b.contrast && a.reduceTransparency === b.reduceTransparency &&
    a.reduceMotion === b.reduceMotion && a.textScale === b.textScale && a.skin === b.skin
  );
}
