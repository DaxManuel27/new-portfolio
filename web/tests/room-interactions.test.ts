import test from 'node:test';
import assert from 'node:assert/strict';
import {FabricScroll,FRAME} from '../src/scroll-frame';
import {placeLabel,intersects} from '../src/workspace-labels';
test('fabric clamps, winds upward with content, and moves the physical cloth distance',()=>{
 const state=new FabricScroll();state.scroll(100000);state.update(.016,true);assert.equal(state.value,1);
 const traveled=FRAME.fabricHeight*(1/FRAME.viewFraction-1);assert.ok(Math.abs(state.angle*FRAME.radius+traveled)<1e-10);
 state.scroll(-100000);state.update(.016,true);assert.equal(state.value,0);assert.equal(state.distance,0);
});
test('normal fabric movement eases without overshoot; reduced motion is immediate',()=>{
 const state=new FabricScroll();state.set(1);const first=state.update(1/60,false);assert.ok(first>0&&first<1);for(let i=0;i<120;i++)state.update(1/60,false);assert.equal(state.value,1);state.set(.2);state.update(0,true);assert.equal(state.value,.2);
});
test('label fallback clears a crowded silhouette while retaining a 45 degree leader',()=>{
 const anchor={x:500,y:500},obstacles=[{left:360,top:340,width:260,height:210}];
 const p=placeLabel(anchor,{width:210,height:50},{width:1024,height:768},obstacles,-1,-1);
 assert.ok(!obstacles.some(r=>intersects(p.rect,r)));assert.ok(p.rect.left>=16&&p.rect.left+p.rect.width<=1008);assert.ok(Math.abs(Math.abs(p.x-anchor.x)-Math.abs(p.y-anchor.y))<.001);
});
