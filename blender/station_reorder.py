"""Station reorder source build. Run build(), render_sources(), export_all() via Blender MCP."""
import bpy, math, json, importlib.util, shutil
from pathlib import Path
from mathutils import Vector, Matrix, Quaternion
ROOT=Path('/Users/daxmanuel/Documents/ChatGPT/portfolio-site-blender')
PROJECTS_ORIGIN=(9,0,-2.5)
OUT=ROOT/'exports/station-reorder';OUT.mkdir(parents=True,exist_ok=True)
TEX=ROOT/'assets/textures/station-reorder'
C=Matrix.Rotation(-math.pi/2,4,'X')
def active(s):
 bpy.context.window.scene=s;bpy.context.view_layer.update()
def enum(o,p,v):
 assert v in {i.identifier for i in o.bl_rna.properties[p].enum_items},(p,v)
 setattr(o,p,v)
def curves(action):
 if hasattr(action,'fcurves'):yield from action.fcurves
 for layer in getattr(action,'layers',[]):
  for strip in layer.strips:
   for bag in getattr(strip,'channelbags',[]):yield from bag.fcurves
def camera(s,name,pos,target,width):
 d=bpy.data.cameras.new(name);enum(d,'type','ORTHO');d.ortho_scale=width;d.clip_start=.001;d.clip_end=100
 o=bpy.data.objects.new(name,d);s.collection.objects.link(o);o.location=pos;o.rotation_euler=(Vector(target)-o.location).to_track_quat('-Z','Y').to_euler();return o
def pose(o,origin=(0,0,0)):
 bpy.context.view_layer.update()
 m=C@o.matrix_world;p=m.translation+Vector(origin);q=m.to_quaternion()
 return {'position':list(p),'quaternion':[q.x,q.y,q.z,q.w],'width':o.data.ortho_scale}
def duplicate_scene(name,source,exclude_hero=True):
 src=bpy.data.scenes['Completion — '+source];src.frame_set(121);active(src)
 s=bpy.data.scenes.new('Reorder — '+name);s.world=src.world;s.render.engine=src.render.engine;s.render.fps=30
 s.render.resolution_x=1440;s.render.resolution_y=960;s.render.resolution_percentage=100
 s.view_settings.view_transform=src.view_settings.view_transform;s.view_settings.look=src.view_settings.look;s.view_settings.exposure=src.view_settings.exposure
 s.render.film_transparent=True
 col=bpy.data.collections.new('COL_Reorder_'+name);s.collection.children.link(col)
 hero=bpy.data.objects[src['hero']];exclude={hero,*hero.children_recursive} if exclude_hero else set()
 mp={}
 for o in src.objects:
  if o in exclude or 'Cutter' in o.name:continue
  n=o.copy();n.name='Reorder_'+o.name;n.animation_data_clear()
  if n.type in ['CAMERA','LIGHT']:n.data=o.data.copy();n.data.animation_data_clear()
  col.objects.link(n);mp[o]=n
 for o,n in mp.items():
  n.parent=mp.get(o.parent);n.matrix_parent_inverse=o.matrix_parent_inverse.copy();n.matrix_basis=o.matrix_basis.copy()
  for mod in n.modifiers:
   if hasattr(mod,'object') and mod.object in mp:mod.object=mp[mod.object]
 s.camera=mp[src.camera];active(s);return s,mp

