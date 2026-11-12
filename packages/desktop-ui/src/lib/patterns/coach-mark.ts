import {
  createFlexibleConnectedPositionStrategy,
  createOverlayRef,
  createRepositionScrollStrategy,
  type ConnectedPosition,
  type FlexibleConnectedPositionStrategy,
  type OverlayRef,
} from '@angular/cdk/overlay';
import { DomPortal } from '@angular/cdk/portal';
import { DOCUMENT } from '@angular/common';
import {
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
  model,
  signal,
  untracked,
} from '@angular/core';
import { NgIcon } from '@ng-icons/core';
import { injectSkin, skinFamily } from '@spartan-native/theme';

/** The side of the anchor the coach mark prefers. It flips to the opposite side when there is no room. */
export type CoachMarkPlacement = 'top' | 'bottom' | 'start' | 'end';

/** The physical side of the anchor the coach mark ended up on (the beak points back at the anchor). */
export type CoachMarkSide = 'top' | 'bottom' | 'left' | 'right';

/**
 * Overlay positions for a placement: centered on the anchor first, then aligned to its start and end
 * edges, then the same three on the opposite side.
 */
export function coachMarkPositions(placement: CoachMarkPlacement): ConnectedPosition[] {
  if (placement === 'top' || placement === 'bottom') {
    const sides = placement === 'bottom' ? (['bottom', 'top'] as const) : (['top', 'bottom'] as const);
    return sides.flatMap((side) =>
      (['center', 'start', 'end'] as const).map((align) => ({
        originX: align,
        overlayX: align,
        originY: side,
        overlayY: side === 'bottom' ? ('top' as const) : ('bottom' as const),
      })),
    );
  }
  const sides = placement === 'end' ? (['end', 'start'] as const) : (['start', 'end'] as const);
  return sides.flatMap((side) =>
    (['center', 'top', 'bottom'] as const).map((align) => ({
      originY: align,
      overlayY: align,
      originX: side,
      overlayX: side === 'end' ? ('start' as const) : ('end' as const),
    })),
  );
}

type Box = Pick<DOMRect, 'top' | 'bottom' | 'left' | 'right'>;

/** Which side of the anchor the coach mark sits on, from the two rectangles. */
export function coachMarkSide(tip: Box, anchor: Box): CoachMarkSide {
  if (tip.top >= anchor.bottom - 1) return 'bottom';
  if (tip.bottom <= anchor.top + 1) return 'top';
  return tip.left >= anchor.right - 1 ? 'right' : 'left';
}

let nextId = 0;

/**
 * An anchored, non-modal teaching popup: title, body, an optional icon or hero image,
 * a close button and action buttons.
 *  - Windows 11 / 10: TeachingTip (native): acrylic card with a tail, stretched buttons, primary first
 *  - macOS 26 / 13–15: NSPopover: glass popover with an arrow, buttons right-aligned, primary last
 *  - GNOME: GtkPopover: opaque rounded popover with an arrow, buttons at the end
 *  - KDE Plasma: Kirigami popup: Breeze frame, no arrow, primary first
 *  - ChromeOS: Material 3 rich tooltip: tonal container, no arrow, text buttons at the start
 *
 * Anchor it with `[snCoachMarkFor]`. Write the actions secondary first, primary last
 * (the order macOS, GNOME and ChromeOS use); Windows and KDE show them reversed. It doesn't take focus when it opens,
 * but it is placed right after the anchor in the tab order; Esc closes it and returns focus to the anchor.
 *
 * ```html
 * <button hlmBtn [snCoachMarkFor]="tip" (click)="tip.toggle()">Sync</button>
 * <sn-coach-mark #tip title="Sync across devices" [(open)]="showTip">
 *   Turn on sync to keep your backups available on every device you sign in to.
 *   <button snCoachMarkAction hlmBtn variant="secondary" (click)="tip.hide()">Not now</button>
 *   <button snCoachMarkAction hlmBtn (click)="turnOnSync()">Turn on</button>
 * </sn-coach-mark>
 * ```
 *
 * The host gets `data-placed` once the overlay has positioned it, and `data-side` with the side it landed on.
 */
@Component({
  selector: 'sn-coach-mark',
  imports: [NgIcon],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    'data-slot': 'sn-coach-mark',
    role: 'dialog',
    '[attr.title]': 'null',
    '[attr.aria-labelledby]': 'titleId',
    '[attr.aria-describedby]': 'bodyId',
    '[attr.data-family]': 'family()',
    '[attr.data-skin]': 'skin()',
    '(keydown.escape)': 'onEscape($event)',
  },
  template: `
    <div class="card">
      <div class="hero"><ng-content select="[snCoachMarkHero]" /></div>
      <div class="content">
        <div class="header">
          @if (icon()) {
            <ng-icon class="icon" [name]="icon()" aria-hidden="true" />
          }
          <h2 class="title" [id]="titleId">{{ title() }}</h2>
          <button type="button" class="close" [attr.aria-label]="closeLabel()" (click)="hide()">
            <svg viewBox="0 0 16 16" aria-hidden="true"><path d="M4 4l8 8M12 4l-8 8" /></svg>
          </button>
        </div>
        <div class="body" [id]="bodyId"><ng-content /></div>
        <div class="actions"><ng-content select="[snCoachMarkAction]" /></div>
      </div>
    </div>
    <span class="beak" aria-hidden="true"></span>
  `,
  styleUrl: './coach-mark.scss',
})
export class SnCoachMark {
  readonly title = input.required<string>();
  /** An @ng-icons name the app has registered, shown before the title. */
  readonly icon = input('');
  readonly placement = input<CoachMarkPlacement>('bottom');
  readonly closeLabel = input('Close');
  readonly open = model(false);

