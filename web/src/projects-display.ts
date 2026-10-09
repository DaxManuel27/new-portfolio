import * as T from 'three';

/** Shared by the accessible document and the curved screen artwork. */
export const projectsCopy={title:'Personal projects',body:'More to come.'};

export async function createProjectsDisplay(maxTextureSize:number,mobile=false){
 const family=getComputedStyle(document.body).fontFamily;
 await document.fonts.load(`300 88px ${family}`);
 const canvas=document.createElement('canvas');
 canvas.width=Math.min(4096,maxTextureSize);canvas.height=Math.round(canvas.width*.350/.846);
 const ctx=canvas.getContext('2d');if(!ctx)return null;
 const scale=canvas.width/2048;ctx.scale(scale,scale);
 ctx.fillStyle='#121d21';ctx.fillRect(0,0,2048,canvas.height/scale);
 ctx.fillStyle='#efe9dd';ctx.font=`300 ${mobile?120:88}px ${family}`;
 ctx.fillText(projectsCopy.title,120,238);
 ctx.font=`400 ${mobile?80:38}px system-ui, sans-serif`;ctx.fillText(projectsCopy.body,120,334);
 const texture=new T.CanvasTexture(canvas);texture.colorSpace=T.SRGBColorSpace;
 // The exported glTF screen UVs use a top-left image origin.
 texture.flipY=false;
 return texture;
}
