import assert from 'node:assert/strict';import os from 'node:os';import {mkdir,writeFile} from 'node:fs/promises';import sharp from 'sharp';
const {chromium}=await import(`${os.homedir()}/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright/index.mjs`);
const out='test-results/desk-return';await mkdir(out,{recursive:true});const browser=await chromium.launch({channel:'chrome',headless:true});const report=[];
async function seek(page,kind,local){await page.evaluate(({kind,local})=>{const a=window.__portfolio,p=a.phases.find(p=>p.kind===kind);a.seek((p.start+(p.end-p.start)*local)/a.totalUnits)},{kind,local});await page.waitForTimeout(120);}
async function diff(a,b){const x=await sharp(a).removeAlpha().raw().toBuffer(),y=await sharp(b).removeAlpha().raw().toBuffer();return x.reduce((v,n,i)=>v+Math.abs(n-y[i]),0)/x.length;}
try{
 for(const [width,height] of [[1200,900],[390,844],[2040,1134]]){
  const page=await browser.newPage({viewport:{width,height}}),errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.goto('http://127.0.0.1:5173/#fsae-data-logging');await page.waitForFunction(()=>window.__portfolio?.snapshot().detailReady);await page.waitForTimeout(1000);
  for(const kind of ['data-return','car-monitor-return','projects-desk-travel','projects-monitor-entry'])for(const p of [.01,.3,.6,.99]){
   await seek(page,kind,p);const s=await page.evaluate(()=>window.__portfolio.snapshot());assert.equal(s.staticMode,false);assert.equal(s.waiting,false,kind);
   if(kind!=='data-return')assert.equal(await page.locator('#fsae-detail').isVisible(),false);
  }
  await seek(page,'car-monitor-return',.08);assert.ok((await page.evaluate(()=>window.__portfolio.snapshot())).visibleStations.includes(3));const a=await page.screenshot({path:`${out}/${width}-swap-before.png`});await seek(page,'car-monitor-return',.12);assert.ok((await page.evaluate(()=>window.__portfolio.snapshot())).visibleStations.includes(2));const b=await page.screenshot({path:`${out}/${width}-swap-after.png`});const swapDiff=await diff(a,b);assert.ok(swapDiff<3,`car handoff ${swapDiff}`);
  await seek(page,'projects-desk-travel',.9999);const c=await page.screenshot();await seek(page,'projects-monitor-entry',.0001);const deskDiff=await diff(c,await page.screenshot());assert.ok(deskDiff<1,`desk join ${deskDiff}`);
  await seek(page,'projects-monitor-entry',.94);const d=await page.screenshot();await seek(page,'reel',.0001);const reelDiff=await diff(d,await page.screenshot());assert.ok(reelDiff<8,`reel join ${reelDiff}`);
  for(const kind of ['data-return','car-monitor-return','projects-desk-travel','projects-monitor-entry']){
   await seek(page,kind,.55);const forward=await page.screenshot();await seek(page,'reel',.01);await seek(page,kind,.55);assert.ok(await diff(forward,await page.screenshot())<1,`reverse ${kind}`);
  }
  await page.setViewportSize({width:height,height:width});await seek(page,'projects-monitor-entry',.4);assert.equal((await page.evaluate(()=>window.__portfolio.snapshot())).staticMode,false);
  assert.deepEqual(errors,[]);report.push({width,height,swapDiff,deskDiff,reelDiff});await page.close();
 }
 for(const asset of ['raspberry-pi-5.glb','station-projects.glb']){
  const page=await browser.newPage();await page.route('**/'+asset,r=>r.abort());await page.goto('http://127.0.0.1:5173/#fsae-data-logging');await page.waitForFunction(()=>window.__portfolio?.snapshot().ready);await page.waitForTimeout(1000);
  await seek(page,'projects-monitor-entry',.85);assert.equal((await page.evaluate(()=>window.__portfolio.snapshot())).waiting,false);if(asset==='station-projects.glb')assert.equal((await page.evaluate(()=>window.__portfolio.snapshot())).monitorFallback,true);
  await seek(page,'reel',.01);assert.equal(await page.locator('#reel').isVisible(),true);await page.close();
 }
 const page=await browser.newPage({viewport:{width:1200,height:900}});await page.goto('http://127.0.0.1:5173/#fsae-data-logging');await page.waitForFunction(()=>window.__portfolio?.snapshot().detailReady);await page.waitForTimeout(700);
 await page.evaluate(()=>{const c=document.querySelector('canvas');window.chunks=[];window.recorder=new MediaRecorder(c.captureStream(30),{mimeType:'video/webm'});window.recorder.ondataavailable=e=>window.chunks.push(e.data);window.recorder.start();});
 const sequence=['data-return','car-monitor-return','projects-desk-travel','projects-monitor-entry'];for(const k of sequence)for(let i=0;i<=15;i++)await seek(page,k,Math.min(.999,i/15));for(const k of sequence.reverse())for(let i=15;i>=0;i--)await seek(page,k,Math.min(.999,i/15));
 const video=await page.evaluate(()=>new Promise(resolve=>{window.recorder.onstop=()=>{const r=new FileReader();r.onload=()=>resolve(r.result.split(',')[1]);r.readAsDataURL(new Blob(window.chunks,{type:'video/webm'}));};window.recorder.stop();}));await writeFile(`${out}/forward-reverse.webm`,Buffer.from(video,'base64'));await page.close();
 await writeFile(`${out}/validation.json`,JSON.stringify(report,null,2));console.log('PASS',report);
}finally{await browser.close();}
