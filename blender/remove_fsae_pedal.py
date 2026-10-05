"""Remove the retired sensor project from the loaded portfolio source and export the car."""
import bpy,importlib.util,json,contextlib,io
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1]
def run():
 removed=[]
 for obj in list(bpy.data.objects):
  if any(token in obj.name for token in ['FSAE_Label_PedalSensor','FSAE_Connector_PedalSensor','FSAE_Anchor_PedalSensor']):
   removed.append(obj.name);bpy.data.objects.remove(obj,do_unlink=True)
 # Retain the transparent Data logging artwork in Blender exports and fallback renders.
 image=bpy.data.images.load(str(ROOT/'assets/textures/figma-completion/fsae-data-logging.png'),check_existing=False);image.pack()
 for obj in bpy.data.objects:
  if 'FSAE_Label_DataLogging' in obj.name:
   for mat in obj.data.materials:
    if mat and mat.use_nodes:
     for node in mat.node_tree.nodes:
      if node.type=='TEX_IMAGE':node.image=image
 scene=bpy.data.scenes['Reorder — Formula SAE'];bpy.context.window.scene=scene
 spec=importlib.util.spec_from_file_location('completion',ROOT/'blender/completion_pipeline.py');cp=importlib.util.module_from_spec(spec);spec.loader.exec_module(cp);cp.OUT=ROOT/'exports/station-reorder'
 with contextlib.redirect_stdout(io.StringIO()):cp.export_objects(scene,list(scene.objects),'station-formula-sae')
 bpy.ops.wm.save_as_mainfile(filepath=str(ROOT/'blender/portfolio-station-reorder.blend'))
 print(json.dumps({'removed':removed,'remaining_labels':[o.name for o in scene.objects if 'FSAE_Label_' in o.name]}))
def poster():
 scene=bpy.data.scenes['Reorder — Formula SAE'];bpy.context.window.scene=scene
 scene.cycles.samples=16;scene.cycles.use_denoising=True
 scene.render.resolution_x=1440;scene.render.resolution_y=960;scene.render.resolution_percentage=100
 scene.render.filepath=str(ROOT/'exports/station-reorder/fsae-preview.png')
 with contextlib.redirect_stdout(io.StringIO()):bpy.ops.render.render(write_still=True)
 print(scene.render.filepath)
