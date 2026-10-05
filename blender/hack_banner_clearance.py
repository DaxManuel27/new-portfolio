"""Keep the first flight in front of the Hack Atlantic tabletop banners.
Blender Y is browser -Z. Preserve Intro, landing and all later stations.
"""
import bpy, json
from pathlib import Path
ROOT = Path(__file__).resolve().parents[1]

def forward_offset(time):
    def ease(x):
        x = max(0., min(1., x))
        return x*x*(3-2*x)
    return .22 * ease((time-2.)/.5) * (1-ease((time-3.45)/.45))

def apply():
    scene=bpy.data.scenes['Completion — Portfolio Journey']
    bpy.context.window.scene=scene
    feet=bpy.data.objects['Journey_TravelFeet']
    camera=bpy.data.objects['CAM_Journey_Centered']
    if feet.get('hack_banner_clearance_v1'):
        print('Hack Atlantic clearance already applied');return
    original_frame=scene.frame_current
    rows=[]
    for frame in range(61,118):
        scene.frame_set(frame)
        rows.append((frame, feet.location.copy(), camera.location.copy()))
    for frame,position,camera_position in rows:
        offset=forward_offset((frame-1)/30)
        feet.location=position;feet.location.y-=offset
        camera.location=camera_position;camera.location.y-=offset
        feet.keyframe_insert(data_path='location',frame=frame)
        camera.keyframe_insert(data_path='location',frame=frame)
    feet['hack_banner_clearance_v1']=True
    path=ROOT/'exports/station-reorder/travel.json'
    travel=json.loads(path.read_text())
    for row in travel:
        row['position'][2]+=forward_offset((row['frame']-1)/30)
    path.write_text(json.dumps(travel))
    scene.frame_set(original_frame)
    print('Applied 22 cm smooth forward arc from 2.0–3.9 seconds')

def export_hero():
    import importlib.util
    spec=importlib.util.spec_from_file_location('cp',ROOT/'blender/completion_pipeline.py')
    cp=importlib.util.module_from_spec(spec);spec.loader.exec_module(cp)
    cp.OUT=ROOT/'exports/station-reorder'
    scene=bpy.data.scenes['Completion — Portfolio Journey']
    root=bpy.data.objects['Journey_TravelFeet'];objects=[root,*root.children_recursive]
    for obj in objects:obj.hide_render=False;obj.hide_viewport=False
    cp.export_objects(scene,objects,'macbook-journey',True,1,721)
