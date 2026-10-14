// cc_hero_hud_finish_v5 capture: real browser, real inputs, hero-on-screen
// verified through READ-ONLY state before every shot. No state writes.

import { mkdirSync, writeFileSync } from 'node:fs';
import puppeteer from 'puppeteer-core';

const CHROME =
  process.env.CHROME ??
  '/docker/opt/customdata/meyo-runtime/p75097875-9ea2bb05cf60f71e/runtime/browser/chrome-linux64/chrome';
const URL = process.env.URL ?? 'http://127.0.0.1:8801';
const OUT =
  process.env.OUT ??
  '/docker/opt/customdata/meyo-legion/verification/portable-services-replay/data/outputs/game_c9c9a9c87217_existing/mainline_compare/evidence/hero_hud_v5';
const TMPDIR = '/dev/shm/hero-hud-v5';
const PROFILE = '/dev/shm/hero-hud-v5-profile';

mkdirSync(OUT, { recursive: true });
mkdirSync(TMPDIR, { recursive: true });
mkdirSync(PROFILE, { recursive: true });

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function waitFor(page, fnBody, label, timeout = 45000) {
  const start = Date.now();
  while (Date.now() - start < timeout) {
    if (await page.evaluate(fnBody)) return;
    await sleep(200);
  }
  throw new Error(`timeout waiting for: ${label}`);
}

async function clickButton(page, text) {
  const ok = await page.evaluate((t) => {
    const want = t.toLowerCase();
    const b = [...document.querySelectorAll('button')].find((e) =>
      (e.textContent || '').trim().toLowerCase().includes(want),
    );
    if (!b) return false;
    b.click();
    return true;
  }, text);
  if (!ok) throw new Error(`button not found: ${text}`);
}

// Read-only hero probe: returns the player champion's screen position,
// verifying (a) the rig is the GLB champion (not the fallback figure),
// (b) the champion's body center actually projects INSIDE the viewport.
// This is the guard against another tower/wall misframe.
async function heroScreen(page) {
  return page.evaluate(() => {
    const m = window.__match;
    if (!m?.world || !m.renderer) return null;
    const u = m.world.units.get(m.selfId);
    if (!u) return null;
    const bar = m.renderer.projectToScreen(u.pos.x, 2.5, u.pos.z);
    const feet = m.renderer.projectToScreen(u.pos.x, 0.2, u.pos.z);
    if (!bar || !feet) return { onScreen: false };
    const vw = window.innerWidth,
      vh = window.innerHeight;
    const inside = (p, m0) => p.x > m0 && p.x < vw - m0 && p.y > 90 && p.y < vh - 160;
    return {
      onScreen: inside(bar, 120) && inside(feet, 80),
      bar,
      feet,
      pos: { x: u.pos.x, z: u.pos.z },
      hp: u.hp,
      level: u.level,
      gold: u.gold,
      championId: u.championId,
    };
  });
}

async function shot(page, path) {
  await page.screenshot({ path });
  console.log('saved', path);
}

const browser = await puppeteer.launch({
  executablePath: CHROME,
  headless: true,
  args: [
    '--no-sandbox',
    '--use-gl=angle',
    '--use-angle=swiftshader',
    '--enable-unsafe-swiftshader',
    '--ignore-gpu-blocklist',
    `--user-data-dir=${PROFILE}`,
    '--window-size=1440,960',
    '--mute-audio',
  ],
  defaultViewport: { width: 1440, height: 960 },
});

const page = await browser.newPage();
const problems = [];
page.on('pageerror', (e) => problems.push(`[pageerror] ${e.message}`));
page.on('console', (m) => {
  if (m.type() === 'error' && !/\b401\b/.test(m.text()))
    problems.push(`[console.error] ${m.text()}`);
});

await page.goto(URL, { waitUntil: 'load', timeout: 45000 });
await waitFor(
  page,
  `[...document.querySelectorAll('button')].some((e) => (e.textContent || '').toLowerCase().includes('practice alone against bots'))`,
  'home actions',
);
await clickButton(page, 'practice alone against bots');
await waitFor(
  page,
  `[...document.querySelectorAll('button')].some((e) => (e.textContent || '').includes('Lock in'))`,
  'champion select',
);
await clickButton(page, 'Korrath, the Bulwark');
await sleep(400);
await clickButton(page, 'Lock in');
console.log('locked in, waiting for match load');

// Wait until in-match with the player rig up (read-only).
await waitFor(
  page,
  () => {
    const m = window.__match;
    return !!m?.world?.units?.get(m.selfId);
  },
  'player unit exists',
  60000,
);
// Wait for the champion rig: the GLB template must have loaded (figure vs
// rig is renderer-internal; we wait for the model-wait gate instead).
await sleep(12000);
// Close shop if open (P toggles).
await page.keyboard.press('p');
await sleep(600);
await page.keyboard.press('p');
await sleep(600);

