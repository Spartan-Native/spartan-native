import { formatShortcut } from './shortcut';

describe('formatShortcut', () => {
  it('uses symbols in Apple order on macOS', () => {
    expect(formatShortcut('mod+shift+s', 'macos')).toBe('⇧⌘S');
    expect(formatShortcut('alt+mod+i', 'macos')).toBe('⌥⌘I');
    expect(formatShortcut('ctrl+mod+f', 'macos')).toBe('⌃⌘F');
    expect(formatShortcut('mod+backspace', 'macos')).toBe('⌘⌫');
    expect(formatShortcut('mod+,', 'macos')).toBe('⌘,');
  });

  it('uses Ctrl+ words on Windows and Linux, mod and ctrl merged', () => {
    expect(formatShortcut('mod+shift+s', 'windows')).toBe('Ctrl+Shift+S');
    expect(formatShortcut('mod+ctrl+s', 'linux')).toBe('Ctrl+S');
    expect(formatShortcut('delete', 'windows')).toBe('Del');
    expect(formatShortcut('alt+f4', 'windows')).toBe('Alt+F4');
  });
});
