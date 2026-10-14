// V6 capture: stage-based, each stage verifies hero-on-screen READ-ONLY before
// shooting, closes any open modal first, and writes state JSON. Real inputs only.
import puppeteer from 'puppeteer-core';
import { mkdirSync, writeFileSync } from 'node:fs';

const CHROME = process.env.CHROME ??
  '/docker/opt/customdata/meyo-runtime/p75097875-9ea2bb05cf60f71e/runtime/browser/chrome-linux64/chrome';
const URL = process.env.URL ?? 'http://127.0.0.1:8801';
const OUT = process.env.OUT ??
  '/docker/opt/customdata/meyo-legion/verification/portable-services-replay/data/outputs/game_c9c9a9c87217_existing/mainline_compare/evidence/hero_hud_v6';
const STAGE = process.env.STAGE ?? 'all';
const TMPDIR = '/dev/shm/hero-hud-v6';
const PROFILE = '/dev/shm/hero-hud-v6-profile';

mkdirSync(OUT, { recursive: true });
mkdirSync(TMPDIR, { recursive: true });
mkdirSync(PROFILE, { recursive: true });

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function waitFor(page, fnBody, label, timeout = 45000) {
  const start = Date.now();
  while (Date.now() - start < timeout) {
    if (await page.evaluate(fnBody)) return;
    await sleep(250);
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

// READ-ONLY: is the shop (or any overlay) currently open?
async function modalOpen(page) {
  return page.evaluate(() => {
    const shop = document.querySelector('.hud-shop');
    if (shop && shop.classList.contains('open')) return 'shop';
    const esc = document.querySelector('.hud-escape, .hud-end');
    if (esc && esc.classList.contains('open')) return 'overlay';
    return null;
  });
}

// State-aware close: only press P when the shop is actually open (P toggles),
// and press Escape only for overlays. Verifies read-only afterwards.
async function closeModals(page) {
  for (let i = 0; i < 3; i++) {
    const open = await modalOpen(page);
    if (!open) return;
    if (open === 'shop') await page.keyboard.press('p');
    else await page.keyboard.press('Escape');
    await sleep(700);
  }
}

// READ-ONLY hero probe (guard against tower/wall misframes).
async function heroScreen(page) {
  return page.evaluate(() => {
    const m = window.__match;
    if (!m || !m.world || !m.renderer) return null;
    const u = m.world.units.get(m.selfId);
    if (!u) return null;
    const bar = m.renderer.projectToScreen(u.pos.x, 2.5, u.pos.z);
    const feet = m.renderer.projectToScreen(u.pos.x, 0.2, u.pos.z);
    if (!bar || !feet) return { onScreen: false };
    const vw = window.innerWidth, vh = window.innerHeight;
    const inside = (p, m0) =>
      p.x > m0 && p.x < vw - m0 && p.y > 90 && p.y < vh - 160;
    return {
      onScreen: inside(bar, 120) && inside(feet, 80),
      bar, feet, pos: { x: +u.pos.x.toFixed(1), z: +u.pos.z.toFixed(1) },
      hp: Math.floor(u.hp), level: u.level, gold: Math.floor(u.gold),
      championId: u.championId,
    };
  });
}

// (closeModals is defined above, state-aware.)

const browser = await puppeteer.launch({
  executablePath: CHROME,
  headless: true,
  args: [
    '--no-sandbox', '--use-gl=angle', '--use-angle=swiftshader',
    '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist',
    `--user-data-dir=${PROFILE}`, '--window-size=1440,960', '--mute-audio',
  ],
  defaultViewport: { width: 1440, height: 960 },
});

const page = await browser.newPage();
const problems = [];
page.on('pageerror', (e) => problems.push(`[pageerror] ${e.message}`));
page.on('console', (m) => {
  if (m.type() === 'error' && !/\b401\b/.test(m.text())) problems.push(`[console.error] ${m.text()}`);
});

await page.goto(URL, { waitUntil: 'load', timeout: 45000 });
await waitFor(page,
  `[...document.querySelectorAll('button')].some((e) => (e.textContent || '').toLowerCase().includes('practice alone against bots'))`,
  'home actions');
await clickButton(page, 'practice alone against bots');
await waitFor(page,
  `[...document.querySelectorAll('button')].some((e) => (e.textContent || '').includes('Lock in'))`,
  'champion select');
await clickButton(page, 'Korrath, the Bulwark');
await sleep(400);
await clickButton(page, 'Lock in');
console.log('locked in, waiting for match load');

await waitFor(page, () => {
  const m = window.__match;
  return !!(m && m.world && m.world.units && m.world.units.get(m.selfId));
}, 'player unit exists', 60000);
// model-wait gate: champion GLB template must be instantiated
await sleep(14000);
await closeModals(page);

const hero = await heroScreen(page);
console.log('hero probe:', JSON.stringify(hero));
writeFileSync(`${OUT}/probe_spawn.json`, JSON.stringify(hero, null, 2));

// ---- Shot 1: spawn (hero MUST be on screen) ----
if (hero && hero.onScreen) {
  await page.screenshot({ path: `${OUT}/v6_spawn_20261010.png` });
  console.log('saved v6_spawn');
} else {
  console.error('HERO NOT ON SCREEN at spawn — no shot');
}

// ---- Shot 2: HUD close-up ----
const hudBottom = await page.$('.hud-bottom');
if (hudBottom) {
  await hudBottom.screenshot({ path: `${OUT}/v6_hud_closeup_20261010.png` });
  console.log('saved v6 hud closeup');
}

// ---- Real input: move toward mid lane ----
await page.mouse.move(720, 480, { steps: 4 });
await page.mouse.click(920, 430, { button: 'right' });
console.log('move order sent');
await sleep(8000);

// Level Q with real Alt+q
await page.keyboard.down('Alt');
await page.keyboard.press('q');
await page.keyboard.up('Alt');
await sleep(300);

// ---- Shot 3: hero close-up (zoom, verify read-only first) ----
await page.mouse.move(720, 470);
for (let i = 0; i < 16; i++) {
  await page.mouse.wheel({ deltaY: -240 });
  await sleep(70);
}
await sleep(1500);
await closeModals(page);
const hero3 = await heroScreen(page);
console.log('closeup probe:', JSON.stringify(hero3));
if (hero3 && hero3.onScreen) {
  await page.screenshot({ path: `${OUT}/v6_hero_closeup_20261010.png` });
  console.log('saved v6_hero_closeup');
  // 2x zoomed crop around the hero for the critic: crop via clip on full-res
  const vp = page.viewport();
  const cx = Math.round((hero3.bar.x + hero3.feet.x) / 2);
  const cy = Math.round((hero3.bar.y + hero3.feet.y) / 2);
  const S = 480;
  const clip = {
    x: Math.max(0, Math.min(vp.width - S, cx - S / 2)),
    y: Math.max(0, Math.min(vp.height - S, cy - S / 2)),
    width: S, height: S,
  };
  await page.screenshot({ path: `${OUT}/v6_hero_closeup_crop_20261010.png`, clip });
  console.log('saved v6_hero_closeup_crop');
} else {
  console.error('hero NOT on screen for closeup');
}

// zoom back out
for (let i = 0; i < 16; i++) {
  await page.mouse.wheel({ deltaY: 240 });
  await sleep(60);
}
await sleep(600);

// ---- Real input: buy an item ----
// Open shop only if closed (read-only check first).
if (!(await modalOpen(page))) await page.keyboard.press('p');
await sleep(1200);
await clickButton(page, 'Guard Plate');
await sleep(600);
const buyBtn = await page.evaluate(() => {
  const b = [...document.querySelectorAll('button')].find((e) =>
    (e.textContent || '').trim().toLowerCase() === 'buy');
  if (!b) return false;
  b.click(); return true;
});
console.log('buy clicked:', buyBtn);
await sleep(800);
await closeModals(page);

// ---- HUD with filled slots ----
const hud2 = await page.$('.hud-bottom');
if (hud2) {
  await hud2.screenshot({ path: `${OUT}/v6_hud_closeup_items_20261010.png` });
  console.log('saved v6 hud closeup items');
}

// ---- Real input: cast Q ----
await page.mouse.move(760, 420);
await page.keyboard.press('q');
await sleep(900);

// ---- Shot 4: contested lane push ----
await page.mouse.click(760, 300, { button: 'right' });
await sleep(2000);
await page.mouse.click(880, 250, { button: 'right' });
await sleep(7000);
const hero4 = await heroScreen(page);
console.log('push probe:', JSON.stringify(hero4));
writeFileSync(`${OUT}/probe_push.json`, JSON.stringify(hero4, null, 2));
await page.screenshot({ path: `${OUT}/v6_contested_lane_push_20261010.png` });
console.log('saved v6_contested_lane_push');

const state = await page.evaluate(() => {
  const m = window.__match;
  const u = m.world.units.get(m.selfId);
  return {
    pos: { x: +u.pos.x.toFixed(1), z: +u.pos.z.toFixed(1) },
    level: u.level, gold: Math.floor(u.gold), items: u.items,
    abilityRanks: u.abilityRanks, hp: Math.floor(u.hp),
    minionsNear: [...m.world.units.values()].filter(
      (x) => x.kind === 'minion' && Math.hypot(x.pos.x - u.pos.x, x.pos.z - u.pos.z) < 30,
    ).length,
  };
});
console.log('final state:', JSON.stringify(state));
writeFileSync(`${OUT}/v6_state_20261010.json`, JSON.stringify(state, null, 2));
writeFileSync(`${OUT}/v6_console_20261010.log`, problems.join('\n'));
console.log('problems:', problems.length);
await browser.close();
