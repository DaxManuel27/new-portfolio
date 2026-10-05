"""Idempotent Projects desk additions; run build() via Blender MCP."""
import bpy, math, json, shutil, importlib.util
from pathlib import Path
from mathutils import Vector
ROOT=Path('/Users/daxmanuel/Documents/ChatGPT/portfolio-site-blender')
def build():
 s=bpy.data.scenes['Reorder — Ultrawide'];bpy.context.window.scene=s;bpy.context.view_layer.update()
 backup=ROOT/'backups/fsae-desk-return/portfolio-station-reorder.blend'
 if not backup.exists():bpy.ops.wm.save_as_mainfile(filepath=str(backup),copy=True)
 out=ROOT/'exports/station-reorder'
 for name in ['layout.json','station-projects.glb','ultrawide.png']:
  dest=backup.parent/name
  if not dest.exists():shutil.copy2(out/name,dest)
 col=bpy.data.collections.get('COL_Projects_Desk_Additions')
 if col:
  for o in list(col.objects):bpy.data.objects.remove(o,do_unlink=True)
 else:col=bpy.data.collections.new('COL_Projects_Desk_Additions');s.collection.children.link(col)
 def link(o):
  for c in list(o.users_collection):c.objects.unlink(o)
  col.objects.link(o);return o
 def mat(name,c,rough=.45,metal=0):
  m=bpy.data.materials.get(name) or bpy.data.materials.new(name);m.use_nodes=True
  bs=m.node_tree.nodes.get('Principled BSDF');bs.inputs['Base Color'].default_value=(*c,1);bs.inputs['Roughness'].default_value=rough;bs.inputs['Metallic'].default_value=metal
  return m
 cream=mat('MAT_Projects_Cream',(.72,.68,.58));case=mat('MAT_Projects_Charcoal',(.025,.029,.032),.36,.18);keys=mat('MAT_Projects_Keycaps',(.075,.082,.085));accent=mat('MAT_Projects_Modifiers',(.17,.19,.18))
 def cube(name,pos,size,m,bevel=.0015):
  bpy.ops.mesh.primitive_cube_add(size=1,location=pos);o=link(bpy.context.object);o.name=name;o.dimensions=size;bpy.ops.object.transform_apply(location=False,rotation=False,scale=True);o.data.materials.append(m)
  if bevel:
   b=o.modifiers.new('Soft edges','BEVEL');b.width=bevel;b.segments=2;bpy.ops.object.modifier_apply(modifier=b.name)
  return o
 def text(name,body,pos,size,rot,extrude=0):
  d=bpy.data.curves.new(name,'FONT');d.body=body;d.size=size;d.space_line=1.15;d.resolution_u=4;d.extrude=extrude;d.bevel_depth=.0003 if extrude else 0;d.bevel_resolution=1
  o=bpy.data.objects.new(name,d);col.objects.link(o);o.location=pos;o.rotation_euler=rot;d.materials.append(cream);return o
 cube('Projects_Keyboard_60',(.08,-.16,.751),(.302,.113,.022),case,.005)
 cube('Projects_Keyboard_Plate',(.08,-.16,.764),(.292,.103,.005),case,.002)
 rows=[([1]*13+[2],['Esc','1','2','3','4','5','6','7','8','9','0','-','=','Back']),([1.5]+[1]*12+[1.5],['Tab','Q','W','E','R','T','Y','U','I','O','P','[',']','\\']),([1.75]+[1]*11+[2.25],['Caps','A','S','D','F','G','H','J','K','L',';','\'','Enter']),([2.25]+[1]*10+[2.75],['Shift','Z','X','C','V','B','N','M',',','.','/','Shift']),([1.25]*3+[6.25]+[1.25]*4,['Ctrl','Win','Alt','','Alt','Fn','Menu','Ctrl'])]
 count=0
 for r,(widths,legends) in enumerate(rows):
  x=.08-.285/2;y=-.16+.038-r*.019
  for j,(w,legend) in enumerate(zip(widths,legends)):
   ww=w*.019;z=.773+(.002*(4-r)/4)
   cube(f'Projects_Key_{r}_{j}',(x+ww/2,y,z),(ww-.0015,.0175,.012),keys if len(legend)<=1 else accent,.0014)
   if legend:text(f'Projects_Legend_{r}_{j}',legend,(x+.002,y-.002,z+.0062),.004 if len(legend)>1 else .0055,(0,0,0))
   x+=ww;count+=1
 assert count==61
 # Low rounded mouse shell, split front buttons and central wheel.
 bpy.ops.mesh.primitive_uv_sphere_add(segments=24,ring_count=12,location=(.34,-.16,.755));mouse=link(bpy.context.object);mouse.name='Projects_Mouse';mouse.scale=(.032,.055,.022);bpy.ops.object.transform_apply(location=False,rotation=False,scale=True)
 # Flatten underside to tabletop while retaining the domed silhouette.
 for v in mouse.data.vertices:v.co.z=max(v.co.z,-.015)
 mouse.data.materials.append(case)
 for face in mouse.data.polygons:face.use_smooth=True
 for side in [-1,1]:cube('Projects_Mouse_Button_'+str(side),(.34+side*.014,-.137,.766),(.024,.035,.004),keys,.002)
 cube('Projects_Mouse_Wheel',(.34,-.127,.772),(.006,.018,.005),accent,.002)
 # Convert visible legends and merge by material to avoid dozens of draw calls.
 for o in list(col.objects):
  if o.type=='FONT' and not o.hide_render:
   bpy.ops.object.select_all(action='DESELECT');o.select_set(True);bpy.context.view_layer.objects.active=o;bpy.ops.object.convert(target='MESH')
 bpy.context.view_layer.update()
 triangles={}
 for group,prefix in [('keyboard','Projects_Key'),('mouse','Projects_Mouse'),('legends','Projects_Legend')]:
  obs=[o for o in col.objects if o.type=='MESH' and o.name.startswith(prefix)]
  triangles[group]=sum(len(o.data.loop_triangles) for o in obs) if not obs else 0
  for o in obs:o.data.calc_loop_triangles();triangles[group]+=len(o.data.loop_triangles)
 assert sum(triangles.values())<=35000,triangles
 # Save bounds before join; exclude hidden editable text.
 bounds={o.name:{'min':[min((o.matrix_world@Vector(c))[i] for c in o.bound_box) for i in range(3)],'max':[max((o.matrix_world@Vector(c))[i] for c in o.bound_box) for i in range(3)]} for o in col.objects if o.type=='MESH'}
 (out/'projects-props-report.json').write_text(json.dumps({'triangles':triangles,'keys':count,'bounds':bounds},indent=2))
 for prefix,name in [('Projects_Key','Projects_Keyboard_60'),('Projects_Legend','Projects_Key_Legends'),('Projects_Mouse','Projects_Mouse')]:
  obs=[o for o in col.objects if o.type=='MESH' and o.name.startswith(prefix)]
  bpy.ops.object.select_all(action='DESELECT')
  for o in obs:o.select_set(True)
  bpy.context.view_layer.objects.active=obs[0];bpy.ops.object.join();bpy.context.object.name=name
 # A more frontal desk arrival shows the screen and peripherals without relocating furniture.
 layout=json.loads((out/'layout.json').read_text())
 from mathutils import Matrix
 cam=s.camera;cam.location=(.38,-2.55,1.95);cam.rotation_euler=(Vector((-.08,0,1.02))-cam.location).to_track_quat('-Z','Y').to_euler();cam.data.ortho_scale=1.95
 bpy.context.view_layer.update();m=Matrix.Rotation(-math.pi/2,4,'X')@cam.matrix_world;q=m.to_quaternion()
 layout['ultrawide']['wide']={'position':list(m.translation+Vector(layout['origins']['ultrawide'])),'quaternion':[q.x,q.y,q.z,q.w],'width':1.95}
 (out/'layout.json').write_text(json.dumps(layout,indent=2))
 bpy.ops.wm.save_as_mainfile(filepath=str(ROOT/'blender/portfolio-station-reorder.blend'))
 spec=importlib.util.spec_from_file_location('cp',ROOT/'blender/completion_pipeline.py');cp=importlib.util.module_from_spec(spec);spec.loader.exec_module(cp);cp.OUT=out
 cp.export_objects(s,list(s.objects),'station-projects')
 print(json.dumps({'triangles':triangles,'keys':count,'screenTitle':'PERSONAL / PROJECTS'}))

 # Apply the current screen-title and display-car revision after regenerating the peripherals.
 spec=importlib.util.spec_from_file_location('projects_car_model',ROOT/'blender/projects_car_model.py');module=importlib.util.module_from_spec(spec);spec.loader.exec_module(module);module.build()
