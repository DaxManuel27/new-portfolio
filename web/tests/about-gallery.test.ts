import test from 'node:test';
import assert from 'node:assert/strict';
import {galleryOffset} from '../src/laptop-screen';
test('gallery wraps seamlessly in both directions over repeated cycles',()=>{
 const cycle=8*(286+24);
 for(const x of [0,.25,309.9,1055,cycle-.01])for(const n of [-10,-1,0,1,100])assert.ok(Math.abs(galleryOffset(x+n*cycle)-x)<1e-9);
 assert.equal(galleryOffset(cycle),0);assert.equal(galleryOffset(-310),cycle-310);
});
