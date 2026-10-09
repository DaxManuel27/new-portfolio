"""Run via Blender MCP after web/scripts/export-room.mjs. Preserve the original desk."""
import bpy, math, os, json
from mathutils import Vector
ROOT='/Users/daxmanuel/Documents/ChatGPT/portfolio-site-blender'
bpy.ops.wm.open_mainfile(filepath=ROOT+'/blender/scene-realism.blend')
# Match the supported runtime placement; paper, tray and download key follow their parent.
bpy.data.objects['Root_printer'].location=(.68,.32,.74)
original=set(bpy.data.objects)
bpy.ops.import_scene.gltf(filepath=ROOT+'/exports/room/room-additions.glb')
collection=bpy.data.collections.new('COL_Portfolio_Room_Revision');bpy.context.scene.collection.children.link(collection)
for o in set(bpy.data.objects)-original:
    for c in list(o.users_collection):c.objects.unlink(o)
    collection.objects.link(o)
wall=bpy.data.objects.get('Wall')
if wall:wall.hide_render=True;wall.hide_set(True)
plant=bpy.data.objects.get('Root_background_plant')
if plant:
    for o in list(plant.children_recursive)+[plant]:bpy.data.objects.remove(o,do_unlink=True)
image=bpy.data.images.load(ROOT+'/exports/room/about.png',check_existing=True)
for mat in bpy.data.materials:
    if mat.name.startswith('MAT_Figma_laptop') and mat.use_nodes:
        nodes=mat.node_tree.nodes
        for node in nodes:
            if node.type=='TEX_IMAGE':node.image=image
        bsdf=next((n for n in nodes if n.type=='BSDF_PRINCIPLED'),None)
        if bsdf and 'Emission Strength' in bsdf.inputs:bsdf.inputs['Emission Strength'].default_value=.3
for o in bpy.context.scene.objects:
    if o.type=='LIGHT':
        o.data.use_shadow=o.name=='Lamp_warm_key'
        if o.name=='Key':o.hide_render=True;o.hide_set(True)
        elif o.name=='Fill':o.data.energy=65
        elif o.name=='Rim':o.data.energy=65
        elif o.name=='Wall_Pool':o.data.energy=20
key=bpy.data.objects['Lamp_warm_key']
bpy.context.view_layer.update()
world_position=key.matrix_world.translation.copy()
target=Vector((.1,-.1,.73))
key.parent=None;key.location=world_position;key.rotation_euler=(target-world_position).to_track_quat('-Z','Y').to_euler();key.data.energy=32;key.data.shadow_soft_size=.04
for name,target,energy in [('Picture_light_warm',(.88,1.382,1.05),3),('Room_wall_wash',(-.8,1.51,1.5),35)]:
    light=bpy.data.objects.get(name)
    if light:
        pos=light.matrix_world.translation.copy();light.parent=None;light.location=pos;light.rotation_euler=(Vector(target)-pos).to_track_quat('-Z','Y').to_euler();light.data.energy=energy;light.data.use_shadow=False
scene=bpy.context.scene;cam=bpy.data.objects['Camera_Overview'];scene.camera=cam
cam.location=(.22,-3.6,2);cam.rotation_euler=(Vector((0,.15,1.02))-cam.location).to_track_quat('-Z','Y').to_euler();cam.data.sensor_fit='VERTICAL';cam.data.sensor_height=24;cam.data.lens=24/(2*math.tan(math.radians(33)/2))
scene.render.resolution_x=1440;scene.render.resolution_y=960;scene.render.resolution_percentage=75
engines=[i.identifier for i in scene.render.bl_rna.properties['engine'].enum_items]
eev=next((e for e in engines if 'EEVEE' in e),None)
if eev:scene.render.engine=eev
scene.render.filepath=ROOT+'/exports/room/blender-review.png'
for area in [a for screen in bpy.data.screens for a in screen.areas]:
    if area.type=='VIEW_3D':area.spaces.active.region_3d.view_perspective='CAMERA'
bpy.ops.file.pack_all()
bpy.ops.wm.save_as_mainfile(filepath=ROOT+'/blender/portfolio-room.blend')
print(json.dumps({'file':bpy.data.filepath,'engine':scene.render.engine,'shadow_lights':[o.name for o in scene.objects if o.type=='LIGHT' and o.data.use_shadow and not o.hide_render],'room_objects':len(collection.objects)}))
