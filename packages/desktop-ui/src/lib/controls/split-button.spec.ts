import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { CdkMenu, CdkMenuItem } from '@angular/cdk/menu';
import { SnSplitButtonImports } from './split-button';

@Component({
  imports: [SnSplitButtonImports, CdkMenu, CdkMenuItem],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <sn-split-button label="Back up now" variant="accent" (triggered)="runs.set(runs() + 1)">
      <ng-template snSplitButtonMenu>
        <div cdkMenu class="test-menu"><button cdkMenuItem>Documents only</button></div>
      </ng-template>
    </sn-split-button>
  `,
})
class Host {
  readonly runs = signal(0);
}

describe('SnSplitButton', () => {
  afterEach(() => document.querySelectorAll('.cdk-overlay-container').forEach((n) => n.remove()));

  it('runs the action, and opens the menu from the arrow', async () => {
    document.documentElement.dataset['snSkin'] = 'win';
    const fixture = TestBed.createComponent(Host);
    await fixture.whenStable();
    const el: HTMLElement = fixture.nativeElement;
    const [action, arrow] = [...el.querySelectorAll<HTMLButtonElement>('button')];

    expect(el.querySelector('sn-split-button')!.getAttribute('role')).toBe('group');
    expect(action.getAttribute('data-slot')).toBe('button');
    expect(action.classList).toContain('bg-primary'); // the theme's accent button hook
    expect(arrow.getAttribute('aria-label')).toBe('More options');
    expect(arrow.getAttribute('aria-haspopup')).toBe('menu');

    action.click();
    expect(fixture.componentInstance.runs()).toBe(1);

    arrow.click();
    await fixture.whenStable();
    expect(document.querySelector('.test-menu')).not.toBeNull();
    expect(fixture.componentInstance.runs()).toBe(1);
  });

  it('opens with Alt+↓ on Windows and ↓ elsewhere', async () => {
    document.documentElement.dataset['snSkin'] = 'win';
    const fixture = TestBed.createComponent(Host);
    await fixture.whenStable();
    const action = fixture.nativeElement.querySelector('button') as HTMLButtonElement;
    const down = (altKey: boolean) =>
      action.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown', altKey, bubbles: true }));

    down(false);
    await fixture.whenStable();
    expect(document.querySelector('.test-menu')).toBeNull();
    down(true);
    await fixture.whenStable();
    expect(document.querySelector('.test-menu')).not.toBeNull();
  });
});
