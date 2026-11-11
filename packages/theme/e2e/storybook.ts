import type { Page } from '@playwright/test';

// Every skin the theme styles, as the Storybook "OS" global values.
export const SKINS = ['win', 'w10', 'mac', 'macc', 'gtk', 'qt', 'cros'] as const;

/** Opens a story (full Storybook id) with the given globals and waits until it has rendered. */
export async function openStory(page: Page, id: string, globals: Record<string, string>): Promise<void> {
  const g = Object.entries(globals)
    .map(([k, v]) => `${k}:${v}`)
    .join(';');
  await page.goto(`/iframe.html?id=${id}&viewMode=story&globals=${g}`);
  await page.locator('#storybook-root > *').first().waitFor();
  await page.evaluate(() => document.fonts.ready);
}

/** Two animation frames: lets afterNextRender / rAF measurements land. */
export async function frames(page: Page): Promise<void> {
  await page.evaluate(() => new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r))));
}
