import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {NodeIO} from '@gltf-transform/core';import {ALL_EXTENSIONS} from '@gltf-transform/extensions';import {dequantize} from '@gltf-transform/functions';import {MeshoptDecoder} from 'meshoptimizer';
import {AnimationClip,Box3,BufferGeometry,Float32BufferAttribute,Group,Mesh,Object3D,Quaternion,QuaternionKeyframeTrack,Vector3,VectorKeyframeTrack} from 'three';
import {ConvexHull} from 'three/addons/math/ConvexHull.js';
import {createHeroSampler} from '../src/hero';
import {projectsPose,PROJECTS_MOTION} from '../src/projects-motion';
import {deskArrivalPose,DESK_ALIGNMENT_END,DESK_TOUCHDOWN,type LaptopPose} from '../src/desk-arrival';
import type {Manifest} from '../src/types';

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
const manifest = JSON.parse(fs.readFileSync('public/assets/journey.json', 'utf8')) as Manifest;
const [hero, projects] = await Promise.all([loadGeometry('macbook-journey.glb'), loadGeometry('station-projects.glb')]);
projects.root.position.fromArray(manifest.stations[4].origin); projects.root.updateMatrixWorld(true);
const sample = createHeroSampler(hero.root, hero.clip), dock = manifest.stations[4].dock, route = PROJECTS_MOTION;
const feet = hero.root.getObjectByName('Journey_TravelFeet')!, spin = hero.root.getObjectByName('Journey_MacBook_SpinPivot')!, lid = hero.root.getObjectByName('Journey_MacBook_LidPivot')!;
const readPose = (): LaptopPose => ({ position: feet.position.toArray(), quaternion: spin.quaternion.toArray(), lid: lid.quaternion.toArray() });
const baked = (time: number) => { sample(time); return readPose(); };
const incoming = baked(route.incomingReference), outgoing = baked(route.handoff);
const corrected = (time: number) => time >= route.handoff
  ? deskArrivalPose(time, outgoing, manifest.stations[5].dock)
  : projectsPose(time, baked(time), dock, incoming, outgoing);
function apply(pose: LaptopPose) {
  feet.position.fromArray(pose.position); spin.quaternion.fromArray(pose.quaternion); lid.quaternion.fromArray(pose.lid); hero.root.updateMatrixWorld(true);
}
function bounds(pose: LaptopPose, precise = false) {
  apply(pose);
  if (precise) return new Box3().setFromObject(hero.root, true);
  const box = new Box3(), point = new Vector3();
  for (const vertex of bodyHull) box.expandByPoint(point.copy(vertex).applyMatrix4(spin.matrixWorld));
  for (const vertex of lidHull) box.expandByPoint(point.copy(vertex).applyMatrix4(lid.matrixWorld));
  return box;
}
const parts = ['Housing', 'Screen', 'StandBase', 'StandStem'].map(part => ({ name: part, box: new Box3().setFromObject(projects.root.getObjectByName(`Projects_Personal_Ultrawide_${part}`)!, true) }));
const desktop = new Box3().setFromObject(projects.root.getObjectByName('Projects_Personal_Desktop')!, true);
function gap(a: Box3, b: Box3) {
  return Math.hypot(Math.max(0, a.min.x - b.max.x, b.min.x - a.max.x), Math.max(0, a.min.y - b.max.y, b.min.y - a.max.y), Math.max(0, a.min.z - b.max.z, b.min.z - a.max.z));
}
const angle = (a: number[], b: number[]) => new Quaternion().fromArray(a).angleTo(new Quaternion().fromArray(b));
const distance = (a: number[], b: number[]) => new Vector3().fromArray(a).distanceTo(new Vector3().fromArray(b));
function samePose(a: LaptopPose, b: LaptopPose, tolerance = 1e-7) {
  assert.ok(distance(a.position, b.position) < tolerance, 'position differs');
  assert.ok(angle(a.quaternion, b.quaternion) < tolerance, 'orientation differs');
  assert.ok(angle(a.lid, b.lid) < tolerance, 'lid differs');
}

