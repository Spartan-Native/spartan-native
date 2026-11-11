import {
  booleanAttribute,
  ChangeDetectionStrategy,
  Component,
  computed,
  contentChildren,
  ElementRef,
  forwardRef,
  inject,
  input,
  signal,
} from '@angular/core';
import { NgIcon } from '@ng-icons/core';
import { injectSkin, skinFamily } from '@spartan-native/theme';

let nextId = 0;

/**
 * The app's sidebar navigation, with the platform's selection idiom on the current item:
 *  - Windows 11: NavigationView, hover fill plus the accent pill on the selected item
 *  - Windows 10: square items, `primary 30%` fill with a full-height accent bar
 *  - macOS: source list on the sidebar material, accent-tinted fill, grey while the window is inactive
 *  - GNOME: AdwNavigationSplitView sidebar, neutral rounded selection
 *  - KDE: Breeze places panel, accent outline on hover, accent-filled selection
 *  - ChromeOS: Material 3 navigation drawer, tonal pill
 *
 * The host carries the theme's `sn-sidebar` material. Items are plain links or buttons
 * (no Router needed); mark the current one with `[active]`. ↑ ↓ Home End move between items.
 *
 * ```html
 * <sn-sidebar-nav aria-label="Sections">
 *   <sn-sidebar-section title="Backups">
 *     <a snSidebarItem href="#" icon="lucideLayoutDashboard" [active]="page() === 'overview'">Overview</a>
 *     <button snSidebarItem icon="lucideHistory" badge="3" (click)="page.set('restore')">Restore files</button>
 *   </sn-sidebar-section>
 * </sn-sidebar-nav>
 * ```
 *
 * With the Router: `<a snSidebarItem routerLink="/x" routerLinkActive #rla="routerLinkActive" [active]="rla.isActive">`.
 */
@Component({
  selector: 'sn-sidebar-nav',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    'data-slot': 'sn-sidebar-nav',
    class: 'sn-sidebar',
    role: 'navigation',
    '[attr.data-family]': 'family()',
    '[attr.data-skin]': 'skin()',
    '(keydown)': 'onKeydown($event)',
  },
  template: `<ng-content />`,
  styleUrl: './sidebar-nav.scss',
})
export class SnSidebarNav {
  private readonly items = contentChildren(forwardRef(() => SnSidebarItem), { descendants: true });
  /** The item that keeps the single Tab stop: the last focused one, else the active one, else the first. */
  private readonly focused = signal<SnSidebarItem | null>(null);
  readonly tabStop = computed(() => {
    const items = this.items();
    const focused = this.focused();
    if (focused && items.includes(focused)) return focused;
    return items.find((i) => i.active()) ?? items[0] ?? null;
  });

  protected readonly skin = injectSkin();
  protected readonly family = computed(() => skinFamily(this.skin()));

  /** @internal */
  setFocused(item: SnSidebarItem): void {
    this.focused.set(item);
  }

  protected onKeydown(event: KeyboardEvent): void {
    const items = this.items();
    if (!items.length || event.altKey || event.ctrlKey || event.metaKey) return;
    const current = items.findIndex((i) => i.element.contains(event.target as Node));
    const index = nextIndex(event.key, current, items.length);
    if (index === null) return;
    event.preventDefault();
    items[index].element.focus();
  }
}

/** Where ↑ ↓ Home End move the focus from `current` (-1: nothing focused); null for other keys. Doesn't wrap, like the native lists. */
export function nextIndex(key: string, current: number, count: number): number | null {
  switch (key) {
    case 'ArrowDown':
      return current < 0 ? 0 : Math.min(current + 1, count - 1);
    case 'ArrowUp':
      return current < 0 ? count - 1 : Math.max(current - 1, 0);
    case 'Home':
      return 0;
    case 'End':
      return count - 1;
    default:
      return null;
  }
}

/**
 * A titled group of items: "Favorites", "Locations", … Leave `title` empty for an unlabeled group.
 */
@Component({
  selector: 'sn-sidebar-section',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    'data-slot': 'sn-sidebar-section',
    role: 'group',
    '[attr.aria-labelledby]': 'title() ? headingId : null',
    '[attr.data-family]': 'family()',
    '[attr.data-skin]': 'skin()',
  },
  template: `
    @if (title()) {
      <div class="heading" [id]="headingId">{{ title() }}</div>
    }
    <ng-content />
  `,
  styleUrl: './sidebar-nav.scss',
})
export class SnSidebarSection {
  readonly title = input('');
  protected readonly headingId = `sn-sidebar-section-${nextId++}`;
  protected readonly skin = injectSkin();
  protected readonly family = computed(() => skinFamily(this.skin()));
}

/**
 * One navigation item, on an `<a>` or a `<button>`. `icon` is an @ng-icons name the app
 * registered with provideIcons(); `badge` is a short count or label on the trailing side.
 */
@Component({
  selector: 'a[snSidebarItem], button[snSidebarItem]',
  imports: [NgIcon],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    'data-slot': 'sn-sidebar-item',
    class: 'sn-list-item',
    '[attr.aria-current]': "active() ? 'page' : null",
    '[attr.data-active]': "active() ? '' : null",
    '[attr.tabindex]': 'nav?.tabStop() === this ? 0 : nav ? -1 : null',
    '[attr.type]': "element.localName === 'button' ? 'button' : null",
    '[attr.data-family]': 'family()',
    '[attr.data-skin]': 'skin()',
    '(focus)': 'nav?.setFocused(this)',
  },
  template: `
    @if (icon()) {
      <ng-icon class="icon" [name]="icon()" aria-hidden="true" />
    }
    <span class="label"><ng-content /></span>
    @if (badge()) {
      <span class="badge">{{ badge() }}</span>
    }
  `,
  styleUrl: './sidebar-nav.scss',
})
export class SnSidebarItem {
  readonly active = input(false, { transform: booleanAttribute });
  readonly icon = input('');
  readonly badge = input<string | number>('');

  readonly element = inject<ElementRef<HTMLElement>>(ElementRef).nativeElement;
  protected readonly nav = inject(SnSidebarNav, { optional: true });
  protected readonly skin = injectSkin();
  protected readonly family = computed(() => skinFamily(this.skin()));
}

export const SnSidebarNavImports = [SnSidebarNav, SnSidebarSection, SnSidebarItem] as const;
