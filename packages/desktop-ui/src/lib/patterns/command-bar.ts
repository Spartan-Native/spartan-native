import { FocusKeyManager, type FocusableOption } from '@angular/cdk/a11y';
import { Directionality } from '@angular/cdk/bidi';
import { CdkMenuTrigger } from '@angular/cdk/menu';
import type { ConnectedPosition } from '@angular/cdk/overlay';
import {
  booleanAttribute,
  ChangeDetectionStrategy,
  Component,
  computed,
  contentChild,
  contentChildren,
  Directive,
  effect,
  ElementRef,
  inject,
  Injector,
  input,
  signal,
  TemplateRef,
  viewChild,
} from '@angular/core';
import { NgIcon } from '@ng-icons/core';
import { injectSkin, skinFamily, type Skin } from '@spartan-native/theme';

/** Skins whose command surface shows the label next to (or under) the icon. */
const LABELLED: readonly Skin[] = ['win', 'w10', 'qt'];

/**
 * The secondary commands, shown in the bar's overflow menu (Windows `…`, macOS `…`,
 * GNOME/KDE menu button, ChromeOS `⋮`). Put a stock menu inside, e.g. hlmDropdownMenu:
 *
 * ```html
 * <ng-template snCommandOverflow>
 *   <div hlmDropdownMenu>
 *     <button hlmDropdownMenuItem>Rename</button>
 *   </div>
 * </ng-template>
 * ```
 */
@Directive({ selector: 'ng-template[snCommandOverflow]' })
export class SnCommandOverflow {
  readonly template = inject(TemplateRef);
}

/**
 * One command in an `<sn-command-bar>`: an icon and a label.
 * The label is visible on Windows and KDE; on macOS, GNOME and ChromeOS the command is
 * icon-only, the label stays as its accessible name and becomes the tooltip.
 * Without `icon`, project your own `<svg>`/`<ng-icon>`, or none (then the label always shows).
 */
@Component({
  selector: 'button[snCommand]',
  imports: [NgIcon],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    'data-slot': 'sn-command',
    type: 'button',
    '[attr.tabindex]': 'tabbable() ? 0 : -1',
    '[disabled]': 'isDisabled()',
    '[attr.title]': 'iconOnly() ? label() : null',
    '[attr.data-icon-only]': 'iconOnly() ? "" : null',
  },
  template: `
    @if (icon()) {
      <ng-icon [name]="icon()" aria-hidden="true" />
    }
    <ng-content />
    <span class="label">{{ label() }}</span>
  `,
})
export class SnCommand implements FocusableOption {
  readonly icon = input('');
  readonly label = input.required<string>();
  readonly isDisabled = input(false, { alias: 'disabled', transform: booleanAttribute });
  /** Show only the icon on every OS (the label stays as accessible name and tooltip). */
  readonly hideLabel = input(false, { transform: booleanAttribute });

  /** Set by the bar: the one command in the tab order (roving tabindex). */
  readonly tabbable = signal(true);

  readonly element = inject<ElementRef<HTMLButtonElement>>(ElementRef).nativeElement;
  private readonly bar = inject(SnCommandBar, { optional: true });
  protected readonly iconOnly = computed(() => this.hideLabel() || !!this.bar?.iconOnly());

  get disabled(): boolean {
    return this.isDisabled();
  }

  focus(): void {
    this.element.focus();
  }
}

/**
 * The window's command surface, with the same markup on every OS:
 *  - Windows 11: a CommandBar, title left, commands right with the label beside the icon, `…` overflow
 *  - Windows 10: the same, labels under the icons, square
 *  - macOS 26: a unified toolbar, title left, icon-only commands in a Liquid Glass capsule (macOS 13–15: plain bezels)
 *  - GNOME: an AdwHeaderBar, commands at the start, title centered, menu button at the end
 *  - KDE: a KToolBar, title then commands with text beside the icon, menu button at the end
 *  - ChromeOS: an M3 top app bar, title left, round icon actions right, `⋮` overflow
 *
 * The commands form one `role="toolbar"`: Tab enters it once, ← → Home End move between
 * commands (disabled ones are skipped), ↓ or Enter opens the overflow menu.
 *
 * ```html
 * <sn-command-bar title="Documents">
 *   <button snCommand icon="lucidePlus" label="New" (click)="create()"></button>
 *   <button snCommand icon="lucideShare2" label="Share"></button>
 *   <button snCommand icon="lucideTrash2" label="Delete" [disabled]="!selection()"></button>
 *   <ng-template snCommandOverflow>
 *     <div hlmDropdownMenu><button hlmDropdownMenuItem>Rename</button></div>
 *   </ng-template>
 * </sn-command-bar>
 * ```
 *
 * Extra content: `[snCommandBarStart]` (e.g. a back button, or the window controls when the
 * bar is the title bar) and `[snCommandBarEnd]` (e.g. a search field). It carries `sn-chrome`,
 * so the theme dims it when the window is inactive.
 */
