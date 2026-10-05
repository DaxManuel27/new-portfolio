import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { Quaternion, Vector3 } from 'three';
import { evaluate, phases, totalUnits } from '../src/journey';
import { evaluateCamera, sampleTravel, contactDeskPose } from '../src/camera';
import type { CameraPose, Manifest } from '../src/types';

const manifest: Manifest=JSON.parse(fs.readFileSync('public/assets/journey.json','utf8'));
const near=(a:number,b:number,message:string,tolerance=1e-9)=>assert.ok(Math.abs(a-b)<tolerance,`${message}: ${a} versus ${b}`);
const cameraAt=(units:number,aspect=1.5)=>evaluateCamera(manifest,evaluate(units/totalUnits),aspect).pose;
function samePose(a:CameraPose,b:CameraPose,message:string,tolerance=1e-9){
 a.position.forEach((x,i)=>near(x,b.position[i],`${message} position ${i}`,tolerance));
 // q and -q describe the same rotation.
 const sign=a.quaternion.reduce((sum,x,i)=>sum+x*b.quaternion[i],0)<0?-1:1;
 a.quaternion.forEach((x,i)=>near(x,b.quaternion[i]*sign,`${message} quaternion ${i}`,tolerance));
 near(a.width,b.width,`${message} width`,tolerance);
}
function responsive(pose:CameraPose,aspect:number,center=.5){
 const width=Math.max(pose.width*Math.max(1,aspect/1.5),(pose.minHeight??0)*aspect);
 const right=new Vector3(1,0,0).applyQuaternion(new Quaternion().fromArray(pose.quaternion));
 const position=new Vector3().fromArray(pose.position).addScaledVector(right,(.5-center)*(width-pose.width));
 return {position:position.toArray(),quaternion:pose.quaternion,width};
}

