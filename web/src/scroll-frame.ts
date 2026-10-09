import * as T from 'three';
import {HACK_ATLANTIC} from './hack-atlantic';
import {wrapText} from './laptop-screen';
export const FRAME={x:.88,y:1.15,z:-1.42,width:.6,height:.75,fabricHeight:.64,radius:.022,viewFraction:(.64/.526)*(2048/4096)};
export class FabricScroll{
 value=0;target=0;
 set(value:number){this.target=T.MathUtils.clamp(value,0,1);}
 scroll(pixels:number){this.set(this.target+pixels/1800);}
 update(dt:number,reduced:boolean){this.value=reduced?this.target:T.MathUtils.lerp(this.value,this.target,1-Math.exp(-12*Math.min(dt,.1)));if(Math.abs(this.target-this.value)<.0001)this.value=this.target;return this.value;}
 get distance(){return this.value*FRAME.fabricHeight*(1/FRAME.viewFraction-1);}
 get angle(){return -this.distance/FRAME.radius;}
}
export async function createScrollFrame(maxAnisotropy=1){
 await Promise.all([document.fonts.load('800 100px "HA League Spartan"'),document.fonts.load('24px "IBM Plex Mono"')]);
 const root=new T.Group();root.name='Root_scroll_frame';root.position.set(FRAME.x,FRAME.y,FRAME.z);
 const wood=new T.MeshStandardMaterial({color:'#c29c68',roughness:.72}),metal=new T.MeshStandardMaterial({color:'#8d8779',metalness:.8,roughness:.35});
 const cloth=new T.MeshStandardMaterial({color:'#d6c5a3',roughness:.98});
 function add(name:string,g:T.BufferGeometry,m:T.Material,x:number,y:number,z:number,parent:T.Object3D=root){const mesh=new T.Mesh(g,m);mesh.name=name;mesh.position.set(x,y,z);mesh.castShadow=true;mesh.receiveShadow=true;parent.add(mesh);return mesh;}
 for(const x of [-.285,.285]){
  // Split stile geometry leaves real adjustment slots around each roller joint.
  for(const [cy,height]of [[0,.49],[-.368,.034],[.368,.034]])add('Frame_stile',new T.BoxGeometry(.038,height,.032),wood,x,cy,0);
  for(const y of [-.3,.3])for(const dx of [-.014,.014])add('Frame_slot_rail',new T.BoxGeometry(.01,.116,.032),wood,x+dx,y,0);
 }
 const rollers:T.Group[]=[];
 for(const y of [-.32,.32]){const roll=new T.Group();roll.position.set(0,y,.016);root.add(roll);rollers.push(roll);
  const dowel=add('Roller_dowel',new T.CylinderGeometry(FRAME.radius,FRAME.radius,.66,32),wood,0,0,0,roll);dowel.rotation.z=Math.PI/2;
  const wrap=add('Linen_wraps',new T.CylinderGeometry(.025,.025,.524,32),cloth,0,0,0,roll);wrap.rotation.z=Math.PI/2;
  for(const x of [-.333,.333]){const cap=add('Roller_end_cap',new T.CylinderGeometry(.028,.028,.012,24),wood,x,0,0,roll);cap.rotation.z=Math.PI/2;}
  add('Fabric_attachment_groove',new T.BoxGeometry(.525,.002,.002),wood,0,0,.026,roll);
  for(const x of [-.285,.285]){const bolt=add('Joint_bolt',new T.CylinderGeometry(.005,.005,.055,12),metal,x,y,.025);bolt.rotation.x=Math.PI/2;for(const dx of [-.009,.009]){const wing=add('Wing_nut',new T.SphereGeometry(.009,8,6),metal,x+dx,y,.056);wing.scale.set(1,.55,.32);}}
 }
 for(const x of [-.23,.23]){const line=new T.CatmullRomCurve3([new T.Vector3(x,.33,-.02),new T.Vector3(0,.465,-.045)]);add('Picture_wire',new T.TubeGeometry(line,1,.001,4,false),metal,0,0,0);}
 const nail=add('Wall_nail',new T.CylinderGeometry(.007,.007,.028,12),metal,0,.465,-.04);nail.rotation.x=Math.PI/2;
 const brass=new T.MeshStandardMaterial({color:'#b48a53',metalness:.8,roughness:.34});
 add('Picture_light_mount',new T.BoxGeometry(.095,.025,.024),brass,0,.43,-.01);
 add('Picture_light_arm',new T.BoxGeometry(.012,.012,.11),brass,0,.43,.055);
 const hood=add('Picture_light_brass_shade',new T.CylinderGeometry(.018,.018,.32,20),brass,0,.415,.11);hood.rotation.z=Math.PI/2;
 add('Picture_light_diffuser',new T.BoxGeometry(.28,.006,.017),new T.MeshStandardMaterial({color:'#ffdfb4',emissive:'#ffd5a3',emissiveIntensity:1.2}),0,.397,.11);
 const picture=new T.SpotLight('#ffe4bf',.2,1.6,.62,.85,2);picture.name='Picture_light_warm';picture.position.set(0,.39,.13);picture.castShadow=false;picture.target.position.set(0,-.1,.038);root.add(picture,picture.target);
 const canvas=await paintHackAtlantic();
 const map=new T.CanvasTexture(canvas);map.colorSpace=T.SRGBColorSpace;map.generateMipmaps=true;map.minFilter=T.LinearMipmapLinearFilter;map.anisotropy=maxAnisotropy;map.repeat.y=FRAME.viewFraction;map.offset.y=1-FRAME.viewFraction;
 const normal=await new T.TextureLoader().loadAsync(import.meta.env.BASE_URL+'assets/room/linen-normal.png');normal.wrapS=normal.wrapT=T.RepeatWrapping;normal.repeat.set(18,22);
 const fabric=add('HackAtlantic_Linen',new T.PlaneGeometry(.526,FRAME.fabricHeight,12,16),new T.MeshStandardMaterial({map,normalMap:normal,normalScale:new T.Vector2(.09,.09),roughness:.98,side:T.DoubleSide,emissive:'#ffffff',emissiveMap:map,emissiveIntensity:.18}),0,0,.038);
 const state=new FabricScroll();return {root,fabric,state,update(dt:number,reduced:boolean){state.update(dt,reduced);map.offset.y=(1-FRAME.viewFraction)*(1-state.value);for(const roll of rollers)roll.rotation.x=state.angle;},diagnostics(){return {value:state.value,target:state.target,offset:map.offset.y,angle:rollers[0].rotation.x};}};
}
/** Content/design recovered from 6aacadb, not the live event website. */
export async function paintHackAtlantic(){
 const canvas=document.createElement('canvas');canvas.width=2048;canvas.height=4096;
 const c=canvas.getContext('2d')!;c.fillStyle='#c3e8dc';c.fillRect(0,0,2048,4096);
 const hero=new Image();hero.src=import.meta.env.BASE_URL+'assets/hack-atlantic-hero.png';await hero.decode();
 const heroHeight=2048*hero.height/hero.width;c.drawImage(hero,0,0,2048,heroHeight);
 const shore=c.createLinearGradient(0,heroHeight,0,heroHeight+150);shore.addColorStop(0,'#f4c59a');shore.addColorStop(1,'#c3e8dc');c.fillStyle=shore;c.fillRect(0,heroHeight,2048,150);
 c.fillStyle='#1f3a44';c.textAlign='center';c.font='800 96px "HA League Spartan"';c.fillText('By the numbers',1024,1510);
 HACK_ATLANTIC.stats.forEach(([number,label],i)=>{const x=360+(i%3)*664,y=1650+Math.floor(i/3)*310;c.strokeStyle='#1f3a4433';c.beginPath();c.moveTo(x-270,y);c.lineTo(x+270,y);c.stroke();c.font='800 130px "HA League Spartan"';c.fillText(number,x,y+150);c.font='600 44px -apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif';c.fillText(label,x,y+220);});
 c.textAlign='left';c.font='800 96px "HA League Spartan"';c.fillText('The Why',150,2490);
 c.font='44px -apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif';let y=2610;for(const text of HACK_ATLANTIC.why)y=wrapText(c,text,150,y,1748,72)+48;
 return canvas;
}
export function createRecapContent(){
 const section=document.createElement('section');section.className='scroll-transcript';
 const hero=document.createElement('img');hero.src=import.meta.env.BASE_URL+'assets/hack-atlantic-hero.png';hero.alt='Hack Atlantic — Atlantic Canada’s largest student-run hackathon. Sunset over the Atlantic coastline.';
 const title=document.createElement('h2');title.textContent=HACK_ATLANTIC.title;section.append(title,hero);
 const numbers=document.createElement('h3');numbers.textContent='By the numbers';const dl=document.createElement('dl');dl.className='restored-stats';for(const[number,label]of HACK_ATLANTIC.stats){const group=document.createElement('div'),dt=document.createElement('dt'),dd=document.createElement('dd');dt.textContent=label;dd.textContent=number;group.append(dt,dd);dl.append(group);}section.append(numbers,dl);
 const why=document.createElement('h3');why.textContent='The Why';section.append(why);for(const text of HACK_ATLANTIC.why){const p=document.createElement('p');p.textContent=text;section.append(p);}return section;
}
