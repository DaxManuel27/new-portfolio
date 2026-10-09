import {notebookLayout,PAGE_WIDTH,PAGE_HEIGHT,type NotebookLayout} from './notebook-layout';
export async function loadNotebookFont(fontSet:Pick<FontFaceSet,'load'>=document.fonts,timeoutMs=6000){
 let timeout:ReturnType<typeof setTimeout>|undefined;
 try{const fonts=await Promise.race([fontSet.load('40px "Kalam"'),new Promise<never>((_,reject)=>{timeout=setTimeout(()=>reject(Error('Notebook font unavailable')),timeoutMs);})]);
  if(!fonts.length)throw Error('Notebook handwriting font unavailable');
 }finally{clearTimeout(timeout);}
}
export function paintNotebookPage(side:'left'|'right',mobile=false,page=0,maxDimension=4096){
 const canvas=document.createElement('canvas');canvas.height=Math.min(3072,maxDimension);canvas.width=Math.round(canvas.height*PAGE_WIDTH/PAGE_HEIGHT);
 const ctx=canvas.getContext('2d');if(!ctx)throw Error('Notebook canvas unavailable');
 ctx.scale(canvas.width/PAGE_WIDTH,canvas.height/PAGE_HEIGHT);
 const measure=(text:string,size:number)=>{ctx.font=`${size}px Kalam`;return ctx.measureText(text).width;};
 const layout=notebookLayout(side,mobile,page,measure);drawPaper(ctx,layout);
 for(const line of layout.lines){ctx.font=`${line.size}px Kalam`;ctx.fillStyle='#263c49';
  ctx.fillStyle='#263c49';ctx.fillText(line.text,line.x,line.y);
  if(line.underline){ctx.strokeStyle='#304955';ctx.lineWidth=2.2;ctx.beginPath();ctx.moveTo(line.x,line.y+10);ctx.quadraticCurveTo(line.x+ctx.measureText(line.text).width*.55,line.y+15,line.x+ctx.measureText(line.text).width,line.y+8);ctx.stroke();}
 }
 if(layout.sketch){ctx.strokeStyle='#526672';ctx.lineWidth=2;for(const [i,label]of ['input','test','output'].entries()){const x=110+i*220;ctx.strokeRect(x,1150,165,62);ctx.font='29px Kalam';ctx.fillStyle='#526672';ctx.fillText(label,x+20,1193);if(i<2){ctx.beginPath();ctx.moveTo(x+171,1181);ctx.lineTo(x+214,1181);ctx.lineTo(x+203,1174);ctx.moveTo(x+214,1181);ctx.lineTo(x+203,1188);ctx.stroke();}}}
 ctx.font='30px Kalam';ctx.fillStyle='#687b80';ctx.fillText(layout.pageNumber,870,1357);
 return canvas;
}
function drawPaper(ctx:CanvasRenderingContext2D,layout:NotebookLayout){
 ctx.fillStyle='#f3ecd9';ctx.fillRect(0,0,PAGE_WIDTH,PAGE_HEIGHT);
 // Fixed, low-contrast fibres avoid shimmer between repaints.
 let seed=17;for(let i=0;i<18000;i++){seed=(seed*1664525+1013904223)>>>0;const x=seed%1000;seed=(seed*1664525+1013904223)>>>0;ctx.fillStyle=i%2?'#8f826708':'#ffffff18';ctx.fillRect(x,seed%1420,1.5,1.5);}
 ctx.strokeStyle='#7095a32b';ctx.lineWidth=1.2;for(let y=225;y<1340;y+=55){ctx.beginPath();ctx.moveTo(56,y);ctx.lineTo(952,y);ctx.stroke();}
 ctx.strokeStyle='#ba7a713d';ctx.lineWidth=1.5;ctx.beginPath();ctx.moveTo(93,76);ctx.lineTo(93,1348);ctx.stroke();
 const fold=ctx.createLinearGradient(layout.side==='left'?1000:0,0,layout.side==='left'?940:60,0);fold.addColorStop(0,'#6c583722');fold.addColorStop(1,'#6c583700');ctx.fillStyle=fold;ctx.fillRect(0,0,1000,1420);
}
