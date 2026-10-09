import assert from 'node:assert/strict';
import os from 'node:os';
const {chromium}=await import(`${os.homedir()}/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright/index.mjs`);
const browser=await chromium.launch({channel:'chrome',headless:true});
try {
 const page=await browser.newPage({viewport:{width:1440,height:960}}),errors=[];
 page.on('pageerror',error=>errors.push(String(error)));
 await page.goto('http://127.0.0.1:5173/?qa');
 await page.waitForFunction(()=>window.__roomQA?.snapshot()?.ready&&document.querySelector('.desk-loader').hidden,{},{timeout:90000});
 const settle=()=>page.waitForFunction(()=>!window.__roomQA.snapshot().transitioning);
 const open=async()=>{await page.evaluate(()=>window.__roomQA.open('hack-atlantic'));await settle();await page.waitForTimeout(350);};
 const wheel=async(delta)=>{const r=await page.locator('.fabric-hit').boundingBox();await page.mouse.move(r.x+r.width/2,r.y+r.height/2);await page.mouse.wheel(0,delta);};
 for(const reduced of [false,true]) {
  await page.emulateMedia({reducedMotion:reduced?'reduce':'no-preference'});
  await open();await wheel(600);await page.waitForFunction(()=>window.__roomQA.snapshot().fabric.value>.2);
  await page.waitForTimeout(350);await wheel(-10000);
  await page.waitForFunction(()=>window.__roomQA.snapshot().fabric.value===0);
  assert.equal(await page.evaluate(()=>window.__roomQA.snapshot().active),'hack-atlantic','Reaching the top must not exit');
  await page.waitForTimeout(350);await wheel(-100);await settle();
  assert.equal(await page.evaluate(()=>window.__roomQA.snapshot().active),'','Fresh upward gesture at top returns to desk');
  await open();await wheel(-100);await settle();assert.equal(await page.evaluate(()=>window.__roomQA.snapshot().active),'','Already at top exits');
 }
 // The accessible transcript uses its own reading position, independent of the cloth.
 await open();await page.evaluate(()=>window.__roomQA.scene().setFabric(.5));
 await page.locator('[data-fabric="read"]').click();
 await page.locator('.desk-content').evaluate(n=>{n.scrollTop=0;});await page.waitForTimeout(350);
 await page.locator('.desk-close').hover();await page.mouse.wheel(0,-100);await settle();
 assert.equal(await page.evaluate(()=>window.__roomQA.snapshot().active),'');
 assert.deepEqual(errors,[]);console.log('Hack Atlantic: content scroll, fresh top exit, initial top exit, reduced motion, and transcript exit passed.');
} finally {await browser.close();}
