import bpy,json
from pathlib import Path
R=Path('/Users/daxmanuel/Documents/ChatGPT/portfolio-site-blender');out=R/'blender/scene-realism';s=bpy.context.scene
jobs=json.loads((out/'lightmaps.json').read_text());s.cycles.samples=64
for entry in jobs:
 o=bpy.data.objects[entry['object']];o.data.uv_layers.active=o.data.uv_layers['LightmapUV'];im=bpy.data.images[entry['texture'].removesuffix('.png')]
 for m in o.data.materials:
  n=next(n for n in m.node_tree.nodes if n.type=='TEX_IMAGE' and n.image==im);m.node_tree.nodes.active=n
 bpy.ops.object.select_all(action='DESELECT');o.select_set(True);bpy.context.view_layer.objects.active=o
 s.render.bake.use_pass_direct=True;s.render.bake.use_pass_indirect=True;s.render.bake.use_pass_color=False;s.render.bake.margin=8
 bpy.ops.object.bake(type='DIFFUSE');im.save();o.data.uv_layers.active=o.data.uv_layers[0]
s.cycles.samples=64;s.render.filepath=str(out/'refined-cycles.png');bpy.ops.wm.save_as_mainfile(filepath=str(R/'blender/scene-realism.blend'));bpy.ops.render.render(write_still=True)
exec((out/'export-preview.py').read_text());print('Rebake and Cycles reference check completed.')
