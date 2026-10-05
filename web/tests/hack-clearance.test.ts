import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {Box3, Vector3, Quaternion} from 'three';
import {loadGeometry} from './asset-geometry';
import {createHeroSampler} from '../src/hero';
import {evaluate, phases, totalUnits} from '../src/journey';
const manifest=JSON.parse(fs.readFileSync('public/assets/journey.json','utf8'));
const [hero,station]=await Promise.all([loadGeometry('public/assets/macbook-journey.glb'),loadGeometry('public/assets/station-hack-atlantic.glb')]);
station.root.position.fromArray(manifest.stations[1].origin);station.root.updateMatrixWorld(true);
const obstacles:{name:string;box:Box3}[]=[];
station.root.traverse(o=>{if(/Banner/.test(o.name)&&o.children.some(c=>c.type==='Mesh'))obstacles.push({name:o.name,box:new Box3().setFromObject(o,true).expandByScalar(.01)});});
const sample=createHeroSampler(hero.root,hero.clip,manifest.stations[1].dock);
function bounds(progress:number){
 const state=evaluate(progress);sample(state.heroTime);
 const dock=manifest.stations[state.phase.station].dock;
 hero.root.getObjectByName('Journey_TravelFeet')!.position.lerp(new Vector3().fromArray(dock.position),state.dock);
 hero.root.getObjectByName('Journey_MacBook_SpinPivot')!.quaternion.slerp(new Quaternion().fromArray(dock.quaternion),state.dock);
 hero.root.getObjectByName('Journey_MacBook_LidPivot')!.quaternion.slerp(new Quaternion().fromArray(dock.lid),state.dock);
 hero.root.updateMatrixWorld(true);return new Box3().setFromObject(hero.root,true);
}
test('Hack Atlantic arrival, docking and departure clear banners and stands by 1 cm in both scroll directions',()=>{
 assert.equal(obstacles.length,15);
 const checkpoints:number[]=[];
 for(const phase of phases.filter(p=>p.station===1||(p.station===2&&p.kind==='travel'))){
  for(let i=0;i<=960;i++){
   const progress=(phase.start+(phase.end-phase.start)*i/960)/totalUnits;
   // The first half of the incoming flight precedes the station appearing.
   if(phase.station===1&&phase.kind==='travel'&&evaluate(progress).heroTime<2)continue;
   checkpoints.push(progress);
  }
 }
 for(const direction of [checkpoints,[...checkpoints].reverse()])for(const progress of direction){
  const box=bounds(progress);
  for(const obstacle of obstacles)assert.ok(!box.intersectsBox(obstacle.box),`${evaluate(progress).phase.kind} t=${evaluate(progress).heroTime}: ${obstacle.name}`);
 }
});

test('final descent is vertical, dock blends cannot slide the laptop, and feet meet the actual table mesh',()=>{
 const feet=hero.root.getObjectByName('Journey_TravelFeet')!,spin=hero.root.getObjectByName('Journey_MacBook_SpinPivot')!,lid=hero.root.getObjectByName('Journey_MacBook_LidPivot')!,dock=manifest.stations[1].dock;
 const target=new Vector3().fromArray(dock.position),rotation=new Quaternion().fromArray(dock.quaternion);
 let previousHeight=Infinity;
 for(let i=0;i<=60;i++){
  sample(3.7+.3*i/60);
  assert.ok(Math.hypot(feet.position.x-target.x,feet.position.z-target.z)<.0001);
  assert.ok(spin.quaternion.angleTo(rotation)<.00001);
  assert.ok(feet.position.y<=previousHeight+1e-9);previousHeight=feet.position.y;
 }
 for(const phase of phases.filter(p=>p.station===1&&p.kind!=='travel'))for(let i=0;i<20;i++){
  bounds((phase.start+(phase.end-phase.start)*i/20)/totalUnits);
  assert.ok(feet.position.distanceTo(target)<.0001);
  assert.ok(spin.quaternion.angleTo(rotation)<.00001);
 }
 sample(4);hero.root.updateMatrixWorld(true);
 const table=station.root.getObjectByName('HackAtlantic_HackAtlantic_Desktop.001')!;
 const gap=new Box3().setFromObject(hero.root,true).min.y-new Box3().setFromObject(table,true).max.y;
 assert.ok(gap>=0&&gap<.0002,`contact gap ${gap} m`);
 assert.ok(lid.quaternion.angleTo(new Quaternion().fromArray(dock.lid))<.00001);
 for(const time of [3.3,3.5,3.7,4,4.15,4.3,4.8]){
  sample(time);const expected=[...feet.position.toArray(),...spin.quaternion.toArray(),...lid.quaternion.toArray()];
  sample(7);sample(time);assert.deepEqual([...feet.position.toArray(),...spin.quaternion.toArray(),...lid.quaternion.toArray()],expected);
  sample(time-1e-6);const before=feet.position.clone(),q=spin.quaternion.clone();sample(time+1e-6);
  assert.ok(before.distanceTo(feet.position)<.00002,`position continuity ${time}`);
  assert.ok(q.angleTo(spin.quaternion)<.0001,`rotation continuity ${time}`);
 }
 for(const time of [4,4.05,4.15,4.3]){sample(time);assert.ok(Math.hypot(feet.position.x-target.x,feet.position.z-target.z)<.0001);assert.ok(spin.quaternion.angleTo(rotation)<.00001);}
 const baked=createHeroSampler(hero.root,hero.clip);
 for(const time of [0,1,2,2.8,4.8,5,6,8]){baked(time);const expected=[...feet.position.toArray(),...spin.quaternion.toArray(),...lid.quaternion.toArray()];sample(time);assert.deepEqual([...feet.position.toArray(),...spin.quaternion.toArray(),...lid.quaternion.toArray()],expected);}
});


test('the entire late arrival descends without a rise, hover, or table penetration',()=>{
 const feet=hero.root.getObjectByName('Journey_TravelFeet')!;
 const tabletop=new Box3().setFromObject(station.root.getObjectByName('HackAtlantic_HackAtlantic_Desktop.001')!,true).max.y;
 let previous=Infinity;
 for(let i=0;i<=1000;i++){
  const t=2.8+1.2*i/1000;sample(t);const y=feet.position.y;
  assert.ok(y<previous,`no rise or plateau at ${t}: ${previous} -> ${y}`);previous=y;
  hero.root.updateMatrixWorld(true);
  assert.ok(new Box3().setFromObject(hero.root,true).min.y>=tabletop-1e-6,`table penetration at ${t}`);
 }
 const h=1e-4;
 const y=(t:number)=>{sample(t);return feet.position.y;};
 const start=y(2.8),left=(start-y(2.8-h))/h,right=(y(2.8+h)-start)/h;
 assert.ok(Math.abs(left-right)<.002,`incoming velocity ${left} vs ${right}`);
 assert.ok(Math.abs((y(4)-y(4-h))/h)<.001,'zero vertical velocity at touchdown');
 for(const t of [3.2,3.25,3.35,3.4,3.5,3.6,3.7,3.9,4].reverse()){
  const expected=y(t);sample(6);assert.equal(y(t),expected,'independent of seek history');
 }
});
