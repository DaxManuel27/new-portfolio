import { mkdir, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';
const root=fileURLToPath(new URL('../../',import.meta.url));
const out=path.join(root,'web/test-results/printer-motion');
await mkdir(out,{recursive:true});
const {chromium}=await import(process.env.PLAYWRIGHT_MODULE || `${os.homedir()}/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright/index.mjs`);
const browser=await chromium.launch({channel:'chrome',headless:true});
try {
  const page=await browser.newPage({viewport:{width:1200,height:900}});
  await page.goto('http://127.0.0.1:5173/?review=1#resume');
  await page.waitForFunction(()=>window.__portfolio?.settled() && window.__portfolio.snapshot().ready);
  await page.evaluate(async()=>{
    const [{PortfolioScene},{evaluate,stationProgress}]=await Promise.all([import('/src/scene.ts'),import('/src/journey.ts')]);
    const canvas=document.createElement('canvas');canvas.style.cssText='position:fixed;inset:0;width:100vw;height:100vh;z-index:999;background:#111';document.body.append(canvas);
    const manifest=await fetch('/assets/journey.json').then(r=>r.json());
    const scene=new PortfolioScene(canvas,manifest);await scene.loadHero();await scene.loadStation(5);
    const state=p=>evaluate(stationProgress(5),p);
    for(let attempt=0;scene.update(state(0)).waiting;attempt++){
      if(attempt>600)throw new Error('Printer capture assets did not become ready');
      await new Promise(r=>setTimeout(r,50));
    }
    window.__printerCanvas=canvas;
    window.__printerCapture=(p,side=false)=>{
      scene.update(state(p));
      if(side){
        scene.camera.position.set(10.86,1.00,.44);scene.camera.lookAt(10.36,.79,.04);
        scene.camera.left=-.27;scene.camera.right=.27;scene.camera.top=.2025;scene.camera.bottom=-.2025;
        scene.camera.updateProjectionMatrix();scene.camera.updateMatrixWorld(true);
      }
      scene.render();return scene.diagnostics();
    };
  });
  const snapshots=[];
  for(const side of [false,true]){
    const tiles=[];
    for(const [index,p] of [0,.1,.25,.35,.385,.5,.65,.85,.95,1].entries()){
      snapshots.push({side,progress:p,...await page.evaluate(({p,side})=>window.__printerCapture(p,side),{p,side})});
      const file=path.join(out,`${side?'side':'overhead'}-${String(index).padStart(2,'0')}.png`);
      await page.screenshot({path:file});
      const tile=await sharp(file).resize(360,270).png().toBuffer();tiles.push({input:tile,left:(index%5)*360,top:Math.floor(index/5)*300});
      const label=Buffer.from(`<svg width="360" height="30"><rect width="360" height="30" fill="#222"/><text x="12" y="21" fill="#fff" font-family="Arial" font-size="16">${p*100}%</text></svg>`);
      tiles.push({input:label,left:(index%5)*360,top:Math.floor(index/5)*300+270});
    }
    await sharp({create:{width:1800,height:600,channels:3,background:'#111'}}).composite(tiles).png().toFile(path.join(out,`${side?'side':'overhead'}-contact-sheet.png`));
  }
  await writeFile(path.join(out,'snapshots.json'),JSON.stringify(snapshots,null,2));
  for(const side of [false,true]){
    const data=await page.evaluate(async side=>{
      window.__printerCapture(0,side);
      const stream=window.__printerCanvas.captureStream(30),recorder=new MediaRecorder(stream),chunks=[];
      recorder.ondataavailable=e=>{if(e.data.size)chunks.push(e.data);};
      const stopped=new Promise(resolve=>recorder.onstop=resolve);recorder.start();
      await new Promise(resolve=>{
        const start=performance.now();
        const frame=now=>{window.__printerCapture(Math.min(1,Math.max(0,(now-start-200)/4000)),side);if(now-start<4400)requestAnimationFrame(frame);else resolve();};
        requestAnimationFrame(frame);
      });
      recorder.stop();await stopped;stream.getTracks().forEach(track=>track.stop());
      return await new Promise(resolve=>{const reader=new FileReader();reader.onload=()=>resolve(reader.result);reader.readAsDataURL(new Blob(chunks,{type:recorder.mimeType}));});
    },side);
    await writeFile(path.join(out,`${side?'side':'overhead'}-feed.webm`),Buffer.from(data.split(',')[1],'base64'));
  }
  console.log('Captured10 feed poses from overhead and side using the actual browser renderer.');
}finally{await browser.close();}
