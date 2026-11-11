import { ApplicationRef } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { staticHost } from '../contract/static-host';
import { provideSpartanNative } from './provide-spartan-native';
import { SpartanNativeTheme } from './spartan-native-theme';

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
