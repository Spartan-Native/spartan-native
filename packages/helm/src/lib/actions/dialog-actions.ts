import { DestroyRef, Directive, ElementRef, afterNextRender, inject } from '@angular/core';

/** Where Enter / Esc are listened for: the closest dialog, form, or [snActionScope]. */
const SCOPE = '[snActionScope], [role="dialog"], [role="alertdialog"], form';

/** Elements that use Enter themselves, so it must not trigger the default button there. */
const OWNS_ENTER = 'textarea, button, a[href], select, [contenteditable=""], [contenteditable="true"], [role="listbox"], [role="grid"], [role="menu"], [role="tree"]';

/**
 * Marks a custom area for snDefaultAction / snCancelAction (dialogs and forms are scopes already).
 *
 * ```html
 * <section snActionScope>…</section>
 * ```
 */
@Directive({ selector: '[snActionScope]', host: { 'data-slot': 'sn-action-scope' } })
export class SnActionScope {}

function listenInScope(key: string, onKey: (event: KeyboardEvent) => void): void {
  const element = inject<ElementRef<HTMLElement>>(ElementRef).nativeElement;
  const destroyRef = inject(DestroyRef);
  afterNextRender(() => {
    const scope: HTMLElement | Document = element.closest<HTMLElement>(SCOPE) ?? element.ownerDocument;
    const listener = (event: Event) => {
      const e = event as KeyboardEvent;
      if (e.key !== key || e.defaultPrevented || e.isComposing) return;
      onKey(e);
    };
    scope.addEventListener('keydown', listener);
    destroyRef.onDestroy(() => scope.removeEventListener('keydown', listener));
  });
}

/**
 * The default button: Enter anywhere in its dialog or form presses it,
 * the way every desktop OS behaves. Fields that use Enter themselves
 * (multi-line text, other buttons, lists) keep it.
 *
 * ```html
 * <button hlmBtn snDefaultAction (click)="save()">Save</button>
 * ```
 */
@Directive({ selector: 'button[snDefaultAction]', host: { 'data-sn-default-action': '' } })
export class SnDefaultAction {
  private readonly button = inject<ElementRef<HTMLButtonElement>>(ElementRef).nativeElement;

  constructor() {
    listenInScope('Enter', (event) => {
      const target = event.target as HTMLElement | null;
      if (this.button.disabled || target?.closest(OWNS_ENTER)) return;
      event.preventDefault();
      this.button.click();
    });
  }
}

/**
 * The cancel button: Esc anywhere in its dialog or form presses it.
 *
 * ```html
 * <button hlmBtn variant="outline" snCancelAction (click)="close()">Cancel</button>
 * ```
 */
@Directive({ selector: 'button[snCancelAction]', host: { 'data-sn-cancel-action': '' } })
export class SnCancelAction {
  private readonly button = inject<ElementRef<HTMLButtonElement>>(ElementRef).nativeElement;

  constructor() {
    listenInScope('Escape', (event) => {
      if (this.button.disabled) return;
      event.preventDefault();
      this.button.click();
    });
  }
}

export const SnDialogActionsImports = [SnActionScope, SnDefaultAction, SnCancelAction] as const;