// Bound every vertex's speed from the actual pivot radii and the interpolation
// derivatives. Expanding endpoint envelopes by speed * dt / 2 therefore covers
// the entire intervening motion, not only the sampled frames.
apply(dock);
const spinPoint = spin.getWorldPosition(new Vector3()), lidPoint = lid.getWorldPosition(new Vector3());
const bodyPoints: Vector3[] = [], lidPoints: Vector3[] = [], inverseSpin = spin.matrixWorld.clone().invert(), inverseLid = lid.matrixWorld.clone().invert();
let bodyRadius = 0, lidRadius = 0;
hero.root.traverse(object => {
  if (!(object instanceof Mesh)) return;
  let onLid = false; for (let parent: Object3D | null = object; parent; parent = parent.parent) if (parent === lid) onLid = true;
  const positions = object.geometry.getAttribute('position'), point = new Vector3();
  for (let i = 0; i < positions.count; i++) {
    point.fromBufferAttribute(positions, i).applyMatrix4(object.matrixWorld);
    if (onLid) { lidRadius = Math.max(lidRadius, point.distanceTo(lidPoint)); lidPoints.push(point.clone().applyMatrix4(inverseLid)); }
    else { bodyRadius = Math.max(bodyRadius, point.distanceTo(spinPoint)); bodyPoints.push(point.clone().applyMatrix4(inverseSpin)); }
  }
});
function hullVertices(points: Vector3[]) {
  const hull = new ConvexHull().setFromPoints(points), vertices = new Set<Vector3>();
  for (const face of hull.faces) { let edge = face.edge; do { vertices.add(edge.head().point); edge = edge.next; } while (edge !== face.edge); }
  return [...vertices];
}
const bodyHull = hullVertices(bodyPoints), lidHull = hullVertices(lidPoints);
const spinRadius = Math.max(bodyRadius, spinPoint.distanceTo(lidPoint) + lidRadius);
function trackLimits(name: string, start: number, end: number, reference?: number[]) {
  const track = hero.clip.tracks.find(track => track.name === name)!;
  const stride = track.getValueSize(); let speed = 0, maxStep = 0, theta = 0, offset = 0;
  const aligned = new Vector3(dock.position[0] + route.incomingSideOffset, incoming.position[1], dock.position[2] + route.forwardSlide);
  for (let i = 0; i < track.times.length - 1; i++) {
    if (track.times[i + 1] < start || track.times[i] > end) continue;
    const a = Array.from(track.values.slice(i * stride, (i + 1) * stride)), b = Array.from(track.values.slice((i + 1) * stride, (i + 2) * stride));
    const dt = track.times[i + 1] - track.times[i];
    speed = Math.max(speed, (stride === 3 ? distance(a, b) : angle(a, b)) / dt); maxStep = Math.max(maxStep, dt);
    if (stride === 3) offset = Math.max(offset, aligned.distanceTo(new Vector3().fromArray(a)), aligned.distanceTo(new Vector3().fromArray(b)));
    if (reference) for (const value of [a, b]) {
      const q = new Quaternion().fromArray(value).normalize(), anchor = new Quaternion().fromArray(reference);
      if (q.dot(anchor) < 0) q.set(-q.x, -q.y, -q.z, -q.w);
      // A stable reference hemisphere also guarantees the baked interpolation
      // cannot change quaternion branches between adjacent keys.
      assert.ok(q.dot(anchor) > .2, 'incoming quaternion escaped its reference hemisphere');
      const target = new Quaternion().fromArray(stride === 4 && /Lid/.test(name) ? dock.lid : dock.quaternion);
      theta = Math.max(theta, Math.acos(Math.min(1, Math.max(-1, q.dot(target)))));
    }
  }
  return { speed, offset, theta: theta + speed * maxStep / 2 };
}
const pLimit = trackLimits(`${feet.name}.position`, route.incomingBlendStart, route.incomingAligned);
const qLimit = trackLimits(`${spin.name}.quaternion`, route.incomingBlendStart, route.incomingAligned, incoming.quaternion);
const lLimit = trackLimits(`${lid.name}.quaternion`, route.incomingBlendStart, route.incomingAligned, incoming.lid);
const blendRate = 1.5 / (route.incomingAligned - route.incomingBlendStart);
function angularBound(limit: ReturnType<typeof trackLimits>) {
  assert.ok(limit.theta < Math.PI - .1, 'logarithm speed bound requires separation from the antipode');
  return limit.theta / Math.sin(limit.theta) * limit.speed + 2 * blendRate * limit.theta;
}
const incomingSpeedBound = pLimit.speed + blendRate * pLimit.offset + spinRadius * angularBound(qLimit) + lidRadius * angularBound(lLimit);
const prefixSpeedBound = trackLimits(`${feet.name}.position`, 12, route.incomingBlendStart).speed
  + spinRadius * trackLimits(`${spin.name}.quaternion`, 12, route.incomingBlendStart).speed
  + lidRadius * trackLimits(`${lid.name}.quaternion`, 12, route.incomingBlendStart).speed;
