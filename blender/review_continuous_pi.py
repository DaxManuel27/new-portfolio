"""Headless geometry/framing verification from the exact browser camera poses."""
import bpy,json,math,contextlib,io
from pathlib import Path
from mathutils import Vector,Quaternion,Matrix
ROOT=Path(__file__).resolve().parents[1];s=bpy.data.scenes['Review — Continuous Pi'];bpy.context.window.scene=s
m=json.loads((ROOT/'web/public/assets/journey.json').read_text());origin=Vector(m['stations'][3]['origin']);I=Matrix.Rotation(math.pi/2,4,'X');rows=json.loads((ROOT/'exports/continuous-pi/review-poses.json').read_text());out=ROOT/'exports/continuous-pi/keyframes';out.mkdir(exist_ok=True)
s.camera.animation_data_clear();s.camera.data.animation_data_clear();s.world=s.world or bpy.data.worlds.new('PiReview_Black');s.render.engine='BLENDER_WORKBENCH';s.render.resolution_x=960;s.render.resolution_y=640;s.render.resolution_percentage=100;s.render.film_transparent=False;s.display.shading.color_type='OBJECT';s.display.shading.light='STUDIO';s.display.shading.show_shadows=False;s.display.shading.show_cavity=False;s.display.shading.background_type='WORLD';s.world.color=(0,0,0);s.render.image_settings.file_format='PNG'
for row in rows:
 p=row['pose'];s.camera.location=I@(Vector(p['position'])-origin);q=p['quaternion'];s.camera.rotation_euler=(I@Quaternion((q[3],q[0],q[1],q[2])).to_matrix().to_4x4()).to_euler();s.camera.data.ortho_scale=p['width']
 for o in s.objects:
  if o.name.startswith('PiReview_Reorder_'):
   o.hide_render=row['focus']['carOpacity']<=0 or 'Desk_Station' in o.name or 'Label_' in o.name or 'Connector_' in o.name
   if o.type=='MESH':
    mat=o.data.materials[0] if o.data.materials else None;color=mat.diffuse_color if mat else (.4,.4,.4,1);o.color=(*[c*row['focus']['carOpacity'] for c in color[:3]],1)
  elif o.type=='MESH':o.color=(.12,.40,.22,1)
 s.render.filepath=str(out/f"{row['kind']}-{round(row['local']*100)}.png")
 with contextlib.redirect_stdout(io.StringIO()):bpy.ops.render.render(write_still=True)
print('Rendered 25 exact camera checkpoints with a fixed Pi and separate car fade.')
