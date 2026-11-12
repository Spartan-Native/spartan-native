// The packages that are published to npm, in dependency order (a package comes after the
// packages it depends on). scripts/pack-libs.mjs, scripts/stamp-release.mjs,
// scripts/check-packages.mjs and .github/workflows/release.yml all read this list.
//
// Each entry is the folder name under dist/ that `npm run build:libs` writes.
// @spartan-native/host-electron is built and tested, but not published until it has an
// implementation (its package.json is marked "private").
export const publishedLibraries = ['theme', 'helm', 'desktop-ui', 'host-web', 'host-conformance'];

// `node scripts/libraries.mjs` prints the list, one per line, for shell scripts.
if (import.meta.url === `file://${process.argv[1]}`) {
  console.log(publishedLibraries.join('\n'));
}
