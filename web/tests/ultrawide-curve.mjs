// Browser check for the curved ultrawide display: the painted reel frame follows the curved glass,
// and the end of the screen zoom hands over to the live DOM reel without a visible change.
// Usage: PREVIEW_URL=http://127.0.0.1:5173 node tests/ultrawide-curve.mjs
import assert from 'node:assert/strict';
import fs from 'node:fs/promises'; import os from 'node:os'; import sharp from 'sharp';
const { chromium } = await import(process.env.PLAYWRIGHT_MODULE || `${os.homedir()}/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright/index.mjs`);
const browser = await chromium.launch(process.env.PW_SWIFTSHADER ? { headless: true, args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader'] } : { channel: 'chrome', headless: true });
const url = process.env.PREVIEW_URL || 'http://127.0.0.1:5173', dir = 'test-results/ultrawide-curve';
await fs.mkdir(dir, { recursive: true });
const report = { viewports: [] };
async function pixels(buffer) { const { data, info } = await sharp(buffer).removeAlpha().raw().toBuffer({ resolveWithObject: true }); return { data, info }; }
try {
  for (const [width, height, name] of [[1440, 960, 'desktop'], [390, 844, 'phone']]) {
    const page = await browser.newPage({ viewport: { width, height } }), errors = [];
    page.on('pageerror', e => errors.push(String(e))); page.on('console', m => { if (m.type() === 'error') errors.push(m.text()); });
    await page.goto(url);
    await page.waitForFunction(() => window.__portfolio?.snapshot().ready && window.__portfolio.settled(), {}, { timeout: 120000 });
    const seek = async (kind, local) => {
      await page.evaluate(([k, l]) => { const P = window.__portfolio, p = P.phases.find(x => x.kind === k && x.station === 4); P.seek((p.start + l * (p.end - p.start)) / P.totalUnits); }, [kind, local]);
      await page.waitForTimeout(80); await page.waitForFunction(() => window.__portfolio.settled(), {}, { timeout: 120000 });
      await page.evaluate(() => new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r))));
      return page.evaluate(() => ({ s: window.__portfolio.snapshot(), reel: { hidden: document.getElementById('reel').hidden, transform: document.getElementById('reel').style.transform } }));
    };
    const entry = { name, captures: [] };
    for (const [kind, fractions] of [['approach', [.1, .5, .9]], ['hold', [.5]], ['screen-zoom', [.1, .3, .5, .7]]]) for (const f of fractions) {
      const { s, reel } = await seek(kind, f);
      assert.ok(s.reelPreview?.startsWith(`${width}x${height}|`), `${name} ${kind} ${f}: reel frame painted for this viewport (${s.reelPreview})`);
      assert.equal(reel.hidden, true, `${name} ${kind} ${f}: no DOM overlay on the glass`);
      assert.equal(reel.transform, '', `${name}: reel is never affine-projected`);
      const path = `${dir}/${name}-${kind}-${Math.round(f * 100)}.png`; await page.screenshot({ path }); entry.captures.push(path);
    }
    // Hand-off: canvas-only frame when the glass fills the window vs the DOM-only frame after the crossfade.
    await seek('screen-zoom', .8); const painted = await page.screenshot({ path: `${dir}/${name}-fill-painted.png` });
    const { reel } = await seek('reel', 0); assert.equal(reel.hidden, false);
    const live = await page.screenshot({ path: `${dir}/${name}-fill-dom.png` });
    const a = await pixels(painted), b = await pixels(live);
    let sum = 0, count = 0, large = 0;
    for (let y = 0; y < a.info.height; y++) for (let x = 0; x < a.info.width; x++) {
      if (x > a.info.width - 170 && y > a.info.height - 80) continue; // motion toggle sits above both
      for (let c = 0; c < 3; c++) { const i = (y * a.info.width + x) * 3 + c, d = Math.abs(a.data[i] - b.data[i]); sum += d; count++; if (d > 48) large++; }
    }
    entry.handoff = { meanErrorPercent: sum / count / 2.55, largeDiffPercent: large / count * 100 };
    assert.ok(entry.handoff.meanErrorPercent < 2, `${name}: hand-off mean error ${entry.handoff.meanErrorPercent}%`);
    assert.ok(entry.handoff.largeDiffPercent < 1, `${name}: hand-off large differences ${entry.handoff.largeDiffPercent}%`);
    // Reverse seeks restore the same state.
    const forward = (await seek('screen-zoom', .5)).s; await seek('hold', .5); const back = (await seek('screen-zoom', .5)).s;
    assert.deepEqual(back.camera, forward.camera, `${name}: reverse seek camera`);
    assert.deepEqual(errors, [], `${name}: console errors`);
    report.viewports.push(entry); await page.close();
  }
  await fs.writeFile(`${dir}/report.json`, JSON.stringify(report, null, 2));
  console.log(JSON.stringify(report.viewports.map(v => ({ name: v.name, handoff: v.handoff }))));
  console.log('Ultrawide curve checks passed.');
} finally { await browser.close(); }
