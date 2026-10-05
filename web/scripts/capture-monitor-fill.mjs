import os from 'node:os';import {mkdir} from 'node:fs/promises';
const {chromium}=await import(`${os.homedir()}/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright/index.mjs`);
const browser=await chromium.launch({channel:'chrome',headless:true});await mkdir('test-results/monitor-fill',{recursive:true});
try{for(const [width,height] of [[2040,1134],[390,844]]){
 const page=await browser.newPage({viewport:{width,height}});await page.goto('http://127.0.0.1:5173/');await page.waitForFunction(()=>window.__portfolio?.snapshot().ready);
 await page.evaluate(()=>{const a=window.__portfolio,p=a.phases.find(p=>p.kind==='monitor-hold');a.seek((p.start+.1)/a.totalUnits)});
 await page.waitForFunction(()=>window.__portfolio.settled()&&!window.__portfolio.snapshot().waiting);await page.waitForTimeout(1800);
 await page.screenshot({path:`test-results/monitor-fill/${width}.png`});await page.close();
}}finally{await browser.close()}
