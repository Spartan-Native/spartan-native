import { ChangeDetectionStrategy, Component, signal, type TemplateRef, viewChild } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { SnCommandBarImports } from './command-bar';

@Component({
  imports: [SnCommandBarImports],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <sn-command-bar title="Documents">
      <button snCommand label="New"></button>
      <button snCommand label="Share" disabled></button>
      <button snCommand label="Delete"></button>
      <ng-template snCommandOverflow><div>menu</div></ng-template>
    </sn-command-bar>
  `,
})
class Host {}

const tick = () => new Promise((r) => setTimeout(r));

describe('SnCommandBar', () => {
  afterEach(() => {
    document.querySelectorAll('.cdk-overlay-container').forEach((n) => n.remove());
    document.querySelectorAll('[ng-version]').forEach((n) => n.remove());
  });

  it('is one toolbar tab stop; arrows move between enabled commands and the overflow button', async () => {
    document.documentElement.dataset['snSkin'] = 'win';
    const fixture = TestBed.createComponent(Host);
    document.body.append(fixture.nativeElement);
    await fixture.whenStable();
    const el: HTMLElement = fixture.nativeElement;
    const toolbar = el.querySelector<HTMLElement>('[role="toolbar"]')!;
    const buttons = [...el.querySelectorAll<HTMLButtonElement>('[data-slot="sn-command"]')];
    const tabbable = () => buttons.filter((b) => b.tabIndex === 0).map((b) => b.textContent!.trim());
    const keyCodes: Record<string, number> = { ArrowLeft: 37, ArrowRight: 39, End: 35 };
    const press = async (key: string) => {
      document.activeElement!.dispatchEvent(new KeyboardEvent('keydown', { key, keyCode: keyCodes[key], bubbles: true }));
      await fixture.whenStable();
    };

    expect(toolbar.getAttribute('aria-label')).toBe('Documents');
    expect(el.querySelector('sn-command-bar')!.hasAttribute('title')).toBe(false);
    expect(buttons.map((b) => b.textContent!.trim())).toEqual(['New', 'Share', 'Delete', 'More options']);
    expect(buttons[3].getAttribute('aria-haspopup')).toBe('menu');
    expect(buttons[3].hidden).toBe(false); // the snCommandOverflow template needs it
    expect(tabbable()).toEqual(['New']);

    buttons[0].focus();
    await press('ArrowRight'); // skips the disabled Share
    expect(document.activeElement).toBe(buttons[2]);
    expect(tabbable()).toEqual(['Delete']);
    await press('End');
    expect(document.activeElement).toBe(buttons[3]);
    await press('ArrowRight'); // wraps
    expect(document.activeElement).toBe(buttons[0]);
    await press('ArrowLeft');
    expect(document.activeElement).toBe(buttons[3]);

    // Windows shows labels; macOS hides them (accessible name + tooltip stay)
    expect(buttons[0].hasAttribute('data-icon-only')).toBe(false);
    document.documentElement.dataset['snSkin'] = 'mac';
    await tick();
    await fixture.whenStable();
    expect(buttons[0].hasAttribute('data-icon-only')).toBe(true);
    expect(buttons[0].title).toBe(''); // the skin's tooltip, not the browser's
  });

  it('makes the title a heading and places it per skin', async () => {
    document.documentElement.dataset['snSkin'] = 'gtk';
    const fixture = TestBed.createComponent(Host);
    document.body.append(fixture.nativeElement);
    await fixture.whenStable();
    const bar = fixture.nativeElement.querySelector('sn-command-bar') as HTMLElement;
    const title = bar.querySelector('.title')!;
    expect(title.getAttribute('role')).toBe('heading');
    expect(title.getAttribute('aria-level')).toBe('1');
    expect(bar.dataset['title']).toBe('center');
    // GNOME: commands before the title, the menu button after it
    expect(bar.querySelector('.lead [role="toolbar"]')).not.toBeNull();
    expect(bar.querySelector('.trail .more')).not.toBeNull();

    document.documentElement.dataset['snSkin'] = 'win';
    await tick();
    await fixture.whenStable();
    expect(bar.dataset['title']).toBe('start');
    expect(bar.querySelector('.trail [role="toolbar"]')).not.toBeNull();
    // the projected commands moved with the toolbar
    expect([...bar.querySelectorAll('.trail [role="toolbar"] [data-slot="sn-command"]')].map((b) => b.textContent!.trim())).toEqual([
      'New',
      'Share',
      'Delete',
    ]);
  });
});

@Component({
  imports: [SnCommandBarImports],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <sn-command-bar title="Inbox" [commands]="page()" [overflowItems]="extra">
      <button snCommand label="Compose" variant="accent" priority="10"><svg></svg></button>
      <sn-command-group label="Selection">
        <button snCommand label="Archive" priority="5"><svg></svg></button>
        <button snCommand label="Delete" priority="1"><svg></svg></button>
      </sn-command-group>
      <button snCommand label="Rename" secondary></button>
    </sn-command-bar>
    <ng-template #pageCommands><button snCommand label="Refresh"></button></ng-template>
  `,
})
class Rich {
  readonly pageCommands = viewChild.required<TemplateRef<unknown>>('pageCommands');
  readonly page = signal<TemplateRef<unknown> | null>(null);
  readonly extra = [{ label: 'Settings', action: () => undefined }];
}

