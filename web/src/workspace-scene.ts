import * as T from 'three';
import {notebookShowcasePose,NOTEBOOK_OPEN_ANGLE} from './notebook-framing';
import {printerResumePose} from './printer-key';
import {contactLinks} from './contact-book';
import {loadNotebookFont,paintNotebookPage} from './notebook-display';
import {createProjectsDisplay} from './projects-display';
import {immersiveDestinations,surfacePose} from './surface-focus';
import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js';
import {KTX2Loader} from 'three/addons/loaders/KTX2Loader.js';
import {HDRLoader} from 'three/addons/loaders/HDRLoader.js';
import {MeshoptDecoder} from 'three/addons/libs/meshopt_decoder.module.js';
import {EffectComposer} from 'three/addons/postprocessing/EffectComposer.js';
import {RenderPass} from 'three/addons/postprocessing/RenderPass.js';
import {OutlinePass} from 'three/addons/postprocessing/OutlinePass.js';
import {OutputPass} from 'three/addons/postprocessing/OutputPass.js';
const base=import.meta.env.BASE_URL+'assets/scene-realism/';
export const rootNames:Record<string,string>={'ultra-maritime':'Root_notebook','formula-sae':'Root_car','hack-atlantic':'Root_macbook',resume:'Root_resume',contact:'Root_phonebook','fsae-data-logging':'Root_pi',projects:'Root_monitor'};
export class WorkspaceScene{
 renderer:T.WebGLRenderer;scene=new T.Scene();camera=new T.PerspectiveCamera(33,1,.03,50);composer:EffectComposer;outline:OutlinePass;model?:T.Group;ready=false;
 private target=new T.Vector3(0,.83,0);private home=new T.Vector3(.22,1.8,2.4);private homeTarget=new T.Vector3(0,.83,0);private homeFov=33;
 private movement?:{start:number;from:T.Vector3;to:T.Vector3;lookFrom:T.Vector3;lookTo:T.Vector3;rotationFrom:T.Quaternion;rotationTo:T.Quaternion;duration:number;notebook?:{control:T.Vector3;lookControl:T.Vector3;hingeFrom:number;hingeTo:number};arrived?:()=>void};
 private ray=new T.Raycaster();private pointer=new T.Vector2();private roots=new Map<string,T.Object3D>();private selected='hack-atlantic';private reduced=matchMedia('(prefers-reduced-motion: reduce)');private ktx:KTX2Loader;
 private projectsDisplayMobile?:boolean;private projectsTexture?:T.Texture;
 private focusedSurface=false;private surfaces=new Map<string,T.Mesh>();
 notebookReady=false;notebookPage=0;private notebookLayoutKey='';private notebookTextures:T.Texture[]=[];
 private notebookHinge?:T.Object3D;private bookMotion?:{start:number;from:number;to:number;arrived?:()=>void};
 private notebookSequence?:{open:boolean;arrived?:()=>void};private sequenceId=0;
 private printerKey?:T.Object3D;private printerCap?:T.Object3D;private printerCapRest=0;private keyHovered=false;private keyFocused=false;private keyPressUntil=0;
 private title?:T.Mesh<T.PlaneGeometry,T.MeshBasicMaterial>;
 private visible=true;private frames:number[]=[];private prev=0;private active='';
 constructor(public canvas:HTMLCanvasElement,private onPick:(id:string)=>void,private onFrame:()=>void){
  this.renderer=new T.WebGLRenderer({canvas,antialias:true,powerPreference:'high-performance'});this.renderer.setPixelRatio(Math.min(devicePixelRatio,2));this.renderer.outputColorSpace=T.SRGBColorSpace;this.renderer.toneMapping=T.ACESFilmicToneMapping;this.renderer.toneMappingExposure=1;
  this.scene.add(this.camera);this.scene.background=new T.Color('#24211e');this.scene.add(new T.HemisphereLight(0xdfdfdd,0x695034,.22));
  for(const [position,color,intensity]of [[[ -2,3.5,1],0xffdfb4,1.5],[[2,2.4,.3],0xc3d8ff,.35],[[0,2.8,-2],0xffefd7,.7]]as const){const light=new T.DirectionalLight(color,intensity);light.position.set(position[0],position[1],position[2]);this.scene.add(light);}
  this.renderer.info.autoReset=false;const renderTarget=new T.WebGLRenderTarget(innerWidth,innerHeight,{samples:4,type:T.HalfFloatType});this.composer=new EffectComposer(this.renderer,renderTarget);this.composer.addPass(new RenderPass(this.scene,this.camera));this.outline=new OutlinePass(new T.Vector2(innerWidth,innerHeight),this.scene,this.camera);this.outline.visibleEdgeColor.set('#f3d9a8');this.outline.hiddenEdgeColor.set('#614f35');this.outline.edgeStrength=2.5;this.outline.edgeGlow=.45;this.outline.edgeThickness=1.1;this.outline.pulsePeriod=0;this.composer.addPass(this.outline);this.composer.addPass(new OutputPass());
  this.ktx=new KTX2Loader().setTranscoderPath(import.meta.env.BASE_URL+'assets/basis/').detectSupport(this.renderer);
  this.resize();addEventListener('resize',()=>this.resize());document.addEventListener('visibilitychange',()=>{this.visible=!document.hidden;this.prev=0;});
  canvas.addEventListener('pointermove',e=>{if(e.pointerType==='touch')return;const id=this.hit(e);canvas.style.cursor=id?'pointer':'default';this.highlight(id||this.active||'hack-atlantic');});canvas.addEventListener('pointerleave',()=>this.highlight(this.active||'hack-atlantic'));
  let down:{x:number;y:number}|undefined;canvas.addEventListener('pointerdown',e=>{down={x:e.clientX,y:e.clientY};});canvas.addEventListener('pointerup',e=>{if(down&&Math.hypot(e.clientX-down.x,e.clientY-down.y)<8){const id=this.hit(e);if(id)this.onPick(id);}down=undefined;});
 }
 async load(progress:(n:number)=>void){
  const loader=new GLTFLoader().setMeshoptDecoder(MeshoptDecoder).setKTX2Loader(this.ktx);
  const [gltf,manifest,hdr]=await Promise.all([loader.loadAsync(base+'desk.glb',e=>progress(e.total?e.loaded/e.total:0)),fetch(base+'manifest.json').then(r=>{if(!r.ok)throw Error('Scene manifest unavailable');return r.json();}),new HDRLoader().loadAsync(import.meta.env.BASE_URL+'assets/studio-small-09.hdr')]);
  const pmrem=new T.PMREMGenerator(this.renderer);this.scene.environment=pmrem.fromEquirectangular(hdr).texture;this.scene.environmentIntensity=.35;hdr.dispose();pmrem.dispose();
  this.model=gltf.scene;this.scene.add(this.model);this.printerKey=this.model.getObjectByName('Root_printer_download');this.printerCap=this.model.getObjectByName('Root_printer_download_cap');this.printerCapRest=this.printerCap?.position.y??0;if(this.printerKey)this.printerKey.visible=false;const loads:Promise<unknown>[]=[];const tl=new T.TextureLoader();
  this.model.traverse(o=>{if(!(o instanceof T.Mesh))return;let p:T.Object3D|null=o;while(p&&!o.userData.lightmap){if(p.userData.lightmap)o.userData.lightmap=p.userData.lightmap;p=p.parent;}
   const materials=Array.isArray(o.material)?o.material:[o.material];for(const m of materials){if(!(m instanceof T.MeshStandardMaterial))continue;
    if(m.name.startsWith('MAT_Figma_monitor')||m.name.startsWith('MAT_Figma_laptop')){this.surfaces.set(m.name.startsWith('MAT_Figma_laptop')?'hack-atlantic':'projects',o);const replacement=new T.MeshBasicMaterial({map:m.map,toneMapped:false});o.material=replacement;continue;}
    if(m.name.startsWith('MAT_Contact_Pages'))this.surfaces.set('contact',o);
    if(m.name.startsWith('MAT_Resume_PDF'))this.surfaces.set('resume',o);
    if(m.name.startsWith('MAT_UM_InsideCover'))this.surfaces.set('notebook-left',o);
    if(m.name.startsWith('MAT_UM_Contributions'))this.surfaces.set('ultra-maritime',o);
    if(o.userData.lightmap){loads.push(tl.loadAsync(base+o.userData.lightmap.replace('.png','.webp')).then(lm=>{lm.channel=1;lm.flipY=false;lm.colorSpace=T.SRGBColorSpace;m.lightMap=lm;m.lightMapIntensity=1;m.onBeforeCompile=shader=>{shader.fragmentShader=shader.fragmentShader.replace('#include <opaque_fragment>','outgoingLight = reflectedLight.indirectDiffuse + reflectedLight.directSpecular + reflectedLight.indirectSpecular;\n#include <opaque_fragment>');};m.needsUpdate=true;}));}
    if(m.map)m.map.anisotropy=Math.min(8,this.renderer.capabilities.getMaxAnisotropy());
   }
  });await Promise.all(loads);
  await this.syncProjectsDisplay();
  this.notebookHinge=this.model.getObjectByName('UM_Notebook_CoverHinge');
  try{await loadNotebookFont();this.syncNotebookDisplay();this.notebookReady=true;}catch(error){console.warn('Using readable notebook fallback',error);}
  for(const[id,name]of Object.entries(rootNames)){const root=this.model.getObjectByName(name);if(root)this.roots.set(id,root);}
  const c=manifest.cameras.Camera_Overview;this.home.fromArray(c.position);this.homeTarget.fromArray(c.target);this.homeFov=c.fov;this.resize();await document.fonts.load('300 100px "Cormorant Garamond"');this.syncTitle();this.highlight('hack-atlantic');this.ready=true;
  await this.renderer.compileAsync(this.scene,this.camera);this.renderer.setAnimationLoop(t=>{if(!this.visible)return;if(this.prev&&this.frames.length<360)this.frames.push(t-this.prev);this.prev=t;this.update(t);this.renderer.info.reset();this.composer.render();this.onFrame();});progress(1);
 }
 resize(){const w=this.canvas.clientWidth||innerWidth,h=this.canvas.clientHeight||innerHeight;this.renderer.setSize(w,h,false);this.composer.setSize(w,h);this.camera.aspect=w/h;this.camera.fov=T.MathUtils.radToDeg(2*Math.atan(Math.tan(T.MathUtils.degToRad(this.homeFov/2))*Math.max(1,1.44/this.camera.aspect)));if(w<760)this.camera.fov=Math.min(72,this.camera.fov);this.camera.updateProjectionMatrix();if(this.notebookSequence){const sequence=this.notebookSequence;this.animateNotebook(sequence.open,sequence.arrived);}else if(!this.active){this.movement=undefined;this.camera.position.copy(this.home);this.target.copy(this.homeTarget);if(w<760){this.camera.position.z+=.6;this.camera.position.y+=.15;this.target.y=1.02;}this.camera.lookAt(this.target);}else if(this.focusedSurface){this.focusSurface(this.active,this.movement?.arrived,true);}if(this.title)this.syncTitle();if(this.ready){void this.syncProjectsDisplay();if(this.notebookReady)this.syncNotebookDisplay();}this.onFrame();}
 private syncNotebookDisplay(){
  const mobile=this.canvas.clientWidth<760,key=`${mobile}:${mobile?this.notebookPage:0}`;
  if(this.notebookLayoutKey===key)return;
  const left=this.surfaces.get('notebook-left'),right=this.surfaces.get('ultra-maritime');if(!left||!right)throw Error('Missing notebook page');
  const textures=['left','right'].map(side=>{const map=new T.CanvasTexture(paintNotebookPage(side as 'left'|'right',mobile,this.notebookPage,this.renderer.capabilities.maxTextureSize));map.flipY=false;map.colorSpace=T.SRGBColorSpace;map.anisotropy=Math.min(8,this.renderer.capabilities.getMaxAnisotropy());return map;});
  [left,right].forEach((surface,i)=>{const material=surface.material as T.MeshStandardMaterial;material.map=textures[i];material.color.set('#ffffff');material.roughness=.95;material.metalness=0;material.emissive.set('#000000');material.emissiveMap=null;material.needsUpdate=true;});
  this.notebookTextures.forEach(t=>t.dispose());this.notebookTextures=textures;this.notebookLayoutKey=key;
 }
 setNotebookPage(page:number){this.notebookPage=Math.max(0,Math.min(2,page));if(this.notebookReady)this.syncNotebookDisplay();if(this.active==='ultra-maritime')this.focusSurface(this.active);}
 private async syncProjectsDisplay(){
  const surface=this.surfaces.get('projects'),mobile=this.canvas.clientWidth<760;
  if(!surface||this.projectsDisplayMobile===mobile)return;
  this.projectsDisplayMobile=mobile;
  try{const texture=await createProjectsDisplay(this.renderer.capabilities.maxTextureSize,mobile);if(!texture)return;
   if(this.projectsDisplayMobile!==mobile){texture.dispose();return;}
   texture.anisotropy=Math.min(8,this.renderer.capabilities.getMaxAnisotropy());
   const material=surface.material as T.MeshBasicMaterial;material.map=texture;material.needsUpdate=true;
   this.projectsTexture?.dispose();this.projectsTexture=texture;
  }catch(error){console.warn('Using baked Projects display',error);}
 }
 // Render the heading inside the scene so foreground geometry naturally occludes it.
 private syncTitle(){
  const heading=document.querySelector<HTMLElement>('.desk-headline');if(!heading||heading.hidden)return;
  const rect=heading.getBoundingClientRect(),viewport=this.canvas.getBoundingClientRect(),style=getComputedStyle(heading);
  const surface=document.createElement('canvas'),ratio=Math.min(devicePixelRatio,2);
  surface.width=Math.ceil(rect.width*ratio);surface.height=Math.ceil(rect.height*ratio);
  const ctx=surface.getContext('2d')!;ctx.scale(ratio,ratio);ctx.font=`${style.fontWeight} ${style.fontSize} ${style.fontFamily}`;ctx.fillStyle=style.color;ctx.letterSpacing=style.letterSpacing;
  const metrics=ctx.measureText('Dax Manuel'),lineHeight=parseFloat(style.lineHeight);
  const baseline=(lineHeight-metrics.fontBoundingBoxAscent-metrics.fontBoundingBoxDescent)/2+metrics.fontBoundingBoxAscent;
  for(const [i,line]of ['Dax','Manuel'].entries())ctx.fillText(line,0,baseline+i*lineHeight);
  const texture=new T.CanvasTexture(surface);texture.colorSpace=T.SRGBColorSpace;
  if(!this.title){this.title=new T.Mesh(new T.PlaneGeometry(1,1),new T.MeshBasicMaterial({transparent:true,depthWrite:false,toneMapped:false}));this.title.renderOrder=10;this.camera.add(this.title);}
  this.title.material.map?.dispose();this.title.material.map=texture;this.title.material.needsUpdate=true;
  const depth=3.5,height=2*Math.tan(T.MathUtils.degToRad(this.camera.fov/2))*depth,width=height*this.camera.aspect;
  this.title.scale.set(rect.width/viewport.width*width,rect.height/viewport.height*height,1);
  this.title.position.set(((rect.left-viewport.left+rect.width/2)/viewport.width-.5)*width,(.5-(rect.top-viewport.top+rect.height/2)/viewport.height)*height,-depth);
  heading.classList.add('scene-title-ready');
 }
 private update(t:number){
  if(this.printerCap){const remaining=this.keyPressUntil-t;const press=remaining>0?Math.sin(Math.PI*(1-remaining/180)):0;this.printerCap.position.y=this.printerCapRest-(this.reduced.matches?0:Math.max(0,press)*.0008);}
  if(this.bookMotion&&this.notebookHinge){const m=this.bookMotion,p=Math.min(1,(t-m.start)/1000),e=p*p*p*(p*(p*6-15)+10);this.notebookHinge.rotation.z=T.MathUtils.lerp(m.from,m.to,e);if(p===1){this.bookMotion=undefined;m.arrived?.();}}
  if(!this.movement)return;const m=this.movement,p=Math.min(1,(t-m.start)/m.duration),e=p*p*(3-2*p);this.camera.position.lerpVectors(m.from,m.to,e);this.target.lerpVectors(m.lookFrom,m.lookTo,e);this.camera.quaternion.slerpQuaternions(m.rotationFrom,m.rotationTo,e);if(m.notebook&&this.notebookHinge){const n=m.notebook;this.camera.position.copy(m.from).multiplyScalar((1-e)**2).addScaledVector(n.control,2*(1-e)*e).addScaledVector(m.to,e*e);this.target.copy(m.lookFrom).multiplyScalar((1-e)**2).addScaledVector(n.lookControl,2*(1-e)*e).addScaledVector(m.lookTo,e*e);this.camera.up.set(0,1,0).applyQuaternion(this.camera.quaternion);this.camera.lookAt(this.target);this.camera.up.set(0,1,0);this.notebookHinge.rotation.z=T.MathUtils.lerp(n.hingeFrom,n.hingeTo,e);}if(p===1){this.movement=undefined;m.arrived?.();}
 }
 private setNotebook(open:boolean,arrived?:()=>void){if(!this.notebookHinge){arrived?.();return;}const to=open?NOTEBOOK_OPEN_ANGLE:0;if(this.reduced.matches||Math.abs(this.notebookHinge.rotation.z-to)<.0001){this.notebookHinge.rotation.z=to;this.bookMotion=undefined;arrived?.();return;}this.bookMotion={start:performance.now(),from:this.notebookHinge.rotation.z,to,arrived};}
 private cancelNotebookSequence(){this.sequenceId++;this.notebookSequence=undefined;this.bookMotion=undefined;this.movement=undefined;}
 private animateNotebook(open:boolean,arrived?:()=>void){
  this.cancelNotebookSequence();const token=this.sequenceId;this.notebookSequence={open,arrived};
  const done=()=>{if(token!==this.sequenceId)return;this.notebookSequence=undefined;if(!open&&this.title)this.title.visible=true;arrived?.();};
  const hingeFrom=this.notebookHinge?.rotation.z??0;
  const showcase=this.notebookHinge?notebookShowcasePose(this.roots.get('ultra-maritime')!,this.notebookHinge,this.camera):undefined;
  if(this.reduced.matches)this.setNotebook(open);
  if(open){this.focusSurface('ultra-maritime',done);}else{const position=this.home.clone(),target=this.homeTarget.clone();if(this.canvas.clientWidth<760){position.z+=.6;position.y+=.15;target.y=1.02;}this.move(position,target,new T.Vector3(0,1,0),done);}
  if(this.movement&&showcase){this.movement.duration=1800;this.movement.notebook={control:showcase.position,lookControl:showcase.target,hingeFrom,hingeTo:open?NOTEBOOK_OPEN_ANGLE:0};}
 }
 private focusSurface(id:string,arrived?:()=>void,instant=false){
  const notebook=id==='ultra-maritime',mobile=notebook&&this.notebookReady&&this.canvas.clientWidth<760;
  const surface=this.surfaces.get(mobile&&this.notebookPage===0?'notebook-left':id);if(!surface)return false;
  // Measure the inside cover in its final open pose, even while its hinge is still moving.
  const angle=this.notebookHinge?.rotation.z;
  if(notebook&&this.notebookHinge){this.notebookHinge.rotation.z=NOTEBOOK_OPEN_ANGLE;this.notebookHinge.updateWorldMatrix(true,true);}
  const pose=id==='resume'&&this.printerKey?printerResumePose(surface,this.printerKey,this.camera.fov,this.camera.aspect):surfacePose(surface,this.camera.fov,this.camera.aspect,notebook&&!mobile,id==='contact'&&this.canvas.clientWidth<760?[0,.5]:[0,1]);
  if(notebook&&this.notebookHinge&&angle!==undefined){this.notebookHinge.rotation.z=angle;this.notebookHinge.updateWorldMatrix(true,true);}
  this.move(pose.position,pose.target,pose.up,arrived,instant);return true;
 }
 focus(id:string,arrived?:()=>void,immersive=true){this.showPrinterKey(false);const onArrived=()=>{if(this.active===id){this.showPrinterKey(id==='resume');arrived?.();}};this.cancelNotebookSequence();this.focusedSurface=immersive&&immersiveDestinations.has(id);if(this.title)this.title.visible=false;this.active=id;if(id==='ultra-maritime'&&this.focusedSurface){this.highlight('');this.animateNotebook(true,onArrived);return;}this.setNotebook(false);if(this.focusedSurface&&this.focusSurface(id,onArrived)){this.highlight('');return;}const root=this.roots.get(id);if(!root){this.homeView();return;}const box=new T.Box3().setFromObject(root),center=box.getCenter(new T.Vector3()),size=box.getSize(new T.Vector3());if(id==='fsae-data-logging'){const car=this.roots.get('formula-sae');if(car){const cb=new T.Box3().setFromObject(car);center.lerp(cb.getCenter(new T.Vector3()),.35);size.copy(cb.getSize(new T.Vector3()));}}let distance=Math.max(size.x,size.y,size.z)*(id==='fsae-data-logging'?1.45:2.2);distance=Math.max(id==='ultra-maritime'?.65:.55,distance);if(id==='formula-sae'&&innerWidth>760)distance*=Math.max(1,2.2/this.camera.aspect);if(id==='ultra-maritime')center.x-=.055;const to=center.clone().add(new T.Vector3(.03,distance*(id==='ultra-maritime'?1.15:id==='fsae-data-logging'?.85:.52),distance));const look=center.clone();const racing=id==='formula-sae'||id==='fsae-data-logging';if(racing){if(innerWidth>760){to.x-=distance*.11*this.camera.aspect;look.x-=distance*.11*this.camera.aspect;}else{to.y-=distance*.2;look.y-=distance*.2;}}else if(innerWidth>760)look.x+=distance*(id==='ultra-maritime'?.18:.28);this.move(to,look,new T.Vector3(0,1,0),arrived);this.highlight(racing?'':id);}
 homeView(){const notebook=this.active==='ultra-maritime'||!!this.notebookSequence;this.cancelNotebookSequence();this.showPrinterKey(false);this.focusedSurface=false;this.active='';this.highlight('hack-atlantic');if(notebook){this.animateNotebook(false);return;}this.setNotebook(false);if(this.title)this.title.visible=true;const position=this.home.clone(),target=this.homeTarget.clone();if(innerWidth<760){position.z+=.6;position.y+=.15;target.y=1.02;}this.move(position,target);}
 private move(to:T.Vector3,lookTo:T.Vector3,up=new T.Vector3(0,1,0),arrived?:()=>void,instant=false,duration=arrived?1350:950){const rotationTo=new T.Quaternion().setFromRotationMatrix(new T.Matrix4().lookAt(to,lookTo,up));if(this.reduced.matches||instant){this.camera.position.copy(to);this.target.copy(lookTo);this.camera.quaternion.copy(rotationTo);this.movement=undefined;arrived?.();return;}this.movement={start:performance.now(),from:this.camera.position.clone(),to:to.clone(),lookFrom:this.target.clone(),lookTo:lookTo.clone(),rotationFrom:this.camera.quaternion.clone(),rotationTo,duration,arrived};}

