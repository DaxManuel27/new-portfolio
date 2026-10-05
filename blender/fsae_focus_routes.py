"""Car-relative focus routes: logger behind seat."""
import bpy,math,json
from pathlib import Path
from mathutils import Vector,Matrix
ROOT=Path(__file__).resolve().parents[1]
def export_routes():
 scene=bpy.data.scenes['Reorder — Formula SAE'];bpy.context.window.scene=scene;bpy.context.view_layer.update()
 root=next(o for o in scene.objects if o.name.endswith('FSAE_Root'))
 C=Matrix.Rotation(-math.pi/2,4,'X');origin=Vector((4.4,0,-12))
 def world(point):return list(C@(root.matrix_world@Vector(point))+origin)
 anchors={'data':world((0,.56,.40))}
 anchor=Vector(anchors['data'])
 routes={'data':[
  {'position':list(anchor+Vector((0,.36,-.18))),'target':list(anchor),'width':.32},
  {'position':list(anchor+Vector((0,.12,-.035))),'target':list(anchor),'width':.055}]}

 out=ROOT/'exports/fsae-details';(out/'anchors.json').write_text(json.dumps(anchors,indent=2));(out/'routes.json').write_text(json.dumps(routes,indent=2))
 print(json.dumps({'anchors':anchors,'routes':routes}))
