import { nextIndex } from './sidebar-nav';

describe('sidebar nextIndex', () => {
  it('moves with the arrows and stops at the ends', () => {
    expect(nextIndex('ArrowDown', 0, 3)).toBe(1);
    expect(nextIndex('ArrowDown', 2, 3)).toBe(2);
    expect(nextIndex('ArrowUp', 1, 3)).toBe(0);
    expect(nextIndex('ArrowUp', 0, 3)).toBe(0);
  });

  it('jumps with Home and End, and starts at an end when nothing is focused', () => {
    expect(nextIndex('Home', 2, 3)).toBe(0);
    expect(nextIndex('End', 0, 3)).toBe(2);
    expect(nextIndex('ArrowDown', -1, 3)).toBe(0);
    expect(nextIndex('ArrowUp', -1, 3)).toBe(2);
  });

  it('ignores other keys', () => {
    expect(nextIndex('Enter', 0, 3)).toBeNull();
  });
});
