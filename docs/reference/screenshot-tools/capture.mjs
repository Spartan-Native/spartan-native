import { chromium } from 'playwright-core';
import fs from 'node:fs';

const [render, out] = process.argv.slice(2);
fs.mkdirSync(out + '/raw', { recursive: true });
const DPR = 2;
const browser = await chromium.launch({ channel: 'chrome' });
const HIDE = '.tag,.handle,.grip,.rng{display:none!important}';

async function open(file, width, height = 1400) {
  const p = await browser.newPage({ viewport: { width, height }, deviceScaleFactor: DPR });
  p.on('pageerror', (e) => console.log('ERR', file, e.message));
  await p.goto(`file://${render}/${file}`);
  await p.waitForTimeout(2500);
  await p.addStyleTag({ content: HIDE });
  return p;
}
async function setSplit(p, v) {
  // the slider is React-controlled; set through the native setter and fire input/change
  await p.evaluate((v) => {
    for (const el of document.querySelectorAll('input.rng')) {
      const set = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set;
      set.call(el, String(v));
      el.dispatchEvent(new Event('input', { bubbles: true }));
      el.dispatchEvent(new Event('change', { bubbles: true }));
    }
  }, v);
  await p.waitForTimeout(250);
}
const click = async (p, text) => { await p.getByRole('button', { name: text, exact: true }).first().click(); await p.waitForTimeout(400); };

// ---------- 1. Harbor Backup stage per OS, light and dark ----------
const OS = [
  ['win', 'Windows 11'], ['w10', 'Windows 10'], ['mac', 'macOS 26'], ['macc', 'macOS classic'],
  ['gtk', 'Linux · GTK 4'], ['qt', 'Linux · Qt 6 / KDE'], ['cros', 'ChromeOS'],
];
{
  const p = await open('SampleApp.dc.html', 1360);
  const meta = {};
  for (const [id, label] of OS) {
    await click(p, label);
    for (const [mode, v] of [['light', 100], ['dark', 0]]) {
      await setSplit(p, v);
      const stage = p.locator('.stage').first();
      await stage.screenshot({ path: `${out}/raw/harbor-${id}-${mode}.png` });
    }
    // window bounds inside the stage (for cropping the composite)
    meta[id] = await p.evaluate(() => {
      const st = document.querySelector('.stage').getBoundingClientRect();
      const L = document.querySelector('.stage .L');
      let x0 = 1e9, y0 = 1e9, x1 = 0, y1 = 0;
      for (const c of L.children) {
        const r = c.getBoundingClientRect();
        if (r.width < 50 || r.height < 50) continue;
        x0 = Math.min(x0, r.left); y0 = Math.min(y0, r.top); x1 = Math.max(x1, r.right); y1 = Math.max(y1, r.bottom);
      }
      return { w: st.width, h: st.height, x0: x0 - st.left, y0: y0 - st.top, x1: x1 - st.left, y1: y1 - st.top };
    });
  }
  fs.writeFileSync(`${out}/raw/harbor-meta.json`, JSON.stringify(meta, null, 1));
  // a single-OS light/dark split for the sample app README
  await click(p, 'Windows 11'); await setSplit(p, 50);
  await p.addStyleTag({ content: '.handle,.tag{display:block!important}' });
  await p.locator('.stage').first().screenshot({ path: `${out}/harbor-backup-win11-split.png` });
  await click(p, 'macOS 26');
  await p.locator('.stage').first().screenshot({ path: `${out}/harbor-backup-macos26-split.png` });
  await p.close();
}

// ---------- 2. Component comparison (Main) ----------
{
  const p = await open('Main.dc.html', 1440);
  for (const [chip, file] of [['Derived palette', 'theme-derived-palette'], ['Button', 'helm-button'], ['Data table', 'helm-data-table'], ['Context / Dropdown menu', 'helm-menu']]) {
    await click(p, chip);
    await setSplit(p, 50);
    await p.addStyleTag({ content: '.handle,.tag{display:block!important}' });
    await p.locator('.cc').first().screenshot({ path: `${out}/${file}.png` });
  }
  await p.close();
}

// ---------- 3. OS patterns ----------
{
  const p = await open('Patterns.dc.html', 1382);
  for (const [chip, file] of [['Command surface (Windows)', 'desktop-ui-command-surface'], ['Modal form (macOS)', 'desktop-ui-modal-form'], ['Settings list (GTK)', 'desktop-ui-settings-list'], ['Empty state (GTK)', 'desktop-ui-empty-state']]) {
    await click(p, chip);
    await setSplit(p, 50);
    await p.addStyleTag({ content: '.handle,.tag{display:block!important}' });
    await p.locator('.cc').first().screenshot({ path: `${out}/${file}.png` });
  }
  await p.close();
}

// ---------- 4. Project page sections ----------
{
  const p = await open('Project.dc.html', 1438, 1000);
  const sections = [
    ['Seven skins, one set of tokens.', 'project-platform-skins'],
    ['See what each layer adds', 'project-layers'],
    ['Start with plain CSS. Add only what you need.', 'project-packages'],
    ['One contract. Five adapters.', 'project-host-adapters'],
    ['Pick your shell. Keep your UI.', 'project-runtimes'],
    ['Settings users already chose, respected everywhere.', 'project-native-behaviors'],
    ['From mockups to packages.', 'project-roadmap'],
  ];
  for (const [heading, file] of sections) {
    const h = p.getByText(heading, { exact: true }).first();
    const box = await h.evaluateHandle((el) => el.closest('section') || el.parentElement.parentElement);
    await box.asElement().screenshot({ path: `${out}/${file}.png` });
  }
  // hero (first screen)
  await p.screenshot({ path: `${out}/project-hero.png`, clip: { x: 0, y: 0, width: 1438, height: 1000 } });
  await p.close();
}
await browser.close();
console.log('done');
