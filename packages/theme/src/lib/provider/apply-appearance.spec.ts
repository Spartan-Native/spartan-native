import { DEFAULT_APPEARANCE } from '../contract/native-host';
import { applySpartanNative } from './apply-appearance';

describe('applySpartanNative', () => {
  it('sets classes and variables, and replaces only the classes it owns', () => {
    const root = document.createElement('div');
    root.classList.add('my-app', 't-gtk');
    applySpartanNative(root, {
      ...DEFAULT_APPEARANCE,
      skin: 'mac',
      scheme: 'dark',
      reduceTransparency: true,
      focused: false,
      textScale: 1.5,
    });

    expect([...root.classList].sort()).toEqual(['dark', 'inactive', 'my-app', 'rt', 't-mac']);
    expect(root.dataset['snSkin']).toBe('mac');
    expect(root.style.getPropertyValue('--sn-text-scale')).toBe('1.5');
    expect(root.style.getPropertyValue('--sn-color-primary')).toMatch(/^#/);

    applySpartanNative(root, { ...DEFAULT_APPEARANCE, skin: 'win', focused: true });
    expect([...root.classList].sort()).toEqual(['my-app', 't-win']);
  });
});

import { TestBed } from '@angular/core/testing';
import { injectSkin, skinFamily } from './inject-skin';

describe('injectSkin', () => {
  it('follows data-sn-skin when no provider is present', async () => {
    document.documentElement.dataset['snSkin'] = 'gtk';
    const skin = TestBed.runInInjectionContext(() => injectSkin());
    expect(skin()).toBe('gtk');
    document.documentElement.dataset['snSkin'] = 'mac';
    await new Promise((r) => setTimeout(r));
    expect(skin()).toBe('mac');
  });

  it('maps skins to families', () => {
    expect(skinFamily('w10')).toBe('windows');
    expect(skinFamily('macc')).toBe('macos');
    expect(skinFamily('qt')).toBe('linux');
    expect(skinFamily('web')).toBe('web');
  });
});
