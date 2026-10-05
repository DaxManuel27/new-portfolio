import assert from 'node:assert/strict';
import { writeFile, readFile, readdir, stat } from 'node:fs/promises';
import sharp from 'sharp';
import { NodeIO } from '@gltf-transform/core';
import { ALL_EXTENSIONS } from '@gltf-transform/extensions';
import { MeshoptDecoder } from 'meshoptimizer';
await MeshoptDecoder.ready;
const io = new NodeIO().registerExtensions(ALL_EXTENSIONS).registerDependencies({'meshopt.decoder':MeshoptDecoder});
const checks=[];
for(const [source,runtime,material] of [
 ['../exports/completion/macbook-journey.glb','macbook-journey','MAT_MacBook_Silver'],
 ['../exports/completion/station-projects.glb','station-projects','MAT_Figma_Desktop_smoked walnut'],
 ['../exports/shared-desk/station-shared.glb','station-resume','M_Printer_Body'],
 ['../exports/completion/printer-paper-feed.glb','printer-paper-feed','MAT_Completion_Resume_Page.Sheet'],
]){
 const original=await io.read(source), compressed=await io.read(`public/assets/${runtime}.glb`);
 for(const getter of ['getNormalTexture','getMetallicRoughnessTexture']){
  const a=original.getRoot().listMaterials().find(m=>m.getName()===material)[getter]();
  const b=compressed.getRoot().listMaterials().find(m=>m.getName()===material)[getter]();
  const raw=async t=>sharp(Buffer.from(t.getImage())).ensureAlpha().raw().toBuffer({resolveWithObject:true});
  const x=await raw(a), y=await raw(b);
  assert.equal(x.info.width,y.info.width);assert.equal(x.info.height,y.info.height);
  assert.ok(x.data.equals(y.data),`${material}: ${getter} lossless pixel preservation`);
  checks.push({material,map:getter,width:x.info.width,height:x.info.height,pixelsIdentical:true});
 }
}
const sizes={};for(const [name,path] of [['before','../blender/backups/photorealism-2026-10-02/web/public/assets'],['after','public/assets']]){
 let glbBytes=0,assetBytes=0;for(const file of await readdir(path)){const bytes=(await stat(`${path}/${file}`)).size;if(file.endsWith('.glb'))glbBytes+=bytes;if(/\.(glb|hdr|webp)$/.test(file))assetBytes+=bytes;}
 sizes[name]={glbBytes,assetBytes};
}
await writeFile('test-results/realism/texture-validation.json',JSON.stringify({checks,sizes},null,2));
console.log(`Lossless export verified for ${checks.length} surface maps.`,sizes);
