import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import os from 'node:os';
const {chromium}=await import(process.env.PLAYWRIGHT_MODULE||`${os.homedir()}/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright/index.mjs`);
const browser=await chromium.launch({channel:'chrome',headless:true});
try {
const page=await browser.newPage({viewport:{width:1440,height:960}}),errors=[];
page.on('pageerror',e=>errors.push(String(e)));
await fs.mkdir('test-results/shared-desk',{recursive:true});
await page.goto((process.env.PREVIEW_URL||'http://127.0.0.1:5173')+'/?review=1');
await page.waitForFunction(()=>window.__portfolio?.snapshot().ready&&window.__portfolio.settled(),{},{timeout:60000});
const {phases,totalUnits}=await page.evaluate(()=>window.__portfolio);
const exit=phases.find(p=>p.station===5&&p.kind==='exit'),hold=phases.find(p=>p.station===6&&p.kind==='hold');
async function seek(units){await page.evaluate(p=>window.__portfolio.seek(p),units/totalUnits);await page.waitForTimeout(90);await page.waitForFunction(()=>window.__portfolio.settled(),{},{timeout:60000});await page.evaluate(()=>new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve))));return page.evaluate(()=>window.__portfolio.snapshot());}
const results=[];
for(const size of [{width:1440,height:960},{width:390,height:844}]){
 await page.setViewportSize(size);await page.waitForTimeout(500);
 const forward=[];
 for(let i=0;i<=30;i++){
  const units=exit.start+(hold.start-exit.start)*i/30,s=await seek(units);forward.push(s);
  assert.equal(s.dock,1);assert.equal(s.time,20);assert.equal(s.paper,0);assert.equal(s.paperVisible,false);assert.equal(s.printStatus,'idle');
  assert.deepEqual(s.visibleStations,[5]);assert.deepEqual(s.errors,[]);
  assert.ok(Math.abs(s.cameraQuaternion[0]+Math.SQRT1_2)<1e-8);
  assert.ok(Math.abs(s.cameraQuaternion[3]-Math.SQRT1_2)<1e-8);
  if([0,15,30].includes(i)){await page.waitForTimeout(250);await page.screenshot({path:`test-results/shared-desk/${size.width}-${i}.png`});if(process.env.CAPTURE_POSTERS==='1'&&size.width===1440&&i!==15)await page.locator('canvas').screenshot({path:`../exports/shared-desk/${i===0?'resume':'contact'}-poster.png`});}
 }
 for(let i=30;i>=0;i--){const s=await seek(exit.start+(hold.start-exit.start)*i/30);for(const key of ['feet','spin','lid','camera','cameraQuaternion'])s[key].forEach((x,k)=>assert.ok(Math.abs(x-forward[i][key][k])<1e-6,`${size.width} sample ${i} ${key} ${k}: ${x} vs ${forward[i][key][k]} at ${s.progress} vs ${forward[i].progress}`));assert.ok(Math.abs(s.cameraWidth-forward[i].cameraWidth)<1e-6);assert.equal(s.paper,0);assert.equal(s.paperVisible,false);}
 results.push({width:size.width,samples:forward.length,visibleStations:[5],paperBeforePrint:0,switchUnits:hold.start-exit.start});
}
assert.deepEqual(errors,[]);
await fs.writeFile('test-results/shared-desk/report.json',JSON.stringify(results,null,2));
console.log(JSON.stringify(results));
} finally { await browser.close(); }
