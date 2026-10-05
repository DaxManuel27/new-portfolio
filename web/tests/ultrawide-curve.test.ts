import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { NodeIO } from '@gltf-transform/core';
import { ALL_EXTENSIONS } from '@gltf-transform/extensions';
import { dequantize } from '@gltf-transform/functions';
import { MeshoptDecoder } from 'meshoptimizer';
import { Matrix4, Vector3 } from 'three';
import { parseGradients, previewGeometry, resolveStops, splitTop } from '../src/reel-preview';
import { portalSize } from '../src/camera';
import type { Manifest } from '../src/types';

const manifest: Manifest = JSON.parse(readFileSync('public/assets/journey.json', 'utf8'));
const frame = manifest.reorder.ultrawide.screen;

/** World-space positions and UVs of the ultrawide display in the shipped asset. */
async function display() {
  await MeshoptDecoder.ready;
  const io = new NodeIO().registerExtensions(ALL_EXTENSIONS).registerDependencies({ 'meshopt.decoder': MeshoptDecoder });
  const doc = await io.read('public/assets/station-projects.glb'); await doc.transform(dequantize());
  const node = doc.getRoot().listNodes().find(n => n.getName() === 'Screen_Ultrawide_Projects')!;
  const primitive = node.getMesh()!.listPrimitives()[0], matrix = new Matrix4().fromArray(node.getWorldMatrix());
  const origin = new Vector3().fromArray(manifest.stations[4].origin);
  const position = primitive.getAttribute('POSITION')!, uv = primitive.getAttribute('TEXCOORD_0')!;
  return Array.from({ length: position.getCount() }, (_, i) => ({
    p: new Vector3().fromArray(position.getElement(i, [])).applyMatrix4(matrix).add(origin),
    uv: uv.getElement(i, []) as number[],
  }));
}

test('the ultrawide display is a circular arc concentric with the housing curve, not a flat quad', async () => {
  const verts = await display(), curvature = frame.curvature!;
  assert.ok(curvature, 'manifest records the display curvature');
  assert.ok(verts.length >= 2 * (curvature.segments + 1), 'arc has one vertex column per segment');
  // Fit a circle in the horizontal (x, z) plane; the curve's centre sits in front of the monitor (+z).
  const xs = verts.map(v => v.p.x), zs = verts.map(v => v.p.z);
  const cx = (Math.min(...xs) + Math.max(...xs)) / 2, zMid = verts.reduce((best, v) => Math.abs(v.p.x - cx) < Math.abs(best.p.x - cx) ? v : best).p.z;
  const zEdge = verts.reduce((best, v) => v.p.x < best.p.x ? v : best).p.z, half = (Math.max(...xs) - Math.min(...xs)) / 2;
  const sagitta = zEdge - zMid, radius = (half * half + sagitta * sagitta) / (2 * sagitta), cz = zMid + radius;
  assert.ok(Math.abs(sagitta - curvature.sagitta) < 1e-3, `sagitta ${sagitta} vs ${curvature.sagitta}`);
  assert.ok(Math.abs(radius - curvature.radius) < 5e-3, `radius ${radius} vs ${curvature.radius}`);
  for (const v of verts) assert.ok(Math.abs(Math.hypot(v.p.x - cx, v.p.z - cz) - radius) < 5e-4, `vertex off the arc at x=${v.p.x}`);
  assert.ok(Math.abs(Math.max(...xs) - Math.min(...xs) - frame.width) < 1e-3, 'chord width matches the manifest frame');
});

test('display UVs are chord-uniform, so the straight-on end of the zoom matches a flat page', async () => {
  const verts = await display(), xs = verts.map(v => v.p.x), x0 = Math.min(...xs), x1 = Math.max(...xs);
  for (const v of verts) assert.ok(Math.abs(v.uv[0] - (v.p.x - x0) / (x1 - x0)) < 2e-3, `u not linear in x at ${v.p.x}`);
  const ys = verts.map(v => v.p.y), y0 = Math.min(...ys);
  // glTF V runs top-down: the top edge is v = 0.
  for (const v of verts) assert.ok(Math.abs(v.uv[1] - (v.p.y - y0 < 1e-4 ? 1 : 0)) < 2e-3, 'v is 0 at the top edge and 1 at the bottom');
  // The manifest centre is the chord rectangle's centre (where the camera ends straight on).
  const centre = new Vector3().fromArray(frame.center);
  assert.ok(Math.abs(centre.x - (x0 + x1) / 2) < 1e-3 && Math.abs(centre.y - (y0 + Math.max(...ys)) / 2) < 1e-3, 'manifest centre is the chord centre');
});

test('the painted preview is laid out in the same viewport-shaped portal the camera ends on', () => {
  for (const viewport of [{ width: 1440, height: 900 }, { width: 2560, height: 1080 }, { width: 390, height: 844 }]) {
    const g = previewGeometry(frame, viewport), portal = portalSize(frame, viewport.width / viewport.height);
    assert.ok(Math.abs(g.portal.width / g.width - portal.width / frame.width) < 1e-9, 'portal width fraction');
    assert.ok(Math.abs(g.portal.height / g.height - portal.height / frame.height) < 1e-3, 'portal height fraction');
    assert.ok(Math.abs(g.portal.x * 2 + g.portal.width - g.width) < 1e-6 && Math.abs(g.portal.y * 2 + g.portal.height - g.height) < 1e-6, 'centred');
    assert.ok(Math.abs(g.portal.width / g.portal.height - viewport.width / viewport.height) < .01, 'viewport aspect');
    assert.ok(Math.abs(g.scale * viewport.width - g.portal.width) < 1e-6, 'CSS-to-texture scale');
  }
});

test('computed gradient serialisations are parsed into the same stops CSS uses', () => {
  assert.deepEqual(splitTop('a(1, 2), b(3), c'), ['a(1, 2)', 'b(3)', 'c']);
  const stage = parseGradients('radial-gradient(at 50% 56%, rgb(34, 28, 21) 0px, rgb(19, 18, 17) 38%, rgb(16, 16, 16) 72%)');
  assert.equal(stage.length, 1); assert.equal(stage[0].kind, 'radial'); assert.match(stage[0].config, /at 50% 56%/);
  assert.deepEqual(resolveStops(stage[0].stops, 100).map(s => +s.offset.toFixed(4)), [0, .38, .72]);
  const media = parseGradients('repeating-linear-gradient(135deg, rgba(255, 255, 255, 0.024) 0px, rgba(255, 255, 255, 0.024) 14px, rgba(0, 0, 0, 0) 14px, rgba(0, 0, 0, 0) 28px), radial-gradient(at 50% 30%, rgb(44, 38, 32) 0px, rgb(26, 24, 22) 70%)');
  assert.deepEqual(media.map(l => l.kind), ['repeating-linear', 'radial']);
  assert.equal(media[0].stops.length, 4); assert.equal(media[0].stops[3].px, 28);
  assert.deepEqual(resolveStops([{ color: 'red' }, { color: 'blue', fraction: .5 }, { color: 'green' }], 10).map(s => s.offset), [0, .5, 1]);
});
