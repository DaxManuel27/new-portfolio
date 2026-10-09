/** Accumulate a deliberate upward gesture, without exiting on scroll-to-top momentum. */
export class ScrollBackGesture {
 private last=-Infinity;private amount=0;private blocked=false;
 reset(){this.last=-Infinity;this.amount=0;this.blocked=false;}
 update(deltaY:number,time:number,atTop:boolean){
  if(time-this.last>200){this.amount=0;this.blocked=false;}
  this.last=time;
  if(!atTop){this.blocked=true;this.amount=0;return false;}
  if(deltaY>=0){this.amount=0;return false;}
  if(this.blocked)return false;
  this.amount-=deltaY;
  if(this.amount<70)return false;
  this.reset();return true;
 }
}
/** One navigation per gesture, shared across entry, camera travel, and return. */
export class ScrollNavigationGesture {
 private gesture=new ScrollBackGesture();private last=-Infinity;private locked=false;private target='';
 setTarget(target:string){if(target!==this.target){this.target=target;this.gesture.reset();}}
 reset(time:number){this.gesture.reset();this.locked=true;this.last=time;this.target='';}
 update(delta:number,time:number,target:string,busy:boolean,atTop=true){
  const fresh=time-this.last>280;this.last=time;this.setTarget(target);
  if(busy){this.locked=true;this.gesture.reset();return false;}
  if(fresh){this.locked=false;this.gesture.reset();}
  if(this.locked||!target)return false;
  if(this.gesture.update(delta,time,atTop)){this.locked=true;return true;}
  return false;
 }
}
type DeskScrollOptions={target:(event:MouseEvent)=>string;busy:()=>boolean;open:(id:string)=>void};
export function installScrollBack(dialog:HTMLDialogElement,content:HTMLElement,onBack:()=>void,desk?:DeskScrollOptions){
 const gesture=new ScrollNavigationGesture();
 const reset=()=>gesture.reset(performance.now());
 window.addEventListener('pointermove',event=>{if(!dialog.open)gesture.setTarget(event.pointerType==='touch'?'':desk?.target(event)??'');});
 document.addEventListener('pointerleave',()=>{if(!dialog.open)gesture.setTarget('');});
 window.addEventListener('blur',reset);
 window.addEventListener('wheel',event=>{
  const now=performance.now();
  if(event.ctrlKey||event.metaKey||Math.abs(event.deltaX)>Math.abs(event.deltaY)){reset();return;}
  const target=dialog.open?'back':desk?.target(event)??'';
  // Preserve reading position, including nested scrollable content.
  let atTop=dialog.scrollTop<=1&&content.scrollTop<=1;
  if(dialog.open)for(let element=event.target instanceof Element?event.target:null;element&&element!==document.body;element=element.parentElement){
   if(element.scrollTop>1&&/(auto|scroll)/.test(getComputedStyle(element).overflowY))atTop=false;
  }
  const delta=event.deltaY*(event.deltaMode===1?16:event.deltaMode===2?window.innerHeight:1);
  const triggered=gesture.update(delta,now,target,desk?.busy()??false,atTop);
  if(triggered){event.preventDefault();if(dialog.open)onBack();else desk?.open(target);}
 },{passive:false,capture:true});
 return {reset};
}
