import test from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';import {Box3,Vector3,Quaternion,OrthographicCamera} from 'three';
import {evaluate,phases,totalUnits} from '../src/journey';import {fsaeFocus,detailPose,piPlacement,detailTextItems} from '../src/fsae-focus';import {evaluateCamera} from '../src/camera';import {loadGeometry} from './asset-geometry';
const manifest=JSON.parse(fs.readFileSync('public/assets/journey.json','utf8'));
const state=(kind:string,p:number)=>{const phase=phases.find(x=>x.kind===kind)!;return evaluate((phase.start+(phase.end-phase.start)*p)/totalUnits)};
test('FSAE retains only data logging in order without changing station identity',()=>{
 assert.deepEqual(phases.filter(x=>x.station===3).map(x=>x.kind),['screen-zoom','hold','data-dive','data-isolate','data-reveal','data-hold','data-return','car-shrink']);
 assert.deepEqual(fsaeFocus(state('data-hold',.2)),fsaeFocus(state('data-hold',.7)));
});
test('the Pi stays rendered while the opaque car darkens, and only then the camera orbits',()=>{
 for(const kind of ['data-dive','data-isolate','data-reveal','data-hold'])for(let n=0;n<100;n++){
  const focus=fsaeFocus(state(kind,n/100));assert.equal(focus.detailOpacity,1);assert.equal(focus.cutaway,1);
  const forward=fsaeFocus(state(kind,n/100));assert.deepEqual(fsaeFocus(state(kind,n/100)),forward);
 }
 for(const aspect of [1.5,390/844]){
  const a=evaluateCamera(manifest,state('data-isolate',0),aspect).pose,b=evaluateCamera(manifest,state('data-isolate',.7),aspect).pose;
  assert.deepEqual(a,b);assert.equal(fsaeFocus(state('data-isolate',.7)).carOpacity,0);
 }
});
test('text staging is monotonic, ends completely revealed and respects reduced motion',()=>{
 const end=detailTextItems(1);assert.ok(end.every(x=>x.opacity===1&&x.y===0));
 assert.ok(detailTextItems(0).every(x=>x.opacity===0));
 assert.ok(detailTextItems(.35)[0].opacity>detailTextItems(.35)[2].opacity);
 assert.ok(detailTextItems(.5,true).every(x=>x.y===0));
});
test('actual detail meshes fit desktop and phone model regions without intersecting copy',async()=>{
 for(const [project,file] of [['data','raspberry-pi-5']] as const){
  const asset=await loadGeometry('public/assets/'+file+'.glb');const placement=piPlacement(manifest);asset.root.position.fromArray(placement.position);asset.root.scale.setScalar(placement.scale);asset.root.rotation.set(0,placement.yaw,0);asset.root.updateMatrixWorld(true);
  for(const aspect of [1200/900,2040/1134,390/844,3]){
   const pose=detailPose(project,aspect,manifest),cam=new OrthographicCamera(-pose.width/2,pose.width/2,pose.width/aspect/2,-pose.width/aspect/2,.001,100);
   cam.position.fromArray(pose.position);cam.quaternion.fromArray(pose.quaternion);cam.updateMatrixWorld(true);
   const points:Vector3[]=[];asset.root.traverse(o=>{if('geometry' in o){const pos=(o as any).geometry.attributes.position;for(let i=0;i<pos.count;i++)points.push(new Vector3().fromBufferAttribute(pos,i).applyMatrix4(o.matrixWorld).project(cam));}});
   for(const p of points){assert.ok(p.x>-.98&&p.x<.98&&p.y>-.98&&p.y<.98,`${project} ${aspect} clipped ${p.toArray()}`);if(aspect>=.85)assert.ok(p.x>-.12,'model stays right of copy');else assert.ok(p.y>.06,'model stays above phone copy');}
  }
 }
});
test('Pi source has physical scale, retained geometry and distributed license',async()=>{
 const a=await loadGeometry('public/assets/raspberry-pi-5.glb');a.root.updateMatrixWorld(true);const size=new Box3().setFromObject(a.root,true).getSize(new Vector3());
 assert.ok(size.x>.084&&size.x<.09);assert.ok(size.z>.055&&size.z<.058);assert.match(fs.readFileSync('public/assets/raspberry-pi-5-LICENSE.txt','utf8'),/MIT License/);
 for(const file of ['raspberry-pi-5'])assert.ok(fs.statSync('public/assets/'+file+'.webp').size>1000);
});

test('prepared car and manifest contain only the data-logging presentation',async()=>{
 assert.deepEqual(Object.keys(manifest.reorder.car.anchors),['data']);
 assert.deepEqual(Object.keys(manifest.reorder.car.focusRoutes),['data']);
 const asset=await loadGeometry('public/assets/station-formula-sae.glb');let labels=0;
 asset.root.traverse(o=>{assert.doesNotMatch(o.name,/PedalSensor/);if(o.name.includes('FSAE_Label_'))labels++;});
 assert.equal(labels,1);
 for(const dir of ['public/assets','../exports/web','../exports/fsae-details'])assert.equal(fs.readdirSync(dir).filter(p=>p.startsWith('pedal-sensor')).length,0);
});

test('indexed car geometry leaves the spline camera and logger sightline clear',async()=>{
 const {Raycaster,Mesh,DoubleSide}=await import('three');
 const car=await loadGeometry('public/assets/station-formula-sae.glb');car.root.position.fromArray(manifest.stations[3].origin);car.root.updateMatrixWorld(true);
 const obstacles:Mesh[]=[];car.root.traverse(o=>{if(o instanceof Mesh&&!/Label|Connector/.test(o.parent!.name)){(o.material as any).side=DoubleSide;obstacles.push(o);}});
 const phase=phases.find(p=>p.kind==='data-dive')!;let previous:Vector3|undefined;
 for(let n=0;n<=1000;n++){
  const state={...evaluate((phase.start+.1)/totalUnits),phase,local:n/1000};
  const position=new Vector3().fromArray(evaluateCamera(manifest,state,1.5).pose.position);
  if(previous){const delta=position.clone().sub(previous);if(delta.length()>1e-9)assert.equal(new Raycaster(previous,delta.clone().normalize(),0,delta.length()+.001).intersectObjects(obstacles,false).length,0,`camera crosses car at ${n}`);}
  if(n>=800){const delta=new Vector3().fromArray(manifest.reorder.car.anchors.data).add(new Vector3(0,.003,0)).sub(position);assert.equal(new Raycaster(position,delta.clone().normalize(),0,delta.length()-.005).intersectObjects(obstacles,false).length,0,`logger blocked at ${n}`);}
  previous=position;
 }
});

test('logger stays at screen centre throughout the rotating close approach',()=>{
 for(const aspect of [1512/771,1.5,390/844])for(let n=30;n<=100;n++){
  const pose=evaluateCamera(manifest,state('data-dive',n/100),aspect).pose;
  const camera=new OrthographicCamera(-pose.width/2,pose.width/2,pose.width/aspect/2,-pose.width/aspect/2,.001,100);
  camera.position.fromArray(pose.position);camera.quaternion.fromArray(pose.quaternion);camera.updateMatrixWorld(true);
  const screen=new Vector3().fromArray(manifest.reorder.car.anchors.data).project(camera);
  assert.ok(Math.abs(screen.x)<1e-6&&Math.abs(screen.y)<1e-6,`logger drifts at ${n}% / ${aspect}: ${screen.toArray()}`);
 }
});
