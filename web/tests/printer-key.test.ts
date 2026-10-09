import test from 'node:test';
import assert from 'node:assert/strict';
import {NodeIO} from '@gltf-transform/core';
import {ALL_EXTENSIONS} from '@gltf-transform/extensions';
import {MeshoptDecoder} from 'meshoptimizer';
import * as T from 'three';
import {printerResumePose} from '../src/printer-key';
const doc=await new NodeIO().registerExtensions(ALL_EXTENSIONS).registerDependencies({'meshopt.decoder':MeshoptDecoder}).read(new URL('../public/assets/scene-realism/desk.glb',import.meta.url).pathname);
const nodes=doc.getRoot().listNodes();
const isKey=(n:any):boolean=>n?.getName()==='Root_printer_download'||(n?.getParentNode()?isKey(n.getParentNode()):false);
const group=new T.Group();let paper:T.Mesh|undefined;let count=0;
for(const node of nodes)for(const p of node.getMesh()?.listPrimitives()??[]){if(!isKey(node)&&!p.getMaterial()?.getName().startsWith('MAT_Resume_PDF'))continue;const g=new T.BufferGeometry();for(const [name,attr,size]of [['position','POSITION',3],['uv','TEXCOORD_0',2]]as const){const a=p.getAttribute(attr);if(a)g.setAttribute(name,new T.Float32BufferAttribute(Array.from({length:a.getCount()},(_,i)=>a.getElement(i,[])).flat(),size));}const mesh=new T.Mesh(g);mesh.applyMatrix4(new T.Matrix4().fromArray(node.getWorldMatrix()));if(isKey(node)){group.add(mesh);count+=(p.getIndices()?.getCount()??p.getAttribute('POSITION')!.getCount())/3;}else paper=mesh;}
test('physical key retains independent moving cap and Figma label',()=>{
 const root=nodes.find(n=>n.getName()==='Root_printer_download')!;assert.equal(root.getParentNode()?.getName(),'Root_printer');
 assert.ok(nodes.some(n=>n.getName()==='Root_printer_download_cap'));
 assert.ok(nodes.some(n=>n.getName()==='PrinterKey_Label'));
 assert.ok(count>0&&count<1500);
});
for(const [w,h]of [[1257,785],[1920,1080],[390,844],[844,390]])test(`paper and raised key fit perspective at ${w} × ${h}`,()=>{
 const pose=printerResumePose(paper!,group,33,w/h),camera=new T.PerspectiveCamera(33,w/h,.03,50);
 camera.position.copy(pose.position);camera.up.copy(pose.up);camera.lookAt(pose.target);camera.updateMatrixWorld();
 for(const mesh of [paper!,...group.children as T.Mesh[]]){mesh.updateWorldMatrix(true,false);const a=mesh.geometry.getAttribute('position');for(let i=0;i<a.count;i++){const p=new T.Vector3().fromBufferAttribute(a,i).applyMatrix4(mesh.matrixWorld).project(camera);assert.ok(Math.abs(p.x)<.821&&Math.abs(p.y)<.821&&p.z<1&&p.z>-1);}}
});
