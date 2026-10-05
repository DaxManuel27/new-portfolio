import { CatmullRomCurve3, Matrix4, Quaternion, Vector3 } from 'three';
import { clamp, ease, type JourneyState } from './journey';
import type { CameraPose, Manifest } from './types';
export type FsaeProject = 'data';
export const PI_SCALE = .25;
export const PI_YAW = -Math.PI / 10;
/** A single immutable in-car placement, also used by the monitor preview. */
export function piPlacement(manifest: Manifest) {
  return { position: manifest.reorder.car.anchors!.data, scale: PI_SCALE, yaw: PI_YAW };
}
export function fsaeFocus(state: Pick<JourneyState,'phase'|'local'>) {
  const kind=state.phase.kind,p=state.local;
  const project:FsaeProject|undefined=kind.startsWith('data-')?'data':undefined;
  let dive=0,isolate=0,reveal=0;
  if(kind==='data-dive')dive=p;
  if(kind==='data-isolate'){dive=1;isolate=p;}
  if(kind==='data-reveal'){dive=isolate=1;reveal=p;}
  if(kind==='data-hold')dive=isolate=reveal=1;
  if(kind==='data-return'){
    reveal=1-clamp(p/.25);isolate=1-clamp((p-.25)/.35);dive=1-clamp((p-.6)/.4);
  }
  const carOpacity=1-ease(isolate/.7);
  return {project,dive,isolate,reveal,amount:(.9*dive+.7*isolate+.4*reveal)/2,carOpacity,
    detailOpacity:project?1:0,textOpacity:ease(reveal/.4),cutaway:1,seatCutaway:1,
    calloutOpacity:project?1-ease(dive/.25):1,lightMix:ease(isolate)};
}
/** Title, subtitle and body finish together at the end of reveal; return uses the same clock backwards. */
export function detailTextItems(reveal:number,reduced=false) {
  return Array.from({length:3},(_,i)=>{const opacity=ease((reveal-i*.3)/.4);return {opacity,y:reduced?0:12*(1-opacity)};});
}
const anchorOf=(m:Manifest)=>new Vector3().fromArray(m.reorder.car.anchors!.data);
function facing(position:Vector3,target:Vector3) {
  return new Quaternion().setFromRotationMatrix(new Matrix4().lookAt(position,target,new Vector3(0,1,0)));
}
function diveEnd(m:Manifest) {
  const route=m.reorder.car.focusRoutes!.data;
  return {...route.at(-1)!,width:m.reorder.car.dataShot?.dive.width??.055};
}
function heroOffset() {return new Vector3(.075,.12,.14).multiplyScalar(PI_SCALE).applyAxisAngle(new Vector3(0,1,0),PI_YAW);}
export function detailPose(_project:FsaeProject,aspect:number,manifest:Manifest):CameraPose {
  const target=anchorOf(manifest),position=target.clone().add(heroOffset()),quaternion=facing(position,target);
  const width=Math.max(aspect<.85?.145:.22,.12*aspect)*PI_SCALE;
  position.addScaledVector(new Vector3(1,0,0).applyQuaternion(quaternion),aspect<.85?0:-width*.23);
  if(aspect<.85)position.addScaledVector(new Vector3(0,1,0).applyQuaternion(quaternion),-width/aspect*.2);
  return {position:position.toArray(),quaternion:quaternion.toArray(),width};
}
export function fsaeCamera(manifest:Manifest,state:JourneyState,aspect:number):CameraPose|undefined {
  const focus=fsaeFocus(state);if(!focus.project)return;
  if(focus.isolate<=0)return approachPose(manifest,focus.dive,aspect);
  const start=approachPose(manifest,1,aspect),end=detailPose('data',aspect,manifest);
  // Keep the clear behind-seat view until the opaque car is completely black and removed.
  const t=ease((focus.isolate-.7)/.3),anchor=anchorOf(manifest);
  const a=new Vector3().fromArray(start.position).sub(anchor),b=heroOffset();
  const radius=a.length()*(1-t)+b.length()*t;
  const turn=new Quaternion().setFromUnitVectors(a.clone().normalize(),b.clone().normalize());
  const offset=a.clone().normalize().applyQuaternion(new Quaternion().slerp(turn,t)).multiplyScalar(radius);
  const position=anchor.clone().add(offset),quaternion=facing(position,anchor);
  const copyOffset=new Vector3().fromArray(end.position).sub(anchor).sub(b);
  position.addScaledVector(copyOffset,t);
  return {position:position.toArray(),quaternion:quaternion.toArray(),width:Math.exp(Math.log(start.width)*(1-t)+Math.log(end.width)*t)};
}
function approachPose(manifest:Manifest,amount:number,aspect:number):CameraPose {
  const start=manifest.reorder.car.close;
  if(amount<=0)return {...start,width:start.width*Math.max(1,aspect/1.5)};
  const route=manifest.reorder.car.focusRoutes!.data,end=diveEnd(manifest),p=ease(amount);
  const startPosition=new Vector3().fromArray(start.position),anchor=anchorOf(manifest);
  const startTarget=startPosition.clone().addScaledVector(new Vector3(0,0,-1).applyQuaternion(new Quaternion().fromArray(start.quaternion)),startPosition.distanceTo(anchor));
  const curve=new CatmullRomCurve3([startPosition,...route.slice(0,-1).map(row=>new Vector3().fromArray(row.position)),new Vector3().fromArray(end.position)],false,'centripetal');
  // Acquire the hardware before the tight zoom. Blending the aim over the entire
  // approach lets the shrinking view magnify the remaining offset during rotation.
  const position=curve.getPoint(p),target=startTarget.lerp(anchor,ease(amount/.3)),quaternion=facing(position,target);
  return {position:position.toArray(),quaternion:quaternion.toArray(),width:Math.exp(Math.log(start.width)*(1-p)+Math.log(end.width)*p)*Math.max(1,aspect/1.5)};
}
