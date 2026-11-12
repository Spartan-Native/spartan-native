/**
 * How a web app is running:
 *  - 'browser'  in a browser tab
 *  - 'standalone' installed (PWA): the OS draws the whole title bar
 *  - 'overlay'  installed with Window Controls Overlay: the OS draws only the
 *               window buttons; the app draws its own title bar in the
 *               `env(titlebar-area-*)` rectangle
 */
export type DisplayMode = 'browser' | 'standalone' | 'overlay';

interface WindowControlsOverlayLike extends EventTarget {
  readonly visible: boolean;
}

export function readDisplayMode(win: Window): DisplayMode {
  const overlay = (win.navigator as Navigator & { windowControlsOverlay?: WindowControlsOverlayLike })
    .windowControlsOverlay;
  if (overlay?.visible) return 'overlay';
  const media = (q: string) => win.matchMedia?.(q).matches ?? false;
  if (media('(display-mode: window-controls-overlay)')) return 'overlay';
  if (
    media('(display-mode: standalone)') ||
    media('(display-mode: minimal-ui)') ||
    media('(display-mode: fullscreen)')
  ) {
    return 'standalone';
  }
  return 'browser';
}

/**
 * Calls `cb` now and whenever the display mode changes (installing, or the user
 * toggling the title bar in an installed app). Returns an unsubscribe function.
 */
export function watchDisplayMode(
  cb: (mode: DisplayMode) => void,
  win: Window | undefined = globalThis.window,
): () => void {
  if (!win) {
    cb('browser');
    return () => undefined;
  }
  let last: DisplayMode | null = null;
  const update = () => {
    const mode = readDisplayMode(win);
    if (mode !== last) cb((last = mode));
  };
  const queries = [
    '(display-mode: standalone)',
    '(display-mode: window-controls-overlay)',
    '(display-mode: minimal-ui)',
  ]
    .map((q) => win.matchMedia?.(q))
    .filter((m): m is MediaQueryList => !!m);
  const overlay = (win.navigator as Navigator & { windowControlsOverlay?: WindowControlsOverlayLike })
    .windowControlsOverlay;

  queries.forEach((m) => m.addEventListener?.('change', update));
  overlay?.addEventListener('geometrychange', update);
  update();
  return () => {
    queries.forEach((m) => m.removeEventListener?.('change', update));
    overlay?.removeEventListener('geometrychange', update);
  };
}
