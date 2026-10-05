"""Fixed Pi 5 review scene and matching hero still. Execute through Blender MCP."""
import bpy, math, json, contextlib, io
from pathlib import Path
from mathutils import Matrix, Vector, Quaternion
ROOT=Path(__file__).resolve().parents[1]
OUT=ROOT/'exports/continuous-pi';OUT.mkdir(exist_ok=True,parents=True)
def run():
 manifest=json.loads((ROOT/'web/public/assets/journey.json').read_text());car=manifest['reorder']['car'];origin=Vector(manifest['stations'][3]['origin'])
 C=Matrix.Rotation(-math.pi/2,4,'X');I=C.inverted();anchor=Vector(car['anchors']['data']);yaw=-math.pi/10;scale=.25
 shot=bpy.data.scenes.get('Review — Continuous Pi') or bpy.data.scenes.new('Review — Continuous Pi');bpy.context.window.scene=shot
 # Source geometry is linked, never changed; one full-detail Pi is placed once.
 if not shot.objects:
  source=bpy.data.scenes['Reorder — Formula SAE'];copies={}
  for o in source.objects:
   if o.type not in {'MESH','EMPTY','FONT','CURVE'}:continue
   n=o.copy();n.name='PiReview_'+o.name;shot.collection.objects.link(n);copies[o]=n
  for o,n in copies.items():n.parent=copies.get(o.parent);n.matrix_world=o.matrix_world.copy()
  src=next(o for o in bpy.data.scenes['FSAE — Raspberry Pi 5'].objects if o.type=='MESH');pi=src.copy();pi.name='PiReview_Fixed_RaspberryPi5';shot.collection.objects.link(pi);pi.parent=None;pi.location=I@(anchor-origin);pi.rotation_euler=(0,0,yaw);pi.scale=(scale,)*3
  d=bpy.data.cameras.new('CAM_ContinuousPi');d.type='ORTHO';d.clip_start=.001;cam=bpy.data.objects.new(d.name,d);shot.collection.objects.link(cam);shot.camera=cam
  for pos,power,size in [((-.10,-.10,.18),.67,.15),((.12,.06,.12),.42,.12)]:
   ld=bpy.data.lights.new('PiReview_Softbox','AREA');ld.energy=power*scale*scale;ld.size=size*scale;lo=bpy.data.objects.new(ld.name,ld);shot.collection.objects.link(lo);lo.location=pi.location+Matrix.Rotation(yaw,3,'Z')@(Vector(pos)*scale);lo.rotation_euler=(pi.location-lo.location).to_track_quat('-Z','Y').to_euler()
 pi=shot.objects['PiReview_Fixed_RaspberryPi5'];cam=shot.camera
 q=Quaternion((0,1,0),yaw);offset=q@(Vector((.075,.12,.14))*scale);position=anchor+offset
 hero={'position':list(position),'target':list(anchor),'width':.22*scale}
 dive=dict(car['focusRoutes']['data'][-1]);dive['width']=.055
 meta={'scale':scale,'yaw':yaw,'anchor':list(anchor),'dive':dive,'hero':hero,'near':.001,'model':'raspberry-pi-5.glb'}
 (OUT/'shot.json').write_text(json.dumps(meta,indent=2))
 # Store camera checkpoints in the review source without changing the journey scene.
 for frame,pose in [(1,{'position':car['close']['position'],'target':list(anchor),'width':car['close']['width']}),(31,car['focusRoutes']['data'][0]),(61,dive),(91,hero)]:
  cam.location=I@(Vector(pose['position'])-origin);target=I@(Vector(pose['target'])-origin);cam.rotation_euler=(target-cam.location).to_track_quat('-Z','Y').to_euler();cam.data.ortho_scale=pose['width'];cam.keyframe_insert(data_path='location',frame=frame);cam.keyframe_insert(data_path='rotation_euler',frame=frame);cam.data.keyframe_insert(data_path='ortho_scale',frame=frame)
 shot.frame_start=1;shot.frame_end=91;shot.render.fps=30;shot.frame_set(91)
 # Static still uses the same Pi/hero angle, centred for the normal document layout.
 for o in shot.objects:
  if o.name.startswith('PiReview_Reorder_'):o.hide_render=True
 shot.render.engine='CYCLES';shot.cycles.samples=32;shot.cycles.use_denoising=True;shot.render.resolution_x=1000;shot.render.resolution_y=800;shot.render.resolution_percentage=100;shot.render.film_transparent=True
 cam.data.ortho_scale=.12*scale;shot.render.image_settings.file_format='PNG';shot.render.filepath=str(OUT/'raspberry-pi-5.png')
 with contextlib.redirect_stdout(io.StringIO()):bpy.ops.render.render(write_still=True)
 for o in shot.objects:
  if o.name.startswith('PiReview_Reorder_'):o.hide_render=False
 cam.data.ortho_scale=.055
 bpy.data.libraries.write(str(ROOT/'blender/continuous-pi-review.blend'),{shot})
 print(json.dumps(meta));print('Saved fixed-Pi review scene and matching isolated still.')
