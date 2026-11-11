# Styling: layout only

The skins in `@spartan-native/theme` decide how everything looks on each OS. App CSS decides **where things go**. When app CSS sets a color, a radius or a font, that value is wrong on at least six of the seven skins, and it ignores the user's accent, dark mode, contrast and text size.

## What a component's `.css` file may contain

| Allowed | Examples |
| --- | --- |
| Box layout | `display: flex \| grid`, `flex-direction`, `flex`, `grid-template-*`, `gap`, `align-*`, `justify-*`, `place-*` |
| Size | `inline-size`, `block-size`, `min-*`, `max-*`, `flex-basis`, `aspect-ratio` |
| Spacing | `padding`, `margin` (prefer `rem`, or tokens) |
| Scrolling | `overflow`, `overscroll-behavior`, `scrollbar-gutter` |
| Position | `position`, `inset`, `z-index` (sparingly) |
| Text flow | `text-overflow`, `white-space`, `text-align`, `font-variant-numeric: tabular-nums` |

`:host { display: block }` (or `flex`/`grid`) belongs in nearly every component, because Angular hosts are `display: inline` by default.

## What it must not contain

- Colors and backgrounds: `color`, `background*`, `fill`, `stroke`, hex/`rgb()`/`hsl()`/named colors.
- Borders, radii, shadows, outlines, filters, backdrop filters.
- Font families, sizes and weights (use the skins' typography, or the tokens below).
- Per-OS selectors (`:host-context(.t-mac)`, `.t-win …`). Use `*snPlatformIf` in the template, or the `data-family`/`data-skin` attributes on `sn-*` hosts as a last resort for **layout** only.
- Selectors that restyle an `hlm*` or `sn-*` component's inside.
- `!important`.

## When you do need a visual value, use a token

| Need | Token |
| --- | --- |
| Muted secondary text | `color: var(--sn-color-fg-muted)` or the `sn-text-muted` class |
| A separator line in your own layout | `border-block-start: 1px solid var(--sn-color-border)` |
| Rounded own surface | `border-radius: var(--sn-radius-surface)` (`-control`, `-overlay` also exist) |
| Font size | `var(--sn-font-size)`, `var(--sn-font-size-small)`, `var(--sn-font-size-title)` |
| Control or row height | `var(--sn-control-height)`, `var(--sn-row-height)` |
| Dialog padding | `var(--sn-dialog-padding)` |

Colors: `--sn-color-` + `bg`, `fg`, `fg-muted`, `surface`, `surface-solid`, `primary`, `primary-fg`, `accent`, `accent-text`, `border`, `stroke`, `hover`, `muted`, `ring`, `sidebar`, `danger`/`-fg`, `warning`/`-fg`, `success`/`-fg`. Tailwind's spartan names (`bg-background`, `text-muted-foreground`) map onto the same tokens.

For surfaces, prefer the material classes over tokens: `sn-window`, `sn-sidebar`, `sn-content`, `sn-chrome` (dims when the window loses focus), `sn-glass`, `sn-list-item`.

## Tailwind in templates

Tailwind utility classes are fine **for layout** (`flex`, `gap-2`, `grid-cols-2`, `min-w-0`). Don't use color, border, radius, shadow or font utilities on spartan components; they override the skin. Pick one approach per component (utilities in the template, or a `.css` file) and keep it consistent.

## Example

```css
/* backups.css */
:host {
  display: flex;
  flex-direction: column;
  min-block-size: 0;
}

.table {
  flex: 1;
  overflow: auto;
}

.size {
  text-align: end;
  font-variant-numeric: tabular-nums;
}
```

## Fixing "it looks wrong"

1. Is it a stock component used with the right variant? (`outline` for standard buttons, not `secondary`.)
2. Is a desktop-ui component meant for this? (`sn-settings-row` instead of a card with a switch.)
3. Is a material class missing? (`sn-sidebar` on the nav, `sn-content` on main.)
4. Only then: is the skin itself wrong? That's a bug in `@spartan-native/theme`, not something to patch in the app.
