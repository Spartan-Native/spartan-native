import type { PlatformInfo, Skin } from '../contract/native-host';

/**
 * Detected OS → skin. Windows before build 22000 is Windows 10, macOS before 26 is the
 * classic macOS skin, and every Linux desktop except KDE (GNOME, Cinnamon, XFCE, unknown) uses GTK.
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
