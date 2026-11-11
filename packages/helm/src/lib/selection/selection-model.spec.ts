import {
  EMPTY_SELECTION,
  selectionAll,
  selectionClear,
  selectionClick,
  selectionMoveBy,
  selectionMoveTo,
  selectionSync,
  selectionToggleActive,
  type SelectionState,
  typeaheadIndex,
} from './selection-model';

const KEYS = ['a', 'b', 'c', 'd', 'e'];
const start: SelectionState<string> = EMPTY_SELECTION;

describe('selection model', () => {
  describe('click', () => {
    it('selects one item and sets anchor and cursor', () => {
      expect(selectionClick(start, KEYS, 'c')).toEqual({ selected: ['c'], anchor: 'c', active: 'c' });
    });

    it('Ctrl/⌘-click toggles and keeps item order', () => {
      let s = selectionClick(start, KEYS, 'd');
      s = selectionClick(s, KEYS, 'b', { toggle: true });
      expect(s.selected).toEqual(['b', 'd']);
      s = selectionClick(s, KEYS, 'd', { toggle: true });
      expect(s.selected).toEqual(['b']);
      expect(s.anchor).toBe('d');
    });

    it('Shift-click selects the range from the anchor, in either direction', () => {
      const s = selectionClick(start, KEYS, 'd');
      expect(selectionClick(s, KEYS, 'b', { range: true }).selected).toEqual(['b', 'c', 'd']);
      expect(selectionClick(s, KEYS, 'e', { range: true }).selected).toEqual(['d', 'e']);
      expect(selectionClick(s, KEYS, 'b', { range: true }).anchor).toBe('d');
    });

    it('Ctrl+Shift-click adds the range to the selection', () => {
      let s = selectionClick(start, KEYS, 'a');
      s = selectionClick(s, KEYS, 'd', { toggle: true });
      s = selectionClick(s, KEYS, 'e', { range: true, toggle: true });
      expect(s.selected).toEqual(['a', 'd', 'e']);
    });

    it('ignores modifiers in single-selection mode', () => {
      const s = selectionClick(selectionClick(start, KEYS, 'a', {}, false), KEYS, 'c', { toggle: true, range: true }, false);
      expect(s.selected).toEqual(['c']);
    });
  });

  describe('keyboard', () => {
    it('Down from nothing starts at the top, Up at the bottom', () => {
      expect(selectionMoveBy(start, KEYS, 1).active).toBe('a');
      expect(selectionMoveBy(start, KEYS, -1).active).toBe('e');
    });

    it('arrows select the new item; Shift extends from the anchor', () => {
      let s = selectionMoveTo(start, KEYS, 1); // b
      s = selectionMoveBy(s, KEYS, 1, { range: true }); // b..c
      s = selectionMoveBy(s, KEYS, 1, { range: true }); // b..d
      expect(s.selected).toEqual(['b', 'c', 'd']);
      s = selectionMoveBy(s, KEYS, -3, { range: true }); // a..b (clamped)
      expect(s.selected).toEqual(['a', 'b']);
    });

    it('Ctrl + arrow moves the cursor only; Ctrl+Space toggles it', () => {
      let s = selectionMoveTo(start, KEYS, 0);
      s = selectionMoveBy(s, KEYS, 2, { toggle: true });
      expect(s).toEqual({ selected: ['a'], anchor: 'a', active: 'c' });
      s = selectionToggleActive(s, KEYS, { toggle: true });
      expect(s.selected).toEqual(['a', 'c']);
    });

    it('Home / End clamp to the ends', () => {
      expect(selectionMoveTo(start, KEYS, -5).active).toBe('a');
      expect(selectionMoveTo(start, KEYS, 99).active).toBe('e');
    });

    it('select all and clear', () => {
      const all = selectionAll(selectionMoveTo(start, KEYS, 2), KEYS);
      expect(all.selected).toEqual(KEYS);
      expect(all.active).toBe('c');
      expect(selectionClear(all).selected).toEqual([]);
      expect(selectionAll(start, KEYS, false)).toBe(start);
    });
  });

  it('sync drops removed keys', () => {
    const s = selectionClick(selectionClick(start, KEYS, 'b'), KEYS, 'd', { toggle: true });
    expect(selectionSync(s, ['a', 'b', 'c'])).toEqual({ selected: ['b'], anchor: null, active: null });
  });

  describe('type-ahead', () => {
    const labels = ['Budget.xlsx', 'Backup.zip', 'Q4 Report.pdf', 'Roadmap.png', 'Readme.md'];

    it('finds the first match for a word', () => {
      expect(typeaheadIndex(labels, 'rea', -1)).toBe(4);
      expect(typeaheadIndex(labels, 'q4', 0)).toBe(2);
    });

    it('a repeated letter cycles through matches', () => {
      expect(typeaheadIndex(labels, 'r', -1)).toBe(3);
      expect(typeaheadIndex(labels, 'rr', 3)).toBe(4);
      expect(typeaheadIndex(labels, 'rrr', 4)).toBe(3);
    });

    it('returns -1 when nothing matches', () => {
      expect(typeaheadIndex(labels, 'z', 0)).toBe(-1);
    });
  });
});
