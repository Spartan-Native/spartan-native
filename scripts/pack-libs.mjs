#!/usr/bin/env node
// Builds every @spartan-native package and packs each one into a .tgz in dist/tgz,
// so it can be installed in another project with:
//   npm install /path/to/spartan-native/dist/tgz/spartan-native-theme-0.0.0.tgz
//
// Usage: npm run pack:libs            (build + pack)
//        npm run pack:libs -- --skip-build   (pack what is already in dist/)

import { execFileSync } from 'node:child_process';
import { existsSync, mkdirSync, readdirSync, rmSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const dist = join(root, 'dist');
const out = join(dist, 'tgz');

// Same order as `npm run build:libs` (dependencies first).
const libs = [
  'theme',
  'helm',
  'desktop-ui',
  'host-web',
  'host-electron',
  'host-conformance',
];

const npm = process.platform === 'win32' ? 'npm.cmd' : 'npm';
const run = (cmd, args) => {
  try {
    execFileSync(cmd, args, { cwd: root, stdio: 'inherit', shell: process.platform === 'win32' });
  } catch (err) {
    console.error(`\n"${cmd} ${args.join(' ')}" failed.`);
    process.exit(err.status ?? 1);
  }
};

if (!process.argv.includes('--skip-build')) {
  run(npm, ['run', 'build:libs']);
}

rmSync(out, { recursive: true, force: true });
mkdirSync(out, { recursive: true });

for (const lib of libs) {
  const dir = join(dist, lib);
  if (!existsSync(join(dir, 'package.json'))) {
    console.error(`Missing build output for "${lib}" (${dir}). Run without --skip-build.`);
    process.exit(1);
  }
  run(npm, ['pack', dir, '--pack-destination', out]);
}

console.log(`\nPacked into ${out}:`);
for (const file of readdirSync(out).filter((f) => f.endsWith('.tgz'))) {
  console.log(`  ${join(out, file)}`);
}
