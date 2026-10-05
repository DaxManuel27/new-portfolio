"""Restore the Hack departure turntable, without replacing other scene work.

Author through Blender MCP. Dense samples preserve winding in the GLB, and
the fixed flight camera envelope prevents zoom pumping during the turn.
"""
import bpy, math, json, importlib.util, contextlib, io
from pathlib import Path
from mathutils import Vector, Quaternion, Matrix
ROOT=Path('/Users/daxmanuel/Documents/ChatGPT/portfolio-site-blender')
OUT=ROOT/'exports/station-reorder'
C=Matrix.Rotation(-math.pi/2,4,'X')
ANCHORS=[(0,-17.3),(12,-20),(12,120),(4,290),(0,360)]
def ease(t):
 t=max(0,min(1,t));return t*t*(3-2*t)
def rotation(p):
 r=max(0,min(1,(p-.18)/.54))*4;i=min(3,int(r));t=ease(r-i)
 pitch,yaw=[ANCHORS[i][k]+(ANCHORS[i+1][k]-ANCHORS[i][k])*t for k in range(2)]
 # Keep the inherited 360-degree pitch branch continuous in Blender as well.
 return (math.radians(360+pitch),0,math.radians(yaw))
def curves(action):
 if hasattr(action,'fcurves'):yield from action.fcurves
 for layer in getattr(action,'layers',[]):
  for strip in layer.strips:
   for bag in getattr(strip,'channelbags',[]):yield from bag.fcurves
def apply(save=True):
 s=bpy.data.scenes['Completion — Portfolio Journey'];bpy.context.window.scene=s
 feet=bpy.data.objects['Journey_TravelFeet'];spin=bpy.data.objects['Journey_MacBook_SpinPivot'];cam=s.camera
 s.frame_set(121);start_pos=cam.location.copy();start_q=cam.rotation_euler.to_quaternion();start_width=cam.data.ortho_scale
 s.frame_set(241);end_pos=cam.location.copy();end_q=cam.rotation_euler.to_quaternion();end_width=cam.data.ortho_scale
 hero=[o for o in feet.children_recursive if o.type=='MESH']
 # Constant safe framing during the main turn, independent of edge-on bounds.
 flight_width=.70;travel=json.loads((OUT/'travel.json').read_text());report=[]
 for f in range(122,722):
  s.frame_set(f);p=min(1,(f-121)/120);spin.rotation_euler=rotation(p)
  spin.keyframe_insert(data_path='rotation_euler',frame=f)
  if f>241:continue
  bpy.context.view_layer.update()
  points=[o.matrix_world@Vector(v) for o in hero for v in o.bound_box]
  center=Vector([(min(v[k] for v in points)+max(v[k] for v in points))/2 for k in range(3)])
  follow=center+start_q@Vector((0,0,2.56))
  if p<=.18:
   t=ease(p/.18);pos=start_pos.lerp(follow,t);q=start_q;width=start_width+(flight_width-start_width)*t
  elif p<=.72:pos=follow;q=start_q;width=flight_width
  else:
   t=ease((p-.72)/.28);pos=follow.lerp(end_pos,t);q=start_q.slerp(end_q,t);width=flight_width+(end_width-flight_width)*t
  cam.location=pos;cam.rotation_euler=q.to_euler();cam.data.ortho_scale=width
  cam.keyframe_insert(data_path='location',frame=f);cam.keyframe_insert(data_path='rotation_euler',frame=f);cam.data.keyframe_insert(data_path='ortho_scale',frame=f)
  bpy.context.view_layer.update();m=C@cam.matrix_world;g=m.to_quaternion()
  travel[f-1].update(position=list(m.translation),quaternion=[g.x,g.y,g.z,g.w],width=width)
  report.append({'frame':f,'progress':p,'pitch':math.degrees(spin.rotation_euler.x)-360,'yaw':math.degrees(spin.rotation_euler.z),'width':width})
 for o in [spin,cam,cam.data]:
  if o.animation_data and o.animation_data.action:
   if o==spin:o.animation_data.action.name='AN_Workstation_OriginalTurntable'
   for fc in curves(o.animation_data.action):
    for key in fc.keyframe_points:
     if key.co.x>=121:key.interpolation='LINEAR'
 (OUT/'travel.json').write_text(json.dumps(travel))
 (OUT/'rotation-keyframes.json').write_text(json.dumps(report,indent=2))
 s['workstation_rotation']='Original Hack turntable + tilt; unwrapped yaw, 18–72% spin; upright fixed-envelope camera.'
 s.frame_set(241)
 if save:bpy.ops.wm.save_as_mainfile(filepath=str(ROOT/'blender/portfolio-station-reorder.blend'))
 print('Restored one full turn, tilt and fitted travel camera; first 121 frames and later cameras preserved.')
def export_hero():
 spec=importlib.util.spec_from_file_location('cp',ROOT/'blender/completion_pipeline.py');cp=importlib.util.module_from_spec(spec);spec.loader.exec_module(cp);cp.OUT=OUT
 s=bpy.data.scenes['Completion — Portfolio Journey'];bpy.context.window.scene=s;s.frame_set(1)
 root=bpy.data.objects['Journey_TravelFeet'];objects=[root,*root.children_recursive]
 for o in objects:o.hide_render=False;o.hide_viewport=False
 with contextlib.redirect_stdout(io.StringIO()):cp.export_objects(s,objects,'macbook-journey',True,1,721)
 s.frame_set(241);print('Exported revised hero only; all station assets retained.')
