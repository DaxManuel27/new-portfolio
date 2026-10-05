"""Create separate material review scenes without changing runtime cameras."""
import bpy
from pathlib import Path
from mathutils import Vector

ROOT = Path(__file__).resolve().parents[1]
source = bpy.data.scenes['Review — Projects Monitor Clearance']
source.frame_set(490)
for name, photographic in [('Review — Realism Neutral', False), ('Review — Realism Photograph', True)]:
    scene = bpy.data.scenes.get(name)
    if scene is None:
        scene = source.copy()
        scene.name = name
        collection = bpy.data.collections.new(name + ' Rig')
        scene.collection.children.link(collection)
        camera = source.objects['CAM_Clearance_ThreeQuarter'].copy()
        camera.data = camera.data.copy()
        camera.name = name + ' Camera'
        collection.objects.link(camera)
        scene.camera = camera
    scene.frame_set(490)
    scene.render.engine = 'CYCLES'
    scene.cycles.samples = 48
    scene.cycles.use_denoising = True
    scene.render.resolution_x = 960
    scene.render.resolution_y = 640
    scene.render.resolution_percentage = 100
    if photographic:
        scene.world = bpy.data.worlds['WORLD_Photographic_Studio']
        scene.view_settings.exposure = -.65
        camera = scene.camera
        camera.data.type = 'PERSP'
        camera.data.lens = 85
        target = Vector((8.0, 0, 1.05))
        direction = (camera.location - target).normalized()
        camera.location = target + direction * 4.6
        camera.rotation_euler = (target-camera.location).to_track_quat('-Z','Y').to_euler()
    else:
        world = bpy.data.worlds.get('WORLD_Realism_Neutral') or bpy.data.worlds.new('WORLD_Realism_Neutral')
        world.use_nodes = True
        world.node_tree.nodes['Background'].inputs['Color'].default_value = (.18,.18,.18,1)
        world.node_tree.nodes['Background'].inputs['Strength'].default_value = .35
        scene.world = world
        scene.view_settings.exposure = -.65
        scene.camera.data.type = 'ORTHO'
    scene['purpose'] = 'Material review only; runtime geometry, animation and camera manifest remain canonical.'
bpy.context.window.scene = bpy.data.scenes['Review — Realism Photograph']
scene = bpy.context.scene
scene.render.filepath = str(ROOT/'blender/previews/photorealism/projects-perspective.png')
bpy.ops.render.render(write_still=True)
bpy.ops.wm.save_as_mainfile(filepath=str(ROOT/'blender/portfolio-shared-desk.blend'))
print('Saved neutral and 85 mm photographic review scenes and comparison render.')
