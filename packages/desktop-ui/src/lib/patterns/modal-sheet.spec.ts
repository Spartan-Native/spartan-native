import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { SnModalSheet } from './modal-sheet';

@Component({
  imports: [SnModalSheet],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <sn-modal-sheet [(open)]="open" title="New destination">
      <input id="name" />
      <button snSheetCancel id="cancel">Cancel</button>
      <button snSheetPrimary>Create</button>
    </sn-modal-sheet>
  `,
})
class Host {
  readonly open = signal(true);
}

const dialog = () => document.querySelector<HTMLElement>('[role="dialog"]');

describe('SnModalSheet', () => {
  it('opens on load, labels the dialog, and closes on Esc and Cancel', async () => {
    const fixture = TestBed.createComponent(Host);
    await fixture.whenStable();

    expect(dialog()).not.toBeNull();
    expect(dialog()!.getAttribute('aria-modal')).toBe('true');
    expect(document.getElementById(dialog()!.getAttribute('aria-labelledby')!)!.textContent).toBe('New destination');

    dialog()!.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
    await fixture.whenStable();
    expect(fixture.componentInstance.open()).toBe(false);
    expect(dialog()).toBeNull();

    fixture.componentInstance.open.set(true);
    await fixture.whenStable();
    document.getElementById('cancel')!.click();
    await fixture.whenStable();
    expect(fixture.componentInstance.open()).toBe(false);
    expect(dialog()).toBeNull();
  });
});