  /** Set by `[snCoachMarkFor]`. */
  readonly anchor = signal<HTMLElement | null>(null);

  protected readonly skin = injectSkin();
  protected readonly family = computed(() => skinFamily(this.skin()));
  protected readonly titleId = `sn-coach-mark-title-${nextId}`;
  readonly bodyId = `sn-coach-mark-body-${nextId++}`;

  private readonly host: HTMLElement = inject(ElementRef).nativeElement;
  private readonly document = inject(DOCUMENT);
  private readonly injector = inject(Injector);
  private overlay?: OverlayRef;
  private strategy?: FlexibleConnectedPositionStrategy;
  private overlayAnchor?: HTMLElement;

  constructor() {
    effect(() => {
      const anchor = this.anchor();
      const positions = coachMarkPositions(this.placement());
      if (this.open() && anchor) untracked(() => this.attach(anchor, positions));
      else untracked(() => this.detach());
    });
    inject(DestroyRef).onDestroy(() => this.overlay?.dispose());
  }

  show(): void {
    this.open.set(true);
  }

  hide(): void {
    this.open.set(false);
  }

  toggle(): void {
    this.open.update((open) => !open);
  }

  protected onEscape(event: Event): void {
    event.preventDefault();
    this.hide(); // detach() moves focus back to the anchor
  }

  private attach(anchor: HTMLElement, positions: ConnectedPosition[]): void {
    if (this.overlayAnchor !== anchor) {
      this.overlay?.dispose();
      this.overlay = undefined;
    }
    if (!this.overlay) {
      this.overlayAnchor = anchor;
      this.strategy = createFlexibleConnectedPositionStrategy(this.injector, anchor)
        .withFlexibleDimensions(false)
        .withPush(false)
        .withViewportMargin(8)
        // Inline popover: rendered in the top layer but right after the anchor in the DOM, so Tab
        // reaches it from the anchor without a focus trap.
        .withPopoverLocation('inline');
      this.strategy.positionChanges.subscribe(() => this.placed(anchor));
      this.overlay = createOverlayRef(this.injector, {
        positionStrategy: this.strategy,
        scrollStrategy: createRepositionScrollStrategy(this.injector),
        usePopover: true,
        panelClass: 'sn-coach-mark-pane',
      });
    }
    this.strategy!.withPositions(positions);
    if (this.overlay.hasAttached()) {
      this.overlay.updatePosition();
      return;
    }
    // The margin toward the anchor depends on the axis; set it before the first measure.
    const first = positions[0];
    this.host.dataset['side'] =
      first.overlayY === 'top'
        ? 'bottom'
        : first.overlayY === 'bottom'
          ? 'top'
          : first.originX === 'end'
            ? 'right'
            : 'left';
    this.overlay.attach(new DomPortal(this.host));
  }

  private detach(): void {
    if (!this.overlay?.hasAttached()) return;
    const hadFocus = this.host.contains(this.document.activeElement);
    this.overlay.detach();
    delete this.host.dataset['placed'];
    delete this.host.dataset['side'];
    if (hadFocus) this.overlayAnchor?.focus();
  }

  /** After each positioning: which side it landed on and where the beak points. */
  private placed(anchor: HTMLElement): void {
    const tip = this.host.getBoundingClientRect();
    const a = anchor.getBoundingClientRect();
    const side = coachMarkSide(tip, a);
    this.host.dataset['side'] = side;
    const beak = side === 'top' || side === 'bottom' ? a.left + a.width / 2 - tip.left : a.top + a.height / 2 - tip.top;
    this.host.style.setProperty('--sn-coach-mark-beak-at', `${beak}px`);
    this.host.dataset['placed'] = '';
  }
}

/**
 * Anchors a `<sn-coach-mark>` to this element. Esc on the anchor closes the open coach mark,
 * and the anchor is described by the coach mark while it is open.
 */
@Directive({
  selector: '[snCoachMarkFor]',
  host: {
    '[attr.aria-describedby]': 'snCoachMarkFor().open() ? snCoachMarkFor().bodyId : null',
    '(keydown.escape)': 'snCoachMarkFor().hide()',
  },
})
export class SnCoachMarkFor {
  readonly snCoachMarkFor = input.required<SnCoachMark>();

  constructor() {
    const el: HTMLElement = inject(ElementRef).nativeElement;
    effect((onCleanup) => {
      const tip = this.snCoachMarkFor();
      tip.anchor.set(el);
      onCleanup(() => {
        if (tip.anchor() === el) tip.anchor.set(null);
      });
    });
  }
}

export const SnCoachMarkImports = [SnCoachMark, SnCoachMarkFor] as const;
