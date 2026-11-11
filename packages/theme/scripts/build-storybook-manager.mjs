#!/usr/bin/env node
// Builds the Storybook toolbar addon (packages/theme/storybook/manager, React) into the theme's
// build output, so apps can load it from the package:
//
//   // .storybook/manager.ts
//   import '@spartan-native/theme/storybook/manager';
//
// ng-packagr only builds the Angular entry points, so this runs right after `ng build theme`.
// React, Storybook and @storybook/icons stay external: Storybook's manager supplies them.

import { build } from 'esbuild';
import { existsSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const pkg = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const dist = resolve(pkg, '../../dist/theme');

if (!existsSync(join(dist, 'package.json'))) {
  console.error(`No theme build in ${dist}. Run "ng build theme" first.`);
  process.exit(1);
}

await build({
  entryPoints: [join(pkg, 'storybook/manager/index.tsx')],
  outfile: join(dist, 'storybook/manager.mjs'),
  bundle: true,
  format: 'esm',
  platform: 'browser',
  target: 'es2022',
  jsx: 'transform',
  sourcemap: true,
  legalComments: 'none',
  external: ['react', 'react-dom', 'storybook', 'storybook/*', '@storybook/icons', '@spartan-native/theme'],
  logLevel: 'info',
});