def screen(s,old_name,name,file=None):
 old=next(o for o in s.objects if o.name.endswith(old_name));active(s)
 pts=[old.matrix_world@Vector(v) for v in old.bound_box];lo=Vector([min(v[i] for v in pts) for i in range(3)]);hi=Vector([max(v[i] for v in pts) for i in range(3)])
 # A flat inset front surface replaces the artwork; curved housings rebuild it afterwards (see the ultrawide below).
 y=lo.y-.001;cx=(lo.x+hi.x)/2;cz=(lo.z+hi.z)/2;w=hi.x-lo.x;h=hi.z-lo.z
 d=bpy.data.meshes.new(name);d.from_pydata([(-w/2,-h/2,0),(w/2,-h/2,0),(w/2,h/2,0),(-w/2,h/2,0)],[],[(0,1,2,3)]);d.update()
 n=bpy.data.objects.new(name,d);s.collection.objects.link(n);n.location=(cx,y,cz);n.rotation_euler=(math.pi/2,0,0)
 uv=d.uv_layers.new(name='ArtworkUV')
 for p in d.polygons:
  for li in p.loop_indices:uv.data[li].uv=[(0,0),(1,0),(1,1),(0,1)][d.loops[li].vertex_index]
 old.hide_render=True;old.hide_viewport=True
 if file:material(n,file)
 return n,{'mesh':name,'center':[cx,cz,-y],'right':[1,0,0],'up':[0,1,0],'normal':[0,0,1],'width':w,'height':h}
def material(o,file):
 m=bpy.data.materials.new('MAT_'+o.name);m.use_nodes=True
 p=next(n for n in m.node_tree.nodes if n.type=='BSDF_PRINCIPLED');p.inputs['Base Color'].default_value=(0,0,0,1);p.inputs['Roughness'].default_value=.7
 im=bpy.data.images.load(str(file),check_existing=True);im.pack();n=m.node_tree.nodes.new('ShaderNodeTexImage');n.image=im
 m.node_tree.links.new(n.outputs['Color'],p.inputs['Base Color']);m.node_tree.links.new(n.outputs['Color'],p.inputs['Emission Color']);p.inputs['Emission Strength'].default_value=.5
 o.data.materials.clear();o.data.materials.append(m)
