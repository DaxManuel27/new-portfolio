import {ease,type JourneyState} from './journey';
import content from './ultra-maritime.json';
export function createUltraContent(){
 const root=document.createElement('section');root.className='ultra-copy ultra-screen-copy';
 const emphasis=(text:string)=>text.replace(/over 50%|35\+ functions/g,match=>`<strong>${match}</strong>`);
 root.innerHTML=`<header class="um-header"><h2><span>ULTRA</span><span>MARITIME</span></h2><p class="um-role">${content.role}</p></header><div class="um-resume"><p class="um-meta">${content.dates} · ${content.location}</p><ul>${content.contributions.map(text=>`<li><span class="um-bullet" aria-hidden="true">•</span><span>${emphasis(text)}</span></li>`).join('')}</ul></div>`;
 return root;
}
/** Resolution never changes the display aspect ratio. Upgrade tiers only while a scene is alive. */
export function ultraTextureSize(projectedWidth:number,dpr:number,aspect:number,maxSize=4096){
 const needed=Math.max(1,projectedWidth)*Math.max(1,dpr);
 const width=Math.min(maxSize,needed>2048?4096:2048);
 return {width,height:Math.round(width/aspect)};
}

export function ultraScroll(state:Pick<JourneyState,'phase'|'local'>){
 if(state.phase.station<2)return 0;
 if(state.phase.station>2)return 1;
 if(state.phase.kind==='ultra-story')return ease((state.local-.1)/.65);
 return ['pan','monitor-hold'].includes(state.phase.kind)?1:0;
}

/** Fit the role to MARITI, stopping before the final M and E. */
export function fitUltraRole(root:HTMLElement){
 const title=root.querySelector('.um-header h2 span:last-child')!,role=root.querySelector<HTMLElement>('.um-role')!;
 const titleRange=document.createRange();titleRange.setStart(title.firstChild!,0);titleRange.setEnd(title.firstChild!,6);
 const target=titleRange.getBoundingClientRect().width;
 role.style.whiteSpace='nowrap';
 for(let i=0;i<3;i++){
  const range=document.createRange();range.selectNodeContents(role);
  const width=range.getBoundingClientRect().width;
  if(width>0)role.style.fontSize=`${parseFloat(getComputedStyle(role).fontSize)*target/width}px`;
 }
}
