import type { MenuItem, MenuRole, PlatformFamily } from '@spartan-native/theme';

/**
 * One entry of a desktop-ui menu: the host's plain `MenuItem`, plus the function to run.
 * The same data feeds a native menu (the macOS menu bar, an OS context menu) and the
 * in-page menu that stands in for it elsewhere.
 *
 * ```ts
 * const menu: SnMenuItem[] = [
 *   { role: 'appMenu' },
 *   { label: 'File', submenu: [
 *     { label: 'New backup…', accelerator: 'mod+n', action: () => this.create() },
 *     { type: 'separator' },
 *     { role: 'close' },
 *   ]},
 *   { role: 'editMenu' },
 * ];
 * ```
 */
export interface SnMenuItem extends Omit<MenuItem, 'submenu'> {
  /** Runs when the item is chosen (also from its accelerator in the in-page menubar). */
  readonly action?: () => void;
  readonly submenu?: readonly SnMenuItem[];
}

/** The window actions a role can fall back to in the page. */
export interface SnMenuWindowActions {
  minimize?(): void;
  toggleMaximize?(): void;
  close?(): void;
}

let nextId = 0;

/** Ids of the edit items made from roles: the browser already handles their shortcuts in fields. */
const ROLE_ID = 'sn-role-';

/**
 * Converts to the host's plain data: every item with an `action` gets an `id` (its own, or a
 * generated one), and `actions` maps the ids back to the items.
 */
export function toHostMenu(
  items: readonly SnMenuItem[],
  actions: Map<string, SnMenuItem> = new Map(),
): { menu: MenuItem[]; actions: Map<string, SnMenuItem> } {
  const convert = (list: readonly SnMenuItem[]): MenuItem[] =>
    list.map((item) => {
      const { action, submenu, ...rest } = item;
      let id = rest.id;
      if (action && !id) id = `sn-menu-${nextId++}`;
      if (id && action) actions.set(id, item);
      return { ...rest, ...(id ? { id } : {}), ...(submenu ? { submenu: convert(submenu) } : {}) };
    });
  return { menu: convert(items), actions };
}

/** Drops separators at the edges and next to each other, and submenus left empty. */
export function tidyMenu(items: readonly SnMenuItem[]): SnMenuItem[] {
  const out: SnMenuItem[] = [];
  for (const item of items) {
    if (item.type === 'separator') {
      if (out.length && out[out.length - 1].type !== 'separator') out.push(item);
      continue;
    }
    if (item.submenu) {
      const submenu = tidyMenu(item.submenu);
      if (!submenu.length) continue;
      out.push({ ...item, submenu });
      continue;
    }
    out.push(item);
  }
  while (out.length && out[out.length - 1].type === 'separator') out.pop();
  return out;
}

/** The roles the page can't do anything sensible with (the macOS app menu and its parts). */
const MAC_APP_MENU_ROLES: readonly MenuRole[] = ['appMenu', 'hide', 'hideOthers', 'showAll'];

/**
 * Replaces roles with ordinary items for an in-page menu: Edit and Window submenus, edit
 * commands on the focused field, the window actions through the host. Roles that have no
 * meaning in a page (the macOS app menu, About without an action) are left out.
 */
