import { keyWidth, panelWidth } from './resizable';

describe('resizable panelWidth', () => {
  it('is the share of the parent, within the limits', () => {
    expect(panelWidth(0.25, 1000, 192, 0.5)).toBe(250);
    expect(panelWidth(0.1, 1000, 192, 0.5)).toBe(192);
    expect(panelWidth(0.9, 1000, 192, 0.5)).toBe(500);
  });

  it('never goes under the minimum, even when the parent is narrow', () => {
    expect(panelWidth(0.5, 300, 192, 0.5)).toBe(192);
  });

  it('is 0 when there is nothing to measure', () => {
    expect(panelWidth(0.3, 0, 192, 0.5)).toBe(0);
  });
});

describe('resizable keyWidth', () => {
  it('grows with the arrow pointing away from the panel', () => {
    // a sidebar: the handle on its right edge
    expect(keyWidth('ArrowRight', false, 200, false)).toBe(216);
    expect(keyWidth('ArrowLeft', true, 200, false)).toBe(136);
    // an inspector: the handle on its left edge
    expect(keyWidth('ArrowLeft', false, 200, true)).toBe(216);
    expect(keyWidth('ArrowRight', false, 200, true)).toBe(184);
  });

  it('jumps to the limits with Home and End, and ignores other keys', () => {
    expect(keyWidth('Home', false, 200, false)).toBe(0);
    expect(keyWidth('End', false, 200, false)).toBe(Number.MAX_SAFE_INTEGER);
    expect(keyWidth('Enter', false, 200, false)).toBeNull();
  });
});
