export const LABELS=[
 {id:'formula-sae',tabOrder:0,label:'UNB Formula Racing',direction:-1,vertical:-1,anchor:[0,1,.5]},
 {id:'about',tabOrder:1,label:'About',direction:1,vertical:-1,anchor:[1,1,0]},
 {id:'hack-atlantic',tabOrder:5,label:'Hack Atlantic',direction:1,vertical:-1,anchor:[1,.8,1]},
 {id:'resume',tabOrder:3,label:'Résumé',direction:1,vertical:-1,anchor:[1,1,.5]},
 {id:'ultra-maritime',tabOrder:2,label:'Software Engineer Intern - Ultra Maritime',direction:1,vertical:1,anchor:[1,1,1],offset:[-60,0]},
 {id:'contact',tabOrder:4,label:'Contact',direction:1,vertical:1,anchor:[1,0,1],offset:[24,-48]},
] as const;
export type Rect={left:number;top:number;width:number;height:number};
export function intersects(a:Rect,b:Rect,pad=6){return a.left<b.left+b.width+pad&&a.left+a.width+pad>b.left&&a.top<b.top+b.height+pad&&a.top+a.height+pad>b.top;}
export function placeLabel(anchor:{x:number;y:number},size:{width:number;height:number},viewport:{width:number;height:number},obstacles:Rect[],direction:number,vertical:number,offset:readonly number[]=[0,0]){
 const candidates=[];for(const sy of [vertical,-vertical])for(const sx of [direction,-direction])for(const length of [42,56,70,84,98,126,154,182,210,238])for(const centered of [false,true]){const d=length/Math.SQRT2,x=anchor.x+sx*d+offset[0],y=anchor.y+sy*d+offset[1];const rect={left:centered?x-size.width/2:sx>0?x:x-size.width,top:sy>0?y:y-size.height,...size};const outside=rect.left<16||rect.top<70||rect.left+rect.width>viewport.width-16||rect.top+rect.height>viewport.height-16;const score=(outside?10000:0)+obstacles.filter(o=>intersects(rect,o)).length*100+Math.abs(length-56)*.15+(sx===direction?0:5)+(sy===vertical?0:8)+(centered?12:0);candidates.push({rect,x,y,score});}return candidates.sort((a,b)=>a.score-b.score)[0];
}
export function labelContent(id:string,label:string){return id==='ultra-maritime'?'<span>Software Engineer Intern</span><span class="label-company"><span class="label-dash"> - </span>Ultra Maritime</span>':label;}
export function labelMarkup(){return [...LABELS].sort((a,b)=>a.tabOrder-b.tabOrder).map(({id,label})=>`<div class="callout" data-id="${id}"><svg aria-hidden="true"><path/><circle r="3"/></svg><button type="button" data-open="${id}" aria-label="${label}">${labelContent(id,label)}${id==='hack-atlantic'?'<span class="scroll-cue" aria-hidden="true"> ↕</span>':''}</button></div>`).join('');}
export function updateLabels(nodes:HTMLElement[],anchor:(id:string)=>{x:number;y:number;visible:boolean}|null|undefined,obstacles:Rect[]=[]){
 const placed=[...obstacles];for(const node of [...nodes].sort((a,b)=>LABELS.findIndex(l=>l.id===a.dataset.id)-LABELS.findIndex(l=>l.id===b.dataset.id))){const config=LABELS.find(l=>l.id===node.dataset.id)!;const p=anchor(config.id);node.classList.toggle('ready',!!p?.visible);if(!p?.visible)continue;const button=node.querySelector('button')!,box=button.getBoundingClientRect();const layout=placeLabel(p,{width:box.width,height:box.height},{width:innerWidth,height:innerHeight},placed,config.direction,config.vertical,'offset' in config?config.offset:undefined);placed.push(layout.rect);node.style.transform=`translate(${p.x}px,${p.y}px)`;button.style.left=layout.rect.left-p.x+'px';button.style.top=layout.rect.top-p.y+'px';const svg=node.querySelector('svg')!;svg.querySelector('path')!.setAttribute('d',`M0 0 L${layout.x-p.x} ${layout.y-p.y}`);node.dataset.collision=String(layout.score>=100);}
}
