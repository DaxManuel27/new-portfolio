import test from 'node:test';
import assert from 'node:assert/strict';
import { evaluate, phases, totalUnits } from '../src/journey';
import { fitTitleSize, fsaeTitleOpacity, monitorTitleRect } from '../src/fsae-title';

const at = (station: number, kind: string, local: number) => {
  const p = phases.find(x => x.station === station && x.kind === kind)!;
  return fsaeTitleOpacity(evaluate((p.start + local * (p.end - p.start)) / totalUnits));
};
test('UNB Formula Racing shows on the FSAE monitor and the car overview only', () => {
  for (const [s, k] of [[2, 'pan'], [2, 'monitor-hold'], [3, 'screen-zoom'], [3, 'hold']] as const) assert.equal(at(s, k, .5), 1, `${s} ${k}`);
  assert.equal(at(3, 'data-dive', 0), 1);
  assert.equal(at(3, 'data-dive', .1), 0, 'gone before the camera turns toward the first component');
  assert.equal(at(3, 'data-return', .5), 0);
  assert.equal(at(3, 'data-return', .999),0);
  assert.equal(at(3, 'car-shrink', .5), 0);
  assert.equal(at(3, 'car-shrink', .05),0);
  assert.equal(at(4, 'projects-reveal', .5), 0);
  assert.equal(at(4, 'projects-monitor-entry', .5), 0);
  for (const k of ['data-hold', 'reel', 'contact-card-center','contact-card-expand']) {
    const p = phases.find(x => x.kind === k)!;
    assert.equal(at(p.station,p.kind,.5),0);
  }
  for (const p of phases.filter(x => x.station < 2)) assert.equal(at(p.station, p.kind, .5), 0);
});
test('title size ends each line a gap before the car, within limits', () => {
  // Line widths per px of font size; the car's left edge beside each line.
  assert.equal(fitTitleSize(40, [6, 3], [700, 600], 20, 36, 200), (700 - 20 - 40) / 6);
  assert.equal(fitTitleSize(40, [6, 3], [Infinity, 600], 20, 36, 120), 120, 'no car beside a line leaves the cap');
  assert.equal(fitTitleSize(40, [6, 3], [100, 600], 20, 36, 120), 36, 'never below the minimum');
});

test('on the monitor the whole title stays on the glass at full size, and is untouched when it fits', () => {
  const glass = { width: .62, height: .35 }, viewport = { width: 2000, height: 1050 }, margin = .02;
  const title = { left: 64, top: 115, right: 760, bottom: 330 };
  // Wide window before the zoom: the full-screen frame is wider than the glass.
  const region = { width: .75, height: .75 / (2000 / 1050) };
  const r = monitorTitleRect(title, viewport, region, glass, margin);
  assert.ok(r.left >= -glass.width / 2 + margin - 1e-12 && r.top <= glass.height / 2 - margin + 1e-12 && r.bottom >= -glass.height / 2 + margin - 1e-12, 'inside the glass');
  const fullWidth = (760 - 64) / 2000 * region.width;
  assert.ok(Math.abs(r.right - r.left - fullWidth) < 1e-12, 'keeps its full size beside the car');
  // End of the zoom: the frame fits inside the glass, so the natural placement is used unchanged.
  const end = { width: .55, height: .55 / (2000 / 1050) }, natural = monitorTitleRect(title, viewport, end, glass, margin, (760 - 64) / 2000 * .55);
  assert.ok(Math.abs(natural.left - (64 / 2000 - .5) * .55) < 1e-12 && Math.abs(natural.top - (.5 - 115 / 1050) * end.height) < 1e-12);
});
