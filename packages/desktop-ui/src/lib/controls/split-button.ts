import { CdkMenuTrigger } from '@angular/cdk/menu';
import type { ConnectedPosition } from '@angular/cdk/overlay';
import {
  booleanAttribute,
  ChangeDetectionStrategy,
  Component,
  computed,
  contentChild,
  Directive,
  inject,
  input,
  output,
  TemplateRef,
  viewChild,
} from '@angular/core';
import { NgIcon } from '@ng-icons/core';
import { injectSkin, skinFamily } from '@spartan-native/theme';

/**
 * The menu of an `<sn-split-button>`: the other choices for the action. Put a stock menu
 * inside, e.g. hlmDropdownMenu:
 *
 * ```html
 * <ng-template snSplitButtonMenu>
 *   <div hlmDropdownMenu>
 *     <button hlmDropdownMenuItem>Back up Documents only</button>
 *   </div>
 * </ng-template>
 * ```
 */
@Directive({ selector: 'ng-template[snSplitButtonMenu]' })
export class SnSplitButtonMenu {
  readonly template = inject(TemplateRef);
}

/** standard: the platform's normal button · accent: the suggested / default action */
export type SnSplitButtonVariant = 'standard' | 'accent';

/** The theme's button hooks (see the theme's _hooks.scss): the class each variant is recognised by. */
const VARIANT_CLASS: Record<SnSplitButtonVariant, string> = {
  standard: 'border-border',
  accent: 'bg-primary',
};

/**
 * A button that runs its main action, joined to a second button that opens a menu of
 * alternatives. Each part is drawn as the skin's own button, so it matches the buttons next to it:
 *  - Windows 11 / 10: Fluent SplitButton, one control with a divider before the chevron
 *  - macOS 26 / 13–15: NSComboButton (split style), a capsule (26) or bezel (13–15) with a divider
 *  - GNOME: AdwSplitButton, two linked buttons
 *  - KDE: a QToolButton with a MenuButtonPopup arrow
 *  - ChromeOS: the Material 3 split button, two segments with a 2px gap and tight inner corners
 *
 * Two Tab stops: the action, then the menu button. On the action, ↓ (Alt+↓ on Windows)
 * opens the menu too.
 *
 * ```html
 * <sn-split-button label="Back up now" icon="lucideCloudUpload" variant="accent" (triggered)="backUp()">
 *   <ng-template snSplitButtonMenu>
 *     <div hlmDropdownMenu>
 *       <button hlmDropdownMenuItem (triggered)="backUp('documents')">Documents only</button>
 *       <button hlmDropdownMenuItem (triggered)="verify()">Verify last backup</button>
 *     </div>
 *   </ng-template>
 * </sn-split-button>
 * ```
 */
@Component({
  selector: 'sn-split-button',
  imports: [CdkMenuTrigger, NgIcon],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    'data-slot': 'sn-split-button',
    role: 'group',
    '[attr.aria-label]': 'label()',
    '[attr.data-family]': 'family()',
    '[attr.data-skin]': 'skin()',
    '[attr.data-variant]': 'variant()',
    '[attr.data-disabled]': "disabled() ? '' : null",
  },
  template: `
    <button
      type="button"
      data-slot="button"
      class="action"
      [class]="partClass()"
      [disabled]="disabled()"
      (click)="triggered.emit()"
      (keydown)="onActionKeydown($event)"
    >
      @if (icon()) {
        <ng-icon [name]="icon()" aria-hidden="true" />
      }
      <span class="label">{{ label() }}</span>
    </button>
    <button
      type="button"
      data-slot="button"
      class="arrow"
      [class]="partClass()"
      [disabled]="disabled() || !menu()"
      [attr.aria-label]="menuLabel()"
      [attr.title]="menuLabel()"
      [cdkMenuTriggerFor]="menu()?.template ?? null"
      [cdkMenuPosition]="menuPosition"
    >
      <svg viewBox="0 0 16 16" aria-hidden="true"><path d="M4 6l4 4 4-4" /></svg>
    </button>
  `,
  styleUrl: './split-button.scss',
})
export class SnSplitButton {
  /** The main action's text (also the group's accessible name). */
  readonly label = input.required<string>();
  /** An @ng-icons name registered with provideIcons(), shown before the label. */
  readonly icon = input('');
  readonly variant = input<SnSplitButtonVariant>('standard');
  /** The compact size (the theme's small button height). */
  readonly small = input(false, { transform: booleanAttribute });
  readonly disabled = input(false, { transform: booleanAttribute });
  /** Accessible name and tooltip of the menu button. */
  readonly menuLabel = input('More options');

  /** The main action was clicked (or Enter / Space). */
  readonly triggered = output<void>();

  protected readonly skin = injectSkin();
  protected readonly family = computed(() => skinFamily(this.skin()));
  protected readonly menu = contentChild(SnSplitButtonMenu);
  private readonly trigger = viewChild.required(CdkMenuTrigger);

  protected readonly partClass = computed(() => [VARIANT_CLASS[this.variant()], this.small() ? 'h-8' : ''].join(' ').trim());
  protected readonly menuPosition: ConnectedPosition[] = [
    { originX: 'end', originY: 'bottom', overlayX: 'end', overlayY: 'top', offsetY: 4 },
    { originX: 'end', originY: 'top', overlayX: 'end', overlayY: 'bottom', offsetY: -4 },
    { originX: 'start', originY: 'bottom', overlayX: 'start', overlayY: 'top', offsetY: 4 },
  ];

  /** Opens the menu, e.g. from a keyboard shortcut. */
  open(): void {
    if (!this.menu() || this.disabled()) return;
    const trigger = this.trigger();
    trigger.open();
    trigger.getMenu()?.focusFirstItem('keyboard');
  }

  protected onActionKeydown(event: KeyboardEvent): void {
    if (event.key !== 'ArrowDown' || event.ctrlKey || event.metaKey || event.shiftKey) return;
    // Fluent opens it with Alt+↓; the others with ↓
    if (this.family() === 'windows' && !event.altKey) return;
    event.preventDefault();
    this.open();
  }
}

export const SnSplitButtonImports = [SnSplitButton, SnSplitButtonMenu] as const;