const slide: LaptopPose = { ...dock, position: [dock.position[0], dock.position[1], dock.position[2] + route.forwardSlide] };
const side: LaptopPose = { ...outgoing, position: [route.outgoingSideX, outgoing.position[1], slide.position[2]] };
const outgoingSpeedBound = 1.5 / (route.sideClear - route.slideEnd) * (distance(slide.position, side.position) + spinRadius * angle(slide.quaternion, side.quaternion) + lidRadius * angle(slide.lid, side.lid));
const resumeDock = manifest.stations[5].dock;
const resumeHover = [resumeDock.position[0], outgoing.position[1], resumeDock.position[2]];
const resumeSpeedBound = 1.5 / (DESK_ALIGNMENT_END - route.handoff) * (distance(outgoing.position, resumeHover) + spinRadius * angle(outgoing.quaternion, resumeDock.quaternion) + lidRadius * angle(outgoing.lid, resumeDock.lid));
const liftRotation = new Quaternion().fromArray(dock.quaternion).invert().multiply(new Quaternion().fromArray(outgoing.quaternion));
const axisLength = Math.hypot(liftRotation.x, liftRotation.y, liftRotation.z);
const horizontalAxis = Math.hypot(liftRotation.x, liftRotation.z) / axisLength;
const liftDownwardBound = spinRadius * angle(dock.quaternion, outgoing.quaternion) * horizontalAxis + lidRadius * angle(dock.lid, outgoing.lid);

test('the old baked Projects route actually overlaps the shipped monitor envelopes', () => {
  for (const time of [15.46, 16, 16.8]) {
    const box = bounds(baked(time), true);
    assert.ok(parts.some(part => box.intersectsBox(part.box)), `legacy route should reproduce monitor overlap at ${time}`);
  }
});

test('base and hinged-lid hulls reproduce all exported vertex extrema during turns', () => {
  for (const time of [route.incomingBlendStart, (route.incomingReference + route.incomingAligned) / 2, route.docked, (route.slideEnd + route.sideClear) / 2, route.handoff]) {
    const pose = corrected(time), envelope = bounds(pose), exact = bounds(pose, true);
    assert.ok(envelope.min.distanceTo(exact.min) < 1e-7 && envelope.max.distanceTo(exact.max) < 1e-7, `hull extrema disagree with the complete laptop at ${time}`);
  }
});

test('the corrected whole-laptop sweep keeps a 3 cm gap from every ultrawide component', () => {
  let minimum = Infinity, worstTime = 0, worstPart = '', minimumSwept = Infinity, sampled = 0;
  const stations = [12, route.incomingBlendStart, route.incomingAligned, route.incomingHover, route.docked, route.slideEnd, route.sideClear, route.handoff, DESK_ALIGNMENT_END, DESK_TOUCHDOWN, 20];
  for (let segment = 0; segment < stations.length - 1; segment++) {
    const start = stations[segment], end = stations[segment + 1], count = Math.ceil((end - start) * 1200);
    // Incoming blend and airborne turn rotate. Other stages have fixed rotations
    // and monotone straight translations, fully enclosed by their endpoint boxes.
    const speed = start === 12 ? prefixSpeedBound : start === route.incomingBlendStart ? incomingSpeedBound : start === route.slideEnd ? outgoingSpeedBound : start === route.handoff ? resumeSpeedBound : 0;
    let previous = bounds(corrected(start));
    for (let i = 1; i <= count; i++) {
      const time = start + (end - start) * i / count, box = bounds(corrected(time)); sampled++;
      const swept = previous.clone().union(box).expandByScalar(speed * (end - start) / count / 2);
      for (const part of parts) {
        const clearance = gap(box, part.box), sweptClearance = gap(swept, part.box);
        if (clearance < minimum) { minimum = clearance; worstTime = time; worstPart = part.name; }
        minimumSwept = Math.min(minimumSwept, sweptClearance);
        assert.ok(sweptClearance >= .03, `swept laptop gap from ${part.name} is ${(sweptClearance * 1000).toFixed(2)} mm at ${time}`);
      }
      const aboveDeskFootprint = swept.max.x >= desktop.min.x && swept.min.x <= desktop.max.x && swept.max.z >= desktop.min.z && swept.min.z <= desktop.max.z;
      if (start !== route.slideEnd && aboveDeskFootprint) assert.ok(swept.min.y >= desktop.max.y - .00001, `swept laptop sinks into desktop at ${time}`);
      previous = box;
    }
  }
  // During the lift, root rise exceeds the maximum downward displacement caused
  // by both rotations at every easing value, including arbitrarily near t=16.4.
  assert.ok(side.position[1] - slide.position[1] > liftDownwardBound, 'lift does not compensate its complete rotational envelope');
  assert.ok(bounds(slide).min.y > desktop.max.y, 'slide starts supported above the desktop');
  const slid = bounds(slide);
  assert.ok(slid.max.z < desktop.max.z && slid.min.x > desktop.min.x && slid.max.x < desktop.max.x, 'forward slide must remain on the desk');
  fs.mkdirSync('test-results/projects-clearance', { recursive: true });
  fs.writeFileSync('test-results/projects-clearance/report.json', JSON.stringify({ method: 'Exact extrema of exported laptop base/lid convex hull vertices; continuous conservative swept coverage from analytic vertex-speed bounds during rotation and exact endpoint envelopes for monotone translations. Monitor housing, screen, stem and foot each retain a separate enclosing world box. This proves separation from these enclosing monitor volumes over 12–20 seconds.', timeRange: [12, 20], sampledIntervals: sampled, hullVertices: { body: bodyHull.length, lid: lidHull.length }, minimumSampledClearanceMm: minimum * 1000, minimumGuaranteedSweptClearanceMm: minimumSwept * 1000, worstTime, worstPart, spinRadius, lidRadius, prefixSpeedBound, incomingSpeedBound, outgoingSpeedBound, resumeSpeedBound, liftRise: side.position[1] - slide.position[1], maximumRotationDrop: liftDownwardBound, forwardSlideFrontMarginMm: (desktop.max.z - slid.max.z) * 1000 }, null, 2));
});

