import { TestBed } from '@angular/core/testing';
import { NATIVE_HOST, type MessageOptions, type NativeHost } from '@spartan-native/theme';
import { SnAlert } from './alert';

const tick = () => new Promise((r) => setTimeout(r));
const alertDialog = () => document.querySelector<HTMLElement>('[role="alertdialog"]');
const button = (label: string) =>
  [...document.querySelectorAll<HTMLButtonElement>('[role="alertdialog"] button')].find(
    (b) => b.textContent!.trim() === label,
  )!;

const SAVE: MessageOptions = {
  kind: 'warning',
  title: 'Save changes?',
  message: 'Your changes are lost if you don’t save them.',
  buttons: [
    { id: 'save', label: 'Save' },
    { id: 'discard', label: "Don't Save" },
    { id: 'cancel', label: 'Cancel' },
  ],
  defaultId: 'save',
  cancelId: 'cancel',
};

describe('SnAlert', () => {
  afterEach(() => document.querySelectorAll('sn-alert-sheet').forEach((e) => e.remove()));

  it("uses the host's own alert when it has one", async () => {
    const message = vi.fn().mockResolvedValue('discard');
    TestBed.configureTestingModule({
      providers: [{ provide: NATIVE_HOST, useValue: { dialogs: { message } } as unknown as NativeHost }],
    });
    await expect(TestBed.inject(SnAlert).show(SAVE)).resolves.toBe('discard');
    expect(message).toHaveBeenCalledWith(SAVE);
    expect(alertDialog()).toBeNull();
  });

  it('draws an in-page alert otherwise, and answers the pressed button', async () => {
    const answer = TestBed.inject(SnAlert).show(SAVE);
    await tick();
    expect(alertDialog()).not.toBeNull();
    expect(document.getElementById(alertDialog()!.getAttribute('aria-labelledby')!)!.textContent).toBe('Save changes?');
    expect(alertDialog()!.textContent).toContain('Your changes are lost');
    // each button in its place: Save the primary, Cancel the cancel button, Don't Save beside them
    expect(button('Save').closest('.primary')).not.toBeNull();
    expect(button('Cancel').closest('.cancel')).not.toBeNull();
    expect(button("Don't Save").closest('.secondary')).not.toBeNull();
    expect(document.querySelector('sn-modal-sheet')!.hasAttribute('role')).toBe(false);
    button("Don't Save").click();
    await expect(answer).resolves.toBe('discard');
    await tick();
    expect(alertDialog()).toBeNull();
  });

  it('answers the cancel id on Esc, and confirm() is a yes or no', async () => {
    const alert = TestBed.inject(SnAlert);
    const answer = alert.show(SAVE);
    await tick();
    alertDialog()!.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
    await expect(answer).resolves.toBe('cancel');

    const yes = alert.confirm('Delete “Q3 report.pdf”?', { confirmLabel: 'Delete' });
    await tick();
    expect(alertDialog()!.getAttribute('aria-labelledby')).not.toBeNull();
    button('Delete').click();
    await expect(yes).resolves.toBe(true);

    const no = alert.confirm('Delete it?');
    await tick();
    button('Cancel').click();
    await expect(no).resolves.toBe(false);
  });
});
