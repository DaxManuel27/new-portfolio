import assert from 'node:assert/strict';
import fs from 'node:fs/promises';import os from 'node:os';import sharp from 'sharp';
const {chromium}=await import(process.env.PLAYWRIGHT_MODULE||`${os.homedir()}/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright/index.mjs`);
const browser=await chromium.launch(process.env.PW_SWIFTSHADER?{headless:true,args:['--use-angle=swiftshader','--enable-unsafe-swiftshader']}:{channel:'chrome',headless:true});
const url=process.env.PREVIEW_URL||'http://127.0.0.1:5173',dir='test-results/station-reorder';await fs.mkdir(dir,{recursive:true});
const errors=[],report={checks:[],screenshots:[],handoffs:[],samples:[],desktop:[1440,960],phone:[390,844]};
try{
 const page=await browser.newPage({viewport:{width:1440,height:960}});page.on('pageerror',e=>errors.push(String(e)));
 async function ready(){await page.waitForFunction(()=>window.__portfolio?.snapshot().ready&&window.__portfolio.settled(),{},{timeout:60000});await page.waitForFunction(()=>getComputedStyle(document.querySelector('#boot')).opacity==='0');}
 await page.goto(url);await ready();await page.waitForTimeout(300);
 const {phases,totalUnits}=await page.evaluate(()=>({phases:window.__portfolio.phases,totalUnits:window.__portfolio.totalUnits}));
 assert.ok(Math.abs(totalUnits-31.8)<1e-8);assert.deepEqual(phases.filter(p=>p.kind==='screen-zoom').map(p=>p.station),[3]);
 const phase=(kind,station)=>phases.find(p=>p.kind===kind&&p.station===station);
 const progress=(p,t)=>(p.start+(p.end-p.start)*t)/totalUnits;
 async function seek(p){await page.evaluate(p=>window.__portfolio.seek(p),p);await page.waitForTimeout(35);await page.waitForFunction(()=>window.__portfolio.settled(),{},{timeout:60000});await page.evaluate(()=>new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r))));const s=await page.evaluate(()=>window.__portfolio.snapshot());assert.deepEqual(s.errors,[]);assert.equal(s.staticMode,false);assert.equal(s.heroVisible,s.phase.station<=2);return s;}
 function same(a,b,label,tol=2e-7){for(const key of ['camera','cameraQuaternion',...(a.heroVisible&&b.heroVisible?['feet','spin','lid']:[])])a[key].forEach((x,i)=>assert.ok(Math.abs(x-b[key][i])<tol,`${label} ${key} ${i}`));assert.ok(Math.abs(a.cameraWidth-b.cameraWidth)<tol,label+' width');assert.equal(a.heroVisible,b.heroVisible);}
 async function shot(name){const path=`${dir}/${name}.png`;await page.screenshot({path});report.screenshots.push(path);return path;}
 async function diff(a,b){const x=await sharp(a).removeAlpha().raw().toBuffer(),y=await sharp(b).removeAlpha().raw().toBuffer();assert.equal(x.length,y.length);let sum=0,changed=0;for(let i=0;i<x.length;i++){const d=Math.abs(x[i]-y[i]);sum+=d;if(d>12)changed++;}return {meanChannelDifference:sum/x.length,fractionAbove12:changed/x.length};}
 if(!process.argv.includes('--fallback-only')) {
 for(const [layout,width,height] of [['desktop',1440,960],['phone',390,844]]){
  await page.setViewportSize({width,height});await page.waitForTimeout(300);
  const rows=[{start:phase('travel',2).start,end:phase('approach',2).start},{start:phase('pan',2).start,end:phase('pan',2).end},{start:phase('screen-zoom',3).start,end:phase('screen-zoom',3).end},{start:phase('projects-monitor-entry',4).start,end:phase('projects-monitor-entry',4).end}];
  for(let r=0;r<rows.length;r++)for(const t of [.1,.3,.5,.7,.9]){await seek(progress(rows[r],t));await shot(`${layout}-row-${r+1}-${Math.round(t*100)}`);}
  const forward=[];
  for(let n=0;n<=100;n++){const s=await seek(n/100);assert.equal(s.paper,0);assert.equal(s.paperVisible,false);forward.push({p:s.progress,s});}
  for(const {p,s} of forward.toReversed())same(await seek(p),s,`${layout} reverse ${p}`);
  for(const n of [94,3,50,14,80,42])same(await seek(forward[n].p),forward[n].s,`${layout} direct ${n}`);
  report.samples.push({layout,forward:forward.map(({p,s})=>({p,phase:s.phase.kind,station:s.phase.station,hero:s.heroVisible}))});
  for(const p of phases.slice(1).filter(p=>p.kind!=='reel')){
   const a=await seek((p.start-.002)/totalUnits),b=await seek((p.start+.002)/totalUnits);
   assert.ok(Math.hypot(...a.camera.map((x,i)=>x-b.camera[i]))<.025,`${layout} camera join ${p.kind} ${p.station}`);
   assert.ok(Math.abs(a.cameraWidth-b.cameraWidth)<.04,`${layout} width join ${p.kind} ${p.station}`);
   assert.ok(1-Math.abs(a.cameraQuaternion.reduce((sum,x,i)=>sum+x*b.cameraQuaternion[i],0))<.002,`${layout} rotation join`);
  }
  // Pixel checks straddle the only permitted remote-camera substitution and the DOM handoff.
  await seek(progress(phase('screen-zoom',3),.88));const carBefore=await shot(`${layout}-car-before`);
  await seek(progress(phase('screen-zoom',3),.92));const carAfter=await shot(`${layout}-car-after`);
  const carDiff=await diff(carBefore,carAfter);report.handoffs.push({layout,kind:'car',...carDiff});console.log(layout,'car handoff',carDiff);
  assert.ok(carDiff.meanChannelDifference<1.5&&carDiff.fractionAbove12<.03,`${layout} car preview/live mismatch ${JSON.stringify(carDiff)}`);
  await seek(progress(phase('projects-monitor-entry',4),.999));const reelBefore=await shot(`${layout}-reel-before`);
  const beforeRect=await page.locator('.reel-card').first().boundingBox();
  await seek(progress(phase('reel',4),.001));const reelAfter=await shot(`${layout}-reel-after`);
  const afterRect=await page.locator('.reel-card').first().boundingBox();
  for(const k of ['x','y','width','height'])assert.ok(Math.abs(beforeRect[k]-afterRect[k])<.2,`${layout} reel ${k} jumps`);
  const reelDiff=await diff(reelBefore,reelAfter);report.handoffs.push({layout,kind:'reel',...reelDiff});console.log(layout,'reel handoff',reelDiff);
  assert.ok(reelDiff.meanChannelDifference<.5&&reelDiff.fractionAbove12<.01,`${layout} reel mismatch ${JSON.stringify(reelDiff)}`);
  for(let n=0;n<4;n++){await seek(progress(phase('reel',4),(n+.2)/4));assert.match(await page.locator('#reel-announcement').textContent(),new RegExp(`${n+1} of 4$`));const rect=await page.locator('.reel-card').nth(n).boundingBox();assert.ok(Math.abs(rect.x+rect.width/2-(width/2-(width<=700&&n===3?rect.width*.26:0)))<.2);await shot(`${layout}-card-${n+1}`);}
  for(const kind of ['contact-card-center','contact-card-expand'])for(const t of [0,.15,.3,.6,.9,1]){const s=await seek(progress(phase(kind,4),t));assert.equal(s.heroVisible,false);if(t>0&&t<1)assert.ok(s.visibleStations.includes(5),'live desk in handoff');}
  await seek(progress(phase('hold',2),.5));const dock=await page.evaluate(()=>window.__portfolio.snapshot());await seek(.8);same(await seek(dock.progress),dock,`${layout} dock restores`);
  report.checks.push(`${layout}: 25 transition captures; 101 forward/reverse samples; arbitrary seeks; visible joins; pixel handoffs; unchanged card centers and desk handoff`);
 }
 for(const [hash,station,kind] of [['ultra-maritime',2,'hold'],['formula-sae',3,'hold'],['projects',4,'reel']]){await page.evaluate(hash=>{location.hash=hash},hash);await page.waitForTimeout(180);await page.waitForFunction(()=>window.__portfolio.settled());const s=await page.evaluate(()=>window.__portfolio.snapshot());assert.equal(s.phase.station,station);assert.equal(s.phase.kind,kind);}
 await seek(.43);await page.waitForTimeout(600);const before=await page.evaluate(()=>window.__portfolio.snapshot());await page.reload();await ready();const after=await page.evaluate(()=>window.__portfolio.snapshot());assert.equal(after.progress,0,'refresh starts at the top');
 await page.setViewportSize({width:1440,height:960});await page.waitForTimeout(300);assert.equal((await page.evaluate(()=>window.__portfolio.snapshot())).progress,0,'resize preserves the restarted position');
 await seek(progress(phase('hold',5),.5));await page.locator('#print-resume').focus();await page.keyboard.press('Enter');await page.waitForFunction(()=>window.__portfolio.snapshot().printStatus==='printed',{},{timeout:15000});assert.equal((await page.evaluate(()=>window.__portfolio.snapshot())).paperVisible,true);await shot('printed-resume');
 await seek(.2);await seek(1);assert.equal((await page.evaluate(()=>window.__portfolio.snapshot())).printStatus,'printed');assert.equal(await page.locator('#notebook-links a:visible').count(),5);await shot('contact-links');
 await page.locator('#motion-toggle').click();assert.equal(await page.locator('#stills figure:visible').count(),8);assert.deepEqual(await page.locator('#stills figure').evaluateAll(nodes=>nodes.map(n=>n.id)),['still-intro','still-hack-atlantic','still-ultra-maritime','still-formula-sae','still-ultrawide','still-projects','still-resume','still-contact']);assert.equal(await page.locator('.project-list li').count(),4);
 await page.locator('#motion-toggle').click();await ready();await seek(.1);const p=(await page.evaluate(()=>window.__portfolio.snapshot())).progress;await page.mouse.wheel(0,300);await page.waitForTimeout(250);assert.ok((await page.evaluate(()=>window.__portfolio.snapshot())).progress>p);
 }
 const reduced=await browser.newPage({reducedMotion:'reduce'});await reduced.goto(url);await reduced.waitForFunction(()=>window.__portfolio?.snapshot().staticMode);assert.equal(await reduced.locator('#stills figure').count(),8);assert.equal(await reduced.locator('.project-list li').count(),4);
 assert.equal(await reduced.locator('body').evaluate(e=>e.classList.contains('reduced-crossfade')),false,'reading sections retain normal document flow');
 await reduced.locator('#still-ultrawide').scrollIntoViewIfNeeded();
 const poster=reduced.locator('#still-ultrawide img').first();await poster.evaluate(e=>e.decode());assert.match(await poster.getAttribute('alt'),/Personal Projects.*60% mechanical keyboard/);
 assert.equal(await reduced.locator('#static-fsae-data-logging').count(),1);await reduced.screenshot({path:`${dir}/reduced-motion-projects.png`});await reduced.close();
 await page.evaluate(()=>document.querySelector('canvas').dispatchEvent(new Event('webglcontextlost',{cancelable:true})));await page.waitForFunction(()=>window.__portfolio.snapshot().staticMode);
 const failure=await browser.newPage();await failure.route('**/station-hack-atlantic.glb',r=>r.abort());await failure.goto(url+'/#hack-atlantic');await failure.waitForSelector('#retry:not([hidden])',{timeout:60000});await failure.unroute('**/station-hack-atlantic.glb');await failure.locator('#retry').click();await failure.waitForFunction(()=>window.__portfolio.settled(),{},{timeout:60000});await failure.close();
 const broken=await browser.newPage();await broken.route('**/macbook-journey.glb',r=>r.abort());await broken.goto(url);await broken.waitForFunction(()=>window.__portfolio?.snapshot().staticMode);await broken.close();
 if(!process.argv.includes('--fallback-only'))report.checks.push('historic hashes','reload and resize restoration','keyboard Print Resume completes and persists across reverse seeks','five notebook links','static order and card list','native scrolling');report.checks.push('reduced motion with readable project sections','WebGL fallback','asset retry','hero-load fallback');assert.deepEqual(errors,[]);
 report.browser=await browser.version();report.errors=errors;report.status='PASS';await fs.writeFile(`${dir}/${process.argv.includes('--fallback-only')?'fallback-report':'browser-report'}.json`,JSON.stringify(report,null,2));console.log('Browser regression checks passed.');
}catch(e){report.status='FAIL';report.error=String(e);await fs.writeFile(`${dir}/${process.argv.includes('--fallback-only')?'fallback-report':'browser-report'}.json`,JSON.stringify(report,null,2));throw e;}finally{await browser.close();}
