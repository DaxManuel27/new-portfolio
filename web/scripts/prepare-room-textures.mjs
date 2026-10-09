import sharp from 'sharp';
import {mkdir,writeFile} from 'node:fs/promises';
await mkdir('public/assets/room',{recursive:true});
for(const [source,target]of [['walnut_color_2k.png','walnut-color'],['walnut_normal_2k.png','walnut-normal'],['walnut_roughness_2k.png','walnut-roughness']])await sharp('../assets/textures/photoreal/'+source).resize(1024,1024).webp({quality:88}).toFile('public/assets/room/'+target+'.webp');
const size=256,data=Buffer.alloc(size*size*3);for(let y=0;y<size;y++)for(let x=0;x<size;x++){const i=(y*size+x)*3;data[i]=128+Math.round(19*Math.sin(x*Math.PI/2));data[i+1]=128+Math.round(19*Math.sin(y*Math.PI/2));data[i+2]=250;}
await sharp(data,{raw:{width:size,height:size,channels:3}}).png().toFile('public/assets/room/linen-normal.png');
await writeFile('public/assets/room/sources.json',JSON.stringify({wood:{license:'CC0',source:'https://polyhaven.com/a/walnut_veneer_02',derivedFrom:'assets/textures/photoreal/sources.json',size:1024},linen:{source:'Original procedural weave normal',size:256}},null,2));
