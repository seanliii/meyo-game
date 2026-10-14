import { mkdirSync, writeFileSync } from 'node:fs';
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

await page.setViewport({ width: 1280, height: 720 });
await page.goto(URL, { waitUntil: 'domcontentloaded', timeout: 30000 });
await sleep(5000);
await page.screenshot({ path: `${OUT}/v3_home.png` });

await page.evaluate(() => {
  const b = [...document.querySelectorAll('button')].find((b) => /practice/i.test(b.textContent));
  if (b) b.click();
});
await sleep(3500);
await page.screenshot({ path: `${OUT}/v3_select.png` });

await page.evaluate(() => {
  const buttons = [...document.querySelectorAll('button.menu-champ')];
  const korrath = buttons.find((b) => b.textContent?.includes('Korrath'));
  if (korrath) korrath.click();
});
await sleep(500);

await page.screenshot({ path: `${OUT}/v3_select_filled.png` });

await page.evaluate(() => {
  const l = [...document.querySelectorAll('button')].find(
    (b) => /^Lock in$/.test(b.textContent) && !b.disabled,
  );
  if (l) l.click();
});
await sleep(8000);
await page.screenshot({ path: `${OUT}/v3_ingame_spawn.png` });

// Spend skill point on Q
await page.keyboard.press('Alt');
await sleep(500);
await page.screenshot({ path: `${OUT}/v3_ingame_skillq.png` });

// Move
await page.mouse.click(800, 360, { button: 'right' });
await sleep(2500);
await page.screenshot({ path: `${OUT}/v3_ingame_moved.png` });

// Cast Q ability
await page.mouse.click(800, 200, { button: 'right' });
await sleep(300);
await page.keyboard.press('q');
await sleep(1500);
await page.screenshot({ path: `${OUT}/v3_ingame_q.png` });

// Wide zoom test
for (let i = 0; i < 12; i++) {
  await page.mouse.wheel({ deltaY: 100 });
  await sleep(50);
}
await sleep(2000);
await page.screenshot({ path: `${OUT}/v3_ingame_wide.png` });

await browser.close();
writeFileSync(`${OUT}/console_v3.log`, consoleLog.join('\n'));
console.log('done');
