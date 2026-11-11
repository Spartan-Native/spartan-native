#!/usr/bin/env node
// Prepares the built packages in dist/ for a release. Used by .github/workflows/release.yml
// after `npm run build:libs`, so the sources keep their 0.0.0 placeholder versions.
//
// For every dist/<lib>/package.json it:
//   - sets "version" to the release version,
//   - pins the other @spartan-native/* packages it depends on to that same version,
//   - points publishConfig at the GitHub Packages npm registry,
//   - adds "repository", which links the package to the repo (and its visibility) on GitHub.
//
// Usage: node scripts/stamp-release.mjs <version> [<owner>/<repo>]
//   version:    1.2.3, 1.2.3-beta or 1.2.3-beta.4 (a leading "v" is allowed)
//   owner/repo: defaults to $GITHUB_REPOSITORY

import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const dist = join(root, 'dist');

// Same list as scripts/pack-libs.mjs.
const libs = [
  'theme',
  'helm',
  'desktop-ui',
  'host-web',
  'host-tauri',
  'host-electron',
  'host-dotnet',
  'host-conformance',
];

const VERSION = /^v?(\d+\.\d+\.\d+(?:-beta(?:\.\d+)?)?)$/;

const [rawVersion, repoArg] = process.argv.slice(2);
const match = VERSION.exec(rawVersion ?? '');
if (!match) {
  console.error(`"${rawVersion ?? ''}" is not a release version (1.2.3, 1.2.3-beta or 1.2.3-beta.4).`);
  process.exit(1);
}
const version = match[1];

const repo = repoArg ?? process.env.GITHUB_REPOSITORY;
if (!repo) {
  console.error('Pass <owner>/<repo> or set GITHUB_REPOSITORY.');
  process.exit(1);
}

const depFields = ['dependencies', 'peerDependencies', 'optionalDependencies', 'devDependencies'];

for (const lib of libs) {
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

  pkg.repository = { type: 'git', url: `git+https://github.com/${repo}.git` };
  pkg.publishConfig = { ...pkg.publishConfig, registry: 'https://npm.pkg.github.com' };

  writeFileSync(file, `${JSON.stringify(pkg, null, 2)}\n`);
  console.log(`${pkg.name}@${version}`);
}