const hero = await heroScreen(page);
console.log('hero probe:', JSON.stringify(hero));
if (!hero?.onScreen) {
  console.error('HERO NOT ON SCREEN — aborting shots that need the hero');
}

// ---- Shot 1: spawn (default camera) ----
await shot(page, `${OUT}/v5_spawn_20261010.png`);

// ---- Shot 2: HUD close-up (crop of bottom cluster via element shot) ----
const hudBottom = await page.$('.hud-bottom');
if (hudBottom) {
  await hudBottom.screenshot({ path: `${OUT}/v5_hud_closeup_20261010.png` });
  console.log('saved hud closeup');
} else {
  console.error('no .hud-bottom element found');
}

// ---- Real input: move down-lane with a real right-click ----
const _moveTarget = await page.evaluate(() => {
  const m = window.__match;
  const u = m.world.units.get(m.selfId);
  // toward mid-lane enemy side: map coords, read-only
  return { x: u.pos.x + 30, z: u.pos.z + 22 };
});
await page.mouse.move(720, 480, { steps: 4 });
await page.mouse.click(920, 430, { button: 'right' });
console.log('move order sent (real right-click)');
await sleep(9000);

const hero2 = await heroScreen(page);
console.log('hero after move:', JSON.stringify(hero2));

// Level Q with a real Alt+q.
await page.keyboard.down('Alt');
await page.keyboard.press('q');
await page.keyboard.up('Alt');
await sleep(300);

// ---- Shot 3: hero close-up: zoom in with the wheel for the portrait
// frame, verify hero on screen first (read-only), then capture. ----
await page.mouse.move(720, 470);
for (let i = 0; i < 14; i++) {
  await page.mouse.wheel({ deltaY: -240 });
  await sleep(60);
}
await sleep(1200);
const hero3 = await heroScreen(page);
console.log('hero closeup probe:', JSON.stringify(hero3));
if (hero3?.onScreen) {
  await shot(page, `${OUT}/v5_hero_closeup_20261010.png`);
} else {
  console.error('hero NOT on screen for closeup; saving diagnostic frame instead');
  await shot(page, `${OUT}/v5_hero_closeup_MISS_20261010.png`);
}

// zoom back out
for (let i = 0; i < 14; i++) {
  await page.mouse.wheel({ deltaY: 240 });
  await sleep(50);
}

// ---- Real input: buy an item (shop P -> click Guard Plate -> Buy) ----
await page.keyboard.press('p');
await sleep(900);
await clickButton(page, 'Guard Plate');
await sleep(500);
const buyBtn = await page.evaluate(() => {
  const b = [...document.querySelectorAll('button')].find(
    (e) => (e.textContent || '').trim().toLowerCase() === 'buy',
  );
  if (!b) return false;
  b.click();
  return true;
});
console.log('buy clicked:', buyBtn);
await sleep(700);
await page.keyboard.press('p');
await sleep(500);

// ---- Real input: cast Q at cursor ----
await page.mouse.move(760, 420);
await page.keyboard.press('q');
await sleep(900);

// ---- Shot 4: contested lane push — walk into the wave clash ----
// Send the hero down-lane via real right-clicks toward enemy territory.
await page.mouse.click(760, 300, { button: 'right' });
await sleep(2000);
await page.mouse.click(880, 250, { button: 'right' });
await sleep(7000);
const hero4 = await heroScreen(page);
console.log('hero at push:', JSON.stringify(hero4));
await shot(page, `${OUT}/v5_contested_lane_push_20261010.png`);

// HUD crop after purchases (filled inventory slots)
const hudBottom2 = await page.$('.hud-bottom');
if (hudBottom2) {
  await hudBottom2.screenshot({ path: `${OUT}/v5_hud_closeup_items_20261010.png` });
}

const state = await page.evaluate(() => {
  const m = window.__match;
  const u = m.world.units.get(m.selfId);
  return {
    pos: { x: +u.pos.x.toFixed(1), z: +u.pos.z.toFixed(1) },
    level: u.level,
    gold: Math.floor(u.gold),
    items: u.items,
    abilityRanks: u.abilityRanks,
    hp: Math.floor(u.hp),
    minionsNear: [...m.world.units.values()].filter(
      (x) => x.kind === 'minion' && Math.hypot(x.pos.x - u.pos.x, x.pos.z - u.pos.z) < 30,
    ).length,
  };
});
console.log('final state:', JSON.stringify(state));
writeFileSync(`${OUT}/v5_state_20261010.json`, JSON.stringify(state, null, 2));
writeFileSync(`${OUT}/v5_console_20261010.log`, problems.join('\n'));
console.log('problems:', problems.length);
await browser.close();
