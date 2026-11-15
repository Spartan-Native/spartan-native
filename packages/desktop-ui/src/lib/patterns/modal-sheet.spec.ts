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
      <button snSheetSecondary id="back" (click)="backs = backs + 1">Back</button>
      <button snSheetPrimary>Create</button>
    </sn-modal-sheet>
  `,
})
class Host {
  readonly open = signal(true);
  backs = 0;
}

const dialog = () => document.querySelector<HTMLElement>('[role="dialog"]');

describe('SnModalSheet', () => {
  it('opens on load, labels the dialog, and closes on Esc and Cancel', async () => {
    const fixture = TestBed.createComponent(Host);
    await fixture.whenStable();

    expect(dialog()).not.toBeNull();
    expect(dialog()!.getAttribute('aria-modal')).toBe('true');
    expect(document.getElementById(dialog()!.getAttribute('aria-labelledby')!)!.textContent).toBe('New destination');

    // the secondary button (Back) is placed in the actions and doesn't close the sheet
    expect(document.getElementById('back')!.closest('.secondary')).not.toBeNull();
    document.getElementById('back')!.click();
    await fixture.whenStable();
    expect(fixture.componentInstance.backs).toBe(1);
    expect(fixture.componentInstance.open()).toBe(true);

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

@Component({
  imports: [SnModalSheet],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<sn-modal-sheet role="alertdialog" [open]="true" title="Delete it?"
    ><button snSheetCancel>Cancel</button></sn-modal-sheet
  >`,
})
class AlertHost {}

describe('SnModalSheet role', () => {
  it('puts the role on the dialog only, not on its host element', async () => {
    const fixture = TestBed.createComponent(AlertHost);
    await fixture.whenStable();
    expect(document.querySelectorAll('[role="alertdialog"]').length).toBe(1);
    expect(document.querySelector('[role="alertdialog"]')!.localName).not.toBe('sn-modal-sheet');
    document.querySelector<HTMLButtonElement>('[snSheetCancel]')!.click();
    await fixture.whenStable();
  });
});
