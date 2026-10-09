"""Reproducible 120 mm panel lift; keep the foot planted and extend the stem."""
import bpy
from pathlib import Path
R=Path(__file__).resolve().parents[2]
s=bpy.context.scene
root=bpy.data.objects['Root_monitor']
target=.12
previous=float(root.get('panel_lift_world_m',0))
delta=(target-previous)/root.matrix_world.to_scale().z
if abs(delta)>1e-7:
 for name in ['Monitor_CurvedHousing','Screen_Ultrawide_Projects_Curved']:
  bpy.data.objects[name].location.z+=delta
 stem=bpy.data.objects['Reorder_Projects_Personal_Ultrawide_StandStem']
 # Lengthen in mesh coordinates, keeping the bottom fixed in parent coordinates.
 zs=[v.co.z for v in stem.data.vertices];bottom=min(zs);height=max(zs)-bottom
 for v in stem.data.vertices:v.co.z=bottom+(v.co.z-bottom)*(1+delta/(height*stem.scale.z))
 root['panel_lift_world_m']=target
bpy.context.view_layer.update()
bpy.ops.wm.save_as_mainfile(filepath=str(R/'blender/scene-realism.blend'))
exec((R/'blender/scene-realism/export-preview.py').read_text())
