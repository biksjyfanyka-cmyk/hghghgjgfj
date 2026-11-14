import { chromium } from 'playwright';
const browser = await chromium.launch();
const errors = [];
const page = await browser.newPage({ viewport: { width: 1440, height: 980 } });
page.on('pageerror', e => errors.push('PAGEERROR: ' + e.message));
page.on('console', m => { if (m.type() === 'error') errors.push(m.text()); });
await page.goto('http://localhost:4173/', { waitUntil: 'networkidle' });
await page.waitForTimeout(800);
await page.screenshot({ path: 'public/_qa/desktop-home2.png' });
// start game, walk forward
await page.click('text=Войти в школу');
await page.waitForTimeout(1200);
await page.screenshot({ path: 'public/_qa/game-spawn.png' });
await page.keyboard.down('KeyW');
await page.waitForTimeout(2400);
await page.keyboard.up('KeyW');
await page.waitForTimeout(250);
await page.screenshot({ path: 'public/_qa/game-walk.png' });
// drag to look
await page.mouse.move(700, 450);
await page.mouse.down();
await page.mouse.move(460, 450, { steps: 10 });
await page.mouse.up();
await page.waitForTimeout(400);
await page.screenshot({ path: 'public/_qa/game-look.png' });
// open notebook if near: attempt toward algebra? check interact prompt via state
await page.keyboard.press('KeyE');
await page.waitForTimeout(500);
await page.screenshot({ path: 'public/_qa/game-interact.png' });
console.log('errors', errors);
await browser.close();
