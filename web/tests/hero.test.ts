import test from 'node:test';
import assert from 'node:assert/strict';
import { AnimationClip, Group, Object3D, Quaternion, QuaternionKeyframeTrack, Vector3, VectorKeyframeTrack } from 'three';
import { createHeroSampler } from '../src/hero';

const near = (actual: number, expected: number, label: string) => assert.ok(Math.abs(actual - expected) < 2e-7, `${label}: ${actual} versus ${expected}`);
const rotation = (axis: Vector3, angle: number) => new Quaternion().setFromAxisAngle(axis, angle);
const up = new Vector3(0, 1, 0), right = new Vector3(1, 0, 0);
function sameRotation(actual: Quaternion, expected: Quaternion, label: string) {
  // A quaternion and its negation express the same orientation.
  const sign = actual.dot(expected) < 0 ? -1 : 1;
  actual.toArray().forEach((value, i) => near(value, expected.toArray()[i] * sign, `${label} ${i}`));
}
function fixture() {
  const root = new Group(), feet = new Object3D(), spin = new Object3D(), lid = new Object3D();
  feet.name = 'Journey_TravelFeet'; spin.name = 'Journey_MacBook_SpinPivot'; lid.name = 'Journey_MacBook_LidPivot';
  root.add(feet); feet.add(spin); spin.add(lid);
  const times = [0, 1, 2, 3, 4];
  // Five baked keys preserve a complete turn even though the endpoints look identical.
  const clip = new AnimationClip('Journey', 4, [
    new VectorKeyframeTrack(`${feet.name}.position`, times, times.flatMap(t => [t, .74 + .05 * t, -.02 * t])),
    new QuaternionKeyframeTrack(`${spin.name}.quaternion`, times, times.flatMap(t => rotation(up, t * Math.PI / 2).toArray())),
    new QuaternionKeyframeTrack(`${lid.name}.quaternion`, times, times.flatMap(t => rotation(right, .2 * t).toArray())),
  ]);
  return { root, feet, spin, lid, clip, sample: createHeroSampler(root, clip) };
}
function checkPose(f: ReturnType<typeof fixture>, time: number) {
  [time, .74 + .05 * time, -.02 * time].forEach((value, i) => near(f.feet.position.toArray()[i], value, `feet at ${time}`));
  sameRotation(f.spin.quaternion, rotation(up, time * Math.PI / 2), `spin at ${time}`);
  sameRotation(f.lid.quaternion, rotation(right, .2 * time), `lid at ${time}`);
}

test('repeated fixed-time samples restore every baked transform before external dock blending', () => {
  const f = fixture(), time = 2, dockPosition = new Vector3(7, .74, .1), dockSpin = rotation(up, .1), dockLid = rotation(right, .05);
  const bakedPosition = new Vector3(time, .74 + .05 * time, -.02 * time);
  for (const dock of [0, .1, .3, .6, 1, 1, .8, .5, .1, 0, .3, .3]) {
    f.sample(time);
    checkPose(f, time);
    f.feet.position.lerp(dockPosition, dock); f.spin.quaternion.slerp(dockSpin, dock); f.lid.quaternion.slerp(dockLid, dock);
    const expectedPosition = bakedPosition.clone().lerp(dockPosition, dock);
    f.feet.position.toArray().forEach((value, i) => near(value, expectedPosition.toArray()[i], `dock ${dock} position`));
    sameRotation(f.spin.quaternion, rotation(up, time * Math.PI / 2).slerp(dockSpin, dock), `dock ${dock} spin`);
    sameRotation(f.lid.quaternion, rotation(right, .2 * time).slerp(dockLid, dock), `dock ${dock} lid`);
  }
});

test('baked intermediate quaternion keys retain the full turn through forward and backward seeking', () => {
  const f = fixture();
  for (const time of [0, .5, 1, 1.5, 2, 2.5, 3, 3.5, 4, 3.5, 2, .5, 0]) {
    f.sample(time); checkPose(f, time);
    if (time === 2) assert.ok(Math.abs(f.spin.quaternion.dot(new Quaternion())) < 1e-7, 'halfway through a full turn must face opposite the identical endpoint orientations');
  }
});

test('seeking after the clip endpoint or external pose changes restores the same direct-seek pose', () => {
  const f = fixture();
  for (const time of [4, 4, 3.75, 1.25, 4, 0, 2.75]) {
    f.feet.position.set(99, -4, 20); f.spin.quaternion.setFromAxisAngle(right, 1.7); f.lid.quaternion.setFromAxisAngle(up, 1.2);
    f.sample(time); checkPose(f, time);
  }
  f.sample(10); checkPose(f, 4);
  f.sample(-10); checkPose(f, 0);
});

test('sampler restores only animated properties and rejects unsupported or missing targets', () => {
  const f = fixture();
  f.root.position.set(2, 3, 4); f.feet.scale.set(1.2, .8, 2); f.lid.position.set(.1, .2, .3);
  f.sample(2);
  assert.deepEqual(f.root.position.toArray(), [2, 3, 4]);
  assert.deepEqual(f.feet.scale.toArray(), [1.2, .8, 2]);
  assert.deepEqual(f.lid.position.toArray(), [.1, .2, .3]);
  for (const track of [
    new VectorKeyframeTrack('Missing.position', [0, 1], [0, 0, 0, 1, 1, 1]),
    new VectorKeyframeTrack(`${f.feet.name}.scale`, [0, 1], [1, 1, 1, 2, 2, 2]),
  ]) assert.throws(() => createHeroSampler(f.root, new AnimationClip('Unsupported', 1, [track])), /Unsupported laptop animation track/);
});
