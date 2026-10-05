"""Render a physically aligned Hack Atlantic checkpoint from the saved assets."""
import bpy, math, json, os
from mathutils import Vector
from bpy_extras.object_utils import world_to_camera_view

ROOT = '/Users/daxmanuel/Documents/ChatGPT/portfolio-site-blender'
OUT = ROOT + '/design/figma-assets/hack-docked'
os.makedirs(OUT, exist_ok=True)
bpy.ops.wm.open_mainfile(filepath=ROOT+'/blender/portfolio-elements-with-macbook.blend')
sc=bpy.data.scenes.new('Hack Atlantic — MacBook on branded desk')
bpy.context.window.scene=sc
station=bpy.data.collections['Station_HackAtlantic']
hero=bpy.data.collections['COL_MacBook_Export']
sc.collection.children.link(station)
sc.collection.children.link(hero)
bpy.data.objects['HackAtlantic_Root'].location=(0,0,0)
root=bpy.data.objects['MacBook_TravelRoot']
hinge=bpy.data.objects['MacBook_LidPivot']
for o in hero.objects:o.animation_data_clear()
root.location=(0,-.045,0)
hinge.rotation_euler.x=math.radians(2)
bpy.context.view_layer.update()
base=bpy.data.objects['MacBook_BaseGroup']
base_pts=[o.matrix_world@v.co for o in base.children_recursive if o.type=='MESH' for v in o.data.vertices]
table=bpy.data.objects['HackAtlantic_Desktop']
table_top=max((table.matrix_world@Vector(c)).z for c in table.bound_box)
root.location.z=table_top-min(v.z for v in base_pts)+.0001
screen=bpy.data.objects['MacBook_Screen']
mat=bpy.data.materials.new('MAT_Hack_Dark_Display');mat.use_nodes=True
bsdf=next(n for n in mat.node_tree.nodes if n.type=='BSDF_PRINCIPLED')
bsdf.inputs['Base Color'].default_value=(.008,.013,.012,1)
bsdf.inputs['Roughness'].default_value=.26
screen.data=screen.data.copy();screen.data.materials.clear();screen.data.materials.append(mat)
bpy.context.view_layer.update()
pts=[o.matrix_world@v.co for o in sc.objects if o.type=='MESH' for v in o.data.vertices]
lo=Vector([min(v[i] for v in pts) for i in range(3)])
hi=Vector([max(v[i] for v in pts) for i in range(3)])
center=(lo+hi)/2
camera_data=bpy.data.cameras.new('CAM_Hack_Docked')
camera_data.type=next(e.identifier for e in camera_data.bl_rna.properties['type'].enum_items if e.identifier=='ORTHO')
cam=bpy.data.objects.new('CAM_Hack_Docked',camera_data);sc.collection.objects.link(cam);sc.camera=cam
cam.location=center+Vector((.65,-2,1.05)).normalized()*10
cam.rotation_euler=(center-cam.location).to_track_quat('-Z','Y').to_euler()
bpy.context.view_layer.update()
pp=[cam.matrix_world.inverted()@v for v in pts]
aspect=1280/960
camera_data.ortho_scale=max(max(v.x for v in pp)-min(v.x for v in pp),(max(v.y for v in pp)-min(v.y for v in pp))*aspect)*1.13
# Center the projected silhouette instead of the world-space bounding box.
cam.location+=cam.rotation_euler.to_matrix()@Vector(((min(v.x for v in pp)+max(v.x for v in pp))/2,(min(v.y for v in pp)+max(v.y for v in pp))/2,0))
for name,loc,power,color,size in [('Key',(-3,-4,5),550,(1,.77,.53),4),('Fill',(3,-4,3),250,(.78,.84,1),4),('Rim',(1,3,4),700,(1,.65,.33),3)]:
    data=bpy.data.lights.new('LGT_Hack_'+name,'AREA');data.energy=power;data.color=color;data.size=size
    light=bpy.data.objects.new(data.name,data);sc.collection.objects.link(light);light.location=loc
    light.rotation_euler=(Vector((0,0,.8))-light.location).to_track_quat('-Z','Y').to_euler()
sc.world=bpy.data.worlds.new('World_Hack_Warm');sc.world.use_nodes=True
bg=next(n for n in sc.world.node_tree.nodes if n.type=='BACKGROUND');bg.inputs[0].default_value=(.19,.21,.24,1);bg.inputs[1].default_value=.35
try:sc.render.engine='CYCLES'
except TypeError:pass
sc.cycles.samples=32;sc.cycles.use_denoising=True
sc.render.resolution_x=1280;sc.render.resolution_y=960;sc.render.resolution_percentage=100
sc.render.film_transparent=True
settings=sc.render.image_settings
settings.file_format=next(e.identifier for e in settings.bl_rna.properties['file_format'].enum_items if e.identifier=='PNG')
settings.color_mode=next(e.identifier for e in settings.bl_rna.properties['color_mode'].enum_items if e.identifier=='RGBA')
sc.view_settings.view_transform='AgX'
sc.render.fps=60
def render(name):
    sc.render.filepath=OUT+'/'+name+'.png'
    bpy.ops.render.render(write_still=True)
render('open-108')
base_pts=[o.matrix_world@v.co for o in base.children_recursive if o.type=='MESH' for v in o.data.vertices]
audit={'table_top_m':table_top,'feet_bottom_m':min(v.z for v in base_pts),'macbook_width_m':max(v.x for v in base_pts)-min(v.x for v in base_pts),'desk_width_m':table.dimensions.x,'opening_degrees':108,'root_position':list(root.location)}
with open(OUT+'/placement.json','w') as f:json.dump(audit,f,indent=2)
bpy.ops.wm.save_as_mainfile(filepath=ROOT+'/blender/hack-atlantic-docked.blend')
print('PLACEMENT',json.dumps(audit),flush=True)
