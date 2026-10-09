"""Refresh notebook images from the website's shared handwriting layout; retain geometry."""
import bpy
from pathlib import Path
R=Path(__file__).resolve().parents[2]
for image in bpy.data.images:
 if Path(bpy.path.abspath(image.filepath)).name in ['um-page-left.png','um-page-right.png']:
  image.filepath=str(R/'design/desk-fixes'/Path(image.filepath).name)
  image.reload()
bpy.ops.wm.save_as_mainfile(filepath=str(R/'blender/scene-realism.blend'))
exec((R/'blender/scene-realism/export-preview.py').read_text())
