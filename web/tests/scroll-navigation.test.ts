import test from 'node:test';
import assert from 'node:assert/strict';
import {ScrollNavigationGesture} from '../src/scroll-back';
test('deliberate hover scroll opens once and continuous momentum cannot close or reopen',()=>{
 const g=new ScrollNavigationGesture();assert.equal(g.update(-35,0,'contact',false),false);assert.equal(g.update(-35,30,'contact',false),true);
 g.reset(30);for(let t=60;t<1800;t+=30)assert.equal(g.update(-100,t,'back',t<1380),false);
 assert.equal(g.update(-100,2200,'back',false),true);g.reset(2200);
 for(let t=2230;t<3500;t+=30)assert.equal(g.update(-100,t,'contact',t<3200),false);
 assert.equal(g.update(-100,3900,'contact',false),true);
});
test('changing targets and leaving an object discard partial movement',()=>{
 const g=new ScrollNavigationGesture();assert.equal(g.update(-40,0,'contact',false),false);
 g.setTarget('');g.setTarget('contact');assert.equal(g.update(-40,40,'contact',false),false);
 assert.equal(g.update(-40,60,'resume',false),false);assert.equal(g.update(-40,90,'resume',false),true);
});
test('empty space, downward scroll, and separated jitter do not navigate',()=>{
 const g=new ScrollNavigationGesture();assert.equal(g.update(-200,0,'',false),false);
 assert.equal(g.update(-40,10,'resume',false),false);assert.equal(g.update(20,20,'resume',false),false);
 assert.equal(g.update(-40,30,'resume',false),false);assert.equal(g.update(-40,400,'resume',false),false);
});
test('scroll-to-top momentum remains blocked until a fresh reading gesture',()=>{
 const g=new ScrollNavigationGesture();assert.equal(g.update(-100,0,'back',false,false),false);
 assert.equal(g.update(-100,40,'back',false,true),false);assert.equal(g.update(-100,400,'back',false,true),true);
});
test('instant reduced-motion navigation still requires a fresh gesture',()=>{
 const g=new ScrollNavigationGesture();assert.equal(g.update(-100,0,'resume',false),true);g.reset(0);
 assert.equal(g.update(-100,20,'back',false),false);assert.equal(g.update(-100,400,'back',false),true);
});
test('interrupted transitions and explicit navigation reset the gesture',()=>{
 const g=new ScrollNavigationGesture();g.reset(0);assert.equal(g.update(-100,500,'contact',true),false);
 g.reset(550);assert.equal(g.update(-100,700,'resume',false),false);assert.equal(g.update(-100,1100,'resume',false),true);
});
