import test from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';
import {Vector3,OrthographicCamera} from 'three';
import {carModelTransform,carAnchoredPose,modelSceneState} from '../src/projects-desk-transition';
import {phases} from '../src/journey';
const m=JSON.parse(fs.readFileSync('public/assets/journey.json','utf8'));
test('car silhouette stays fixed throughout shrink at wide and portrait aspects',()=>{
 for(const aspect of [390/844,1200/900,2040/1134]){
  let baseline:Vector3[]=[];
  for(let n=0;n<=100;n++){
   const t=n/100,tr=carModelTransform(m,t),pose=carAnchoredPose(m,t,aspect);
   const cam=new OrthographicCamera(-pose.width/2,pose.width/2,pose.width/aspect/2,-pose.width/aspect/2,.001,100);cam.position.fromArray(pose.position);cam.quaternion.fromArray(pose.quaternion);cam.updateMatrixWorld();
   const points=[new Vector3(-.013,.74,-.355),new Vector3(.51,.986,.354),new Vector3(.25,.9,0)].map(p=>p.multiplyScalar(tr.scale).applyQuaternion(tr.rotation).add(tr.position).project(cam));
   if(!n)baseline=points;else points.forEach((p,i)=>assert.ok(Math.hypot(p.x-baseline[i].x,p.y-baseline[i].y)<1e-6));
  }
 }
});
test('desk fades only after annotations disappear and model is grounded; reverse seeks are exact',()=>{
 const phase=phases.find(p=>p.kind==='car-shrink')!;
 const forward=Array.from({length:101},(_,i)=>carModelTransform(m,i/100));
 for(let n=100;n>=0;n--){const t=n/100,s=modelSceneState({phase,local:t});assert.deepEqual(carModelTransform(m,t),forward[n]);if(s.desk>0){assert.equal(s.labels,0);assert.ok(carModelTransform(m,t).ground.distanceTo(new Vector3().fromArray(m.reorder.projects.carModel.ground))<1e-9);}}
 assert.ok(Math.abs(forward[100].scale-.32)<1e-10);
});
