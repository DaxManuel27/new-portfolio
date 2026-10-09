import * as T from 'three';
import {RoundedBoxGeometry} from 'three/addons/geometries/RoundedBoxGeometry.js';

// Scene units are meters. The cup is 16cm tall, excluding its straw.
export const MATCHA={height:.16,rimRadius:.0475,baseRadius:.03,x:-.263,z:.16};
const noRaycast: T.Mesh['raycast']=()=>{};

/** Decorative, static geometry: no handlers, animation, lights or raycast hits. */
export function createIcedMatcha(deskY:number){
 const root=new T.Group();root.name='Root_iced_matcha';root.position.set(MATCHA.x,deskY,MATCHA.z);
 function add(name:string,g:T.BufferGeometry,m:T.Material,y=0){const mesh=new T.Mesh(g,m);mesh.name=name;mesh.position.y=y;mesh.raycast=noRaycast;root.add(mesh);return mesh;}
 // Alpha transparency keeps the liquid sharp; edge reflections describe clear PET.
 // No transmission buffer, frosted normals or opaque green shell.
 const plastic=new T.MeshPhysicalMaterial({color:'#f4fbff',roughness:.08,metalness:0,clearcoat:1,clearcoatRoughness:.06,transparent:true,opacity:.3,depthWrite:false,side:T.FrontSide});
 // Closed cross-section gives the PET wall an actual inner surface and base.
 const profile=[[0,0],[.027,0],[.030,.003],[.0475,.156],[.0475,.16],[.046,.16],[.046,.156],[.0285,.004],[0,.004]].map(([r,y])=>new T.Vector2(r,y));
 const wall=plastic.clone();wall.opacity=1;
 wall.onBeforeCompile=shader=>{
  shader.fragmentShader=shader.fragmentShader.replace('#include <opaque_fragment>',
   'float cupEdge=pow(1.0-abs(dot(normal,normalize(vViewPosition))),3.0);\ndiffuseColor.a*=mix(.025,.42,cupEdge);\n#include <opaque_fragment>');
 };
 const cup=add('Matcha_clear_cup',new T.LatheGeometry(profile,48),wall);cup.renderOrder=2;
 const lip=add('Matcha_rolled_lip',new T.TorusGeometry(.0468,.0014,8,48),plastic,.159);lip.rotation.x=Math.PI/2;
 lip.renderOrder=3;
 const base=add('Matcha_clear_base',new T.TorusGeometry(.029,.001,8,48),plastic,.003);base.rotation.x=Math.PI/2;base.renderOrder=3;
 const lidMaterial=plastic.clone();lidMaterial.opacity=.09;lidMaterial.side=T.DoubleSide;
 // Annular flat sip lid with a real central straw opening.
 add('Matcha_sip_lid',new T.LatheGeometry([[.004,.16],[.046,.16],[.048,.161],[.048,.163],[.045,.164],[.004,.164]].map(([r,y])=>new T.Vector2(r,y)),48),lidMaterial).renderOrder=3;
 // One uniform green volume keeps the drink readable at overview scale.
 const liquidMaterial=new T.MeshPhysicalMaterial({color:'#7c9a4e',roughness:.64,emissive:'#7c9a4e',emissiveIntensity:.035});
 const radius=(y:number)=>.0285+(y-.004)/.152*.0175-.001;
 add('Matcha_green_liquid',new T.CylinderGeometry(radius(.144),radius(.004),.14,48),liquidMaterial,.074);
 const iceMaterial=new T.MeshStandardMaterial({color:'#cad8b7',roughness:.24});
 const iceGeometry=new RoundedBoxGeometry(.019,.019,.019,2,.003);
 for(let i=0;i<6;i++){
  const a=i*2.39996,r=i===0?.002:.024;
  const ice=add(`Matcha_ice_${i+1}`,iceGeometry,iceMaterial,.143+(i%3)*.002);
  ice.position.x=Math.cos(a)*r;ice.position.z=Math.sin(a)*r;ice.rotation.set(.14*i,.7*i,.2-.09*i);ice.scale.set(1+(i%2)*.16,.8+(i%3)*.1,.9+(i%2)*.15);
 }
 const strawMaterial=new T.MeshStandardMaterial({color:'#28462b',roughness:.82,side:T.DoubleSide});
 const straw=add('Matcha_straw',new T.CylinderGeometry(.003,.003,.125,12,1,true),strawMaterial,.147);straw.rotation.z=-.09;straw.position.x=-.0015;
 // Faint radial contact shadow grounds the decorative cup.
 const shadowSize=64,shadowData=new Uint8Array(shadowSize*shadowSize*4);
 for(let y=0;y<shadowSize;y++)for(let x=0;x<shadowSize;x++){const r=Math.hypot((x+ .5)/32-1,(y+.5)/32-1),i=(y*shadowSize+x)*4;shadowData[i+3]=Math.round(Math.max(0,1-r)**2*55);}
 const shadowMap=new T.DataTexture(shadowData,shadowSize,shadowSize);shadowMap.needsUpdate=true;
 const shadow=add('Matcha_contact_shadow',new T.PlaneGeometry(.103,.103),new T.MeshBasicMaterial({map:shadowMap,transparent:true,depthWrite:false}),.0002);shadow.rotation.x=-Math.PI/2;
 return root;
}
