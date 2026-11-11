import { ChangeDetectionStrategy, Component, computed, DestroyRef, inject, signal } from '@angular/core';
import { provideIcons } from '@ng-icons/core';
import { lucideHouse, lucideList, lucideSettings } from '@ng-icons/lucide';
import { SnSidebarNavImports, SnStatusPage, SnWindowImports } from '@spartan-native/desktop-ui';
import { watchDisplayMode, type DisplayMode } from '@spartan-native/host-web';
import { skinFamily, SpartanNativeTheme } from '@spartan-native/theme';
import { ListPage } from '../pages/list-page/list-page';
import { SettingsPage } from '../pages/settings-page/settings-page';

type Page = 'home' | 'items' | 'settings';

/**
 * The main window: title bar, sidebar navigation, the current page and a status bar.
 * Everything visual comes from the theme and desktop-ui; app-shell.css only lays out.
 *
 * Swap the @switch below for <router-outlet /> if the app uses the Router
 * (feed routerLinkActive into [active] on each snSidebarItem).
 */
@Component({
  selector: 'app-shell',
  // SnWindowImports = title bar, window controls and status bar
  imports: [SnWindowImports, SnSidebarNavImports, SnStatusPage, ListPage, SettingsPage],
  providers: [provideIcons({ lucideHouse, lucideList, lucideSettings })],
  templateUrl: './app-shell.html',
  styleUrl: './app-shell.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AppShell {
  private readonly theme = inject(SpartanNativeTheme);

  protected readonly title = 'My App';
  protected readonly page = signal<Page>('home');

  /** How the browser shows the app: a tab, an installed PWA, or a PWA with Window Controls Overlay. */
  private readonly displayMode = signal<DisplayMode>('browser');

  /**
   * Who draws the window buttons, or `null` for no title bar at all:
   *  - Wails on Windows / Linux: frameless window, the app draws them ('custom')
   *  - Wails on macOS: hidden-inset title bar, the OS draws the traffic lights ('native')
   *  - PWA with Window Controls Overlay: the OS draws them ('native')
   *  - a browser tab or a standalone PWA: the browser / OS owns the title bar (null)
   */
  protected readonly windowControls = computed<'custom' | 'native' | null>(() => {
    if (this.theme.runtime === 'wails') {
      return skinFamily(this.theme.skin()) === 'macos' ? 'native' : 'custom';
    }
    return this.displayMode() === 'overlay' ? 'native' : null;
  });

  constructor() {
    const stop = watchDisplayMode((mode) => this.displayMode.set(mode));
    inject(DestroyRef).onDestroy(stop);
  }
}
