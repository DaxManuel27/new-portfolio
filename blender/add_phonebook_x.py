"""Add the approved X contact as Caveat ink on the existing phonebook page."""
import bpy
from pathlib import Path
from mathutils import Vector
from mathutils.bvhtree import BVHTree

ROOT=Path(__file__).resolve().parents[1]
sc=bpy.data.scenes['Completion — Shared Resume Contact'];bpy.context.window.scene=sc
book=bpy.data.objects['Shared_Contact_Notebook_Open'];page=bpy.data.objects[book.name+'.Pages']
name=book.name+'.XContact'
if bpy.data.objects.get(name):bpy.data.objects.remove(bpy.data.objects[name],do_unlink=True)
font=bpy.data.fonts.load(str(ROOT/'assets/fonts/Caveat.ttf'),check_existing=True);font.pack()
curve=bpy.data.curves.new('Phonebook_X_Contact_Lettering','FONT');curve.body='x.com/bydaxmanuel';curve.font=font;curve.size=.012;curve.resolution_u=2
curve.use_fake_user=True
obj=bpy.data.objects.new(name,curve);book.users_collection[0].objects.link(obj)
bpy.context.view_layer.update()
geometry=bpy.data.meshes.new_from_object(obj.evaluated_get(bpy.context.evaluated_depsgraph_get()))
bpy.data.objects.remove(obj,do_unlink=True)
obj=bpy.data.objects.new(name,geometry);book.users_collection[0].objects.link(obj);obj.parent=book
# Match the existing ink's baseline and glyph height, on the next ruled entry.
minimum=min(v.co.y for v in geometry.vertices);maximum=max(v.co.y for v in geometry.vertices)
factor=.0095/(maximum-minimum)
surface=BVHTree.FromObject(page,bpy.context.evaluated_depsgraph_get())
for vertex in geometry.vertices:
    x=-.1255+vertex.co.x*factor;y=-.090+vertex.co.y*factor
    hit,normal,index,distance=surface.ray_cast(Vector((x,y,.05)),Vector((0,0,-1)))
    assert hit is not None,'Contact lettering must remain on the page'
    vertex.co=(x,y,hit.z+.00005)
material=bpy.data.materials.get('MAT_Phonebook_ContactInk') or bpy.data.materials.new('MAT_Phonebook_ContactInk')
material.use_nodes=True
shader=next(node for node in material.node_tree.nodes if node.type=='BSDF_PRINCIPLED')
shader.inputs['Base Color'].default_value=(.0144,.0123,.01,1);shader.inputs['Roughness'].default_value=.85
geometry.materials.append(material)
obj['contact_url']='https://x.com/bydaxmanuel';obj['lettering']='Caveat Regular, matching existing phonebook contacts'
bpy.context.view_layer.update()
bpy.ops.object.select_all(action='DESELECT')
for item in sc.objects:
    if item.type not in ('LIGHT','CAMERA') and not item.hide_render and not any(s in item.name for s in ['Resume_Page','PaperFeed_Review','Cutter']):
        item.hide_set(False);item.select_set(True)
bpy.ops.export_scene.gltf(filepath=str(ROOT/'exports/shared-desk/station-shared.glb'),export_format='GLB',use_selection=True,use_active_scene=True,export_apply=True,export_animations=False,export_extras=True,export_yup=True,export_cameras=False,export_lights=False)
sc.camera=bpy.data.objects['CAM_Shared_Contact_Birdseye']
bpy.ops.wm.save_as_mainfile(filepath=str(ROOT/'blender/portfolio-shared-desk.blend'))
print('Added x.com/bydaxmanuel to phonebook;',len(geometry.polygons),'ink faces;',list(obj.dimensions),'metres')
