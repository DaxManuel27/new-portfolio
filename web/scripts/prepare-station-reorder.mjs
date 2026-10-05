import { NodeIO } from '@gltf-transform/core';
import { ALL_EXTENSIONS } from '@gltf-transform/extensions';
import { prune, dedup, meshopt, textureCompress } from '@gltf-transform/functions';
import { MeshoptEncoder, MeshoptDecoder } from 'meshoptimizer';
import sharp from 'sharp';
import { readFile, writeFile, mkdir } from 'node:fs/promises';
const root=new URL('../../',import.meta.url),source=new URL('exports/station-reorder/',root);
const layout=JSON.parse(await readFile(new URL('layout.json',source),'utf8'));
await MeshoptEncoder.ready;await MeshoptDecoder.ready;
const io=new NodeIO().registerExtensions(ALL_EXTENSIONS).registerDependencies({'meshopt.encoder':MeshoptEncoder,'meshopt.decoder':MeshoptDecoder});
const out=new URL('exports/web/',root),pub=new URL('web/public/assets/',root);
const current=JSON.parse(await readFile(new URL('journey.json',pub),'utf8'));
const byId=Object.fromEntries(current.stations.map(s=>[s.id,s]));
const ids=['intro','hack-atlantic','ultra-maritime','formula-sae','projects','resume','contact'];
const stations=ids.map(id=>structuredClone(byId[id]));
Object.assign(stations[2],{name:'Workstation · Ultra Maritime + Formula SAE',origin:layout.origins.workstation,wide:layout.workstation.wide,close:layout.workstation.close,dock:layout.workstation.dock,hasClose:true});
Object.assign(stations[3],{origin:layout.origins.car,wide:layout.car.wide,close:layout.car.close,hasClose:true});
Object.assign(stations[4],{origin:layout.origins.ultrawide,wide:layout.ultrawide.wide,close:layout.ultrawide.close,hasClose:true,poster:'ultrawide.webp'});
const heroOnly=process.argv.includes('--hero-only');
// --only=station-projects[,…] rebuilds just those GLBs (and their posters); the manifest is always regenerated.
const only=process.argv.find(x=>x.startsWith('--only='))?.slice(7).split(',');
const receipt=[];
for(const name of heroOnly ? ['macbook-journey'] : only ?? ['macbook-journey','station-ultra-maritime','station-formula-sae','station-projects']){
 const doc=await io.read(new URL(name+'.glb',source).pathname);
 await doc.transform(prune({keepLeaves:true,keepExtras:false}),dedup(),textureCompress({encoder:sharp,targetFormat:'webp',slots:/^(baseColorTexture|emissiveTexture)$/,resize:[2048,2048],lossless:true}),textureCompress({encoder:sharp,targetFormat:'webp',slots:/^(normalTexture|metallicRoughnessTexture|occlusionTexture)$/,resize:[2048,2048],lossless:true}),meshopt({encoder:MeshoptEncoder,level:'medium',quantizePosition:16,quantizeNormal:12,quantizeTexcoord:16}));
 const bytes=await io.writeBinary(doc);for(const dir of [out,pub])await writeFile(new URL(name+'.glb',dir),bytes);
 receipt.push({name,bytes:bytes.length,meshes:doc.getRoot().listMeshes().length});console.log(name,bytes.length);
}
const posters=[['station-ultra-maritime','ultra-maritime','ultra-maritime'],['station-formula-sae','fsae-preview','formula-sae'],['station-projects','ultrawide','ultrawide']].filter(([glb])=>!only||only.includes(glb)).map(([,src,dest])=>[src,dest]);
if(!heroOnly) for(const [src,dest] of posters)await sharp(new URL(src+'.png',source).pathname).webp({quality:95}).toFile(new URL(dest+'.webp',pub).pathname);
const manifest={...current,version:3,stations,travel:JSON.parse(await readFile(new URL('travel.json',source),'utf8')),reorder:layout,note:'Workstation → monitor portal → car → desk display model → ultrawide → unchanged Projects reel. Hero retired at FSAE zoom.'};
for(const dir of [out,pub])await writeFile(new URL('journey.json',dir),JSON.stringify(manifest));
await writeFile(new URL(heroOnly ? 'hero-asset-report.json' : 'asset-report.json',source),JSON.stringify(receipt,null,2));

// Keep optional focused FSAE assets and anchor metadata reproducible on rebuild.
if ((await import("node:fs")).existsSync(new URL("exports/fsae-details/anchors.json",root))) await import("./prepare-fsae-details.mjs");
