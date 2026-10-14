import puppeteer from 'puppeteer-core';
import { mkdirSync } from 'node:fs';
import { writeFile } from 'node:fs/promises';

const CHROME =
  process.env.CHROME ??
  '/docker/opt/customdata/meyo-runtime/p75097875-9ea2bb05cf60f71e/runtime/browser/chrome-linux64/chrome';
const URL = process.env.URL ?? 'http://127.0.0.1:8791';
const OUT =
  process.env.OUT ??
  '/docker/opt/customdata/meyo-legion/verification/portable-services-replay/operations/original-c9-support-f97d-20261008/work/claude_of_legends_candidate/verification';
const TMPDIR = process.env.TMPDIR ?? '/dev/shm/col-c9';
const USER_DATA_DIR = process.env.USER_DATA_DIR ?? '/dev/shm/col-c9-profile';

mkdirSync(OUT, { recursive: true });
mkdirSync(TMPDIR, { recursive: true });
mkdirSync(USER_DATA_DIR, { recursive: true });

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

async function clickChampion(page, text) {
  const ok = await page.evaluate((t) => {
    const want = t.toLowerCase();
    const b = [...document.querySelectorAll('button')].find((e) =>
      (e.textContent || '').toLowerCase().includes(want),
    );
    if (!b) return false;
    b.click();
    return true;
  }, text);
  if (!ok) throw new Error(`champion not found: ${text}`);
}

async function closeShop(page) {
  await page.keyboard.press('p');
  await sleep(400);
}

async function capture(page, path) {
  const cdp = await page.createCDPSession();
  const data = await new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error(`capture timeout: ${path}`)), 15000);
    const onFrame = async (ev) => {
      clearTimeout(timer);
      cdp.off('Page.screencastFrame', onFrame);
      await cdp.send('Page.screencastFrameAck', { sessionId: ev.sessionId }).catch(() => {});
      resolve(ev.data);
    };
    cdp.on('Page.screencastFrame', onFrame);
    void cdp
      .send('Page.startScreencast', {
        format: 'png',
        quality: 100,
        maxWidth: 1500,
        maxHeight: 900,
        everyNthFrame: 1,
      })
      .catch(reject);
  });
  await cdp.send('Page.stopScreencast').catch(() => {});
  await writeFile(path, Buffer.from(data, 'base64'));
  await cdp.detach();
}

async function captureCanvas(page, path) {
  const dataUrl = await page.evaluate(() => {
    const c = document.querySelectorAll('canvas')[0];
    if (!c) return null;
    const gl =
      c.getContext('webgl2', { preserveDrawingBuffer: true }) ||
      c.getContext('webgl', { preserveDrawingBuffer: true });
    if (gl) {
      const outW = Math.min(960, c.width);
      const outH = Math.min(540, c.height);
      const sx = Math.max(0, Math.floor((c.width - outW) / 2));
      const sy = Math.max(0, Math.floor((c.height - outH) / 2));
      const pixels = new Uint8Array(outW * outH * 4);
      gl.readPixels(sx, sy, outW, outH, gl.RGBA, gl.UNSIGNED_BYTE, pixels);
      const out = document.createElement('canvas');
      out.width = outW;
      out.height = outH;
      const ctx = out.getContext('2d');
      if (!ctx) return null;
      const image = ctx.createImageData(outW, outH);
      for (let y = 0; y < outH; y += 1) {
        for (let x = 0; x < outW; x += 1) {
          const src = ((outH - y - 1) * outW + x) * 4;
          const dst = (y * outW + x) * 4;
          image.data[dst] = pixels[src];
          image.data[dst + 1] = pixels[src + 1];
          image.data[dst + 2] = pixels[src + 2];
          image.data[dst + 3] = pixels[src + 3];
        }
      }
      ctx.putImageData(image, 0, 0);
      return out.toDataURL('image/png');
    }
    return c.toDataURL('image/png');
  });
  if (!dataUrl || !dataUrl.startsWith('data:image/png;base64,')) {
    throw new Error(`canvas capture failed: ${path}`);
  }
  await writeFile(path, Buffer.from(dataUrl.slice('data:image/png;base64,'.length), 'base64'));
}

async function rightClickCanvas(page, x, y) {
  await page.mouse.move(x, y);
  await page.mouse.click(x, y, { button: 'right' });
}

function safe(v) {
  return JSON.stringify(v, null, 2);
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
    `--user-data-dir=${USER_DATA_DIR}`,
    '--window-size=1500,900',
    '--mute-audio',
  ],
  defaultViewport: { width: 1500, height: 900 },
});

const page = await browser.newPage();
const problems = [];
page.on('pageerror', (e) => problems.push(`[pageerror] ${e.message}`));
page.on('console', (m) => {
  if (m.type() === 'error' && !/\b401\b/.test(m.text())) problems.push(`[console.error] ${m.text()}`);
});
page.on('requestfailed', (req) =>
  problems.push(`[requestfailed] ${req.url()} ${req.failure()?.errorText ?? ''}`),
);

await page.goto(URL, { waitUntil: 'load', timeout: 45000 });
console.log('home loaded');
await waitFor(
  page,
  `[...document.querySelectorAll('button')].some((e) => (e.textContent || '').toLowerCase().includes('practice alone against bots'))`,
  'home actions',
);
await clickButton(page, 'practice alone against bots');
console.log('practice clicked');
await waitFor(
  page,
  `[...document.querySelectorAll('button')].some((e) => (e.textContent || '').includes('Lock in'))`,
  'champion select',
);
await clickChampion(page, 'Korrath, the Bulwark');
console.log('korrath picked');
await sleep(500);
await capture(page, `${OUT}/korrath_select_clear.png`);
await clickButton(page, 'Lock in');
console.log('lock in clicked');
await sleep(25000);
console.log('post-lock settle complete');

await closeShop(page);
console.log('shop closed');
await captureCanvas(page, `${OUT}/korrath_spawn_clear.png`);

// Real player input: move the hero out from spawn with a ground right-click.
await rightClickCanvas(page, 930, 360);
await sleep(2500);
console.log('move input sent');
await captureCanvas(page, `${OUT}/korrath_move_clear.png`);
console.log('move screenshot saved');

// Buy one real item to confirm the shop loop, then close it again.
await page.keyboard.press('p');
await sleep(400);
await clickButton(page, 'Guard Plate');
await sleep(200);
await clickButton(page, 'Guard Plate');
await sleep(500);
console.log('guard plate buy attempted');
await closeShop(page);
console.log('shop closed after buy');

// Learn Q via the plus button, then cast it at the current cursor point.
await page.click('.hud-slot-up');
await sleep(250);
await page.mouse.move(1020, 320);
await page.keyboard.press('q');
await sleep(800);
console.log('q cast attempted');
await captureCanvas(page, `${OUT}/korrath_q_clear.png`);

console.log(
  safe({
    stage: 'complete',
    title: await page.title(),
    problems,
  }),
);

await browser.close();
