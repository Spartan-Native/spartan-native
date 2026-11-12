import { ChangeDetectionStrategy, Component, input, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { SnTreeImports } from './tree';

@Component({
  imports: [SnTreeImports],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <sn-tree aria-label="Folders" [multiple]="multiple()" [(selection)]="selection" (activated)="opened.set($event)">
      <sn-tree-item value="docs" label="Documents" [(expanded)]="docsOpen">
        <sn-tree-item value="taxes" label="Taxes" />
        <sn-tree-item value="work" label="Work">
          <sn-tree-item value="reports" label="Reports" />
        </sn-tree-item>
      </sn-tree-item>
      @for (f of extra(); track f) {
        <sn-tree-item [value]="f" [label]="f" />
      }
    </sn-tree>
  `,
})
class Host {
  readonly multiple = signal(false);
  readonly selection = signal<readonly string[]>([]);
  readonly docsOpen = signal(false);
  readonly extra = signal(['Music', 'Photos']);
  readonly opened = signal<string | null>(null);
}

async function setup(skin = 'win') {
  document.documentElement.dataset['snSkin'] = skin;
  const fixture = TestBed.createComponent(Host);
  document.body.append(fixture.nativeElement);
  await fixture.whenStable();
  await new Promise((r) => setTimeout(r)); // afterNextRender reads the order
  await fixture.whenStable();
  const el: HTMLElement = fixture.nativeElement;
  const item = (label: string) => el.querySelector<HTMLElement>(`[role="treeitem"][aria-label="${label}"]`)!;
  const focused = () => (document.activeElement as HTMLElement).getAttribute('aria-label');
  const key = async (k: string, init: KeyboardEventInit = {}) => {
    document.activeElement!.dispatchEvent(
      new KeyboardEvent('keydown', { key: k, bubbles: true, cancelable: true, ...init }),
    );
    await fixture.whenStable();
  };
  const click = async (label: string, init: MouseEventInit = {}) => {
    item(label)
      .querySelector('.row')!
      .dispatchEvent(new MouseEvent('click', { bubbles: true, ...init }));
    await fixture.whenStable();
  };
  return { fixture, el, host: fixture.componentInstance, item, focused, key, click };
}

describe('SnTree', () => {
  afterEach(() => document.querySelectorAll('[ng-version]').forEach((n) => n.remove()));

  it('has tree semantics and one Tab stop', async () => {
    const { el, item } = await setup();
    expect(el.querySelector('sn-tree')!.getAttribute('role')).toBe('tree');
    expect(item('Documents').getAttribute('aria-level')).toBe('1');
    expect(item('Documents').getAttribute('aria-expanded')).toBe('false');
    expect(item('Reports').getAttribute('aria-level')).toBe('3');
    expect(item('Music').hasAttribute('aria-expanded')).toBe(false);
    expect(item('Music').getAttribute('aria-selected')).toBe('false');
    const stops = [...el.querySelectorAll<HTMLElement>('[role="treeitem"]')].filter((i) => i.tabIndex === 0);
    expect(stops.map((i) => i.getAttribute('aria-label'))).toEqual(['Documents']);
  });

  it('walks the visible items, opens with → and closes with ←', async () => {
    const { host, item, focused, key } = await setup();
    item('Documents').focus();
    await key('ArrowDown');
    expect(focused()).toBe('Music'); // the children are hidden
    expect(host.selection()).toEqual(['Music']); // selection follows focus
    await key('ArrowUp');
    await key('ArrowRight');
    expect(host.docsOpen()).toBe(true);
    expect(focused()).toBe('Documents');
    await key('ArrowRight');
    expect(focused()).toBe('Taxes');
    await key('ArrowDown');
    await key('ArrowRight'); // opens Work
    await key('ArrowRight');
    expect(focused()).toBe('Reports');
    await key('ArrowLeft'); // a leaf: to its parent
    expect(focused()).toBe('Work');
    await key('End');
    expect(focused()).toBe('Photos');
    await key('Home');
    expect(focused()).toBe('Documents');
    await key('ArrowLeft'); // closes it
    expect(host.docsOpen()).toBe(false);
  });

  it('moves the selection to a parent that closes over it', async () => {
    const { host, fixture, item, key, focused, click } = await setup();
    host.docsOpen.set(true);
    await fixture.whenStable();
    await click('Taxes');
    expect(host.selection()).toEqual(['taxes']);
    item('Documents').querySelector<HTMLElement>('.expander')!.click();
    await new Promise((r) => setTimeout(r));
    expect(host.docsOpen()).toBe(false);
    expect(host.selection()).toEqual(['docs']);
    expect(focused()).toBe('Documents');
    await key('Enter');
    expect(host.opened()).toBe('docs');
  });

  it('supports Shift and Ctrl with multiple', async () => {
    const { host, fixture, click, key } = await setup();
    host.multiple.set(true);
    host.docsOpen.set(true);
    await fixture.whenStable();
    await click('Taxes');
    await click('Music', { shiftKey: true });
    expect(host.selection()).toEqual(['taxes', 'work', 'Music']);
    await click('Documents', { ctrlKey: true });
    expect(host.selection()).toEqual(['docs', 'taxes', 'work', 'Music']);
    await key('a', { ctrlKey: true });
    expect(host.selection()).toEqual(['docs', 'taxes', 'work', 'Music', 'Photos']); // Reports is hidden
  });

  it('jumps by type-ahead and opens all siblings with *', async () => {
    const { host, item, focused, key } = await setup();
    item('Documents').focus();
    await key('p');
    expect(focused()).toBe('Photos');
    await key('*');
    expect(host.docsOpen()).toBe(true);
  });

  it('drops removed items from the selection', async () => {
    const { host, fixture, click } = await setup();
    await click('Photos');
    expect(host.selection()).toEqual(['Photos']);
    host.extra.set(['Music']);
    await fixture.whenStable();
    expect(host.selection()).toEqual([]);
  });
});

interface Node {
  id: string;
  children?: Node[];
}

@Component({
  selector: 'sn-test-node',
  imports: [SnTreeImports],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <sn-tree-item [value]="node().id" [label]="node().id" [expanded]="true">
      @for (child of node().children ?? []; track child.id) {
        <sn-test-node [node]="child" />
      }
    </sn-tree-item>
  `,
})
class TestNode {
  readonly node = input.required<Node>();
}

@Component({
  imports: [SnTreeImports, TestNode],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<sn-tree aria-label="Data"><sn-test-node [node]="root" /><sn-test-node [node]="{ id: 'z' }" /></sn-tree>`,
})
class RecursiveHost {
  readonly root: Node = { id: 'a', children: [{ id: 'b', children: [{ id: 'c' }] }, { id: 'd' }] };
}

describe('SnTree with a recursive component', () => {
  it('finds parents through injection and the order through the document', async () => {
    document.documentElement.dataset['snSkin'] = 'win';
    const fixture = TestBed.createComponent(RecursiveHost);
    document.body.append(fixture.nativeElement);
    await fixture.whenStable();
    await new Promise((r) => setTimeout(r));
    await fixture.whenStable();
    const el: HTMLElement = fixture.nativeElement;
    const levels = [...el.querySelectorAll('[role="treeitem"]')].map(
      (i) => `${i.getAttribute('aria-label')}${i.getAttribute('aria-level')}`,
    );
    expect(levels).toEqual(['a1', 'b2', 'c3', 'd2', 'z1']);

    el.querySelector<HTMLElement>('[aria-label="a"]')!.focus();
    const order: string[] = [];
    for (let i = 0; i < 4; i++) {
      document.activeElement!.dispatchEvent(
        new KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true, cancelable: true }),
      );
      await fixture.whenStable();
      order.push((document.activeElement as HTMLElement).getAttribute('aria-label')!);
    }
    expect(order).toEqual(['b', 'c', 'd', 'z']);
    fixture.nativeElement.remove();
  });
});
