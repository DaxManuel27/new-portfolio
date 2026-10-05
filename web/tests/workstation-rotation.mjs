import assert from 'node:assert/strict';import fs from 'node:fs/promises';import os from 'node:os';
const {chromium}=await import(`${os.homedir()}/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright/index.mjs`);
const browser=await chromium.launch({channel:'chrome',headless:true}),dir='test-results/workstation-rotation';await fs.mkdir(dir,{recursive:true});const report=[];
try{
 for(const [layout,width,height] of [['desktop',1440,960],['phone',390,844]]){
  const context=await browser.newContext({viewport:{width,height}});const page=await context.newPage();const errors=[];page.on('pageerror',e=>errors.push(String(e)));
  await page.goto('http://127.0.0.1:5173/');await page.waitForFunction(()=>window.__portfolio?.snapshot().ready&&window.__portfolio.settled(),{},{timeout:60000});await page.waitForFunction(()=>getComputedStyle(document.querySelector('#boot')).opacity==='0');
  const {flight,exit,total}=await page.evaluate(()=>({flight:window.__portfolio.phases.find(p=>p.kind==='travel'&&p.station===2),exit:window.__portfolio.phases.find(p=>p.kind==='exit'&&p.station===1),total:window.__portfolio.totalUnits}));
  async function seek(p){await page.evaluate(p=>window.__portfolio.seek(p),p);await page.waitForFunction(()=>window.__portfolio.settled());await page.evaluate(()=>new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r))));return page.evaluate(()=>window.__portfolio.snapshot());}
  for(const t of [.1,.3,.5,.7,.9]){const state=await seek((flight.start+(flight.end-flight.start)*t)/total);await page.screenshot({path:`${dir}/${layout}-${Math.round(t*100)}.png`});report.push({layout,percent:t*100,...state});}
  const forward=[];
  for(let n=0;n<=80;n++){const s=await seek((exit.start+(flight.end-exit.start)*n/80)/total);forward.push(s);await page.waitForTimeout(45);}
  for(const saved of forward.toReversed()){
   const s=await seek(saved.progress);for(const key of ['feet','spin','lid','camera','cameraQuaternion'])s[key].forEach((x,i)=>assert.ok(Math.abs(x-saved[key][i])<2e-7));await page.waitForTimeout(45);
  }
  assert.deepEqual(errors,[]);await context.close();
 }
 await fs.writeFile(dir+'/report.json',JSON.stringify({status:'PASS',samples:report,checks:['5 captures per viewport','81 forward/reverse samples from close through landing','matching feet, spin, lid and camera poses','no page errors']},null,2));console.log('Rotation browser captures and forward/reverse checks passed.');
}finally{await browser.close();}
