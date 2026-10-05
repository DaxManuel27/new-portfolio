import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import os from 'node:os';

const { chromium } = await import(process.env.PLAYWRIGHT_MODULE || `${os.homedir()}/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright/index.mjs`);
const browser = await chromium.launch({ channel: 'chrome', headless: true });
const url = process.env.PREVIEW_URL || 'http://127.0.0.1:5173';
const manifest = JSON.parse(await fs.readFile('public/assets/journey.json', 'utf8'));
const introConfig = JSON.parse(await fs.readFile('src/intro-config.json', 'utf8'));
const captureDirectory = 'test-results/floating-intro';
await fs.mkdir(captureDirectory, { recursive: true });
const introPoster = manifest.stations[0].poster;
const errors = [], introRequests = [], layouts = [], fallbackChecks = [];

function watch(page, reportErrors = true) {
  page.on('request', request => {
    if (/\/station-intro\.glb(?:\?|$)/.test(request.url())) introRequests.push(request.url());
  });
  if (reportErrors) page.on('pageerror', error => errors.push(String(error)));
}

function samePose(actual, expected, message, tolerance = 1e-7) {
  for (const key of ['feet', 'camera']) actual[key].forEach((x, i) => assert.ok(Math.abs(x - expected[key][i]) < tolerance, `${message}: ${key} ${i}`));
  for (const key of ['spin', 'lid', 'cameraQuaternion']) {
    const sign = actual[key].reduce((sum, x, i) => sum + x * expected[key][i], 0) < 0 ? -1 : 1;
    actual[key].forEach((x, i) => assert.ok(Math.abs(x - sign * expected[key][i]) < tolerance, `${message}: ${key} ${i}`));
  }
  assert.ok(Math.abs(actual.cameraWidth - expected.cameraWidth) < tolerance, `${message}: camera width`);
}

function checkScene(snapshot, message, viewport, opening = false) {
  assert.deepEqual(snapshot.errors, [], `${message}: no asset errors`);
  assert.deepEqual(snapshot.heroScale, [1, 1, 1], `${message}: physical model scale preserved`);
  assert.ok(!snapshot.loaded.includes(0) && !snapshot.pending.includes(0), `${message}: Intro station is never loaded`);
  assert.ok(!snapshot.visibleStations.includes(0), `${message}: Intro station stays hidden`);
  const [min, max] = snapshot.projectedBounds;
  const size = max.map((value, i) => value - min[i]), center = max.map((value, i) => (value + min[i]) / 2);
  assert.ok([...min, ...max].every(Number.isFinite), `${message}: finite mesh projection`);
  assert.ok(min.every(value => value >= 0) && max.every(value => value <= 1), `${message}: complete laptop is visible`);
  assert.ok(size[0] <= .57 && size[1] <= .65, `${message}: projected size stays within travel bounds (${size})`);
  assert.ok(Math.abs(center[0] - .5) * viewport.width < 2 && Math.abs(center[1] - .5) * viewport.height < 2, `${message}: visible laptop remains centered (${center})`);
  if (opening) {
    assert.deepEqual(snapshot.visibleStations, [], `${message}: opening contains only the laptop`);
    assert.ok(Math.abs(snapshot.time - introConfig.startTime) < 1e-9, `${message}: exact authored floating pose`);
  }
  return { size, center };
}

async function ready(page) {
  await page.waitForFunction(() => window.__portfolio?.snapshot().ready && window.__portfolio.settled(), {}, { timeout: 60000 });
}

async function seek(page, progress) {
  await page.evaluate(p => window.__portfolio.seek(p), progress);
  // Let native scroll quantization, ScrollTrigger and the requested render settle.
  await page.waitForTimeout(80);
  await ready(page);
  return page.evaluate(() => window.__portfolio.snapshot());
}

async function checkIntroPoster(page, selector, message) {
  const image = page.locator(selector);
  await image.waitFor({ state: 'visible' });
  await image.evaluate(image => image.decode());
  assert.ok((await image.getAttribute('src')).endsWith(`/assets/${introPoster}`), `${message}: floating opening poster source`);
  assert.ok(await image.evaluate(image => image.naturalWidth > 0 && image.naturalHeight > 0), `${message}: image decoded`);
}

