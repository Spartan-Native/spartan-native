import { ApplicationRef } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { staticHost } from '../contract/static-host';
import { provideSpartanNative } from './provide-spartan-native';
import { DEFAULT_PERSIST_KEY, readStoredOverrides, SpartanNativeTheme } from './spartan-native-theme';

describe('SpartanNativeTheme', () => {
  it('follows the host, applies overrides and keeps <html> in sync', async () => {
    const host = staticHost({ skin: 'gtk' });
    TestBed.configureTestingModule({ providers: [provideSpartanNative({ host })] });
    const theme = TestBed.inject(SpartanNativeTheme);
    await theme.init();
    TestBed.inject(ApplicationRef).tick();
    const html = document.documentElement;
    expect(html.classList.contains('t-gtk')).toBe(true);

    host.set({ scheme: 'dark' });
    host.setFocused(false);
    TestBed.inject(ApplicationRef).tick();
    expect(html.classList.contains('dark')).toBe(true);
    expect(html.classList.contains('inactive')).toBe(true);

    theme.override({ skin: 'mac' });
    TestBed.inject(ApplicationRef).tick();
    expect(theme.skin()).toBe('mac');
    expect(html.classList.contains('t-mac')).toBe(true);
    expect(html.classList.contains('t-gtk')).toBe(false);

    expect(theme.followsSystem()).toBe(false);
    expect(theme.overrides()).toEqual({ skin: 'mac' });

    theme.followSystem();
    expect(theme.skin()).toBe('gtk');
    expect(theme.followsSystem()).toBe(true);
  });
});

describe('SpartanNativeTheme · platform and persistence', () => {
  const memory = () => {
    const data = new Map<string, string>();
    return {
      data,
      getItem: (k: string) => data.get(k) ?? null,
      setItem: (k: string, v: string) => void data.set(k, v),
      removeItem: (k: string) => void data.delete(k),
    };
  };

  it('keeps the real platform when the user picks another skin', async () => {
    TestBed.configureTestingModule({ providers: [provideSpartanNative({ host: staticHost({ skin: 'mac' }) })] });
    const theme = TestBed.inject(SpartanNativeTheme);
    await theme.init();
    theme.override({ skin: 'win' });
    TestBed.inject(ApplicationRef).tick();
    expect(theme.skin()).toBe('win');
    expect(theme.nativeSkin()).toBe('mac');
    expect(theme.platformFamily()).toBe('macos');
    expect(document.documentElement.dataset['snPlatform']).toBe('mac');
  });

  it('stores overrides and reads them back before the first render', async () => {
    const storage = memory();
    TestBed.configureTestingModule({
      providers: [
        provideSpartanNative({
          host: staticHost({ skin: 'gtk' }),
          overrides: { scheme: 'light' },
          persist: { storage },
        }),
      ],
    });
    const theme = TestBed.inject(SpartanNativeTheme);
    theme.override({ skin: 'qt', scheme: 'dark' });
    TestBed.inject(ApplicationRef).tick();
    expect(JSON.parse(storage.data.get(DEFAULT_PERSIST_KEY)!)).toEqual({ skin: 'qt', scheme: 'dark' });

    // a new app: the stored choice wins over options.overrides
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      providers: [
        provideSpartanNative({
          host: staticHost({ skin: 'gtk' }),
          overrides: { scheme: 'light' },
          persist: { storage },
        }),
      ],
    });
    const next = TestBed.inject(SpartanNativeTheme);
    expect(next.overrides()).toEqual({ skin: 'qt', scheme: 'dark' });

    next.followSystem();
    TestBed.inject(ApplicationRef).tick();
    expect(storage.data.has(DEFAULT_PERSIST_KEY)).toBe(false);
  });

  it('ignores stored values that are not appearance fields', () => {
    const storage = memory();
    storage.setItem('k', JSON.stringify({ skin: 'mac', textScale: '2', evil: true }));
    expect(readStoredOverrides(storage, 'k')).toEqual({ skin: 'mac' });
    storage.setItem('k', '{not json');
    expect(readStoredOverrides(storage, 'k')).toEqual({});
  });
});
