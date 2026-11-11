import { Dialog, type DialogRef } from '@angular/cdk/dialog';
import { createFlexibleConnectedPositionStrategy, createGlobalPositionStrategy, type PositionStrategy } from '@angular/cdk/overlay';
import {
  afterRenderEffect,
  ChangeDetectionStrategy,
  Component,
  computed,
  DestroyRef,
  ElementRef,
  inject,
  Injector,
  input,
  model,
  type TemplateRef,
  viewChild,
} from '@angular/core';
import { injectSkin, skinFamily } from '@spartan-native/theme';

let nextId = 0;

/**
 * A modal form whose layout follows the OS:
 *  - macOS: a sheet that slides down from under the window's title bar, no title bar of its own,
 *    buttons bottom-right with the default button rightmost
 *  - Windows: a ContentDialog, centered over a smoke backdrop, title top-left, buttons in a footer
 *    band (primary first, buttons share the width)
 *  - GNOME: an AdwDialog, Cancel and the primary button in a header bar around a centered title, no footer
 *  - KDE: a window-modal QDialog with a frame and a title strip, buttons bottom-right (primary, then Cancel)
 *  - ChromeOS: a Material 3 dialog, large corners, headline, actions at the bottom end
 *
 * Mark the buttons with `snSheetCancel` and `snSheetPrimary` so they can be placed per OS.
 * Esc and the Cancel button close the sheet (`open` becomes false); the primary button is yours to handle.
 * On macOS the sheet hangs from the title bar of the nearest ancestor marked `snSheetHost`
 * (the window frame); without one it hangs from the top of the viewport.
 *
 * ```html
 * <div class="sn-window" snSheetHost>
 *   <sn-title-bar title="Harbor Backup" />
 *   <sn-modal-sheet [(open)]="adding" title="New destination">
 *     <label hlmLabel>Name <input hlmInput /></label>
 *     <button hlmBtn variant="outline" snSheetCancel>Cancel</button>
 *     <button hlmBtn snSheetPrimary (click)="create()">Create</button>
 *   </sn-modal-sheet>
 * </div>
 * ```
 */
@Component({
  selector: 'sn-modal-sheet',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    'data-slot': 'sn-modal-sheet',
    '[attr.data-family]': 'family()',
    '[attr.data-skin]': 'skin()',
  },
  // The panel renders in a CDK overlay, outside the host, so it carries data-family/data-skin itself.
  template: `
    <ng-template #panel>
      <div class="sheet" data-slot="sn-modal-sheet-panel" [attr.data-family]="family()" [attr.data-skin]="skin()">
        <h2 class="title" [id]="titleId">{{ title() }}</h2>
        <div class="body"><ng-content /></div>
        <div class="actions">
          <span class="cancel" (click)="open.set(false)"><ng-content select="[snSheetCancel]" /></span>
          <span class="primary"><ng-content select="[snSheetPrimary]" /></span>
        </div>
      </div>
    </ng-template>
  `,
  styleUrl: './modal-sheet.scss',
})
export class SnModalSheet {
  readonly open = model(false);
  readonly title = input.required<string>();
  /** Use `alertdialog` for confirmations (e.g. a destructive action). */
  readonly role = input<'dialog' | 'alertdialog'>('dialog');

  protected readonly skin = injectSkin();
  protected readonly family = computed(() => skinFamily(this.skin()));
  protected readonly titleId = `sn-modal-sheet-title-${nextId++}`;

  private readonly panel = viewChild.required<TemplateRef<unknown>>('panel');
  private readonly dialog = inject(Dialog);
  private readonly injector = inject(Injector);
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef).nativeElement;
  private ref?: DialogRef;

  constructor() {
    afterRenderEffect(() => {
      if (this.open() && !this.ref) this.show(this.family() === 'macos');
      else if (!this.open() && this.ref) this.ref.close();
    });
    inject(DestroyRef).onDestroy(() => {
      const ref = this.ref;
      this.ref = undefined; // don't write `open` after destroy
      ref?.close();
    });
  }

  private show(sheet: boolean): void {
    const ref = (this.ref = this.dialog.open(this.panel(), {
      role: this.role(),
      ariaModal: true,
      ariaLabelledBy: this.titleId,
      disableClose: true, // Esc is handled below; a click on the backdrop does nothing, like the native dialogs
      // A sheet doesn't dim the window, but the transparent backdrop still blocks it
      backdropClass: sheet ? 'cdk-overlay-transparent-backdrop' : 'cdk-overlay-dark-backdrop',
      panelClass: 'sn-modal-sheet-pane',
      positionStrategy: this.position(sheet),
    }));
    // A sheet starts below the window's title bar, not at the top of the screen: limit its height to
    // the space under that edge so it scrolls instead of running off the bottom (see .sheet in the SCSS).
    if (sheet) ref.overlayRef.overlayElement.style.setProperty('--sn-sheet-top', `${this.sheetTop()}px`);
    ref.keydownEvents.subscribe((e) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        this.open.set(false);
      }
    });
    ref.closed.subscribe(() => {
      if (this.ref !== ref) return;
      this.ref = undefined;
      this.open.set(false);
    });
  }

  /** The viewport y where a macOS sheet hangs from: the host window's title bar, else its top edge. */
  private sheetTop(): number {
    const window = this.host.closest<HTMLElement>('[snSheetHost]');
    if (!window) return 0;
    const titleBar = window.querySelector<HTMLElement>('[data-slot="sn-title-bar"]');
    return titleBar ? titleBar.getBoundingClientRect().bottom : window.getBoundingClientRect().top;
  }

  private position(sheet: boolean): PositionStrategy {
    const window = sheet ? this.host.closest<HTMLElement>('[snSheetHost]') : null;
    if (!window) {
      const global = createGlobalPositionStrategy(this.injector).centerHorizontally();
      return sheet ? global.top('0') : global.centerVertically();
    }
    const titleBar = window.querySelector<HTMLElement>('[data-slot="sn-title-bar"]');
    return createFlexibleConnectedPositionStrategy(this.injector, titleBar ?? window)
      .withFlexibleDimensions(false)
      .withPush(false)
      .withPositions([{ originX: 'center', originY: titleBar ? 'bottom' : 'top', overlayX: 'center', overlayY: 'top' }]);
  }
}
