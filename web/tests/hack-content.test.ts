import test from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';
import {Vector3,OrthographicCamera} from 'three';import {evaluate,phases,totalUnits} from '../src/journey';import {evaluateCamera} from '../src/camera';
test('Hack Atlantic close camera centres and fits the laptop display',()=>{
 const m=JSON.parse(fs.readFileSync('public/assets/journey.json','utf8')),phase=phases.find(p=>p.station===1&&p.kind==='hold')!;
 for(const aspect of [1512/771,1.5,390/844]){
  const pose=evaluateCamera(m,evaluate((phase.start+.2)/totalUnits),aspect).pose;
  const camera=new OrthographicCamera(-pose.width/2,pose.width/2,pose.width/aspect/2,-pose.width/aspect/2,.001,100);camera.position.fromArray(pose.position);camera.quaternion.fromArray(pose.quaternion);camera.updateMatrixWorld(true);
  const center=new Vector3(...m.stations[1].dock.position).add(new Vector3(0,.117483,-.143967)).project(camera);
  assert.ok(Math.abs(center.x)<1e-6&&Math.abs(center.y)<1e-6);assert.ok(pose.width<.5);
 }
});
