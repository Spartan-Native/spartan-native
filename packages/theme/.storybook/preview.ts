import { provideRouter, withDisabledInitialNavigation } from '@angular/router';
import { applicationConfig, type Preview } from '@storybook/angular';
import { spartanNativePreview } from '@spartan-native/theme/storybook';
import { provideSpartanHlm } from '@spartan-ng/helm/utils';

// OS + transparency in the toolbar, light/dark from Storybook's theme switcher,
// and the accent as a color picker in Controls.
const spartanNative = spartanNativePreview({ textSize: true, windowFocus: true });

export default {
  ...spartanNative,
  decorators: [
    applicationConfig({
      // Breadcrumb and pagination links use RouterLink; don't route the iframe URL itself.
      providers: [provideSpartanHlm(), provideRouter([], withDisabledInitialNavigation())],
    }),
    ...(spartanNative.decorators as []),
  ],
} satisfies Preview;
