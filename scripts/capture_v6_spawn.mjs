// scripts/capture_v6_spawn.mjs — captures the hero spawn cinematic
// (Hero_Spawn_Cinematic, 2026-10-12) at multiple time points after
// the lock-in click so we can verify the portal/column are visible
// before they fade. The existing v5 capture waits 11–12 s after
// lock-in, by which time the 1.1–1.2 s cinematic has long ended.
//
// We start the match, lock in, then snap at 250 ms (portal opening),
// 600 ms (column near peak), and 1500 ms (cinematic gone, hero in
// scene). Three frames show the full entrance arc.

import { mkdirSync } from 'node:fs';
import puppeteer from 'puppeteer-core';

const CHROME =
  process.env.CHROME ??
  '/docker/opt/customdata/meyo-runtime/p75097875-9ea2bb05cf60f71e/runtime/browser/chrome-linux64/chrome';
const URL = process.env.URL ?? 'http://127.0.0.1:8810';
const OUT =
  '/docker/opt/customdata/meyo-legion/verification/portable-services-replay/data/outputs/game_c9c9a9c87217_existing/mainline_compare/evidence/hero_presentation_v6';

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
  const l = [...document.querySelectorAll('button')].find(
    (b) => /^Lock in$/i.test(b.textContent) && !b.disabled,
  );
  if (l) l.click();
});
console.log('locked in');

// Wait until the world has loaded the roster, then snap during the
// first second of the cinematic. Total match load typically takes
// 9-10 s, so we wait that long before snapping to land right when
// the cinematic begins.
await sleep(9800);
const t0 = performance.now();
await page.screenshot({ path: `${OUT}/v6_spawn_t000.png` });
console.log(`t+${(performance.now() - t0).toFixed(0)}ms -> v6_spawn_t000`);

await sleep(350);
await page.screenshot({ path: `${OUT}/v6_spawn_t350.png` });
console.log(`+350ms -> v6_spawn_t350`);

await sleep(400);
await page.screenshot({ path: `${OUT}/v6_spawn_t750.png` });
console.log(`+750ms -> v6_spawn_t750`);

await sleep(900);
await page.screenshot({ path: `${OUT}/v6_spawn_t1650.png` });
console.log(`+1650ms -> v6_spawn_t1650`);

await sleep(2500);
await page.screenshot({ path: `${OUT}/v6_spawn_settled.png` });
console.log(`+2500ms -> settled (cinematic over)`);

await browser.close();
console.log('done');
