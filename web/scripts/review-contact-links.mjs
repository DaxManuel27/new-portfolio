import assert from 'node:assert/strict';
import os from 'node:os';
const {chromium}=await import(`${os.homedir()}/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright/index.mjs`);
const browser=await chromium.launch({channel:'chrome',headless:true});
try{
 const page=await browser.newPage({viewport:{width:1440,height:960}});
 await page.goto('http://127.0.0.1:5173/');await page.waitForFunction(()=>window.__portfolio?.snapshot().ready&&window.__portfolio.settled()&&document.getElementById('boot').hidden);
 await page.evaluate(()=>window.__portfolio.station(6));await page.waitForFunction(()=>window.__portfolio.settled());await page.waitForTimeout(800);
 for(const size of [{width:1440,height:960},{width:390,height:844}]){
  await page.setViewportSize(size);await page.waitForTimeout(600);
  const rows=await page.locator('[data-notebook-link]').evaluateAll(links=>links.map(a=>{const r=a.getBoundingClientRect();return {id:a.dataset.notebookLink,hidden:a.hidden,rect:{x:r.x,y:r.y,w:r.width,h:r.height},hit:document.elementFromPoint(r.x+r.width/2,r.y+r.height/2)?.id,clickable:document.elementFromPoint(r.x+r.width/2,r.y+r.height/2)===a};}));
  console.log(size,rows);if(process.argv.includes('--inspect'))continue;
  for(const row of rows){assert.equal(row.hidden,false,row.id);assert.equal(row.clickable,true,row.id+' must receive pointer events');}
  // Exercise actual pointer activation while preventing external app/window launches.
  await page.evaluate(()=>{if(window.contactClicks)return;window.contactClicks=[];document.querySelector('#notebook-links').addEventListener('click',e=>{const a=e.target.closest('a');if(a){e.preventDefault();window.contactClicks.push(a.getAttribute('href'));}});});
  for(const id of ['github','linkedin','email','phone','x'])await page.locator(`[data-notebook-link="${id}"]`).click();
  assert.deepEqual(await page.evaluate(()=>window.contactClicks.slice(-5)),['https://github.com/daxmanuel27','https://linkedin.com/in/nikolasdaxmanuel','mailto:mail@daxmanuel.com','tel:+15068972218','https://x.com/bydaxmanuel']);
  await page.locator('[data-notebook-link="github"]').focus();await page.keyboard.press('Enter');assert.equal(await page.evaluate(()=>window.contactClicks.at(-1)),'https://github.com/daxmanuel27');
 }
 if(!process.argv.includes('--inspect'))console.log('Notebook contact pointer and keyboard checks passed.');
}finally{await browser.close();}
