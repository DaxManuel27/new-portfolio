import os from 'node:os';import {mkdir} from 'node:fs/promises';
const {chromium}=await import(`${os.homedir()}/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright/index.mjs`);
const browser=await chromium.launch({channel:'chrome',headless:true});const out=new URL('../../exports/logger-aim/',import.meta.url);await mkdir(out,{recursive:true});
try{const page=await browser.newPage({viewport:{width:1512,height:771}});await page.goto('http://127.0.0.1:5173');await page.waitForFunction(()=>window.__portfolio?.snapshot().ready&&window.__portfolio.settled()&&document.getElementById('boot').hidden);
for(const t of [.3,.5,.7,.9,1]){await page.evaluate(t=>{const a=window.__portfolio,p=a.phases.find(p=>p.kind==='data-dive');a.seek((p.start+t*(p.end-p.start))/a.totalUnits)},t);await page.waitForFunction(()=>window.__portfolio.settled());await page.waitForTimeout(650);await page.screenshot({path:new URL(`${process.argv[2]||'after'}-${t}.png`,out).pathname});}
}finally{await browser.close();}
