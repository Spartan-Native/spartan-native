import {
  afterNextRender,
  ApplicationRef,
  booleanAttribute,
  ChangeDetectionStrategy,
  Component,
  computed,
  createComponent,
  DestroyRef,
  Directive,
  effect,
  ElementRef,
  EnvironmentInjector,
  inject,
  input,
  numberAttribute,
  signal,
  untracked,
} from '@angular/core';
import { injectSkin, skinFamily } from '@spartan-native/theme';

/** Which edge of the panel the handle sits on. `auto`: the edge facing the middle of the parent. */
export type SnResizeEdge = 'auto' | 'start' | 'end';

/** @internal The drag handle: a thin separator on the panel's edge, drawn in the panel's parent. */
@Component({
  selector: 'sn-resize-handle',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    'data-slot': 'sn-resize-handle',
    role: 'separator',
    'aria-orientation': 'vertical',
    tabindex: '0',
    '[attr.data-family]': 'family()',
    '[attr.data-skin]': 'skin()',
  },
  template: '',
  styleUrl: './resizable.scss',
})
export class SnResizeHandle {
  protected readonly skin = injectSkin();
  protected readonly family = computed(() => skinFamily(this.skin()));
}

/**
 * Lets the user widen or narrow a side panel by dragging its inner edge, like the sidebars and
 * inspectors of Finder, Explorer, Files and Dolphin. Put it on `<sn-sidebar-nav>`,
 * `<sn-inspector>` or any panel that sits beside the content in a row:
 *
 * ```html
 * <sn-sidebar-nav snResizable="sidebar" aria-label="Sections">…</sn-sidebar-nav>
 * <sn-inspector snResizable="inspector" resizeLabel="Resize the details">…</sn-inspector>
 * ```
 *
 * The width is kept as a share of the parent's width, so the panel grows and shrinks with the
 * window instead of staying a fixed number of pixels. The value of `snResizable` is the key the
 * share is remembered under (`localStorage`, per window); leave it empty to not remember it.
 * A double-click on the edge goes back to the default. The edge is a focusable separator:
 * ← → resize it (Shift for bigger steps), Home and End jump to the limits.
 *
 * The handle lives in the panel's parent (which becomes `position: relative`), so it doesn't
 * scroll away with a long panel. While `resizeDisabled` is set (a collapsed sidebar), the panel
 * keeps its stylesheet width and the handle hides.
 */
@Directive({
  selector: '[snResizable]',
  exportAs: 'snResizable',
  host: { '[attr.data-resizing]': 'dragging() ? "" : null' },
})
export class SnResizable {
  /** The storage key the width is remembered under; empty: not remembered. */
  readonly snResizable = input('');
  /** The handle's edge. `auto` (default): the edge facing the middle of the parent. */
  readonly resizeEdge = input<SnResizeEdge>('auto');
  /** The share of the parent's width the panel takes until the user drags it. Default: 0.2. */
  readonly resizeRatio = input(0.2, { transform: numberAttribute });
  /** Never narrower than this, in pixels. Default: 192. */
  readonly resizeMin = input(192, { transform: numberAttribute });
  /** Never wider than this share of the parent. Default: 0.5. */
  readonly resizeMaxRatio = input(0.5, { transform: numberAttribute });
  /** Keep the stylesheet width and hide the handle (e.g. a collapsed sidebar). */
  readonly resizeDisabled = input(false, { transform: booleanAttribute });
  /** The handle's accessible name. Default: "Resize". */
  readonly resizeLabel = input('Resize');

  /** True while the user drags the edge (also `data-resizing` on the panel: turn transitions off). */
  readonly dragging = signal(false);
  /** The share of the parent the user chose; null: `resizeRatio`. */
  readonly share = signal<number | null>(null);

  private readonly el = inject<ElementRef<HTMLElement>>(ElementRef).nativeElement;
  private handle?: HTMLElement;
  private parent?: HTMLElement;

  constructor() {
    const destroyRef = inject(DestroyRef);
    const appRef = inject(ApplicationRef);
    const environmentInjector = inject(EnvironmentInjector);

    effect(() => {
      const key = this.snResizable();
      untracked(() => this.share.set(readShare(key)));
    });

    afterNextRender(() => {
      const parent = this.el.parentElement;
      if (!parent) return;
      this.parent = parent;
      if (getComputedStyle(parent).position === 'static') parent.style.position = 'relative';

      const ref = createComponent(SnResizeHandle, { environmentInjector });
      appRef.attachView(ref.hostView);
      const handle = ref.location.nativeElement as HTMLElement;
      parent.appendChild(handle);
      this.handle = handle;

      const listeners: [string, EventListener][] = [
        ['pointerdown', (e) => this.startDrag(e as PointerEvent)],
        ['dblclick', () => this.save(null)],
        ['keydown', (e) => this.onKey(e as KeyboardEvent)],
      ];
      for (const [type, fn] of listeners) handle.addEventListener(type, fn);
      const observer = typeof ResizeObserver === 'undefined' ? null : new ResizeObserver(() => this.layout());
      observer?.observe(parent);
      observer?.observe(this.el);

      destroyRef.onDestroy(() => {
        for (const [type, fn] of listeners) handle.removeEventListener(type, fn);
        observer?.disconnect();
        appRef.detachView(ref.hostView);
        ref.destroy();
        handle.remove();
      });
      this.layout();
    });

    effect(() => {
      this.resizeDisabled();
      this.resizeEdge();
      this.resizeRatio();
      this.resizeMin();
      this.resizeMaxRatio();
      this.resizeLabel();
      this.share();
      untracked(() => this.layout());
    });
  }

