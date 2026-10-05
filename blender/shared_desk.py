import bpy, json
from pathlib import Path
ROOT=Path('/Users/daxmanuel/Documents/ChatGPT/portfolio-site-blender')
OUT=ROOT/'exports/shared-desk';OUT.mkdir(exist_ok=True)
sc=bpy.data.scenes.new('Completion — Shared Resume Contact')
bpy.context.window.scene=sc
col=bpy.data.collections.new('COL_Shared_Resume_Contact');sc.collection.children.link(col)
sc.world=bpy.data.scenes['Completion — Resume'].world
sc.render.engine=bpy.data.scenes['Completion — Resume'].render.engine
sc.render.resolution_x=1440;sc.render.resolution_y=960;sc.render.resolution_percentage=100
sc.render.fps=30;sc.frame_start=1;sc.frame_end=61

def copy_tree(name,location=None):
 old=bpy.data.objects[name];mapping={}
 for o in [old]+list(old.children_recursive):
  n=o.copy();n.animation_data_clear();n.name='Shared_'+o.name;col.objects.link(n);mapping[o]=n
 for o,n in mapping.items():
  n.parent=mapping.get(o.parent);n.matrix_parent_inverse=o.matrix_parent_inverse.copy()
 root=mapping[old]
 if location is not None:root.location=location
 return root,list(mapping.values())

table,obs=copy_tree('Resume_Desk_Station')
table.scale.x*=1.5;table.location.x=-.9
copy_tree('Resume_Prop_Printer',(.36,.14,.74))
copy_tree('Resume_MacBook_TravelRoot',(-.64,.045,.749483764))
copy_tree('Contact_Notebook_Open',(-.22,-.16,.74))
copy_tree('Contact_Prop_RotaryTelephone',(-.22,.15,.74))
copy_tree('Contact_Pen_ContactOrigin',(-.16,-.218,.7481))
# Static sheet is used for review renders; the browser keeps the existing morph feed.
sheet,_=copy_tree('Resume_Resume_Page',(.36,-.12,.742))
for o in [sheet]+list(sheet.children_recursive):o.hide_render=False;o.hide_viewport=False
for name in ['Resume_Key','Resume_Fill','Resume_Rim']:copy_tree(name)

def camera(name,x,y,width):
 data=bpy.data.cameras.new(name);data.type=bpy.data.scenes['Completion — Resume'].camera.data.type;data.ortho_scale=width
 o=bpy.data.objects.new(name,data);col.objects.link(o);o.location=(x,y,2);o.rotation_euler=(0,0,0);return o
resume=camera('CAM_Shared_Resume_Birdseye',.36,-.12,.45)
contact=camera('CAM_Shared_Contact_Birdseye',-.22,-.16,.48)
wide=camera('CAM_Shared_Overhead',0,0,1.9)
animated=camera('CAM_Shared_Switch',.36,-.12,.45)
for frame,pose in [(1,resume),(16,resume),(24,wide),(29,wide),(37,contact),(61,contact)]:
 animated.location=pose.location;animated.keyframe_insert('location',frame=frame)
 animated.data.ortho_scale=pose.data.ortho_scale;animated.data.keyframe_insert('ortho_scale',frame=frame)
sc.camera=animated;sc.frame_set(16)
bpy.context.view_layer.update()
# Capture source metadata for the web's shared world position.
meta={'origin':[10,0,0],'resume':{'x':.36,'y':-.12,'width':.45},'contact':{'x':-.22,'y':-.16,'width':.48},'overview':{'x':0,'y':0,'width':1.9}}
(OUT/'layout.json').write_text(json.dumps(meta,indent=2))
bpy.ops.object.select_all(action='DESELECT')
for o in sc.objects:
 if o.type not in ('LIGHT','CAMERA') and 'Resume_Page' not in o.name:
  o.hide_set(False);o.select_set(True)
import io_scene_gltf2
assert 'GLB' in {x[0] for x in io_scene_gltf2.get_format_items(None,bpy.context)}
bpy.ops.export_scene.gltf(filepath=str(OUT/'station-shared.glb'),export_format='GLB',use_selection=True,use_active_scene=True,export_animations=False,export_extras=True,export_yup=True,export_cameras=False,export_lights=False)
bpy.ops.wm.save_as_mainfile(filepath=str(ROOT/'blender/portfolio-shared-desk.blend'))
for area in bpy.context.screen.areas:
 if area.type=='VIEW_3D':
  area.spaces.active.region_3d.view_perspective='CAMERA'
print('Shared table created and saved; overhead switch frames 16–37.')
