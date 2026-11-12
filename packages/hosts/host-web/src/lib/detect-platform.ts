import { type PlatformInfo, resolveSkin, type Skin } from '@spartan-native/theme';

/** The subset of User-Agent Client Hints this adapter reads (Chromium). */
export interface UserAgentDataLike {
  readonly platform?: string;
  getHighEntropyValues?(hints: string[]): Promise<{ platformVersion?: string }>;
}

export interface NavigatorLike {
  readonly userAgent: string;
  readonly userAgentData?: UserAgentDataLike;
}

/**
 * The OS, its version and the matching skin, from the browser.
 *
 * - Chromium (User-Agent Client Hints): the real OS version. On Windows,
 *   platformVersion ≥ 13 means Windows 11; on macOS it is the real macOS version.
 *   confidence: 'exact'.
 * - Other browsers: the user-agent string, where Windows and macOS versions are
 *   frozen. Windows → Windows 11, macOS → macOS 26 (the current releases).
 *   confidence: 'hint'.
 * - The Linux desktop (GNOME / KDE) is never visible to a web page: GTK is assumed.
 */
export async function detectPlatform(nav: NavigatorLike): Promise<PlatformInfo> {
  const uaData = nav.userAgentData;
  if (uaData?.platform) {
    let version: string | null;
    try {
      version = (await uaData.getHighEntropyValues?.(['platformVersion']))?.platformVersion ?? null;
    } catch {
      version = null; // permission policy can block high-entropy hints
    }
    return fromClientHints(uaData.platform, version);
  }
  return fromUserAgent(nav.userAgent);
}

function info(
  os: PlatformInfo['os'],
  version: string | null,
  confidence: PlatformInfo['confidence'],
  skin?: Skin,
): PlatformInfo {
  const base = { os, version, build: null, desktop: null } as const;
  return { ...base, skin: skin ?? resolveSkin(base), confidence };
}

export function fromClientHints(platform: string, version: string | null): PlatformInfo {
  const major = version ? parseInt(version, 10) : NaN;
  switch (platform.toLowerCase()) {
    case 'windows':
      // Client Hints: 1–10 = Windows 10, ≥ 13 = Windows 11
      return info(
        'windows',
        version,
        version ? 'exact' : 'hint',
        Number.isFinite(major) && major > 0 && major < 13 ? 'w10' : 'win',
      );
    case 'macos':
      return info('macos', version, version ? 'exact' : 'hint');
    case 'chrome os':
    case 'chromeos':
      return info('chromeos', version, 'exact');
    case 'linux':
      return info('linux', version, 'hint');
    default:
      return info('unknown', version, 'unknown');
  }
}

export function fromUserAgent(ua: string): PlatformInfo {
  if (/Android|iPhone|iPad|iPod/i.test(ua)) return info('unknown', null, 'unknown');
  if (/Windows NT/i.test(ua)) return info('windows', null, 'hint', 'win');
  if (/Mac OS X|Macintosh/i.test(ua)) return info('macos', null, 'hint', 'mac');
  if (/CrOS/i.test(ua)) return info('chromeos', null, 'hint');
  if (/Linux/i.test(ua)) return info('linux', null, 'hint');
  return info('unknown', null, 'unknown');
}
