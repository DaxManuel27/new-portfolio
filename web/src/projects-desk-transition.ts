import { Quaternion, Vector3 } from 'three';
import { mixCamera, responsive, screenZoom } from './camera';
import { ease, type JourneyState } from './journey';
import type { CameraPose, Manifest } from './types';
export const PROJECTS_REEL_REVEAL=.94;
export function carModelTransform(manifest:Manifest,progress:number){
 const spec=manifest.reorder.projects.carModel;
 const t=ease(progress),move=ease(progress/.65);
 const scale=Math.exp(Math.log(spec.scale)*t);
 const rotation=new Quaternion().slerp(new Quaternion().fromArray(spec.quaternion),move);
 const source=new Vector3().fromArray(spec.sourceGround);
 const ground=new Vector3().fromArray(manifest.stations[3].origin).add(source).lerp(new Vector3().fromArray(spec.ground),move);
 const position=ground.clone().sub(source.clone().multiplyScalar(scale).applyQuaternion(rotation));
 return {position,rotation,scale,ground};
}
export function carAnchoredPose(manifest:Manifest,progress:number,aspect:number):CameraPose {
 const start=responsive(manifest.reorder.car.close,aspect),tr=carModelTransform(manifest,progress);
 const offset=new Vector3().fromArray(start.position).sub(new Vector3().fromArray(manifest.stations[3].origin));
 return {position:offset.multiplyScalar(tr.scale).applyQuaternion(tr.rotation).add(tr.position).toArray(),quaternion:tr.rotation.clone().multiply(new Quaternion().fromArray(start.quaternion)).toArray(),width:start.width*tr.scale};
}
export function projectsRevealPose(manifest:Manifest,progress:number,aspect:number):CameraPose {
 const t=ease(progress/.9),a=carAnchoredPose(manifest,1,aspect),b=responsive(manifest.reorder.ultrawide.wide,aspect);
 const pose=mixCamera(a,b,t);pose.width=Math.exp(Math.log(a.width)*(1-t)+Math.log(b.width)*t);return pose;
}
export function projectsEntryPose(manifest:Manifest,progress:number,aspect:number):CameraPose {
 return screenZoom(responsive(manifest.reorder.ultrawide.wide,aspect),manifest.reorder.ultrawide.screen,progress/PROJECTS_REEL_REVEAL,aspect);
}
export function modelSceneState(state:Pick<JourneyState,'phase'|'local'>){
 const k=state.phase.kind,p=state.local,shrink=k==='car-shrink';
 const model=shrink||k==='projects-reveal'||k==='projects-monitor-entry'||k==='reel'||k==='contact-card-center'||k==='contact-card-expand'||state.phase.station>=5;
 return {model,progress:shrink?p:model?1:0,desk:shrink?ease((p-.67)/.28):1,labels:shrink?1-ease(p/.3):model?0:1};
}
