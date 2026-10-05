import { mkdir, writeFile } from 'node:fs/promises';
import os from 'node:os';
import sharp from 'sharp';
const phase = process.env.REALISM_PHASE || 'after';
const directory = `test-results/realism/${phase}`;
await mkdir(directory, { recursive: true });
const { chromium } = await import(process.env.PLAYWRIGHT_MODULE || `${os.homedir()}/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright/index.mjs`);
const browser = await chromium.launch({ channel: 'chrome', headless: true });
const report = [];
try {
  const page = await browser.newPage({ viewport: { width: 1440, height: 960 } });
  const errors = []; page.on('pageerror', e => errors.push(String(e)));
  await page.goto(`${process.env.PREVIEW_URL || 'http://127.0.0.1:5173'}/?review=1`);
  const ready = () => page.waitForFunction(() => window.__portfolio?.snapshot().ready && window.__portfolio.settled(), {}, { timeout: 60000 });
  await ready();
  await page.addStyleTag({ content: '#boot,#loading,#hint,#motion-toggle,#review,#skip,#print-controls,#notebook-links {display:none!important}' });
  for (const [layout, viewport] of [['desktop', { width: 1440, height: 960 }], ['portrait', { width: 390, height: 844 }]]) {
    await page.setViewportSize(viewport);
    for (const index of [0,1,2,3,4,5,6]) {
      await page.evaluate(i => window.__portfolio.station(i), index);
      await page.waitForTimeout(100); await ready();
      await page.waitForTimeout(300);
      const snapshot = await page.evaluate(() => window.__portfolio.snapshot());
      await page.locator('#stage').screenshot({ path: `${directory}/${layout}-${index}.png` });
      report.push({ layout, index, snapshot });
      if (phase === 'after' && layout === 'desktop' && index > 0 && index < 5) {
        const ids = ['intro','hack-atlantic','formula-sae','ultra-maritime','projects'];
        await sharp(`${directory}/${layout}-${index}.png`).webp({ quality: 90 }).toFile(`public/assets/${ids[index]}.webp`);
        await sharp(`${directory}/${layout}-${index}.png`).png().toFile(`../blender/previews/completion/${ids[index]}-wide.png`);
      }
    }
  }
  await writeFile(`${directory}/report.json`, JSON.stringify({ phase, errors, captures: report }, null, 2));
  console.log(`Captured${phase} realism baseline at both viewport sizes; errors=${errors.length}`);
} finally { await browser.close(); }