def build():
 backup=ROOT/'backups/pre-station-reorder/blender/live-before-reorder.blend'
 if not backup.exists():bpy.ops.wm.save_as_mainfile(filepath=str(backup),copy=True)
 assert not bpy.data.scenes.get('Reorder — Workstation'),'Already built: inspect before retrying'
 ws,mp=duplicate_scene('Workstation','Ultra Maritime',False)
 hero=mp[bpy.data.objects['UltraMaritime_MacBook_TravelRoot']];hero.location=(0,-.22,.749483764);hero.rotation_euler=(0,0,0)
 um,umf=screen(ws,'Ultra_Monitor_Left_Screen','Screen_Workstation_UM',TEX/'ultra-maritime.png')
 fs,fsf=screen(ws,'Ultra_Monitor_Right_Screen','Screen_Workstation_FSAE')
 wide=camera(ws,'CAM_Reorder_Workstation_Wide',(1.08,-2.39,1.91),(0,0,.92),2.15)
 left=camera(ws,'CAM_Reorder_UM_Close',(-.325,-2.4,1.14),(-.325,.162,1.14),.69)
 right=camera(ws,'CAM_Reorder_FSAE_Monitor_Close',(.325,-2.4,1.14),(.325,.162,1.14),.69)
 ws.camera=wide
 car,_=duplicate_scene('Formula SAE','Formula SAE')
 # Existing model and conceptual callouts retained; remove obsolete empty laptop table.
 for o in car.objects:
  if 'Desk_Station' in o.name:o.hide_render=True;o.hide_viewport=True
 cw=car.camera;cw.name='CAM_Reorder_Car_Close'
 # Centre entire car/callout composition using the original overview camera.
 cw.location=(1.331121063232422,-2.322525978088379,2.108537197113037)
 cw.data.ortho_scale=1.2334922552108765
 carwide=cw.copy();carwide.data=cw.data.copy();car.collection.objects.link(carwide);carwide.name='CAM_Reorder_Car_Wide';carwide.data.ortho_scale*=1.35
 active(car)
 car_close,car_wide=pose(cw,(4.4,0,-12)),pose(carwide,(4.4,0,-12))
 ultra,_=duplicate_scene('Ultrawide','Projects')
 screenob,sf=screen(ultra,'Personal_Ultrawide_Screen','Screen_Ultrawide_Projects',TEX/'projects-monitor.png')
 # The housing is curved: rebuild the glass concentric with it, with chord-uniform UVs (curve_ultrawide_screen.py).
 spec=importlib.util.spec_from_file_location('curve_ultrawide_screen',ROOT/'blender/curve_ultrawide_screen.py');cu=importlib.util.module_from_spec(spec);spec.loader.exec_module(cu)
 info,centre=cu.build(ultra);sf.update(center=list(centre),width=info['chordWidth'],height=info['height'],curvature={k:info[k] for k in ('radius','segments','chordWidth','sagitta','gap','uv')})
 uw=camera(ultra,'CAM_Reorder_Ultrawide_Wide',(1.09,-2.39,1.89),(0,0,.94),2.15)
 sc=sf['center'];uc=camera(ultra,'CAM_Reorder_Ultrawide_Close',(sc[0],-2.4,sc[1]),(sc[0],-sc[2],sc[1]),.97);ultra.camera=uw
 active(ultra)
 ultra_wide,ultra_close=pose(uw,PROJECTS_ORIGIN),pose(uc,PROJECTS_ORIGIN)
 active(ws)
 hq=hero.matrix_world.to_quaternion();lid=next(o for o in hero.children_recursive if o.name.endswith('MacBook_LidPivot')).rotation_quaternion if hero.rotation_mode=='QUATERNION' else next(o for o in hero.children_recursive if o.name.endswith('MacBook_LidPivot')).rotation_euler.to_quaternion()
 # glTF rotations of child nodes conjugate by the axis conversion, rather than camera conversion.
 cq=C.to_quaternion();dq=cq@hq@cq.inverted();lq=cq@lid@cq.inverted()
 layout={'version':3,'origins':{'workstation':[4.4,0,.8],'car':[4.4,0,-12],'ultrawide':list(PROJECTS_ORIGIN)},'workstation':{'wide':pose(wide,(4.4,0,.8)),'close':pose(left,(4.4,0,.8)),'monitorClose':pose(right,(4.4,0,.8)),'dock':{'position':[4.4,.74,1.02],'quaternion':[dq.x,dq.y,dq.z,dq.w],'lid':[lq.x,lq.y,lq.z,lq.w]},'screens':{'um':umf,'fsae':fsf}},'car':{'close':pose(cw,(4.4,0,-12)),'wide':pose(carwide,(4.4,0,-12))},'ultrawide':{'wide':pose(uw,PROJECTS_ORIGIN),'close':pose(uc,PROJECTS_ORIGIN),'screen':sf}}
 for key in ['um','fsae']:
  layout['workstation']['screens'][key]['center'][0]+=4.4;layout['workstation']['screens'][key]['center'][2]+=.8
 layout['ultrawide']['screen']['center']=[v+d for v,d in zip(layout['ultrawide']['screen']['center'],PROJECTS_ORIGIN)]
 layout['ultrawide'].update(wide=ultra_wide,close=ultra_close)
 layout['car'].update(close=car_close,wide=car_wide)
 (OUT/'layout.json').write_text(json.dumps(layout,indent=2))
 # Preserve baseline first-flight poses, then apply the banner clearance below.
 journey=bpy.data.scenes['Completion — Portfolio Journey'];active(journey)
 feet=bpy.data.objects['Journey_TravelFeet'];spin=bpy.data.objects['Journey_MacBook_SpinPivot'];hinge=bpy.data.objects['Journey_MacBook_LidPivot'];cam=bpy.data.objects['CAM_Journey_Centered']
 spec=importlib.util.spec_from_file_location('hack_clearance',ROOT/'blender/hack_banner_clearance.py')
 clearance=importlib.util.module_from_spec(spec);spec.loader.exec_module(clearance)
 corrected=feet.get('hack_banner_clearance_v1',False)
 records=[]
 for f in range(1,122):
  journey.frame_set(f);row=[(o.location.copy(),o.rotation_euler.copy()) for o in [feet,spin,hinge,cam]]+[cam.data.ortho_scale]
  if corrected:
   offset=clearance.forward_offset((f-1)/30)
   row[0][0].y+=offset;row[3][0].y+=offset
  records.append(row)
 for o in [feet,spin,hinge,cam]:o.animation_data_clear()
 cam.data.animation_data_clear()
 start=records[-1];end=Vector((4.4,-.22,.74));sq=start[1][1].to_quaternion();closed=math.radians(110)
 runtime=json.loads((ROOT/'backups/pre-station-reorder/web/public/assets/journey.json').read_text())
 travel=runtime['travel'];smo=lambda t:max(0,min(1,t))**2*(3-2*max(0,min(1,t)))
 for f in range(1,722):
  if f<=121:
   row=records[f-1]
   for o,(loc,rot) in zip([feet,spin,hinge,cam],row[:4]):o.location=loc;o.rotation_euler=rot
   cam.data.ortho_scale=row[4]
  else:
   p=min(1,(f-121)/120)
   if p<.18:pos=start[0][0].lerp(start[0][0]+Vector((0,-.22,.55)),smo(p/.18))
   elif p<.72:pos=(start[0][0]+Vector((0,-.22,.55))).lerp(end+Vector((0,0,.55)),smo((p-.18)/.54))
   else:pos=(end+Vector((0,0,.55))).lerp(end,smo((p-.72)/.28))
   feet.location=pos;spin.rotation_euler=sq.slerp(Quaternion(),smo(p)).to_euler();hinge.rotation_euler=(closed,0,0)
   # Follow the same camera orientation; finish on the explicit Workstation wide.
   a=Vector(start[3][0]);b=wide.location+Vector((4.4,0,0));cam.location=a.lerp(b,smo(p));cam.rotation_euler=start[3][1].to_quaternion().slerp(wide.rotation_euler.to_quaternion(),smo(p)).to_euler();cam.data.ortho_scale=start[4]*(1-smo(p))+2.15*smo(p)
  if f>121:
   feet.location.y-=.8*smo(p/.18);cam.location.y-=.8*smo(p)
  for o in [feet,spin,hinge,cam]:
   o.keyframe_insert(data_path='location',frame=f);o.keyframe_insert(data_path='rotation_euler',frame=f)
  cam.data.keyframe_insert(data_path='ortho_scale',frame=f)
  if 121<f<=241:
   bpy.context.view_layer.update();po=pose(cam);travel[f-1].update(po);p=(f-121)/120;travel[f-1]['center']=[.5,.5];travel[f-1]['opacity']=[0,1-smo(p/.4),smo((p-.6)/.4),0,0,0,0]
 for o in [feet,spin,hinge,cam,cam.data]:
  if o.animation_data and o.animation_data.action:
   o.animation_data.action.name='AN_Reorder_'+o.name
   for fc in curves(o.animation_data.action):
    for k in fc.keyframe_points:k.interpolation='LINEAR'
 # Original opacity indexes swap at the immutable first flight boundary only.
 for row in travel[:121]:row['opacity'][2],row['opacity'][3]=row['opacity'][3],row['opacity'][2]
 (OUT/'travel.json').write_text(json.dumps(travel))
 # Build a world-placement review using the new station copies, preserving source station scenes.
 for idx in range(7):
  root=bpy.data.objects.get('Journey_Station_'+str(idx))
  if root:
   for o in [root,*root.children_recursive]:o.hide_render=True;o.hide_viewport=True
 for s,offset in [(ws,(4.4,-.8,0)),(car,(4.4,12,0)),(ultra,PROJECTS_ORIGIN)]:
  col=bpy.data.collections.new('COL_Reorder_Journey_'+s.name);journey.collection.children.link(col);mapping={}
  for o in s.objects:
   if o.type in ['LIGHT','CAMERA'] or 'MacBook' in o.name:continue
   n=o.copy();n.name='Review_'+o.name;n.animation_data_clear();col.objects.link(n);mapping[o]=n
  for o,n in mapping.items():
   n.parent=mapping.get(o.parent);n.matrix_parent_inverse=o.matrix_parent_inverse.copy();n.matrix_basis=o.matrix_basis.copy()
   if not n.parent:n.location+=Vector(offset)
 # Apply the banner clearance after rebuilding the baseline first flight.
 feet.pop('hack_banner_clearance_v1', None)
 clearance.apply()
 # Restore the original Hack turntable and fit its camera after clearance.
 spec=importlib.util.spec_from_file_location('workstation_rotation',ROOT/'blender/workstation_rotation.py')
 rotation=importlib.util.module_from_spec(spec);spec.loader.exec_module(rotation)
 rotation.apply(save=False)
 # Save separate file. Original source file remains untouched on disk.
 journey.frame_set(241);active(ws)
 bpy.ops.wm.save_as_mainfile(filepath=str(ROOT/'blender/portfolio-station-reorder.blend'))
 print('Built new station scenes, measured monitor frames, preserved Intro and landing, applied Hack banner clearance; layout saved.')

