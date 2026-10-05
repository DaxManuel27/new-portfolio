import test from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';
import {Box3,Quaternion,Vector3} from 'three';
import {loadGeometry} from './asset-geometry';import {createHeroSampler} from '../src/hero';import {evaluate,phases,totalUnits,heroVisible} from '../src/journey';
const manifest=JSON.parse(fs.readFileSync('public/assets/journey.json','utf8'));
const [hero,old,desk]=await Promise.all([loadGeometry('public/assets/macbook-journey.glb'),loadGeometry('../backups/pre-station-reorder/web/public/assets/macbook-journey.glb'),loadGeometry('public/assets/station-ultra-maritime.glb')]);
const sample=createHeroSampler(hero.root,hero.clip),oldSample=createHeroSampler(old.root,old.clip);
const feet=hero.root.getObjectByName('Journey_TravelFeet')!,spin=hero.root.getObjectByName('Journey_MacBook_SpinPivot')!,lid=hero.root.getObjectByName('Journey_MacBook_LidPivot')!,dock=manifest.stations[2].dock;
desk.root.position.fromArray(manifest.stations[2].origin);desk.root.updateMatrixWorld(true);
const obs=desk.root.children.flatMap(()=>[] as any[]);
desk.root.traverse(o=>{if(/Monitor_.*(Housing|StandBase|StandStem)|Mug_Body/.test(o.name))obs.push({name:o.name,box:new Box3().setFromObject(o,true)});});
const renderedSample=createHeroSampler(hero.root,hero.clip,manifest.stations[1].dock);
function apply(state:ReturnType<typeof evaluate>){renderedSample(state.heroTime);feet.position.lerp(new Vector3().fromArray(dock.position),state.dock);spin.quaternion.slerp(new Quaternion().fromArray(dock.quaternion),state.dock);lid.quaternion.slerp(new Quaternion().fromArray(dock.lid),state.dock);hero.root.updateMatrixWorld(true);}
test('re-export preserves Intro, landing and first-flight rotations outside the corrected path',()=>{
 for(let i=0;i<=240;i++){const t=i/60;sample(t);oldSample(t);for(const name of ['Journey_TravelFeet','Journey_MacBook_SpinPivot','Journey_MacBook_LidPivot']){const a=hero.root.getObjectByName(name)!,b=old.root.getObjectByName(name)!;if(name!=='Journey_TravelFeet'||t<=2||t>=3.9)assert.ok(a.position.distanceTo(b.position)<2e-5,`${name} position ${t}`);assert.ok(a.quaternion.angleTo(b.quaternion)<2e-5,`${name} orientation ${t}`);}}
});
test('the Workstation flight and opening clear every monitor and mug; landed feet rest on the tabletop',()=>{
 const parts=phases.filter(p=>p.station===2);
 for(const p of parts)for(let n=0;n<=180;n++){
  const state=evaluate((p.start+(p.end-p.start)*n/180)/totalUnits);apply(state);const box=new Box3().setFromObject(hero.root,true);
  for(const obstacle of obs)assert.ok(!box.intersectsBox(obstacle.box),`${p.kind} ${n}: ${obstacle.name}`);
  if(p.kind!=='travel')assert.ok(box.min.y>=.7399,'never sinks below desk');
 }
 apply(evaluate((parts[2].start+.1)/totalUnits));const b=new Box3().setFromObject(hero.root,true);assert.ok(Math.abs(b.min.y-.74)<.0003);assert.ok(b.min.z>manifest.stations[2].origin[2]-.375&&b.max.z<manifest.stations[2].origin[2]+.375);
});

test('exported Workstation flight retains a full rotation in forward and reverse scroll',()=>{
 const flight=phases.find(p=>p.station===2&&p.kind==='travel')!;
 for(const direction of [1,-1]){
  let distance=0,bakedDistance=0;let previous:Quaternion|undefined,bakedPrevious:Quaternion|undefined;
  for(let n=0;n<=480;n++){
   const fraction=direction===1?n/480:1-n/480;
   const state=evaluate((flight.start+(flight.end-flight.start)*fraction)/totalUnits);
   apply(state);
   if(previous)distance+=previous.angleTo(spin.quaternion);
   previous=spin.quaternion.clone();
   sample(state.heroTime);
   if(bakedPrevious)bakedDistance+=bakedPrevious.angleTo(spin.quaternion);
   bakedPrevious=spin.quaternion.clone();
  }
  // The planted heading removes the old 17.3-degree on-table correction.
  // Departure may reconcile that heading once, while retaining the full roll.
  sample(4);const heading=spin.quaternion.angleTo(new Quaternion().fromArray(manifest.stations[1].dock.quaternion));
  assert.ok(distance>Math.PI*1.98&&distance<=bakedDistance+heading+.001,`full turn survives export: ${distance*180/Math.PI} degrees`);
 }
 sample(5.8);
 assert.ok(spin.quaternion.angleTo(new Quaternion())>Math.PI/2,'mid-flight orientation visibly turns away from the landing heading');
 sample(8);
 assert.ok(spin.quaternion.angleTo(new Quaternion())<1e-5,'upright before landing');
});
