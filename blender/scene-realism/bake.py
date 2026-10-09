import bpy,math,json
from pathlib import Path
from mathutils import Vector
R=Path('/Users/daxmanuel/Documents/ChatGPT/portfolio-site-blender');out=R/'blender/scene-realism';s=bpy.context.scene
# Layout refinement from reference comparison.
top=bpy.data.objects['Desk_Top.001'] if bpy.data.objects.get('Desk_Top.001') else next(o for o in s.objects if o.name.startswith('Desk_Top'))
top.scale.y=1.17
bpy.data.objects['Root_macbook'].location.x=-.025
bpy.data.objects['Root_printer'].location.y=.43;bpy.data.objects['Root_printer'].scale=(1.10,)*3
bpy.data.objects['Root_plant'].location.y=.35;bpy.data.objects['Root_mug'].location.y=.30
bpy.data.objects['Root_chair'].location.z=.09
# Unique UV1, one padded cell per box face. Bevels retain interpolated UVs.
baked=[]
for o in list(s.objects):
 if o.type!='MESH' or not (o.name.startswith(('Desk_','Cabinet_','Chair_')) or o.name=='Wall'):continue
 if len(o.data.polygons)!=6:continue
 o.data=o.data.copy();base=o.data.uv_layers.active or o.data.uv_layers.new(name='UVMap');uv=o.data.uv_layers.new(name='LightmapUV')
 for index,p in enumerate(o.data.polygons):
  coords=[o.data.vertices[o.data.loops[li].vertex_index].co for li in p.loop_indices];normal=p.normal;axes=sorted(range(3),key=lambda a:abs(normal[a]))[:2];a,b=axes;lo=[min(v[k] for v in coords) for k in (a,b)];hi=[max(v[k] for v in coords) for k in (a,b)];cx=index%3;cy=index//3
  for li,v in zip(p.loop_indices,coords):
   u=(v[a]-lo[0])/max(1e-8,hi[0]-lo[0]);w=(v[b]-lo[1])/max(1e-8,hi[1]-lo[1]);uv.data[li].uv=((cx+.06+u*.88)/3,(cy+.06+w*.88)/2);base.data[li].uv=(u,w)
 o.data.uv_layers.active=uv
 # Unique material bake target, preserving the PBR source shading.
 for i,m in enumerate(o.data.materials):
  copy=m.copy();copy.name=m.name+' / '+o.name;o.data.materials[i]=copy
 size=1024 if o==top or o.name=='Wall' else 256
 im=bpy.data.images.new('LM_'+o.name,width=size,height=size,alpha=False);im.filepath_raw=str(out/('LM_'+o.name+'.png'));im.file_format='PNG'
 for m in o.data.materials:
  n=m.node_tree.nodes.new('ShaderNodeTexImage');n.image=im;m.node_tree.nodes.active=n;n.select=True
 bpy.ops.object.select_all(action='DESELECT');o.select_set(True);bpy.context.view_layer.objects.active=o
 s.cycles.samples=16;s.render.bake.use_pass_direct=True;s.render.bake.use_pass_indirect=True;s.render.bake.use_pass_color=False;s.render.bake.margin=8
 bpy.ops.object.bake(type='DIFFUSE');im.save();o['lightmap']=im.name+'.png';baked.append({'object':o.name,'texture':im.name+'.png','uvChannel':1,'size':size})
 o.data.uv_layers.active=base
(out/'lightmaps.json').write_text(json.dumps(baked,indent=2));s.cycles.samples=48;s.render.resolution_percentage=100;s.render.filepath=str(out/'geometry-lighting.png');bpy.ops.wm.save_as_mainfile(filepath=str(R/'blender/scene-realism.blend'));bpy.ops.render.render(write_still=True)
print('baked',len(baked),'separate static irradiance maps')
