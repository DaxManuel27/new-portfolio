import assert from 'node:assert/strict';
import { mkdir } from 'node:fs/promises';
import os from 'node:os';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import sharp from 'sharp';

const root = fileURLToPath(new URL('../../', import.meta.url));
const { chromium } = await import(process.env.PLAYWRIGHT_MODULE || `${os.homedir()}/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright/index.mjs`);
const browser = await chromium.launch({ channel: 'chrome', headless: true });
const source = path.join(root, 'exports/shared-desk');
await mkdir(source, { recursive: true });
try {
  const page = await browser.newPage({ viewport: { width: 1440, height: 960 } });
  await page.goto(process.env.PREVIEW_URL || 'http://127.0.0.1:5173');
  const ready = () => page.waitForFunction(() => window.__portfolio?.snapshot().ready && window.__portfolio.settled());
  await ready();
  async function station(index) {
    await page.evaluate(i => window.__portfolio.station(i), index);
    await page.waitForTimeout(100); await ready();
  }
  async function capture(name, filename) {
    const style = await page.addStyleTag({ content: '#loading, #hint, #motion-toggle, #review, #skip, #print-controls, #notebook-links { visibility: hidden !important; }' });
    const file = path.join(source, filename);
    await page.locator('#stage').screenshot({ path: file });
    await style.evaluate(node => node.remove());
    await sharp(file).webp({ quality: 90 }).toFile(path.join(root, 'web/public/assets', name + '.webp'));
  }
  await station(5);
  assert.equal((await page.evaluate(() => window.__portfolio.snapshot())).paperVisible, false);
  await capture('resume', 'resume-poster.png');
  await station(6); await capture('contact', 'contact-poster.png');
  await station(5); await page.locator('#print-resume').click();
  await page.waitForFunction(() => window.__portfolio.snapshot().printStatus === 'printed', {}, { timeout: 10000 });
  assert.equal((await page.evaluate(() => window.__portfolio.snapshot())).paperVisible, true);
  await capture('resume-printed', 'resume-printed-poster.png');
  console.log('Saved empty printer, contact and printed paper posters.');
} finally {
  await browser.close();
}
