import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { SnSearchField } from './search-field';

@Component({
  imports: [SnSearchField],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <!-- Stands in for a dialog that closes on Esc: it only counts the Esc presses that reach it. -->
    <!-- eslint-disable-next-line @angular-eslint/template/interactive-supports-focus -->
    <div (keydown.escape)="escapes = escapes + 1"><sn-search-field [(value)]="query" /></div>
  `,
})
class Host {
  readonly query = signal('');
  escapes = 0;
}

describe('SnSearchField', () => {
  it('binds the text, clears with the button, and empties on Esc before Esc goes further', async () => {
    const fixture = TestBed.createComponent(Host);
    await fixture.whenStable();
    const el: HTMLElement = fixture.nativeElement;
    const field = el.querySelector('input')!;
    expect(field.getAttribute('aria-label')).toBe('Search');
    expect(el.querySelector('.clear')).toBeNull();

    field.value = 'report';
    field.dispatchEvent(new Event('input'));
    await fixture.whenStable();
    expect(fixture.componentInstance.query()).toBe('report');

    el.querySelector<HTMLButtonElement>('.clear')!.click();
    await fixture.whenStable();
    expect(fixture.componentInstance.query()).toBe('');
    expect(document.activeElement).toBe(field);

    fixture.componentInstance.query.set('q3');
    await fixture.whenStable();
    expect(field.value).toBe('q3');
    field.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
    await fixture.whenStable();
    expect(fixture.componentInstance.query()).toBe('');
    expect(fixture.componentInstance.escapes).toBe(0);

    field.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
    expect(fixture.componentInstance.escapes).toBe(1);
  });
});
