import test from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';
import {Quaternion,Vector3,OrthographicCamera,Mesh} from 'three';
import {loadGeometry} from './asset-geometry';import {createHeroSampler} from '../src/hero';
import {evaluate,phases,totalUnits} from '../src/journey';import {evaluateCamera} from '../src/camera';
import {workstationLid} from '../src/workstation-motion';
const manifest=JSON.parse(fs.readFileSync('public/assets/journey.json','utf8'));
const [hero,baseline]=await Promise.all([loadGeometry('public/assets/macbook-journey.glb'),loadGeometry('../backups/pre-workstation-rotation/web/public/assets/macbook-journey.glb')]);
const sample=createHeroSampler(hero.root,hero.clip),oldSample=createHeroSampler(baseline.root,baseline.clip);
const spin=hero.root.getObjectByName('Journey_MacBook_SpinPivot')!,lid=hero.root.getObjectByName('Journey_MacBook_LidPivot')!;
const flight=phases.find(p=>p.station===2&&p.kind==='travel')!;
const stateAt=(p:number)=>evaluate((flight.start+(flight.end-flight.start)*p)/totalUnits);
test('the heading winds one complete revolution and stops before the descent',()=>{
 let previous=0,heading=0;
 for(let n=0;n<=480;n++){
  const p=n/480;sample(4+4*p);
  const right=new Vector3(1,0,0).applyQuaternion(spin.quaternion),angle=Math.atan2(-right.z,right.x);
  if(n)heading+=Math.atan2(Math.sin(angle-previous),Math.cos(angle-previous));previous=angle;
  // 30 fps interpolation straddles the 72% stop by less than one tenth degree.
  if(p>=.72)assert.ok(spin.quaternion.angleTo(new Quaternion())<Math.PI/1800,'align before lowering');
  assert.ok(workstationLid(stateAt(p),lid.quaternion).angleTo(new Quaternion(.819152044,0,0,.573576436).normalize())<2e-5,'flight hinge closed');
 }
 assert.ok(Math.abs(heading*180/Math.PI-377.3)<.02,`one full yaw plus dock alignment: ${heading*180/Math.PI}`);
});
test('rotation revision preserves all prior Intro/Hack poses, including banner clearance',()=>{
 for(let n=0;n<=480;n++){
  const t=n/120;sample(t);oldSample(t);
  for(const name of ['Journey_TravelFeet','Journey_MacBook_SpinPivot','Journey_MacBook_LidPivot']){
   const a=hero.root.getObjectByName(name)!,b=baseline.root.getObjectByName(name)!;
   assert.ok(a.position.distanceTo(b.position)<2e-5,name+' position');assert.ok(a.quaternion.angleTo(b.quaternion)<2e-5,name+' rotation');
  }
 }
});
test('Hack departure closes continuously into the closed flight on forward and reverse seeks',()=>{
 const exit=phases.find(p=>p.station===1&&p.kind==='exit')!,open=new Quaternion().fromArray(manifest.stations[1].dock.lid);
 const poses=[];let previous=0;
 for(let n=0;n<=100;n++){
  const state=evaluate((exit.start+(exit.end-exit.start)*n/100)/totalUnits);
  const pose=workstationLid(state,open),angle=open.angleTo(pose);assert.ok(angle>=previous-1e-8);previous=angle;poses.push(pose);
 }
 assert.ok(poses[100].angleTo(workstationLid(stateAt(0),open))<1e-7,'no hinge jump at takeoff');
 for(let n=100;n>=0;n--){const state=evaluate((exit.start+(exit.end-exit.start)*n/100)/totalUnits);assert.ok(workstationLid(state,open).angleTo(poses[n])<1e-7);}
});
test('the complete rotating silhouette fits desktop and phone with a stable middle camera',()=>{
 for(const aspect of [1.5,390/844])for(let n=0;n<=240;n++){
  const p=n/240,state=stateAt(p),pose=evaluateCamera(manifest,state,aspect).pose;
  sample(state.heroTime);lid.quaternion.copy(workstationLid(state,lid.quaternion));hero.root.updateMatrixWorld(true);
  const cam=new OrthographicCamera(-pose.width/2,pose.width/2,pose.width/aspect/2,-pose.width/aspect/2,.01,100);
  cam.position.fromArray(pose.position);cam.quaternion.fromArray(pose.quaternion);cam.updateProjectionMatrix();cam.updateMatrixWorld(true);
  const points:Vector3[]=[];
  hero.root.traverse(o=>{if(o instanceof Mesh){const box=o.geometry.boundingBox!;for(const x of [box.min.x,box.max.x])for(const y of [box.min.y,box.max.y])for(const z of [box.min.z,box.max.z])points.push(new Vector3(x,y,z).applyMatrix4(o.matrixWorld).project(cam));}});
  assert.ok(points.every(v=>Math.abs(v.x)<.97&&Math.abs(v.y)<.97),`silhouette clips at ${p} / ${aspect}`);
  if(p>=.2&&p<=.7)assert.ok(Math.abs(pose.width-.70)<1e-6,'no edge-on zoom pumping');
 }
});
