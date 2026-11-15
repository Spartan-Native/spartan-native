import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { SnTooltip } from '../controls/tooltip';
import { nextIndex, SnSidebarNavImports } from './sidebar-nav';

describe('sidebar nextIndex', () => {
  it('moves with the arrows and stops at the ends', () => {
    expect(nextIndex('ArrowDown', 0, 3)).toBe(1);
    expect(nextIndex('ArrowDown', 2, 3)).toBe(2);
    expect(nextIndex('ArrowUp', 1, 3)).toBe(0);
    expect(nextIndex('ArrowUp', 0, 3)).toBe(0);
  });

  it('jumps with Home and End, and starts at an end when nothing is focused', () => {
    expect(nextIndex('Home', 2, 3)).toBe(0);
    expect(nextIndex('End', 0, 3)).toBe(2);
    expect(nextIndex('ArrowDown', -1, 3)).toBe(0);
    expect(nextIndex('ArrowUp', -1, 3)).toBe(2);
  });

  it('ignores other keys', () => {
    expect(nextIndex('Enter', 0, 3)).toBeNull();
  });
});

@Component({
  imports: [SnSidebarNavImports],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <sn-sidebar-nav aria-label="Sections" [collapsed]="collapsed()">
      <sn-sidebar-section title="Library">
        <button snSidebarItem icon="lucideInbox" badge="3" active>Inbox</button>
      </sn-sidebar-section>
    </sn-sidebar-nav>
  `,
})
class Host {
  readonly collapsed = signal(false);
}

describe('SnSidebarNav collapsed', () => {
  it('marks the nav, its sections and items, and gives the items their label as tooltip', async () => {
    const fixture = TestBed.createComponent(Host);
    await fixture.whenStable();
    const el: HTMLElement = fixture.nativeElement;
    const item = el.querySelector<HTMLElement>('[snSidebarItem]')!;
    const tooltip = fixture.debugElement.query((d) => d.nativeElement === item).injector.get(SnTooltip);

    expect(item.classList).toContain('sn-sidebar-item');
    expect(el.querySelector('[data-collapsed]')).toBeNull();
    item.dispatchEvent(new Event('pointerenter'));
    expect(tooltip.text()).toBeNull();

    fixture.componentInstance.collapsed.set(true);
    await fixture.whenStable();
    expect(el.querySelectorAll('[data-collapsed]').length).toBe(3);
    item.dispatchEvent(new Event('pointerenter'));
    expect(tooltip.text()).toBe('Inbox (3)');
  });
});
