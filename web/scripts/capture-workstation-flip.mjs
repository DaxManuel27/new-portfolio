import {mkdir} from 'node:fs/promises';
import os from 'node:os';
import sharp from 'sharp';
const {chromium}=await import(`${os.homedir()}/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright/index.mjs`);
const out='test-results/workstation-flip';await mkdir(out,{recursive:true});
const browser=await chromium.launch({channel:'chrome',headless:true});
try{
 for(const viewport of [{width:1200,height:900},{width:390,height:844}]){
 const page=await browser.newPage({viewport});await page.route('**/assets/macbook-journey.glb',route=>route.continue({headers:{...route.request().headers(),'cache-control':'no-cache'}}));const errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto('http://127.0.0.1:5173/?review=1');await page.waitForFunction(()=>window.__portfolio?.snapshot().ready);
 await page.evaluate(()=>window.__portfolio.station(2));
 await page.waitForFunction(()=>window.__portfolio.settled() && !window.__portfolio.snapshot().waiting);
 await page.waitForTimeout(1500);
 const tiles=[];
 for(const [i,time] of [4.72,5.26,5.8,6.34,6.88].entries()){
 await page.evaluate(t=>{const api=window.__portfolio;const phase=api.phases.find(p=>p.station===2&&p.kind==='travel');api.seek((phase.start+(phase.end-phase.start)*(t-4)/4)/api.totalUnits)},time);
 await page.waitForFunction(()=>window.__portfolio.settled());await page.waitForTimeout(1000);console.log(viewport.width,time,await page.evaluate(()=>({time:window.__portfolio.snapshot().time,spin:window.__portfolio.snapshot().spin}))); 
 const file=`${out}/${viewport.width}-${i}.png`;await page.screenshot({path:file});
 tiles.push({input:await sharp(file).resize({width:300}).png().toBuffer(),left:i*300,top:0});
 }
 await sharp({create:{width:1500,height:Math.round(viewport.height*300/viewport.width),channels:3,background:'#111'}}).composite(tiles).png().toFile(`${out}/${viewport.width}-review.png`);
 console.log(viewport.width,'browser errors:',errors);await page.close();
 }
}finally{await browser.close()}
