import { chromium } from 'playwright';
console.log('launching');
const browser = await chromium.launch();
console.log('launched');
const page = await browser.newPage();
await page.setContent('<h1>ok</h1>');
console.log(await page.title());
await browser.close();
