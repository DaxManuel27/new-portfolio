import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { NodeIO, type Document, type Node, type Primitive } from '@gltf-transform/core';
import { ALL_EXTENSIONS } from '@gltf-transform/extensions';
import { dequantize } from '@gltf-transform/functions';
import { MeshoptDecoder } from 'meshoptimizer';
import { Box3, Matrix3, Matrix4, Ray, Vector3 } from 'three';

const WIDTH = .2159, LENGTH = .2794, MIN_CLEARANCE = .0002;
const EPS = 1e-10, CELL = .01;
type Point2 = { x: number; z: number };
interface Triangle { vertices: Vector3[]; box: Box3; denominator: number; name: string }
interface PaperPrimitive { node: Node; primitive: Primitive; matrix: Matrix4; rows: number[][] }
interface Fixture {
  name: string; paper: Document; paperMeshes: PaperPrimitive[]; supports: Triangle[]; rims: Triangle[];
  grid: Map<string, number[]>; slot: Vector3; anchor: Matrix4; duration: number; keys: number;
}
const io = new NodeIO().registerExtensions(ALL_EXTENSIONS).registerDependencies({ 'meshopt.decoder': MeshoptDecoder });
async function read(filename: string) { const document = await io.read(filename); await document.transform(dequantize()); return document; }
const requiredNode = (document: Document, pattern: RegExp) => {
  const node = document.getRoot().listNodes().find(node => pattern.test(node.getName()));
  assert.ok(node, `Missing exported node ${pattern}`); return node;
};
function triangle(vertices: Vector3[], name: string): Triangle {
  const [a, b, c] = vertices;
  return { vertices, name, box: new Box3().setFromPoints(vertices), denominator: (b.x - a.x) * (c.z - a.z) - (b.z - a.z) * (c.x - a.x) };
}
function nodeTriangles(node: Node, toLocal: Matrix4): Triangle[] {
  const result: Triangle[] = [];
  node.traverse(child => {
    const matrix = toLocal.clone().multiply(new Matrix4().fromArray(child.getWorldMatrix()));
    for (const primitive of child.getMesh()?.listPrimitives() ?? []) {
      const position = primitive.getAttribute('POSITION')!.getArray()!, indices = primitive.getIndices()?.getArray();
      const count = indices?.length ?? position.length / 3;
      for (let i = 0; i < count; i += 3) result.push(triangle([0, 1, 2].map(k => new Vector3().fromArray(position, (indices?.[i + k] ?? i + k) * 3).applyMatrix4(matrix)), child.getName()));
    }
  });
  return result;
}
function gridKeys(box: Box3) {
  const keys: string[] = [];
  for (let x = Math.floor(box.min.x / CELL); x <= Math.floor(box.max.x / CELL); x++)
    for (let z = Math.floor(box.min.z / CELL); z <= Math.floor(box.max.z / CELL); z++) keys.push(`${x},${z}`);
  return keys;
}
function edgeRows(primitive: Primitive): number[][] {
  const uv = primitive.getAttribute('TEXCOORD_0');
  assert.ok(uv, 'Paper must retain its résumé UV coordinates');
  const values = uv.getArray()!, groups = new Map<number, number[]>();
  for (let i = 0; i < uv.getCount(); i++) if (Math.abs(values[i * 2]) < .0001) {
    const key = Math.round(values[i * 2 + 1] * 100000);
    if (!groups.has(key)) groups.set(key, []); groups.get(key)!.push(i);
  }
  return [...groups].sort(([a], [b]) => a - b).map(([, indices]) => indices);
}
async function fixture(name: string, paperFile: string, deskFile: string): Promise<Fixture> {
  const [paper, desk] = await Promise.all([read(paperFile), read(deskFile)]);
  const printer = requiredNode(desk, /Shared_Resume_Prop_Printer$/), paperAnchor = requiredNode(desk, /PaperAnchor$/), slotAnchor = requiredNode(desk, /SlotAnchor$/);
  const printerInverse = new Matrix4().fromArray(printer.getWorldMatrix()).invert();
  const anchor = printerInverse.clone().multiply(new Matrix4().fromArray(paperAnchor.getWorldMatrix()));
  const slot = new Vector3().setFromMatrixPosition(printerInverse.clone().multiply(new Matrix4().fromArray(slotAnchor.getWorldMatrix())));
  const supports = [requiredNode(desk, /\.OutputTray$/), requiredNode(desk, /\.TrayEdge$/), requiredNode(desk, /Shared_Resume_Desk_Station\.Top$/)]
    .flatMap(node => nodeTriangles(node, printerInverse)).filter(t => t.denominator < -EPS);
  const rims = [requiredNode(desk, /\.OutputSlot$/), requiredNode(desk, /\.OutputRim$/)].flatMap(node => nodeTriangles(node, printerInverse));
  assert.ok(supports.some(t => /OutputTray$/.test(t.name)) && supports.some(t => /TrayEdge$/.test(t.name)), 'Actual upward tray/rim triangles are required');
  const grid = new Map<string, number[]>();
  supports.forEach((t, index) => { for (const key of gridKeys(t.box)) { if (!grid.has(key)) grid.set(key, []); grid.get(key)!.push(index); } });
  const paperMeshes = paper.getRoot().listNodes().flatMap(node => (node.getMesh()?.listPrimitives() ?? []).map(primitive => ({ node, primitive, matrix: anchor.clone().multiply(new Matrix4().fromArray(node.getWorldMatrix())), rows: edgeRows(primitive) })));
  assert.ok(paperMeshes.length > 0, 'Paper mesh is required');
  const channels = paper.getRoot().listAnimations().flatMap(a => a.listChannels());
  assert.ok(channels.length > 0 && channels.every(c => c.getTargetPath() === 'weights'), 'Paper deformation should be a baked morph animation');
  const times = channels[0].getSampler()!.getInput()!.getArray()!;
  return { name, paper, paperMeshes, supports, rims, grid, slot, anchor, duration: times[times.length - 1], keys: times.length };
}
function weightsAt(f: Fixture, node: Node, time: number) {
  const channel = f.paper.getRoot().listAnimations().flatMap(a => a.listChannels()).find(c => c.getTargetNode() === node);
  if (!channel) return node.getWeights().length ? node.getWeights() : node.getMesh()!.getWeights();
  const sampler = channel.getSampler()!, times = sampler.getInput()!.getArray()!, values = sampler.getOutput()!.getArray()!;
  assert.equal(sampler.getInterpolation(), 'LINEAR', 'Clearance evaluator expects linearly interpolated baked keys');
  const count = values.length / times.length;
  let lo = 0, hi = times.length - 1;
  while (lo < hi - 1) { const mid = (lo + hi) >>> 1; if (times[mid] <= time) lo = mid; else hi = mid; }
  const mix = Math.max(0, Math.min(1, (time - times[lo]) / (times[hi] - times[lo])));
  return Array.from({ length: count }, (_, i) => values[lo * count + i] * (1 - mix) + values[hi * count + i] * mix);
}
function sample(f: Fixture, time: number) {
  const triangles: Triangle[] = [], box = new Box3(); let length = 0, normalDotMin = 1;
  for (const mesh of f.paperMeshes) {
    const base = mesh.primitive.getAttribute('POSITION')!.getArray()!, weights = weightsAt(f, mesh.node, time);
    const targets = mesh.primitive.listTargets().flatMap((target, i) => Math.abs(weights[i] ?? 0) > 1e-8 ? [{ values: target.getAttribute('POSITION')!.getArray()!, normals: target.getAttribute('NORMAL')?.getArray(), weight: weights[i] }] : []);
    const vertices = Array.from({ length: base.length / 3 }, (_, i) => {
      const p = new Vector3().fromArray(base, i * 3);
      for (const target of targets) { p.x += target.values[i * 3] * target.weight; p.y += target.values[i * 3 + 1] * target.weight; p.z += target.values[i * 3 + 2] * target.weight; }
      p.applyMatrix4(mesh.matrix); box.expandByPoint(p); return p;
    });
    const baseNormals = mesh.primitive.getAttribute('NORMAL')?.getArray();
    assert.ok(baseNormals, `${f.name}: paper must export surface normals`);
    const normalMatrix = new Matrix3().getNormalMatrix(mesh.matrix);
    const normals = vertices.map((_, i) => {
      const normal = new Vector3().fromArray(baseNormals, i * 3);
      for (const target of targets) if (target.normals) {
        normal.x += target.normals[i * 3] * target.weight; normal.y += target.normals[i * 3 + 1] * target.weight; normal.z += target.normals[i * 3 + 2] * target.weight;
      }
      assert.ok(Number.isFinite(normal.lengthSq()) && normal.lengthSq() > .001, `${f.name}: invalid deformed normal at ${time}`);
      return normal.applyMatrix3(normalMatrix).normalize();
    });
    const indices = mesh.primitive.getIndices()?.getArray(), count = indices?.length ?? vertices.length;
    for (let i = 0; i < count; i += 3) {
      const ids = [0, 1, 2].map(k => indices?.[i + k] ?? i + k), points = ids.map(index => vertices[index]);
      const normal = points[1].clone().sub(points[0]).cross(points[2].clone().sub(points[0])).normalize();
      normalDotMin = Math.min(normalDotMin, ...ids.map(index => normal.dot(normals[index])));
      triangles.push(triangle(points, mesh.node.getName()));
    }
    if (mesh.rows.length > 10) {
      const edge = mesh.rows.map(indices => indices.reduce((sum, index) => sum.add(vertices[index]), new Vector3()).multiplyScalar(1 / indices.length));
      const edgeLength = edge.slice(1).reduce((sum, p, i) => sum + p.distanceTo(edge[i]), 0);
      length = Math.max(length, edgeLength);
    }
  }
  return { triangles, box, length, normalDotMin };
}
function clip(polygon: Point2[], signedDistance: (point: Point2) => number): Point2[] {
  const result: Point2[] = [];
  for (let i = 0; i < polygon.length; i++) {
    const a = polygon[i], b = polygon[(i + 1) % polygon.length], da = signedDistance(a), db = signedDistance(b);
    if (da >= -EPS) result.push(a);
    if ((da < 0) !== (db < 0)) { const t = da / (da - db); result.push({ x: a.x + (b.x - a.x) * t, z: a.z + (b.z - a.z) * t }); }
  }
  return result;
}
function overlap(paper: Triangle, support: Triangle, slotZ: number) {
  let polygon: Point2[] = clip(paper.vertices.map(({ x, z }) => ({ x, z })), p => p.z - slotZ);
  const orientation = Math.sign(support.denominator);
  for (let i = 0; i < 3 && polygon.length; i++) {
    const a = support.vertices[i], b = support.vertices[(i + 1) % 3];
    polygon = clip(polygon, p => orientation * ((b.x - a.x) * (p.z - a.z) - (b.z - a.z) * (p.x - a.x)));
  }
  return polygon;
}
function height(t: Triangle, p: Point2) {
  const [a, b, c] = t.vertices;
  const u = ((p.x - a.x) * (c.z - a.z) - (p.z - a.z) * (c.x - a.x)) / t.denominator;
  const v = ((b.x - a.x) * (p.z - a.z) - (b.z - a.z) * (p.x - a.x)) / t.denominator;
  return a.y + u * (b.y - a.y) + v * (c.y - a.y);
}
const ray = new Ray(), direction = new Vector3(), hit = new Vector3();
function segmentsHit(a: Triangle, b: Triangle) {
  for (let i = 0; i < 3; i++) {
    const start = a.vertices[i], end = a.vertices[(i + 1) % 3], distance = start.distanceTo(end);
    if (distance < EPS) continue;
    ray.set(start, direction.copy(end).sub(start).multiplyScalar(1 / distance));
    if (ray.intersectTriangle(b.vertices[0], b.vertices[1], b.vertices[2], false, hit) && hit.distanceTo(start) < distance + 1e-9) return true;
  }
  return false;
}
interface ClearanceReport { name: string; samples: number; bakedKeys: number; triangleOverlapChecks: number; minClearanceMm: number; worstSurface: string; worstTime: number; widthErrorMm: number; lengthErrorMm: number; normalDotMin: number; slotTriangleTests: number; slotBoundsTests: number; surfaces: Record<string, { minimumMm: number; time: number; overlapPoints: number }>; maxSourceDeviationMm?: number }
function inspect(f: Fixture): ClearanceReport {
  const result: ClearanceReport = { name: f.name, samples: 0, bakedKeys: f.keys, triangleOverlapChecks: 0, minClearanceMm: Infinity, worstSurface: '', worstTime: 0, widthErrorMm: 0, lengthErrorMm: 0, normalDotMin: 1, slotTriangleTests: 0, slotBoundsTests: 0, surfaces: {} };
  // Quarter-frame sampling includes the original failure around 1.54 s and all
  // interpolation intervals. Clipped triangle overlap also checks sheet interiors.
  for (let i = 0; i <= 480; i++) {
    const time = i / 120, paper = sample(f, time); result.samples++;
    result.widthErrorMm = Math.max(result.widthErrorMm, Math.abs(paper.box.max.x - paper.box.min.x - WIDTH) * 1000);
    result.lengthErrorMm = Math.max(result.lengthErrorMm, Math.abs(paper.length - LENGTH) * 1000);
    result.normalDotMin = Math.min(result.normalDotMin, paper.normalDotMin);
    for (const t of paper.triangles) {
      if (t.box.max.z >= f.slot.z && Math.abs(t.denominator) > EPS) {
        const candidates = new Set(gridKeys(t.box).flatMap(key => f.grid.get(key) ?? []));
        for (const index of candidates) {
          const support = f.supports[index];
          if (t.box.max.x < support.box.min.x || t.box.min.x > support.box.max.x || t.box.max.z < support.box.min.z || t.box.min.z > support.box.max.z) continue;
          const polygon = overlap(t, support, f.slot.z);
          for (const point of polygon) {
            const gap = height(t, point) - height(support, point); result.triangleOverlapChecks++;
            if (gap * 1000 < result.minClearanceMm) { result.minClearanceMm = gap * 1000; result.worstSurface = support.name; result.worstTime = time; }
            const surface = result.surfaces[support.name] ??= { minimumMm: Infinity, time: 0, overlapPoints: 0 };
            surface.overlapPoints++;
            if (gap * 1000 < surface.minimumMm) { surface.minimumMm = gap * 1000; surface.time = time; }
          }
        }
      }
      result.slotBoundsTests += f.rims.length;
      for (const rim of f.rims) if (t.box.intersectsBox(rim.box)) {
        result.slotTriangleTests++;
        assert.ok(!segmentsHit(t, rim) && !segmentsHit(rim, t), `${f.name}: sheet intersects ${rim.name} at ${time}s`);
      }
    }
  }
  assert.ok(result.triangleOverlapChecks > 1000, `${f.name}: insufficient exposed-sheet coverage`);
  assert.ok(result.minClearanceMm >= MIN_CLEARANCE * 1000, `${f.name}: paper clearance ${result.minClearanceMm.toFixed(4)} mm above ${result.worstSurface} at ${result.worstTime}s; require ${MIN_CLEARANCE * 1000} mm`);
  assert.ok(result.widthErrorMm < .2, `${f.name}: sheet width changed ${result.widthErrorMm.toFixed(4)} mm`);
  assert.ok(result.lengthErrorMm < .6, `${f.name}: sheet length changed ${result.lengthErrorMm.toFixed(4)} mm`);
  assert.ok(result.normalDotMin > 0, `${f.name}: a deformed paper normal faces behind its triangle (${result.normalDotMin})`);
  for (const suffix of ['OutputTray', 'TrayEdge', 'Top']) assert.ok(Object.keys(result.surfaces).some(name => name.endsWith(suffix)), `${f.name}: no exposed-paper checks against ${suffix}`);
  return result;
}

