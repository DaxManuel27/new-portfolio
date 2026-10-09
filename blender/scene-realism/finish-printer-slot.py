import bpy,ast
from pathlib import Path
R=Path('/Users/daxmanuel/Documents/ChatGPT/portfolio-site-blender');T=R/'design/desk-fixes';C=bpy.data.collections['COL_Interactables']
a=ast.parse((R/'blender/interactive-workspace/assemble.py').read_text());exec(compile(ast.Module(body=[n for n in a.body if isinstance(n,ast.FunctionDef)],type_ignores=[]),'helpers','exec'))
s=bpy.context.scene;printer=bpy.data.objects['Root_printer'];dark=bpy.data.materials['MAT_PowderCoat_Charcoal'];white=bpy.data.materials['MAT_Printer_OffWhite']
if not s.get('printer_true_output_recess'):
 archive=bpy.data.collections.get('COL_Archive_SixFixes') or bpy.data.collections.new('COL_Archive_SixFixes');archive.use_fake_user=True
 for o in list(s.objects):
  if any(o.name.endswith('.'+suffix) for suffix in ['OutputSlot','OutputRim','OutputDarkBack']):
   for c in list(o.users_collection):c.objects.unlink(o)
   archive.objects.link(o)
 cutter=box('Printer_Recess_Cutter',(.232,.062,.019),(0,-.110,.069),None,printer,bevel=0);bpy.context.view_layer.update()
 body=next(o for o in printer.children_recursive if o.name.endswith('.Body'))
 mod=body.modifiers.new('Actual recessed output slot','BOOLEAN');mod.operation='DIFFERENCE';mod.object=cutter
 bpy.ops.object.select_all(action='DESELECT');body.select_set(True);bpy.context.view_layer.objects.active=body;bpy.ops.object.modifier_apply(modifier=mod.name)
 bpy.data.objects.remove(cutter,do_unlink=True)
 box('Printer_Output_Recess_Back',(.232,.002,.019),(0,-.079,.069),dark,printer,bevel=.001)
 box('Printer_Output_Recess_Floor',(.232,.031,.002),(0,-.094,.0595),dark,printer,bevel=.0005)
 s['printer_true_output_recess']=True
bpy.ops.wm.save_as_mainfile(filepath=str(R/'blender/scene-realism.blend'))
exec((R/'blender/scene-realism/export-preview.py').read_text())
