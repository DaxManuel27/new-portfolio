import {chromium} from '/Users/daxmanuel/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright/index.mjs';
import assert from 'node:assert/strict';import {mkdir,writeFile} from 'node:fs/promises';
await mkdir('test-results/overview',{recursive:true});const browser=await chromium.launch({channel:'chrome',headless:true});
try{const page=await browser.newPage({viewport:{width:2048,height:1035}}),errors=[],views=[];page.on('pageerror',e=>errors.push(String(e)));
await page.goto('http://127.0.0.1:5173/?qa');await page.waitForFunction(()=>window.__roomQA?.snapshot().ready,null,{timeout:90000});await page.addStyleTag({content:'.qa-output{display:none}'});
for(const [width,height]of [[2048,1035],[1440,960],[1024,768],[390,844]]){
await page.setViewportSize({width,height});await page.waitForTimeout(300);
const before=await page.evaluate(async()=>{const T=await import('/node_modules/three/build/three.module.js'),s=window.__roomQA.scene();let desk;s.model.traverse(o=>{if(o.name.startsWith('Desk_Top'))desk=o;});const b=new T.Box3().setFromObject(desk),xs=[];for(const x of [b.min.x,b.max.x])for(const y of [b.min.y,b.max.y])for(const z of [b.min.z,b.max.z])xs.push(new T.Vector3(x,y,z).project(s.camera).x);return {position:s.camera.position.toArray(),quaternion:s.camera.quaternion.toArray(),deskWidth:(Math.max(...xs)-Math.min(...xs))/2};});
if(width>=760){const collisions=await page.locator('.callout').evaluateAll(ns=>ns.filter(n=>n.dataset.collision!=='false').map(n=>({id:n.dataset.id,rect:n.querySelector('button').getBoundingClientRect().toJSON()})));console.log(width,collisions);assert.deepEqual(collisions,[]);}
await page.screenshot({path:`test-results/overview/desk-${width}.png`});
for(const id of ['about','ultra-maritime','hack-atlantic','formula-sae','resume','contact']){
await page.evaluate(id=>window.__roomQA.open(id),id);await page.waitForFunction(()=>!window.__roomQA.snapshot().transitioning);await page.evaluate(()=>window.__roomQA.close());await page.waitForFunction(()=>!window.__roomQA.snapshot().transitioning);
const after=await page.evaluate(()=>{const s=window.__roomQA.scene();return {position:s.camera.position.toArray(),quaternion:s.camera.quaternion.toArray()};});for(const key of ['position','quaternion'])assert.ok(before[key].every((v,i)=>Math.abs(v-after[key][i])<1e-6));
}views.push({width,...before});}
assert.deepEqual(errors,[]);await writeFile('test-results/overview/report.json',JSON.stringify({errors,views},null,2));console.log(JSON.stringify(views));
}finally{await browser.close();}
