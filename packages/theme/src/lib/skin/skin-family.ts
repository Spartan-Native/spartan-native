import type { Skin } from '../contract/native-host';

/** The OS family a skin belongs to: what window chrome and shortcuts follow. */
export type PlatformFamily = 'windows' | 'macos' | 'linux' | 'chromeos' | 'web';

export function skinFamily(skin: Skin): PlatformFamily {
  switch (skin) {
    case 'win':
    case 'w10':
      return 'windows';
    case 'mac':
    case 'macc':
      return 'macos';
    case 'gtk':
    case 'qt':
      return 'linux';
    case 'cros':
      return 'chromeos';
    default:
      return 'web';
  }
}
