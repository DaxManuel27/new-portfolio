import test from 'node:test';
import assert from 'node:assert/strict';
import { evaluate, heroVisible, phases, stationProgress, totalUnits, IDS, REEL_UNITS } from '../src/journey';
const at=(units:number)=>evaluate(units/totalUnits);
test('station order and historic hashes reach UM monitor, live car and first reel card',()=>{
 assert.deepEqual(IDS,['intro','hack-atlantic','ultra-maritime','formula-sae','projects','resume','contact']);
 for(let i=0;i<7;i++)assert.equal(evaluate(stationProgress(i)).phase.station,i);
 assert.equal(evaluate(stationProgress(2)).phase.kind,'hold');assert.equal(evaluate(stationProgress(3)).phase.kind,'hold');assert.equal(evaluate(stationProgress(4)).phase.kind,'reel');
 assert.equal(evaluate(1).phase.station,6);
});
test('the car return and desk approach precede the three-project reel',()=>{
 assert.ok(Math.abs(totalUnits-31.8)<1e-10);
 assert.deepEqual(phases.filter(p=>p.kind==='screen-zoom').map(p=>p.station),[3]);
 assert.equal(REEL_UNITS,3.0);
 const reel=phases.find(p=>p.kind==='reel')!,handoff=phases.find(p=>p.kind==='contact-card-center')!;
 assert.ok(Math.abs(reel.end-reel.start-3.0)<1e-10);assert.ok(Math.abs(handoff.end-handoff.start-.4)<1e-10);assert.equal(reel.end,handoff.start);
 assert.equal(phases.find(p=>p.station===4&&p.kind==='projects-monitor-entry')!.end,reel.start);
});
test('MacBook disappears exactly when the FSAE zoom begins and returns on reverse',()=>{
 const boundary=phases.find(p=>p.station===3)!.start;
 assert.equal(heroVisible(at(boundary-1e-8)),true);assert.equal(heroVisible(at(boundary)),false);
 for(let i=0;i<=500;i++)assert.equal(heroVisible(at(boundary+(totalUnits-boundary)*i/500)),false);
 const hold=phases.find(p=>p.kind==='monitor-hold')!;
 for(const t of [.9,.1,.7,.1]){const s=at(hold.start+t*(hold.end-hold.start));assert.equal(heroVisible(s),true);assert.equal(s.dock,1);assert.equal(s.heroTime,8);}
});
test('visible hero clock and dock join continuously through Intro, Hack Atlantic and Workstation',()=>{
 for(const p of phases.slice(1).filter(p=>p.station<=2)){
  const a=at(p.start-1e-9),b=at(p.start+1e-9);
  for(const key of ['heroTime','dock'] as const)assert.ok(Math.abs(a[key]-b[key])<1e-6,`${p.kind} ${p.station} ${key}`);
 }
});
test('print progress stays independent of scrolling and all seeks are deterministic',()=>{
 const points=Array.from({length:1001},(_,i)=>i/1000),forward=points.map(p=>evaluate(p));
 for(let i=1000;i>=0;i--){assert.deepEqual(evaluate(points[i]),forward[i]);assert.equal(forward[i].paper,0);assert.equal(evaluate(points[i],.4).paper,.4);}
 for(const i of [997,1,704,52,488])assert.deepEqual(evaluate(points[i]),forward[i]);
 assert.deepEqual(evaluate(NaN),evaluate(0));assert.deepEqual(evaluate(-1),evaluate(0));assert.deepEqual(evaluate(2),evaluate(1));
});
