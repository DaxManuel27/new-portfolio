import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import os from 'node:os';
const { chromium } = await import(process.env.PLAYWRIGHT_MODULE || `${os.homedir()}/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright/index.mjs`);
const browser = await chromium.launch({ channel: 'chrome', headless: true });
const page = await browser.newPage({ viewport: { width: 1440, height: 960 } }), errors = [];
page.on('pageerror', error => errors.push(String(error)));
await fs.mkdir('test-results/desk-arrival', { recursive: true });
await page.goto((process.env.PREVIEW_URL || 'http://127.0.0.1:5173') + '/?review=1');
await page.waitForFunction(() => window.__portfolio?.snapshot().ready && window.__portfolio.settled(), {}, { timeout: 60000 });
const { phases, totalUnits } = await page.evaluate(() => window.__portfolio);
const travel = phases.find(phase => phase.station === 5 && phase.kind === 'travel');
const approach = phases.find(phase => phase.station === 5 && phase.kind === 'approach');
const exit = phases.find(phase => phase.station === 5 && phase.kind === 'exit');
async function seek(units) {
  await page.evaluate(progress => window.__portfolio.seek(progress), units / totalUnits);
  await page.waitForTimeout(100);
  await page.waitForFunction(() => window.__portfolio.settled(), {}, { timeout: 60000 });
  return page.evaluate(() => window.__portfolio.snapshot());
}
const report = [];
for (const viewport of [{ width: 1440, height: 960 }, { width: 390, height: 844 }]) {
  await page.setViewportSize(viewport);
  await page.waitForTimeout(350);
  const samples = [];
  for (const time of [18, 18.5, 19, 19.3, 19.6, 20]) {
    const state = await seek(travel.start + (travel.end - travel.start) * (time - 16) / 4);
    assert.deepEqual(state.errors, []);
    assert.ok(state.worldBounds[1][0] < 9.67, `laptop must stay left of phone at ${time}`);
    assert.equal(state.paperVisible, false);
    assert.ok(state.projectedBounds[0][0] > .03 && state.projectedBounds[1][0] < .97, `laptop horizontally cropped at ${time}`);
    assert.ok(state.projectedBounds[0][1] > .03 && state.projectedBounds[1][1] < .97, `laptop vertically cropped at ${time}`);
    if (time >= 19) assert.ok(Math.abs(state.feet[0] - 9.36) < .00001, `laptop must descend vertically at ${time}`);
    samples.push({ time, feet: state.feet, bounds: state.worldBounds, camera: state.camera });
    await page.screenshot({ path: `test-results/desk-arrival/${viewport.width}-${time}.png` });
  }
  for (const units of [approach.start, approach.start + .35, approach.end]) {
    const before = await seek(units - .00001), after = await seek(units + .00001);
    // Scroll positions are pixel-rounded, so neighboring seeks may differ by a full
    // pixel of motion. A discontinuity would be much larger than this tolerance.
    for (const key of ['feet', 'spin', 'lid', 'camera', 'cameraQuaternion']) before[key].forEach((value, i) => assert.ok(Math.abs(value - after[key][i]) < .01, `${key} jumps at ${units}: ${value} to ${after[key][i]}`));
  }
  await seek(exit.end);
  await page.screenshot({ path: `test-results/desk-arrival/${viewport.width}-landed-overview.png` });
  report.push({ viewport, samples });
}
assert.deepEqual(errors, []);
await fs.writeFile('test-results/desk-arrival/report.json', JSON.stringify(report, null, 2));
console.log(JSON.stringify({ viewports: report.map(entry => entry.viewport), samples: report.reduce((count, entry) => count + entry.samples.length, 0), errors }));
await browser.close();
