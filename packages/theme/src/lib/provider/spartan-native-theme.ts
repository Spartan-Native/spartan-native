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
import { type PlatformFamily, skinFamily } from '../skin/skin-family';

export const NATIVE_HOST = new InjectionToken<NativeHost>('NATIVE_HOST');

export interface SpartanNativeOptions {
  /** The runtime adapter, e.g. `webHost()`, `wailsHost()`, or `staticHost()`. */
  host: NativeHost;
  /** Values that win over the host, e.g. a skin the user picked in settings. */
  overrides?: Partial<AppearanceState>;
  /**
   * Keep the user's overrides between launches. `true` stores them in `localStorage` under
   * `spartan-native:overrides`; pass `{ key, storage }` for another key or store (anything with
   * `getItem` / `setItem` / `removeItem`). Stored overrides win over `overrides`, and are read
   * before the first render, so the window opens in the user's look.
   */
  persist?: boolean | SpartanNativePersistence;
}

/** Where `persist` keeps the overrides. */
export interface SpartanNativePersistence {
  /** Default: `spartan-native:overrides`. */
  key?: string;
  /** Default: `localStorage`. */
  storage?: Pick<Storage, 'getItem' | 'setItem' | 'removeItem'>;
}

export const DEFAULT_PERSIST_KEY = 'spartan-native:overrides';

const APPEARANCE_KEYS: readonly (keyof AppearanceState)[] = [
  'skin',
  'accent',
  'scheme',
  'contrast',
  'reduceTransparency',
  'reduceMotion',
  'textScale',
];

/** The store `persist` asks for, or null when off or unavailable (SSR, privacy mode). */
function persistence(
  option: SpartanNativeOptions['persist'],
): { key: string; storage: SpartanNativePersistence['storage'] & object } | null {
  if (!option) return null;
  const config = option === true ? {} : option;
  let storage = config.storage;
  if (!storage) {
    try {
      storage = globalThis.localStorage;
    } catch {
      storage = undefined;
    }
  }
  return storage ? { key: config.key ?? DEFAULT_PERSIST_KEY, storage } : null;
}

/** Reads stored overrides, keeping only appearance fields of the right type. */
export function readStoredOverrides(
  storage: Pick<Storage, 'getItem'>,
  key = DEFAULT_PERSIST_KEY,
): Partial<AppearanceState> {
  try {
    const raw = storage.getItem(key);
    const parsed: unknown = raw ? JSON.parse(raw) : null;
    if (!parsed || typeof parsed !== 'object') return {};
    const out: Record<string, unknown> = {};
    for (const k of APPEARANCE_KEYS) {
      const v = (parsed as Record<string, unknown>)[k];
      if (v !== undefined && typeof v === typeof DEFAULT_APPEARANCE[k]) out[k] = v;
    }
    return out as Partial<AppearanceState>;
  } catch {
    return {};
  }
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
  private readonly store = persistence(this.options.persist);
  private readonly userOverrides = signal<Partial<AppearanceState>>({
    ...this.options.overrides,
    ...(this.store ? readStoredOverrides(this.store.storage, this.store.key) : {}),
  });

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
  /**
   * The skin the OS itself would have (the host's platform), whatever skin the user picked.
   * Before init, and on hosts that don't know the OS, it is the active skin.
   */
  readonly nativeSkin = computed<Skin>(() => this.platform()?.skin ?? this.skin());
  /**
   * The real OS family, for behavior that follows the keyboard and the window manager rather
   * than the look: shortcut notation (⌘ vs Ctrl), where the OS draws the window buttons,
   * the macOS menu bar. A Mac dressed as Windows is still `macos` here.
   */
  readonly platformFamily = computed<PlatformFamily>(() => skinFamily(this.nativeSkin()));
  readonly runtime = this.host.runtime;
  /** The host's window services (focus, and minimize / maximize / close where the host owns a window). */
  readonly window = this.host.window;
  /** The host's native menus, when its runtime has them. */
  readonly menus = this.host.menus;
  /** What the host's runtime can do natively. */
  readonly capabilities = this.host.capabilities;

  constructor() {
    effect(() => {
      const resolved: ResolvedAppearance = { ...this.appearance(), focused: this.focused() };
      applySpartanNative(this.doc.documentElement, resolved);
      this.doc.documentElement.dataset['snPlatform'] = this.nativeSkin();
    });
    if (this.store) {
      const { key, storage } = this.store;
      effect(() => {
        const overrides = this.userOverrides();
        try {
          if (Object.keys(overrides).length) storage.setItem(key, JSON.stringify(overrides));
          else storage.removeItem(key);
        } catch {
          // quota or privacy mode: the overrides still apply for this session
        }
      });
    }
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
