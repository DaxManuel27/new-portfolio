import {NodeIO} from '@gltf-transform/core';
import {ALL_EXTENSIONS} from '@gltf-transform/extensions';
import {MeshoptDecoder,MeshoptEncoder} from 'meshoptimizer';
import {Matrix4,Quaternion,Vector3} from 'three';
import {readFile,writeFile,mkdir,copyFile,access} from 'node:fs/promises';
const root=new URL('../../',import.meta.url), degrees=10, screenDrop=0;
await MeshoptDecoder.ready;await MeshoptEncoder.ready;
const io=new NodeIO().registerExtensions(ALL_EXTENSIONS).registerDependencies({'meshopt.decoder':MeshoptDecoder,'meshopt.encoder':MeshoptEncoder});
const backup=new URL('backups/pre-inward-monitors/',root);await mkdir(backup,{recursive:true});
async function preserve(path){const dest=new URL(path.replaceAll('/','__'),backup);try{await access(dest);}catch{await copyFile(new URL(path,root),dest);}}
const sides=[['Left','um',-.325,1],['Right','fsae',.325,-1]];
for(const dir of ['exports/station-reorder/','exports/web/','web/public/assets/']){
 const path=dir+'station-ultra-maritime.glb';await preserve(path);const doc=await io.read(new URL(path,root).pathname);
 for(const [side,key,x,sign] of sides){
  const base=doc.getRoot().listNodes().find(n=>n.getName().includes(`Ultra_Monitor_${side}_StandBase`));
  if(base&&!base.getExtras().splayedFeet){
   // Reuse the rounded base mesh/material as two slim linked feet, at the same desk height.
   const mesh=base.getMesh(),parent=base.getParentNode(),scale=base.getScale();
   for(const direction of [-1,1]){
    const foot=doc.createNode(`SM_Ultra_Monitor_${side}_Foot_${direction<0?'Left':'Right'}`).setMesh(mesh);
    foot.setTranslation([x+direction*.075,.754,-.21+.06]);
    foot.setRotation(new Quaternion().setFromAxisAngle(new Vector3(0,1,0),direction*Math.atan2(.15,.12)).toArray());
    foot.setScale([scale[0]*.023/.24,scale[1]*.012/.016,scale[2]*Math.hypot(.15,.12)/.19]);
    parent.addChild(foot);
   }
   base.setMesh(null);base.setExtras({...base.getExtras(),splayedFeet:true});
  }
  const pivot=new Vector3(x,0,-.18),q=new Quaternion().setFromAxisAngle(new Vector3(0,1,0),sign*degrees*Math.PI/180);
  const rotate=new Matrix4().makeTranslation(...pivot.toArray()).multiply(new Matrix4().makeRotationFromQuaternion(q)).multiply(new Matrix4().makeTranslation(...pivot.clone().negate().toArray()));
  const nodes=doc.getRoot().listNodes().filter(n=>n.getName().includes(`Ultra_Monitor_${side}_`)||n.getName()===`Screen_Workstation_${key==='um'?'UM':'FSAE'}`);
  for(const node of nodes){
   const extras=node.getExtras(),original=extras.inwardOriginalWorld??node.getWorldMatrix();
   if(node.getName().startsWith('SM_')&&node.getName().includes('_Foot_'))original[13]=.754;
   const parent=node.getParentNode(),inv=parent?new Matrix4().fromArray(parent.getWorldMatrix()).invert():new Matrix4();
   const adjusted=new Matrix4().fromArray(original);
   if(node.getName().includes('_StandStem')){
    // Shorten the upright from its fixed foot, keeping the feet on the desktop.
    const p=new Vector3(),r=new Quaternion(),s=new Vector3();adjusted.decompose(p,r,s);
    p.y-=screenDrop/2;s.y*=(.31-screenDrop)/.31;adjusted.compose(p,r,s);
   }else if(/_Housing|_PowerLED|^Screen_Workstation_/.test(node.getName()))adjusted.elements[13]-=screenDrop;
   node.setMatrix(inv.multiply(rotate).multiply(adjusted).toArray());node.setExtras({...extras,inwardOriginalWorld:original,inwardDegrees:degrees});
  }
 }
 await io.write(new URL(path,root).pathname,doc);
}
for(const path of ['exports/web/journey.json','web/public/assets/journey.json','exports/station-reorder/layout.json']){
 await preserve(path);const data=JSON.parse(await readFile(new URL(path,root),'utf8')),ws=(data.reorder??data).workstation;
 const delta=(degrees-(ws.inwardDegrees??0))*Math.PI/180,dropDelta=screenDrop-(ws.screenDrop??0);
 for(const [,key,x,sign] of sides){
  const pivot=new Vector3(4.4+x,0,.8-.18),q=new Quaternion().setFromAxisAngle(new Vector3(0,1,0),sign*delta);
  const point=a=>new Vector3().fromArray(a).sub(pivot).applyQuaternion(q).add(pivot).toArray();
  const frame=ws.screens[key];frame.center=point(frame.center);frame.center[1]-=dropDelta;for(const axis of ['right','up','normal'])frame[axis]=new Vector3().fromArray(frame[axis]).applyQuaternion(q).toArray();
  const camera=ws[key==='um'?'close':'monitorClose'];camera.position=point(camera.position);camera.position[1]-=dropDelta;camera.quaternion=new Quaternion().fromArray(camera.quaternion).premultiply(q).toArray();
 }
 ws.inwardDegrees=degrees;ws.screenDrop=screenDrop;if(data.stations)data.stations[2].close=structuredClone(ws.close);
 await writeFile(new URL(path,root),JSON.stringify(data));
}
console.log('Updated inward angles, splayed feet, and matching screen cameras.');
