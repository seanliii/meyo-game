import { mkdirSync } from 'node:fs';
import puppeteer from 'puppeteer-core';

const CHROME =
  process.env.CHROME ??
  '/docker/opt/customdata/meyo-runtime/p75097875-9ea2bb05cf60f71e/runtime/browser/chrome-linux64/chrome';
const URL = process.env.URL ?? 'http://127.0.0.1:8807';
const OUT =
  '/docker/opt/customdata/meyo-legion/verification/portable-services-replay/data/outputs/game_c9c9a9c87217_existing/mainline_compare/evidence/hero_breakthrough_real';

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

await page.evaluate(() => {
  const buttons = [...document.querySelectorAll('button.menu-champ')];
  const korrath = buttons.find((b) => b.textContent?.includes('Korrath'));
  if (korrath) korrath.click();
});
await sleep(700);

await page.evaluate(() => {
  const l = [...document.querySelectorAll('button')].find(
    (b) => /^Lock in$/.test(b.textContent) && !b.disabled,
  );
  if (l) l.click();
});

// Wait 12s for match to fully load
await sleep(12000);
await page.screenshot({ path: `${OUT}/v3b_spawn.png` });
console.log('spawn saved');

// Press Alt to spend skill
await page.keyboard.down('Alt');
await sleep(50);
await page.keyboard.press('q');
await sleep(50);
await page.keyboard.up('Alt');
await sleep(500);
await page.screenshot({ path: `${OUT}/v3b_skillq.png` });

// Move right and screenshot
await page.mouse.click(900, 360, { button: 'right' });
await sleep(3000);
await page.screenshot({ path: `${OUT}/v3b_moved.png` });

// Wide zoom
for (let i = 0; i < 12; i++) {
  await page.mouse.wheel({ deltaY: 100 });
  await sleep(50);
}
await sleep(2000);
await page.screenshot({ path: `${OUT}/v3b_wide.png` });

await browser.close();
console.log('done');
