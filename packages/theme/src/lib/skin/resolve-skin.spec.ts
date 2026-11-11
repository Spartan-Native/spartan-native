import { resolveSkin, skinClasses } from './resolve-skin';

describe('resolveSkin', () => {
  it.each([
    [{ os: 'windows', version: '10.0.22631', build: 22631, desktop: null }, 'win'],
    [{ os: 'windows', version: '10.0.19045', build: 19045, desktop: null }, 'w10'],
    [{ os: 'macos', version: '26.1', build: null, desktop: null }, 'mac'],
    [{ os: 'macos', version: '15.6', build: null, desktop: null }, 'macc'],
    [{ os: 'linux', version: null, build: null, desktop: 'gnome' }, 'gtk'],
    [{ os: 'linux', version: null, build: null, desktop: 'xfce' }, 'gtk'],
    [{ os: 'linux', version: null, build: null, desktop: 'kde' }, 'qt'],
    [{ os: 'chromeos', version: null, build: null, desktop: null }, 'cros'],
    [{ os: 'unknown', version: null, build: null, desktop: null }, 'web'],
  ] as const)('%o → %s', (info, skin) => {
    expect(resolveSkin(info)).toBe(skin);
  });

  it('gives variants their family class', () => {
    expect(skinClasses('w10')).toEqual(['t-win', 't-w10']);
    expect(skinClasses('macc')).toEqual(['t-mac', 't-macc']);
    expect(skinClasses('gtk')).toEqual(['t-gtk']);
  });
});
