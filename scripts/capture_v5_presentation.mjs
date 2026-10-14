// scripts/capture_v5_presentation.mjs — captures both the default champion
// (Sylra) and the original problem champion (Korrath) so we can verify the
// Hero_Presentation_Pass (ground shadow disc + ambient motes + tuned rim)
// across the roster, not just one body.

import { mkdirSync } from 'node:fs';
import puppeteer from 'puppeteer-core';

const CHROME =
  process.env.CHROME ??
  '/docker/opt/customdata/meyo-runtime/p75097875-9ea2bb05cf60f71e/runtime/browser/chrome-linux64/chrome';
const URL = process.env.URL ?? 'http://127.0.0.1:8810';
const OUT =
  '/docker/opt/customdata/meyo-legion/verification/portable-services-replay/data/outputs/game_c9c9a9c87217_existing/mainline_compare/evidence/hero_presentation_v5';

mkdirSync(OUT, { recursive: true });

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const browser = await puppeteer.launch({
  executablePath: CHROME,
  args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage'],
});

const page = await browser.newPage();
const consoleLog = [];
page.on('console', (m) => consoleLog.push(`[${m.type()}] ${m.text()}`));
page.on('pageerror', (e) => consoleLog.push(`[pageerror] ${e.message}`));

await page.setViewport({ width: 1280, height: 720 });
await page.goto(URL, { waitUntil: 'domcontentloaded', timeout: 30000 });
await sleep(5000);

await page.evaluate(() => {
  const b = [...document.querySelectorAll('button')].find((b) => /practice/i.test(b.textContent));
  if (b) b.click();
});
await sleep(4000);

// 1) Default champion spawn (Sylra — the actual game default).
await page.evaluate(() => {
  const l = [...document.querySelectorAll('button')].find(
    (b) => /^Lock in$/i.test(b.textContent) && !b.disabled,
  );
  if (l) l.click();
});
await sleep(12000);
await page.screenshot({ path: `${OUT}/v5_default_spawn.png` });
console.log('default spawn saved');

await page.mouse.click(960, 360, { button: 'right' });
await sleep(2500);
await page.screenshot({ path: `${OUT}/v5_default_moved.png` });

await page.keyboard.down('Alt');
await sleep(50);
await page.keyboard.press('q');
await sleep(50);
await page.keyboard.up('Alt');
await sleep(900);
await page.screenshot({ path: `${OUT}/v5_default_skillq.png` });

for (let i = 0; i < 14; i++) {
  await page.mouse.wheel({ deltaY: 100 });
  await sleep(40);
}
await sleep(2000);
await page.screenshot({ path: `${OUT}/v5_default_wide.png` });

// 2) Now run a second pass picking Korrath.
await page.goto(URL, { waitUntil: 'domcontentloaded', timeout: 30000 });
await sleep(4000);
await page.evaluate(() => {
  const b = [...document.querySelectorAll('button')].find((b) => /practice/i.test(b.textContent));
  if (b) b.click();
});
await sleep(3500);
await page.evaluate(() => {
  const buttons = [...document.querySelectorAll('button.menu-champ')];
  const korrath = buttons.find((b) => b.textContent?.includes('Korrath'));
  if (korrath) korrath.click();
});
await sleep(800);
await page.evaluate(() => {
  const l = [...document.querySelectorAll('button')].find(
    (b) => /^Lock in$/i.test(b.textContent) && !b.disabled,
  );
  if (l) l.click();
});
await sleep(11000);
await page.screenshot({ path: `${OUT}/v5_korrath_spawn.png` });
console.log('korrath spawn saved');

await page.mouse.click(900, 360, { button: 'right' });
await sleep(2200);
await page.screenshot({ path: `${OUT}/v5_korrath_moved.png` });

await browser.close();
console.log('done');
