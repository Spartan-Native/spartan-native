// app.config.ts: the only file that knows which runtime the app runs in.
import { ApplicationConfig, provideBrowserGlobalErrorListeners } from '@angular/core';
import { provideSpartanNative } from '@spartan-native/theme';
import { provideSpartanHlm } from '@spartan-ng/helm/utils';

// Pick the host for your runtime. Keep exactly one of these blocks.

// --- Wails v3 desktop app, with a browser fallback for `ng serve` ------------
import { isWails, wailsHost } from '@spartan-native/host-wails';
import { webHost } from '@spartan-native/host-web';
const host = isWails() ? wailsHost() : webHost();

// --- Tauri v2 desktop app, with a browser fallback ---------------------------
// import { isTauri, tauriHost } from '@spartan-native/host-tauri';
// import { webHost } from '@spartan-native/host-web';
// const host = isTauri() ? tauriHost() : webHost();

// --- Photino.NET desktop app, with a browser fallback ------------------------
// import { dotnetHost, isPhotino } from '@spartan-native/host-dotnet';
// import { webHost } from '@spartan-native/host-web';
// const host = isPhotino() ? dotnetHost() : webHost();

// --- Browser / PWA only ------------------------------------------------------
// import { webHost } from '@spartan-native/host-web';
// const host = webHost();

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideSpartanHlm(),
    // Reads the OS before the first render. `overrides` (optional) wins over the OS:
    // provideSpartanNative({ host, overrides: { scheme: 'dark' } })
    provideSpartanNative({ host }),
  ],
};
