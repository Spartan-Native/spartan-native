import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { SnDialogActionsImports } from './dialog-actions';

@Component({
  imports: [SnDialogActionsImports],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <form (submit)="$event.preventDefault()">
      <input id="name" />
      <textarea id="notes"></textarea>
      <button type="button" snCancelAction (click)="log.set('cancel')">Cancel</button>
      <button type="button" snDefaultAction [disabled]="disabled()" (click)="log.set('save')">Save</button>
      <div snDialogButtons id="row"><button type="button">Don't save</button></div>
    </form>
  `,
})
class Host {
  readonly log = signal('');
  readonly disabled = signal(false);
}

describe('snDefaultAction / snCancelAction', () => {
  async function setup() {
    const fixture = TestBed.createComponent(Host);
    await fixture.whenStable();
    const el: HTMLElement = fixture.nativeElement;
    const press = async (selector: string, key: string) => {
      el.querySelector(selector)!.dispatchEvent(new KeyboardEvent('keydown', { key, bubbles: true, cancelable: true }));
      await fixture.whenStable();
    };
    return { fixture, host: fixture.componentInstance, press };
  }

  it('Enter in a field presses the default button, Esc presses cancel', async () => {
    const { host, press } = await setup();
    await press('#name', 'Enter');
    expect(host.log()).toBe('save');
    await press('#name', 'Escape');
    expect(host.log()).toBe('cancel');
  });

  it('leaves Enter to fields that use it, and skips a disabled default button', async () => {
    const { host, press, fixture } = await setup();
    await press('#notes', 'Enter');
    expect(host.log()).toBe('');
    host.disabled.set(true);
    await fixture.whenStable();
    await press('#name', 'Enter');
    expect(host.log()).toBe('');
  });

  it('marks a button row so the skin can order its buttons', async () => {
    const { fixture } = await setup();
    const el: HTMLElement = fixture.nativeElement;
    expect(el.querySelector('#row')!.hasAttribute('data-sn-dialog-buttons')).toBe(true);
    expect(el.querySelector('[snDefaultAction]')!.hasAttribute('data-sn-default-action')).toBe(true);
    expect(el.querySelector('[snCancelAction]')!.hasAttribute('data-sn-cancel-action')).toBe(true);
  });
});
