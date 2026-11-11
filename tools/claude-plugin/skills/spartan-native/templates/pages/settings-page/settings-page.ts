import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { NgIcon, provideIcons } from '@ng-icons/core';
import { lucideBell, lucidePower, lucideSunMoon } from '@ng-icons/lucide';
import { SnNumberBox, SnPlatformImports, SnSettingsImports } from '@spartan-native/desktop-ui';
import { SpartanNativeTheme } from '@spartan-native/theme';
import { HlmSwitchImports } from '@spartan-ng/helm/switch';
import { HlmToggleGroupImports } from '@spartan-ng/helm/toggle-group';

type Appearance = 'system' | 'light' | 'dark';

/**
 * A settings screen: grouped rows with a control at the end. Renders as Windows
 * settings cards, a macOS grouped form, GNOME boxed lists, KDE form layout…
 */
@Component({
  selector: 'app-settings-page',
  imports: [NgIcon, SnSettingsImports, SnPlatformImports, SnNumberBox, HlmSwitchImports, HlmToggleGroupImports],
  providers: [provideIcons({ lucideBell, lucidePower, lucideSunMoon })],
  templateUrl: './settings-page.html',
  styleUrl: './settings-page.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SettingsPage {
  private readonly theme = inject(SpartanNativeTheme);

  protected readonly launchAtLogin = signal(true);
  protected readonly notifications = signal(true);
  protected readonly keepDays = signal<number | null>(30);
  protected readonly appearance = signal<Appearance>(this.theme.followsSystem() ? 'system' : this.theme.scheme());

  /** "System" follows the OS live (followSystem() clears every override); Light / Dark override it. */
  protected setAppearance(value: Appearance | Appearance[] | null | undefined): void {
    if (!value || Array.isArray(value)) return;
    this.appearance.set(value);
    if (value === 'system') this.theme.followSystem();
    else this.theme.override({ scheme: value });
  }
}
