import { TestBed } from '@angular/core/testing';
import { provideSpartanNative, SpartanNativeTheme, staticHost } from '@spartan-native/theme';
import { App } from './app';

describe('App', () => {
  it('renders the Harbor window in the active skin', async () => {
    TestBed.configureTestingModule({
      imports: [App],
      providers: [provideSpartanNative({ host: staticHost({ skin: 'mac' }) })],
    });
    await TestBed.inject(SpartanNativeTheme).init();
    const fixture = TestBed.createComponent(App);
    await fixture.whenStable();
    const el: HTMLElement = fixture.nativeElement;
    expect(el.querySelector('harbor-window')?.getAttribute('data-chrome')).toBe('mac');
    expect(el.textContent).toContain('Recent activity');
  });
});
