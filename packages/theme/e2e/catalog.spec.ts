import { expect, test, type Page } from '@playwright/test';
import { frames, openStory, SKINS } from './storybook';

// The rest of the spartan/ui catalog (stories/catalog.stories.ts) on every skin.
// Reduced motion: the trace, scroller and drawer use their own reduced-motion paths.
test.use({ reducedMotion: 'reduce' });

const open = (page: Page, story: string, globals: Record<string, string>) =>
  openStory(page, `theme-spartan-catalog--${story}`, globals);

/** Waits for the components that measure or initialise after the first render. */
const SETTLE: Record<string, (page: Page) => Promise<void>> = {
  containers: (p) => p.locator('hlm-carousel-slide-display', { hasText: '1 / 3' }).waitFor(),
  display: (p) => p.locator('img[data-slot="avatar-image"]').first().waitFor(),
  chart: (p) => p.locator('tanstack-chart[data-rendered]').waitFor(),
  conversation: (p) => p.locator('[data-slot="message-scroller"][data-scrollable]').waitFor(),
  assistant: async (p) => {
    await p.locator('[data-slot="questionnaire-item"][data-active]').waitFor();
    await p.locator('[data-slot="trace-collapsible-content"][data-state="open"]').waitFor();
  },
};

const STORIES = [
  'pickers', 'dates', 'input-extras', 'toggles',
  'navigation', 'popups', 'command',
  'disclosure', 'display', 'containers', 'sidebar',
  'conversation', 'assistant', 'chart',
];

/** Popups: [story, open it, what shows once it is open].
 *  Sheet and drawer: the cdk-dialog-container has no box of its own, so wait for the panel. */
const POPUPS: Record<string, [string, (p: Page) => Promise<unknown>, (p: Page) => Promise<unknown>]> = {
  combobox: ['pickers', (p) => p.getByRole('combobox', { name: 'Destination' }).click(), (p) => p.getByRole('listbox').waitFor()],
  autocomplete: ['pickers', (p) => p.getByRole('combobox', { name: 'Restore files' }).fill('Doc'), (p) => p.getByRole('listbox', { name: 'Matching files' }).waitFor()],
  'date-picker': ['dates', (p) => p.getByRole('button', { name: 'Pause until' }).click(), (p) => p.getByRole('dialog').getByRole('grid').waitFor()],
  menubar: ['navigation', (p) => p.getByRole('menuitem', { name: 'File' }).click(), (p) => p.getByRole('menu').waitFor()],
  'navigation-menu': ['navigation', (p) => p.getByRole('button', { name: 'Backups' }).click(), (p) => p.locator('[data-slot="navigation-menu-content"][data-state="open"]').waitFor()],
  popover: ['popups', (p) => p.getByRole('button', { name: 'Retention…' }).click(), (p) => p.getByRole('dialog').waitFor()],
  'hover-card': ['popups', (p) => p.getByRole('button', { name: 'Office NAS' }).hover(), (p) => p.locator('[data-slot="hover-card-content"][data-state="open"]').waitFor()],
  'context-menu': ['popups', (p) => p.locator('[data-slot="context-menu-trigger"]').click({ button: 'right' }), (p) => p.getByRole('menu').waitFor()],
  sheet: ['popups', (p) => p.getByRole('button', { name: 'Backup details' }).click(), (p) => p.locator('[data-slot="sheet-content"]').waitFor()],
  drawer: ['popups', (p) => p.getByRole('button', { name: 'Restore files', exact: true }).click(), (p) => p.locator('[data-slot="drawer-content"]').waitFor()],
  toast: ['popups', (p) => p.getByRole('button', { name: 'Show notification' }).click(), (p) => p.locator('li[data-sonner-toast]').waitFor()],
};

for (const skin of SKINS) {
  test.describe(`catalog · ${skin}`, () => {
    for (const story of STORIES) {
      for (const theme of ['light', 'dark']) {
        test(`${story} · ${theme}`, async ({ page }) => {
          await open(page, story, { skin, theme });
          await SETTLE[story]?.(page);
          await frames(page);
          await expect(page).toHaveScreenshot(`catalog-${skin}-${story}-${theme}.png`, { fullPage: true });
        });
      }
    }

    for (const [name, [story, act, opened]] of Object.entries(POPUPS)) {
      test(`${name} open`, async ({ page }) => {
        await open(page, story, { skin });
        await act(page);
        await opened(page);
        await frames(page);
        await expect(page).toHaveScreenshot(`catalog-${skin}-${name}-open.png`);
      });
    }
  });
}
