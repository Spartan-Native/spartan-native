import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { SnSelectableImports } from './selectable';

@Component({
  imports: [SnSelectableImports],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div snSelectable [(selection)]="selection" (activated)="opened.set($event)">
      @for (f of files(); track f) {
        <div snSelectableItem [value]="f">{{ f }}</div>
      }
    </div>
  `,
})
class Host {
  readonly files = signal(['Budget.xlsx', 'Notes.md', 'Q4 Report.pdf', 'Roadmap.png']);
  readonly selection = signal<readonly string[]>([]);
  readonly opened = signal<string | null>(null);
}

async function setup(skin = 'win') {
  document.documentElement.dataset['snSkin'] = skin;
  const fixture = TestBed.createComponent(Host);
  await fixture.whenStable();
  const list = fixture.nativeElement.querySelector('[data-slot="sn-selectable"]') as HTMLElement;
  const rows = () => Array.from(list.querySelectorAll<HTMLElement>('[data-slot="sn-selectable-item"]'));
  const key = async (k: string, init: KeyboardEventInit = {}) => {
    list.dispatchEvent(new KeyboardEvent('keydown', { key: k, bubbles: true, cancelable: true, ...init }));
    await fixture.whenStable();
  };
  const click = async (i: number, init: MouseEventInit = {}) => {
    rows()[i].dispatchEvent(new MouseEvent('click', { bubbles: true, ...init }));
    await fixture.whenStable();
  };
  return { fixture, host: fixture.componentInstance, list, rows, key, click };
}

describe('snSelectable', () => {
  it('keeps an initial selection while the rows render for the first time', async () => {
    document.documentElement.dataset['snSkin'] = 'win';
    const fixture = TestBed.createComponent(Host);
    fixture.componentInstance.selection.set(['Notes.md']);
    await fixture.whenStable();
    const rows = Array.from(
      fixture.nativeElement.querySelectorAll('[data-slot="sn-selectable-item"]'),
    ) as HTMLElement[];
    expect(fixture.componentInstance.selection()).toEqual(['Notes.md']);
    expect(rows[1].hasAttribute('data-selected')).toBe(true);

    // …and still drops rows that go away later
    fixture.componentInstance.files.set(['Budget.xlsx', 'Q4 Report.pdf']);
    await fixture.whenStable();
    expect(fixture.componentInstance.selection()).toEqual([]);
  });

  it('sets listbox semantics and selection state on rows', async () => {
    const { list, rows, click, host } = await setup();
    expect(list.getAttribute('role')).toBe('listbox');
    expect(list.getAttribute('aria-multiselectable')).toBe('true');
    expect(rows()[0].getAttribute('role')).toBe('option');

    await click(1);
    expect(host.selection()).toEqual(['Notes.md']);
    expect(rows()[1].hasAttribute('data-selected')).toBe(true);
    expect(rows()[1].getAttribute('aria-selected')).toBe('true');
    expect(list.getAttribute('aria-activedescendant')).toBe(rows()[1].id);
  });

  it('uses Ctrl on Windows and ⌘ on macOS to toggle', async () => {
    const win = await setup('win');
    await win.click(0);
    await win.click(2, { ctrlKey: true });
    expect(win.host.selection()).toEqual(['Budget.xlsx', 'Q4 Report.pdf']);

    TestBed.resetTestingModule();
    const mac = await setup('mac');
    await mac.click(0);
    await mac.click(2, { ctrlKey: true }); // Ctrl-click is the context menu on macOS: plain click
    expect(mac.host.selection()).toEqual(['Q4 Report.pdf']);
    await mac.click(0, { metaKey: true });
    expect(mac.host.selection()).toEqual(['Budget.xlsx', 'Q4 Report.pdf']);
  });

  it('handles arrows, Shift, select all, Esc, Enter and type-ahead', async () => {
    const { key, host } = await setup();
    await key('ArrowDown');
    expect(host.selection()).toEqual(['Budget.xlsx']);
    await key('ArrowDown', { shiftKey: true });
    expect(host.selection()).toEqual(['Budget.xlsx', 'Notes.md']);
    await key('a', { ctrlKey: true });
    expect(host.selection().length).toBe(4);
    await key('Escape');
    expect(host.selection()).toEqual([]);
    await key('r');
    expect(host.selection()).toEqual(['Roadmap.png']);
    await key('Enter');
    expect(host.opened()).toBe('Roadmap.png');
  });

  it('leaves keys typed into an input inside a row alone', async () => {
    const { rows, host, fixture } = await setup();
    const input = document.createElement('input');
    rows()[1].appendChild(input);
    for (const k of ['r', ' ', 'ArrowDown', 'Home', 'a']) {
      const event = new KeyboardEvent('keydown', { key: k, bubbles: true, cancelable: true, ctrlKey: k === 'a' });
      input.dispatchEvent(event);
      await fixture.whenStable();
      expect(event.defaultPrevented).toBe(false);
    }
    expect(host.selection()).toEqual([]);
  });

  it('drops rows that disappear', async () => {
    const { click, host, fixture } = await setup();
    await click(3);
    host.files.set(['Budget.xlsx']);
    await fixture.whenStable();
    expect(host.selection()).toEqual([]);
  });
});