test('every camera approaches its approved focus directly and leaves for the exact travel boundary',()=>{
 for(const aspect of [1.5,390/844,16/9]) for(const phase of phases.filter(p=>[1,5,6].includes(p.station)&&(p.kind==='approach'||p.kind==='exit'))){
  const station=manifest.stations[phase.station],sample=sampleTravel(manifest,phase.station*4);
  const shared=phase.station===6||(phase.station===5&&phase.kind==='exit');
  const boundary=shared?responsive(station.wide,aspect):phase.station===5?responsive(contactDeskPose(manifest),aspect):responsive(sample,aspect,sample.center[0]),focus=responsive(station.hasClose?station.close:station.wide,aspect);
  const start=phase.kind==='approach'?boundary:focus,end=phase.kind==='approach'?focus:boundary;
  samePose(cameraAt(phase.start,aspect),start,`${phase.station} ${phase.kind} start at ${aspect}`);
  samePose(cameraAt(phase.end,aspect),end,`${phase.station} ${phase.kind} end at ${aspect}`);
  const direction=Math.sign(end.width-start.width);
  let previous=start.width;
  for(let i=0;i<=200;i++){
   const pose=cameraAt(phase.start+(phase.end-phase.start)*i/200,aspect);
   assert.ok(direction*(pose.width-previous)>=-1e-10,`${phase.station} ${phase.kind} width reverses at ${i}`);
   assert.ok(pose.width>=Math.min(start.width,end.width)-1e-10&&pose.width<=Math.max(start.width,end.width)+1e-10,`${phase.station} ${phase.kind} detours wider than both endpoints`);
   previous=pose.width;
  }
 }
});
test('old reveal/close and pullback/depart boundaries no longer stop or reverse the camera',()=>{
 for(const phase of phases.filter(p=>(p.kind==='approach'||p.kind==='exit')&&p.station!==2&&p.station<5)){
  const oldBoundary=phase.start+(phase.kind==='approach'?.35:.45),h=.0001;
  const left=cameraAt(oldBoundary-h),middle=cameraAt(oldBoundary),right=cameraAt(oldBoundary+h);
  const slopeBefore=(middle.width-left.width)/h,slopeAfter=(right.width-middle.width)/h;
  assert.ok(slopeBefore*slopeAfter>0,`${phase.station} ${phase.kind} stops or reverses at former phase boundary`);
  assert.ok(Math.abs(slopeBefore-slopeAfter)<.003,`${phase.station} ${phase.kind} width has a kink`);
 }
});
test('position and orientation also interpolate directly without a hidden wide-view detour',()=>{
 for(const phase of phases.filter(p=>[1,5,6].includes(p.station)&&(p.kind==='approach'||p.kind==='exit'))){
  const station=manifest.stations[phase.station],boundary=phase.station===6||(phase.station===5&&phase.kind==='exit')?station.wide:phase.station===5?contactDeskPose(manifest):sampleTravel(manifest,phase.station*4),focus=station.hasClose?station.close:station.wide;
  for(const t of [.1,.25,.35/.9,.5,.75,.9]){
   const smooth=t*t*(3-2*t);
   let mix=phase.kind==='approach'?smooth:1-smooth;
   if([1,3,4].includes(phase.station)){
    const duration=phase.end-phase.start;
    const dockT=Math.min(1,Math.max(0,phase.kind==='approach'?duration*t/.35:duration*(1-t)/.25));
    const dock=dockT*dockT*(3-2*dockT);
    mix=.75*dock+.25*mix;
   }
   const expected={
    position:new Vector3().fromArray(boundary.position).lerp(new Vector3().fromArray(focus.position),mix).toArray(),
    quaternion:new Quaternion().fromArray(boundary.quaternion).slerp(new Quaternion().fromArray(focus.quaternion),mix).toArray(),
    width:boundary.width+(Math.max(focus.width,(focus.minHeight??0)*1.5)-boundary.width)*mix,
   };
   samePose(cameraAt(phase.start+(phase.end-phase.start)*t),expected,`${station.id} ${phase.kind} direct pose at ${t}`);
  }
 }
});
test('holds preserve an identical focus pose, including Formula SAE overview and overhead stops',()=>{
 for(const aspect of [1.5,390/844,16/9])for(const phase of phases.filter(p=>p.kind==='hold')){
  const first=cameraAt(phase.start,aspect),station=manifest.stations[phase.station];
  samePose(first,responsive(station.hasClose?station.close:station.wide,aspect),`${station.id} approved focus`);
  for(let i=1;i<20;i++)samePose(cameraAt(phase.start+(phase.end-phase.start)*i/20,aspect),first,`${station.id} stable hold`);
 }
});
test('all phase joins are continuous in camera position, rotation and width on desktop and portrait',()=>{
 // The dive ends on the DOM reel, which covers the canvas, so the reel's own camera need not match the dive's end.
 for(const aspect of [1.5,390/844,16/9])for(const phase of phases.slice(1).filter(p=>p.kind!=='reel')){
  const before=cameraAt(phase.start-1e-9,aspect),after=cameraAt(phase.start+1e-9,aspect);
  samePose(before,after,`${phase.station} ${phase.kind} join`,1e-7);
 }
});
test('camera state agrees for forward, reverse and direct seeks',()=>{
 const points=Array.from({length:443},(_,i)=>totalUnits*i/442);
 const forward=points.map(units=>cameraAt(units));
 for(let i=points.length-1;i>=0;i--)assert.deepEqual(cameraAt(points[i]),forward[i],`reverse camera at ${points[i]}`);
 for(const i of [440,17,212,3,333,104])assert.deepEqual(cameraAt(points[i]),forward[i],`direct seek camera at ${points[i]}`);
});

