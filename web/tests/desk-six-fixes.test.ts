import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync,statSync} from 'node:fs';
const asset=new URL('../public/assets/scene-realism/desk.glb',import.meta.url);
const bytes=readFileSync(asset);
const gltf=JSON.parse(bytes.subarray(20,20+bytes.readUInt32LE(12)).toString());
const nodes=gltf.nodes as {name?:string;children?:number[];mesh?:number}[];
const index=(name:string)=>nodes.findIndex(n=>n.name===name);
function descendant(parent:string,child:string){const target=index(child);const visit=(i:number):boolean=>i===target||(nodes[i].children??[]).some(visit);assert.notEqual(index(parent),-1);assert.notEqual(target,-1);return (nodes[index(parent)].children??[]).some(visit);}
test('export retains separate Pi and cover pivots instead of merging interactive meshes',()=>{
 assert.ok(descendant('Root_car','Root_pi'));
 assert.ok(descendant('Root_notebook','UM_Notebook_CoverHinge'));
 assert.ok(descendant('Root_printer','Root_resume'));
 for(const name of ['Root_pi','UM_Notebook_CoverHinge','Root_resume']){const n=nodes[index(name)];assert.ok(n.mesh!==undefined||(n.children?.length??0)>0,`${name} must retain geometry`);}
});
test('export excludes race lettering and unrelated mechanical animation',()=>{
 assert.ok(!nodes.some(n=>/FSAE_(Number|Wing_E01|Original_Decal)/.test(n.name??'')));
 assert.equal(gltf.animations?.length??0,0);
});
test('compressed scene retains decoders and fits the scene budget',()=>{
 assert.ok(gltf.extensionsRequired.includes('KHR_texture_basisu'));
 assert.ok(gltf.extensionsUsed.includes('EXT_meshopt_compression'));
 assert.ok(statSync(asset).size<8_000_000);
});
