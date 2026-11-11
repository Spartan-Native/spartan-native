import { ChangeDetectionStrategy, Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { SnTitleBar } from './title-bar';

@Component({
  imports: [SnTitleBar],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<sn-title-bar title="Harbor" windowControls="native" />`,
})
class Host {}

describe('SnTitleBar', () => {
  afterEach(() => {
    delete document.documentElement.dataset['snPlatform'];
  });

  it('leaves room for native window buttons where the real OS draws them, not where the skin would', async () => {
    document.documentElement.dataset['snSkin'] = 'win';
    document.documentElement.dataset['snPlatform'] = 'mac'; // a Mac dressed as Windows 11
    const fixture = TestBed.createComponent(Host);
    await fixture.whenStable();
    const bar = fixture.nativeElement.querySelector('sn-title-bar') as HTMLElement;
    expect(bar.dataset['family']).toBe('windows'); // laid out as Windows
    expect(bar.dataset['native']).toBe('mac'); // the traffic lights' space at the start
    expect(bar.querySelector('sn-window-controls')).toBeNull();
  });
});
