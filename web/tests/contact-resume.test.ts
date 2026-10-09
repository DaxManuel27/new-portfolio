import test from 'node:test';
import assert from 'node:assert/strict';
import {NodeIO} from '@gltf-transform/core';
import {ALL_EXTENSIONS} from '@gltf-transform/extensions';
import {MeshoptDecoder} from 'meshoptimizer';
import * as T from 'three';
import {surfacePose} from '../src/surface-focus';
const doc=await new NodeIO().registerExtensions(ALL_EXTENSIONS).registerDependencies({'meshopt.decoder':MeshoptDecoder}).read(new URL('../public/assets/scene-realism/desk.glb',import.meta.url).pathname);
for(const kind of ['Contact_Pages','Resume_PDF'])test(`${kind} shipped geometry frames upright on desktop and mobile`,()=>{
 const node=doc.getRoot().listNodes().find(n=>n.getMesh()?.listPrimitives().some(p=>p.getMaterial()?.getName().startsWith('MAT_'+kind)))!;
 assert.ok(node);
 const primitive=node.getMesh()!.listPrimitives().find(p=>p.getMaterial()?.getName().startsWith('MAT_'+kind))!;
 const mesh=new T.Mesh(new T.BufferGeometry());
 for(const [name,attribute,size]of [['position','POSITION',3],['uv','TEXCOORD_0',2]]as const){const a=primitive.getAttribute(attribute)!;mesh.geometry.setAttribute(name,new T.Float32BufferAttribute(Array.from({length:a.getCount()},(_,i)=>a.getElement(i,[])).flat(),size));}
 mesh.applyMatrix4(new T.Matrix4().fromArray(node.getWorldMatrix()));
 for(const aspect of [1257/785,390/844]){
  const pose=surfacePose(mesh,33,aspect,false,kind==='Contact_Pages'&&aspect<1?[0,.5]:[0,1]);
  assert.ok(pose.width>.1&&pose.height>.2);assert.ok(pose.position.y>pose.target.y);assert.ok(pose.up.z<-.9);
  if(kind==='Contact_Pages'&&aspect<1)assert.ok(pose.width<.18,'mobile focuses the handwritten left page');
  if(kind==='Resume_PDF')assert.ok(Math.abs(pose.width/pose.height-612/792)<.002,'PDF retains Letter proportions');
 }
});
