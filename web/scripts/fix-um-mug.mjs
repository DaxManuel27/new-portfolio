import {NodeIO} from '@gltf-transform/core';
import {ALL_EXTENSIONS} from '@gltf-transform/extensions';
import {MeshoptDecoder,MeshoptEncoder} from 'meshoptimizer';
import {readFile,writeFile} from 'node:fs/promises';
import sharp from 'sharp';
await MeshoptDecoder.ready;await MeshoptEncoder.ready;
const root=new URL('../../',import.meta.url),logo=await readFile(new URL('assets/textures/ultra-maritime-logo.png',root));
const svg=`<svg xmlns="http://www.w3.org/2000/svg" width="1024" height="1024"><rect width="1024" height="1024" fill="#f1f1f1"/><image x="102.4" y="102.4" width="819.2" height="819.2" href="data:image/png;base64,${logo.toString('base64')}"/></svg>`;
const png=await sharp(Buffer.from(svg)).png().toBuffer();await writeFile(new URL('assets/textures/um-mug-print.png',root),png);
const io=new NodeIO().registerExtensions(ALL_EXTENSIONS).registerDependencies({'meshopt.decoder':MeshoptDecoder,'meshopt.encoder':MeshoptEncoder});
for(const dir of ['exports/station-reorder/','exports/web/','web/public/assets/']){
 const path=new URL(dir+'station-ultra-maritime.glb',root).pathname,doc=await io.read(path);
 let count=0;const changed=new Set();
 for(const node of doc.getRoot().listNodes()){
  if(!node.getName().includes('Mug'))continue;
  for(const prim of node.getMesh()?.listPrimitives()??[]){
   const mat=prim.getMaterial();if(!mat)continue;
   mat.setMetallicFactor(0).setRoughnessFactor(.22).setAlphaMode('OPAQUE');
   if(mat.getName().includes('Logo')){
    if(!changed.has(mat)){
     const tex=doc.createTexture('UM white ceramic logo').setImage(png).setMimeType('image/png');mat.setBaseColorTexture(tex).setBaseColorFactor([1,1,1,1]);
     mat.getBaseColorTextureInfo().setWrapS(33071).setWrapT(33071);
     changed.add(mat);
    }
    if(!prim.getExtras().whiteLogoPadding){
     const uv=prim.getAttribute('TEXCOORD_0');if(!uv)throw new Error('Missing mug UV');
     const copy=uv.clone(),array=Float32Array.from(uv.getArray(),v=>v*.8+.1);copy.setArray(array);prim.setAttribute('TEXCOORD_0',copy);prim.setExtras({...prim.getExtras(),whiteLogoPadding:true});
    }
   }else mat.setBaseColorFactor([.88,.88,.88,1]);
   count++;
  }
 }
 if(!count)throw new Error('Mug not found');await io.write(path,doc);console.log(dir,count);
}
