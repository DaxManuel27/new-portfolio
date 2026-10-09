import assert from 'node:assert/strict';
import {writeFile} from 'node:fs/promises';
import os from 'node:os';
const {chromium}=await import(process.env.PLAYWRIGHT_MODULE||`${os.homedir()}/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright/index.mjs`);
const browser=await chromium.launch({channel:'chrome',headless:true});const errors=[],report=[];
const page=await browser.newPage({viewport:{width:1440,height:960}});page.on('pageerror',e=>errors.push(String(e)));
await page.goto('http://127.0.0.1:5173/?qa');await page.waitForFunction(()=>window.__roomQA?.snapshot()?.ready&&document.querySelector('.desk-loader').hidden,{},{timeout:90000});await page.addStyleTag({content:'.qa-output{display:none}'});
const settled=()=>page.waitForFunction(()=>!window.__roomQA.snapshot().transitioning);
for(const [width,height]of [[1440,960],[1024,768],[390,844]]){
 await page.setViewportSize({width,height});await page.waitForTimeout(500);await settled();
 const labels=await page.locator(width<760?'.mobile-objects button':'.callout.ready button').evaluateAll(ns=>ns.map(n=>({id:n.dataset.open,rect:n.getBoundingClientRect().toJSON(),collision:n.parentElement.dataset.collision})));
 assert.equal(labels.length,6);
 for(const a of labels){assert.ok(a.rect.left>=15&&a.rect.right<=width-15,`${width}: clipped ${a.id}`);assert.ok(a.rect.top>=15&&a.rect.bottom<=height-15);assert.notEqual(a.collision,'true',`${width}: ${a.id} touches a silhouette`);for(const b of labels){if(a===b)continue;assert.ok(!(a.rect.left<b.rect.right&&a.rect.right>b.rect.left&&a.rect.top<b.rect.bottom&&a.rect.bottom>b.rect.top),`${width}: labels overlap`);}}
 const leaderAngles=await page.locator('.callout svg path').evaluateAll(ns=>ns.map(n=>n.getAttribute('d')));if(width>=760)for(const path of leaderAngles){const values=path.match(/[-\d.]+/g).map(Number);assert.ok(Math.abs(Math.abs(values[2])-Math.abs(values[3]))<.01);}
 await page.screenshot({path:`test-results/room/final-${width}.png`});
 for(const id of ['about','formula-sae','resume','ultra-maritime','contact','hack-atlantic']){
  const trigger=page.locator(`${width<760?'.mobile-objects':'.desk-callouts'} [data-open="${id}"]`);await trigger.click();await settled();assert.equal(await page.evaluate(()=>window.__roomQA.snapshot().active),id);
  if(id==='about'){assert.equal(await page.locator('.desk-content nav a').count(),0);assert.equal(await page.locator('.desk-content').isVisible(),false);await page.screenshot({path:`test-results/room/laptop-${width}.png`});}
  if(id==='resume'){await page.locator('.printer-key-hit').waitFor({state:'visible'});assert.equal((await page.request.get(new URL(await page.locator('.printer-key-hit').getAttribute('href'),page.url()).href)).status(),200);}
  if(id==='contact')assert.ok(await page.locator('.phonebook-links a:visible').count()>=3);
  if(id==='ultra-maritime')assert.ok(Math.abs(await page.evaluate(()=>window.__roomQA.snapshot().notebookAngle))>1);
  if(id==='hack-atlantic'){
   await page.locator('.fabric-hit').focus();await page.keyboard.press('Home');await page.waitForFunction(()=>window.__roomQA.snapshot().fabric.value===0);
   await page.keyboard.press('ArrowDown');await page.waitForFunction(()=>window.__roomQA.snapshot().fabric.value>.02);
   await page.keyboard.press('End');await page.waitForFunction(()=>window.__roomQA.snapshot().fabric.value===1);assert.ok(await page.evaluate(()=>window.__roomQA.snapshot().fabric.angle<0));
   await page.keyboard.press('Home');await page.waitForFunction(()=>window.__roomQA.snapshot().fabric.value===0);
   const rect=await page.locator('.fabric-hit').boundingBox();await page.mouse.move(rect.x+rect.width/2,rect.y+rect.height/2);await page.mouse.wheel(0,400);await page.waitForFunction(()=>window.__roomQA.snapshot().fabric.value>.1);
   await page.mouse.down();await page.mouse.move(rect.x+rect.width/2,rect.y+rect.height/2-70,{steps:8});await page.mouse.up();assert.ok(await page.evaluate(()=>window.__roomQA.snapshot().fabric.target>.25));
   await page.locator('[data-fabric="read"]').click();await page.locator('.reading-fabric .desk-content').waitFor({state:'visible'});assert.match(await page.locator('.desk-content').innerText(),/23,000\+/);await page.screenshot({path:`test-results/room/transcript-${width}.png`});
  }
  await page.keyboard.press('Escape');await settled();assert.equal(await page.evaluate(()=>window.__roomQA.snapshot().active),'');
 }
 report.push({width,labels,diagnostics:await page.evaluate(()=>window.__roomQA.snapshot())});console.log(`Verified ${width}px: six destinations, label bounds, contact, PDF, notebook, fabric input and text view.`);
}
// Wheel away from fabric stays unclaimed by the fabric controller.
await page.setViewportSize({width:1440,height:960});await page.waitForTimeout(400);
await page.evaluate(()=>{window.addEventListener('wheel',e=>window.__lastWheelPrevented=e.defaultPrevented);});await page.mouse.move(20,200);await page.mouse.wheel(0,200);await page.waitForTimeout(50);assert.equal(await page.evaluate(()=>window.__lastWheelPrevented),false);
await page.locator('.callout[data-id="about"] button').hover();await page.waitForFunction(()=>window.__roomQA.snapshot().hovered==='about');
await page.evaluate(()=>window.__roomQA.open('hack-atlantic'));await settled();await page.mouse.click(1300,500);await settled();assert.equal(await page.evaluate(()=>window.__roomQA.snapshot().active),'');
await page.emulateMedia({reducedMotion:'reduce'});await page.reload();await page.waitForFunction(()=>window.__roomQA?.snapshot()?.ready&&document.querySelector('.desk-loader').hidden,{},{timeout:90000});await page.evaluate(()=>window.__roomQA.open('hack-atlantic'));assert.equal(await page.evaluate(()=>window.__roomQA.snapshot().transitioning),false);await page.locator('.fabric-hit').focus();await page.keyboard.press('End');await page.waitForFunction(()=>window.__roomQA.snapshot().fabric.value===1);assert.equal(await page.evaluate(()=>window.__roomQA.snapshot().shadowLights),1);
assert.deepEqual(errors,[]);await writeFile('test-results/room/verification.json',JSON.stringify({errors,report,reducedMotion:true,outsideWheelUnclaimed:true,outsideClickReturns:true},null,2));await browser.close();console.log('Reduced motion, one shadow light, hover sync, and outside input verified.');
