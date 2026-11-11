import {
  type AppearanceState,
  CAPABILITIES,
  type CapabilityLevel,
  DEFAULT_APPEARANCE,
  type HostCapabilities,
  type NativeHost,
  type PlatformInfo,
  type Unsubscribe,
} from './native-host';

/** A host whose values are set by code, not read from the OS. */
export interface StaticHost extends NativeHost {
  /** Change the appearance; subscribers are notified like an OS change. */
  set(patch: Partial<AppearanceState>): void;
  /** Simulate the window gaining or losing focus. */
  setFocused(focused: boolean): void;
}

/**
 * A NativeHost with fixed, code-controlled values. Every capability is `'none'`.
 * Use it for Storybook, tests, demos and apps that let the user pick the look themselves.
 */
export function staticHost(initial: Partial<AppearanceState> = {}): StaticHost {
  let state: AppearanceState = { ...DEFAULT_APPEARANCE, ...initial };
  let focused = true;
  const appearanceListeners = new Set<(s: AppearanceState) => void>();
  const focusListeners = new Set<(f: boolean) => void>();
  const subscribe = <T>(set: Set<T>, cb: T): Unsubscribe => {
    set.add(cb);
    return () => set.delete(cb);
  };

  const capabilities = Object.fromEntries(
    CAPABILITIES.map((c) => [c, 'none' satisfies CapabilityLevel]),
  ) as HostCapabilities;

  return {
    runtime: 'static',
    capabilities,
    platform: async (): Promise<PlatformInfo> => ({
      os: 'unknown',
      version: null,
      build: null,
      desktop: null,
      skin: state.skin,
      confidence: 'unknown',
    }),
    appearance: async () => state,
    onAppearanceChange: (cb) => subscribe(appearanceListeners, cb),
    window: {
      isFocused: async () => focused,
      onFocusChange: (cb) => subscribe(focusListeners, cb),
    },
    set(patch) {
      state = { ...state, ...patch };
      appearanceListeners.forEach((cb) => cb(state));
    },
    setFocused(value) {
      focused = value;
      focusListeners.forEach((cb) => cb(value));
    },
  };
}
