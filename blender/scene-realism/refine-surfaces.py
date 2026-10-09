import bpy,bmesh,math,numpy as np
from pathlib import Path
from mathutils import Vector
R=Path('/Users/daxmanuel/Documents/ChatGPT/portfolio-site-blender');T=R/'design/scene-realism/textures';s=bpy.context.scene
# Fix inward-facing imported body faces before placing readable race markings.
for o in bpy.data.objects['Root_car'].children_recursive:
 if o.type=='MESH':
  bm=bmesh.new();bm.from_mesh(o.data);bmesh.ops.recalc_face_normals(bm,faces=list(bm.faces));bm.to_mesh(o.data);bm.free()
root=bpy.data.objects['Root_car'];nose=bpy.data.objects['FSAE_Nose'];label=bpy.data.objects['FSAE_Number_Nose'];label.location=(-.085,-.94,.35);label.data.size=.20
# Conform editable text to the nose surface with a non-destructive shrinkwrap.
for name in ['FSAE_Number_Nose','FSAE_Original_Decal.001']:
 o=bpy.data.objects[name];o.location.z=.65
 mod=o.modifiers.get('Conform to carbon') or o.modifiers.new('Conform to carbon','SHRINKWRAP');mod.target=nose;mod.wrap_method='PROJECT';mod.use_project_z=True;mod.use_negative_direction=True;mod.use_positive_direction=False;mod.offset=.002
for name in ['FSAE_Number_Side','FSAE_Number_Side.001']:
 o=bpy.data.objects[name];o.location.y=.08;o.location.z=.215
# The wing endplate labels face outwards.
for name in ['FSAE_Wing_E01','FSAE_Wing_E01.001']:
 o=bpy.data.objects[name];o.location.y=1.20;o.location.z=.715
# Tangent-space carbon weave normal and roughness, generated original tile.
N=512;y,x=np.mgrid[0:N,0:N];u=x/16;v=y/16;alternate=(np.floor(u)+np.floor(v))%2;wave=np.where(alternate==0,np.sin(u*math.pi*2),np.sin(v*math.pi*2));height=.10*wave+.025*np.sin((x+y)*math.pi/2);dy,dx=np.gradient(height);norm=np.stack([-dx*1.5,-dy*1.5,np.ones_like(dx)],axis=2);norm/=np.linalg.norm(norm,axis=2)[:,:,None]
def save_image(name,rgb):
 im=bpy.data.images.get(name) or bpy.data.images.new(name,N,N,alpha=False);im.colorspace_settings.name='Non-Color';rgba=np.dstack([rgb,np.ones((N,N))]).astype(np.float32);im.pixels.foreach_set(rgba.ravel());im.filepath_raw=str(T/(name+'.png'));im.file_format='PNG';im.update();im.save();return im
normal=save_image('carbon-normal',norm*.5+.5);rough=save_image('carbon-roughness',np.repeat((.36+.065*wave)[:,:,None],3,axis=2))
m=bpy.data.materials['MAT_Car_CarbonComposite'];p=next(n for n in m.node_tree.nodes if n.type=='BSDF_PRINCIPLED');ns=m.node_tree.nodes;uv=ns.new('ShaderNodeTexCoord');mapping=ns.new('ShaderNodeMapping');mapping.inputs['Scale'].default_value=(5,5,5);m.node_tree.links.new(uv.outputs['UV'],mapping.inputs['Vector'])
for im,socket in [(normal,'Normal'),(rough,'Roughness')]:
 tex=ns.new('ShaderNodeTexImage');tex.image=im;m.node_tree.links.new(mapping.outputs['Vector'],tex.inputs['Vector'])
 if socket=='Normal':
  nn=ns.new('ShaderNodeNormalMap');nn.inputs['Strength'].default_value=.24;m.node_tree.links.new(tex.outputs['Color'],nn.inputs['Color']);m.node_tree.links.new(nn.outputs['Normal'],p.inputs['Normal'])
 else:m.node_tree.links.new(tex.outputs['Color'],p.inputs[socket])
# Raise the cropped chair back toward the reference and strengthen the warm wall pool.
bpy.data.objects['Root_chair'].location.z=.17
if not bpy.data.objects.get('Wall_Pool'):
 ld=bpy.data.lights.new('Wall_Pool','AREA');lo=bpy.data.objects.new('Wall_Pool',ld);bpy.data.collections['COL_Lighting'].objects.link(lo);lo.location=(.1,.80,1.7);lo.rotation_euler=(Vector((.1,1.55,1.5))-lo.location).to_track_quat('-Z','Y').to_euler();ld.energy=35;ld.color=(1,.78,.52);ld.shape='DISK';ld.size=1.4
bpy.ops.wm.save_as_mainfile(filepath=str(R/'blender/scene-realism.blend'))
print('Normals, carbon maps, race-marking placement, chair height and warm wall light refined.')
