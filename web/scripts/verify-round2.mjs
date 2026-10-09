import assert from 'node:assert/strict';
import {writeFile} from 'node:fs/promises';
import os from 'node:os';
const {chromium}=await import(process.env.PLAYWRIGHT_MODULE||`${os.homedir()}/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright/index.mjs`);
const browser=await chromium.launch({channel:'chrome',headless:true});const page=await browser.newPage({viewport:{width:1440,height:960}});
await page.goto('http://127.0.0.1:5173/?qa');await page.waitForFunction(()=>window.__roomQA?.snapshot()?.ready&&document.querySelector('.desk-loader').hidden,{},{timeout:90000});
const audit=await page.evaluate(()=>{
 const s=window.__roomQA.scene(),wall=s.scene.getObjectByName('Room_green_wall'),trim=s.scene.getObjectByName('Room_baseboard'),floor=s.scene.getObjectByName('Room_walnut_planks'),fabric=s.scene.getObjectByName('HackAtlantic_Linen');
 const matrix=wall.matrixWorld.clone();floor.getMatrixAt(0,matrix);const center=wall.position.clone().setFromMatrixPosition(matrix);
 const image=s.scene.getObjectByName('Wall_painted_name').material.map.image;
 return {plantRemoved:!s.scene.getObjectByName('Root_background_plant'),desktopPlantPresent:!!s.scene.getObjectByName('Root_plant'),wallBottom:wall.position.y-wall.geometry.parameters.height/2,floorTop:center.y+floor.geometry.parameters.height/2,floorBack:center.z-floor.geometry.parameters.depth/2,wallZ:wall.position.z,trimHeight:trim.geometry.parameters.height,trimMatchesWall:trim.material===wall.material,shadowLights:s.diagnostics().shadowLights,fabric:{width:fabric.material.map.image.width,height:fabric.material.map.image.height,anisotropy:fabric.material.map.anisotropy,maxAnisotropy:s.renderer.capabilities.getMaxAnisotropy(),mipmaps:fabric.material.map.generateMipmaps,colorSpace:fabric.material.map.colorSpace},name:{width:image.width,height:image.height},labels:[...document.querySelectorAll('.callout')].map(n=>({background:getComputedStyle(n.querySelector('button')).backgroundColor,border:getComputedStyle(n.querySelector('button')).borderWidth,padding:getComputedStyle(n.querySelector('button')).padding,leader:n.querySelector('path').getAttribute('d')})),tagline:!!document.querySelector('.mobile-tagline')};
});
assert.ok(audit.plantRemoved&&audit.desktopPlantPresent);assert.ok(audit.wallBottom<audit.floorTop&&Math.abs(audit.floorTop)<1e-6);assert.ok(audit.floorBack<audit.wallZ);assert.ok(audit.trimMatchesWall&&audit.trimHeight<=.025);assert.equal(audit.shadowLights,1);assert.equal(audit.fabric.width,2048);assert.equal(audit.fabric.height,4096);assert.equal(audit.fabric.anisotropy,audit.fabric.maxAnisotropy);assert.equal(audit.fabric.mipmaps,true);assert.equal(audit.fabric.colorSpace,'srgb');assert.equal(audit.tagline,false);
for(const l of audit.labels){assert.equal(l.background,'rgba(0, 0, 0, 0)');assert.equal(l.border,'0px');assert.equal(l.padding,'0px');const p=l.leader.match(/[-\d.]+/g).map(Number);assert.ok(Math.hypot(p[2],p[3])<=98.01);}
const settled=()=>page.waitForFunction(()=>!window.__roomQA.snapshot().transitioning);
for(const method of ['label','object']){
 if(method==='label')await page.locator('.callout [data-open="about"]').click();else{const r=await page.evaluate(()=>window.__roomQA.scene().surfaceRect('about'));await page.mouse.click(r.left+r.width/2,r.top+r.height/2);}
 await settled();assert.equal(await page.evaluate(()=>window.__roomQA.snapshot().active),'about');assert.equal(await page.locator('.desk-content').isVisible(),false);assert.equal(await page.locator('.desk-callouts').isVisible(),false);
 await page.mouse.click(1400,450);await settled();assert.equal(await page.evaluate(()=>window.__roomQA.snapshot().active),'');
}
await page.emulateMedia({reducedMotion:'reduce'});await page.locator('.callout [data-open="about"]').click();assert.equal(await page.evaluate(()=>window.__roomQA.snapshot().transitioning),false);await page.locator('.desk-close').click();assert.equal(await page.evaluate(()=>window.__roomQA.snapshot().active),'');
await writeFile('test-results/room/round2-audit.json',JSON.stringify(audit,null,2));await browser.close();console.log('Round 2: continuous floor–wall join, plant removal, text-only short leaders, sharp print, direct laptop/label zoom, outside return and reduced motion verified.');
