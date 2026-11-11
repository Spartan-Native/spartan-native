import { expect, test, type Page } from '@playwright/test';
import { openStory, SKINS } from '../../../packages/theme/e2e/storybook';

// Every Harbor page (one story per menu point) on every skin, light and dark.
test.use({ reducedMotion: 'reduce', viewport: { width: 1200, height: 760 } });

const PAGES: Record<string, string> = {
  overview: 'window',
  schedules: 'schedules',
  destinations: 'destinations',
  restore: 'restore-files',
  settings: 'settings',
};

/** Pages are @defer chunks; wait for the page, then for what it places or measures after render. */
async function settle(page: Page, name: string): Promise<void> {
  await page.locator('harbor-window .page').first().waitFor();
  if (name === 'overview') await page.locator('tanstack-chart[data-rendered]').waitFor();
  if (name === 'destinations') await page.locator('sn-coach-mark[data-placed]').waitFor();
  await page.evaluate(() => new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r))));
}

for (const skin of SKINS) {
  test.describe(`harbor · ${skin}`, () => {
    for (const [name, story] of Object.entries(PAGES)) {
      for (const theme of ['light', 'dark']) {
        test(`${name} · ${theme}`, async ({ page }) => {
          await openStory(page, `harbor-backup-window--${story}`, { skin, theme });
          await settle(page, name);
          await expect(page).toHaveScreenshot(`${skin}-${name}-${theme}.png`);
        });
      }
    }
  });
}
