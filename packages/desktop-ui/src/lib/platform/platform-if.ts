import { Directive, effect, inject, input, TemplateRef, ViewContainerRef } from '@angular/core';
import { injectSkin, type PlatformFamily, type Skin, skinFamily } from '@spartan-native/theme';

/**
 * A skin or a whole family.
 * Skins: 'win' (Windows 11), 'w10' (Windows 10), 'mac' (macOS 26), 'macc' (macOS 13–15),
 * 'gtk' (GNOME), 'qt' (KDE Plasma), 'cros' (ChromeOS).
 * Families: 'windows' (win, w10), 'macos' (mac, macc), 'linux' (gtk, qt), 'chromeos' (cros), 'web'.
 */
export type PlatformMatch = Skin | PlatformFamily;

/**
 * Renders its template only on the given platforms: a skin, a family, or a list of either
 * (see PlatformMatch). Follows the skin live. With `else`, renders that template instead.
 *
 * ```html
 * <p *snPlatformIf="'macos'; else other">Use the menu bar.</p>
 * <ng-template #other><p>Use the ☰ menu.</p></ng-template>
 *
 * <button *snPlatformIf="['windows', 'linux']">Exit</button>
 * <p *snPlatformIf="'qt'">Plasma only: also in System Settings.</p>
 * ```
 */
@Directive({ selector: '[snPlatformIf]' })
export class SnPlatformIf {
  /** The skins and families to render on. */
  readonly platforms = input.required<PlatformMatch | readonly PlatformMatch[]>({ alias: 'snPlatformIf' });
  /** Rendered on every other platform. */
  readonly elseTemplate = input<TemplateRef<unknown> | null>(null, { alias: 'snPlatformIfElse' });

  private readonly template = inject(TemplateRef);
  private readonly container = inject(ViewContainerRef);
  private readonly skin = injectSkin();
  private shown: TemplateRef<unknown> | null = null;

  constructor() {
    effect(() => {
      const skin = this.skin();
      const wanted = ([] as PlatformMatch[]).concat(this.platforms());
      const match = wanted.includes(skin) || wanted.includes(skinFamily(skin));
      const next = match ? this.template : this.elseTemplate();
      if (next === this.shown) return;
      this.container.clear();
      if (next) this.container.createEmbeddedView(next);
      this.shown = next;
    });
  }
}
