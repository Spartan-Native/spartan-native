import { CdkMenu, CdkMenuItem, CdkMenuItemCheckbox, CdkMenuItemRadio, CdkMenuTrigger } from '@angular/cdk/menu';
import type { ConnectedPosition } from '@angular/cdk/overlay';
import { ChangeDetectionStrategy, Component, input, TemplateRef, viewChild } from '@angular/core';
import type { PlatformFamily } from '@spartan-native/theme';
import { formatShortcut } from '../platform/shortcut';
import type { SnMenuItem } from './menu-model';

/**
 * @internal The in-page menu: one recursive template that draws a desktop-ui menu as a CDK menu
 * with the theme's dropdown-menu hooks, so each skin draws it as its own menu. Used by
 * `<sn-menubar>` and `[snContextMenu]` when the host has no native menus.
 */
@Component({
  selector: 'sn-menu-templates',
  imports: [CdkMenu, CdkMenuItem, CdkMenuItemCheckbox, CdkMenuItemRadio, CdkMenuTrigger],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { style: 'display: none' },
  template: `
    <ng-template #menu let-items>
      <div cdkMenu data-slot="dropdown-menu" class="sn-menu">
        @for (item of items; track $index) {
          @if (item.type === 'separator') {
            <div role="separator" data-slot="dropdown-menu-separator" class="sn-menu-separator"></div>
          } @else if (item.submenu) {
            <button
              type="button"
              cdkMenuItem
              data-slot="dropdown-menu-sub-trigger"
              class="sn-menu-item"
              [cdkMenuTriggerFor]="menu"
              [cdkMenuTriggerData]="{ $implicit: item.submenu }"
              [cdkMenuPosition]="submenuPosition"
              [cdkMenuItemDisabled]="item.enabled === false"
              [attr.data-disabled]="item.enabled === false ? '' : null"
            >
              <span class="sn-menu-check"></span>
              <span class="sn-menu-label">{{ item.label }}</span>
              <svg class="sn-menu-chevron" viewBox="0 0 16 16" aria-hidden="true"><path d="M6 4l4 4-4 4" /></svg>
            </button>
          } @else if (item.type === 'checkbox') {
            <button
              type="button"
              cdkMenuItemCheckbox
              data-slot="dropdown-menu-checkbox-item"
              class="sn-menu-item"
              [cdkMenuItemChecked]="!!item.checked"
              [attr.data-checked]="item.checked ? '' : null"
              [cdkMenuItemDisabled]="item.enabled === false"
              [attr.data-disabled]="item.enabled === false ? '' : null"
              (cdkMenuItemTriggered)="run(item)"
            >
              <span class="sn-menu-check">
                @if (item.checked) {
                  <svg viewBox="0 0 16 16" aria-hidden="true"><path d="M3.5 8.5l3 3 6-7" /></svg>
                }
              </span>
              <span class="sn-menu-label">{{ item.label }}</span>
              @if (item.accelerator) {
                <kbd data-slot="dropdown-menu-shortcut" class="sn-menu-shortcut">{{ shortcut(item.accelerator) }}</kbd>
              }
            </button>
          } @else if (item.type === 'radio') {
            <button
              type="button"
              cdkMenuItemRadio
              data-slot="dropdown-menu-radio-item"
              class="sn-menu-item"
              [cdkMenuItemChecked]="!!item.checked"
              [attr.data-checked]="item.checked ? '' : null"
              [cdkMenuItemDisabled]="item.enabled === false"
              [attr.data-disabled]="item.enabled === false ? '' : null"
              (cdkMenuItemTriggered)="run(item)"
            >
              <span class="sn-menu-check">
                @if (item.checked) {
                  <svg viewBox="0 0 16 16" aria-hidden="true"><circle class="dot" cx="8" cy="8" r="3" /></svg>
                }
              </span>
              <span class="sn-menu-label">{{ item.label }}</span>
              @if (item.accelerator) {
                <kbd data-slot="dropdown-menu-shortcut" class="sn-menu-shortcut">{{ shortcut(item.accelerator) }}</kbd>
              }
            </button>
          } @else {
            <button
              type="button"
              cdkMenuItem
              data-slot="dropdown-menu-item"
              class="sn-menu-item"
              [cdkMenuItemDisabled]="item.enabled === false"
              [attr.data-disabled]="item.enabled === false ? '' : null"
              (cdkMenuItemTriggered)="run(item)"
            >
              <span class="sn-menu-check"></span>
              <span class="sn-menu-label">{{ item.label }}</span>
              @if (item.accelerator) {
                <kbd data-slot="dropdown-menu-shortcut" class="sn-menu-shortcut">{{ shortcut(item.accelerator) }}</kbd>
              }
            </button>
          }
        }
      </div>
    </ng-template>
  `,
  styleUrl: './menu.scss',
})
export class SnMenuTemplates {
  /** How shortcuts are written (⌘ symbols on macOS, Ctrl+ words elsewhere). */
  readonly family = input<PlatformFamily>('windows');
  /** Called before an item's action runs (e.g. to give the focus back to the field an Edit command acts on). */
  readonly beforeRun = input<(() => void) | null>(null);

  /** The menu template; its context's `$implicit` is the items. */
  readonly menu = viewChild.required<TemplateRef<{ $implicit: readonly SnMenuItem[] }>>('menu');

  protected readonly submenuPosition: ConnectedPosition[] = [
    { originX: 'end', originY: 'top', overlayX: 'start', overlayY: 'top', offsetY: -4 },
    { originX: 'start', originY: 'top', overlayX: 'end', overlayY: 'top', offsetY: -4 },
  ];

  protected shortcut(accelerator: string): string {
    return formatShortcut(accelerator, this.family());
  }

  protected run(item: SnMenuItem): void {
    if (item.enabled === false) return;
    this.beforeRun()?.();
    item.action?.();
  }
}