 highlight(id:string){if(this.focusedSurface)id='';if(this.selected===id&&this.outline.selectedObjects.length)return;this.selected=id;const root=this.roots.get(id);this.outline.selectedObjects=root?[root]:[];}
 get transitioning(){return !!this.movement||!!this.bookMotion||!!this.notebookSequence;}
 pickAt(e:Pick<MouseEvent,'clientX'|'clientY'>){return this.hit(e);}
 private hit(e:Pick<MouseEvent,'clientX'|'clientY'>){if(!this.model||!this.ready)return '';const r=this.canvas.getBoundingClientRect();this.pointer.set((e.clientX-r.left)/r.width*2-1,-(e.clientY-r.top)/r.height*2+1);this.ray.setFromCamera(this.pointer,this.camera);const hit=this.ray.intersectObject(this.model,true).find(h=>{let node:T.Object3D|null=h.object;while(node){if(!node.visible)return false;node=node.parent;}return true;});if(!hit)return '';let o:T.Object3D|null=hit.object;while(o){if(o.name==='Root_printer')return 'resume';const id=Object.entries(rootNames).find(([,name])=>name===o!.name)?.[0];if(id)return id;o=o.parent;}return '';}
 anchor(id:string){const root=this.roots.get(id);if(!root)return null;const b=new T.Box3().setFromObject(root),p=b.getCenter(new T.Vector3());if(id==='projects'){p.x=b.max.x-.13;p.y=b.max.y-.16;}else if(id==='ultra-maritime'){p.x=b.max.x;p.y=b.max.y;}else if(id==='fsae-data-logging'){p.y=b.max.y;}else if(id==='formula-sae'){p.y=b.max.y-.05;}else if(id==='hack-atlantic'){p.z=b.max.z;p.y=b.min.y;}else if(id==='contact'){p.z=b.max.z;p.y=b.min.y+.02;}else {p.x=b.min.x;p.y=b.max.y;}p.project(this.camera);return {x:(p.x*.5+.5)*this.canvas.clientWidth,y:(-.5*p.y+.5)*this.canvas.clientHeight,visible:p.z<1&&p.x>-1&&p.x<1&&p.y>-1&&p.y<1};}
 hasSurface(id:string){return this.surfaces.has(id);}
 contactRegions(){
  const book=this.roots.get('contact');if(!book)return [];book.updateWorldMatrix(true,false);
  return contactLinks.map(link=>{const [x0,x1,y0,y1]=link.bounds;
   const points=[[x0,y0],[x1,y0],[x0,y1],[x1,y1]].map(([x,y])=>new T.Vector3(x,.0081,-y).applyMatrix4(book.matrixWorld).project(this.camera));
   const xs=points.map(p=>(p.x+1)*this.canvas.clientWidth/2),ys=points.map(p=>(1-p.y)*this.canvas.clientHeight/2);
   return {id:link.id,left:Math.min(...xs),top:Math.min(...ys),width:Math.max(...xs)-Math.min(...xs),height:Math.max(...ys)-Math.min(...ys),visible:points.every(p=>p.z<1&&Math.abs(p.x)<1&&Math.abs(p.y)<1)};
  });
 }
 showPrinterKey(visible:boolean){if(this.printerKey)this.printerKey.visible=visible;if(!visible){this.keyHovered=false;this.keyFocused=false;this.keyPressUntil=0;this.setPrinterKeyState(false,false);}}
 setPrinterKeyState(hover:boolean,focus:boolean){this.keyHovered=hover;this.keyFocused=focus;this.printerKey?.traverse(o=>{if(o instanceof T.Mesh){const m=o.material as T.MeshStandardMaterial;if(m.name==='MAT_PrinterKey_Cap')m.color.set(hover?'#3f4b44':'#303b37');if(m.name==='MAT_PrinterKey_Rim'){m.color.set(focus?'#f3d9a8':'#798174');m.emissive.set(focus?'#30200a':'#000000');}}});}
 pressPrinterKey(){if(this.active==='resume'&&this.printerKey?.visible)this.keyPressUntil=performance.now()+180;}
 printerKeyRegion(){
  if(!this.printerKey?.visible||this.active!=='resume'||this.movement)return null;
  const label=this.model?.getObjectByName('PrinterKey_Label');if(!(label instanceof T.Mesh))return null;
  label.updateWorldMatrix(true,false);const a=label.geometry.getAttribute('position');const points=Array.from({length:a.count},(_,i)=>new T.Vector3().fromBufferAttribute(a,i).applyMatrix4(label.matrixWorld).project(this.camera));
  if(points.some(p=>p.z>1||p.z< -1||Math.abs(p.x)>1||Math.abs(p.y)>1))return null;
  const xs=points.map(p=>(p.x+1)*this.canvas.clientWidth/2),ys=points.map(p=>(1-p.y)*this.canvas.clientHeight/2),left=Math.min(...xs),top=Math.min(...ys),width=Math.max(...xs)-left,height=Math.max(...ys)-top;
  return {left:left-Math.max(0,44-width)/2,top:top-Math.max(0,44-height)/2,width:Math.max(44,width),height:Math.max(44,height)};
 }
 surfaceRect(id:string){const surface=this.surfaces.get(id);if(!surface)return null;surface.updateWorldMatrix(true,false);const a=surface.geometry.getAttribute('position');const points=Array.from({length:a.count},(_,i)=>new T.Vector3().fromBufferAttribute(a,i).applyMatrix4(surface.matrixWorld).project(this.camera));const xs=points.map(p=>(p.x*.5+.5)*this.canvas.clientWidth),ys=points.map(p=>(-.5*p.y+.5)*this.canvas.clientHeight);const left=Math.min(...xs),top=Math.min(...ys);return {left,top,width:Math.max(...xs)-left,height:Math.max(...ys)-top};}
 diagnostics(){const sorted=this.frames.slice().sort((a,b)=>a-b);return {ready:this.ready,notebookAngle:this.notebookHinge?.rotation.z??null,transitioning:this.transitioning,notebookPhase:this.notebookSequence?(this.bookMotion?'cover':'camera'):null,active:this.active,frames:sorted.length,medianFrameMs:sorted[Math.floor(sorted.length*.5)]??0,drawCalls:this.renderer.info.render.calls,triangles:this.renderer.info.render.triangles,anchors:Object.fromEntries(Object.keys(rootNames).map(id=>[id,this.anchor(id)]))};}
}