await MeshoptDecoder.ready;
const fixtures = await Promise.all([
  fixture('source', '../exports/completion/printer-paper-feed.glb', '../exports/shared-desk/station-shared.glb'),
  fixture('optimized', 'public/assets/printer-paper-feed.glb', 'public/assets/station-resume.glb'),
]);
const report: ClearanceReport[] = [];
test('paper is exported relative to the named printer anchor with a four-second dense morph bake', () => {
  for (const f of fixtures) {
    const position = new Vector3().setFromMatrixPosition(f.anchor);
    assert.ok(position.length() < 1e-6, `${f.name}: PaperAnchor must use printer-local zero`);
    assert.ok(Math.abs(f.slot.z - .107) < .0001 && Math.abs(f.slot.y - .069) < .0001, `${f.name}: slot anchor must identify the real output mouth`);
    assert.ok(Math.abs(f.duration - 4) < 1e-6 && f.keys >= 121, `${f.name}: feed needs four seconds at 30fps`);
    for (const mesh of f.paperMeshes) assert.ok(Math.abs(new Vector3().setFromMatrixPosition(mesh.matrix).x) < .001, `${f.name}: paper must be centered on printer-local X`);
  }
});
for (const f of fixtures) test(`${f.name} paper clears actual tray, raised rim, slot borders and desktop between baked frames`, () => { report.push(inspect(f)); });
test('optimized deformation preserves the uncompressed sheet path', () => {
  let maxDeviation = 0;
  for (let i = 0; i <= 240; i++) {
    const source = sample(fixtures[0], i / 60), optimized = sample(fixtures[1], i / 60);
    maxDeviation = Math.max(maxDeviation, source.box.min.distanceTo(optimized.box.min), source.box.max.distanceTo(optimized.box.max), Math.abs(source.length - optimized.length));
  }
  assert.ok(maxDeviation < .0001, `Optimization shifted the paper by ${(maxDeviation * 1000).toFixed(4)} mm`);
  if (report[1]) report[1].maxSourceDeviationMm = maxDeviation * 1000;
  fs.mkdirSync('test-results/printer-clearance', { recursive: true });
  fs.writeFileSync('test-results/printer-clearance/report.json', JSON.stringify({ method: 'Actual exported triangle overlap clipped in printer-local XZ, evaluating minimum vertical separation over each overlap polygon; edge/triangle intersections against slot borders; 481 times including quarter frames.', requiredClearanceMm: MIN_CLEARANCE * 1000, expectedWidthMm: WIDTH * 1000, expectedLengthMm: LENGTH * 1000, report }, null, 2));
});
