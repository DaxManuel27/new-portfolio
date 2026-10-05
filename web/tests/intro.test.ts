import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { evaluate, openingTime, phases, totalUnits } from '../src/journey';
import { evaluateCamera, sampleTravel } from '../src/camera';
import intro from '../src/intro-config.json';
import type { Manifest } from '../src/types';

const manifest = JSON.parse(fs.readFileSync('public/assets/journey.json', 'utf8')) as Manifest;
const first = phases.find(p => p.kind === 'travel')!;
const atFirst = (time: number) => evaluate((first.start + (first.end - first.start) * time / 4) / totalUnits);
const near = (a: number, b: number, tolerance = 1e-8) => assert.ok(Math.abs(a - b) < tolerance, `${a} versus ${b}`);

test('Intro holds the screenshot pose and its fitted camera until scrolling into the first flight', () => {
  const camera = evaluateCamera(manifest, evaluate(0)).pose;
  for (const units of [0, .1, .3, .599999]) {
    const state = evaluate(units / totalUnits);
    assert.equal(state.heroTime, intro.startTime);
    assert.equal(state.dock, 0);
    assert.deepEqual(evaluateCamera(manifest, state).pose, camera);
  }
  near(atFirst(0).heroTime, intro.startTime);
});

test('first-flight time never runs backward and joins the original clip without a speed discontinuity', () => {
  let previous = intro.startTime;
  for (let time = 0; time <= 4; time += .001) {
    const next = openingTime(time);
    assert.ok(next >= previous - 1e-10, `backwards motion at ${time}`);
    assert.ok(next >= intro.startTime && next <= 4);
    previous = next;
  }
  const h = .00001, end = intro.handoffTime;
  near((openingTime(h) - openingTime(0)) / h, 0, .0001);
  near(openingTime(end), end);
  near((openingTime(end) - openingTime(end - h)) / h, 1, .0001);
  near((openingTime(end + h) - openingTime(end)) / h, 1, .0001);
  for (const time of [2, 2.3, 3.5, 4, 8, 12, 16, 20, 24]) near(openingTime(time), time);
});

test('every later flight still samples the original baked time', () => {
  for (const phase of phases.filter(p => p.kind === 'travel' && p.station > 1 && p.station < 6)) {
    for (const local of [0, .1, .3, .5, .7, .9, .999]) {
      const state = evaluate((phase.start + (phase.end - phase.start) * local) / totalUnits);
      near(state.heroTime, (phase.station - 1 + local) * 4);
    }
  }
});

test('the Intro platform stays hidden even while the original animation would reveal it', () => {
  for (let time = 0; time <= 24; time += .05) assert.equal(sampleTravel(manifest, time).opacity[0], 0);
  assert.ok(sampleTravel(manifest, 0).opacity.every(x => x === 0));
  assert.equal(sampleTravel(manifest, 4).opacity[1], 1);
});

test('prepared manifest records the same opening configuration used by the evaluator', () => {
  const prepared = JSON.parse(fs.readFileSync('public/assets/journey.json', 'utf8'));
  assert.deepEqual(prepared.intro, intro);
  assert.equal(prepared.stations[0].poster, intro.poster);
});
