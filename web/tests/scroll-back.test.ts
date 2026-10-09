import test from 'node:test';
import assert from 'node:assert/strict';
import {ScrollBackGesture} from '../src/scroll-back';
test('a wheel notch or accumulated trackpad gesture returns to the desk',()=>{
 const g=new ScrollBackGesture();assert.equal(g.update(-100,0,true),true);
 assert.equal(g.update(-25,20,true),false);assert.equal(g.update(-25,40,true),false);assert.equal(g.update(-25,60,true),true);
});
test('scrolling to the top needs a fresh gesture, not remaining momentum',()=>{
 const g=new ScrollBackGesture();assert.equal(g.update(-100,0,false),false);
 assert.equal(g.update(-100,30,true),false);assert.equal(g.update(-100,60,true),false);
 assert.equal(g.update(-100,300,true),true);
});
test('downward scrolling, separated jitter and resets do not trigger an exit',()=>{
 const g=new ScrollBackGesture();assert.equal(g.update(150,0,true),false);
 assert.equal(g.update(-40,20,true),false);assert.equal(g.update(-40,250,true),false);
 g.reset();assert.equal(g.update(-40,270,true),false);assert.equal(g.update(15,280,true),false);assert.equal(g.update(-40,290,true),false);
});
