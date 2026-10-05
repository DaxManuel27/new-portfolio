import bpy,math,json
from pathlib import Path
from mathutils import Vector
BASE=Path('/Users/daxmanuel/Documents/ChatGPT/portfolio-site-blender')
backup=BASE/'blender/portfolio-elements-before-um-mug.blend'
if not backup.exists():bpy.ops.wm.save_as_mainfile(filepath=str(backup),copy=True)
col=bpy.data.collections['Station_UltraMaritime'];parent=bpy.data.objects['UltraMaritime_Root']
archive=bpy.data.collections.get('COL_Previous_UM_Plaque')
if not archive:
 archive=bpy.data.collections.new('COL_Previous_UM_Plaque');bpy.context.scene.collection.children.link(archive)
archive.hide_render=True;archive.hide_viewport=True
for name in ['Ultra_LogoPlaque','Ultra_OfficialLogo']:
 o=bpy.data.objects.get(name)
 if o:
  for c in list(o.users_collection):c.objects.unlink(o)
  archive.objects.link(o)
def mat(name):
 m=bpy.data.materials.new(name);m.use_nodes=True
 p=next(n for n in m.node_tree.nodes if n.type=='BSDF_PRINCIPLED')
 p.inputs['Base Color'].default_value=(.88,.88,.88,1);p.inputs['Roughness'].default_value=.22;p.inputs['Metallic'].default_value=0
 m.diffuse_color=(.88,.88,.88,1)
 return m,p
white,p=mat('MAT_UM_Mug_WhiteCeramic')
printed,p=mat('MAT_UM_Mug_WhiteCeramic_Logo')
n=printed.node_tree.nodes.new('ShaderNodeTexImage')
n.image=bpy.data.images.load(str(BASE/'assets/textures/um-mug-print.png'),check_existing=True)
if not n.image.packed_file:n.image.pack()
n.extension='EXTEND'
uvn=printed.node_tree.nodes.new('ShaderNodeUVMap');uvn.uv_map='UM_Print'
printed.node_tree.links.new(uvn.outputs['UV'],n.inputs['Vector'])
printed.node_tree.links.new(n.outputs['Color'],p.inputs['Base Color'])
root=bpy.data.objects.new('Ultra_UM_Mug_Root',None);col.objects.link(root);root.parent=parent;root.location=(-.61,-.22,.739)
def mesh(name,vs,fs,materials):
 data=bpy.data.meshes.new(name+'_Mesh');data.from_pydata(vs,[],fs);data.update()
 o=bpy.data.objects.new(name,data);col.objects.link(o);o.parent=root
 for m in materials:data.materials.append(m)
 for f in data.polygons:f.use_smooth=True
 return o
N=96
profile=[(.003,.001),(.033,.001),(.037,.002),(.040,.005),(.041,.014),(.043,.091),(.043,.096),(.0425,.099),(.041,.100),(.0395,.099),(.039,.097),(.039,.092),(.037,.018),(.035,.012),(.031,.009),(.003,.009)]
vs=[(r*math.cos(-1.5*math.pi+math.tau*i/N),r*math.sin(-1.5*math.pi+math.tau*i/N),z) for r,z in profile for i in range(N)]
fs=[(j*N+i,j*N+(i+1)%N,(j+1)*N+(i+1)%N,(j+1)*N+i) for j in range(len(profile)-1) for i in range(N)]
fs.extend([tuple(reversed(range(N))),tuple((len(profile)-1)*N+i for i in range(N))])
body=mesh('Ultra_UM_Mug_Body',vs,fs,[white,printed])
uv=body.data.uv_layers.new(name='UM_Print')
for f in body.data.polygons:
 ring=f.index//N
 f.material_index=1 if 3<=ring<=6 else 0
 for li in f.loop_indices:
  vi=body.data.loops[li].vertex_index;idx=vi%N
  # Front is -Y. Longitude seam sits at rear.
  angle=-math.pi+math.tau*idx/N
  if f.index<N*(len(profile)-1) and f.index%N==N-1 and idx==0:angle=math.pi
  uv.data[li].uv=(.1+.8*(.5+angle/1.45),.1+.8*((vs[vi][2]-.020)/.062))
# Rounded C handle embedded into ceramic near top and bottom.
steps,sides=48,12;vs=[];fs=[]
for j in range(steps+1):
 t=-math.pi/2+math.pi*j/steps
 center=Vector((.037+.034*math.cos(t),0,.053+.032*math.sin(t)))
 tangent=Vector((-.034*math.sin(t),0,.032*math.cos(t))).normalized()
 a=Vector((0,1,0));b=tangent.cross(a).normalized()
 for k in range(sides):
  v=center+.006*(math.cos(k*math.tau/sides)*a+math.sin(k*math.tau/sides)*b);vs.append(tuple(v))
for j in range(steps):
 for k in range(sides):fs.append((j*sides+k,j*sides+(k+1)%sides,(j+1)*sides+(k+1)%sides,(j+1)*sides+k))
fs.extend([tuple(reversed(range(sides))),tuple(steps*sides+k for k in range(sides))])
handle=mesh('Ultra_UM_Mug_Handle',vs,fs,[white])
for a in bpy.context.screen.areas:
 if a.type=='VIEW_3D':
  r=a.spaces.active.region_3d;target=Vector((.39,-.22,.79));eye=target+Vector((.13,-.4,.23));r.view_location=target;r.view_rotation=(target-eye).to_track_quat('-Z','Y');r.view_distance=.42
print(json.dumps({'created':[root.name,body.name,handle.name],'triangles':sum(len(f.vertices)-2 for o in [body,handle] for f in o.data.polygons),'logo_source':n.image.filepath,'backup':str(backup)}))
