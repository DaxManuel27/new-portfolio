import assert from 'node:assert/strict';
import { mkdir, readFile } from 'node:fs/promises';
import os from 'node:os';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import sharp from 'sharp';

// Run against the development preview after changing the opening pose or lighting.
// The transparent 3:2 render uses the same contain-fit rule as the live camera.
const root = fileURLToPath(new URL('../../', import.meta.url));
const { chromium } = await import(process.env.PLAYWRIGHT_MODULE || `${os.homedir()}/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright/index.mjs`);
const intro = JSON.parse(await readFile(path.join(root, 'web/src/intro-config.json'), 'utf8'));
const browser = await chromium.launch({ channel: 'chrome', headless: true });
try {
  const page = await browser.newPage({ viewport: { width: 1440, height: 960 }, deviceScaleFactor: 1 });
  await page.goto(process.env.PREVIEW_URL || 'http://127.0.0.1:5173');
  await page.waitForFunction(() => window.__portfolio?.snapshot().ready && window.__portfolio.settled());
  await page.evaluate(() => window.__portfolio.seek(0));
  await page.waitForFunction(time => window.__portfolio.snapshot().time === time, intro.startTime);
  const snapshot = await page.evaluate(() => window.__portfolio.snapshot());
  assert.deepEqual(snapshot.visibleStations, [], 'The opening render must have no station geometry');
  await page.addStyleTag({ content: 'html, body, #stage { background: transparent !important; } #loading, #hint, #motion-toggle, #review, #skip { display: none !important; }' });
  const source = path.join(root, 'exports/web/intro-floating.png');
  await mkdir(path.dirname(source), { recursive: true });
  await page.locator('#scene').screenshot({ path: source, omitBackground: true });
  await sharp(source).webp({ lossless: true }).toFile(path.join(root, 'web/public/assets', intro.poster));
  console.log('Saved floating Intro source and lossless loading/reduced-motion poster.');
} finally {
  await browser.close();
}
