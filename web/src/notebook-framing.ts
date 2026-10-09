import * as T from 'three';
/** Back away along the view axis until the moving cover fits inside the frame. */
export function keepNotebookInFrame(camera:T.PerspectiveCamera,book:T.Object3D,strength=1){
 book.updateWorldMatrix(true,true);camera.updateMatrixWorld(true);
 const box=new T.Box3().setFromObject(book),tan=Math.tan(T.MathUtils.degToRad(camera.fov/2))*.88;
 if(box.isEmpty())return;
 let retreat=0;
 for(const x of [box.min.x,box.max.x])for(const y of [box.min.y,box.max.y])for(const z of [box.min.z,box.max.z]){
  const p=new T.Vector3(x,y,z).applyMatrix4(camera.matrixWorldInverse);
  retreat=Math.max(retreat,p.z+Math.abs(p.x)/(tan*camera.aspect),p.z+Math.abs(p.y)/tan,p.z+camera.near*2);
 }
 camera.position.addScaledVector(new T.Vector3(0,0,1).applyQuaternion(camera.quaternion),retreat*strength);
 camera.updateMatrixWorld(true);
}

export const NOTEBOOK_OPEN_ANGLE=Math.PI;
/** A fixed three-quarter pose accommodates the entire upward cover sweep. */
export function notebookShowcasePose(book:T.Object3D,hinge:T.Object3D,camera:T.PerspectiveCamera){
 const angle=hinge.rotation.z,bounds=new T.Box3();
 for(let i=0;i<=48;i++){hinge.rotation.z=NOTEBOOK_OPEN_ANGLE*i/48;book.updateWorldMatrix(true,true);bounds.union(new T.Box3().setFromObject(book));}
 hinge.rotation.z=angle;book.updateWorldMatrix(true,true);
 const target=bounds.getCenter(new T.Vector3()),view=camera.clone();
 view.position.copy(target).add(new T.Vector3(.08,.30,.36));view.up.set(0,1,0);view.lookAt(target);
 const envelope=new T.Mesh(new T.BoxGeometry(...bounds.getSize(new T.Vector3()).toArray()));envelope.position.copy(target);
 keepNotebookInFrame(view,envelope);envelope.geometry.dispose();(envelope.material as T.Material).dispose();
 return {position:view.position.clone(),target};
}
