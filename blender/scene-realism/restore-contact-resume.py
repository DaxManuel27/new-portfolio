"""Restore the original phonebook and apply the user's supplied PDF to the printer sheet."""
import bpy
from pathlib import Path
from mathutils import Vector
R=Path(__file__).resolve().parents[2]
scene=bpy.context.scene
book=bpy.data.objects.get('Root_phonebook')
if not book:
 with bpy.data.libraries.load(str(R/'blender/portfolio-shared-desk.blend'),link=False) as (source,target):
  target.objects=[n for n in source.objects if n=='Shared_Contact_Notebook_Open' or n.startswith('Shared_Contact_Notebook_Open.')]
 for obj in target.objects:
  if obj:bpy.data.collections['COL_Interactables'].objects.link(obj)
 book=bpy.data.objects['Shared_Contact_Notebook_Open'];book.name='Root_phonebook'
book.location=(.72,-.28,.741);book.rotation_euler=(0,0,0);book.scale=(1,1,1);book['destination']='contact'
for obj in book.children_recursive:
 obj.hide_render=False;obj.hide_set(False)
 if obj.name.endswith('.Pages'):
  material=obj.data.materials[0].copy();material.name='MAT_Contact_Pages';obj.data.materials.clear();obj.data.materials.append(material)
  shader=material.node_tree.nodes.get('Principled BSDF')
  # Restore each map by its socket; lazy library images may not have loaded pixels yet.
  for socket,filename in [('Base Color','figma-completion/notebook-pages.png'),('Roughness','photoreal/paper-roughness.png')]:
   node=shader.inputs[socket].links[0].from_node
   node.image=bpy.data.images.load(str(R/'assets/textures'/filename),check_existing=True)
  normal=shader.inputs['Normal'].links[0].from_node
  normal.inputs['Color'].links[0].from_node.image=bpy.data.images.load(str(R/'assets/textures/photoreal/paper-normal.png'),check_existing=True)
  print('CONTACT_PAGE',obj.name)
paper=bpy.data.objects['Resume_Sheet']
print('RESUME_OLD',tuple(paper.dimensions),[(m.name if m else None) for m in paper.data.materials])
# Retain tray placement; adjust the short dimension to US Letter rather than stretching the PDF.
xs=[v.co.x for v in paper.data.vertices];ys=[v.co.y for v in paper.data.vertices]
width=max(xs)-min(xs);height=max(ys)-min(ys)
ratio=(612/792)/(width/height);mid=(min(xs)+max(xs))/2
for v in paper.data.vertices:v.co.x=mid+(v.co.x-mid)*ratio
material=bpy.data.materials.get('MAT_Resume_PDF') or bpy.data.materials.new('MAT_Resume_PDF');material.use_nodes=True
shader=material.node_tree.nodes.get('Principled BSDF');shader.inputs['Roughness'].default_value=.9
tex=next((n for n in material.node_tree.nodes if n.type=='TEX_IMAGE'),None) or material.node_tree.nodes.new('ShaderNodeTexImage')
tex.image=bpy.data.images.load(str(R/'design/scene-realism/textures/resume-attached.png'),check_existing=True)
material.node_tree.links.new(tex.outputs['Color'],shader.inputs['Base Color'])
paper.data.materials.clear();paper.data.materials.append(bpy.data.materials['MAT_Paper_Cream'])
surface=bpy.data.objects.get('Resume_PDF_Surface')
if surface:bpy.data.objects.remove(surface,do_unlink=True)
xs=[v.co.x for v in paper.data.vertices];ys=[v.co.y for v in paper.data.vertices];z=max(v.co.z for v in paper.data.vertices)+.00015
mesh=bpy.data.meshes.new('Resume_PDF_Surface');mesh.from_pydata([(min(xs),min(ys),z),(max(xs),min(ys),z),(max(xs),max(ys),z),(min(xs),max(ys),z)],[],[(0,1,2,3)])
uv=mesh.uv_layers.new(name='ArtworkUV')
for loop,point in zip(uv.data,[(0,0),(1,0),(1,1),(0,1)]):loop.uv=point
surface=bpy.data.objects.new('Resume_PDF_Surface',mesh);bpy.data.collections['COL_Interactables'].objects.link(surface);surface.parent=paper;mesh.materials.append(material)
bpy.context.view_layer.update();print('RESUME_NEW',tuple(paper.dimensions))
bpy.ops.wm.save_as_mainfile(filepath=str(R/'blender/scene-realism.blend'))
exec((R/'blender/scene-realism/export-preview.py').read_text())
