import {NodeIO} from '@gltf-transform/core';
import {ALL_EXTENSIONS} from '@gltf-transform/extensions';
import * as T from 'three';
import fs from 'node:fs';
import {surfacePose} from '../src/surface-focus.ts';
const doc=await new NodeIO().registerExtensions(ALL_EXTENSIONS).read(new URL('../../exports/scene-realism/desk-source.glb',import.meta.url).pathname);
const root=doc.getRoot();
const points=name=>root.listNodes().filter(n=>{let p=n;while(p){if(p.getName()===name)return true;p=p.getParentNode();}return false;}).flatMap(n=>n.getMesh()?.listPrimitives().flatMap(p=>{const a=p.getAttribute('POSITION'),m=new T.Matrix4().fromArray(n.getWorldMatrix());return Array.from({length:a.getCount()},(_,i)=>new T.Vector3().fromArray(a.getElement(i,[])).applyMatrix4(m));})||[]);
const screenNode=root.listNodes().find(n=>n.getName()==='Screen_Ultrawide_Projects_Curved');const primitive=screenNode.getMesh().listPrimitives()[0];
const mesh=new T.Mesh(new T.BufferGeometry());mesh.geometry.setAttribute('position',new T.BufferAttribute(new Float32Array(primitive.getAttribute('POSITION').getArray()),3));mesh.geometry.setAttribute('uv',new T.BufferAttribute(new Float32Array(primitive.getAttribute('TEXCOORD_0').getArray()),2));mesh.applyMatrix4(new T.Matrix4().fromArray(screenNode.getWorldMatrix()));
const monitor=points('Monitor_CurvedHousing'),laptop=points('Root_macbook');
const manifest=JSON.parse(fs.readFileSync(new URL('../../exports/scene-realism/manifest.json',import.meta.url)));const home=manifest.cameras.Camera_Overview;
for(const lift of [0])for(const [w,h]of [[1469,785],[1440,1000],[1920,1080],[390,844]]){
 const camera=new T.PerspectiveCamera(home.fov,w/h,.03,50);camera.fov=T.MathUtils.radToDeg(2*Math.atan(Math.tan(T.MathUtils.degToRad(home.fov/2))*Math.max(1,1.44/camera.aspect)));if(w<760)camera.fov=Math.min(72,camera.fov);camera.updateProjectionMatrix();
 const pos=new T.Vector3().fromArray(home.position),target=new T.Vector3().fromArray(home.target);if(w<760){pos.z+=.6;pos.y+=.15;target.y=1.02;}camera.position.copy(pos);camera.lookAt(target);camera.updateMatrixWorld();
 const report=view=>{const mp=monitor.map(p=>p.clone().add(new T.Vector3(0,lift,0)).project(camera)),lp=laptop.map(p=>p.clone().project(camera));console.log(JSON.stringify({lift,w,h,view,gap:Math.round((Math.min(...mp.map(p=>p.y))-Math.max(...lp.map(p=>p.y)))*h/2),top:Math.round((1-Math.max(...mp.map(p=>p.y)))*h/2)}));};report('home');
 mesh.position.y+=lift;const pose=surfacePose(mesh,camera.fov,camera.aspect);mesh.position.y-=lift;camera.position.copy(pose.position);camera.up.copy(pose.up);camera.lookAt(pose.target);camera.updateMatrixWorld();report('projects');
}
