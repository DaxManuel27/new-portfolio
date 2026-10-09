import assert from 'node:assert/strict';
import {mkdir,writeFile} from 'node:fs/promises';
import os from 'node:os';
const {chromium}=await import(`${os.homedir()}/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright/index.mjs`);
const browser=await chromium.launch({channel:'chrome',headless:true});
try{
 const page=await browser.newPage({viewport:{width:1440,height:960}}),errors=[];
 page.on('pageerror',e=>errors.push(String(e)));page.on('console',m=>{if(m.type()==='error')errors.push(m.text());});
 await page.goto('http://127.0.0.1:5173/?qa');await page.waitForFunction(()=>window.__roomQA?.snapshot()?.ready&&document.querySelector('.desk-loader').hidden,null,{timeout:90000});
 await page.addStyleTag({content:'.qa-output{display:none}'});await mkdir('test-results/matcha',{recursive:true});
 const views=[];
 for(const [width,height]of [[1440,960],[1024,768],[390,844]]){
  await page.setViewportSize({width,height});await page.waitForTimeout(500);
  const result=await page.evaluate(async()=>{
   const T=await import('/node_modules/three/build/three.module.js');const w=window.__roomQA.scene(),cup=w.scene.getObjectByName('Root_iced_matcha');assertExists(cup);
   function assertExists(o){if(!o)throw Error('Matcha missing');}
   const bounds=new T.Box3().setFromObject(cup),cupMesh=cup.getObjectByName('Matcha_clear_cup'),body=new T.Box3().setFromObject(cupMesh);
   const screen=b=>{const pts=[];for(const x of [b.min.x,b.max.x])for(const y of [b.min.y,b.max.y])for(const z of [b.min.z,b.max.z])pts.push(new T.Vector3(x,y,z).project(w.camera));return {left:Math.min(...pts.map(p=>(p.x+1)*innerWidth/2)),right:Math.max(...pts.map(p=>(p.x+1)*innerWidth/2)),top:Math.min(...pts.map(p=>(1-p.y)*innerHeight/2)),bottom:Math.max(...pts.map(p=>(1-p.y)*innerHeight/2))};};
   const rect=screen(bounds),overlaps=[];
   for(const name of ['Root_macbook','Root_car'])if(bounds.intersectsBox(new T.Box3().setFromObject(w.scene.getObjectByName(name))))overlaps.push(name);
   const labelOverlaps=[...document.querySelectorAll('.callout button')].filter(n=>n.getBoundingClientRect().width&&getComputedStyle(n.parentElement).display!=='none').filter(n=>{const r=n.getBoundingClientRect();return r.left<rect.right&&r.right>rect.left&&r.top<rect.bottom&&r.bottom>rect.top;}).map(n=>n.dataset.open);
   const ray=new T.Raycaster(bounds.getCenter(new T.Vector3()).add(new T.Vector3(0,0,1)),new T.Vector3(0,0,-1));
   return {rect,body:body.getSize(new T.Vector3()).toArray(),base:body.min.y,overlaps,labelOverlaps,rayHits:ray.intersectObject(cup,true).length,diagnostics:w.diagnostics()};
  });
  assert.equal(result.rayHits,0);assert.deepEqual(result.overlaps,[]);if(width>=760)assert.deepEqual(result.labelOverlaps,[]);assert.ok(Math.abs(result.body[1]-.16)<.00001);
  await page.screenshot({path:`test-results/matcha/overview-${width}.png`});
  await page.evaluate(()=>window.__roomQA.open('about'));await page.waitForTimeout(1600);
  result.focus=await page.evaluate(async()=>{const T=await import('/node_modules/three/build/three.module.js');const w=window.__roomQA.scene(),cup=w.scene.getObjectByName('Root_iced_matcha'),surface=w.surfaceRect('about');let blocked=0;for(let y=1;y<5;y++)for(let x=1;x<5;x++){const ray=new T.Raycaster();ray.setFromCamera(new T.Vector2((surface.left+surface.width*x/5)/innerWidth*2-1,1-(surface.top+surface.height*y/5)/innerHeight*2),w.camera);if(ray.ray.intersectsBox(new T.Box3().setFromObject(cup)))blocked++;}return {blocked,cameraInside:new T.Box3().setFromObject(cup).containsPoint(w.camera.position)};});
  assert.equal(result.focus.blocked,0);assert.equal(result.focus.cameraInside,false);
  await page.screenshot({path:`test-results/matcha/laptop-${width}.png`});views.push({width,...result});await page.evaluate(()=>window.__roomQA.close());await page.waitForTimeout(1100);
 }
 await page.setViewportSize({width:1440,height:960});await page.waitForTimeout(500);
 await page.evaluate(async()=>{const w=window.__roomQA.scene();w.camera.position.set(-.10,1.04,.56);w.camera.lookAt(-.263,.84,.16);});
 await page.waitForTimeout(250);await page.screenshot({path:'test-results/matcha/detail.png'});
 assert.deepEqual(errors,[]);await writeFile('test-results/matcha/report.json',JSON.stringify({errors,views},null,2));console.log(JSON.stringify({errors,views}));
}finally{await browser.close();}
