import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { NgIcon, provideIcons } from '@ng-icons/core';
import {
  lucideArchive,
  lucideBell,
  lucideFolder,
  lucidePlus,
  lucidePower,
  lucideShare2,
  lucideTrash2,
} from '@ng-icons/lucide';
import {
  SnCommandBarImports,
  SnPlatformImports,
  SnSettingsImports,
  SnStatusPage,
  SnWindowImports,
} from '@spartan-native/desktop-ui';
import { SKIN_OPTIONS, SpartanNativeTheme, type Skin } from '@spartan-native/theme';
import { HlmButtonImports } from '@spartan-ng/helm/button';
import { HlmInputImports } from '@spartan-ng/helm/input';
import { HlmNativeSelectImports } from '@spartan-ng/helm/native-select';
import { HlmSwitchImports } from '@spartan-ng/helm/switch';
import { HlmToggleGroupImports } from '@spartan-ng/helm/toggle-group';

/** The platforms' default accents and a few common picks. */
const ACCENTS = ['#0078d4', '#007aff', '#3584e4', '#3daee9', '#9141ac', '#e66100', '#26a269', '#d56199'];

/**
 * The playground: one window built from stock spartan/ui and desktop-ui components, and the
 * controls to look at it as each OS, light or dark, with any accent. Everything the controls
 * change goes through SpartanNativeTheme, the same API an app's settings screen would use.
 */
@Component({
  selector: 'sn-root',
  imports: [
    NgIcon,
    SnCommandBarImports,
    SnPlatformImports,
    SnSettingsImports,
    SnStatusPage,
    SnWindowImports,
    HlmButtonImports,
    HlmInputImports,
    HlmNativeSelectImports,
    HlmSwitchImports,
    HlmToggleGroupImports,
  ],
  providers: [
    provideIcons({ lucideArchive, lucideBell, lucideFolder, lucidePlus, lucidePower, lucideShare2, lucideTrash2 }),
  ],
  templateUrl: './app.html',
  styleUrl: './app.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class App {
  protected readonly theme = inject(SpartanNativeTheme);
  protected readonly skins = SKIN_OPTIONS;
  protected readonly accents = ACCENTS;

  // Demo state for the window's content
  protected readonly launchAtLogin = signal(true);
  protected readonly notifications = signal(false);
  protected readonly empty = signal(false);

  protected setSkin(skin: string | null | undefined): void {
    if (skin) this.theme.override({ skin: skin as Skin });
  }

  protected setScheme(scheme: unknown): void {
    if (scheme === 'light' || scheme === 'dark') this.theme.override({ scheme });
  }

  protected setAccent(accent: string): void {
    this.theme.override({ accent });
  }
}
