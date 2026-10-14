import { mkdirSync } from 'node:fs';
import { writeFile } from 'node:fs/promises';
import puppeteer from 'puppeteer-core';

const CHROME =
  process.env.CHROME ??
  '/docker/opt/customdata/meyo-runtime/p75097875-9ea2bb05cf60f71e/runtime/browser/chrome-linux64/chrome';
const URL = process.env.URL ?? 'http://127.0.0.1:8802';
const CHAMPION = process.env.CHAMPION ?? 'Korrath, the Bulwark';
const OUT =
  process.env.OUT ??
  '/docker/opt/customdata/meyo-legion/verification/portable-services-replay/data/outputs/game_c9c9a9c87217_existing/runtime_observations/champion_spawn_capture';
const TMPDIR = process.env.TMPDIR ?? '/dev/shm/col-c9-spawn';
const USER_DATA_DIR = process.env.USER_DATA_DIR ?? '/dev/shm/col-c9-spawn-profile';

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
  if (!dataUrl?.startsWith('data:image/png;base64,')) {
    throw new Error(`canvas capture failed: ${path}`);
  }
  await writeFile(path, Buffer.from(dataUrl.slice('data:image/png;base64,'.length), 'base64'));
}

async function rightClickCanvas(page, x, y) {
  await page.mouse.move(x, y);
  await page.mouse.click(x, y, { button: 'right' });
}

const slug = CHAMPION.toLowerCase()
  .replace(/[^a-z0-9]+/g, '_')
  .replace(/^_|_$/g, '');

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
await clickChampion(page, CHAMPION);
await sleep(300);
await clickButton(page, 'Lock in');
await sleep(25000);
await page.keyboard.press('p').catch(() => {});
await sleep(350);
await captureCanvas(page, `${OUT}/${slug}_spawn.png`);
await rightClickCanvas(page, 930, 360);
await sleep(2500);
await captureCanvas(page, `${OUT}/${slug}_move.png`);
await browser.close();

console.log(JSON.stringify({ champion: CHAMPION, slug, out: OUT }, null, 2));
