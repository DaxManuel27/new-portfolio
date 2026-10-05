import assert from 'node:assert/strict';import fs from 'node:fs/promises';import os from 'node:os';import sharp from 'sharp';
const {chromium}=await import(`${os.homedir()}/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright/index.mjs`);
const browser=await chromium.launch({channel:'chrome',headless:true}),dir='test-results/continuous-pi';await fs.mkdir(dir,{recursive:true});const report={samples:[],checks:[]};
try{
 for(const [layout,width,height] of [['desktop',1440,960],['phone',390,844]]){
  const page=await browser.newPage({viewport:{width,height}}),errors=[];page.on('pageerror',e=>errors.push(String(e)));page.on('console',m=>{if(m.type()==='error')errors.push(m.text())});
  await page.goto('http://127.0.0.1:5173/#fsae-data-logging');await page.waitForFunction(()=>window.__portfolio?.snapshot().detailReady&&window.__portfolio.settled(),{},{timeout:60000});await page.waitForFunction(()=>getComputedStyle(document.querySelector('#boot')).opacity==='0');
  const api=await page.evaluate(()=>({phases:window.__portfolio.phases,total:window.__portfolio.totalUnits})),phases=api.phases.filter(p=>p.kind.startsWith('data-'));
  assert.equal(await page.evaluate(()=>window.__portfolio.snapshot().phase.kind),'data-hold');
  const progress=(p,t)=>(p.start+(p.end-p.start)*t)/api.total;
  async function seek(p){await page.evaluate(p=>window.__portfolio.seek(p),p);await page.waitForFunction(()=>window.__portfolio.settled());await page.evaluate(()=>new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r))));return page.evaluate(()=>window.__portfolio.snapshot());}
  const fixed=(await seek(progress(phases[0],0))).pi;
  const samples=[];
  for(const phase of phases){
   for(let n=0;n<=40;n++){
    const t=n/40,s=await seek(progress(phase,t===1?1-1e-8:t));assert.equal(s.pi.uuid,fixed.uuid);assert.equal(s.pi.visible,true);assert.deepEqual(s.pi.position,fixed.position);assert.deepEqual(s.pi.scale,fixed.scale);assert.deepEqual(s.pi.quaternion,fixed.quaternion);assert.ok(s.pi.opacity.every(x=>x===1));assert.ok(s.cameraNear<=.005);samples.push({progress:s.progress,s});
   }
   for(const t of [.1,.3,.5,.7,.9]){const s=await seek(progress(phase,t));await page.screenshot({path:`${dir}/${layout}-${phase.kind}-${Math.round(t*100)}.png`});report.samples.push({layout,phase:phase.kind,t,s});}
  }
  for(const saved of samples.toReversed()){
   const s=await seek(saved.progress);for(const key of ['camera','cameraQuaternion'])s[key].forEach((x,i)=>assert.ok(Math.abs(x-saved.s[key][i])<2e-7));assert.equal(s.carBrightness,saved.s.carBrightness);assert.equal(s.pi.uuid,fixed.uuid);
  }
  const isolate=phases.find(p=>p.kind==='data-isolate');await seek(progress(isolate,1-1e-8));
  const shot=await page.screenshot(),rgb=await sharp(shot).removeAlpha().raw().toBuffer();let green=0;for(let i=0;i<rgb.length;i+=3)if(rgb[i+1]>35&&rgb[i+1]>rgb[i]*1.2&&rgb[i+1]>rgb[i+2]*1.15)green++;assert.ok(green>100,'lit board survives car darkness');
  assert.equal(await page.locator('#fsae-detail').getAttribute('hidden'),null);assert.equal(await page.locator('#fsae-detail').getAttribute('aria-hidden'),null);
  const revealPhase=phases.find(p=>p.kind==='data-reveal'),returnPhase=phases.find(p=>p.kind==='data-return');const partialState=await seek(progress(revealPhase,.5));const partial=await page.locator('#fsae-detail article').evaluate(e=>[...e.children].map(n=>({opacity:n.style.opacity,transform:n.style.transform})));const reverseState=await seek(progress(returnPhase,.125));const reverse=await page.locator('#fsae-detail article').evaluate(e=>[...e.children].map(n=>({opacity:n.style.opacity,transform:n.style.transform})));const a=(partialState.progress*api.total-revealPhase.start)/(revealPhase.end-revealPhase.start),b=1-(reverseState.progress*api.total-returnPhase.start)/(returnPhase.end-returnPhase.start)/.25;const clockTolerance=3.75*Math.abs(a-b)+1e-5;for(let i=0;i<partial.length;i++){assert.ok(Math.abs(Number(reverse[i].opacity)-Number(partial[i].opacity))<clockTolerance);assert.ok(Math.abs(parseFloat(reverse[i].transform.slice(11))-parseFloat(partial[i].transform.slice(11)))<12*clockTolerance);}
  assert.deepEqual(errors,[]);report.checks.push({layout,fixed,greenPixelsAtIsolation:green,forwardReverseSamples:samples.length,performance:(await page.evaluate(()=>window.__portfolio.snapshot())).cpuRenderP95Ms});await page.close();
 }
 const reduced=await browser.newPage({reducedMotion:'reduce',viewport:{width:390,height:844}});
 await reduced.goto('http://127.0.0.1:5173/#fsae-data-logging');await reduced.waitForFunction(()=>window.__portfolio?.snapshot().staticMode);await reduced.locator('.pi-still-to').evaluate(e=>e.decode());
 await reduced.evaluate(()=>{const f=document.querySelector('.pi-still-frame');scrollTo(0,scrollY+f.getBoundingClientRect().top-innerHeight*.6)});await reduced.waitForTimeout(100);
 const fade=await reduced.locator('.pi-still-to').evaluate(e=>Number(e.style.opacity));assert.ok(fade>.48&&fade<.52);assert.equal(await reduced.locator('body').evaluate(e=>e.classList.contains('reduced-crossfade')),false);
 await reduced.screenshot({path:dir+'/reduced-crossfade.png'});await reduced.close();
 const failure=await browser.newPage();await failure.route('**/raspberry-pi-5.glb',r=>r.abort());await failure.goto('http://127.0.0.1:5173/#fsae-data-logging');await failure.waitForFunction(()=>window.__portfolio?.snapshot().detailFailed,{},{timeout:60000});await failure.waitForSelector('#fsae-poster:not([hidden])');await failure.close();
 report.status='PASS';await fs.writeFile(dir+'/report.json',JSON.stringify(report,null,2));console.log('Continuous Pi desktop/phone, identity, reverse, staged text and fallback checks passed.');
}catch(e){report.status='FAIL';report.error=String(e);await fs.writeFile(dir+'/report.json',JSON.stringify(report,null,2));throw e;}finally{await browser.close();}
