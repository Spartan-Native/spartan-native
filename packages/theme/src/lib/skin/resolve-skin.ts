import type { PlatformInfo, Skin } from '../contract/native-host';

/**
 * The fallback table from docs/07-host-adapters.md: detected OS → skin.
 * Cinnamon, XFCE and unknown Linux desktops use GTK (docs/10-open-questions.md, Q7).
 */
export function resolveSkin(info: Pick<PlatformInfo, 'os' | 'version' | 'build' | 'desktop'>): Skin {
  switch (info.os) {
    case 'windows':
      return info.build !== null && info.build < 22000 ? 'w10' : 'win';
    case 'macos': {
      const major = info.version ? parseInt(info.version, 10) : NaN;
      return Number.isFinite(major) && major < 26 ? 'macc' : 'mac';
    }
    case 'linux':
      return info.desktop === 'kde' ? 'qt' : 'gtk';
    case 'chromeos':
      return 'cros';
    default:
      return 'web';
  }
}

/**
 * Root classes per skin. Variants inherit their parent family:
 * `w10` also gets `t-win`, `macc` also gets `t-mac`.
 */
export function skinClasses(skin: Skin): string[] {
  switch (skin) {
    case 'w10':
      return ['t-win', 't-w10'];
    case 'macc':
      return ['t-mac', 't-macc'];
    default:
      return [`t-${skin}`];
  }
}
