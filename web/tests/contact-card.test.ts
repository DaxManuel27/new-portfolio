import test from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';
import {OrthographicCamera,Vector3} from 'three';
import {expandContactWindow,reelView} from '../src/reel';import {phases,evaluate,totalUnits} from '../src/journey';import {evaluateCamera} from '../src/camera';
const manifest=JSON.parse(fs.readFileSync('public/assets/journey.json','utf8'));
test('live window projection centres the same scene within its moving rectangle',()=>{
 for(const [width,height] of [[1280,800],[1440,960],[1920,1080],[2560,1440],[390,844]])for(const t of [0,.2,.5,.9,1]){
  const rect=expandContactWindow({x:width*.65,y:height*.25,width:width*.2,height:height*.5,radius:8},{width,height},t);
  const cam=new OrthographicCamera(-1,1,rect.height/rect.width,-rect.height/rect.width,.001,100);cam.position.z=2;cam.setViewOffset(rect.width,rect.height,-rect.x,-rect.y,width,height);cam.updateMatrixWorld();
  const p=new Vector3().project(cam);assert.ok(Math.abs((p.x+1)*width/2-(rect.x+rect.width/2))<1e-8);assert.ok(Math.abs((1-p.y)*height/2-(rect.y+rect.height/2))<1e-8);
 }
});
test('expanded preview and desk approach have the same camera at every supported aspect',()=>{
 const expand=phases.find(p=>p.kind==='contact-card-expand')!,approach=phases.find(p=>p.kind==='approach'&&p.station===5)!;
 assert.equal(expand.end,approach.start);
 for(const aspect of [.46,1.5,1.6,16/9,2.4]){
  const a={...evaluate(expand.start/totalUnits),phase:expand,local:1},b={...evaluate(approach.start/totalUnits),phase:approach,local:0};
  assert.deepEqual(evaluateCamera(manifest,a,aspect).pose,evaluateCamera(manifest,b,aspect).pose);
 }
});
test('contact entry adds no extra project and can be scrubbed backward without retained state',()=>{
 const reel=phases.find(p=>p.kind==='reel')!,center=phases.find(p=>p.kind==='contact-card-center')!,expand=phases.find(p=>p.kind==='contact-card-expand')!;
 assert.ok(Math.abs(reel.end-reel.start-3.0)<1e-8);assert.equal(reel.end,center.start);assert.equal(center.end,expand.start);
 assert.equal(reelView({phase:reel,local:1},4).position,3);
 for(const phase of [center,expand]){const samples=Array.from({length:101},(_,n)=>reelView({phase,local:n/100},4));for(let n=100;n>=0;n--)assert.deepEqual(reelView({phase,local:n/100},4),samples[n]);}
});