test('Projects docking and departure are canonical, with fixed orientation during both vertical landing and the forward slide', () => {
  samePose(corrected(route.docked), dock);
  for (let i = 0; i <= 100; i++) {
    const landing = corrected(route.incomingHover + (route.docked - route.incomingHover) * i / 100), departing = corrected(route.docked + (route.slideEnd - route.docked) * i / 100);
    assert.ok(Math.abs(landing.position[0] - dock.position[0]) < 1e-8 && Math.abs(landing.position[2] - dock.position[2]) < 1e-8);
    for (const pose of [landing, departing]) { assert.ok(angle(pose.quaternion, dock.quaternion) < 1e-7); assert.ok(angle(pose.lid, dock.lid) < 1e-7); }
    assert.ok(Math.abs(departing.position[1] - dock.position[1]) < 1e-8);
  }
  samePose(projectsPose(route.handoff, baked(route.handoff), dock, incoming, outgoing), outgoing);
  samePose(corrected(route.handoff), outgoing);
  for (const time of [18, 18.4, 19, 19.3, 19.6, 20]) samePose(corrected(time), deskArrivalPose(time, outgoing, manifest.stations[5].dock));
});

test('all joins have continuous pose and speed, and reverse/direct seeks preserve dimensions', () => {
  const h = .00001;
  for (const time of [route.incomingAligned, route.incomingHover, route.docked, route.slideEnd, route.sideClear, route.handoff]) {
    const before = corrected(time - h), at = corrected(time), after = corrected(time + h);
    assert.ok(distance(before.position, after.position) / (2 * h) < .001, `position velocity at ${time}`);
    for (const key of ['quaternion', 'lid'] as const) assert.ok(angle(before[key], after[key]) / (2 * h) < .01, `${key} velocity at ${time}`);
    samePose(before, at, 1e-7); samePose(after, at, 1e-7);
  }
  const first = PROJECTS_MOTION.incomingBlendStart;
  samePose(corrected(first), baked(first));
  const delta = new Vector3().fromArray(corrected(first + h).position).sub(new Vector3().fromArray(baked(first + h).position));
  assert.ok(delta.length() / h < .001, 'incoming correction must join the original sampled velocity');
  const times = Array.from({ length: 241 }, (_, i) => 12 + i / 30), forward = times.map(time => corrected(time));
  for (let i = times.length - 1; i >= 0; i--) samePose(corrected(times[i]), forward[i]);
  for (const i of [140, 20, 150, 130, 160, 239, 0]) samePose(corrected(times[i]), forward[i]);
  for (const time of [12, 13, 13.59, 20.1]) samePose(projectsPose(time, baked(time), dock, incoming, outgoing), baked(time));
  assert.deepEqual(hero.root.scale.toArray(), [1, 1, 1]);
  fs.mkdirSync('test-results/projects-clearance', { recursive: true });
  fs.writeFileSync('test-results/projects-clearance/poses.json', JSON.stringify({ fps: 30, frames: times.map((time, i) => ({ time, ...forward[i] })) }, null, 2));
});
