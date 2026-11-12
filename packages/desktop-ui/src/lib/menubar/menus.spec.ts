import { ChangeDetectionStrategy, Component, computed, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { type MenuItem, type Skin, skinFamily, SpartanNativeTheme } from '@spartan-native/theme';
import { SnContextMenu } from './context-menu';
import { inPageMenu, matchesAccelerator, toHostMenu, type SnMenuItem } from './menu-model';
import { SnMenubar } from './menubar';

const flush = async () => {
  await new Promise((r) => setTimeout(r));
};

describe('menu model', () => {
  it('gives every item with an action an id and maps it back', () => {
    const run = () => undefined;
    const { menu, actions } = toHostMenu([
      {
        label: 'File',
        submenu: [
          { label: 'New', accelerator: 'mod+n', action: run },
          { type: 'separator' },
          { id: 'quit-it', label: 'Quit', action: run },
        ],
      },
      { role: 'editMenu' },
    ]);
    const file = menu[0].submenu!;
    expect(file[0].id).toMatch(/^sn-menu-\d+$/);
    expect(file[0]).not.toHaveProperty('action');
    expect(file[1]).toEqual({ type: 'separator' });
    expect(file[2].id).toBe('quit-it');
    expect(menu[1]).toEqual({ role: 'editMenu' });
    expect([...actions.keys()]).toEqual([file[0].id, 'quit-it']);
  });

  it('turns roles into in-page items, per OS', () => {
    const minimize = vi.fn();
    const items: SnMenuItem[] = [
      { role: 'appMenu' },
      {
        label: 'File',
        submenu: [
          { role: 'hide' },
          { type: 'separator' },
          { label: 'Open', action: () => undefined },
          { type: 'separator' },
          { role: 'quit' },
        ],
      },
      { role: 'editMenu' },
      { role: 'windowMenu' },
      { role: 'about' },
    ];
    const win = inPageMenu(items, 'windows', { minimize });
    expect(win.map((i) => i.label)).toEqual(['File', 'Edit', 'Window']);
    expect(win[0].submenu!.map((i) => i.label ?? '—')).toEqual(['Open']); // no close in the host: no Exit
    expect(win[1].submenu!.map((i) => i.label ?? '—')).toEqual([
      'Undo',
      'Redo',
      '—',
      'Cut',
      'Copy',
      'Paste',
      'Select all',
    ]);
    expect(win[1].submenu![1].accelerator).toBe('mod+y');
    const windowMenu = win[2].submenu!;
    expect(windowMenu.map((i) => (i.label ? `${i.label}${i.enabled === false ? ' (off)' : ''}` : '—'))).toEqual([
      'Minimize',
      'Maximize (off)',
      '—',
      'Close (off)',
    ]);
    windowMenu[0].action!();
    expect(minimize).toHaveBeenCalled();

    const mac = inPageMenu(items, 'macos', { close: () => undefined });
    expect(mac[0].submenu!.map((i) => i.label ?? '—')).toEqual(['Open', '—', 'Quit']);
    expect(mac[1].submenu![1].accelerator).toBe('mod+shift+z');
    expect(mac[2].submenu!.map((i) => i.label ?? '—')).toEqual(['Minimize', 'Zoom', '—', 'Close Window']);
  });

  it('matches accelerators with ⌘ on macOS and Ctrl elsewhere', () => {
    const key = (k: string, init: KeyboardEventInit = {}) => new KeyboardEvent('keydown', { key: k, ...init });
    expect(matchesAccelerator(key('n', { ctrlKey: true }), 'mod+n', 'windows')).toBe(true);
    expect(matchesAccelerator(key('n', { metaKey: true }), 'mod+n', 'windows')).toBe(false);
    expect(matchesAccelerator(key('n', { metaKey: true }), 'mod+n', 'macos')).toBe(true);
    expect(matchesAccelerator(key('S', { ctrlKey: true, shiftKey: true, code: 'KeyS' }), 'mod+shift+s', 'linux')).toBe(
      true,
    );
    expect(matchesAccelerator(key('n', { ctrlKey: true, shiftKey: true }), 'mod+n', 'windows')).toBe(false);
    expect(matchesAccelerator(key('Delete'), 'delete', 'windows')).toBe(true);
    expect(matchesAccelerator(key('F2'), 'f2', 'windows')).toBe(true);
  });
});

/** A host with native menus, recording what it was sent. */
function fakeTheme(level: 'native' | 'none' = 'native') {
  const listeners = new Set<(id: string) => void>();
  const sent: { app: MenuItem[][]; context: { menu: MenuItem[]; at: { x: number; y: number } }[] } = {
    app: [],
    context: [],
  };
  const skin = signal('win');
  const native = signal<string | null>(null); // the real OS, when it differs from the skin
  const theme = {
    skin,
    native,
    nativeSkin: computed(() => native() ?? skin()),
    platformFamily: computed(() => skinFamily((native() ?? skin()) as Skin)),
    capabilities: { nativeMenus: level },
    window: { minimize: vi.fn(async () => undefined) },
    menus: {
      setApplicationMenu: vi.fn(async (menu: readonly MenuItem[]) => void sent.app.push([...menu])),
      showContextMenu: vi.fn(
        async (menu: readonly MenuItem[], at: { x: number; y: number }) =>
          void sent.context.push({ menu: [...menu], at }),
      ),
      onAction: (cb: (id: string) => void) => {
        listeners.add(cb);
        return () => listeners.delete(cb);
      },
    },
  };
  const choose = (id: string) => listeners.forEach((cb) => cb(id));
  return { theme, sent, choose };
}

@Component({
  imports: [SnMenubar, SnContextMenu],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <sn-menubar [menu]="menu()" />
    <input id="field" />
    <div id="target" [snContextMenu]="context">Budget.xlsx</div>
  `,
})
class Host {
  readonly log = signal<string[]>([]);
  readonly wrap = signal(false);
  readonly menu = computed<SnMenuItem[]>(() => [
    { role: 'appMenu' },
    {
      label: 'File',
      submenu: [
        { label: 'New backup', accelerator: 'mod+n', action: () => this.log.update((l) => [...l, 'new']) },
        { label: 'Wrap', type: 'checkbox', checked: this.wrap(), action: () => this.wrap.update((w) => !w) },
        {
          label: 'Disabled',
          enabled: false,
          accelerator: 'mod+d',
          action: () => this.log.update((l) => [...l, 'disabled']),
        },
      ],
    },
    { role: 'windowMenu' },
  ]);
  readonly context: SnMenuItem[] = [
    { label: 'Restore', action: () => this.log.update((l) => [...l, 'restore']) },
    { type: 'separator' },
    { label: 'Delete', accelerator: 'delete', action: () => this.log.update((l) => [...l, 'delete']) },
  ];
}

async function setup(skin: string, theme?: ReturnType<typeof fakeTheme>['theme']) {
  document.documentElement.dataset['snSkin'] = skin;
  if (theme) {
    theme.skin.set(skin);
    TestBed.configureTestingModule({ providers: [{ provide: SpartanNativeTheme, useValue: theme }] });
  }
  const fixture = TestBed.createComponent(Host);
  document.body.append(fixture.nativeElement);
  await fixture.whenStable();
  const el: HTMLElement = fixture.nativeElement;
  return { fixture, el, host: fixture.componentInstance };
}

const overlayItems = () =>
  [
    ...document.querySelectorAll<HTMLElement>(
      '.cdk-overlay-container [data-slot="dropdown-menu"]:last-of-type [role^="menuitem"]',
    ),
  ].map((i) =>
    [i.querySelector('.sn-menu-label')!.textContent!.trim(), i.querySelector('kbd')?.textContent]
      .filter(Boolean)
      .join(' '),
  );

describe('SnMenubar', () => {
  afterEach(() => {
    document.querySelectorAll('.cdk-overlay-container').forEach((n) => n.remove());
    document.querySelectorAll('[ng-version]').forEach((n) => n.remove());
  });

  it('draws the menu in the page without native menus, with skin-styled parts', async () => {
    const { el, fixture } = await setup('win');
    const triggers = [...el.querySelectorAll<HTMLButtonElement>('[data-slot="menubar-trigger"]')];
    expect(el.querySelector('[data-slot="menubar"]')!.getAttribute('role')).toBe('menubar');
    expect(triggers.map((t) => t.textContent!.trim())).toEqual(['File', 'Window']); // no macOS app menu

    triggers[0].click();
    await fixture.whenStable();
    expect(overlayItems()).toEqual(['New backup Ctrl+N', 'Wrap', 'Disabled Ctrl+D']);
    const items = [...document.querySelectorAll<HTMLElement>('.cdk-overlay-container [role^="menuitem"]')];
    expect(items[1].getAttribute('role')).toBe('menuitemcheckbox');
    expect(items[2].getAttribute('aria-disabled')).toBe('true');
  });

  it('runs an item and binds its accelerator in the page', async () => {
    const { el, fixture, host } = await setup('win');
    el.querySelector<HTMLButtonElement>('[data-slot="menubar-trigger"]')!.click();
    await fixture.whenStable();
    document.querySelector<HTMLElement>('.cdk-overlay-container [role="menuitem"]')!.click();
    expect(host.log()).toEqual(['new']);

    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'n', ctrlKey: true, cancelable: true }));
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'd', ctrlKey: true, cancelable: true })); // disabled
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'n', metaKey: true, cancelable: true })); // not on Windows
    expect(host.log()).toEqual(['new', 'new']);
  });

  it('focuses the bar on F10 (not on macOS)', async () => {
    const { el } = await setup('gtk');
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'F10', cancelable: true }));
    expect(document.activeElement).toBe(el.querySelector('[data-slot="menubar-trigger"]'));
  });

  it('becomes the macOS menu bar through the host, and runs what the host reports', async () => {
    const { theme, sent, choose } = fakeTheme();
    const { el, fixture, host } = await setup('mac', theme);
    expect(el.querySelector('sn-menubar')!.hasAttribute('data-native')).toBe(true);
    expect(el.querySelector('[data-slot="menubar"]')).toBeNull();

    const [appMenu, file, windowMenu] = sent.app.at(-1)!;
    expect(appMenu).toEqual({ role: 'appMenu' });
    expect(windowMenu).toEqual({ role: 'windowMenu' });
    expect(file.submenu!.map((i) => [i.label, i.accelerator, i.type, i.checked, i.enabled])).toEqual([
      ['New backup', 'mod+n', undefined, undefined, undefined],
      ['Wrap', undefined, 'checkbox', false, undefined],
      ['Disabled', 'mod+d', undefined, undefined, false],
    ]);

    choose(file.submenu![1].id!); // Wrap
    await fixture.whenStable();
    expect(host.wrap()).toBe(true);
    expect(sent.app.at(-1)![1].submenu![1].checked).toBe(true); // sent again with the new state
    choose(file.submenu![2].id!); // disabled: ignored
    expect(host.log()).toEqual([]);

    // the OS handles the shortcuts natively
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'n', metaKey: true, cancelable: true }));
    expect(host.log()).toEqual([]);

    fixture.destroy();
    expect(sent.app.at(-1)).toEqual([]); // back to the OS default
  });

  it('stays in the page on Windows in auto mode, even with native menus', async () => {
    const { theme } = fakeTheme();
    const { el } = await setup('win', theme);
    expect(el.querySelector('[data-slot="menubar"]')).not.toBeNull();
    expect(theme.menus.setApplicationMenu).not.toHaveBeenCalled();
  });

  it('follows the real OS, not the skin: a Mac dressed as Windows keeps the macOS menu bar', async () => {
    const { theme } = fakeTheme();
    theme.native.set('mac');
    const { el } = await setup('win', theme);
    expect(el.querySelector('[data-slot="menubar"]')).toBeNull();
    expect(theme.menus.setApplicationMenu).toHaveBeenCalled();
  });

  it('a PC dressed as macOS keeps the menu in the page, with Ctrl shortcuts', async () => {
    const { theme } = fakeTheme('none');
    theme.native.set('win');
    const { el } = await setup('mac', theme);
    expect(el.querySelector('[data-slot="menubar"]')).not.toBeNull();
    expect(theme.menus.setApplicationMenu).not.toHaveBeenCalled();
  });
});

describe('SnContextMenu', () => {
  afterEach(() => {
    document.querySelectorAll('.cdk-overlay-container').forEach((n) => n.remove());
    document.querySelectorAll('[ng-version]').forEach((n) => n.remove());
  });

  it('opens an in-page menu at the pointer without native menus', async () => {
    const { el, fixture, host } = await setup('win');
    const target = el.querySelector<HTMLElement>('#target')!;
    const event = new MouseEvent('contextmenu', {
      bubbles: true,
      cancelable: true,
      button: 2,
      clientX: 40,
      clientY: 50,
    });
    target.dispatchEvent(event);
    await fixture.whenStable();
    expect(event.defaultPrevented).toBe(true);
    expect(overlayItems()).toEqual(['Restore', 'Delete Del']);
    expect(document.querySelector('.cdk-overlay-container [role="separator"]')).not.toBeNull();
    document.querySelector<HTMLElement>('.cdk-overlay-container [role="menuitem"]')!.click();
    expect(host.log()).toEqual(['restore']);
  });

  it('shows the OS context menu through the host', async () => {
    const { theme, sent, choose } = fakeTheme();
    const { el, fixture, host } = await setup('win', theme);
    const event = new MouseEvent('contextmenu', {
      bubbles: true,
      cancelable: true,
      button: 2,
      clientX: 40,
      clientY: 50,
    });
    el.querySelector('#target')!.dispatchEvent(event);
    await fixture.whenStable();
    await flush();
    expect(event.defaultPrevented).toBe(true);
    expect(document.querySelector('.cdk-overlay-container [data-slot="dropdown-menu"]')).toBeNull();
    const { menu, at } = sent.context.at(-1)!;
    expect(at).toEqual({ x: 40, y: 50 });
    expect(menu.map((i) => i.label ?? i.type)).toEqual(['Restore', 'separator', 'Delete']);
    choose(menu[2].id!);
    expect(host.log()).toEqual(['delete']);
  });
});
