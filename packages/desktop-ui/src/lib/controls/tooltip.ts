import { InputModality, InputModalityDetector } from '@angular/cdk/a11y';
import {
  createFlexibleConnectedPositionStrategy,
  createOverlayRef,
  createRepositionScrollStrategy,
  type OverlayRef,
} from '@angular/cdk/overlay';
import { ComponentPortal } from '@angular/cdk/portal';
import {
  booleanAttribute,
  ChangeDetectionStrategy,
  Component,
  computed,
  DestroyRef,
  Directive,
  effect,
  ElementRef,
  inject,
  Injector,
  input,
  signal,
} from '@angular/core';
import { injectSkin, skinFamily } from '@spartan-native/theme';

/** How long the pointer rests on an element before its tooltip shows (the OS defaults are 0.5–1 s). */
const SHOW_DELAY = 600;

/** @internal The bubble. Styled by the theme, per skin, like hlmTooltip (data-slot="sn-tooltip"). */
@Component({
  selector: 'sn-tooltip-panel',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    'data-slot': 'sn-tooltip',
    'aria-hidden': 'true',
    '[attr.data-family]': 'family()',
    '[attr.data-skin]': 'skin()',
    '[textContent]': 'text()',
  },
  template: '',
})
export class SnTooltipPanel {
  readonly text = signal('');
  protected readonly skin = injectSkin();
  protected readonly family = computed(() => skinFamily(this.skin()));
}

/**
 * A short label that shows when the pointer rests on an element, or when it gets the keyboard
 * focus, drawn the way the active skin draws tooltips (a light card on Windows 11 and macOS, an
 * inverse bubble on GNOME, a framed surface on KDE, an M3 plain tooltip on ChromeOS).
 *
 * The text is a visual hint only (the bubble is `aria-hidden`): give the element its own
 * accessible name. Esc and a click hide it. An empty text shows nothing.
 *
 * ```html
 * <button hlmBtn size="icon" aria-label="Refresh" snTooltip="Refresh">…</button>
 * ```
 */
@Directive({
  selector: '[snTooltip]',
  host: {
    '(pointerenter)': 'onPointerEnter($event)',
    '(pointerleave)': 'hide()',
    '(pointerdown)': 'hide()',
    '(focusin)': 'onFocus()',
    '(focusout)': 'hide()',
    '(keydown.escape)': 'hide()',
  },
})
export class SnTooltip {
  /** The text. Empty: no tooltip. */
  readonly snTooltip = input('');
  readonly snTooltipDisabled = input(false, { transform: booleanAttribute });
  /** Set by components that own the tooltip (e.g. snCommand); wins over the input. */
  readonly text = signal<string | null>(null);

  private readonly shown = computed(() => (this.snTooltipDisabled() ? '' : (this.text() ?? this.snTooltip())));
  private readonly element = inject<ElementRef<HTMLElement>>(ElementRef).nativeElement;
  private readonly injector = inject(Injector);
  private readonly modality = inject(InputModalityDetector);
  private overlay: OverlayRef | null = null;
  private panel: SnTooltipPanel | null = null;
  private timer: ReturnType<typeof setTimeout> | null = null;

  constructor() {
    effect(() => {
      const text = this.shown();
      if (this.panel) this.panel.text.set(text);
      if (!text) this.hide();
    });
    inject(DestroyRef).onDestroy(() => {
      this.hide();
      this.overlay?.dispose();
    });
  }

  protected onPointerEnter(event: PointerEvent): void {
    if (event.pointerType === 'touch') return;
    this.schedule(SHOW_DELAY);
  }

  /** Keyboard focus shows it at once; a click's focus doesn't. */
  protected onFocus(): void {
    const modality: InputModality = this.modality.mostRecentModality;
    if (modality === 'keyboard') this.schedule(0);
  }

  private schedule(delay: number): void {
    this.clearTimer();
    this.timer = setTimeout(() => this.show(), delay);
  }

  /** Shows the tooltip now (no delay). */
  show(): void {
    this.clearTimer();
    const text = this.shown();
    if (!text || !this.element.isConnected) return;
    if (!this.overlay) {
      this.overlay = createOverlayRef(this.injector, {
        positionStrategy: createFlexibleConnectedPositionStrategy(this.injector, this.element)
          .withFlexibleDimensions(false)
          .withViewportMargin(8)
          .withPositions([
            { originX: 'center', originY: 'bottom', overlayX: 'center', overlayY: 'top', offsetY: 6 },
            { originX: 'center', originY: 'top', overlayX: 'center', overlayY: 'bottom', offsetY: -6 },
          ]),
        scrollStrategy: createRepositionScrollStrategy(this.injector),
        panelClass: 'sn-tooltip-pane',
      });
    }
    if (!this.overlay.hasAttached()) {
      this.panel = this.overlay.attach(new ComponentPortal(SnTooltipPanel, null, this.injector)).instance;
    }
    this.panel!.text.set(text);
    this.overlay.updatePosition();
  }

  /** Hides the tooltip and cancels a pending one. */
  hide(): void {
    this.clearTimer();
    if (this.overlay?.hasAttached()) this.overlay.detach();
    this.panel = null;
  }

  private clearTimer(): void {
    if (this.timer !== null) clearTimeout(this.timer);
    this.timer = null;
  }
}
