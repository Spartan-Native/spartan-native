import { fitCommandBar, type FittableCommand } from './command-bar-fit';

/** A bar with no real layout: each visible command takes `commandWidth`, and labels double it. */
function fakeBar(options: { width: number; commandWidth: number }) {
  const host = document.createElement('div');
  const more = document.createElement('button');
  const commands: (FittableCommand & { name: string })[] = [];
  const contentWidth = () => {
    const labelFactor = host.hasAttribute('data-compact') ? 1 : 2;
    const visible = commands.filter((c) => !c.collapsed()).length;
    return visible * options.commandWidth * labelFactor + (more.hidden ? 0 : options.commandWidth);
  };
  Object.defineProperty(host, 'scrollWidth', { get: contentWidth });
  Object.defineProperty(host, 'clientWidth', { get: () => options.width });

  const add = (name: string, priority = 0, secondary = false) => {
    let collapsed = false;
    const element = document.createElement('button');
    commands.push({
      name,
      element,
      icon: () => 'lucideStar',
      priority: () => priority,
      secondary: () => secondary,
      collapsed: () => collapsed,
      setCollapsed: (value) => (collapsed = value),
    });
  };
  return { host, more, commands, add };
}

const names = (commands: readonly { name: string }[]) => commands.map((c) => c.name);

describe('fitCommandBar', () => {
  it('leaves everything in the bar when it fits', () => {
    const bar = fakeBar({ width: 1000, commandWidth: 40 });
    bar.add('new');
    bar.add('share');
    const result = fitCommandBar({ ...bar, title: undefined, collapse: true, labelsShown: true, hasOwnMenu: false });
    expect(result.compact).toBe(false);
    expect(result.collapsed).toEqual([]);
    expect(bar.more.hidden).toBe(true);
  });

  it('drops labels first, then collapses the lowest priority, the later one first on a tie', () => {
    // 4 commands × 40 = 160 without labels; 100 wide leaves room for 1 command plus the overflow button.
    const bar = fakeBar({ width: 100, commandWidth: 40 });
    bar.add('new', 2);
    bar.add('share', 0);
    bar.add('rename', 0);
    bar.add('delete', 1);
    const result = fitCommandBar({ ...bar, title: undefined, collapse: true, labelsShown: true, hasOwnMenu: false });
    expect(result.compact).toBe(true);
    expect(names(result.collapsed)).toEqual(['share', 'rename', 'delete']);
    expect(bar.more.hidden).toBe(false);
  });

  it('keeps secondary commands in the overflow menu, and changes nothing else with collapse off', () => {
    const bar = fakeBar({ width: 10, commandWidth: 40 });
    bar.add('new');
    bar.add('rename', 0, true);
    const result = fitCommandBar({ ...bar, title: undefined, collapse: false, labelsShown: true, hasOwnMenu: false });
    expect(result.compact).toBe(false);
    expect(names(result.collapsed)).toEqual(['rename']);
    expect(bar.more.hidden).toBe(false);
  });
});
