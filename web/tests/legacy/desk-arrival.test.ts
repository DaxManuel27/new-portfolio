import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { NodeIO } from '@gltf-transform/core';
import { ALL_EXTENSIONS } from '@gltf-transform/extensions';
import { dequantize } from '@gltf-transform/functions';
import { MeshoptDecoder } from 'meshoptimizer';
import { AnimationClip, Box3, BufferGeometry, Float32BufferAttribute, Group, Mesh, Object3D, QuaternionKeyframeTrack, Vector3, VectorKeyframeTrack } from 'three';
import { createHeroSampler } from '../src/hero';
import { DESK_ARRIVAL_START, DESK_ALIGNMENT_END, DESK_TOUCHDOWN, deskArrivalPose, type LaptopPose } from '../src/desk-arrival';
import { projectsPose } from '../src/projects-motion';
import type { Manifest } from '../src/types';

// Reconstruct transforms and geometry from the shipped assets, so clearance checks
// continue to protect the actual models if the desk or laptop is exported again.
async function loadGeometry(filename: string) {
  await MeshoptDecoder.ready;
  const io = new NodeIO().registerExtensions(ALL_EXTENSIONS).registerDependencies({ 'meshopt.decoder': MeshoptDecoder });
  const doc = await io.read(`public/assets/${filename}`);
  await doc.transform(dequantize());
  const nodes = new Map(doc.getRoot().listNodes().map(node => {
    const object = new Group(); object.name = node.getName();
    object.position.fromArray(node.getTranslation()); object.quaternion.fromArray(node.getRotation()); object.scale.fromArray(node.getScale());
    for (const primitive of node.getMesh()?.listPrimitives() ?? []) {
      const geometry = new BufferGeometry();
      geometry.setAttribute('position', new Float32BufferAttribute(primitive.getAttribute('POSITION')!.getArray()!, 3));
      geometry.computeBoundingBox(); object.add(new Mesh(geometry));
    }
    return [node, object] as const;
  }));
  for (const [node, object] of nodes) for (const child of node.listChildren()) object.add(nodes.get(child)!);
  const root = new Group();
  for (const child of doc.getRoot().listScenes()[0].listChildren()) root.add(nodes.get(child)!);
  const tracks = doc.getRoot().listAnimations().flatMap(animation => animation.listChannels().map(channel => {
    const sampler = channel.getSampler()!, node = channel.getTargetNode()!;
    const type = channel.getTargetPath() === 'rotation' ? QuaternionKeyframeTrack : VectorKeyframeTrack;
    const property = channel.getTargetPath() === 'rotation' ? 'quaternion' : 'position';
    return new type(`${node.getName()}.${property}`, sampler.getInput()!.getArray()!, sampler.getOutput()!.getArray()!);
  }));
  return { root, clip: new AnimationClip('Journey', -1, tracks) };
}
const manifest: Manifest = JSON.parse(fs.readFileSync('public/assets/journey.json', 'utf8'));
const [hero, desk] = await Promise.all([loadGeometry('macbook-journey.glb'), loadGeometry('station-resume.glb')]);
desk.root.position.fromArray(manifest.stations[5].origin); desk.root.updateMatrixWorld(true);
const sample = createHeroSampler(hero.root, hero.clip);
const feet = hero.root.getObjectByName('Journey_TravelFeet')!, spin = hero.root.getObjectByName('Journey_MacBook_SpinPivot')!, lid = hero.root.getObjectByName('Journey_MacBook_LidPivot')!;
const pose = (): LaptopPose => ({ position: feet.position.toArray(), quaternion: spin.quaternion.toArray(), lid: lid.quaternion.toArray() });
sample(DESK_ARRIVAL_START);
const apex = pose(), dock = manifest.stations[5].dock;
sample(14);
const incomingApex = pose();
const apply = (p: LaptopPose) => { feet.position.fromArray(p.position); spin.quaternion.fromArray(p.quaternion); lid.quaternion.fromArray(p.lid); hero.root.updateMatrixWorld(true); };
const bounds = (object: Object3D) => new Box3().setFromObject(object);
const phone = bounds(desk.root.getObjectByName('Shared_Contact_Prop_RotaryTelephone')!);
const obstacles = ['Shared_Contact_Prop_RotaryTelephone', 'Shared_Contact_Notebook_Open', 'Shared_Contact_Pen_ContactOrigin', 'Shared_Resume_Prop_Printer'].map(name => ({ name, box: bounds(desk.root.getObjectByName(name)!) }));
const table = bounds(desk.root.getObjectByName('Shared_Resume_Desk_Station.Top')!);
const near = (a: number, b: number, tolerance = 1e-6) => assert.ok(Math.abs(a - b) < tolerance, `${a} versus ${b}`);

