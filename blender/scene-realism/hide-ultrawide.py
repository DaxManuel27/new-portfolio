"""Keep the ultrawide in Blender, exclude it from the website, refresh affected lighting."""
import bpy
from pathlib import Path
monitor=bpy.data.objects['Root_monitor'];monitor['websiteHidden']=True
for obj in [monitor]+list(monitor.children_recursive):obj.hide_render=True;obj.hide_set(True)
key=bpy.data.objects.get('Root_printer_download');parts=([key]+list(key.children_recursive)) if key else []
for obj in parts:obj.hide_render=True
p=Path(__file__).with_name('rebake.py')
s=p.read_text().replace("jobs=json.loads((out/'lightmaps.json').read_text());", "jobs=[e for e in json.loads((out/'lightmaps.json').read_text()) if e['object'] in ['Desk_Top.001','Wall']];")
s=s.replace(';bpy.ops.render.render(write_still=True)','').replace('bpy.ops.wm.save_as_mainfile', '[setattr(obj,"hide_render",False) for obj in parts];bpy.ops.wm.save_as_mainfile')
exec(compile(s,str(p),'exec'))
