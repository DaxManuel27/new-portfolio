import assert from 'node:assert/strict';import os from 'node:os';
const {chromium}=await import(`${os.homedir()}/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright/index.mjs`);
const browser=await chromium.launch({channel:'chrome',headless:true});
try{
 const page=await browser.newPage({viewport:{width:1200,height:900}});const requests=[];page.on('request',r=>requests.push(r.url()));const errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto('http://127.0.0.1:5173/#fsae-data-logging');await page.waitForFunction(()=>window.__portfolio?.snapshot().detailReady);await page.waitForTimeout(1000);
 assert.equal(await page.locator('#fsae-detail article:visible h1').textContent(),'Data logging');
 assert.equal(await page.locator('#fsae-nav, .fsae-next').count(),0);
 for(const kind of ['data-hold']){
  const copies=[];
  for(const local of [.2,.7]){
   await page.evaluate(({kind,local})=>{const a=window.__portfolio,p=a.phases.find(p=>p.kind===kind);a.seek((p.start+(p.end-p.start)*local)/a.totalUnits)},{kind,local});
   await page.waitForTimeout(60);
   assert.equal(await page.locator('#fsae-detail article:visible .fsae-description').count(),1);
   copies.push(await page.locator('#fsae-detail article:visible').textContent());
  }
  assert.equal(copies[0],copies[1]);
 }
 const poses=await page.evaluate(()=>{const api=window.__portfolio,phases=api.phases.filter(p=>p.station===3),points=phases.flatMap(p=>[.05,.35,.5,.75,.95].map(t=>(p.start+(p.end-p.start)*t)/api.totalUnits));return points;});
 for(const p of poses)await page.evaluate(p=>window.__portfolio.seek(p),p);
 for(const p of [...poses].reverse())await page.evaluate(p=>window.__portfolio.seek(p),p);
 await page.evaluate(()=>{const a=window.__portfolio,p=a.phases.find(p=>p.kind==='monitor-hold');a.seek((p.start+.1)/a.totalUnits)});await page.waitForTimeout(500);
 assert.equal(await page.locator('#fsae-detail').evaluate(e=>Number(getComputedStyle(e).opacity)),0);assert.deepEqual(errors,[]);
 await page.evaluate(()=>{const a=window.__portfolio,p=a.phases.find(p=>p.kind==='reel');a.seek((p.start+.1)/a.totalUnits)});await page.waitForTimeout(200);
 assert.equal(await page.locator('#fsae-detail').evaluate(e=>Number(getComputedStyle(e).opacity)),0);
 await page.evaluate(()=>{const a=window.__portfolio,p=a.phases.find(p=>p.kind==='data-hold');a.seek((p.start+.1)/a.totalUnits)});await page.waitForTimeout(200);
 assert.equal(await page.locator('#fsae-detail article:visible h1').textContent(),'Data logging');
 await page.evaluate(()=>{location.hash='fsae-pedal-sensor'});await page.waitForFunction(()=>location.hash==='#formula-sae');
 assert.equal(await page.locator('#fsae-detail article').count(),1);
 assert.equal(requests.some(url=>url.includes('pedal-sensor')),false);
 await page.close();
 const reduced=await browser.newPage({reducedMotion:'reduce',viewport:{width:390,height:844}});await reduced.goto('http://127.0.0.1:5173/#fsae-data-logging');await reduced.waitForSelector('#fallback:visible');
 assert.equal(await reduced.locator('#static-fsae-data-logging').isVisible(),true);
 assert.equal(await reduced.locator('#static-fsae-pedal-sensor').count(),0);
 assert.equal(await reduced.locator('body').evaluate(e=>e.classList.contains('reduced-crossfade')),false);
 assert.ok(await reduced.locator('#static-fsae-data-logging .pi-still-to').evaluate(e=>e.complete&&e.naturalWidth>0));await reduced.screenshot({path:'test-results/fsae-details/reduced.png'});await reduced.close();
 const failed=await browser.newPage();await failed.route('**/raspberry-pi-5.glb',r=>r.abort());await failed.goto('http://127.0.0.1:5173/#fsae-data-logging');await failed.waitForFunction(()=>window.__portfolio?.snapshot().detailFailed);await failed.waitForTimeout(300);
 assert.equal(await failed.locator('#fsae-poster').isVisible(),true);assert.equal(await failed.locator('#fsae-detail').isVisible(),true);assert.ok(await failed.locator('#fsae-poster').evaluate(e=>e.complete&&e.naturalWidth>0));await failed.close();
 console.log('PASS: deep links, project navigation, forward/reverse seeks, portal isolation, reduced motion and failed-asset fallback.');
}finally{await browser.close()}
