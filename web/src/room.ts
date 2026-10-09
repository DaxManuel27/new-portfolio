import * as T from 'three';
export const ROOM={wallZ:-1.51,floorY:0,lamp:[-.41,.75,-.29] as const};
function mesh(parent:T.Object3D,name:string,g:T.BufferGeometry,m:T.Material,p:readonly number[]){const o=new T.Mesh(g,m);o.name=name;o.position.set(p[0],p[1],p[2]);o.castShadow=true;o.receiveShadow=true;parent.add(o);return o;}
function rod(parent:T.Object3D,name:string,a:T.Vector3,b:T.Vector3,r:number,m:T.Material){const d=b.clone().sub(a),o=mesh(parent,name,new T.CylinderGeometry(r,r,d.length(),16),m,a.clone().add(b).multiplyScalar(.5).toArray());o.quaternion.setFromUnitVectors(new T.Vector3(0,1,0),d.normalize());return o;}
/** Darken distant room surfaces without adding transparent floor edges or draw passes. */
function falloff(m:T.MeshStandardMaterial){m.onBeforeCompile=s=>{s.vertexShader=s.vertexShader.replace('#include <common>','#include <common>\nvarying vec3 roomPosition;').replace('#include <worldpos_vertex>','#include <worldpos_vertex>\nvec4 roomLocal=vec4(transformed,1.0);\n#ifdef USE_INSTANCING\nroomLocal=instanceMatrix*roomLocal;\n#endif\nroomPosition=(modelMatrix*roomLocal).xyz;');s.fragmentShader=s.fragmentShader.replace('#include <common>','#include <common>\nvarying vec3 roomPosition;').replace('#include <opaque_fragment>','outgoingLight *= 1.0-smoothstep(1.7,5.0,length(roomPosition.xz))*0.97;\n#include <opaque_fragment>');};}
export async function createRoom(model:T.Group,scene:T.Scene){
 const room=new T.Group();room.name='COL_Room';scene.add(room);
 const existing=model.getObjectByName('Wall');if(existing)existing.visible=false;
 const wallMat=new T.MeshStandardMaterial({color:'#22362a',roughness:.92,emissive:'#22362a',emissiveIntensity:.45});falloff(wallMat);
 const wall=mesh(room,'Room_green_wall',new T.PlaneGeometry(14,8),wallMat,[0,3.5,ROOM.wallZ]);wall.castShadow=false;
 const baseMat=new T.MeshStandardMaterial({color:'#101912',roughness:.85});
 // The wall extends below the floor; a flush, wall-colored skirting avoids a dark apparent gap.
 const skirting=mesh(room,'Room_baseboard',new T.BoxGeometry(14,.024,.012),wallMat,[0,.012,ROOM.wallZ+.007]);skirting.castShadow=false;
 const loader=new T.TextureLoader(),base=import.meta.env.BASE_URL+'assets/room/';
 const [map,normalMap,roughnessMap]=await Promise.all(['walnut-color.webp','walnut-normal.webp','walnut-roughness.webp'].map(x=>loader.loadAsync(base+x)));map.colorSpace=T.SRGBColorSpace;for(const t of [map,normalMap,roughnessMap]){t.wrapS=t.wrapT=T.RepeatWrapping;t.anisotropy=4;}
 const floorMat=new T.MeshStandardMaterial({map,normalMap,roughnessMap,color:'#96785c',roughness:.92,normalScale:new T.Vector2(.2,.2)});
 // One instanced draw for staggered 14cm planks, with tiny bevel-like dark joints.
 falloff(floorMat);
 const floor=new T.InstancedMesh(new T.BoxGeometry(.138,.022,.998),floorMat,70*9);floor.name='Room_walnut_planks';floor.receiveShadow=true;floor.castShadow=false;
 const transform=new T.Object3D();let i=0;for(let col=0;col<70;col++)for(let row=0;row<9;row++){transform.position.set((col-35)*.14,-.011,ROOM.wallZ+row+(col%2)*.5);transform.updateMatrix();floor.setMatrixAt(i,transform.matrix);floor.setColorAt(i,new T.Color().setScalar(.75+((col*17+row*11)%13)/52));i++;}room.add(floor);
 const under=mesh(room,'Room_floor_underlay',new T.BoxGeometry(14,.03,12),baseMat,[0,-.038,4.48]);under.castShadow=false;
 // Soft local contact occlusion supplements the lamp's real shadow map.
 const c=document.createElement('canvas');c.width=c.height=128;const ctx=c.getContext('2d')!,g=ctx.createRadialGradient(64,64,3,64,64,64);g.addColorStop(0,'#000b');g.addColorStop(.35,'#0008');g.addColorStop(1,'#0000');ctx.fillStyle=g;ctx.fillRect(0,0,128,128);const contact=new T.CanvasTexture(c);
 for(const [x,z,sx,sz]of [[-.79,-.34,.3,.3],[.79,-.34,.3,.3],[-.79,.34,.3,.3],[.79,.34,.3,.3],[.03,.78,.8,.7]]){const shadow=mesh(room,'Floor_contact',new T.PlaneGeometry(sx,sz),new T.MeshBasicMaterial({map:contact,transparent:true,depthWrite:false}),[x,.001,z]);shadow.rotation.x=-Math.PI/2;shadow.castShadow=false;}
 const black=new T.MeshStandardMaterial({color:'#181b18',roughness:.52,metalness:.6}),brass=new T.MeshStandardMaterial({color:'#967248',roughness:.4,metalness:.78});
 // Existing chair stops at the seat: complete its support at the floor.
 const chair=new T.Group();chair.name='Chair_base';room.add(chair);rod(chair,'Chair_pedestal',new T.Vector3(.03,.07,.72),new T.Vector3(.03,.35,.72),.025,black);
 for(let j=0;j<5;j++){const a=j*Math.PI*2/5;const end=new T.Vector3(.03+Math.cos(a)*.28,.052,.72+Math.sin(a)*.28);rod(chair,'Chair_spoke',new T.Vector3(.03,.10,.72),end,.013,black);const wheel=mesh(chair,'Chair_caster',new T.SphereGeometry(.026,12,8),black,[end.x,.026,end.z]);wheel.scale.z=.65;}
 const lamp=new T.Group();lamp.name='Desk_lamp';lamp.position.fromArray(ROOM.lamp);room.add(lamp);
 mesh(lamp,'Lamp_base',new T.CylinderGeometry(.068,.078,.018,32),black,[0,.009,0]);rod(lamp,'Lamp_lower_arm',new T.Vector3(0,.02,0),new T.Vector3(-.045,.27,-.015),.009,brass);rod(lamp,'Lamp_upper_arm',new T.Vector3(-.045,.27,-.015),new T.Vector3(.055,.39,.01),.008,brass);
 mesh(lamp,'Lamp_joint',new T.SphereGeometry(.016,12,8),brass,[-.045,.27,-.015]);
 const head=new T.Group();head.name='Lamp_head';head.position.set(.055,.39,.01);lamp.add(head);head.rotation.z=-.3;
 mesh(head,'Lamp_shade',new T.CylinderGeometry(.027,.09,.09,32,1,true),new T.MeshStandardMaterial({color:'#22261f',metalness:.5,roughness:.55,side:T.DoubleSide}),[0,0,0]);
 mesh(head,'Lamp_bulb',new T.SphereGeometry(.021,16,8),new T.MeshStandardMaterial({color:'#ffdda0',emissive:'#ffbd64',emissiveIntensity:3}),[0,-.024,0]);
 const key=new T.SpotLight('#ffd2a0',2.2,5,Math.PI*.35,.8,2);key.name='Lamp_warm_key';key.position.set(0,-.045,0);key.castShadow=true;key.shadow.mapSize.set(1024,1024);key.shadow.bias=-.00015;key.shadow.normalBias=.003;key.shadow.radius=4;key.shadow.camera.near=.025;key.shadow.camera.far=5;head.add(key);key.target.position.set(.1,.73,.1);scene.add(key.target);
 const spill=new T.PointLight('#ffce94',.65,2.2,2);spill.position.set(0,-.045,0);head.add(spill);
 const wash=new T.SpotLight('#f2dfbb',2.5,7,1.05,1,1);wash.name='Room_wall_wash';wash.position.set(-1.1,2.7,.7);wash.target.position.set(-.8,1.5,ROOM.wallZ);wash.castShadow=false;room.add(wash,wash.target);
 model.traverse(o=>{if(!(o instanceof T.Mesh))return;o.castShadow=true;o.receiveShadow=true;});
 return {root:room,wall,lamp,key};
}
/** Same weight and system-font stack as the opening title in commit 8afeabe. */
export async function createWallName(){
 const canvas=document.createElement('canvas');canvas.width=2048;canvas.height=1200;
 const c=canvas.getContext('2d')!;c.fillStyle='#9d998c';
 let y=32;for(const word of ['DAX','MANUEL']){
  c.font='800 500px -apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif';
  const size=500*1984/c.measureText(word).width;c.font=`800 ${size}px -apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif`;
  const metrics=c.measureText(word);y+=metrics.actualBoundingBoxAscent;c.fillText(word,32,y);y+=metrics.actualBoundingBoxDescent+35;
 }
 const texture=new T.CanvasTexture(canvas);texture.colorSpace=T.SRGBColorSpace;
 const name=new T.Mesh(new T.PlaneGeometry(1,1),new T.MeshBasicMaterial({map:texture,transparent:true,depthWrite:false,toneMapped:false}));name.name='Wall_painted_name';name.userData.inkBounds=[32/2048,2016/2048,1-y/1200,1-32/1200];name.position.z=ROOM.wallZ+.004;return name;
}
