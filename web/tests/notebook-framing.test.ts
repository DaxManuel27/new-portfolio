import test from 'node:test';
import assert from 'node:assert/strict';
import * as T from 'three';
import {keepNotebookInFrame} from '../src/notebook-framing';
for(const aspect of [2.4,1.6,.46])test(`moving notebook stays inside frame at aspect ${aspect}`,()=>{
 const book=new T.Group(),cover=new T.Mesh(new T.BoxGeometry(.3,.01,.42));book.add(cover);book.position.set(.4,.8,0);
 const camera=new T.PerspectiveCamera(40,aspect,.01,20);
 for(let step=0;step<=20;step++){
  cover.rotation.z=-Math.PI*step/20;
  camera.position.set(.1,1.05,.25);camera.lookAt(.3,.8,0);
  keepNotebookInFrame(camera,book);
  const b=new T.Box3().setFromObject(book);
  for(const x of [b.min.x,b.max.x])for(const y of [b.min.y,b.max.y])for(const z of [b.min.z,b.max.z]){
   const p=new T.Vector3(x,y,z).project(camera);
   assert.ok(Math.abs(p.x)<=.88001&&Math.abs(p.y)<=.88001&&p.z<1&&p.z>-1);
  }
 }
});

import {NodeIO} from '@gltf-transform/core';
import {ALL_EXTENSIONS} from '@gltf-transform/extensions';
import {MeshoptDecoder} from 'meshoptimizer';
import {notebookShowcasePose,NOTEBOOK_OPEN_ANGLE} from '../src/notebook-framing';
const doc=await new NodeIO().registerExtensions(ALL_EXTENSIONS).registerDependencies({'meshopt.decoder':MeshoptDecoder}).read(new URL('../public/assets/scene-realism/desk.glb',import.meta.url).pathname);
const source=doc.getRoot().listNodes().find(n=>n.getName()==='Root_notebook')!;
function rebuild(n:typeof source):T.Group{
 const group=new T.Group();group.name=n.getName();group.position.fromArray(n.getTranslation());group.quaternion.fromArray(n.getRotation());group.scale.fromArray(n.getScale());
 for(const primitive of n.getMesh()?.listPrimitives()??[]){const a=primitive.getAttribute('POSITION')!;const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(Array.from({length:a.getCount()},(_,i)=>a.getElement(i,[])).flat(),3));group.add(new T.Mesh(g));}
 for(const child of n.listChildren())group.add(rebuild(child));return group;
}
const book=rebuild(source),hinge=book.getObjectByName('UM_Notebook_CoverHinge')!;
test('shipped cover lifts above the pages instead of passing through them',()=>{
 hinge.rotation.z=0;book.updateWorldMatrix(true,true);const closed=new T.Box3().setFromObject(hinge).getCenter(new T.Vector3());
 hinge.rotation.z=NOTEBOOK_OPEN_ANGLE/2;book.updateWorldMatrix(true,true);const lifted=new T.Box3().setFromObject(hinge).getCenter(new T.Vector3());assert.ok(lifted.y>closed.y+.05);
});
for(const aspect of [2.4,1.6,.46])test(`fixed showcase camera contains the shipped cover sweep at ${aspect}`,()=>{
 const camera=new T.PerspectiveCamera(40,aspect,.01,20);hinge.rotation.z=.2;const pose=notebookShowcasePose(book,hinge,camera);assert.equal(hinge.rotation.z,.2);camera.position.copy(pose.position);camera.lookAt(pose.target);camera.updateMatrixWorld();
 for(let i=0;i<=96;i++){hinge.rotation.z=NOTEBOOK_OPEN_ANGLE*i/96;book.updateWorldMatrix(true,true);const bounds=new T.Box3().setFromObject(book);
 for(const x of [bounds.min.x,bounds.max.x])for(const y of [bounds.min.y,bounds.max.y])for(const z of [bounds.min.z,bounds.max.z]){const p=new T.Vector3(x,y,z).project(camera);assert.ok(Math.abs(p.x)<.89&&Math.abs(p.y)<.89&&p.z>-1&&p.z<1);}}
});