try {
  const page = await browser.newPage({ viewport: { width: 1644, height: 1530 } });
  watch(page);
  let releaseHero;
  const heroGate = new Promise(resolve => { releaseHero = resolve; });
  await page.route('**/macbook-journey.glb', async route => { await heroGate; await route.continue(); });
  await page.goto(url, { waitUntil: 'domcontentloaded' });
  await checkIntroPoster(page, '#poster', 'initial loading');
  assert.equal(await page.locator('#loading').evaluate(element => element.classList.contains('ready')), false);
  await page.screenshot({ path: `${captureDirectory}/reference-loading.png` });
  releaseHero();
  await ready(page);
  await page.unroute('**/macbook-journey.glb');
  const { phases, totalUnits } = await page.evaluate(() => ({ phases: window.__portfolio.phases, totalUnits: window.__portfolio.totalUnits }));
  const intro = phases.find(phase => phase.kind === 'intro');
  const travel = phases.find(phase => phase.kind === 'travel' && phase.station === 1);
  const hackHold = phases.find(phase => phase.kind === 'hold' && phase.station === 1);
  const progressAtTime = rawTime => (travel.start + (travel.end - travel.start) * rawTime / 4) / totalUnits;
  const rawTimes = [...new Set([0, .25, .5, 1, 1.5, introConfig.handoffTime - .02, introConfig.handoffTime, introConfig.handoffTime + .02, 2.5, 3, 3.5, 4])].sort((a, b) => a - b);

  for (const [name, viewport] of [
    ['reference', { width: 1644, height: 1530 }],
    ['desktop', { width: 1440, height: 960 }],
    ['portrait', { width: 390, height: 844 }],
  ]) {
    await page.setViewportSize(viewport);
    await page.waitForTimeout(250);
    const first = await seek(page, 0);
    const geometry = checkScene(first, `${name} opening`, viewport, true);
    if (name === 'reference') {
      assert.ok(Math.abs(geometry.size[0] - .49) < .025, `reference opening width matches supplied composition (${geometry.size[0]})`);
      assert.ok(Math.abs(geometry.size[1] - .46) < .035, `reference opening height matches supplied composition (${geometry.size[1]})`);
    }
    for (const fraction of [.25, .6, .95]) {
      const hold = await seek(page, (intro.start + (intro.end - intro.start) * fraction) / totalUnits);
      samePose(hold, first, `${name} fixed floating hold at ${fraction}`);
      checkScene(hold, `${name} floating hold at ${fraction}`, viewport, true);
    }
    await seek(page, 0);
    await page.screenshot({ path: `${captureDirectory}/${name}-opening.png` });
    const samples = [];
    for (const rawTime of rawTimes) {
      const snapshot = await seek(page, progressAtTime(rawTime));
      const projection = checkScene(snapshot, `${name} first flight at ${rawTime}`, viewport);
      samples.push({ rawTime, requestedProgress: progressAtTime(rawTime), snapshot, projection });
      if ([0, .5, 1, 1.5, introConfig.handoffTime, 3].includes(rawTime)) await page.screenshot({ path: `${captureDirectory}/${name}-flight-${String(rawTime).replace('.', '-')}.png` });
    }
    for (const sample of samples.toReversed()) samePose(await seek(page, sample.requestedProgress), sample.snapshot, `${name} reversed first flight at ${sample.rawTime}`);
    for (const index of [3, 1, 5]) {
      await seek(page, (hackHold.start + .25 * (hackHold.end - hackHold.start)) / totalUnits);
      samePose(await seek(page, samples[index].requestedProgress), samples[index].snapshot, `${name} direct seek into first flight at ${samples[index].rawTime}`);
    }
    samePose(await seek(page, 0), first, `${name} reverse returns to reference opening`);
    layouts.push({ name, viewport, first, geometry, samples });
  }

  const beforeReload = await seek(page, progressAtTime(.5));
  await page.reload();
  await ready(page);
  samePose(await page.evaluate(() => window.__portfolio.snapshot()), beforeReload, 'reload restores an immediate first-flight seek');
  fallbackChecks.push('immediate first-flight seek survives reload');
  await seek(page, 0);
  await page.locator('#motion-toggle').click();
  await checkIntroPoster(page, '#still-intro img', 'motion toggle');
  assert.equal(await page.locator('#stills figure:visible').count(), 7);
  await page.screenshot({ path: `${captureDirectory}/portrait-reduced-motion.png` });
  await page.locator('#motion-toggle').click();
  await ready(page);
  checkScene(await seek(page, 0), 'animation restored at Intro', page.viewportSize(), true);
  fallbackChecks.push('motion toggle preserves floating opening');

  const reduced = await browser.newPage({ viewport: { width: 1440, height: 960 }, reducedMotion: 'reduce' });
  watch(reduced);
  await reduced.goto(url);
  await reduced.waitForFunction(() => window.__portfolio?.snapshot().staticMode);
  await checkIntroPoster(reduced, '#still-intro img', 'OS reduced motion');
  await reduced.screenshot({ path: `${captureDirectory}/desktop-reduced-motion.png` });
  assert.equal(await reduced.locator('#stills figure:visible').count(), 7);
  fallbackChecks.push('OS reduced motion uses floating opening');
  await reduced.close();

  const broken = await browser.newPage({ viewport: { width: 1440, height: 960 } });
  watch(broken, false);
  await broken.route('**/macbook-journey.glb', route => route.abort());
  await broken.goto(url);
  await broken.waitForFunction(() => window.__portfolio?.snapshot().staticMode);
  await checkIntroPoster(broken, '#still-intro img', 'hero load failure');
  await broken.screenshot({ path: `${captureDirectory}/desktop-hero-failure.png` });
  fallbackChecks.push('hero load failure uses floating opening');
  await broken.close();

  assert.deepEqual(introRequests, [], 'Intro station asset is never requested');
  assert.deepEqual(errors, [], 'no unhandled browser errors');
  await fs.writeFile(`${captureDirectory}/report.json`, JSON.stringify({ browser: await browser.version(), introConfig, introPoster, checks: ['reference framing', 'stable opening hold', 'first flight centered and unclipped at three viewport sizes', 'reverse and direct seek consistency', 'Intro never requested, loaded or visible', ...fallbackChecks], introRequests, errors, layouts }, null, 2));
  console.log('Floating opening browser regression checks passed.');
} finally {
  await browser.close();
}
