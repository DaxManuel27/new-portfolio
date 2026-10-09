import {chromium} from '/Users/daxmanuel/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright/index.mjs';
import assert from 'node:assert/strict';
const browser=await chromium.launch({channel:'chrome',headless:true});
try{const page=await browser.newPage({viewport:{width:1440,height:960}});await page.goto('http://127.0.0.1:5173/?qa');await page.waitForFunction(()=>window.__roomQA?.snapshot().ready,null,{timeout:90000});await page.addStyleTag({content:'.qa-output{display:none}'});
await page.evaluate(()=>window.__roomQA.open('ultra-maritime'));await page.waitForTimeout(2200);
const result=await page.evaluate(async()=>{const T=await import('/node_modules/three/build/three.module.js');const w=window.__roomQA.scene(),book=new T.Box3().setFromObject(w.scene.getObjectByName('Root_notebook')),laptop=new T.Box3().setFromObject(w.scene.getObjectByName('Root_macbook'));return {overlap:book.intersectsBox(laptop),angle:w.diagnostics().notebookAngle};});assert.equal(result.overlap,false);assert.ok(Math.abs(result.angle-Math.PI)<.001);await page.screenshot({path:'test-results/room/notebook-moved-open.png'});console.log('Notebook opens fully without intersecting the laptop.');
}finally{await browser.close();}
