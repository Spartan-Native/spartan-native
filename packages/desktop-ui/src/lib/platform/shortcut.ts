import { computed, Directive, input } from '@angular/core';
import { injectPlatformFamily, injectSkin, type PlatformFamily } from '@spartan-native/theme';

/**
 * Keyboard shortcuts written once, shown the way each OS shows them. Only the family
 * matters: macOS uses symbols, every other family (Windows, Linux, ChromeOS, web) uses Ctrl+ words.
 *
 *   formatShortcut('mod+shift+s', 'macos')    → '⇧⌘S'
 *   formatShortcut('mod+shift+s', 'windows')  → 'Ctrl+Shift+S'
 *
 * `mod` is ⌘ on macOS and Ctrl everywhere else. Other names: ctrl, alt (⌥ / Alt),
 * shift, enter, backspace, delete, escape, tab, space, up, down, left, right,
 * and any single key or F-key.
 */

const MAC_ORDER = ['ctrl', 'alt', 'shift', 'mod'] as const; // ⌃ ⌥ ⇧ ⌘, Apple's order
const PC_ORDER = ['mod', 'ctrl', 'alt', 'shift'] as const;

const MAC: Record<string, string> = {
  mod: '⌘', ctrl: '⌃', alt: '⌥', shift: '⇧',
  enter: '↩', backspace: '⌫', delete: '⌦', escape: '⎋', tab: '⇥', space: 'Space',
  up: '↑', down: '↓', left: '←', right: '→',
};
const PC: Record<string, string> = {
  mod: 'Ctrl', ctrl: 'Ctrl', alt: 'Alt', shift: 'Shift',
  enter: 'Enter', backspace: 'Backspace', delete: 'Del', escape: 'Esc', tab: 'Tab', space: 'Space',
  up: '↑', down: '↓', left: '←', right: '→',
};

export function formatShortcut(shortcut: string, family: PlatformFamily): string {
  const parts = shortcut.toLowerCase().split('+').map((p) => p.trim()).filter(Boolean);
  const mac = family === 'macos';
  const order: readonly string[] = mac ? MAC_ORDER : PC_ORDER;
  const names = mac ? MAC : PC;

  const modifiers = order.filter((m) => parts.includes(m));
  const keys = parts.filter((p) => !order.includes(p));
  // On Windows and Linux, mod and ctrl are the same key: show it once
  const shown = mac ? modifiers : [...new Set(modifiers.map((m) => names[m]))];
  const key = keys.map((k) => names[k] ?? k.toUpperCase());

  return mac
    ? [...shown.map((m) => names[m]), ...key].join('')
    : [...shown, ...key].join('+');
}

/**
 * Shows a shortcut in the notation of the keyboard the user really has: the real OS
 * (`injectPlatformFamily()`), not the skin, so a Mac dressed as Windows still shows ⌘.
 *  - macOS: symbols in Apple's order, no separators (⇧⌘S)
 *  - Windows, Linux, ChromeOS, web: words joined with `+` (Ctrl+Shift+S)
 *
 * The text is also the element's aria-label, so screen readers read the same thing.
 *
 * ```html
 * <kbd snShortcut="mod+shift+s"></kbd>   <!-- ⇧⌘S on macOS, Ctrl+Shift+S elsewhere -->
 * ```
 */
@Directive({
  selector: '[snShortcut]',
  host: {
    'data-slot': 'sn-shortcut',
    '[attr.data-family]': 'family()',
    '[attr.data-skin]': 'skin()',
    '[textContent]': 'text()',
    '[attr.aria-label]': 'text()',
  },
})
export class SnShortcut {
  /** The shortcut in the portable notation, e.g. `mod+shift+s`. */
  readonly shortcut = input.required<string>({ alias: 'snShortcut' });
  protected readonly skin = injectSkin();
  protected readonly family = injectPlatformFamily();
  protected readonly text = computed(() => formatShortcut(this.shortcut(), this.family()));
}
