"""Place the contact notebook at the front-right tabletop corner and refresh its shadow."""
import bpy
from pathlib import Path
bpy.data.objects['Root_phonebook'].location=(.72,-.28,.741)
bpy.context.view_layer.update()
key=bpy.data.objects.get('Root_printer_download')
parts=([key]+list(key.children_recursive)) if key else []
for obj in parts:obj.hide_render=True
p=Path(__file__).with_name('rebake.py')
s=p.read_text().replace("jobs=json.loads((out/'lightmaps.json').read_text());", "jobs=[e for e in json.loads((out/'lightmaps.json').read_text()) if e['object']=='Desk_Top.001'];")
s=s.replace(';bpy.ops.render.render(write_still=True)','')
s=s.replace('bpy.ops.wm.save_as_mainfile', '[setattr(obj,"hide_render",False) for obj in parts];bpy.ops.wm.save_as_mainfile')
exec(compile(s,str(p),'exec'))
