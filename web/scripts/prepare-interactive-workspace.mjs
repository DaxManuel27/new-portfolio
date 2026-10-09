import {NodeIO} from '@gltf-transform/core';
import {ALL_EXTENSIONS} from '@gltf-transform/extensions';
import {dedup,prune,join,meshopt,textureCompress} from '@gltf-transform/functions';
import {MeshoptEncoder,MeshoptDecoder} from 'meshoptimizer';
import sharp from 'sharp';
import {writeFile,stat} from 'node:fs/promises';
const dir=new URL('../../exports/interactive-workspace/',import.meta.url);
await MeshoptEncoder.ready;await MeshoptDecoder.ready;
const io=new NodeIO().registerExtensions(ALL_EXTENSIONS).registerDependencies({'meshopt.encoder':MeshoptEncoder,'meshopt.decoder':MeshoptDecoder});
const report=[];
for(const name of ['workspace','notebook','phone','printer','macbook','monitor','car','pi']){
 const doc=await io.read(new URL(name+'-source.glb',dir).pathname);
 await doc.transform(dedup());
 // Join only within one semantic root. Interactive object and animation boundaries remain intact.
 const groups=['Root_macbook','Root_monitor','Root_car','Root_pi','Root_printer','Root_phone','Root_notebook','Root_mug','Root_pen','Root_plant'];
 for(const group of groups){
  await doc.transform(join({cleanup:false,filter:node=>{let p=node;while(p){if(p.getName()===group)return true;p=p.getParentNode();}return false;}}));
 }
 await doc.transform(dedup(),prune({keepLeaves:true,keepExtras:true}),textureCompress({encoder:sharp,targetFormat:'webp',resize:[2048,2048],lossless:true}),meshopt({encoder:MeshoptEncoder,level:'medium',quantizePosition:16,quantizeNormal:12,quantizeTexcoord:16}));
 const data=await io.writeBinary(doc);await writeFile(new URL(name+'.glb',dir),data);
 let triangles=0,primitives=0;
 for(const m of doc.getRoot().listMeshes())for(const p of m.listPrimitives()){primitives++;triangles+=(p.getIndices()?.getCount()??p.getAttribute('POSITION').getCount())/3;}
 const clips=doc.getRoot().listAnimations().map(a=>({name:a.getName(),channels:a.listChannels().length,duration:Math.max(...a.listSamplers().map(s=>s.getInput().getMax([])[0]))}));
 const roots=doc.getRoot().listNodes().filter(n=>n.getName().startsWith('Root_')).map(n=>n.getName());
 report.push({name,bytes:data.length,triangles,primitives,clips,roots});console.log(name,data.length,primitives,JSON.stringify(clips));
}
await writeFile(new URL('asset-report.json',dir),JSON.stringify(report,null,2));
if(report[0].bytes>8e6)console.warn('Overview exceeds 8 MB target');
if(report[0].primitives>100)console.warn('Overview exceeds 100 draw primitive target');
