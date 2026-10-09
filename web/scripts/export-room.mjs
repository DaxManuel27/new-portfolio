import os from 'node:os';
const {chromium}=await import(process.env.PLAYWRIGHT_MODULE||`${os.homedir()}/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright/index.mjs`);
import {mkdir,writeFile} from 'node:fs/promises';
await mkdir('../exports/room',{recursive:true});
const browser=await chromium.launch({channel:'chrome',headless:true});const page=await browser.newPage({viewport:{width:1440,height:960}});
await page.goto('http://127.0.0.1:5173/?qa');await page.waitForFunction(()=>window.__roomQA?.snapshot()?.ready,{},{timeout:90000});
const data=await page.evaluate(async()=>{const s=window.__roomQA.scene();const glb=await s.exportRoomAdditions();let str='';for(const byte of new Uint8Array(glb))str+=String.fromCharCode(byte);const about=s.scene.getObjectByName('Root_macbook');let png='';about.traverse(o=>{if(o.material?.map?.image instanceof HTMLCanvasElement)png=o.material.map.image.toDataURL('image/png');});return {glb:btoa(str),about:png};});
await writeFile('../exports/room/room-additions.glb',Buffer.from(data.glb,'base64'));await writeFile('../exports/room/about.png',Buffer.from(data.about.split(',')[1],'base64'));console.log('Room geometry and About artwork exported.');await browser.close();
