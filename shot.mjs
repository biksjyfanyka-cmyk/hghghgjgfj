import { chromium } from 'playwright';
const browser = await chromium.launch();
const pages = [
  { name: 'desktop', width: 1440, height: 980 },
  { name: 'mobile', width: 390, height: 844 },
];
const errors = [];
for (const p of pages) {
  const page = await browser.newPage({ viewport: { width: p.width, height: p.height }, deviceScaleFactor: 1 });
  page.on('console', m => { if (m.type() === 'error') errors.push(p.name + ': ' + m.text()); });
  page.on('pageerror', e => errors.push(p.name + ' PAGEERROR: ' + e.message));
  await page.goto('http://localhost:4173/', { waitUntil: 'networkidle' });
  await page.waitForTimeout(1200);
  await page.screenshot({ path: `/tmp/${p.name}-home.png` });
  await page.screenshot({ path: `/tmp/${p.name}-home-full.png`, fullPage: true });
  await page.click('text=Войти в школу');
  await page.waitForTimeout(2500);
  await page.screenshot({ path: `/tmp/${p.name}-game.png` });
  await page.close();
}
console.log('ERRORS', errors);
await browser.close();
