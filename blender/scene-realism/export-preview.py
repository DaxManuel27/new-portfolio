import bpy,json,contextlib,io,math,shutil
from pathlib import Path
from mathutils import Vector
R=Path('/Users/daxmanuel/Documents/ChatGPT/portfolio-site-blender');out=R/'exports/scene-realism';out.mkdir(exist_ok=True);s=bpy.context.scene;s.frame_set(1)
# Font labels remain editable in the .blend; temporary mesh copies are exported.
labels=[]
for o in list(s.objects):
 if o.type=='FONT':
  n=o.copy();n.data=o.data.copy();s.collection.objects.link(n);bpy.ops.object.select_all(action='DESELECT');n.select_set(True);bpy.context.view_layer.objects.active=n;bpy.ops.object.convert(target='MESH');labels.append(bpy.context.object)
def website_visible(o):
 while o:
  if o.get('websiteHidden',False):return False
  o=o.parent
 return True
obs=[o for o in s.objects if website_visible(o) and o.type not in ('CAMERA','LIGHT','FONT') and o.name!='Stage'];bpy.ops.object.select_all(action='DESELECT')
for o in obs:o.select_set(True)
with contextlib.redirect_stdout(io.StringIO()):bpy.ops.export_scene.gltf(filepath=str(out/'desk-source.glb'),export_format='GLB',use_selection=True,use_active_scene=True,export_apply=True,export_animations=False,export_extras=True,export_yup=True)
for o in labels:bpy.data.objects.remove(o,do_unlink=True)
def y(v):return [v.x,v.z,-v.y]
manifest={'asset':'desk.glb','cameras':{},'destinations':{},'clips':{},'provisional':True}
for o in bpy.data.collections['COL_Cameras'].objects:
 direction=o.matrix_world.to_quaternion()@Vector((0,0,-1));manifest['cameras'][o.name]={'position':y(o.location),'target':y(o.location+direction),'fov':math.degrees(o.data.angle_y)}
for key in ['macbook','monitor','car','phonebook','printer','notebook','resume','pi']:
 o=bpy.data.objects['Root_'+key];manifest['destinations'][key]={'root':o.name,'position':y(o.matrix_world.translation)}
(out/'manifest.json').write_text(json.dumps(manifest,indent=2))
for file in (R/'blender/scene-realism').glob('LM_*.png'):shutil.copy2(file,out/file.name)
shutil.copy2(R/'blender/scene-realism/lightmaps.json',out/'lightmaps.json')
print('exported provisional geometry review')
