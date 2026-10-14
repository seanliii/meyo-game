import puppeteer from 'puppeteer-core';
const CHROME = '/docker/opt/customdata/meyo-runtime/p75097875-9ea2bb05cf60f71e/runtime/browser/chrome-linux64/chrome';
const URL = 'http://127.0.0.1:8807';
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const browser = await puppeteer.launch({
  executablePath: CHROME,
  args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage'],
});
const page = await browser.newPage();
const consoleLog = [];
page.on('console', m => consoleLog.push(`[${m.type()}] ${m.text()}`));
page.on('pageerror', e => consoleLog.push(`[pageerror] ${e.message}`));

await page.setViewport({ width: 1280, height: 720 });
await page.goto(URL, { waitUntil: 'domcontentloaded', timeout: 30000 });
await sleep(5000);

await page.evaluate(() => {
  const b = [...document.querySelectorAll('button')].find(b => /practice/i.test(b.textContent));
  if (b) b.click();
});
await sleep(4000);

await page.evaluate(() => {
  const buttons = [...document.querySelectorAll('button.menu-champ')];
  const korrath = buttons.find(b => b.textContent && b.textContent.includes('Korrath'));
  if (korrath) korrath.click();
});
await sleep(700);

await page.evaluate(() => {
  const l = [...document.querySelectorAll('button')].find(b => /^Lock in$/.test(b.textContent) && !b.disabled);
  if (l) l.click();
});

await sleep(12000);
await page.screenshot({ path: 'mainline_compare/evidence/hero_breakthrough_real/debug_v3.png' });
console.log('console log:');
console.log(consoleLog.join('\n'));
await browser.close();
