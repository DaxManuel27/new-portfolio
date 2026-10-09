import * as T from 'three';
import {surfacePose} from './surface-focus';
/** Fit paper and the raised printer key using perspective, including their depth difference. */
export function printerResumePose(paper:T.Mesh,key:T.Object3D,fov:number,aspect:number){
 const pose=surfacePose(paper,fov,aspect),normal=pose.position.clone().sub(pose.target).normalize(),up=pose.up.clone(),right=new T.Vector3().crossVectors(up,normal).normalize();
 const points:T.Vector3[]=[];
 for(const object of [paper,key]){object.updateWorldMatrix(true,true);object.traverse(o=>{if(o instanceof T.Mesh){const a=o.geometry.getAttribute('position');for(let i=0;i<a.count;i++)points.push(new T.Vector3().fromBufferAttribute(a,i).applyMatrix4(o.matrixWorld));}});}
 const relative=points.map(p=>p.clone().sub(pose.target));
 const xs=relative.map(p=>p.dot(right)),ys=relative.map(p=>p.dot(up));
 const target=pose.target.clone().addScaledVector(right,(Math.min(...xs)+Math.max(...xs))/2).addScaledVector(up,(Math.min(...ys)+Math.max(...ys))/2);
 const tan=Math.tan(T.MathUtils.degToRad(fov/2));let distance=.04;
 for(const p of points){const d=p.clone().sub(target);distance=Math.max(distance,d.dot(normal)+Math.max(Math.abs(d.dot(right))/(tan*aspect*.82),Math.abs(d.dot(up))/(tan*.82)));}
 return {...pose,target,position:target.clone().addScaledVector(normal,distance),distance};
}
