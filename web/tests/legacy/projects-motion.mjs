import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import os from 'node:os';

const { chromium } = await import(process.env.PLAYWRIGHT_MODULE || `${os.homedir()}/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright/index.mjs`);
const browser = await chromium.launch({ channel: 'chrome', headless: true });
const url = process.env.PREVIEW_URL || 'http://127.0.0.1:5173';
const manifest = JSON.parse(await fs.readFile('public/assets/journey.json', 'utf8'));
const directory = 'test-results/projects-motion';
await fs.mkdir(directory, { recursive: true });
const errors = [], layouts = [];
const parked = manifest.stations[4].dock;
const tolerance = 1e-7;

function closeVector(actual, expected, description, limit = tolerance) {
  actual.forEach((value, index) => assert.ok(Math.abs(value - expected[index]) < limit, `${description} axis ${index}: ${value} vs ${expected[index]}`));
}

function closeQuaternion(actual, expected, description, limit = tolerance) {
  const sign = actual.reduce((sum, value, index) => sum + value * expected[index], 0) < 0 ? -1 : 1;
  closeVector(actual, expected.map(value => sign * value), description, limit);
}

function samePose(actual, expected, description) {
  for (const key of ['feet', 'camera']) closeVector(actual[key], expected[key], `${description}: ${key}`);
  for (const key of ['spin', 'lid', 'cameraQuaternion']) closeQuaternion(actual[key], expected[key], `${description}: ${key}`);
  assert.ok(Math.abs(actual.cameraWidth - expected.cameraWidth) < tolerance, `${description}: camera width`);
}

function assertParked(snapshot, description) {
  closeVector(snapshot.feet, parked.position, `${description}: canonical parked feet`);
  closeQuaternion(snapshot.spin, parked.quaternion, `${description}: canonical parked rotation`);
  closeQuaternion(snapshot.lid, parked.lid, `${description}: canonical parked lid`);
}

function assertFrame(snapshot, description) {
  assert.deepEqual(snapshot.errors, [], `${description}: no asset errors`);
  assert.deepEqual(snapshot.heroScale, [1, 1, 1], `${description}: physical laptop scale retained`);
  assert.equal(snapshot.paper, 0, `${description}: scroll does not print`);
  assert.equal(snapshot.paperVisible, false, `${description}: no unrequested paper`);
  const frame = snapshot.time * manifest.fps, lower = Math.floor(frame), upper = Math.min(manifest.travel.length - 1, lower + 1);
  const opacity = manifest.travel[lower].opacity[4] + (manifest.travel[upper].opacity[4] - manifest.travel[lower].opacity[4]) * (frame - lower);
  const monitorVisible = snapshot.phase.kind === 'travel' ? opacity > .001 : snapshot.phase.station === 4;
  assert.equal(snapshot.visibleStations.includes(4), monitorVisible, `${description}: Projects visibility retains the authored timing`);
  const [min, max] = snapshot.projectedBounds;
  assert.ok([...min, ...max].every(Number.isFinite), `${description}: finite laptop projection`);
  assert.ok(min[0] >= 0 && min[1] >= 0 && max[0] <= 1 && max[1] <= 1, `${description}: entire laptop stays within the camera (${min}; ${max})`);
  assert.ok(max[0] > min[0] && max[1] > min[1], `${description}: laptop has positive projected dimensions`);
}

async function ready(page) {
  await page.waitForFunction(() => window.__portfolio?.snapshot().ready && window.__portfolio.settled(), {}, { timeout: 60000 });
}

async function seek(page, progress) {
  await page.evaluate(progress => window.__portfolio.seek(progress), progress);
  await page.waitForTimeout(70);
  await ready(page);
  await page.evaluate(() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve))));
  return page.evaluate(() => window.__portfolio.snapshot());
}

