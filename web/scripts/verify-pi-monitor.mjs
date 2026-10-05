import assert from 'node:assert/strict';import os from 'node:os';import {mkdir,writeFile} from 'node:fs/promises';import sharp from 'sharp';
const {chromium}=await import(`${os.homedir()}/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright/index.mjs`);
const out='test-results/pi-monitor';await mkdir(out,{recursive:true});const browser=await chromium.launch({channel:'chrome',headless:true});const report=[];
async function seek(page,local){await page.evaluate(local=>{const a=window.__portfolio,p=a.phases.find(p=>p.kind==='pi-monitor-entry');a.seek((p.start+(p.end-p.start)*local)/a.totalUnits)},local);await page.waitForTimeout(100);}
async function diff(a,b){const x=await sharp(a).removeAlpha().raw().toBuffer(),y=await sharp(b).removeAlpha().raw().toBuffer();return x.reduce((v,n,i)=>v+Math.abs(n-y[i]),0)/x.length;}
try{
 for(const [width,height] of [[1200,900],[390,844],[2040,1134]]){
  const page=await browser.newPage({viewport:{width,height}}),errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.goto('http://127.0.0.1:5173/#fsae-data-logging');await page.waitForFunction(()=>window.__portfolio?.snapshot().detailReady);await page.waitForTimeout(1200);
  for(const p of [.2,.5,.65,.485,.495,.94,.99]){
   await seek(page,p);const snap=await page.evaluate(()=>window.__portfolio.snapshot());assert.equal(snap.staticMode,false);assert.equal(snap.waiting,false);assert.ok(!snap.visibleStations.includes(3));
   if(p>.2)assert.equal(await page.locator('#fsae-detail').isVisible(),false);
  }
  await seek(page,.485);const before=await page.screenshot({path:`${out}/${width}-swap-before.png`});await seek(page,.495);const after=await page.screenshot({path:`${out}/${width}-swap-after.png`});
  const blackoutCrop=await sharp(before).extract({left:0,top:0,width:width-160,height:height-100}).removeAlpha().toBuffer();const stats=await sharp(blackoutCrop).stats();assert.ok(stats.channels.every(c=>c.max===0),'scene change is fully black');
  const swapDiff=await diff(before,after);assert.ok(swapDiff<4,`scene swap pixel mismatch ${swapDiff}`);
  await seek(page,.94);const preview=await page.screenshot();await page.evaluate(()=>{const a=window.__portfolio,p=a.phases.find(p=>p.kind==='reel');a.seek((p.start+.001)/a.totalUnits)});await page.waitForTimeout(150);const live=await page.screenshot();
  const reelDiff=await diff(preview,live);assert.ok(reelDiff<8,`reel handoff mismatch ${reelDiff}`);
  await seek(page,.55);const forward=await page.screenshot();await seek(page,.95);await seek(page,.55);assert.ok(await diff(forward,await page.screenshot())<1,'reverse image matches');
  await page.setViewportSize({width:height,height:width});await page.waitForTimeout(400);await seek(page,.8);assert.equal((await page.evaluate(()=>window.__portfolio.snapshot())).staticMode,false);
  assert.deepEqual(errors,[]);report.push({width,height,swapDiff,reelDiff});await page.close();
 }
 for(const asset of ['raspberry-pi-5.glb','station-projects.glb']){
  const page=await browser.newPage();await page.route('**/'+asset,r=>r.abort());await page.goto('http://127.0.0.1:5173/#fsae-data-logging');await page.waitForFunction(()=>window.__portfolio?.snapshot().ready);await page.waitForTimeout(1000);
  await seek(page,.85);assert.equal((await page.evaluate(()=>window.__portfolio.snapshot())).waiting,false);
  if(asset==='station-projects.glb')assert.equal((await page.evaluate(()=>window.__portfolio.snapshot())).monitorFallback,true);
  await seek(page,.99);assert.equal(await page.locator('#reel').isVisible(),true);await page.close();
 }
 const page=await browser.newPage({viewport:{width:1200,height:900}});
 await page.goto('http://127.0.0.1:5173/#fsae-data-logging');await page.waitForFunction(()=>window.__portfolio?.snapshot().detailReady);await page.waitForTimeout(800);
 await page.evaluate(()=>{const canvas=document.querySelector('canvas');window.reviewChunks=[];window.reviewRecorder=new MediaRecorder(canvas.captureStream(30),{mimeType:'video/webm'});window.reviewRecorder.ondataavailable=e=>window.reviewChunks.push(e.data);window.reviewRecorder.start();});
 for(let i=0;i<=40;i++)await seek(page,Math.min(.999,i/40));for(let i=40;i>=0;i--)await seek(page,Math.min(.999,i/40));
 const video=await page.evaluate(()=>new Promise(resolve=>{window.reviewRecorder.onstop=()=>{const reader=new FileReader();reader.onload=()=>resolve(reader.result.split(',')[1]);reader.readAsDataURL(new Blob(window.reviewChunks,{type:'video/webm'}));};window.reviewRecorder.stop();}));
 await writeFile(`${out}/forward-reverse.webm`,Buffer.from(video,'base64'));await page.close();
 await writeFile(`${out}/validation.json`,JSON.stringify(report,null,2));console.log('PASS',report);
}finally{await browser.close();}
