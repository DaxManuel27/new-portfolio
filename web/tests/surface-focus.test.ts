import test from 'node:test';
import assert from 'node:assert/strict';
import * as T from 'three';
import {surfacePose,immersiveDestinations} from '../src/surface-focus';
for(const aspect of [1440/1000,1280/800,390/844])for(const kind of ['screen','page']){
 test(`${kind} keeps 10% clearance and stays in front at aspect ${aspect.toFixed(2)}`,()=>{
  const mesh=new T.Mesh(new T.PlaneGeometry(kind==='screen'?.8:.143,kind==='screen'?.35:.203));
  if(kind==='page')mesh.rotation.x=-Math.PI/2;
  mesh.position.set(.42,.8,-.1);mesh.updateMatrixWorld();
  const pose=surfacePose(mesh,33,aspect),camera=new T.PerspectiveCamera(33,aspect,.001,20);
  camera.position.copy(pose.position);camera.up.copy(pose.up);camera.lookAt(pose.target);camera.updateMatrixWorld();
  const corners=[[-.5,-.5],[.5,-.5],[-.5,.5],[.5,.5]].map(([x,y])=>new T.Vector3(x*(kind==='screen'?.8:.143),y*(kind==='screen'?.35:.203),0).applyMatrix4(mesh.matrixWorld).project(camera));
  assert.ok(Math.min(...corners.map(v=>v.x))>=-.80001&&Math.max(...corners.map(v=>v.x))<=.80001);
  assert.ok(Math.min(...corners.map(v=>v.y))>=-.80001&&Math.max(...corners.map(v=>v.y))<=.80001);
  assert.ok(corners.every(v=>v.z>-1&&v.z<1));
  assert.ok(pose.position.clone().sub(pose.target).dot(kind==='page'?new T.Vector3(0,1,0):new T.Vector3(0,0,1))>0);
 });
}
test('screens and physical paper destinations use immersive camera framing',()=>assert.deepEqual([...immersiveDestinations],['about','hack-atlantic','ultra-maritime','contact','resume']));
