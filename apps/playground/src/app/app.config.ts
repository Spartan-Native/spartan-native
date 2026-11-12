import { ApplicationConfig, provideBrowserGlobalErrorListeners } from '@angular/core';
import { webHost } from '@spartan-native/host-web';
import { provideSpartanNative } from '@spartan-native/theme';
import { provideSpartanHlm } from '@spartan-ng/helm/utils';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideSpartanHlm(),
    // Reads this browser's OS settings live. The controls in the playground override them;
    // `persist` keeps those overrides across reloads.
    provideSpartanNative({ host: webHost(), persist: { key: 'spartan-native-playground' } }),
  ],
};