try {
  const page = await browser.newPage({ viewport: { width: 1440, height: 960 } });
  page.on('pageerror', error => errors.push(String(error)));
  await page.goto(`${url}/?review=1`);
  await ready(page);
  const { phases, totalUnits } = await page.evaluate(() => ({ phases: window.__portfolio.phases, totalUnits: window.__portfolio.totalUnits }));
  const incoming = phases.find(phase => phase.station === 4 && phase.kind === 'travel');
  const approach = phases.find(phase => phase.station === 4 && phase.kind === 'approach');
  const hold = phases.find(phase => phase.station === 4 && phase.kind === 'hold');
  const exit = phases.find(phase => phase.station === 4 && phase.kind === 'exit');
  const outgoing = phases.find(phase => phase.station === 5 && phase.kind === 'travel');
  const progressAtTime = (phase, time) => (phase.start + (phase.end - phase.start) * ((time - (phase.station - 1) * 4) / 4)) / totalUnits;
  const requests = [];
  for (let index = 0; index <= 20; index++) {
    const time = 12 + index / 5;
    requests.push({ label: `incoming-${time.toFixed(1)}`, progress: progressAtTime(incoming, time), capture: [12, 14, 14.8, 15.6, 16].some(value => Math.abs(value - time) < 1e-8) });
  }
  for (const phase of [approach, hold, exit]) for (const fraction of [0, .125, .25, .375, .5, .625, .75, .875, 1]) {
    requests.push({ label: `projects-${phase.kind}-${Math.round(fraction * 100)}`, progress: (phase.start + fraction * (phase.end - phase.start)) / totalUnits, capture: [0, .5, 1].includes(fraction) });
  }
  for (let index = 0; index <= 40; index++) {
    const time = 16 + index / 10;
    requests.push({ label: `outgoing-${time.toFixed(1)}`, progress: progressAtTime(outgoing, time), capture: [16, 16.2, 16.4, 16.8, 17.3, 18, 19, 19.6, 20].some(value => Math.abs(value - time) < 1e-8) });
  }
  requests.push({ label: 'reported-overlap-77-percent', progress: .77, capture: true });
  requests.sort((a, b) => a.progress - b.progress);

  const joins = [
    ...phases.filter(phase => phase.station === 4 || (phase.station === 5 && phase.kind === 'travel')).map(phase => ({ label: `${phase.station}-${phase.kind}`, progress: phase.start / totalUnits })),
    ...[13.6, 14.4, 15.2].map(time => ({ label: `incoming-motion-${time}`, progress: progressAtTime(incoming, time) })),
    ...[16.4, 17.3, 18, 19, 19.6].map(time => ({ label: `motion-${time}`, progress: progressAtTime(outgoing, time) })),
    { label: 'resume-approach', progress: outgoing.end / totalUnits },
  ];

  for (const [layout, viewport] of [
    ['desktop', { width: 1440, height: 960 }],
    ['portrait', { width: 390, height: 844 }],
  ]) {
    await page.setViewportSize(viewport);
    await page.waitForTimeout(250);
    const samples = [], boundaries = [];
    for (const request of requests) {
      const snapshot = await seek(page, request.progress), description = `${layout} ${request.label}`;
      try { assertFrame(snapshot, description); }
      catch (error) {
        await page.screenshot({ path: `${directory}/${layout}-failed-${request.label}.png` });
        await fs.writeFile(`${directory}/failure.json`, JSON.stringify({ description, request, snapshot, error: String(error) }, null, 2));
        throw error;
      }
      if (snapshot.phase.station === 4 && ['hold', 'exit'].includes(snapshot.phase.kind)) assertParked(snapshot, description);
      if (snapshot.phase.station === 5 && snapshot.phase.kind === 'travel' && snapshot.time <= 16.4) {
        // The initial clearance is a forward slide with the hinge and yaw held.
        closeVector(snapshot.feet.slice(0, 2), parked.position.slice(0, 2), `${description}: forward slide stays on the desk`);
        assert.ok(snapshot.feet[2] >= parked.position[2] - tolerance, `${description}: no recoil toward the monitor`);
        closeQuaternion(snapshot.spin, parked.quaternion, `${description}: no premature turn`);
        closeQuaternion(snapshot.lid, parked.lid, `${description}: open lid held during clearance`);
      }
      samples.push({ ...request, snapshot });
      if (request.capture) await page.screenshot({ path: `${directory}/${layout}-${request.label}.png` });
    }
    const clearance = samples.filter(entry => entry.snapshot.phase.station === 5 && entry.snapshot.phase.kind === 'travel' && entry.snapshot.time <= 16.4);
    for (let index = 1; index < clearance.length; index++) assert.ok(clearance[index].snapshot.feet[2] >= clearance[index - 1].snapshot.feet[2] - tolerance, `${layout}: clearance slide never recoils`);
    for (const sample of samples.toReversed()) samePose(await seek(page, sample.progress), sample.snapshot, `${layout} reverse ${sample.label}`);
    for (const sample of samples.filter((_, index) => index % 9 === 0)) {
      await seek(page, .1);
      samePose(await seek(page, sample.progress), sample.snapshot, `${layout} direct from Intro-side ${sample.label}`);
      await seek(page, 1);
      samePose(await seek(page, sample.progress), sample.snapshot, `${layout} direct from Contact ${sample.label}`);
    }
    for (const join of joins) {
      const delta = .002 / totalUnits;
      const before = await seek(page, join.progress - delta), after = await seek(page, join.progress + delta);
      const feetDelta = Math.hypot(...before.feet.map((value, index) => value - after.feet[index]));
      const cameraDelta = Math.hypot(...before.camera.map((value, index) => value - after.camera[index]));
      const widthDelta = Math.abs(before.cameraWidth - after.cameraWidth);
      const rotationDelta = 1 - Math.abs(before.cameraQuaternion.reduce((sum, value, index) => sum + value * after.cameraQuaternion[index], 0));
      assert.ok(feetDelta < .012, `${layout} ${join.label}: laptop position jumps by ${feetDelta}`);
      assert.ok(cameraDelta < .025, `${layout} ${join.label}: camera position jumps by ${cameraDelta}`);
      assert.ok(widthDelta < .04, `${layout} ${join.label}: camera width jumps by ${widthDelta}`);
      assert.ok(rotationDelta < .001, `${layout} ${join.label}: camera rotation jumps by ${rotationDelta}`);
      closeQuaternion(before.spin, after.spin, `${layout} ${join.label}: laptop rotation join`, .03);
      closeQuaternion(before.lid, after.lid, `${layout} ${join.label}: lid rotation join`, .03);
      boundaries.push({ ...join, feetDelta, cameraDelta, widthDelta, rotationDelta, before, after });
    }
    layouts.push({ layout, viewport, samples, boundaries });
  }
  assert.deepEqual(errors, []);
  await fs.writeFile(`${directory}/report.json`, JSON.stringify({ browser: await browser.version(), checks: ['incoming Projects and outgoing Resume laptop fully framed on desktop/portrait', 'Projects hold and camera pullback use one canonical parked pose', 'forward clearance slide finishes before yaw/lid changes', '77% reported overlap pose captured', 'reverse and direct seeking reproduce identical pose and camera', 'phase and clearance-stage joins have continuous position, rotation and camera width', 'Projects visibility keeps its authored timing', 'scrolling never prints'], note: 'Physical mesh clearance is checked separately by the exported-geometry regression; projected bounds here verify camera framing only.', errors, layouts }, null, 2));
  console.log(`Projects motion browser checks passed (${layouts.reduce((total, layout) => total + layout.samples.length, 0)} forward samples; desktop and portrait).`);
} finally {
  await browser.close();
}
