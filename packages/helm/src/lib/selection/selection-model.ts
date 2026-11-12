/**
 * The desktop selection model, as pure functions.
 *
 * It follows how Explorer, Finder and Nautilus behave:
 *  - click selects one item and sets the anchor
 *  - Ctrl-click (⌘-click on macOS) toggles one item and moves the anchor
 *  - Shift-click selects the range from the anchor; with Ctrl/⌘ it adds the range
 *  - arrows / Home / End move the active item and select it; with Shift they extend
 *    the range from the anchor; with Ctrl they move the focus without selecting
 *  - Ctrl/⌘+A selects all, Esc clears
 *
 * No Angular and no DOM here: the directives in selectable.ts feed events in.
 */

/** How many items Page Up and Page Down move the active item by. */
export const SELECTION_PAGE_SIZE = 10;

/** How long type-ahead keeps adding typed characters to one search before it starts over, in ms. */
export const TYPEAHEAD_RESET_MS = 600;

export interface SelectionState<K> {
  /** Selected keys, always in item order. */
  readonly selected: readonly K[];
  /** Where a Shift range starts. */
  readonly anchor: K | null;
  /** The keyboard cursor (focused row). */
  readonly active: K | null;
}

export interface SelectionModifiers {
  /** Shift is held. */
  readonly range?: boolean;
  /** Ctrl (Windows, Linux) or ⌘ (macOS) is held. */
  readonly toggle?: boolean;
}

export const EMPTY_SELECTION: SelectionState<never> = { selected: [], anchor: null, active: null };

/** Keep only keys that still exist, in item order. */
function ordered<K>(keys: readonly K[], selected: Iterable<K>): K[] {
  const set = new Set(selected);
  return keys.filter((k) => set.has(k));
}

function range<K>(keys: readonly K[], from: K | null, to: K): K[] {
  const a = from === null ? -1 : keys.indexOf(from);
  const b = keys.indexOf(to);
  if (a < 0) return [to];
  return keys.slice(Math.min(a, b), Math.max(a, b) + 1);
}

/** The state after a pointer click on `key`. */
export function selectionClick<K>(
  state: SelectionState<K>,
  keys: readonly K[],
  key: K,
  mods: SelectionModifiers = {},
  multiple = true,
): SelectionState<K> {
  if (!keys.includes(key)) return state;
  if (!multiple) return { selected: [key], anchor: key, active: key };

  if (mods.range) {
    const span = range(keys, state.anchor, key);
    const selected = mods.toggle ? ordered(keys, [...state.selected, ...span]) : span;
    return { selected, anchor: state.anchor ?? key, active: key };
  }
  if (mods.toggle) {
    const isOn = state.selected.includes(key);
    const selected = isOn ? state.selected.filter((k) => k !== key) : ordered(keys, [...state.selected, key]);
    return { selected, anchor: key, active: key };
  }
  return { selected: [key], anchor: key, active: key };
}

/** The state after the keyboard moves the active item to `index` (clamped). */
export function selectionMoveTo<K>(
  state: SelectionState<K>,
  keys: readonly K[],
  index: number,
  mods: SelectionModifiers = {},
  multiple = true,
): SelectionState<K> {
  if (keys.length === 0) return state;
  const target = keys[Math.max(0, Math.min(keys.length - 1, index))];

  if (!multiple) return { selected: [target], anchor: target, active: target };
  if (mods.range) {
    const span = range(keys, state.anchor ?? state.active, target);
    const selected = mods.toggle ? ordered(keys, [...state.selected, ...span]) : span;
    return { selected, anchor: state.anchor ?? state.active ?? target, active: target };
  }
  // Ctrl + arrow: move the focus only
  if (mods.toggle) return { ...state, active: target };
  return { selected: [target], anchor: target, active: target };
}

/** Move the active item by `delta` rows. With nothing active, Down starts at the top and Up at the bottom. */
export function selectionMoveBy<K>(
  state: SelectionState<K>,
  keys: readonly K[],
  delta: number,
  mods: SelectionModifiers = {},
  multiple = true,
): SelectionState<K> {
  const current = state.active === null ? -1 : keys.indexOf(state.active);
  const start = current < 0 ? (delta > 0 ? -1 : keys.length) : current;
  return selectionMoveTo(state, keys, start + delta, mods, multiple);
}

/** Space: select the active item, or toggle it with Ctrl/⌘. */
export function selectionToggleActive<K>(
  state: SelectionState<K>,
  keys: readonly K[],
  mods: SelectionModifiers = {},
  multiple = true,
): SelectionState<K> {
  if (state.active === null) return state;
  return selectionClick(state, keys, state.active, { toggle: mods.toggle }, multiple);
}

export function selectionAll<K>(state: SelectionState<K>, keys: readonly K[], multiple = true): SelectionState<K> {
  if (!multiple) return state;
  return { selected: [...keys], anchor: keys[0] ?? null, active: state.active ?? keys[0] ?? null };
}

export function selectionClear<K>(state: SelectionState<K>): SelectionState<K> {
  return { ...state, selected: [] };
}

/** Drop keys that no longer exist (items removed), keeping order. */
export function selectionSync<K>(state: SelectionState<K>, keys: readonly K[]): SelectionState<K> {
  const has = (k: K | null) => k !== null && keys.includes(k);
  return {
    selected: ordered(keys, state.selected),
    anchor: has(state.anchor) ? state.anchor : null,
    active: has(state.active) ? state.active : null,
  };
}

/**
 * Type-ahead: the index of the next item whose label starts with `query`.
 * A repeated single letter cycles through matches, like Explorer and Finder.
 */
export function typeaheadIndex(labels: readonly string[], query: string, fromIndex: number): number {
  if (!query || labels.length === 0) return -1;
  const q = query.toLocaleLowerCase();
  const cycling = [...q].every((c) => c === q[0]);
  const needle = cycling ? q[0] : q;
  const start = cycling ? fromIndex + 1 : Math.max(0, fromIndex);
  for (let i = 0; i < labels.length; i++) {
    const idx = (start + i) % labels.length;
    if (labels[idx].toLocaleLowerCase().startsWith(needle)) return idx;
  }
  return -1;
}
