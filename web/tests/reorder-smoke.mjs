import os from 'node:os';import fs from 'node:fs/promises';
const {chromium}=await import(`${os.homedir()}/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright/index.mjs`);
const browser=await chromium.launch({channel:'chrome',headless:true});
try{const page=await browser.newPage({viewport:{width:1440,height:960}});page.on('pageerror',e=>console.log('ERROR',e.message));page.on('console',m=>{if(m.type()==='error')console.log(m.text())});await page.goto('http://127.0.0.1:5173/?review=1');await page.waitForFunction(()=>window.__portfolio?.snapshot().ready&&window.__portfolio.settled(),{},{timeout:60000});
await page.waitForFunction(()=>getComputedStyle(document.querySelector('#boot')).opacity==='0');await page.waitForTimeout(500);
const phases=await page.evaluate(()=>window.__portfolio.phases);await fs.mkdir('test-results/station-reorder',{recursive:true});
for(const [kind,station,t] of [['hold',2,.5],['pan',2,.9],['screen-zoom',3,.85],['hold',3,.5],['pi-monitor-entry',4,.5],['pi-monitor-entry',4,.85],['reel',4,.01],['hold',5,.5]]){
const phase=phases.find(p=>p.kind===kind&&p.station===station);await page.evaluate(({phase,t})=>window.__portfolio.seek((phase.start+(phase.end-phase.start)*t)/window.__portfolio.totalUnits),{phase,t});await page.waitForTimeout(100);await page.waitForFunction(()=>window.__portfolio.settled(),{},{timeout:60000});await page.screenshot({path:`test-results/station-reorder/smoke-${station}-${kind}.png`});console.log(station,kind,await page.evaluate(()=>({s:window.__portfolio.snapshot(),reel:document.querySelector('#reel').getAttribute('style')})));}
}finally{await browser.close();}
