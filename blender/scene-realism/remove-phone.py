"""Remove the telephone hierarchy; contact lives in the restored phonebook."""
import bpy
from pathlib import Path
root=bpy.data.objects.get('Root_phone')
if root:
 objects=list(root.children_recursive)+[root]
 print('Removing phone objects:',[o.name for o in objects])
 for obj in objects:bpy.data.objects.remove(obj,do_unlink=True)
R=Path(__file__).resolve().parents[2]
bpy.ops.wm.save_as_mainfile(filepath=str(R/'blender/scene-realism.blend'))
exec((R/'blender/scene-realism/export-preview.py').read_text())
