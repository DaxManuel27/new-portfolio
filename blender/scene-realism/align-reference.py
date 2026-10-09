import bpy,math,numpy as np
from pathlib import Path
from mathutils import Vector
R=Path('/Users/daxmanuel/Documents/ChatGPT/portfolio-site-blender');s=bpy.context.scene;T=R/'design/scene-realism/textures'
# Framing adjustments measured from the 1440×1000 reference comparison.
for key,pos in {'monitor':(-.005,.265,.75),'macbook':(.005,-.12,.74),'car':(-.625,.01,.74),'pi':(-.44,-.265,.741),'printer':(.76,.54,.74),'notebook':(.30,.01,.74),'pen':(.37,-.01,.758),'resume':(.60,.025,.741),'phone':(.75,-.275,.74),'plant':(-.745,.43,.74),'mug':(-.48,.43,.74)}.items():bpy.data.objects['Root_'+key].location=pos
bpy.data.objects['Root_monitor'].scale=(.94,)*3;bpy.data.objects['Root_macbook'].scale=(1.32,)*3;bpy.data.objects['Root_phone'].scale=(.86,)*3;bpy.data.objects['Root_mug'].scale=(1.1,)*3
pi=bpy.data.objects['Root_pi'];pi.scale*=1.16
bpy.data.objects['Desk_Top.001'].scale.y=1.036;bpy.data.objects['Desk_Top.001'].location.y=.06
# Original variegated leaf color map in leaf UV space.
N=512;yy,xx=np.mgrid[0:N,0:N];u=xx/(N-1);v=yy/(N-1);patch=np.clip((np.sin(u*19+np.sin(v*16)*1.2)+np.sin(v*23-u*12)-.5)*.5,0,1);vein=np.exp(-((u-.5)*95)**2);side=np.exp(-(np.sin((v-abs(u-.5)*.75)*math.pi*12)*24)**2)*.22;green=np.array([.15,.22,.065]);gold=np.array([.38,.40,.13]);rgb=green[None,None,:]*(1-patch[:,:,None]) +gold[None,None,:]*patch[:,:,None];rgb+=((vein+side)*.065)[:,:,None]
im=bpy.data.images.get('pothos-variegation') or bpy.data.images.new('pothos-variegation',N,N,alpha=False);im.colorspace_settings.name='sRGB';im.pixels.foreach_set(np.dstack([rgb,np.ones((N,N))]).astype(np.float32).ravel());im.update();im.filepath_raw=str(T/'pothos-variegation.png');im.file_format='PNG';im.save()
for i in range(3):
 m=bpy.data.materials['MAT_Pothos_Leaf_'+str(i)];p=next(n for n in m.node_tree.nodes if n.type=='BSDF_PRINCIPLED');tex=m.node_tree.nodes.new('ShaderNodeTexImage');tex.image=im;m.node_tree.links.new(tex.outputs['Color'],p.inputs['Base Color']);p.inputs['Roughness'].default_value=.38;p.inputs['Sheen Weight'].default_value=.06
# New visible coiled handset cord; preserve old cord objects in the legacy collection.
phone=bpy.data.objects['Root_phone'];archive=bpy.data.collections['COL_Legacy_ReferenceRebuild']
for o in list(phone.children_recursive):
 if 'CoiledCord' in o.name or 'FlexibleLead' in o.name:
  for c in list(o.users_collection):c.objects.unlink(o)
  archive.objects.link(o)
pts=[]
for i in range(241):
 t=i/240;x=-.115-.09*math.sin(math.pi*t);y=.045-.205*t;z=.075*(1-t)**3+.009;angle=t*math.pi*2*28;pts.append(Vector((x+.008*math.cos(angle),y,z+.008*math.sin(angle))))
verts=[]
for i,p in enumerate(pts):
 tangent=pts[min(i+1,len(pts)-1)]-pts[max(0,i-1)];q=tangent.to_track_quat('Z','Y')
 for k in range(8):verts.append(p+q@Vector((.0022*math.cos(k*math.tau/8),.0022*math.sin(k*math.tau/8),0)))
me=bpy.data.meshes.new('Phone_Cord_Left');me.from_pydata(verts,[],[(i*8+k,i*8+(k+1)%8,(i+1)*8+(k+1)%8,(i+1)*8+k)for i in range(len(pts)-1)for k in range(8)]);ob=bpy.data.objects.new('Phone_Cord_Left',me);bpy.data.collections['COL_Interactables'].objects.link(ob);ob.parent=phone;me.materials.append(bpy.data.materials['Phone / oxblood enamel'])
for p in me.polygons:p.use_smooth=True
# A small background plant at the cropped right edge, sharing leaf geometry.
source=bpy.data.objects['Root_plant'];background=bpy.data.objects.new('Root_background_plant',None);bpy.data.collections['COL_Workspace'].objects.link(background);background.location=(.92,.47,.02);background.scale=(1.9,)*3
for child in source.children:
 clone=child.copy();clone.data=child.data;clone.name='Background_'+child.name;bpy.data.collections['COL_Workspace'].objects.link(clone);clone.parent=background
bpy.ops.wm.save_as_mainfile(filepath=str(R/'blender/scene-realism.blend'))
print('Reference layout aligned; variegated foliage and visibly coiled left cord added.')
