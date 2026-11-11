import { ApplicationConfig, isDevMode, provideBrowserGlobalErrorListeners } from '@angular/core';
import { provideServiceWorker } from '@angular/service-worker';
import { webHost } from '@spartan-native/host-web';
import { isWails, wailsHost } from '@spartan-native/host-wails';
import { provideSpartanNative } from '@spartan-native/theme';
import { provideSpartanHlm } from '@spartan-ng/helm/utils';

/** Inside the Wails desktop app (apps/harbor-desktop), or in a browser / installed PWA. */
const inWails = isWails();

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideSpartanHlm(),
    // The only line that changes per runtime: the host.
    //  - Wails: the Go service reads the real OS settings and owns the window
    //  - browser / PWA: browser APIs (accent only where the browser exposes it)
    provideSpartanNative({ host: inWails ? wailsHost() : webHost() }),
    // Offline support for the PWA; inside Wails the assets come from the binary.
    provideServiceWorker('ngsw-worker.js', {
      enabled: !isDevMode() && !inWails,
      registrationStrategy: 'registerWhenStable:30000',
    }),
  ],
};
