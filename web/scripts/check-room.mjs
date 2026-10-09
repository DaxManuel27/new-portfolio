import os from 'node:os';
const {chromium}=await import(process.env.PLAYWRIGHT_MODULE||`${os.homedir()}/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright/index.mjs`);
import assert from 'node:assert/strict';
import {writeFile} from 'node:fs/promises';
const browser=await chromium.launch({channel:'chrome',headless:true});const report={errors:[],views:[]};
const page=await browser.newPage({viewport:{width:1440,height:960}});page.on('pageerror',e=>report.errors.push(String(e)));
await page.goto('http://127.0.0.1:5173/?qa');await page.waitForFunction(()=>window.__roomQA?.snapshot()?.ready&&document.querySelector('.desk-loader').hidden,{},{timeout:90000});
await page.addStyleTag({content:'.qa-output{display:none}'});
for(const [width,height]of [[1440,960],[1024,768],[390,844]]){
 await page.setViewportSize({width,height});await page.waitForTimeout(1200);
 report.views.push({width,snapshot:await page.evaluate(()=>window.__roomQA.snapshot()),labels:await page.locator('.callout').evaluateAll(nodes=>nodes.map(n=>({id:n.dataset.id,collision:n.dataset.collision,rect:n.querySelector('button').getBoundingClientRect().toJSON()})))});
 if(width>=760)assert.ok(report.views.at(-1).labels.every(l=>l.collision==='false'));await page.screenshot({path:`test-results/room/overview-${width}.png`});
 await page.evaluate(()=>window.__roomQA.open('hack-atlantic'));await page.waitForTimeout(1700);await page.screenshot({path:`test-results/room/fabric-${width}.png`});
 await page.locator('.fabric-hit').focus();await page.keyboard.press('End');await page.waitForTimeout(900);await page.screenshot({path:`test-results/room/fabric-end-${width}.png`});report.views.at(-1).scrolled=await page.evaluate(()=>window.__roomQA.snapshot().fabric);
 await page.keyboard.press('Escape');await page.waitForTimeout(1100);
}
report.assets=await page.evaluate(()=>{const s=window.__roomQA.scene().scene;let triangles=0;const textures=new Set();for(const name of ['COL_Room','Root_scroll_frame','Wall_painted_name'])s.getObjectByName(name).traverse(o=>{if(o.isMesh){triangles+=(o.geometry.index?.count??o.geometry.attributes.position.count)/3*(o.isInstancedMesh?o.count:1);for(const m of Array.isArray(o.material)?o.material:[o.material])for(const v of Object.values(m))if(v?.isTexture)textures.add(v);}});return {triangles,textures:[...textures].map(t=>({width:t.image?.width,height:t.image?.height})),wallNameAttachedToScene:s.getObjectByName('Wall_painted_name').parent===s};});assert.ok(report.assets.textures.every(t=>t.width<=2048&&t.height<=2048||(t.width===2048&&t.height===4096)));await writeFile('test-results/room/report.json',JSON.stringify(report,null,2));console.log(JSON.stringify(report));await browser.close();