  /** The handle is on the panel's left side (a panel on the right of its parent, in LTR). */
  private onLeft(): boolean {
    const edge = this.resizeEdge();
    if (edge === 'auto') {
      const parent = this.parent!.getBoundingClientRect();
      const panel = this.el.getBoundingClientRect();
      return panel.left + panel.width / 2 > parent.left + parent.width / 2;
    }
    const rtl = getComputedStyle(this.el).direction === 'rtl';
    return (edge === 'start') !== rtl;
  }

  /** Sizes the panel from its share and puts the handle on its edge. */
  private layout(): void {
    const { parent, handle } = this;
    if (!parent || !handle) return;
    if (this.resizeDisabled()) {
      this.el.style.removeProperty('inline-size');
      handle.hidden = true;
      return;
    }
    const total = parent.clientWidth;
    const width = panelWidth(this.share() ?? this.resizeRatio(), total, this.resizeMin(), this.resizeMaxRatio());
    if (width > 0) this.el.style.inlineSize = `${width}px`;

    const shown = this.el.offsetWidth > 0 && !this.el.hidden;
    handle.hidden = !shown;
    if (!shown) return;
    const panel = this.el.getBoundingClientRect();
    const box = parent.getBoundingClientRect();
    const x = (this.onLeft() ? panel.left : panel.right) - box.left - parent.clientLeft + parent.scrollLeft;
    handle.style.left = `${x}px`;
    handle.style.top = `${panel.top - box.top - parent.clientTop + parent.scrollTop}px`;
    handle.style.height = `${panel.height}px`;
    handle.setAttribute('aria-label', this.resizeLabel());
    handle.setAttribute('aria-valuemin', String(Math.round(this.resizeMin())));
    handle.setAttribute('aria-valuemax', String(Math.round(Math.max(this.resizeMin(), total * this.resizeMaxRatio()))));
    handle.setAttribute('aria-valuenow', String(Math.round(this.el.offsetWidth)));
  }

  private startDrag(e: PointerEvent): void {
    const handle = this.handle;
    if (e.button !== 0 || !handle || !this.parent) return;
    e.preventDefault();
    const startX = e.clientX;
    const startWidth = this.el.offsetWidth;
    const sign = this.onLeft() ? -1 : 1;
    handle.setPointerCapture?.(e.pointerId);
    this.dragging.set(true);
    const root = this.el.ownerDocument.documentElement;
    const userSelect = root.style.userSelect;
    root.style.userSelect = 'none';

    const move = (ev: PointerEvent) => this.setWidth(startWidth + sign * (ev.clientX - startX), false);
    const end = (ev: PointerEvent) => {
      handle.releasePointerCapture?.(ev.pointerId);
      handle.removeEventListener('pointermove', move);
      handle.removeEventListener('pointerup', end);
      handle.removeEventListener('pointercancel', end);
      root.style.userSelect = userSelect;
      this.dragging.set(false);
      this.setWidth(this.el.offsetWidth, true);
    };
    handle.addEventListener('pointermove', move);
    handle.addEventListener('pointerup', end);
    handle.addEventListener('pointercancel', end);
  }

  private onKey(e: KeyboardEvent): void {
    const next = keyWidth(e.key, e.shiftKey, this.el.offsetWidth, this.onLeft());
    if (next === null) return;
    e.preventDefault();
    this.setWidth(next, true);
  }

  /** A width in pixels, turned into a share of the parent (clamped); `persist` remembers it. */
  private setWidth(px: number, persist: boolean): void {
    const total = this.parent?.clientWidth ?? 0;
    if (total <= 0) return;
    const share = panelWidth(px / total, total, this.resizeMin(), this.resizeMaxRatio()) / total;
    if (persist) this.save(share);
    else this.share.set(share);
  }

  private save(share: number | null): void {
    this.share.set(share);
    writeShare(this.snResizable(), share);
  }
}

/**
 * The panel's width in pixels: `ratio` of `total`, no narrower than `min` and no wider than
 * `maxRatio` of it (but never under `min`). 0 when there is no room to measure.
 *
 * @internal Not in the public API; exported for the unit tests.
 */
export function panelWidth(ratio: number, total: number, min: number, maxRatio: number): number {
  if (!(total > 0)) return 0;
  const max = Math.max(min, total * maxRatio);
  return Math.round(Math.min(max, Math.max(min, total * ratio)));
}

/**
 * The width a key asks for: the arrow pointing away from the panel grows it (16 px, 64 with
 * Shift), the other shrinks it; Home is the narrowest, End the widest (both clamped later).
 * Null for other keys. `onLeft`: the handle is on the panel's left side.
 *
 * @internal Not in the public API; exported for the unit tests.
 */
export function keyWidth(key: string, shift: boolean, width: number, onLeft: boolean): number | null {
  const step = shift ? 64 : 16;
  const grow = onLeft ? 'ArrowLeft' : 'ArrowRight';
  const shrink = onLeft ? 'ArrowRight' : 'ArrowLeft';
  switch (key) {
    case grow:
      return width + step;
    case shrink:
      return width - step;
    case 'Home':
      return 0;
    case 'End':
      return Number.MAX_SAFE_INTEGER;
    default:
      return null;
  }
}

const storageKey = (key: string) => `sn.panel.${key}`;

/** Storage may be missing or blocked (private windows, previews): never throws. */
function readShare(key: string): number | null {
  if (!key) return null;
  try {
    const value = Number(localStorage.getItem(storageKey(key)));
    return value > 0 && value < 1 ? value : null;
  } catch {
    return null;
  }
}

function writeShare(key: string, share: number | null): void {
  if (!key) return;
  try {
    if (share === null) localStorage.removeItem(storageKey(key));
    else localStorage.setItem(storageKey(key), String(share));
  } catch {
    // Not remembered; the panel still resizes.
  }
}
