import { expect, test, type Page } from '@playwright/test';
import { frames, openStory, SKINS } from '../../theme/e2e/storybook';

// Every desktop-ui story on every skin (light), and each component's main story in dark.
// Reduced motion: the coach mark, modal sheet and inspector use their reduced-motion paths.
test.use({ reducedMotion: 'reduce', viewport: { width: 1000, height: 700 } });

/** Story ids by component, from the built Storybook's index (`desktop-ui-<group>-<component>--<story>`). */
const STORIES: Record<string, string[]> = {
  'window-title-bar': ['default', 'with-subtitle', 'with-start-content', 'maximized', 'close-only', 'native-controls', 'inactive'],
  'window-window-controls': ['default', 'maximized', 'close-only', 'linux-all', 'events', 'inactive'],
  'patterns-command-bar': ['in-a-window', 'with-overflow', 'disabled-commands'],
  'patterns-coach-mark': ['open-on-load', 'toggle', 'placement'],
  'patterns-modal-sheet': ['open-on-load', 'opened-by-button', 'destructive-confirmation'],
  'patterns-inspector': ['default', 'narrow', 'in-window'],
  'patterns-sidebar-navigation': ['with-sections', 'flat'],
  'patterns-settings-list': ['default', 'switch-rows', 'select-row', 'navigation-row', 'multiple-groups'],
  'patterns-status-page': ['default', 'two-actions', 'without-actions', 'title-only'],
  'platform-shortcut': ['table', 'inline'],
  'platform-platform-if': ['family', 'skin', 'list', 'every-skin'],
};

/** Waits for the stories that place an overlay after the first render. */
async function settle(page: Page, id: string): Promise<void> {
  if (id.startsWith('patterns-coach-mark--') && !id.endsWith('--toggle')) {
    await page.locator('sn-coach-mark[data-placed]').first().waitFor();
  }
  if (id === 'patterns-modal-sheet--open-on-load') {
    await page.locator('[data-slot="sn-modal-sheet-panel"]').waitFor();
  }
  await frames(page);
}

for (const skin of SKINS) {
  test.describe(`desktop-ui · ${skin}`, () => {
    for (const [component, stories] of Object.entries(STORIES)) {
      for (const story of stories) {
        const id = `${component}--${story}`;
        const themes = story === stories[0] ? ['light', 'dark'] : ['light'];
        for (const theme of themes) {
          test(`${id} · ${theme}`, async ({ page }) => {
            await openStory(page, `desktop-ui-${id}`, { skin, theme });
            await settle(page, id);
            await expect(page).toHaveScreenshot(`${skin}-${id}-${theme}.png`);
          });
        }
      }
    }
  });
}
