import { DOCUMENT } from '@angular/common';
import { computed, DestroyRef, effect, inject, Injectable, InjectionToken, signal } from '@angular/core';
import {
  type AppearanceState,
  type CapabilityLevel,
  type Capability,
  DEFAULT_APPEARANCE,
  type NativeHost,
  type PlatformInfo,
  type Skin,
} from '../contract/native-host';
import { applySpartanNative, type ResolvedAppearance } from './apply-appearance';

export const NATIVE_HOST = new InjectionToken<NativeHost>('NATIVE_HOST');

export interface SpartanNativeOptions {
  /** The runtime adapter, e.g. `webHost()`, `wailsHost()`, or `staticHost()`. */
  host: NativeHost;
  /** Values that win over the host, e.g. a skin the user picked in settings. */
  overrides?: Partial<AppearanceState>;
}

export const SPARTAN_NATIVE_OPTIONS = new InjectionToken<SpartanNativeOptions>('SPARTAN_NATIVE_OPTIONS');

/**
 * The live appearance of the app, as signals.
 * It reads the host, applies the user's overrides, and keeps `<html>` in sync.
 */
@Injectable()
export class SpartanNativeTheme {
  private readonly host = inject(NATIVE_HOST);
  private readonly doc = inject(DOCUMENT);
  private readonly options = inject(SPARTAN_NATIVE_OPTIONS);

  private readonly fromHost = signal<AppearanceState>(DEFAULT_APPEARANCE);
  private readonly userOverrides = signal<Partial<AppearanceState>>(this.options.overrides ?? {});

  /** What the host reported about the platform (null until init). */
  readonly platform = signal<PlatformInfo | null>(null);
  readonly focused = signal(true);

  /** What the user overrode (empty when following the system). */
  readonly overrides = this.userOverrides.asReadonly();
  /** True when nothing is overridden: every value comes from the OS. */
  readonly followsSystem = computed(() => Object.keys(this.userOverrides()).length === 0);

  /** Host values with the user's overrides applied. */
  readonly appearance = computed<AppearanceState>(() => ({ ...this.fromHost(), ...this.userOverrides() }));
  readonly skin = computed<Skin>(() => this.appearance().skin);
  readonly scheme = computed(() => this.appearance().scheme);
  readonly textScale = computed(() => this.appearance().textScale);
  readonly runtime = this.host.runtime;
  /** The host's window services (focus, and minimize / maximize / close where the host owns a window). */
  readonly window = this.host.window;

  constructor() {
    effect(() => {
      const resolved: ResolvedAppearance = { ...this.appearance(), focused: this.focused() };
      applySpartanNative(this.doc.documentElement, resolved);
    });
    const destroyRef = inject(DestroyRef);
    destroyRef.onDestroy(this.host.onAppearanceChange((s) => this.fromHost.set(s)));
    destroyRef.onDestroy(this.host.window.onFocusChange((f) => this.focused.set(f)));
  }

  /** Reads the initial values from the host. Called by provideSpartanNative() before first render. */
  async init(): Promise<void> {
    const [platform, appearance, focused] = await Promise.all([
      this.host.platform(),
      this.host.appearance(),
      this.host.window.isFocused(),
    ]);
    this.platform.set(platform);
    this.fromHost.set({ ...appearance, skin: appearance.skin ?? platform.skin });
    this.focused.set(focused);
  }

  /** Override part of the appearance (e.g. from an in-app settings screen). */
  override(patch: Partial<AppearanceState>): void {
    this.userOverrides.update((o) => ({ ...o, ...patch }));
  }

  /** Drop the overrides and follow the OS again. */
  followSystem(): void {
    this.userOverrides.set({});
  }

  capability(name: Capability): CapabilityLevel {
    return this.host.capabilities[name];
  }
}
