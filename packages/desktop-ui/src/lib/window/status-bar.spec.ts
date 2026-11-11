import { ChangeDetectionStrategy, Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { SnStatusBarImports } from './status-bar';

@Component({
  imports: [SnStatusBarImports],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <sn-status-bar>
      <span snStatusItem>4 items</span>
      <span snStatusItem live>Backing up…</span>
      <span snStatusItem snStatusBarEnd>1.2 TB free</span>
    </sn-status-bar>
  `,
})
class StatusHost {}

describe('SnStatusBar', () => {
  it('splits start and end items; only live items are announced', async () => {
    document.documentElement.dataset['snSkin'] = 'mac';
    const fixture = TestBed.createComponent(StatusHost);
    await fixture.whenStable();
    const el: HTMLElement = fixture.nativeElement;
    const bar = el.querySelector('sn-status-bar')!;
    expect(bar.getAttribute('aria-label')).toBe('Status');
    expect(bar.getAttribute('data-family')).toBe('macos');
    expect([...bar.querySelectorAll('.start [data-slot="sn-status-item"]')].map((i) => i.textContent)).toEqual(['4 items', 'Backing up…']);
    expect(bar.querySelector('.end')!.textContent).toBe('1.2 TB free');
    const items = [...bar.querySelectorAll('[data-slot="sn-status-item"]')];
    expect(items.map((i) => i.getAttribute('role'))).toEqual([null, 'status', null]);
  });
});
