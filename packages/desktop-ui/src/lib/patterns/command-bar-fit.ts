/** What fitCommandBar() needs from a command: SnCommand has exactly this shape. */
export interface FittableCommand {
  readonly element: HTMLElement;
  icon(): string;
  priority(): number;
  secondary(): boolean;
  collapsed(): boolean;
  /** Moves the command into (true) or out of the overflow menu, in the DOM right away. */
  setCollapsed(collapsed: boolean): void;
}

export interface CommandBarFitInput<C extends FittableCommand> {
  /** The bar's host element: it overflows when its content is wider than it. */
  readonly host: HTMLElement;
  /** The title, which must not be cut either. */
  readonly title: HTMLElement | undefined;
  /** The overflow button. */
  readonly more: HTMLElement;
  /** The commands, in document order, without the overflow button. */
  readonly commands: readonly C[];
  /** `collapse: 'auto'`: drop labels and collapse commands when the bar is too narrow. */
  readonly collapse: boolean;
  /** The skin shows labels, so dropping them is the first way to make room. */
  readonly labelsShown: boolean;
  /** The overflow menu has entries of its own (`overflowItems` or an `snCommandOverflow` template). */
  readonly hasOwnMenu: boolean;
}

export interface CommandBarFitResult<C extends FittableCommand> {
  /** The labels were dropped to make room (`data-compact` is set on the host). */
  readonly compact: boolean;
  /** The commands now in the overflow menu, in document order. */
  readonly collapsed: readonly C[];
}

/** 1px of slack: sub-pixel rounding must not count as overflow. */
const SLACK = 1;

/**
 * Makes the commands fit the bar. It starts with everything shown (only `secondary` commands
 * in the overflow menu). Then, while the bar overflows or the title is cut:
 *  1. on skins that show labels, it drops them (`data-compact` on the host);
 *  2. it moves commands into the overflow menu one at a time, lowest `priority` first, and the
 *     later one first on a tie.
 *
 * It changes the DOM directly and measures after every step, so it must run after render.
 */
export function fitCommandBar<C extends FittableCommand>(input: CommandBarFitInput<C>): CommandBarFitResult<C> {
  const { host, title, more, commands } = input;

  for (const command of commands) command.setCollapsed(command.secondary());
  host.removeAttribute('data-compact');
  let compact = false;

  const updateOverflowButton = () => {
    more.hidden = !(commands.some((command) => command.collapsed()) || input.hasOwnMenu);
  };
  updateOverflowButton();

  const overflowing = () =>
    host.scrollWidth > host.clientWidth + SLACK || (!!title && title.scrollWidth > title.clientWidth + SLACK);

  if (input.collapse && overflowing()) {
    const anyIcon = commands.some((command) => command.icon() || command.element.querySelector('svg, ng-icon, img'));
    if (input.labelsShown && anyIcon) {
      compact = true;
      host.setAttribute('data-compact', '');
    }

    const collapseOrder = commands
      .map((command, index) => ({ command, index }))
      .filter(({ command }) => !command.secondary())
      .sort((a, b) => a.command.priority() - b.command.priority() || b.index - a.index);
    for (const { command } of collapseOrder) {
      if (!overflowing()) break;
      command.setCollapsed(true);
      updateOverflowButton();
    }
  }

  return { compact, collapsed: commands.filter((command) => command.collapsed()) };
}
