import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { isWails } from '@spartan-native/host-wails';
import { type Skin, SpartanNativeTheme } from '@spartan-native/theme';
import { type HarborFrame, HarborWindow } from './harbor/harbor-window';
import { injectDisplayMode } from './pwa/window-mode';

@Component({
  selector: 'sn-root',
  imports: [HarborWindow],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="sn-wall stage" [class.installed]="frame() !== 'mock'">
      <harbor-window [skin]="theme.skin()" [frame]="frame()" />
    </div>

    <!-- Dev bar: shows what the OS reports through webHost(), and lets you override it -->
    <div class="dev-bar" role="toolbar" aria-label="Appearance">
      <span class="readout" [title]="'Capabilities: ' + capabilitySummary()">
        {{ platformName() }} · {{ a().scheme }} · {{ a().textScale * 100 }}%
        @if (a().reduceTransparency) { · solid }
        @if (a().contrast !== 'normal') { · {{ a().contrast }} contrast }
        · {{ theme.focused() ? 'focused' : 'inactive' }}
        · {{ modeLabel() }}
        @if (!accentFromOs()) { · <em>accent hidden by this browser</em> }
      </span>

      <button type="button" class="follow" [attr.aria-pressed]="theme.followsSystem()" (click)="theme.followSystem()">Follow system</button>
      <span class="sep" aria-hidden="true"></span>
      @for (s of skins; track s.id) {
        <button type="button" [attr.aria-pressed]="o().skin === s.id" (click)="theme.override({ skin: s.id })">{{ s.label }}</button>
      }
      <button type="button" [attr.aria-pressed]="o().scheme !== undefined" (click)="theme.override({ scheme: theme.scheme() === 'dark' ? 'light' : 'dark' })">
        {{ theme.scheme() === 'dark' ? 'Light' : 'Dark' }}
      </button>
      <label class="accent" [class.overridden]="o().accent !== undefined" title="Override the accent color">
        <span class="swatch" [style.background]="a().accent"></span>
        Accent
        <input type="color" [value]="a().accent" (input)="theme.override({ accent: $any($event.target).value })" />
      </label>
    </div>
  `,
  styles: `
    .stage { min-height: 100vh; display: grid; place-items: center; padding: 48px 24px 72px; box-sizing: border-box; }
    .stage.installed { display: block; padding: 0; }
    .dev-bar { position: fixed; bottom: 12px; left: 50%; translate: -50% 0; display: flex; align-items: center; gap: 4px; padding: 4px;
      max-width: calc(100vw - 24px); overflow-x: auto; border-radius: 10px; background: rgb(20 20 24 / 0.88);
      font: 12px system-ui, sans-serif; white-space: nowrap; }
    .dev-bar button, .accent { border: 0; border-radius: 7px; padding: 6px 10px; background: transparent; color: #ddd; cursor: pointer; font: inherit; }
    .dev-bar button:hover, .accent:hover { background: rgb(255 255 255 / 0.1); }
    .dev-bar button[aria-pressed='true'], .accent.overridden { background: #fff; color: #111; }
    .dev-bar .follow[aria-pressed='true'] { background: #2f7d4f; color: #fff; }
    .readout { display: inline-flex; align-items: center; gap: 4px; padding: 0 8px; color: #aaa; }
    .readout em { color: #e3b341; font-style: normal; }
    .sep { width: 1px; height: 18px; margin: 0 4px; background: rgb(255 255 255 / 0.2); }
    .accent { display: inline-flex; align-items: center; gap: 6px; position: relative; }
    .accent input { position: absolute; inset: 0; opacity: 0; cursor: pointer; }
    .swatch { width: 10px; height: 10px; border-radius: 50%; box-shadow: 0 0 0 1px rgb(255 255 255 / 0.4); }
  `,
})
export class App {
  protected readonly theme = inject(SpartanNativeTheme);
  protected readonly a = this.theme.appearance;
  protected readonly o = this.theme.overrides;
  protected readonly skins: { id: Skin; label: string }[] = [
    { id: 'win', label: 'Windows 11' },
    { id: 'mac', label: 'macOS 26' },
    { id: 'gtk', label: 'GNOME' },
  ];

  /** Browser tab, installed window, or installed with Window Controls Overlay. */
  protected readonly displayMode = injectDisplayMode();
  protected readonly inWails = isWails();
  protected readonly frame = computed<HarborFrame>(() => {
    if (this.inWails) {
      // macOS keeps its traffic lights (hidden-inset title bar); elsewhere the window is frameless
      return this.theme.platform()?.os === 'macos' ? 'overlay' : 'frameless';
    }
    const mode = this.displayMode();
    return mode === 'browser' ? 'mock' : mode === 'overlay' ? 'overlay' : 'native';
  });
  protected readonly modeLabel = computed(() =>
    this.inWails
      ? 'Wails desktop app'
      : ({ browser: 'browser tab', standalone: 'installed', overlay: 'installed · title bar overlay' })[this.displayMode()],
  );

  /** False in Chromium tabs: it answers a fixed blue instead of the OS accent (installed apps can get the real one). */
  protected readonly accentFromOs = computed(() => this.theme.capability('systemAccent') !== 'none');

  protected readonly platformName = computed(() => {
    const p = this.theme.platform();
    if (!p) return '…';
    const os = { windows: 'Windows', macos: 'macOS', linux: 'Linux', chromeos: 'ChromeOS', unknown: 'Web' }[p.os];
    return p.version ? `${os} ${p.version.split('.')[0]}` : os;
  });

  protected readonly capabilitySummary = computed(() =>
    (['systemAccent', 'colorScheme', 'highContrast', 'reduceTransparency', 'textScale', 'windowFocus'] as const)
      .map((c) => `${c}: ${this.theme.capability(c)}`)
      .join(', '),
  );
}
