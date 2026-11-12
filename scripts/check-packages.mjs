#!/usr/bin/env node
// Checks that every built package in dist/ is ready for npm: the metadata npm shows is
// there, and the tarball holds the files it should. Run after `npm run build:libs`
// (CI does this on every pull request).
//
// Usage: node scripts/check-packages.mjs

import { execFileSync } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { publishedLibraries } from './libraries.mjs';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const npm = process.platform === 'win32' ? 'npm.cmd' : 'npm';

const requiredFields = [
  'name',
  'version',
  'description',
  'license',
  'repository',
  'homepage',
  'bugs',
];
const requiredFiles = ['package.json', 'README.md', 'LICENSE', 'AGENTS.md'];
/** Extra files per package, beyond the ones every package needs. */
const extraFiles = {
  theme: ['styles/spartan-native.scss', 'storybook/manager.mjs'],
  helm: ['styles/spartan-native-helm.scss'],
};

let failed = false;
const fail = (lib, message) => {
  console.error(`✗ ${lib}: ${message}`);
  failed = true;
};

for (const lib of publishedLibraries) {
  const dir = join(root, 'dist', lib);
  if (!existsSync(join(dir, 'package.json'))) {
    fail(lib, `no build output in ${dir}. Run "npm run build:libs" first.`);
    continue;
  }

  const pkg = JSON.parse(readFileSync(join(dir, 'package.json'), 'utf8'));
  for (const field of requiredFields) {
    if (!pkg[field]) fail(lib, `package.json has no "${field}"`);
  }
  if (pkg.private) fail(lib, 'package.json is marked "private"');
  if (pkg.publishConfig?.access !== 'public')
    fail(lib, 'publishConfig.access must be "public" (scoped packages are private by default)');
  if (pkg.publishConfig?.registry)
    fail(
      lib,
      `publishConfig.registry is set (${pkg.publishConfig.registry}); packages go to npmjs.org`,
    );

  const [packed] = JSON.parse(
    execFileSync(npm, ['pack', '--dry-run', '--json', '--ignore-scripts'], {
      cwd: dir,
      encoding: 'utf8',
      shell: process.platform === 'win32',
    }),
  );
  const files = new Set(packed.files.map((f) => f.path));
  for (const file of [...requiredFiles, ...(extraFiles[lib] ?? [])]) {
    if (!files.has(file)) fail(lib, `the tarball has no ${file}`);
  }

  const relativeLink = /\]\((?!https?:|#|mailto:)[^)]*\.\.\//;
  const readme = readFileSync(join(dir, 'README.md'), 'utf8');
  if (relativeLink.test(readme))
    fail(lib, 'README.md has a relative link out of the package; it breaks on npmjs.com');

  if (!failed)
    console.log(
      `✓ ${pkg.name}: ${packed.entryCount} files, ${(packed.size / 1024).toFixed(0)} kB packed`,
    );
}

process.exit(failed ? 1 : 0);
