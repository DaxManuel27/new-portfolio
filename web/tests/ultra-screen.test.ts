import test from 'node:test';
import assert from 'node:assert/strict';
import {ultraTextureSize,ultraScroll} from '../src/ultra-screen';
test('monitor textures preserve physical proportions across resolutions and GPU limits',()=>{
 const aspect=.598/.336;
 for(const [width,dpr,max] of [[900,1,4096],[1800,2,4096],[3000,2,2048],[600,3,4096]]){
  const size=ultraTextureSize(width,dpr,aspect,max);
  assert.ok(size.width<=max);assert.ok(Math.abs(size.width/size.height-aspect)<.002);
 }
 assert.equal(ultraTextureSize(1800,2,aspect).width,4096);
 assert.equal(ultraTextureSize(900,1,aspect).width,2048);
});

test('Ultra scroll holds the title, reveals bullets, and preserves their position into the pan',()=>{
 const phase={kind:'ultra-story' as const,station:2,start:0,end:2};
 assert.equal(ultraScroll({phase,local:0}),0);assert.equal(ultraScroll({phase,local:1}),1);
 assert.equal(ultraScroll({phase:{...phase,kind:'pan'},local:0}),1);
 assert.equal(ultraScroll({phase:{...phase,kind:'hold'},local:1}),0);
 assert.ok(ultraScroll({phase,local:.2})<ultraScroll({phase,local:.5}));
 assert.equal(ultraScroll({phase,local:.8}),1);
});