test('arrival clears every desk prop throughout the flight and lands on the actual tabletop', () => {
  for (let i = 0; i <= 800; i++) {
    const time = 16 + i / 200;
    sample(time);
    if (time >= DESK_ARRIVAL_START) apply(deskArrivalPose(time, apex, dock));
    else apply(projectsPose(time, pose(), manifest.stations[4].dock, incomingApex, apex));
    const laptop = bounds(hero.root);
    for (const { name, box } of obstacles) assert.ok(!laptop.intersectsBox(box), `laptop intersects ${name} at ${time}`);
    if (time >= DESK_ARRIVAL_START) assert.ok(laptop.min.y >= table.max.y - .0001, `laptop sinks into the desk at ${time}`);
  }
  const landed = bounds(hero.root);
  near(landed.min.y, table.max.y, .0001);
  assert.ok(landed.min.x > table.min.x && landed.max.x < table.max.x);
  assert.ok(landed.min.z > table.min.z && landed.max.z < table.max.z);
  assert.ok(phone.min.x - landed.max.x > .08, 'landed laptop should have a visible gap from the phone');
});

test('laptop aligns over the empty bay, then descends vertically with no rotation on contact', () => {
  const first = deskArrivalPose(DESK_ARRIVAL_START, apex, dock);
  first.position.forEach((x, i) => near(x, apex.position[i]));
  for (let i = 0; i <= 200; i++) {
    const t = DESK_ALIGNMENT_END + (DESK_TOUCHDOWN - DESK_ALIGNMENT_END) * i / 200;
    const p = deskArrivalPose(t, apex, dock);
    near(p.position[0], dock.position[0]); near(p.position[2], dock.position[2]);
    p.quaternion.forEach((x, k) => near(x, dock.quaternion[k]));
    p.lid.forEach((x, k) => near(x, dock.lid[k]));
  }
  const end = deskArrivalPose(DESK_TOUCHDOWN, apex, dock);
  end.position.forEach((x, i) => near(x, dock.position[i]));
  const h = .00001;
  for (const time of [DESK_ARRIVAL_START, DESK_ALIGNMENT_END, DESK_TOUCHDOWN]) {
    const before = new Vector3().fromArray(deskArrivalPose(time - h, apex, dock).position);
    const after = new Vector3().fromArray(deskArrivalPose(time + h, apex, dock).position);
    assert.ok(before.distanceTo(after) / (2 * h) < .0001, `arrival should ease through ${time}`);
  }
});

test('backward and direct seeking produce the same descent without accumulated offsets', () => {
  const times = Array.from({ length: 101 }, (_, i) => 18 + i / 50);
  const forward = times.map(time => deskArrivalPose(time, apex, dock));
  for (let i = times.length - 1; i >= 0; i--) assert.deepEqual(deskArrivalPose(times[i], apex, dock), forward[i]);
  for (const i of [70, 0, 99, 31, 100]) assert.deepEqual(deskArrivalPose(times[i], apex, dock), forward[i]);
});
