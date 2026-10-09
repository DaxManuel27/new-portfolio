import bpy
from pathlib import Path
R=Path('/Users/daxmanuel/Documents/ChatGPT/portfolio-site-blender');T=R/'design/scene-realism/textures'
def artwork(obj,file,emissive=False,alpha=False):
 o=bpy.data.objects[obj];m=bpy.data.materials.get('MAT_Figma_'+file) or bpy.data.materials.new('MAT_Figma_'+file);m.use_nodes=True;n=m.node_tree.nodes;n.clear();out=n.new('ShaderNodeOutputMaterial');p=n.new('ShaderNodeBsdfPrincipled');tex=n.new('ShaderNodeTexImage');tex.image=bpy.data.images.load(str(T/(file+'.png')),check_existing=True);tex.image.colorspace_settings.name='sRGB';m.node_tree.links.new(tex.outputs['Color'],p.inputs['Base Color']);p.inputs['Roughness'].default_value=.8
 if emissive:
  m.node_tree.links.new(tex.outputs['Color'],p.inputs['Emission Color']);p.inputs['Emission Strength'].default_value=.8;p.inputs['Roughness'].default_value=.25;p.inputs['Coat Weight'].default_value=.1
 if alpha:m.node_tree.links.new(tex.outputs['Alpha'],p.inputs['Alpha']);m.surface_render_method='DITHERED'
 m.node_tree.links.new(p.outputs[0],out.inputs[0]);o.data.materials.clear();o.data.materials.append(m);o['textureSource']='Figma KGA8JvG2RZ333CXIHkh1OS';return o
for obj,file,em,alpha in [('Screen_Ultrawide_Projects_Reference','monitor',True,False),('MacBook_Screen','laptop',True,False),('Mug_Lettering','mug',False,True),('Sketchbook_Page_Left','sketch-left',False,False),('Sketchbook_Page_Right','sketch-right',False,False),('Resume_Sheet','resume',False,False),('Prop_RotaryTelephone.NumberPlate','dial',False,False)]:artwork(obj,file,em,alpha)
bpy.ops.wm.save_as_mainfile(filepath=str(R/'blender/scene-realism.blend'))
exec((R/'blender/scene-realism/export-preview.py').read_text())
print('Seven Figma textures applied and exported.')
