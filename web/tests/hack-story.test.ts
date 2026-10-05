import test from 'node:test';import assert from 'node:assert/strict';
import {HACK_ATLANTIC,hackStoryView} from '../src/hack-atlantic';import {phases} from '../src/journey';
test('Hack founder story follows the laptop hold and rejoins its departure',()=>{
 const i=phases.findIndex(p=>p.kind==='hack-story');assert.equal(phases[i-1].station,1);assert.equal(phases[i-1].kind,'hold');assert.equal(phases[i+1].kind,'exit');
 const phase=phases[i];for(const height of [1800,3000]){assert.equal(hackStoryView({phase,local:0},height,844).opacity,0);assert.equal(hackStoryView({phase,local:1},height,844).opacity,0);assert.equal(hackStoryView({phase,local:.91},height,844).y,-(height-844));const forward=Array.from({length:101},(_,i)=>hackStoryView({phase,local:i/100},height,844));for(let i=100;i>=0;i--)assert.deepEqual(hackStoryView({phase,local:i/100},height,844),forward[i]);}
});
test('recap contains the requested stats and only confirmed contribution bullets',()=>{
 assert.equal(HACK_ATLANTIC.contributions.length,4);assert.equal(HACK_ATLANTIC.stats.length,6);assert.ok(HACK_ATLANTIC.contributions[0].includes('8 person team'));assert.ok(!HACK_ATLANTIC.contributions.join().includes('judges'));
 const luminance=(hex:string)=>{const c=hex.match(/../g)!.map(v=>parseInt(v,16)/255).map(v=>v<=.04045?v/12.92:((v+.055)/1.055)**2.4);return .2126*c[0]+.7152*c[1]+.0722*c[2];};assert.ok((luminance('C3E8DC')+.05)/(luminance('1F3A44')+.05)>4.5);
});