def render_sources():
 for name,filename in [('Formula SAE','fsae-preview'),('Workstation','ultra-maritime'),('Ultrawide','ultrawide')]:
  s=bpy.data.scenes['Reorder — '+name];active(s)
  try:s.render.engine='CYCLES'
  except TypeError:pass
  s.cycles.samples=16;s.cycles.use_denoising=True;s.render.resolution_x=1440;s.render.resolution_y=960;s.render.resolution_percentage=100
  enum(s.render.image_settings,'file_format','PNG');enum(s.render.image_settings,'color_mode','RGBA');s.render.filepath=str(OUT/(filename+'.png'))
  bpy.ops.render.render(write_still=True)
  if name=='Formula SAE':
   shutil.copy2(OUT/(filename+'.png'),TEX/'fsae-preview.png');material(bpy.data.objects['Screen_Workstation_FSAE'],TEX/'fsae-preview.png')
 bpy.ops.wm.save_as_mainfile(filepath=str(ROOT/'blender/portfolio-station-reorder.blend'))
 print('Rendered car preview and station posters')

def export_all():
 # The fixed logger remains accessible after any complete station rebuild.
 spec=importlib.util.spec_from_file_location('pi_access_bay',ROOT/'blender/pi_access_bay.py');bay=importlib.util.module_from_spec(spec);spec.loader.exec_module(bay);bay.run(export=False)
 spec=importlib.util.spec_from_file_location('cp',ROOT/'blender/completion_pipeline.py');cp=importlib.util.module_from_spec(spec);spec.loader.exec_module(cp);cp.OUT=OUT
 for name,slug in [('Workstation','station-ultra-maritime'),('Formula SAE','station-formula-sae'),('Ultrawide','station-projects')]:
  s=bpy.data.scenes['Reorder — '+name];excluded=set()
  for o in s.objects:
   if o.name.endswith('MacBook_TravelRoot'):excluded.update([o,*o.children_recursive])
  obs=[o for o in s.objects if o not in excluded];cp.export_objects(s,obs,slug)
 s=bpy.data.scenes['Completion — Portfolio Journey'];active(s);s.frame_set(1);root=bpy.data.objects['Journey_TravelFeet'];obs=[root,*root.children_recursive]
 for o in obs:o.hide_render=False;o.hide_viewport=False
 cp.export_objects(s,obs,'macbook-journey',True,1,721)
 active(bpy.data.scenes['Reorder — Workstation']);print('Exported reordered GLBs to separate source directory')
