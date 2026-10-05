// Rebuild approved screen artwork and embed it in the source and shipped workstation.
import { NodeIO } from '@gltf-transform/core';
import { ALL_EXTENSIONS } from '@gltf-transform/extensions';
import { MeshoptDecoder, MeshoptEncoder } from 'meshoptimizer';
import { readFile, writeFile } from 'node:fs/promises';
import sharp from 'sharp';
await MeshoptDecoder.ready; await MeshoptEncoder.ready;
const root = new URL('../../', import.meta.url);
const io = new NodeIO().registerExtensions(ALL_EXTENSIONS).registerDependencies({'meshopt.decoder':MeshoptDecoder,'meshopt.encoder':MeshoptEncoder});
// Export #ultra-screen-artwork from the running site after reviewing the shared DOM layout.
// This embeds that exact artwork; never regenerate a differently proportioned SVG here.
if (!process.argv.includes('--projects-only')) {
const png=await readFile(new URL('assets/textures/station-reorder/ultra-maritime.png',root));
const metadata=await sharp(png).metadata();
if(Math.abs(metadata.width/metadata.height-(.598/.336))>.005)throw new Error('Ultra Maritime artwork must match the physical monitor aspect ratio.');
for (const dir of ['exports/station-reorder/','exports/web/','web/public/assets/']) {
 const file=new URL(dir+'station-ultra-maritime.glb',root),doc=await io.read(file.pathname);
 const screen=doc.getRoot().listNodes().find(n=>n.getName()==='Screen_Workstation_UM');
 if(!screen)throw new Error('Missing Ultra Maritime screen');
 for(const prim of screen.getMesh().listPrimitives()){
  const material=prim.getMaterial();
  for(const texture of new Set([material.getBaseColorTexture(),material.getEmissiveTexture()].filter(Boolean)))texture.setImage(png).setMimeType('image/png');
 }
 await io.write(file.pathname,doc);
 console.log('Updated',dir+'station-ultra-maritime.glb');
}
}
if (!process.argv.includes('--ultra-only')) {
const reel=await readFile(new URL('assets/textures/station-reorder/projects-monitor.png',root));
for(const dir of ['exports/station-reorder/','exports/web/','web/public/assets/']){
 const file=new URL(dir+'station-projects.glb',root),doc=await io.read(file.pathname);
 const screen=doc.getRoot().listNodes().find(n=>n.getName()==='Screen_Ultrawide_Projects');
 for(const prim of screen.getMesh().listPrimitives()){
  const mat=prim.getMaterial();for(const tex of new Set([mat.getBaseColorTexture(),mat.getEmissiveTexture()].filter(Boolean)))tex.setImage(reel).setMimeType('image/png');
 }
 await io.write(file.pathname,doc);
}

}