@Component({
  selector: 'sn-command-bar',
  imports: [CdkMenuTrigger, SnCommand],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    'data-slot': 'sn-command-bar',
    class: 'sn-chrome',
    // `title` is an input here, not a tooltip for the whole bar
    '[attr.title]': 'null',
    '[attr.data-family]': 'family()',
    '[attr.data-skin]': 'skin()',
  },
  template: `
    <ng-content select="[snCommandBarStart]" />
    @if (title()) {
      <span class="title">{{ title() }}</span>
    }
    <div class="commands" role="toolbar" [attr.aria-label]="ariaLabel() || title() || null" (keydown)="onKeydown($event)" (focusin)="onFocusin($event)">
      <ng-content />
      @if (overflow(); as menu) {
        <button snCommand hideLabel class="more" [label]="overflowLabel()" [cdkMenuTriggerFor]="menu.template" [cdkMenuPosition]="menuPosition">
          @switch (moreGlyph()) {
            @case ('menu') {
              <svg viewBox="0 0 16 16" aria-hidden="true"><path d="M2.5 4h11M2.5 8h11M2.5 12h11" /></svg>
            }
            @case ('vertical') {
              <svg viewBox="0 0 16 16" aria-hidden="true"><circle cx="8" cy="3" r="1.4" /><circle cx="8" cy="8" r="1.4" /><circle cx="8" cy="13" r="1.4" /></svg>
            }
            @default {
              <svg viewBox="0 0 16 16" aria-hidden="true"><circle cx="3" cy="8" r="1.3" /><circle cx="8" cy="8" r="1.3" /><circle cx="13" cy="8" r="1.3" /></svg>
            }
          }
        </button>
      }
    </div>
    <ng-content select="[snCommandBarEnd]" />
  `,
  styleUrl: './command-bar.scss',
})
export class SnCommandBar {
  readonly title = input('');
  /** Accessible name of the toolbar; defaults to `title`. */
  readonly ariaLabel = input('');
  /** Accessible name and tooltip of the overflow button. */
  readonly overflowLabel = input('More options');

  protected readonly skin = injectSkin();
  protected readonly family = computed(() => skinFamily(this.skin()));
  /** macOS, GNOME, ChromeOS: commands show only their icon. */
  readonly iconOnly = computed(() => !LABELLED.includes(this.skin()));
  protected readonly moreGlyph = computed(() => {
    const skin = this.skin();
    return skin === 'cros' ? 'vertical' : skin === 'gtk' || skin === 'qt' || this.family() === 'web' ? 'menu' : 'dots';
  });

  protected readonly overflow = contentChild(SnCommandOverflow);
  protected readonly menuPosition: ConnectedPosition[] = [
    { originX: 'end', originY: 'bottom', overlayX: 'end', overlayY: 'top', offsetY: 4 },
    { originX: 'end', originY: 'top', overlayX: 'end', overlayY: 'bottom', offsetY: -4 },
  ];

  private readonly commands = contentChildren(SnCommand, { descendants: true });
  private readonly more = viewChild(SnCommand);
  private readonly items = computed(() => {
    const more = this.more();
    return more ? [...this.commands(), more] : [...this.commands()];
  });
  private readonly active = signal<SnCommand | null>(null);
  private readonly keys = new FocusKeyManager(this.items, inject(Injector))
    .withHorizontalOrientation(inject(Directionality, { optional: true })?.value ?? 'ltr')
    .withVerticalOrientation(false)
    .withHomeAndEnd()
    .withWrap();

  constructor() {
    this.keys.change.subscribe(() => this.active.set(this.keys.activeItem));
    // roving tabindex: the last focused command, or the first enabled one, is the tab stop
    effect(() => {
      const items = this.items();
      const active = this.active();
      const stop = active && items.includes(active) && !active.disabled ? active : items.find((i) => !i.disabled);
      for (const item of items) item.tabbable.set(item === stop);
    });
  }

  protected onKeydown(event: KeyboardEvent): void {
    this.keys.onKeydown(event);
  }

  protected onFocusin(event: FocusEvent): void {
    const item = this.items().find((i) => i.element === event.target);
    if (item) {
      this.keys.updateActiveItem(item);
      this.active.set(item);
    }
  }
}

export const SnCommandBarImports = [SnCommandBar, SnCommand, SnCommandOverflow] as const;
