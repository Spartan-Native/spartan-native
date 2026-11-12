// Builds the project website (GitHub Pages) into dist/site.
//
//   node scripts/build-site.mjs      or   npm run build:site
//   npx serve dist/site              to look at it locally
//
// The site is plain HTML, CSS and JS in site/, and works when opened straight from the
// repository: its images point at ../docs/images/. This script copies the pages and
// site/assets, copies docs/images to images/ and rewrites the image paths to match.

import { cpSync, mkdirSync, readFileSync, readdirSync, rmSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const src = join(root, 'site');
const out = join(root, 'dist', 'site');

rmSync(out, { recursive: true, force: true });
mkdirSync(out, { recursive: true });

const pages = readdirSync(src).filter((f) => f.endsWith('.html'));
for (const page of pages) {
  const html = readFileSync(join(src, page), 'utf8').replaceAll('../docs/images/', 'images/');
  if (html.includes('../')) throw new Error(`${page}: a path still points outside the site`);
  writeFileSync(join(out, page), html);
}

cpSync(join(src, 'assets'), join(out, 'assets'), { recursive: true });
cpSync(join(root, 'docs', 'images'), join(out, 'images'), { recursive: true });
writeFileSync(join(out, '.nojekyll'), '');

console.log(`Site built: ${pages.length} pages → ${out}`);
