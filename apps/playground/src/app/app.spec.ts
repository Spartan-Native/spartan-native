import { TestBed } from '@angular/core/testing';
import { provideSpartanNative, SpartanNativeTheme, staticHost } from '@spartan-native/theme';
import { App } from './app';

describe('Playground', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [App],
      providers: [provideSpartanNative({ host: staticHost({ skin: 'win' }) })],
    });
  });

  it('renders the window and follows the skin control', async () => {
    const fixture = TestBed.createComponent(App);
    await fixture.whenStable();
    const el: HTMLElement = fixture.nativeElement;
    expect(el.querySelector('sn-title-bar')).not.toBeNull();
    expect(el.querySelector('sn-command-bar')).not.toBeNull();
    expect(el.textContent).toContain('Show in system tray');

    TestBed.inject(SpartanNativeTheme).override({ skin: 'mac' });
    await fixture.whenStable();
    expect(document.documentElement.classList).toContain('t-mac');
    expect(el.textContent).toContain('Show in menu bar');
  });

  it('shows the status page when the list is emptied', async () => {
    const fixture = TestBed.createComponent(App);
    await fixture.whenStable();
    const el: HTMLElement = fixture.nativeElement;
    (el.querySelector('button[label="Delete all"]') as HTMLButtonElement).click();
    await fixture.whenStable();
    expect(el.querySelector('sn-status-page')).not.toBeNull();
  });
});
