import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { coachMarkPositions, coachMarkSide, SnCoachMark, SnCoachMarkFor } from './coach-mark';

describe('coachMarkPositions', () => {
  it('tries centered, start, end on the preferred side, then the opposite side', () => {
    const below = coachMarkPositions('bottom');
    expect(below.map((p) => `${p.originY}/${p.originX}`)).toEqual([
      'bottom/center',
      'bottom/start',
      'bottom/end',
      'top/center',
      'top/start',
      'top/end',
    ]);
    expect(below[0]).toEqual({ originX: 'center', overlayX: 'center', originY: 'bottom', overlayY: 'top' });
    expect(coachMarkPositions('top')[0].overlayY).toBe('bottom');
  });

  it('puts the tip beside the anchor for start and end', () => {
    expect(coachMarkPositions('end')[0]).toEqual({
      originY: 'center',
      overlayY: 'center',
      originX: 'end',
      overlayX: 'start',
    });
    expect(coachMarkPositions('start').at(-1)).toEqual({
      originY: 'bottom',
      overlayY: 'bottom',
      originX: 'end',
      overlayX: 'start',
    });
  });
});

describe('coachMarkSide', () => {
  const anchor = { top: 100, bottom: 130, left: 200, right: 260 };
  it('reads the side from the rectangles', () => {
    expect(coachMarkSide({ top: 132, bottom: 250, left: 100, right: 420 }, anchor)).toBe('bottom');
    expect(coachMarkSide({ top: 0, bottom: 98, left: 100, right: 420 }, anchor)).toBe('top');
    expect(coachMarkSide({ top: 60, bottom: 170, left: 262, right: 580 }, anchor)).toBe('right');
    expect(coachMarkSide({ top: 60, bottom: 170, left: 0, right: 198 }, anchor)).toBe('left');
  });
});

@Component({
  imports: [SnCoachMark, SnCoachMarkFor],
  template: `
    <button [snCoachMarkFor]="tip">Sync</button>
    <sn-coach-mark #tip title="Sync across devices" [(open)]="open">Body</sn-coach-mark>
  `,
})
class Host {
  readonly open = signal(true);
}

describe('SnCoachMark', () => {
  it('opens into the overlay and closes on Escape from the anchor', async () => {
    const fixture = TestBed.createComponent(Host);
    await fixture.whenStable();
    const tip: HTMLElement = document.querySelector('sn-coach-mark')!;
    const anchor = fixture.nativeElement.querySelector('button') as HTMLButtonElement;
    expect(tip.closest('.cdk-overlay-pane')).not.toBeNull();
    expect(anchor.getAttribute('aria-describedby')).toBe(tip.getAttribute('aria-describedby'));

    anchor.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
    await fixture.whenStable();
    expect(fixture.componentInstance.open()).toBe(false);
    expect(tip.closest('.cdk-overlay-pane')).toBeNull();
    expect(tip.hasAttribute('data-side')).toBe(false);
  });
});
