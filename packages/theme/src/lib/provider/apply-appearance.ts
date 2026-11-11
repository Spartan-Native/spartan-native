import type { AppearanceState } from '../contract/native-host';
import { derivePalette } from '../palette/derive-palette';
import { paletteToCssVars } from '../palette/palette-css-vars';
import { skinClasses } from '../skin/resolve-skin';

/** Everything applySpartanNative() needs: the OS appearance plus window focus. */
export interface ResolvedAppearance extends AppearanceState {
  focused: boolean;
}

/** Classes this module owns on the root element; anything else is left alone. */
const OWNED = /^(t-[a-z0-9]+|dark|rt|inactive|hc|reduce-motion)$/;

/**
 * Writes an appearance onto a root element (usually `<html>`):
 *  - classes: `t-<skin>`, `dark`, `rt` (reduce transparency), `inactive` (window not focused),
 *    `hc` (more/forced contrast), `reduce-motion`
 *  - variables: every `--sn-color-*` from derivePalette(), plus `--sn-text-scale`
 *  - `color-scheme`, so native form controls and scrollbars follow light/dark
 *
 * Pure DOM: used by the SpartanNativeTheme service, Storybook and tests.
 */
export function applySpartanNative(root: HTMLElement, a: ResolvedAppearance): void {
  const classes = [
    ...skinClasses(a.skin),
    ...(a.scheme === 'dark' ? ['dark'] : []),
    ...(a.reduceTransparency ? ['rt'] : []),
    ...(a.focused ? [] : ['inactive']),
    ...(a.contrast !== 'normal' ? ['hc'] : []),
    ...(a.reduceMotion ? ['reduce-motion'] : []),
  ];
  const stale = Array.from(root.classList).filter((c) => OWNED.test(c) && !classes.includes(c));
  root.classList.remove(...stale);
  root.classList.add(...classes);
  root.dataset['snSkin'] = a.skin;

  const vars = paletteToCssVars(
    derivePalette({ skin: a.skin, accent: a.accent, scheme: a.scheme, reduceTransparency: a.reduceTransparency }),
  );
  for (const [name, value] of Object.entries(vars)) root.style.setProperty(name, value);
  root.style.setProperty('--sn-text-scale', String(a.textScale));
  root.style.colorScheme = a.scheme;
}
