import { existsSync } from 'node:fs';
if (existsSync(new URL('../../exports/station-reorder/layout.json', import.meta.url))) {
  await import('./prepare-station-reorder.mjs');
  process.exit(0);
}
import { NodeIO } from '@gltf-transform/core';
import { ALL_EXTENSIONS } from '@gltf-transform/extensions';
import { prune, dedup, meshopt, textureCompress } from '@gltf-transform/functions';
import { MeshoptEncoder, MeshoptDecoder } from 'meshoptimizer';
import sharp from 'sharp';
import { Matrix4, Quaternion, Euler, Vector3 } from 'three';
import { readFile, writeFile, mkdir, copyFile, stat } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const root = fileURLToPath(new URL('../../', import.meta.url));
const source = path.join(root, 'exports/completion');
const out = path.join(root, 'exports/web');
const pub = path.join(root, 'web/public/assets');
await mkdir(out, { recursive: true }); await mkdir(pub, { recursive: true });
await MeshoptEncoder.ready; await MeshoptDecoder.ready;
const io = new NodeIO().registerExtensions(ALL_EXTENSIONS).registerDependencies({ 'meshopt.encoder': MeshoptEncoder, 'meshopt.decoder': MeshoptDecoder });
const names = ['Intro', 'Hack Atlantic', 'Formula SAE', 'Ultra Maritime', 'Projects', 'Resume', 'Contact'];
const ids = ['intro', 'hack-atlantic', 'formula-sae', 'ultra-maritime', 'projects', 'resume', 'contact'];
const authored = JSON.parse(await readFile(path.join(out, 'blender-stations.json'), 'utf8'));
const shared = JSON.parse(await readFile(path.join(root, 'exports/shared-desk/layout.json'), 'utf8'));
const runtime = JSON.parse(await readFile(path.join(source, 'motion-runtime.json'), 'utf8'));
const intro = JSON.parse(await readFile(path.join(root, 'web/src/intro-config.json'), 'utf8'));
const C = new Matrix4().makeRotationX(-Math.PI / 2);
const CQ = new Quaternion().setFromRotationMatrix(C);
const v = a => new Vector3(...a).applyMatrix4(C).toArray();
function camera(matrix, width, offset) {
  const m = new Matrix4().set(...matrix.flat()).premultiply(C);
  const p = new Vector3(), q = new Quaternion(), s = new Vector3(); m.decompose(p, q, s); p.x += offset;
  return { position: p.toArray(), quaternion: q.toArray(), width };
}
const receipt = [];
async function optimize(doc, filename, originalBytes) {
  await doc.transform(prune({ keepLeaves: true, keepExtras: false }), dedup(),
    textureCompress({ encoder: sharp, targetFormat: 'webp', slots: /^(baseColorTexture|emissiveTexture)$/, resize: [2048, 2048], lossless: true }),
    textureCompress({ encoder: sharp, targetFormat: 'webp', slots: /^(normalTexture|metallicRoughnessTexture|occlusionTexture)$/, resize: [2048, 2048], lossless: true }),
    meshopt({ encoder: MeshoptEncoder, level: 'medium', quantizePosition: 16, quantizeNormal: 12, quantizeTexcoord: 16 }));
  const data = await io.writeBinary(doc);
  await writeFile(path.join(out, filename), data); await writeFile(path.join(pub, filename), data);
  receipt.push({ filename, originalBytes, bytes: data.length, meshes: doc.getRoot().listMeshes().length, animations: doc.getRoot().listAnimations().length });
  console.log(filename, (data.length / 1e6).toFixed(2) + ' MB');
}
const stations = [];
for (let i = 0; i < names.length; i++) {
  const filename = `station-${ids[i]}.glb`;
  const sourceFile = i >= 5 ? path.join(root, 'exports/shared-desk/station-shared.glb') : path.join(source, filename);
  const doc = await io.read(sourceFile);
  const offset = i >= 5 ? 10 : i * 2;
  const hero = doc.getRoot().listNodes().find(n => /MacBook_TravelRoot$/.test(n.getName()));
  if (!hero) throw new Error('Missing hero hierarchy: ' + filename);
  const hinge = doc.getRoot().listNodes().find(n => /MacBook_LidPivot$/.test(n.getName()));
  const p = hero.getWorldTranslation(); p[0] += offset; p[1] -= .009483764;
  const dock = { position: p, quaternion: hero.getWorldRotation(), lid: hinge.getRotation() };
  const remove = []; hero.traverse(n => remove.push(n));
  if (i >= 5) for (const n of doc.getRoot().listNodes()) if (/PaperFeed_Sheet|Resume_Page/.test(n.getName())) remove.push(n);
  for (const n of new Set(remove.reverse())) n.dispose();
  const cams = Object.entries(authored[names[i]].cameras);
  const wide = cams.find(([key]) => key.endsWith('Wide'))[1];
  const close = cams.find(([key]) => /StraightOn$|Birdseye$/.test(key))?.[1] ?? wide;
  stations.push({ id: ids[i], name: names[i], origin: [offset, 0, 0], dock, wide: camera(wide.matrix_world, wide.width, offset), close: camera(close.matrix_world, close.width, offset), hasClose: i !== 0 && i !== 2, asset: filename, poster: `${ids[i]}.webp` });
  if (i >= 5) {
    const station = stations[i], focus = i === 5 ? shared.resume : shared.contact;
    const overhead = pose => ({position: [offset + pose.x, 2, -pose.y], quaternion: [-Math.SQRT1_2, 0, 0, Math.SQRT1_2], width: pose.width, ...(pose.minHeight ? {minHeight: pose.minHeight} : {})});
    station.close = overhead(focus); station.wide = overhead(shared.overview);
  }
  await optimize(doc, filename, (await stat(sourceFile)).size);
  const posterSource = i >= 5 ? path.join(root, `exports/shared-desk/${ids[i]}-poster.png`) : i === 0 ? path.join(out, 'intro-floating.png') : path.join(root, `blender/previews/completion/${ids[i]}-wide.png`);
  await sharp(posterSource).webp({ quality: 90, lossless: i === 0 }).toFile(path.join(pub, `${ids[i]}.webp`));
}
await sharp(path.join(root, 'exports/shared-desk/resume-printed-poster.png')).webp({ quality: 90 }).toFile(path.join(pub, 'resume-printed.webp'));
for (const filename of ['macbook-journey.glb', 'printer-paper-feed.glb']) await optimize(await io.read(path.join(source, filename)), filename, (await stat(path.join(source, filename))).size);
const travel = runtime.frames.map(row => ({
  frame: row.frame, position: v(row.camera_position),
  quaternion: CQ.clone().multiply(new Quaternion().setFromEuler(new Euler(...row.camera_rotation_euler, 'XYZ'))).toArray(),
  width: row.ortho_width, center: row.subject_center, opacity: row.station_opacity,
}));
const manifest = { version: 2, fps: 30, intro, stations, travel, source: 'Figma handoff + completed Blender animation', note: 'Floating Intro starts at the reference pose, then rejoins the first flight. FSAE mechanical anchors are conceptual.' };
for (const directory of [out, pub]) await writeFile(path.join(directory, 'journey.json'), JSON.stringify(manifest));
await writeFile(path.join(out, 'asset-report.json'), JSON.stringify(receipt, null, 2));
console.log('Total GLB bytes:', receipt.reduce((sum, x) => sum + x.bytes, 0));
