"""Run through Blender MCP after importing the supplied GLB into MacBook M5 Inspection."""
import bpy, math, os, json
from mathutils import Vector, Matrix
BASE=os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
scene=bpy.data.scenes['MacBook M5 Inspection']
bpy.context.window.scene=scene
bpy.context.view_layer.update()
meshes=[o for o in scene.objects if o.type=='MESH']
old=bpy.data.scenes.get('MacBook Hero')
if old:
    old.name='MacBook Hero Previous'
    for o in old.objects:o.name='Previous_'+o.name
oldcoll=bpy.data.collections.get('COL_MacBook_Export')
if oldcoll:oldcoll.name='COL_MacBook_Previous'
scene.name='MacBook Hero'
asset=bpy.data.collections.new('COL_MacBook_Export');scene.collection.children.link(asset)
studio=bpy.data.collections.new('COL_MacBook_Review_M5');scene.collection.children.link(studio)

def empty(name,parent=None,loc=(0,0,0)):
    o=bpy.data.objects.new(name,None);asset.objects.link(o);o.parent=parent;o.location=loc;o.empty_display_size=.025;return o

travel=empty('MacBook_TravelRoot');spin=empty('MacBook_SpinPivot',travel)
base=empty('MacBook_BaseGroup',spin);hinge=empty('MacBook_LidPivot',spin,(0,.109,.0006))
hinge['opening_formula']='rotation.x = radians(110 - openingDegrees)'
hinge['supplied_opening_degrees']=110
travel['source']='User-supplied macbook-pro-14-inch-m5/source/macbook_pro_14_inch_M5.glb'
travel['units']='meters'
lid_names=set(o.name for o in bpy.data.objects['RcexTyyhpuJYATQ'].children_recursive if o.type=='MESH')
screen=None
for o in meshes:
    original=o.name;world=o.matrix_world.copy()
    moving=original in lid_names
    target=hinge if moving else base
    # Bake source orientation and centimeter scale into the mesh; keep UVs and materials.
    o.data=o.data.copy()
    o.data.transform(Matrix.Translation(-hinge.location)@world if moving else world)
    o.parent=target;o.matrix_parent_inverse=Matrix.Identity(4);o.matrix_basis=Matrix.Identity(4)
    for c in list(o.users_collection):c.objects.unlink(o)
    asset.objects.link(o)
    o['source_mesh']=original
    if original=='tfTbkkzhxqpKRgC':o.name='MacBook_Screen';screen=o
    else:o.name='SM_M5_'+('Lid_' if moving else 'Base_')+original
for o in list(scene.objects):
    if o.type=='EMPTY' and o not in (travel,spin,base,hinge):bpy.data.objects.remove(o,do_unlink=True)
assert screen is not None
screen['content_note']='Native display UVs preserved; replace this mesh material for portfolio content.'
scene.unit_settings.system='METRIC';scene.unit_settings.scale_length=1
scene.render.fps=30;scene.frame_start=1;scene.frame_end=91
for frame,angle in ((1,0),(31,108),(61,108),(91,0)):
    hinge.rotation_euler.x=math.radians(110-angle);hinge.keyframe_insert(data_path='rotation_euler',frame=frame)
hinge.animation_data.action.name='MacBook_Lid_OpenClose_M5'
for f,name in ((1,'Closed'),(31,'Open 108 degrees'),(61,'Read'),(91,'Closed')):scene.timeline_markers.new(name,frame=f)
scene.frame_set(31)
# Reuse the accepted studio without sharing its camera transforms.
previous=bpy.data.scenes.get('MacBook Hero Previous')
for src in previous.objects:
    if src.type not in ('LIGHT','CAMERA'):continue
    o=src.copy();o.data=src.data.copy();o.name=src.name.replace('Previous_','')+'_M5';studio.objects.link(o)
    if o.type=='CAMERA':scene.camera=o
scene.world=previous.world.copy()
try:scene.render.engine='CYCLES'
except TypeError:pass
scene.cycles.samples=48;scene.cycles.use_denoising=True
scene.render.resolution_x=1200;scene.render.resolution_y=1000;scene.render.resolution_percentage=100
scene.render.image_settings.file_format='PNG'
for img in {n.image for o in meshes for m in o.data.materials if m and m.use_nodes for n in m.node_tree.nodes if n.type=='TEX_IMAGE' and n.image}:img.pack()
for area in bpy.context.screen.areas:
    if area.type=='VIEW_3D':
        area.spaces.active.region_3d.view_location=Vector((0,.02,.08));area.spaces.active.region_3d.view_distance=.7;area.spaces.active.region_3d.view_rotation=scene.camera.rotation_euler.to_quaternion();area.spaces.active.shading.type='MATERIAL'
print(json.dumps({'meshes':len(meshes),'lid_parts':len(lid_names),'screen':screen.name,'source_materials':len({m.name for o in meshes for m in o.data.materials})}))
