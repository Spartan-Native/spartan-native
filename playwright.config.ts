import { defineConfig, devices } from '@playwright/test';

// Visual regression: screenshots of the built Storybooks, one project per package.
//   npm run test:visual                              build the Storybooks, then compare
//   npm run test:visual -- --project=desktop-ui      one package
//   npm run test:visual -- --update-snapshots        accept the new look
const THEME_PORT = 6106;
const DESKTOP_UI_PORT = 6110;
const HARBOR_PORT = 6112;

export default defineConfig({
  // Baselines are per OS: fonts and anti-aliasing differ between machines.
  snapshotPathTemplate: '{testDir}/__screenshots__/{platform}/{arg}{ext}',
  fullyParallel: true,
  reporter: [['list'], ['html', { open: 'never', outputFolder: 'dist/playwright-report' }]],
  outputDir: 'dist/playwright-results',
  use: {
    ...devices['Desktop Chrome'],
    viewport: { width: 1100, height: 900 },
    deviceScaleFactor: 1,
  },
  expect: {
    // Zero differing pixels, with a near-exact colour match: a hairline is only a few hundred pixels,
    // and a background swap between two light colours stays under Playwright's default 0.2 threshold.
    // 0.01 tolerates the ±1-level antialiasing noise on blurred glass edges (~2–3 levels of luma).
    toHaveScreenshot: { animations: 'disabled', caret: 'hide', maxDiffPixels: 0, threshold: 0.01 },
  },
  projects: [
    { name: 'theme', testDir: 'packages/theme/e2e', use: { baseURL: `http://localhost:${THEME_PORT}` } },
    { name: 'desktop-ui', testDir: 'packages/desktop-ui/e2e', use: { baseURL: `http://localhost:${DESKTOP_UI_PORT}` } },
    { name: 'harbor', testDir: 'apps/harbor-backup/e2e', use: { baseURL: `http://localhost:${HARBOR_PORT}` } },
  ],
  webServer: [
    {
      command: `python3 -m http.server ${THEME_PORT} -d dist/storybook/theme`,
      url: `http://localhost:${THEME_PORT}/iframe.html`,
      reuseExistingServer: true,
    },
    {
      command: `python3 -m http.server ${DESKTOP_UI_PORT} -d dist/storybook/desktop-ui`,
      url: `http://localhost:${DESKTOP_UI_PORT}/iframe.html`,
      reuseExistingServer: true,
    },
    {
      command: `python3 -m http.server ${HARBOR_PORT} -d dist/storybook/harbor-backup`,
      url: `http://localhost:${HARBOR_PORT}/iframe.html`,
      reuseExistingServer: true,
    },
  ],
});