describe('SnCommandBar · groups, outside commands and overflow', () => {
  afterEach(() => {
    document.querySelectorAll('.cdk-overlay-container').forEach((n) => n.remove());
    document.querySelectorAll('[ng-version]').forEach((n) => n.remove());
  });

  async function setup() {
    document.documentElement.dataset['snSkin'] = 'win';
    const fixture = TestBed.createComponent(Rich);
    document.body.append(fixture.nativeElement);
    await fixture.whenStable();
    fixture.componentInstance.page.set(fixture.componentInstance.pageCommands());
    await fixture.whenStable();
    await tick();
    await fixture.whenStable();
    const el: HTMLElement = fixture.nativeElement;
    const bar = el.querySelector<HTMLElement>('sn-command-bar')!;
    const command = (label: string) =>
      [...el.querySelectorAll<HTMLElement>('[data-slot="sn-command"]')].find((b) => b.textContent!.trim() === label)!;
    return { fixture, el, bar, command };
  }

  it('groups commands, takes commands from a template, and keeps secondary ones in the menu', async () => {
    const { el, bar, command } = await setup();
    expect(el.querySelector('[data-slot="sn-command-group"]')!.getAttribute('role')).toBe('group');
    expect(el.querySelector('[data-slot="sn-command-group"]')!.getAttribute('aria-label')).toBe('Selection');
    expect(command('Compose').dataset['variant']).toBe('accent');
    // Refresh comes from another template, but is part of the toolbar and its key navigation
    const refresh = command('Refresh');
    expect(refresh.closest('[role="toolbar"]')).not.toBeNull();
    expect(command('Rename').hasAttribute('data-collapsed')).toBe(true);
    expect(bar.querySelector<HTMLElement>('.more')!.hidden).toBe(false);

    refresh.focus();
    refresh.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowLeft', keyCode: 37, bubbles: true }));
    expect(document.activeElement).toBe(command('Delete'));
  });

  it('drops labels, then collapses commands by priority when the bar is too narrow', async () => {
    const { fixture, bar, command } = await setup();
    // jsdom has no layout: the bar is "as wide" as its visible commands, and room for 2
    const visible = () => [...bar.querySelectorAll<HTMLElement>('[data-slot="sn-command"]:not([data-collapsed]):not([hidden])')];
    Object.defineProperty(bar, 'clientWidth', { configurable: true, get: () => 300 });
    Object.defineProperty(bar, 'scrollWidth', {
      configurable: true,
      get: () => visible().length * (bar.hasAttribute('data-compact') ? 100 : 150),
    });
    // trigger a fit (a label change re-fits)
    (fixture.componentInstance as Rich).page.set(null);
    await fixture.whenStable();
    await tick();
    await fixture.whenStable();

    // labels dropped first (100 each instead of 150), then Delete (priority 1) collapsed
    expect(bar.hasAttribute('data-compact')).toBe(true);
    expect(visible().map((b) => b.textContent!.trim())).toEqual(['Compose', 'Archive', 'More options']);
    expect(command('Delete').hasAttribute('data-collapsed')).toBe(true);
    expect(command('Compose').hasAttribute('data-icon-only')).toBe(true);

    // the overflow menu lists them in order, then the secondary command, then overflowItems
    bar.querySelector<HTMLElement>('.more')!.click();
    await fixture.whenStable();
    const labels = [...document.querySelectorAll('.cdk-overlay-container .sn-menu-label')].map((l) => l.textContent!.trim());
    expect(labels).toEqual(['Delete', 'Rename', 'Settings']);
  });
});
