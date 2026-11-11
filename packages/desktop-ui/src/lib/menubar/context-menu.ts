import { CdkContextMenuTrigger } from '@angular/cdk/menu';
import {
  ApplicationRef,
  booleanAttribute,
  computed,
  createComponent,
  DestroyRef,
  Directive,
  effect,
  ElementRef,
  EnvironmentInjector,
  inject,
  Injector,
  input,
} from '@angular/core';
import { injectSkin, skinFamily, SpartanNativeTheme } from '@spartan-native/theme';
import { inPageMenu, type SnMenuItem } from './menu-model';
import { SnMenuTemplates } from './menu-templates';
import { SnNativeMenus } from './native-menus';

/**
 * A context menu on an element, from the same menu data as `<sn-menubar>`:
 *  - with a host that has native menus (Wails): the OS's own context menu
 *  - otherwise: an in-page menu at the pointer, drawn by the skin's menu styles
 *
 * Right-click, the Menu key and Shift+F10 open it. Roles such as `cut`, `copy`, `paste` and
 * `selectAll` are the OS's items natively, and act on the focused field in the page.
 *
 * ```html
 * <li [snContextMenu]="fileMenu(file)">{{ file.name }}</li>
 * ```
 * ```ts
 * fileMenu(file: File): SnMenuItem[] {
 *   return [
 *     { label: 'Restore', action: () => this.restore(file) },
 *     { label: 'Rename', accelerator: 'f2', action: () => this.rename(file) },
 *     { type: 'separator' },
 *     { label: 'Delete', accelerator: 'delete', action: () => this.remove(file) },
 *   ];
 * }
 * ```
 *
 * The accelerators are shown, not bound: bind them where the selection lives.
 */
@Directive({
  selector: '[snContextMenu]',
  hostDirectives: [CdkContextMenuTrigger],
  host: {
    'data-slot': 'sn-context-menu-trigger',
    '(contextmenu)': 'onContextMenu($event)',
  },
})
export class SnContextMenu {
  /** The menu. */
  readonly items = input.required<readonly SnMenuItem[]>({ alias: 'snContextMenu' });
  /** `never` keeps the in-page menu even when the host has native menus. */
  readonly native = input<'auto' | 'never'>('auto', { alias: 'snContextMenuNative' });
  readonly disabled = input(false, { alias: 'snContextMenuDisabled', transform: booleanAttribute });

  private readonly trigger = inject(CdkContextMenuTrigger);
  private readonly menus = inject(SnNativeMenus);
  private readonly hostWindow = inject(SpartanNativeTheme, { optional: true })?.window;
  private readonly element = inject<ElementRef<HTMLElement>>(ElementRef).nativeElement;
  private readonly skin = injectSkin();
  private readonly family = computed(() => skinFamily(this.skin()));

  /** The OS shows the menu. */
  private readonly useNative = computed(() => this.native() !== 'never' && this.menus.canShowContextMenu);

  constructor() {
    // The in-page menu's template lives in a small component of its own (a directive has no template)
    const templates = createComponent(SnMenuTemplates, {
      environmentInjector: inject(EnvironmentInjector),
      elementInjector: inject(Injector),
    });
    const appRef = inject(ApplicationRef);
    appRef.attachView(templates.hostView);
    templates.changeDetectorRef.detectChanges();
    this.trigger.menuTemplateRef = templates.instance.menu();
    inject(DestroyRef).onDestroy(() => {
      appRef.detachView(templates.hostView);
      templates.destroy();
    });

    effect(() => {
      templates.setInput('family', this.family());
      this.trigger.disabled = this.disabled() || this.useNative();
      this.trigger.menuData = {
        $implicit: inPageMenu(this.items(), this.family(), {
          minimize: this.hostWindow?.minimize && (() => void this.hostWindow!.minimize!()),
          toggleMaximize: this.hostWindow?.toggleMaximize && (() => void this.hostWindow!.toggleMaximize!()),
          close: this.hostWindow?.close && (() => void this.hostWindow!.close!()),
        }),
      };
    });
  }

  protected onContextMenu(event: MouseEvent): void {
    // the in-page menu is opened by the CDK trigger (it runs first, and is disabled in native mode)
    if (this.disabled() || !this.useNative()) return;
    event.preventDefault();
    event.stopPropagation();
    let { clientX: x, clientY: y } = event;
    // From the keyboard (Menu key, Shift+F10) there's no pointer: open at the element's corner
    if (event.button !== 2 && x === 0 && y === 0) {
      const rect = this.element.getBoundingClientRect();
      x = rect.left;
      y = rect.bottom;
    }
    void this.menus.showContextMenu(this.items(), { x, y });
  }
}
