// Each package's .storybook/ is self-contained on purpose, so the package can move to its own
// repository: the other packages have near-identical copies of this file.
import { applicationConfig, type Preview } from '@storybook/angular';
import { spartanNativePreview } from '@spartan-native/theme/storybook';
import { provideSpartanHlm } from '@spartan-ng/helm/utils';

// The Spartan Native toolbar (OS, transparency, light/dark, accent) from the theme package.
const spartanNative = spartanNativePreview({ windowFocus: true });

export default {
  ...spartanNative,
  decorators: [applicationConfig({ providers: [provideSpartanHlm()] }), ...(spartanNative.decorators as [])],
} satisfies Preview;
