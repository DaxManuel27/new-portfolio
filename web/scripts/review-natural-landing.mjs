import {mkdir,writeFile} from 'node:fs/promises';
import os from 'node:os';
import assert from 'node:assert/strict';
import sharp from 'sharp';
const {chromium}=await import(`${os.homedir()}/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright/index.mjs`);
const out='test-results/continuous-landing';await mkdir(out,{recursive:true});
const browser=await chromium.launch({channel:'chrome',headless:true});const report=[];
try{for(const viewport of [{width:2048,height:1051},{width:1440,height:960},{width:390,height:844},{width:1440,height:960,fixed:true}]){
 const label=`${viewport.width}${viewport.fixed?'-fixed':''}`;
 const page=await browser.newPage({viewport:{width:viewport.width,height:viewport.height}});
 if(viewport.fixed)await page.route('**/src/camera.ts*',async route=>{const response=await route.fetch();const body=await response.text();const marker='const sample = sampleTravel(manifest, state.heroTime);';assert.ok(body.includes(marker));await route.fulfill({response,body:body.replace(marker,marker+' if(state.phase.station===1)return {sample,pose:sampleTravel(manifest,4)};')});});const errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto('http://127.0.0.1:5173/');await page.waitForFunction(()=>window.__portfolio?.snapshot().ready&&window.__portfolio.settled()&&document.querySelector('#boot').hidden);
 const route=await page.evaluate(()=>({phases:window.__portfolio.phases,total:window.__portfolio.totalUnits}));
 const samples=[];const tiles=[];
 const arrival=[2.8,3,3.2,3.3,3.35,3.4,3.45,3.5,3.6,3.7,3.8,3.9].map(t=>['travel',1,t/4]);
 const cases=[...arrival,['approach',1,.001],['approach',1,.5],['hold',1,.5],['hack-story',1,.1],['exit',1,.99],['travel',2,.05],['travel',2,.15]];
 async function seek(progress){await page.evaluate(p=>window.__portfolio.seek(p),progress);await page.waitForTimeout(60);await page.waitForFunction(()=>window.__portfolio.settled()&&!window.__portfolio.snapshot().waiting);return page.evaluate(()=>window.__portfolio.snapshot());}
 for(const [kind,station,local] of cases){const p=route.phases.find(p=>p.kind===kind&&p.station===station);const progress=(p.start+(p.end-p.start)*local)/route.total;const s=await seek(progress);samples.push({progress,feet:s.feet,spin:s.spin,lid:s.lid,camera:s.camera});const file=`${out}/${label}-${samples.length}.png`;await page.screenshot({path:file});tiles.push({input:await sharp(file).resize({width:240}).toBuffer(),left:((samples.length-1)%5)*240,top:Math.floor((samples.length-1)/5)*Math.round(viewport.height*240/viewport.width)});}
 for(const sample of samples.toReversed()){const s=await seek(sample.progress);for(const key of ['feet','spin','lid'])assert.deepEqual(s[key],sample[key],`reverse ${key}`);}
 for(let i=arrival.length+1;i<=arrival.length+4;i++){assert.deepEqual(samples[i].feet,samples[arrival.length].feet);assert.deepEqual(samples[i].spin,samples[arrival.length].spin);}
 for(let i=1;i<arrival.length;i++)assert.ok(samples[i].feet[1]<samples[i-1].feet[1],'entire arrival descends');
 if(viewport.fixed)for(let i=1;i<arrival.length;i++)assert.deepEqual(samples[i].camera,samples[0].camera);
 assert.deepEqual(errors,[]);await sharp({create:{width:240*5,height:Math.round(viewport.height*240/viewport.width)*Math.ceil(tiles.length/5),channels:3,background:'#111'}}).composite(tiles).png().toFile(`${out}/${label}-sequence.png`);
 report.push({viewport,errors,samples});await page.close();
}await writeFile(`${out}/report.json`,JSON.stringify(report,null,2));console.log('Desktop, phone, fixed-camera sequences, continuous descent, stationary dock, and reverse seeks passed.');}finally{await browser.close()}
