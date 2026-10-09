import * as T from 'three';
export const ABOUT_ROLES=[
 'Software Engineering @ UNB',
 'Founder @ Hack Atlantic',
 'Software Project Lead @ UNB Formula Racing',
 "Varsity Athlete @ UNB Men's Soccer",
 'Prev. Swe @ Ultra Maritime',
];
export const ABOUT_INTRO="I'm Dax, a third year software engineering student seeking 2027 internships and opportunities to build!";
export const ABOUT_PHOTOS=['Dax in conversation','Toronto skyline at night','Mountain town selfie','Coding beside the ocean','Toronto rooftop','City skyline at night','Working together on laptops'];
const BG='#17241c',W=1536,H=1014,TILE=286,GAP=24,STRIDE=TILE+GAP,COUNT=8;
export const galleryOffset=(offset:number)=>((offset%(STRIDE*COUNT))+STRIDE*COUNT)%(STRIDE*COUNT);
/** Static profile and a clipped moving gallery, all painted onto the physical screen. */
export async function createLaptopScreen(){
 const base=import.meta.env.BASE_URL+'assets/about/';
 const load=async(name:string)=>{const img=new Image();img.src=base+name;await img.decode();return img;};
 const photos=await Promise.all(['profile.webp',...Array.from({length:6},(_,i)=>`photo-${i+1}.webp`)].map(load));
 const video=document.createElement('video');video.src=base+'gallery-video.mp4';video.muted=true;video.loop=true;video.playsInline=true;video.preload='auto';video.load();
 const canvas=document.createElement('canvas');canvas.width=W;canvas.height=H;
 const c=canvas.getContext('2d')!,texture=new T.CanvasTexture(canvas);texture.flipY=false;texture.colorSpace=T.SRGBColorSpace;
 texture.generateMipmaps=false;texture.minFilter=T.LinearFilter;
 const still=document.createElement('canvas');still.width=W;still.height=H;const s=still.getContext('2d')!;
 let subtitleLines:string[]=[];
 function lines(text:string){const result:string[]=[];let line='';for(const word of text.split(/\s+/)){const next=line?line+' '+word:word;if(s.measureText(next).width>W-200&&line){result.push(line);line=word;}else line=next;}if(line)result.push(line);return result;}
 function paintProfile(){
 s.fillStyle=BG;s.fillRect(0,0,W,H);
 s.textAlign='center';s.fillStyle='#f0e8d9';s.font='600 148px Georgia,serif';s.fillText('About',W/2,224);
 // Use the largest font that meets each requested line count.
 let roleSize=48;
 do{s.font=`${roleSize}px system-ui,sans-serif`;subtitleLines=lines(ABOUT_ROLES.join(', '));if(subtitleLines.length<=2)break;roleSize--;}while(roleSize>12);
 s.fillStyle='#d7dece';subtitleLines.forEach((line,i)=>s.fillText(line,W/2,326+i*48));
 let introSize=32;
 do{s.font=`${introSize}px system-ui,sans-serif`;if(s.measureText(ABOUT_INTRO).width<=W-200)break;introSize--;}while(introSize>12);
 s.fillStyle='#c3cdbb';s.fillText(ABOUT_INTRO,W/2,510);
 }
 paintProfile();
 let offset=0,last=0,painted=0,paused=false,dirty=true,playing=false,blocked=false;
 const reduced=matchMedia('(prefers-reduced-motion: reduce)');
 function cover(source:CanvasImageSource,sw:number,sh:number,x:number,y:number,focus=.5){const side=Math.min(sw,sh);c.drawImage(source,(sw-side)/2,(sh-side)*focus,side,side,x,y,TILE,TILE);}
 function draw(){c.drawImage(still,0,0);c.save();c.beginPath();c.rect(100,674,W-200,TILE);c.clip();
  for(let n=-1;n<7;n++){const position=Math.floor(offset/STRIDE)+n,index=((position%COUNT)+COUNT)%COUNT,x=100+position*STRIDE-offset;
   if(x+TILE<100||x>W-100)continue;
   if(index===7&&video.readyState>=2)cover(video,video.videoWidth,video.videoHeight,x,674);
   else {const i=index===7?3:index,img=photos[i];cover(img,img.naturalWidth,img.naturalHeight,x,674,[.5,.65,.6,.5,.8,.82,.82][i]);}
   c.strokeStyle='#b8c4af';c.lineWidth=2;c.strokeRect(x+1,675,TILE-2,TILE-2);
  }c.restore();texture.needsUpdate=true;dirty=false;
 }
 draw();video.addEventListener('loadeddata',()=>{dirty=true;});
 return {texture,
  update(t:number,visible:boolean){const moving=visible&&!document.hidden&&!paused&&!reduced.matches;
   if(moving&&!playing&&!blocked){playing=true;void video.play().catch(()=>{playing=false;blocked=true;});}
   if(!moving&&playing){video.pause();playing=false;}
   if(moving&&last)offset=galleryOffset(offset+Math.min(t-last,100)*.045);last=moving?t:0;
   if(dirty||(moving&&t-painted>=1000/30)){draw();painted=t;}
  },
  toggle(){paused=!paused;blocked=false;return paused;},
  step(direction:number){paused=true;offset=galleryOffset(offset+direction*STRIDE);dirty=true;return paused;},
  diagnostics(){return {subtitleLines,offset,paused,reduced:reduced.matches,videoReady:video.readyState,videoPlaying:!video.paused,items:COUNT};}
 };
}
export function wrapText(ctx:CanvasRenderingContext2D,text:string,x:number,y:number,width:number,lineHeight:number){let line='';for(const word of text.split(/\s+/)){const next=line?line+' '+word:word;if(ctx.measureText(next).width>width&&line){ctx.fillText(line,x,y);y+=lineHeight;line=word;}else line=next;}ctx.fillText(line,x,y);return y+lineHeight;}
