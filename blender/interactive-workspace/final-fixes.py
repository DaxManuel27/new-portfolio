import bpy,math,io,contextlib,json
from pathlib import Path
from mathutils import Vector
R=Path('/Users/daxmanuel/Documents/ChatGPT/portfolio-site-blender');out=R/'exports/interactive-workspace';s=bpy.data.scenes['Interactive Workspace'];bpy.context.window.scene=s;s.frame_set(1)
C=bpy.data.collections['COL_Interactables'];phone=bpy.data.objects['Root_phone']
# Put the center artwork above the small mechanical center pin, like a real paper insert.
card=bpy.data.objects['Prop_RotaryTelephone.CentreCard'];verts=[(0,0,.0008)]+[(.0188*math.cos(i*2*math.pi/64),.0188*math.sin(i*2*math.pi/64),.0008) for i in range(64)]
d=bpy.data.meshes.new('Phone_CenterLabel');d.from_pydata(verts,[],[(0,i+1,(i+1)%64+1) for i in range(64)]);d.materials.append(bpy.data.materials['Artwork / CentreCard']);uv=d.uv_layers.new()
for p in d.polygons:
 for li in p.loop_indices:
  v=d.vertices[d.loops[li].vertex_index].co;uv.data[li].uv=(v.x/.0376+.5,v.y/.0376+.5)
o=bpy.data.objects.new('Phone_CenterLabel',d);C.objects.link(o);o.parent=card
# A flexible tail connects the existing coiled lead to the receiver.
control=[Vector(p) for p in [(.160,-.095,.014),(.21,-.01,.025),(.13,.10,.07),(.035,.073,.135)]]
verts=[];weights=[];rings=40;sides=8
for i in range(rings+1):
 t=i/rings;p=(1-t)**3*control[0]+3*t*(1-t)**2*control[1]+3*t*t*(1-t)*control[2]+t**3*control[3]
 for j in range(sides):
  a=2*math.pi*j/sides;verts.append(tuple(p+Vector((math.cos(a)*.002,0,math.sin(a)*.002))));weights.append(t*t*(3-2*t))
faces=[(i*sides+j,i*sides+(j+1)%sides,(i+1)*sides+(j+1)%sides,(i+1)*sides+j) for i in range(rings) for j in range(sides)]
d=bpy.data.meshes.new('Phone_FlexibleLead');d.from_pydata(verts,[],faces);d.materials.append(bpy.data.materials['Phone / oxblood enamel']);o=bpy.data.objects.new('Phone_FlexibleLead',d);C.objects.link(o);o.parent=phone
for p in d.polygons:p.use_smooth=True
o.shape_key_add(name='Basis');key=o.shape_key_add(name='ReceiverRaised')
for v,w in zip(key.data,weights):v.co.z+=.12*w
key.value=0;key.keyframe_insert(data_path='value',frame=1);key.value=1;key.keyframe_insert(data_path='value',frame=25)
ad=d.shape_keys.animation_data;a=ad.action;a.name='Phone_Lead_Flex';tr=ad.nla_tracks.new();tr.name='Phone_Receiver_Lift';st=tr.strips.new(a.name,1,a);ad.action=None
k=bpy.data.objects['Resume_PaperFeed_Sheet_Local'].data.shape_keys;k.animation_data.action=None
for t in k.animation_data.nla_tracks:
 t.mute=False
 for st in t.strips:st.influence=1
s.frame_set(1)
for name,obs in [('workspace',[o for o in s.objects if o.type not in ('CAMERA','LIGHT') and o.name!='Stage'])]+[(name,[bpy.data.objects['Root_'+name]]+list(bpy.data.objects['Root_'+name].children_recursive)) for name in ['phone','printer']]:
 bpy.ops.object.select_all(action='DESELECT')
 for o in obs:o.select_set(True)
 with contextlib.redirect_stdout(io.StringIO()):bpy.ops.export_scene.gltf(filepath=str(out/(name+'-source.glb')),export_format='GLB',use_selection=True,use_active_scene=True,export_apply=True,export_animations=True,export_animation_mode='NLA_TRACKS',export_frame_range=False,export_force_sampling=True,export_anim_slide_to_zero=True,export_extras=True,export_yup=True,export_cameras=False,export_lights=False)
s.camera=bpy.data.objects['Camera_Overview'];s.frame_set(1)
bpy.ops.file.pack_all();bpy.ops.wm.save_as_mainfile(filepath=str(R/'blender/interactive-workspace.blend'))
print('phone lead and printer clip corrected')
