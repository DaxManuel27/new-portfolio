import {NodeIO} from '@gltf-transform/core';import {ALL_EXTENSIONS} from '@gltf-transform/extensions';import {dedup,prune,meshopt} from '@gltf-transform/functions';import {MeshoptEncoder} from 'meshoptimizer';import {readFile,writeFile,copyFile,rm} from 'node:fs/promises';import sharp from 'sharp';
const root=new URL('../../',import.meta.url);await MeshoptEncoder.ready;const io=new NodeIO().registerExtensions(ALL_EXTENSIONS).registerDependencies({'meshopt.encoder':MeshoptEncoder});
const reports=[];
for(const slug of ['raspberry-pi-5']){
 const doc=await io.read(new URL(`exports/fsae-details/${slug}.glb`,root).pathname);await doc.transform(prune(),dedup(),meshopt({encoder:MeshoptEncoder,level:'medium',quantizePosition:16,quantizeNormal:12}));
 if(slug==='raspberry-pi-5')doc.getRoot().getAsset().copyright='Copyright (c) 2026 Raspberry Pi Ltd; MIT; see raspberry-pi-5-LICENSE.txt. Geometry and materials adapted for this portfolio.';
 const buffer=await io.writeBinary(doc);for(const dir of ['web/public/assets','exports/web']){await writeFile(new URL(`${dir}/${slug}.glb`,root),buffer);await sharp(new URL(`exports/fsae-details/${slug}.png`,root).pathname).webp({quality:94}).toFile(new URL(`${dir}/${slug}.webp`,root).pathname);}
 reports.push({slug,bytes:buffer.length,materials:doc.getRoot().listMaterials().length});
}
const anchors=JSON.parse(await readFile(new URL('exports/fsae-details/anchors.json',root),'utf8'));
for(const dir of ['web/public/assets','exports/web']){const path=new URL(`${dir}/journey.json`,root);const manifest=JSON.parse(await readFile(path,'utf8'));manifest.reorder.car.anchors={data:anchors.data};
 try{manifest.reorder.car.focusRoutes={data:JSON.parse(await readFile(new URL('exports/fsae-details/routes.json',root),'utf8')).data};}catch(e){if(e.code!=='ENOENT')throw e;}
manifest.reorder.piPortal=JSON.parse(await readFile(new URL('exports/fsae-details/pi-portal.json',root),'utf8'));
await writeFile(path,JSON.stringify(manifest));}
for(const dir of ['web/public/assets','exports/web','exports/fsae-details','blender'])await copyFile(new URL('assets/models/raspberry-pi-5/source/LICENSE.txt',root),new URL(`${dir}/raspberry-pi-5-LICENSE.txt`,root));
await writeFile(new URL('exports/fsae-details/asset-report.json',root),JSON.stringify(reports,null,2));console.log(reports);

// Clean obsolete outputs even when rebuilding over an older export.
for(const dir of ['web/public/assets','exports/web','exports/fsae-details'])for(const ext of ['glb','webp','png'])await rm(new URL(`${dir}/pedal-sensor.${ext}`,root),{force:true});

// Reapply the measured continuous-shot framing after a detail rebuild.
if ((await import('node:fs')).existsSync(new URL('exports/continuous-pi/shot.json',root))) await import('./prepare-continuous-pi.mjs');
