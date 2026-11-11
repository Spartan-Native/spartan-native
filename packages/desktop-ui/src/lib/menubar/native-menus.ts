import { DestroyRef, inject, Injectable } from '@angular/core';
import { SpartanNativeTheme, type Unsubscribe } from '@spartan-native/theme';
import { toHostMenu, type SnMenuItem } from './menu-model';

/**
 * The bridge to the host's native menus (`NativeHost.menus`). It converts desktop-ui menus to
 * the host's plain data and runs an item's `action` when the host reports it was chosen.
 * `<sn-menubar>` and `[snContextMenu]` use it; call it directly for menus built in code.
 */
@Injectable({ providedIn: 'root' })
export class SnNativeMenus {
  private readonly theme = inject(SpartanNativeTheme, { optional: true });
  private readonly host = this.theme?.menus;
  private readonly appActions = new Map<string, SnMenuItem>();
  private readonly contextActions = new Map<string, SnMenuItem>();
  private off: Unsubscribe | null = null;

  constructor() {
    inject(DestroyRef).onDestroy(() => this.off?.());
  }

  /** The host can set the application menu (the macOS global menu bar, a window menu). */
  get canSetApplicationMenu(): boolean {
    return !!this.host?.setApplicationMenu && this.theme?.capabilities.nativeMenus !== 'none';
  }

  /** The host can show OS context menus. */
  get canShowContextMenu(): boolean {
    return !!this.host?.showContextMenu && this.theme?.capabilities.nativeMenus !== 'none';
  }

  /** Sets (or, with `[]`, removes) the application menu. */
  async setApplicationMenu(items: readonly SnMenuItem[]): Promise<void> {
    if (!this.canSetApplicationMenu) return;
    this.listen();
    const { menu, actions } = toHostMenu(items);
    this.appActions.clear();
    actions.forEach((item, id) => this.appActions.set(id, item));
    await this.host!.setApplicationMenu!(menu);
  }

  /** Shows an OS context menu at `x`, `y` (CSS pixels from the window's content corner). */
  async showContextMenu(items: readonly SnMenuItem[], position: { x: number; y: number }): Promise<void> {
    if (!this.canShowContextMenu) return;
    this.listen();
    const { menu, actions } = toHostMenu(items);
    this.contextActions.clear();
    actions.forEach((item, id) => this.contextActions.set(id, item));
    await this.host!.showContextMenu!(menu, position);
  }

  private listen(): void {
    this.off ??= this.host!.onAction((id) => {
      const item = this.contextActions.get(id) ?? this.appActions.get(id);
      if (item && item.enabled !== false) item.action?.();
    });
  }
}
