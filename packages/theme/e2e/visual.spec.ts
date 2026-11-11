import { expect, test, type Page } from '@playwright/test';
import { openStory, SKINS } from './storybook';

const open = (page: Page, story: string, globals: Record<string, string>) =>
  openStory(page, `theme-spartan-components--${story}`, globals);

for (const skin of SKINS) {
  test.describe(skin, () => {
    // --- Every component, light and dark ---------------------------------------
    for (const theme of ['light', 'dark']) {
      test(`all components · ${theme}`, async ({ page }) => {
        await open(page, 'all-components', { skin, theme });
        await expect(page).toHaveScreenshot(`${skin}-all-${theme}.png`, { fullPage: true });
      });
    }

    // --- OS accessibility and window states (light) -----------------------------
    const states: Record<string, Record<string, string>> = {
      'reduced-transparency': { transparency: 'reduced' },
      'more-contrast': { contrast: 'more' },
      inactive: { window: 'inactive' },
      'text-200': { textScale: '2' },
    };
    for (const [name, globals] of Object.entries(states)) {
      test(`all components · ${name}`, async ({ page }) => {
        await open(page, 'all-components', { skin, theme: 'light', ...globals });
        await expect(page).toHaveScreenshot(`${skin}-all-${name}.png`, { fullPage: true });
      });
    }

    // --- Overlays, actually opened ------------------------------------------------
    test('dropdown menu', async ({ page }) => {
      await open(page, 'overlays', { skin });
      await page.getByRole('button', { name: 'Actions' }).click();
      await page.getByRole('menuitem', { name: 'Settings…' }).waitFor();
      await expect(page).toHaveScreenshot(`${skin}-menu.png`);
    });

    test('select list', async ({ page }) => {
      await open(page, 'overlays', { skin });
      await page.getByRole('combobox').click(); // the only one; its aria-label sits on the hlm-select-trigger wrapper
      await page.getByRole('option', { name: 'Weekly' }).waitFor();
      await expect(page).toHaveScreenshot(`${skin}-select.png`);
    });

    test('dialog', async ({ page }) => {
      await open(page, 'overlays', { skin });
      await page.getByRole('button', { name: 'Edit destination…' }).click();
      await page.getByRole('dialog').waitFor();
      await expect(page).toHaveScreenshot(`${skin}-dialog.png`);
    });

    test('alert dialog', async ({ page }) => {
      await open(page, 'overlays', { skin });
      await page.getByRole('button', { name: 'Delete backup…' }).click();
      await page.getByRole('alertdialog').waitFor();
      await expect(page).toHaveScreenshot(`${skin}-alert-dialog.png`);
    });

    // Overlays at 200 % text: they must grow with the text and still fit the window
    test('dropdown menu · text-200', async ({ page }) => {
      await open(page, 'overlays', { skin, textScale: '2' });
      await page.getByRole('button', { name: 'Actions' }).click();
      await page.getByRole('menuitem', { name: 'Settings…' }).waitFor();
      await expect(page).toHaveScreenshot(`${skin}-menu-text-200.png`);
    });

    test('dialog · text-200', async ({ page }) => {
      await open(page, 'overlays', { skin, textScale: '2' });
      await page.getByRole('button', { name: 'Edit destination…' }).click();
      await page.getByRole('dialog').waitFor();
      await expect(page).toHaveScreenshot(`${skin}-dialog-text-200.png`);
    });

    test('tooltip', async ({ page }) => {
      await open(page, 'overlays', { skin });
      await page.getByRole('button', { name: 'Hover for a tooltip' }).hover();
      await page.locator('[class*="tooltip-content-transform-origin"]').waitFor();
      await expect(page).toHaveScreenshot(`${skin}-tooltip.png`);
    });
  });
}
