"""Build the approved physical download key; runtime controls its visibility."""
import bpy
from pathlib import Path
from mathutils import Matrix
R=Path(__file__).resolve().parents[2]
old=bpy.data.objects.get('Root_printer_download')
if old:
 for o in list(old.children_recursive)+[old]:bpy.data.objects.remove(o,do_unlink=True)
col=bpy.data.collections['COL_Interactables']
def empty(name,parent,position):
 o=bpy.data.objects.new(name,None);col.objects.link(o);o.parent=parent;o.matrix_world=Matrix.Translation(position);return o
def material(name,color):
 m=bpy.data.materials.get(name) or bpy.data.materials.new(name);m.use_nodes=True;p=m.node_tree.nodes.get('Principled BSDF');p.inputs['Base Color'].default_value=(*color,1);p.inputs['Roughness'].default_value=.62;return m
def box(name,loc,size,parent,mat,bevel):
 bpy.ops.mesh.primitive_cube_add(size=1,location=loc);o=bpy.context.object;o.name=name;o.dimensions=size;bpy.ops.object.transform_apply(location=False,rotation=False,scale=True);world=o.matrix_world.copy();o.parent=parent;o.matrix_world=world;o.data.materials.append(mat)
 mod=o.modifiers.new('Soft molded edges','BEVEL');mod.width=bevel;mod.segments=3
 mod=o.modifiers.new('Weighted normals','WEIGHTED_NORMAL');return o
root=empty('Root_printer_download',bpy.data.objects['Root_printer'],(.85,.461,.878))
root['resumeOnly']=True
socket=material('MAT_PrinterKey_Socket',(.13,.15,.13));capmat=material('MAT_PrinterKey_Cap',(.0296,.0437,.0382));rim=material('MAT_PrinterKey_Rim',(.19,.22,.19))
box('PrinterKey_Surround',(.85,.461,.8789),(.078,.029,.0018),root,rim,.002)
box('PrinterKey_Recess',(.85,.461,.8797),(.075,.026,.001),root,socket,.0016)
cap=empty('Root_printer_download_cap',root,(.85,.461,.8805))
box('PrinterKey_Cap',(.85,.461,.8807),(.072,.024,.0026),cap,capmat,.0015)
# Alpha engraving exported from the approved Figma component; UV orientation matches the paper.
m=material('MAT_PrinterKey_Label',(1,1,1));p=m.node_tree.nodes.get('Principled BSDF');t=m.node_tree.nodes.new('ShaderNodeTexImage');t.image=bpy.data.images.load(str(R/'design/scene-realism/textures/printer-download-label.png'),check_existing=True);m.node_tree.links.new(t.outputs['Color'],p.inputs['Base Color']);m.node_tree.links.new(t.outputs['Alpha'],p.inputs['Alpha']);m.surface_render_method='DITHERED'
mesh=bpy.data.meshes.new('PrinterKey_Label');mesh.from_pydata([(-.035,-.0098,.0017),(.035,-.0098,.0017),(.035,.0098,.0017),(-.035,.0098,.0017)],[],[(0,1,2,3)]);uv=mesh.uv_layers.new(name='ArtworkUV')
for loop,xy in zip(uv.data,[(0,0),(1,0),(1,1),(0,1)]):loop.uv=xy
label=bpy.data.objects.new('PrinterKey_Label',mesh);col.objects.link(label);label.parent=cap;mesh.materials.append(m)
bpy.context.view_layer.update();bpy.ops.wm.save_as_mainfile(filepath=str(R/'blender/scene-realism.blend'))
exec((R/'blender/scene-realism/export-preview.py').read_text())
