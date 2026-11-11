import { ChangeDetectionStrategy, Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { SnPlatformIf } from './platform/platform-if';
import { SnShortcut } from './platform/shortcut';
import { SnWindowControls } from './window/window-controls';

@Component({
  imports: [SnPlatformIf, SnShortcut, SnWindowControls],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <p *snPlatformIf="'macos'; else other" id="mac">menu bar</p>
    <ng-template #other><p id="other">hamburger</p></ng-template>
    <kbd snShortcut="mod+s"></kbd>
    <sn-window-controls />
  `,
})
class Host {}

const tick = () => new Promise((r) => setTimeout(r));

describe('desktop-ui follows the skin', () => {
  it('switches templates, shortcut glyphs and window buttons live', async () => {
    document.documentElement.dataset['snSkin'] = 'win';
    const fixture = TestBed.createComponent(Host);
    await fixture.whenStable();
    const el: HTMLElement = fixture.nativeElement;
    const labels = () => [...el.querySelectorAll('sn-window-controls button')].map((b) => b.getAttribute('aria-label'));

    expect(el.querySelector('#other')).not.toBeNull();
    expect(el.querySelector('kbd')!.textContent).toBe('Ctrl+S');
    expect(labels()).toEqual(['Minimize', 'Maximize', 'Close']);

    document.documentElement.dataset['snSkin'] = 'mac';
    await tick();
    await fixture.whenStable();
    expect(el.querySelector('#mac')).not.toBeNull();
    expect(el.querySelector('#other')).toBeNull();
    expect(el.querySelector('kbd')!.textContent).toBe('⌘S');
    expect(labels()).toEqual(['Close', 'Minimize', 'Zoom']);

    document.documentElement.dataset['snSkin'] = 'gtk';
    await tick();
    await fixture.whenStable();
    expect(labels()).toEqual(['Close']); // the GNOME default button layout
  });
});
