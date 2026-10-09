import * as T from 'three';
export const immersiveDestinations=new Set(['hack-atlantic','ultra-maritime','contact','resume']);
/** Frame the surface with 10% breathing room; the notebook includes its open cover. */
export function surfacePose(mesh:T.Mesh,fov:number,aspect:number,spread=false,uvRange:readonly[number,number]=[0,1]){
 mesh.updateWorldMatrix(true,false);const position=mesh.geometry.getAttribute('position'),uv=mesh.geometry.getAttribute('uv');
 if(!position||!uv)throw new Error('Focus surface requires positions and UVs');
 const corners=[[uvRange[0],0],[uvRange[1],0],[uvRange[0],1],[uvRange[1],1]].map(([u,v])=>{let best=Infinity,index=0;for(let i=0;i<uv.count;i++){const d=(uv.getX(i)-u)**2+(uv.getY(i)-v)**2;if(d<best){best=d;index=i;}}return new T.Vector3().fromBufferAttribute(position,index).applyMatrix4(mesh.matrixWorld);});
 const [a,b,c,d]=corners,center=a.clone().add(b).add(c).add(d).multiplyScalar(.25);
 const right=b.clone().sub(a).add(d.clone().sub(c)).normalize();
 let up=a.clone().sub(c).add(b.clone().sub(d)).normalize();
 // glTF V points down; keep upright even if a source uses the opposite UV convention.
 if(Math.abs(up.y)>.5&&up.y<0)up.negate();
 if(Math.abs(up.y)<.5&&up.z>0)up.negate();
 const normal=new T.Vector3().crossVectors(right,up).normalize();
 const width=(a.distanceTo(b)+c.distanceTo(d))/2,height=(a.distanceTo(c)+b.distanceTo(d))/2;
 const tangent=Math.tan(T.MathUtils.degToRad(fov/2));
 const frameWidth=width*(spread?2.15:1);
 if(spread)center.addScaledVector(right,-width*.54);
 const distance=Math.max(.04,Math.max(height/(2*tangent),frameWidth/(2*tangent*aspect))/.8);
 return {position:center.clone().addScaledVector(normal,distance),target:center,up,width,height,distance};
}
