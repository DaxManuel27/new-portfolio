"""Prepare official Pi 5 CAD for the data-logging presentation.
Run via Blender MCP; preserves existing portfolio scenes and saves detail sources separately.
"""
import bpy,bmesh,math,json,contextlib,io
from pathlib import Path
from mathutils import Vector,Matrix
ROOT=Path(__file__).resolve().parents[1];OUT=ROOT/'exports/fsae-details';OUT.mkdir(exist_ok=True,parents=True)
def material(name,color,metal=0,rough=.45):
 m=bpy.data.materials.new(name);m.diffuse_color=(*color,1);m.use_nodes=True
 bs=m.node_tree.nodes.get('Principled BSDF');bs.inputs['Base Color'].default_value=(*color,1);bs.inputs['Metallic'].default_value=metal;bs.inputs['Roughness'].default_value=rough
 return m
def export(scene,slug):
 bpy.context.window.scene=scene
 bpy.ops.object.select_all(action='DESELECT')
 for o in scene.objects:
  if o.type=='MESH':o.select_set(True)
 with contextlib.redirect_stdout(io.StringIO()):
  bpy.ops.export_scene.gltf(filepath=str(OUT/(slug+'.glb')),export_format='GLB',use_selection=True,use_active_scene=True,export_animations=False,export_extras=True,export_cameras=False,export_lights=False)
 bpy.data.libraries.write(str(ROOT/'blender'/(slug+'.blend')),{scene})
 print(slug,'triangles',sum(len(p.vertices)-2 for o in scene.objects if o.type=='MESH' for p in o.data.polygons))
def pi():
 sc=bpy.data.scenes.get('FSAE — Raspberry Pi 5')
 if sc is None:
  sc=bpy.data.scenes.new('FSAE — Raspberry Pi 5');bpy.context.window.scene=sc
  with contextlib.redirect_stdout(io.StringIO()):bpy.ops.import_scene.gltf(filepath=str(ROOT/'assets/models/raspberry-pi-5/converted.glb'))
 else:bpy.context.window.scene=sc
 if sc.get('optimized'):export(sc,'raspberry-pi-5');return
 palette=[material('RPI5_Green',(.018,.20,.055)),material('RPI5_Metal',(.55,.59,.63),.82,.28),material('RPI5_Packages',(.025,.03,.035)),material('RPI5_Gold',(.65,.42,.10),.75,.3),material('RPI5_USB_Blue',(.01,.12,.65)),material('RPI5_Ceramic',(.34,.23,.13)),material('RPI5_White',(.8,.8,.73))]
 def slot(m):
  r,g,b=m.diffuse_color[:3]
  if g>r*1.3 and g>b*1.1:return 0
  if b>max(r,g)*1.5:return 4
  if r>.4 and g>.3 and b<r*.55:return 3
  if max(r,g,b)<.2:return 2
  if r>g*1.3 and b<r*.8:return 5
  if min(r,g,b)>.7:return 6
  return 1
 verts=[];faces=[];indices=[];rot=Matrix.Rotation(-math.pi/2,4,'X');original=list(sc.objects)
 for o in original:
  if o.type!='MESH':continue
  matrix=rot@o.matrix_world;offset=len(verts)
  verts.extend([tuple(matrix@v.co-Vector((.0425,.028,0))) for v in o.data.vertices])
  for p in o.data.polygons:
   faces.append(tuple(offset+i for i in p.vertices));indices.append(slot(o.data.materials[p.material_index]) if o.data.materials else 2)
 mesh=bpy.data.meshes.new('RPI5_CAD_Mesh');mesh.from_pydata(verts,[],faces);mesh.update()
 obj=bpy.data.objects.new('RPI5_PresentationRoot',mesh);sc.collection.objects.link(obj)
 for m in palette:mesh.materials.append(m)
 for p,i in zip(mesh.polygons,indices):p.material_index=i
 for o in original:bpy.data.objects.remove(o,do_unlink=True)
 bm=bmesh.new();bm.from_mesh(mesh);bmesh.ops.remove_doubles(bm,verts=list(bm.verts),dist=.0000005)
 bmesh.ops.dissolve_limit(bm,angle_limit=.015,verts=list(bm.verts),edges=list(bm.edges),delimit={'MATERIAL','NORMAL'})
 bm.to_mesh(mesh);bm.free()
 bpy.context.view_layer.objects.active=obj;obj.select_set(True)
 triangles=sum(len(p.vertices)-2 for p in mesh.polygons)
 if triangles>65000:
  mod=obj.modifiers.new('Web CAD reduction','DECIMATE');mod.ratio=65000/triangles
  bpy.ops.object.modifier_apply(modifier=mod.name)
 obj['source']='Raspberry Pi Ltd official Pi 5 STEP; MIT; original license supplied';sc['optimized']=True
 export(sc,'raspberry-pi-5')
def run():
 pi()
 import runpy
 runpy.run_path(str(ROOT/'blender/pi_projects_portal.py'))['run']()
 import importlib.util
 spec=importlib.util.spec_from_file_location('fsae_routes',ROOT/'blender/fsae_focus_routes.py');routes=importlib.util.module_from_spec(spec);spec.loader.exec_module(routes);routes.export_routes()

def render_posters():
 """Rebuild matching static fallbacks without touching portfolio cameras."""
 for name,slug,scale in [('FSAE — Raspberry Pi 5','raspberry-pi-5',1)]:
  s=bpy.data.scenes[name];bpy.context.window.scene=s
  if not s.camera:
   world=bpy.data.worlds.new(slug+' studio');world.use_nodes=True;world.node_tree.nodes['Background'].inputs[0].default_value=(.2,.23,.26,1);world.node_tree.nodes['Background'].inputs[1].default_value=.5;s.world=world
   d=bpy.data.cameras.new(slug+' camera');d.type='ORTHO';d.ortho_scale=.12*scale;d.clip_start=.001
   cam=bpy.data.objects.new(d.name,d);s.collection.objects.link(cam);cam.location=(.075*scale,-.14*scale,.12*scale);cam.rotation_euler=(-cam.location).to_track_quat('-Z','Y').to_euler();s.camera=cam
   for loc,power,size in [((-.1,-.1,.18),8/12,.15),((.12,.06,.12),5/12,.12)]:
    ld=bpy.data.lights.new('Detail softbox','AREA');ld.energy=power*scale*scale;ld.shape='DISK';ld.size=size*scale;o=bpy.data.objects.new(ld.name,ld);s.collection.objects.link(o);o.location=Vector(loc)*scale;o.rotation_euler=(-o.location).to_track_quat('-Z','Y').to_euler()
  s.render.engine='CYCLES';s.cycles.samples=24;s.cycles.use_denoising=True;s.render.resolution_x=1000;s.render.resolution_y=800;s.render.resolution_percentage=100;s.render.film_transparent=True;s.render.image_settings.file_format='PNG';s.render.image_settings.color_mode='RGBA';s.render.filepath=str(OUT/(slug+'.png'))
  with contextlib.redirect_stdout(io.StringIO()):bpy.ops.render.render(write_still=True)
  bpy.data.libraries.write(str(ROOT/'blender'/(slug+'.blend')),{s})
