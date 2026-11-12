#!/usr/bin/env node
// Prepares the built packages in dist/ for a release. Used by .github/workflows/release.yml
// after `npm run build:libs`.
//
// The release tag is the source of truth for the version. The "version" in each source
// package.json is the last released version; this script overwrites it in dist/ only.
// For every published package (scripts/libraries.mjs) it:
//   - sets "version" to the release version,
//   - pins the other @spartan-native/* packages it depends on to that same version.
//
// Usage: node scripts/stamp-release.mjs <version>
//   version: 1.2.3, 1.2.3-beta or 1.2.3-beta.4 (a leading "v" is allowed)

import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { publishedLibraries } from './libraries.mjs';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const dist = join(root, 'dist');

const VERSION = /^v?(\d+\.\d+\.\d+(?:-beta(?:\.\d+)?)?)$/;

const [rawVersion] = process.argv.slice(2);
const match = VERSION.exec(rawVersion ?? '');
if (!match) {
  console.error(`"${rawVersion ?? ''}" is not a release version (1.2.3, 1.2.3-beta or 1.2.3-beta.4).`);
  process.exit(1);
}
const version = match[1];

const depFields = ['dependencies', 'peerDependencies', 'optionalDependencies', 'devDependencies'];

for (const lib of publishedLibraries) {
  const file = join(dist, lib, 'package.json');
  if (!existsSync(file)) {
    console.error(`Missing build output for "${lib}" (${file}). Run "npm run build:libs" first.`);
    process.exit(1);
  }

  const pkg = JSON.parse(readFileSync(file, 'utf8'));
  pkg.version = version;

  for (const field of depFields) {
    for (const name of Object.keys(pkg[field] ?? {})) {
      if (name.startsWith('@spartan-native/')) pkg[field][name] = version;
    }
  }

  writeFileSync(file, `${JSON.stringify(pkg, null, 2)}\n`);
  console.log(`${pkg.name}@${version}`);
}
