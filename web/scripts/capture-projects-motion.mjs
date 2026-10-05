import { mkdir, writeFile } from 'node:fs/promises';
import os from 'node:os';
import sharp from 'sharp';

const out = 'test-results/projects-motion-review';
await mkdir(out, { recursive: true });
const { chromium } = await import(process.env.PLAYWRIGHT_MODULE || `${os.homedir()}/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright/index.mjs`);
const browser = await chromium.launch({ channel: 'chrome', headless: true });
try {
  const page = await browser.newPage({ viewport: { width: 1200, height: 900 } });
  await page.goto(`${process.env.PREVIEW_URL || 'http://127.0.0.1:5173'}/?review=1#projects`);
  await page.waitForFunction(() => window.__portfolio?.settled() && window.__portfolio.snapshot().ready);
  await page.evaluate(async () => {
    const [{ PortfolioScene }, { evaluate, phases, totalUnits }] = await Promise.all([import('/src/scene.ts'), import('/src/journey.ts')]);
    const canvas = document.createElement('canvas');
    canvas.style.cssText = 'position:fixed;inset:0;width:100vw;height:100vh;z-index:999;background:#111';
    document.body.append(canvas);
    const scene = new PortfolioScene(canvas, await fetch('/assets/journey.json').then(r => r.json()));
    await scene.loadHero(); await scene.loadStation(4); await scene.loadStation(5);
    const incoming = phases.find(p => p.station === 4 && p.kind === 'travel');
    const outgoing = phases.find(p => p.station === 5 && p.kind === 'travel');
    const atTime = time => {
      const phase = time <= 16 ? incoming : outgoing;
      return (phase.start + (phase.end - phase.start) * (time - (phase.station - 1) * 4) / 4) / totalUnits;
    };
    window.__projectsCanvas = canvas;
    window.__projectsCapture = (progress, view = 'normal', diagnostics = true) => {
      scene.update(evaluate(progress));
      if (view !== 'normal') {
        const width = view === 'overhead' ? 2.8 : 1.65;
        if (view === 'overhead') { scene.camera.position.set(7.95, 4.5, .02); scene.camera.up.set(0, 0, -1); scene.camera.lookAt(7.95, 1, .02); }
        else { scene.camera.position.set(11, 1.1, .05); scene.camera.up.set(0, 1, 0); scene.camera.lookAt(7.9, 1.1, .05); }
        scene.camera.left = -width / 2; scene.camera.right = width / 2;
        scene.camera.top = width * .75 / 2; scene.camera.bottom = -scene.camera.top;
        scene.camera.updateProjectionMatrix(); scene.camera.updateMatrixWorld(true);
      }
      scene.render();
      return diagnostics ? scene.diagnostics() : undefined;
    };
    window.__projectsProgress = { atTime, start: atTime(13.4), end: atTime(18.1) };
  });
  const snapshots = [];
  for (const view of ['normal', 'overhead', 'side']) {
    const tiles = [];
    for (const [index, time] of [13.6, 14.2, 14.8, 15.6, 16, 16.2, 16.4, 16.8, 17.3, 18].entries()) {
      const snapshot = await page.evaluate(({ time, view }) => window.__projectsCapture(window.__projectsProgress.atTime(time), view), { time, view });
      snapshots.push({ view, time, ...snapshot });
      const file = `${out}/${view}-${index}.png`;
      await page.screenshot({ path: file });
      tiles.push({ input: await sharp(file).resize(360, 270).png().toBuffer(), left: index % 5 * 360, top: Math.floor(index / 5) * 300 });
      tiles.push({ input: Buffer.from(`<svg width="360" height="30"><rect width="360" height="30" fill="#222"/><text x="12" y="21" fill="white" font-family="Arial" font-size="16">${view}: ${time}s</text></svg>`), left: index % 5 * 360, top: Math.floor(index / 5) * 300 + 270 });
    }
    await sharp({ create: { width: 1800, height: 600, channels: 3, background: '#111' } }).composite(tiles).png().toFile(`${out}/${view}-contact-sheet.png`);
    const data = await page.evaluate(async view => {
      const { start, end } = window.__projectsProgress;
      window.__projectsCapture(start, view, false);
      const stream = window.__projectsCanvas.captureStream(30), recorder = new MediaRecorder(stream), chunks = [];
      recorder.ondataavailable = e => { if (e.data.size) chunks.push(e.data); };
      const stopped = new Promise(resolve => recorder.onstop = resolve); recorder.start();
      await new Promise(resolve => {
        const begun = performance.now();
        const frame = now => {
          const amount = Math.min(1, Math.max(0, (now - begun - 300) / 10000));
          window.__projectsCapture(start + (end - start) * amount, view, false);
          if (now - begun < 10600) requestAnimationFrame(frame); else resolve();
        };
        requestAnimationFrame(frame);
      });
      recorder.stop(); await stopped; stream.getTracks().forEach(track => track.stop());
      return await new Promise(resolve => {
        const reader = new FileReader(); reader.onload = () => resolve(reader.result);
        reader.readAsDataURL(new Blob(chunks, { type: recorder.mimeType }));
      });
    }, view);
    await writeFile(`${out}/${view}-motion.webm`, Buffer.from(data.split(',')[1], 'base64'));
  }
  await writeFile(`${out}/snapshots.json`, JSON.stringify(snapshots, null, 2));
  console.log('Captured the corrected Projects route from normal, overhead and side cameras.');
} finally { await browser.close(); }
