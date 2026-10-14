import puppeteer from 'puppeteer-core';
import { mkdirSync, writeFileSync } from 'node:fs';

const CHROME = process.env.CHROME ??
  '/docker/opt/customdata/meyo-runtime/p75097875-9ea2bb05cf60f71e/runtime/browser/chrome-linux64/chrome';
const URL = process.env.URL ?? 'http://127.0.0.1:8806';
const OUT = '/docker/opt/customdata/meyo-legion/verification/portable-services-replay/data/outputs/game_c9c9a9c87217_existing/mainline_compare/evidence/hero_breakthrough_real';

mkdirSync(OUT, { recursive: true });

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const browser = await puppeteer.launch({
  executablePath: CHROME,
  args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage'],
});

const page = await browser.newPage();
const consoleLog = [];
page.on('console', m => consoleLog.push(`[${m.type()}] ${m.text()}`));

await page.setViewport({ width: 1280, height: 720 });
console.log('navigating...');
await page.goto(URL, { waitUntil: 'domcontentloaded', timeout: 30000 });
await sleep(5000);
await page.screenshot({ path: `${OUT}/v2_home.png` });
console.log('home screenshot saved');

// Click offline practice
await page.evaluate(() => {
  const b = [...document.querySelectorAll('button')].find(b => /practice/i.test(b.textContent));
  if (b) b.click();
});
await sleep(3500);
await page.screenshot({ path: `${OUT}/v2_select.png` });

// Click Korrath champion card
await page.evaluate(() => {
  const buttons = [...document.querySelectorAll('button.menu-champ')];
  const korrath = buttons.find(b => b.textContent && b.textContent.includes('Korrath'));
  if (korrath) korrath.click();
});
await sleep(500);

// Don't click sigils - they should already be riftstep+mend by default

await page.screenshot({ path: `${OUT}/v2_select_filled.png` });

// Check lock state
const lockState = await page.evaluate(() => {
  const l = [...document.querySelectorAll('button')].find(b => /^Lock in$|^Locked$/.test(b.textContent));
  const sigils = [...document.querySelectorAll('.menu-sigil.picked')].map(s => s.textContent);
  return { text: l?.textContent, disabled: l?.disabled, sigils };
});
console.log('lock state before click:', lockState);

// Lock in
await page.evaluate(() => {
  const l = [...document.querySelectorAll('button')].find(b => /^Lock in$/.test(b.textContent) && !b.disabled);
  if (l) l.click();
});
await sleep(2000);
const lockState2 = await page.evaluate(() => {
  const l = [...document.querySelectorAll('button')].find(b => /^Lock in$|^Locked$/.test(b.textContent));
  const allCanvases = document.querySelectorAll('canvas').length;
  return { text: l?.textContent, disabled: l?.disabled, canvases: allCanvases, bodyText: document.body.innerText.slice(0, 60) };
});
console.log('lock state 2s after click:', lockState2);
await sleep(8000);
await page.screenshot({ path: `${OUT}/v2_ingame_spawn.png` });
const lockState3 = await page.evaluate(() => {
  const allCanvases = document.querySelectorAll('canvas').length;
  return { canvases: allCanvases, bodyText: document.body.innerText.slice(0, 60) };
});
console.log('lock state 10s after click:', lockState3);

// Click middle of canvas to issue move order
await page.mouse.click(800, 360, { button: 'right' });
await sleep(2500);
await page.screenshot({ path: `${OUT}/v2_ingame_moved.png` });

// Press Q
await page.keyboard.press('q');
await sleep(1500);
await page.screenshot({ path: `${OUT}/v2_ingame_q.png` });

// Press W
await page.keyboard.press('w');
await sleep(1500);
await page.screenshot({ path: `${OUT}/v2_ingame_w.png` });

// Wheel out to wider zoom
for (let i = 0; i < 8; i++) {
  await page.mouse.wheel({ deltaY: 100 });
  await sleep(50);
}
await sleep(1500);
await page.screenshot({ path: `${OUT}/v2_ingame_wide.png` });

await browser.close();
writeFileSync(`${OUT}/console.log`, consoleLog.join('\n'));
console.log('done');