export function inPageMenu(
  items: readonly SnMenuItem[],
  family: PlatformFamily,
  window: SnMenuWindowActions = {},
  run: (command: EditCommand) => void = runEditCommand,
): SnMenuItem[] {
  const mac = family === 'macos';
  const role = (r: MenuRole, label?: string): SnMenuItem | null => {
    const edit = (command: EditCommand, text: string, accelerator: string): SnMenuItem => ({
      label: label ?? text,
      accelerator,
      action: () => run(command),
      id: `${ROLE_ID}${command}`,
    });
    switch (r) {
      case 'undo':
        return edit('undo', 'Undo', 'mod+z');
      case 'redo':
        return edit('redo', 'Redo', mac ? 'mod+shift+z' : 'mod+y');
      case 'cut':
        return edit('cut', 'Cut', 'mod+x');
      case 'copy':
        return edit('copy', 'Copy', 'mod+c');
      case 'paste':
        return edit('paste', 'Paste', 'mod+v');
      case 'selectAll':
        return edit('selectAll', mac ? 'Select All' : 'Select all', 'mod+a');
      case 'minimize':
        return {
          label: label ?? 'Minimize',
          accelerator: mac ? 'mod+m' : undefined,
          enabled: !!window.minimize,
          action: () => window.minimize?.(),
        };
      case 'zoom':
        return {
          label: label ?? (mac ? 'Zoom' : 'Maximize'),
          enabled: !!window.toggleMaximize,
          action: () => window.toggleMaximize?.(),
        };
      case 'close':
        return {
          label: label ?? (mac ? 'Close Window' : 'Close'),
          accelerator: mac ? 'mod+w' : 'ctrl+w',
          enabled: !!window.close,
          action: () => window.close?.(),
        };
      case 'quit':
        return window.close
          ? {
              label: label ?? (mac ? 'Quit' : 'Exit'),
              accelerator: mac ? 'mod+q' : undefined,
              action: () => window.close?.(),
            }
          : null;
      case 'toggleFullscreen':
        return {
          label: label ?? (mac ? 'Enter Full Screen' : 'Full screen'),
          accelerator: mac ? 'ctrl+mod+f' : 'f11',
          action: toggleFullscreen,
        };
      case 'editMenu':
        return {
          label: label ?? 'Edit',
          submenu: ['undo', 'redo', null, 'cut', 'copy', 'paste', 'selectAll'].map((x) =>
            x ? role(x as MenuRole)! : { type: 'separator' },
          ),
        };
      case 'windowMenu':
        return {
          label: label ?? 'Window',
          submenu: [role('minimize'), role('zoom'), { type: 'separator' as const }, role('close')].filter(
            (x): x is SnMenuItem => !!x,
          ),
        };
      default:
        return null; // about, and the macOS app menu roles
    }
  };

  const convert = (list: readonly SnMenuItem[]): SnMenuItem[] =>
    list.flatMap((item): SnMenuItem[] => {
      if (item.role) {
        if (MAC_APP_MENU_ROLES.includes(item.role)) return [];
        // a role with its own action is just an item (e.g. About with a dialog)
        if (item.action) return [{ ...item, role: undefined }];
        const replaced = role(item.role, item.label);
        return replaced ? [{ ...replaced, enabled: item.enabled === false ? false : replaced.enabled }] : [];
      }
      return [item.submenu ? { ...item, submenu: convert(item.submenu) } : item];
    });

  return tidyMenu(convert(items));
}

export type EditCommand = 'undo' | 'redo' | 'cut' | 'copy' | 'paste' | 'selectAll';

/** Runs an edit command on the focused field, as the OS Edit menu would. */
export function runEditCommand(command: EditCommand): void {
  if (command === 'paste' && navigator.clipboard?.readText) {
    void navigator.clipboard.readText().then(
      (text) => document.execCommand('insertText', false, text),
      () => undefined,
    );
    return;
  }
  document.execCommand(command);
}

function toggleFullscreen(): void {
  if (document.fullscreenElement) void document.exitFullscreen?.();
  else void document.documentElement.requestFullscreen?.();
}

/** Whether a key event is the accelerator (`mod` is ⌘ on macOS, Ctrl elsewhere). */
export function matchesAccelerator(event: KeyboardEvent, accelerator: string, family: PlatformFamily): boolean {
  const parts = accelerator
    .toLowerCase()
    .split('+')
    .map((p) => p.trim());
  const key = parts.pop();
  if (!key) return false;
  const mac = family === 'macos';
  const wants = {
    ctrl: parts.includes('ctrl') || (!mac && parts.includes('mod')),
    meta: parts.includes('meta') || (mac && parts.includes('mod')),
    alt: parts.includes('alt'),
    shift: parts.includes('shift'),
  };
  if (
    event.ctrlKey !== wants.ctrl ||
    event.metaKey !== wants.meta ||
    event.altKey !== wants.alt ||
    event.shiftKey !== wants.shift
  ) {
    return false;
  }
  const NAMES: Record<string, string> = {
    enter: 'enter',
    escape: 'escape',
    backspace: 'backspace',
    delete: 'delete',
    tab: 'tab',
    space: ' ',
    up: 'arrowup',
    down: 'arrowdown',
    left: 'arrowleft',
    right: 'arrowright',
    home: 'home',
    end: 'end',
  };
  const pressed = event.key.toLowerCase();
  if (NAMES[key]) return pressed === NAMES[key];
  // Shift changes the character ("s" → "S", "," → "<"): fall back to the physical key
  return pressed === key || event.code.toLowerCase() === `key${key}` || event.code.toLowerCase() === `digit${key}`;
}

/** Every item with an action and an accelerator, at any depth (for the in-page key bindings). */
export function itemsWithAccelerators(items: readonly SnMenuItem[]): SnMenuItem[] {
  return items.flatMap((item) => [
    ...(item.action && item.accelerator && item.type !== 'separator' && !item.id?.startsWith(ROLE_ID) ? [item] : []),
    ...(item.submenu ? itemsWithAccelerators(item.submenu) : []),
  ]);
}
