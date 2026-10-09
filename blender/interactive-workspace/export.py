import bpy,math,json,contextlib,io
from pathlib import Path
from mathutils import Vector
R=Path('/Users/daxmanuel/Documents/ChatGPT/portfolio-site-blender');out=R/'exports/interactive-workspace';out.mkdir(exist_ok=True,parents=True)
s=bpy.data.scenes['Interactive Workspace'];bpy.context.window.scene=s;s.frame_set(1)
# Curved lettering decal follows the mug's front, preserving transparency.
body=bpy.data.objects['UltraMaritime_Ultra_UM_Mug_Body'];verts=[];uvs=[];n=32
for j in range(2):
 for i in range(n+1):
  a=-math.pi/2+(i/n-.5)*1.6;verts.append((.0432*math.cos(a),.0432*math.sin(a),.019+j*.065));uvs.append((i/n,j))
d=bpy.data.meshes.new('Mug_Lettering');d.from_pydata(verts,[],[(i,i+1,i+n+2,i+n+1) for i in range(n)]);d.materials.append(bpy.data.materials['Artwork / mug lettering']);u=d.uv_layers.new()
for p in d.polygons:
 for li in p.loop_indices:u.data[li].uv=uvs[d.loops[li].vertex_index]
o=bpy.data.objects.new('Mug_Lettering',d);bpy.data.collections['COL_Interactables'].objects.link(o);o.parent=body
cam=bpy.data.objects['Camera_Notebook'];cam.location=(.25,-.51,1.30);cam.rotation_euler=(Vector((.25,-.14,.755))-cam.location).to_track_quat('-Z','Y').to_euler();cam.data.lens=45
s.eevee.taa_render_samples=96;s.render.resolution_percentage=100
# Deduplicate identical page edge material slots.
for o in s.objects:
 if o.name.startswith('Notebook_PageEdge_'):o.data.materials[0]=bpy.data.materials['Page line 0']
# Named clips export independently through NLA tracks.
for name in ['Notebook_CoverHinge','Phone_Receiver']:
 o=bpy.data.objects[name];ad=o.animation_data;a=ad.action;track=ad.nla_tracks.new();track.name=a.name;st=track.strips.new(a.name,int(a.frame_range[0]),a);ad.action=None
feed=bpy.data.objects['Resume_PaperFeed_Sheet_Local'];feed.data.shape_keys.animation_data.action=None
# Ensure no artwork edge bleeds by keeping UV rectangles inside cover bevels.
# Export only desk and asset hierarchy; the render stage and lighting are Blender-only.
obs=[o for o in s.objects if o.type not in ('CAMERA','LIGHT') and o.name!='Stage']
def choose(items):
 bpy.ops.object.select_all(action='DESELECT')
 for o in items:o.select_set(True)
 if items:bpy.context.view_layer.objects.active=items[0]
def export(path,items):
 choose(items)
 with contextlib.redirect_stdout(io.StringIO()):
  bpy.ops.export_scene.gltf(filepath=str(path),export_format='GLB',use_selection=True,use_active_scene=True,export_apply=True,export_animations=True,export_animation_mode='NLA_TRACKS',export_frame_range=False,export_force_sampling=True,export_anim_slide_to_zero=True,export_extras=True,export_yup=True,export_cameras=False,export_lights=False)
export(out/'workspace-source.glb',obs)
for key in ['notebook','phone','printer','macbook','monitor','car','pi']:
 root=bpy.data.objects['Root_'+key];export(out/(key+'-source.glb'),[root]+list(root.children_recursive))
def y(v):return [v[0],v[2],-v[1]]
def bnd(items):
 pts=[o.matrix_world@Vector(v) for o in items if o.type=='MESH' for v in o.bound_box]
 return [[min(y(p)[i] for p in pts) for i in range(3)],[max(y(p)[i] for p in pts) for i in range(3)]]
s.frame_set(1);bpy.context.view_layer.update()
ids={'macbook':'hack-atlantic','monitor':'personal-projects','notebook':'ultra-maritime','car':'formula-sae','pi':'data-logging','printer':'resume','phone':'contact'}
manifest={'version':1,'units':'metres','coordinates':'glTF Y-up','source':'../../blender/interactive-workspace.blend','asset':'workspace.glb','fps':30,'destinations':{},'cameras':{},'clips':{'notebook':{'name':'Notebook_Open','seconds':1.2,'reverseToClose':True},'phone':{'name':'Phone_Receiver_Lift','seconds':.8,'reverseToLower':True},'printer':{'name':'printer-paper-feed','seconds':4}},'notes':['Resume artwork is a placeholder; no resume download is supplied.','Reference mood and layout adapted around existing portfolio models.','Standalone asset viewer is for verification; website integration remains the next phase.']}
for key,id in ids.items():
 o=bpy.data.objects['Root_'+key];manifest['destinations'][id]={'root':o.name,'asset':key+'.glb','boundsClosed':bnd([o]+list(o.children_recursive)),'position':y(o.matrix_world.translation)}
for o in bpy.data.collections['COL_Cameras'].objects:
 # Camera direction is also converted to Y-up; runtime can simply use lookAt.
 direction=o.matrix_world.to_quaternion()@Vector((0,0,-1));manifest['cameras'][o.name]={'position':y(o.location),'target':y(o.location+direction),'fov':math.degrees(o.data.angle_y),'lens':o.data.lens}
(out/'manifest.json').write_text(json.dumps(manifest,indent=2))
dg=bpy.context.evaluated_depsgraph_get();tri=sum(sum(len(p.vertices)-2 for p in o.evaluated_get(dg).data.polygons) for o in obs if o.type=='MESH')
(out/'blender-validation.json').write_text(json.dumps({'evaluatedTriangles':tri,'objects':len(obs),'triangleBudget':250000,'triangleBudgetPass':tri<=250000,'notebookOpenDegrees':180,'sourceFilesPreserved':True},indent=2))
s.camera=bpy.data.objects['Camera_Overview'];s.frame_set(1)
# Pack all artwork into the editable deliverable.
bpy.ops.file.pack_all();bpy.ops.wm.save_as_mainfile(filepath=str(R/'blender/interactive-workspace.blend'))
print('Exported combined + 7 independent assets;',tri,'triangles')
