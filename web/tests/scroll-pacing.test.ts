import test from 'node:test';
import assert from 'node:assert/strict';
import {smoothScrollProgress} from '../src/scroll-pacing';
const distance=30000;
test('scroll response is consistent across frame rates and settles exactly',()=>{
 const samples=[30,60,120].map(hz=>{let p=0;for(let i=0;i<hz/2;i++)p=smoothScrollProgress(p,.6,1/hz,distance);return p;});
 for(const p of samples)assert.ok(Math.abs(p-samples[0])<1e-10);
 let p=0;for(let i=0;i<180;i++)p=smoothScrollProgress(p,.6,1/60,distance);assert.equal(p,.6);
});
test('a burst advances gradually and reversing input never overshoots',()=>{
 let p=smoothScrollProgress(.2,.8,1/60,distance);assert.ok(p>.2&&p<.3);
 const before=p;p=smoothScrollProgress(p,.1,1/60,distance);assert.ok(p<before&&p>.1);
 for(let i=0;i<180;i++){const next=smoothScrollProgress(p,.1,1/60,distance);assert.ok(next<=p&&next>=.1);p=next;}
 assert.equal(p,.1);
});
test('long frame gaps are capped and exact seeks remain stationary',()=>{
 assert.equal(smoothScrollProgress(.4,.4,1/60,distance),.4);
 assert.equal(smoothScrollProgress(0,1,5,distance),smoothScrollProgress(0,1,.064,distance));
});
