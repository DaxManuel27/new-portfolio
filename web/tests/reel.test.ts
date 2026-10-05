import test from 'node:test';
import assert from 'node:assert/strict';
import { cardLayout, reelPosition, reelView } from '../src/reel';
import { evaluate, phases, totalUnits } from '../src/journey';
import { PROJECTS } from '../src/projects';

const view = (kind: string, station: number, local: number) => {
  const phase = phases.find(p => p.kind === kind && p.station === station)!;
  return reelView(evaluate((phase.start + local * (phase.end - phase.start)) / totalUnits), PROJECTS.length);
};
test('reel position holds on every card and glides monotonically between them', () => {
  const n = PROJECTS.length; let last = -1;
  assert.equal(reelPosition(0, n), 0); assert.equal(reelPosition(1, n), n - 1);
  for (let i = 0; i <= 400; i++) { const c = reelPosition(i / 400, n); assert.ok(c >= last - 1e-12); last = c; }
  for (let k = 0; k < n; k++) assert.equal(reelPosition((k + .2) / n, n), k);
});
test('card layout is centred at zero, dims the past, and keeps neighbours inside the next slot', () => {
  const c = cardLayout(0); assert.equal(c.x, 0); assert.equal(c.scale, 1); assert.equal(c.opacity, 1);
  assert.ok(cardLayout(-1).opacity < cardLayout(1).opacity); assert.ok(cardLayout(1).x > .5 + cardLayout(1).scale / 2);
  assert.equal(cardLayout(-9).opacity, 0); assert.equal(cardLayout(9).opacity, 0);
});
test('the ultrawide display turns into the reel, then the reel opens onto the live desk', () => {
  assert.equal(view('hold', 3, .5).visible, false);
  const dive = [0, .5, .75, 1].map(t => view('projects-monitor-entry', 4, t));
  assert.equal(dive[0].visible, false); assert.equal(dive[0].canvas.opacity, 1);
  assert.equal(dive[3].opacity, 1); assert.equal(dive[3].canvas.opacity, 1);
  for (let i = 1; i < dive.length; i++) assert.ok(dive[i].opacity >= dive[i - 1].opacity);
  assert.equal(view('reel', 4, .5).canvas.mode, 'card');
  assert.equal(view('contact-card-center', 4, 0).canvas.mode, 'card'); assert.equal(view('contact-card-center', 4, .5).canvas.mode, 'card');
  const end = view('contact-card-expand', 4, 1); assert.equal(end.visible, false); assert.equal(end.canvas.mode, 'normal'); assert.equal(end.canvas.opacity, 1);
  assert.equal(view('hold', 5, .5).visible, false);
  assert.equal(view('contact-card-center', 4, 0).position, PROJECTS.length - 1); assert.equal(view('contact-card-center', 4, 1).position, PROJECTS.length);
});
