import os from 'node:os';import {mkdir,writeFile} from 'node:fs/promises';
const {chromium}=await import(`${os.homedir()}/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright/index.mjs`);
const out='test-results/fsae-labels';await mkdir(out,{recursive:true});const browser=await chromium.launch({channel:'chrome',headless:true});const results=[];
try{for(const [width,height] of [[1200,900],[390,844]]){
 const page=await browser.newPage({viewport:{width,height}});const errors=[];page.on('pageerror',e=>errors.push(e.message));await page.goto('http://127.0.0.1:5173/#fsae-data-logging');await page.waitForFunction(()=>window.__portfolio?.snapshot().ready&&window.__portfolio.snapshot().detailReady);await page.waitForTimeout(1800);
 for(const [kind,local] of [['hold',.5]]){
 await page.evaluate(({kind,local})=>{const a=window.__portfolio,p=a.phases.find(p=>p.kind===kind&&p.station===3);a.seek((p.start+(p.end-p.start)*local)/a.totalUnits)},{kind,local});await page.waitForTimeout(350);await page.screenshot({path:`${out}/${width}-${kind}-${local}.png`});
 results.push({width,kind,local,snapshot:await page.evaluate(()=>window.__portfolio.snapshot())});}
 console.log(width,errors);await page.close();}
 await writeFile(`${out}/snapshots.json`,JSON.stringify(results,null,2));
}finally{await browser.close()}
