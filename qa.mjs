import { chromium } from 'playwright';
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1440, height: 980 } });
const errors = [];
page.on('pageerror', e => errors.push('PAGEERROR: ' + e.message));
page.on('console', m => { if (m.type() === 'error') errors.push(m.text()); });
await page.goto('http://localhost:4173/', { waitUntil: 'networkidle' });
await page.click('text=Войти в школу');
await page.waitForTimeout(900);

// helper teleports engine and takes the notebook
async function collect(idx) {
  const notebookPositions = [
    [6.8, 5.0], [10.9, 5.0], [21.9, 2.0], [2.0, 18.0], [18.0, 18.0],
  ];
  await page.evaluate(([i, pos]) => {
    const g = window.__schoolGame;
    g.px = pos[0]; g.py = pos[1];
    g.angle = 0.4;
  }, [idx, notebookPositions[idx]]);
  await page.waitForTimeout(450);
  await page.screenshot({ path: `public/_qa/near-book-${idx}.png` });
  await page.keyboard.press('KeyE');
  await page.waitForTimeout(450);
  await page.screenshot({ path: `public/_qa/quiz-${idx}.png` });
  for (let q = 0; q < 3; q++) {
    let solved = false;
    for (let opt = 1; opt <= 4 && !solved; opt++) {
      await page.keyboard.press(String(opt));
      await page.waitForTimeout(140);
      const ok = await page.locator('text=Верно. Продолжай').count();
      if (ok) {
        solved = true;
        await page.keyboard.press('Enter');
        await page.waitForTimeout(260);
      }
    }
    if (!solved) { console.log('FAILED to solve question', idx, q); break; }
  }
  await page.waitForTimeout(350);
  await page.screenshot({ path: `public/_qa/quiz-done-${idx}.png` });
  await page.getByRole('button', { name: /Забрать тетрадь/i }).click();
  await page.waitForTimeout(500);
}

await collect(0);
await page.screenshot({ path: 'public/_qa/after-first.png' });
await collect(1);
await collect(2);
await collect(3);
await collect(4);
await page.screenshot({ path: 'public/_qa/all-books.png' });
await page.evaluate(() => {
  const g = window.__schoolGame;
  g.px = 28.6; g.py = 8.55; g.angle = 0;
});
await page.waitForTimeout(500);
await page.screenshot({ path: 'public/_qa/at-exit.png' });
await page.keyboard.press('KeyE');
await page.waitForTimeout(700);
await page.screenshot({ path: 'public/_qa/win.png' });
console.log('errors', errors);
await browser.close();
