import { chromium } from 'playwright-core';
import fs from 'node:fs';
const [out] = process.argv.slice(2);
const OS = [['win','Windows 11','light'],['w10','Windows 10','dark'],['mac','macOS 26','light'],['macc','macOS 13–15','dark'],['gtk','GNOME · GTK 4','light'],['qt','KDE · Qt 6','dark'],['cros','ChromeOS · M3','light']];
const SW = 1294, SH = 641;            // stage size (CSS px)
const X0 = 127 - 28, X1 = 1167 + 28, Y0 = 38 - 22, Y1 = 598 + 22;
const W = X1 - X0, H = Y1 - Y0, N = OS.length, sw = W / N;
const slices = OS.map(([id, name, mode], i) => {
  const left = i * sw;
  return `<div class="s" style="left:${left}px;width:${sw + (i < N - 1 ? 0.5 : 0)}px;background-image:url('file://${out}/raw/harbor-${id}-${mode}.png');background-size:${SW}px ${SH}px;background-position:${-(X0 + left)}px ${-Y0}px"></div>
  <div class="lab ${mode}" style="left:${left}px;width:${sw}px"><b>${name}</b><span>${mode}</span></div>`;
}).join('');
const seams = OS.slice(1).map((_, i) => `<div class="seam" style="left:${(i + 1) * sw}px"></div>`).join('');
const html = `<!doctype html><html><head><meta charset="utf-8"><style>
body{margin:0;background:transparent;font-family:Inter,-apple-system,system-ui,sans-serif}
.wrap{position:relative;width:${W}px;height:${H + 46}px;border-radius:14px;overflow:hidden;background:#111}
.s{position:absolute;top:0;height:${H}px;background-repeat:no-repeat}
.seam{position:absolute;top:0;height:${H}px;width:1px;margin-left:-.5px;background:rgba(255,255,255,.55);box-shadow:0 0 0 .5px rgba(0,0,0,.25)}
.lab{position:absolute;top:${H}px;height:46px;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:1px;font-size:11.5px;line-height:1.2;box-sizing:border-box;border-left:1px solid rgba(255,255,255,.06)}
.lab b{font-weight:600}.lab span{font-size:10px;text-transform:uppercase;letter-spacing:.06em;opacity:.7}
.lab.light{background:#f4f4f5;color:#18181b}.lab.dark{background:#18181b;color:#fafafa}
</style></head><body><div class="wrap">${slices}${seams}</div></body></html>`;
fs.writeFileSync(out + '/raw/hero.html', html);
const b = await chromium.launch({ channel: 'chrome', args: ['--allow-file-access-from-files'] });
const p = await b.newPage({ viewport: { width: W, height: H + 46 }, deviceScaleFactor: 2 });
await p.goto('file://' + out + '/raw/hero.html'); await p.waitForTimeout(800);
await p.locator('.wrap').screenshot({ path: out + '/hero-one-app-seven-skins.png', omitBackground: true });
await b.close(); console.log('ok', W, H);
