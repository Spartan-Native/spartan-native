import { type EnvironmentProviders, inject, makeEnvironmentProviders, provideAppInitializer } from '@angular/core';
import {
  NATIVE_HOST,
  SPARTAN_NATIVE_OPTIONS,
  SpartanNativeTheme,
  type SpartanNativeOptions,
} from './spartan-native-theme';

/**
 * Wires Spartan Native into an Angular app.
 *
 * ```ts
 * // app.config.ts: the only line that changes per runtime is the host
 * export const appConfig: ApplicationConfig = {
 *   providers: [provideSpartanNative({ host: wailsHost() })],
 * };
 * ```
 *
 * The initial appearance is read before the first render, so the app never flashes the wrong skin.
 */
export function provideSpartanNative(options: SpartanNativeOptions): EnvironmentProviders {
  return makeEnvironmentProviders([
    { provide: SPARTAN_NATIVE_OPTIONS, useValue: options },
    { provide: NATIVE_HOST, useValue: options.host },
    SpartanNativeTheme,
    provideAppInitializer(() => inject(SpartanNativeTheme).init()),
  ]);
}
