import { applicationConfig, type Preview } from '@storybook/angular';
import { spartanNativePreview } from '@spartan-native/theme/storybook';
import { provideSpartanHlm } from '@spartan-ng/helm/utils';

// The app adds text size and window focus to the theme's toolbar.
const spartanNative = spartanNativePreview({ textSize: true, windowFocus: true });

export default {
  ...spartanNative,
  decorators: [applicationConfig({ providers: [provideSpartanHlm()] }), ...(spartanNative.decorators as [])],
} satisfies Preview;
