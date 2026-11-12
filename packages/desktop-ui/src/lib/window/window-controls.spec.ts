import { TestBed } from '@angular/core/testing';
import type { Skin } from '@spartan-native/theme';
import { SnWindowControls } from './window-controls';

/** Renders the controls under a skin; returns each button's class and aria-label. */
function render(skin: Skin, inputs: Record<string, unknown> = {}) {
  document.documentElement.dataset['snSkin'] = skin;
  const fixture = TestBed.createComponent(SnWindowControls);
  for (const [k, v] of Object.entries(inputs)) fixture.componentRef.setInput(k, v);
  fixture.detectChanges();
  const host = fixture.nativeElement as HTMLElement;
  const buttons = [...host.querySelectorAll('button')].map((b) => `${b.className}:${b.getAttribute('aria-label')}`);
  return { host, buttons };
}

describe('SnWindowControls', () => {
  afterEach(() => delete document.documentElement.dataset['snSkin']);

  it('exposes the skin and family on the host', () => {
    const { host } = render('qt');
    expect(host.dataset['skin']).toBe('qt');
    expect(host.dataset['family']).toBe('linux');
  });

  it('draws traffic lights on macOS', () => {
    expect(render('macc').buttons).toEqual(['light close:Close', 'light minimize:Minimize', 'light zoom:Zoom']);
  });

  it('draws only a round close on GNOME unless linuxAll', () => {
    expect(render('gtk').buttons).toEqual(['round:Close']);
    expect(render('gtk', { linuxAll: true }).buttons).toEqual(['round:Minimize', 'round:Maximize', 'round:Close']);
  });

  it('draws three caption buttons on Windows, KDE and ChromeOS', () => {
    for (const skin of ['win', 'w10', 'qt', 'cros'] as const) {
      expect(render(skin).buttons).toEqual(['caption:Minimize', 'caption:Maximize', 'caption close:Close']);
    }
  });

  it('shows Restore while maximized and honours buttons', () => {
    expect(render('qt', { maximized: true, buttons: ['maximize', 'close'] }).buttons).toEqual([
      'caption:Restore',
      'caption close:Close',
    ]);
  });
});
