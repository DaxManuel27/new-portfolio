import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {Box3,Quaternion,Vector3} from 'three';
import {evaluate,phases,totalUnits} from '../src/journey';
import {evaluateCamera,responsive,screenZoom} from '../src/camera';
import {fsaeFocus} from '../src/fsae-focus';
import {loadGeometry} from './asset-geometry';
const m=JSON.parse(fs.readFileSync('public/assets/journey.json','utf8'));
function state(kind:string,local:number){const p=phases.find(p=>p.kind===kind)!;return {...evaluate((p.start+(p.end-p.start)*.5)/totalUnits),phase:p,local};}
const pose=(k:string,t:number,a:number)=>evaluateCamera(m,state(k,t),a).pose;
function same(a:any,b:any){assert.ok(new Vector3().fromArray(a.position).distanceTo(new Vector3().fromArray(b.position))<1e-6);assert.ok(new Quaternion().fromArray(a.quaternion).angleTo(new Quaternion().fromArray(b.quaternion))<1e-6);assert.ok(Math.abs(a.width-b.width)<1e-6);}
test('return transforms the car onto the separate desk before unchanged reel',()=>{
 const i=phases.findIndex(p=>p.kind==='data-hold');assert.deepEqual(phases.slice(i,i+6).map(p=>p.kind),['data-hold','data-return','car-shrink','projects-reveal','projects-monitor-entry','reel']);
 assert.ok(!phases.some(p=>p.kind as string==='pi-monitor-entry'));
});
test('new camera phase joins are continuous',()=>{
 for(const a of [390/844,1200/900,2040/1134]){
  for(const [before,after] of [['data-hold','data-return'],['data-return','car-shrink'],['car-shrink','projects-reveal'],['projects-reveal','projects-monitor-entry']])same(pose(before,1,a),pose(after,0,a));
  same(pose('projects-monitor-entry',.94,a),screenZoom(responsive(m.reorder.ultrawide.wide,a),m.reorder.ultrawide.screen,1,a));
 }
});
test('desk additions retain the separate monitor layout and fit the tabletop',async()=>{
 const old=JSON.parse(fs.readFileSync('../backups/fsae-desk-return/layout.json','utf8'));
 assert.deepEqual(m.reorder.origins.workstation,old.origins.workstation);assert.deepEqual(m.reorder.origins.car,old.origins.car);
 const delta=new Vector3().fromArray(m.reorder.origins.ultrawide).sub(new Vector3().fromArray(old.origins.ultrawide));
 assert.ok(new Vector3().fromArray(m.reorder.origins.ultrawide).distanceTo(new Vector3().fromArray(m.reorder.origins.workstation))>5,'desks occupy distinct locations');
 assert.deepEqual({...m.reorder.ultrawide.screen,center:old.ultrawide.screen.center},old.ultrawide.screen);
 assert.ok(new Vector3().fromArray(m.reorder.ultrawide.screen.center).sub(delta).distanceTo(new Vector3().fromArray(old.ultrawide.screen.center))<1e-8);assert.deepEqual(m.reorder.workstation,old.workstation);
 const asset=await loadGeometry('public/assets/station-projects.glb');asset.root.updateMatrixWorld(true);
 for(const name of ['Projects_Keyboard_60','Projects_Mouse']){
  const o=asset.root.getObjectByName(name);assert.ok(o,name);
  const box=new Box3().setFromObject(o,true);assert.ok(box.min.x>=-.875&&box.max.x<=.875);assert.ok(box.min.y>=.739&&box.min.y<.748,`${name} rests on desk`);assert.ok(box.min.z>=-.375&&box.max.z<=.375);
 }
 const report=JSON.parse(fs.readFileSync('../exports/station-reorder/projects-props-report.json','utf8'));assert.equal(report.keys,61);assert.ok(Object.values(report.triangles).reduce((a:number,b:any)=>a+b,0)<=35000);
 assert.ok(!asset.root.getObjectByName('Text_PersonalProjects'),'physical title removed from export');
 assert.ok(!asset.root.getObjectByName('Projects_DisplayCar_Reference'),'no duplicate car shipped in desk GLB');
});
