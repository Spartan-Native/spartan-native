import { ChangeDetectionStrategy, Component, computed, inject, input, linkedSignal } from '@angular/core';
import { NgIcon, provideIcons } from '@ng-icons/core';
import {
  lucideClock,
  lucideHardDrive,
  lucideHistory,
  lucideHouse,
  lucideSearch,
  lucideSettings,
} from '@ng-icons/lucide';
import { SnWindowImports } from '@spartan-native/desktop-ui';
import type { Skin } from '@spartan-native/theme';
import { toast } from '@spartan-ng/brain/sonner';
import { HlmButtonImports } from '@spartan-ng/helm/button';
import { HlmInputImports } from '@spartan-ng/helm/input';
import { HlmToasterImports } from '@spartan-ng/helm/sonner';
import { HarborStore } from './data/harbor-store';
import { HarborDestinations } from './pages/destinations/destinations';
import { HarborOverview } from './pages/overview/overview';
import { HarborRestore } from './pages/restore/restore';
import { HarborSchedules } from './pages/schedules/schedules';
import { HarborSettings } from './pages/settings/settings';

/** Window chrome follows the skin family: w10 → win, macc → mac, everything else → gtk. */
type ChromeFamily = 'win' | 'mac' | 'gtk';

/**
 * Who draws the window frame:
 *  - mock: in a browser tab, the app draws a whole window (demo)
 *  - native: installed, the OS draws the title bar; the app fills the window
 *  - overlay: installed with Window Controls Overlay (or a macOS hidden-inset title bar);
 *             the OS draws only the buttons
 *  - frameless: a frameless desktop window (Wails on Windows / Linux); the app draws the
 *               title bar and the buttons, which act on the real window
 */
export type HarborFrame = 'mock' | 'native' | 'overlay' | 'frameless';

/** The menu points, in sidebar order. */
export type HarborPage = 'Overview' | 'Schedules' | 'Destinations' | 'Restore files' | 'Settings';

interface NavItem {
  label: HarborPage;
  icon: string;
}

/**
 * The Harbor Backup main window (docs/08-sample-app.md).
 *
 * The window draws the chrome (title bar, sidebar, header) and shows one page per
 * menu point (pages/*). Pages are built from stock spartan/ui components, the theme's
 * material classes and @spartan-native/desktop-ui, and share their data through HarborStore.
 */
@Component({
  selector: 'harbor-window',
  imports: [
    NgIcon,
    HlmButtonImports,
    HlmInputImports,
    HlmToasterImports,
    SnWindowImports,
    HarborOverview,
    HarborSchedules,
    HarborDestinations,
    HarborRestore,
    HarborSettings,
  ],
  providers: [
    provideIcons({
      lucideClock,
      lucideHardDrive,
      lucideHistory,
      lucideHouse,
      lucideSearch,
      lucideSettings,
    }),
  ],
  templateUrl: './harbor-window.html',
  styleUrl: './harbor-window.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { '[attr.data-chrome]': 'chrome()', '[attr.data-frame]': 'frame()' },
})
export class HarborWindow {
  /** The active skin; drives the window chrome. */
  readonly skin = input<Skin>('win');
  /** Who draws the window frame (see HarborFrame). */
  readonly frame = input<HarborFrame>('mock');

  protected readonly chrome = computed<ChromeFamily>(() => {
    const s = this.skin();
    if (s === 'win' || s === 'w10') return 'win';
    if (s === 'mac' || s === 'macc') return 'mac';
    return 'gtk';
  });

  protected readonly nav: NavItem[] = [
    { label: 'Overview', icon: 'lucideHouse' },
    { label: 'Schedules', icon: 'lucideClock' },
    { label: 'Destinations', icon: 'lucideHardDrive' },
    { label: 'Restore files', icon: 'lucideHistory' },
    { label: 'Settings', icon: 'lucideSettings' },
  ];
  /** The page to open with (Storybook, deep links); the sidebar changes it afterwards. */
  readonly page = input<HarborPage>('Overview');
  protected readonly current = linkedSignal<HarborPage>(() => this.page());

  private readonly store = inject(HarborStore);

  /** The header's primary action, on every page. */
  protected backUpNow(): void {
    this.store.paused.set(false);
    toast('Backup started', { description: 'Documents → Office NAS · 18.2 GB' });
  }
}
