import assert from 'node:assert/strict';
import os from 'node:os';
import { mkdir,writeFile } from 'node:fs/promises';
import sharp from 'sharp';
const {chromium}=await import(`${os.homedir()}/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright/index.mjs`);
const root=new URL('../../',import.meta.url),out=new URL('exports/clean-copy/',root);await mkdir(out,{recursive:true});
const browser=await chromium.launch({channel:'chrome',headless:true});
try{
 const page=await browser.newPage({viewport:{width:1440,height:960}});const errors=[];page.on('pageerror',e=>errors.push(String(e)));
 await page.goto('http://127.0.0.1:5173/');
 const ready=()=>page.waitForFunction(()=>window.__portfolio?.snapshot().ready&&window.__portfolio.settled());await ready();await page.waitForFunction(()=>document.getElementById('boot').hidden);
 async function phase(kind,local=.5){await page.evaluate(({kind,local})=>{const api=window.__portfolio,p=api.phases.find(p=>p.kind===kind);api.seek((p.start+(p.end-p.start)*local)/api.totalUnits);},{kind,local});await page.waitForTimeout(150);await ready();}
 async function capture(name){await page.screenshot({path:new URL(name+'.png',out).pathname});}
 async function poster(name,source){const style=await page.addStyleTag({content:'#loading,#boot,#hint,#motion-toggle,#skip,#review,#model-credits {visibility:hidden!important}'});const png=await page.locator('#stage').screenshot();await writeFile(new URL(source,root),png);await sharp(png).webp({quality:95}).toFile(new URL('web/public/assets/'+name+'.webp',root).pathname);await style.evaluate(n=>n.remove());}
 await page.evaluate(()=>window.__portfolio.station(2));await page.waitForTimeout(150);await ready();await capture('ultra-maritime');await poster('ultra-maritime','exports/station-reorder/ultra-maritime.png');
 await phase('projects-reveal',.99999);await poster('ultrawide','exports/station-reorder/ultrawide.png');
 await phase('reel',.02);assert.equal(await page.locator('#reel-label,#reel-count,.reel-tag,.fsae-kicker,.fsae-note,.fsae-intro,#print-key-hint').count(),0);
 assert.equal(await page.locator('#reel-announcement').textContent(),'Project placeholder, 1 of 3');assert.equal(await page.locator('#reel-hint').evaluate(e=>e.style.opacity),'1');await capture('reel-first');
 // Save the live first frame used by the curved monitor as its authored fallback too.
 const url=await page.evaluate(()=>window.__portfolio.reelPreviewImage());await writeFile(new URL('assets/textures/station-reorder/projects-monitor.png',root),Buffer.from(url.split(',')[1],'base64'));
 await phase('reel',.3);assert.match(await page.locator('#reel-announcement').textContent(),/2 of 4/);assert.equal(await page.locator('#reel-hint').evaluate(e=>e.style.opacity),'0');
 await phase('reel',.02);assert.equal(await page.locator('#reel-hint').evaluate(e=>e.style.opacity),'1');
 await phase('data-hold');await capture('data-desktop');assert.equal(await page.locator('#fsae-detail article > *').count(),3);
 await page.setViewportSize({width:390,height:844});await page.waitForTimeout(400);await phase('data-hold');await capture('data-mobile');await phase('reel',.02);await capture('reel-mobile');
 await page.setViewportSize({width:1440,height:960});await page.waitForTimeout(400);await page.evaluate(()=>window.__portfolio.station(6));await page.waitForTimeout(150);await ready();assert.equal(await page.locator('#model-credits').isVisible(),true);await capture('contact');
 await page.goto('http://127.0.0.1:5173/?still');await page.waitForFunction(()=>window.__portfolio?.snapshot().staticMode);assert.equal(await page.locator('#accessible-contact .model-credits').count(),1);assert.doesNotMatch(await page.locator('#fallback').innerText(),/will be added|FORMULA SAE \/ 01|closer look/);await page.locator('#static-fsae-data-logging').scrollIntoViewIfNeeded();await capture('static-data');
 assert.deepEqual(errors,[]);console.log('Desktop, mobile, reverse hint, live announcements, credits and fallback checks passed.');
}finally{await browser.close();}