test('shared desk switch stays directly overhead, keeps the laptop landed and finishes quickly',()=>{
 const exit=phases.find(p=>p.station===5&&p.kind==='exit')!,hold=phases.find(p=>p.station===6&&p.kind==='hold')!;
 assert.ok(hold.start-exit.start<.7);
 for(let i=0;i<=200;i++){
  const state=evaluate((exit.start+(hold.end-exit.start)*i/200)/totalUnits);
  const pose=evaluateCamera(manifest,state).pose;
  const direction=new Vector3(0,0,-1).applyQuaternion(new Quaternion().fromArray(pose.quaternion));
  near(direction.x,0,'overhead x');near(direction.y,-1,'overhead down');near(direction.z,0,'overhead z');
  assert.equal(state.dock,1);assert.equal(state.heroTime,20);assert.equal(state.paper,0);
 }
 assert.deepEqual(manifest.stations[5].origin,manifest.stations[6].origin);
 assert.deepEqual(manifest.stations[5].dock,manifest.stations[6].dock);
});

test('Workstation pans between the two measured monitors without moving the hero',()=>{
 const p=phases.find(p=>p.kind==='pan')!;
 for(const aspect of [1.5,390/844]){
  samePose(cameraAt(p.start,aspect),responsive(manifest.reorder.workstation.close,aspect),'UM pan start');
  samePose(cameraAt(p.end,aspect),responsive(manifest.reorder.workstation.monitorClose,aspect),'FSAE pan end');
  for(let i=0;i<=100;i++){const pose=cameraAt(p.start+(p.end-p.start)*i/100,aspect);assert.ok(pose.position.every(Number.isFinite));near(pose.width,.69,'pan scale',1e-6);}
 }
});
test('both screen zooms fill the viewport before the destination swap, on desktop and phone',async()=>{
 const {portalSize,SCREEN_FILL,SCREEN_SWAP}=await import('../src/camera');
 for(const aspect of [1.5,390/844,16/9])for(const phase of phases.filter(p=>p.kind==='screen-zoom')){
  const screen=phase.station===3?manifest.reorder.workstation.screens.fsae:manifest.reorder.ultrawide.screen;
  const frame=portalSize(screen,aspect),u=phase.start+(phase.end-phase.start)*SCREEN_FILL;
  near(cameraAt(u,aspect).width,frame.width,'screen matches viewport');
  samePose(cameraAt(u,aspect),cameraAt(phase.start+(phase.end-phase.start)*(SCREEN_SWAP-.0001),aspect),'stable full screen before swap',1e-7);
  assert.ok(frame.width<=screen.width&&frame.height<=screen.height);
 }
});

test('edge-to-edge car preview matches the destination crop at the screen handoff',async()=>{
 const {carPreviewPose,portalSize,responsive,SCREEN_FILL}=await import('../src/camera');
 const frame=manifest.reorder.workstation.screens.fsae;
 for(const aspect of [390/844,1.5,16/9,3]){
  const start=carPreviewPose(manifest.reorder.car.close,frame,aspect,0);
  near(start.width,responsive(manifest.reorder.car.close,frame.width/frame.height).width,'monitor framing independent of browser shape');
  const end=carPreviewPose(manifest.reorder.car.close,frame,aspect,SCREEN_FILL);
  near(end.width*portalSize(frame,aspect).width/frame.width,responsive(manifest.reorder.car.close,aspect).width,'full-screen crop has no scale jump');
 }
});

test('screen zoom faces the angled glass squarely at the handoff',async()=>{
 const {screenZoom}=await import('../src/camera');
 const frame=manifest.reorder.workstation.screens.fsae;
 assert.ok(frame.normal[0]<-.1,'right monitor angles toward the desk centre');
 assert.ok(manifest.reorder.workstation.screens.um.normal[0]>.1,'left monitor angles toward the desk centre');
 const end=screenZoom(manifest.reorder.workstation.monitorClose,frame,1,16/9);
 const orientation=new Quaternion().fromArray(end.quaternion);
 for(const [axis,key] of [[new Vector3(1,0,0),'right'],[new Vector3(0,1,0),'up'],[new Vector3(0,0,1),'normal']] as const){
  assert.ok(axis.applyQuaternion(orientation).distanceTo(new Vector3().fromArray(frame[key]))<1e-8);
 }
});
