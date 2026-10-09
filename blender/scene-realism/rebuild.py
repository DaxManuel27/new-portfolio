import bpy,math,random,json,ast
from pathlib import Path
from mathutils import Vector,Matrix
R=Path('/Users/daxmanuel/Documents/ChatGPT/portfolio-site-blender');T=R/'design/interactive-workspace/textures'
s=bpy.data.scenes['Interactive Workspace'];bpy.context.window.scene=s;s.frame_set(1)
bpy.ops.wm.save_as_mainfile(filepath=str(R/'assets/_legacy/interactive-workspace-before-reference.blend'),copy=True)
s.name='Reference Desk';C=bpy.data.collections['COL_Interactables'];W=bpy.data.collections['COL_Workspace']
a=ast.parse((R/'blender/interactive-workspace/assemble.py').read_text());exec(compile(ast.Module(body=[n for n in a.body if isinstance(n,ast.FunctionDef)],type_ignores=[]),'helpers','exec'))
# Keep replaced meshes in the file but outside the rendered scene.
archive=bpy.data.collections.new('COL_Legacy_ReferenceRebuild')
def retire(o):
 for c in list(o.users_collection):c.objects.unlink(o)
 archive.objects.link(o)
def retire_tree(o):
 for c in list(o.children_recursive):retire(c)
 retire(o)
def pbr(m):return next(n for n in m.node_tree.nodes if n.type=='BSDF_PRINCIPLED')
cream=mat('MAT_Laminate_Greige',(.686,.650,.591),.60);charcoal=mat('MAT_PowderCoat_Charcoal',(.018,.018,.017),.53,.05);chrome=mat('MAT_Chrome_Frame',(.7,.72,.73),.19,1);leather=mat('MAT_Leather_Black',(.012,.010,.008),.36);offwhite=mat('MAT_Printer_OffWhite',(.66,.64,.59),.45);paper=mat('MAT_Paper_Cream',(.83,.78,.66),.8)
# Camera set first; blockout proportions are judged through this camera.
cam=bpy.data.objects['Camera_Overview'];cam.location=(.22,-2.4,1.80);target=Vector((0,0,.94));cam.rotation_euler=(target-cam.location).to_track_quat('-Z','Y').to_euler();cam.data.lens=40;s.camera=cam
for o in list(W.objects):
 if o.name.startswith('Desk_'):retire(o)
box('Desk_Top',(1.82,.90,.025),(0,0,.7275),cream,col=W,bevel=.009)
cab=root('Root_cabinet',W);cab.location=(-.71,-.015,0)
box('Cabinet_Case',(.36,.61,.695),(0,0,.35),charcoal,cab,W,.012)
for i,(z,h) in enumerate([(.56,.21),(.33,.22),(.105,.20)]):
 box('Cabinet_Drawer_%d'%i,(.338,.014,h),(0,-.313,z),charcoal,cab,W,.004)
 box('Cabinet_Pull_%d'%i,(.11,.016,.009),(0,-.325,z+.05),chrome,cab,W,.003)
for x in [-.79,.79]:
 for y in [-.34,.34]:box('Desk_Frame_Leg',(.035,.035,.70),(x,y,.35),charcoal,col=W,bevel=.004)
box('Desk_Frame_Rail',(1.60,.035,.065),(0,.34,.64),charcoal,col=W,bevel=.004)
# Flat monitor: replace the curved shell/display but retain root id and stand.
monitor=bpy.data.objects['Root_monitor']
for o in list(monitor.children):
 if any(x in o.name for x in ['Housing','PowerLED','Screen_']):retire(o)
monitor.location=(.06,.265,.74)
box('Monitor_Housing',(.865,.019,.366),(0,0,.28),charcoal,monitor,bevel=.006)
box('Monitor_Back_Recess',(.57,.020,.22),(0,.015,.28),charcoal,monitor,bevel=.009)
oldmat=bpy.data.materials['Artwork / Screen_Ultrawide_Projects']
screen=mesh('Screen_Ultrawide_Projects_Reference',[(-.423,-.010,.105),(.423,-.010,.105),(.423,-.010,.455),(-.423,-.010,.455)],[(0,1,2,3)],oldmat,monitor,uv=[(0,0),(1,0),(1,1),(0,1)])
# Larger laptop and car match the concept's tabletop footprint.
laptop=bpy.data.objects['Root_macbook'];laptop.location=(-.09,-.19,.74);laptop.scale=(1.40,)*3
sc=bpy.data.objects['MacBook_Screen'];im=next(n for n in sc.data.materials[0].node_tree.nodes if n.type=='TEX_IMAGE');im.image=bpy.data.images.load(str(T/'hack-atlantic-screen.png'),check_existing=True)
for o in laptop.children_recursive:
 if o.type=='MESH':
  for m in o.data.materials:
   if m and ('Silver' in m.name or 'alumin' in m.name.lower()):pbr(m).inputs['Metallic'].default_value=1;pbr(m).inputs['Roughness'].default_value=.35
car=bpy.data.objects['Root_car'];car.location=(-.62,-.14,.74);car.scale=(.18,)*3;car.rotation_euler.z=.58
carbon=mat('MAT_Car_CarbonComposite',(.012,.014,.013),.38,.12);rubber=mat('MAT_Car_TyreRubber',(.008,.009,.008),.78);alloy=mat('MAT_Car_DarkAlloy',(.045,.048,.05),.30,.85)
for o in car.children_recursive:
 if o.type=='MESH':
  for slot in o.material_slots:
   if slot.material:
    n=slot.material.name.lower();slot.material= rubber if 'rubber' in n else alloy if 'alloy' in n or 'steel' in n else carbon
  if any(k in o.name.lower() for k in ['body','nose','wing','sidepod']):
   mod=o.modifiers.new('Soft carbon panel edge','BEVEL');mod.width=.006;mod.segments=2
# Supporting props.
pi=bpy.data.objects['Root_pi'];pi.location=(-.40,-.34,.741);pi.rotation_euler.z=.15
phone=bpy.data.objects['Root_phone'];phone.location=(.76,-.30,.74);phone.rotation_euler.z=-.20;phone.scale=(.80,)*3
# Reflect the cord to the left, keeping handset fixed.
for o in phone.children_recursive:
 if 'Cord' in o.name or 'FlexibleLead' in o.name:
  if o.type=='MESH':
   o.data=o.data.copy()
   for v in o.data.vertices:v.co.x=-v.co.x
   o.location.x=-o.location.x
for o in phone.children_recursive:
 if o.type=='MESH':
  for m in o.data.materials:
   if m and 'oxblood' in m.name:
    p=pbr(m);p.inputs['Base Color'].default_value=(.16,.006,.004,1);p.inputs['Coat Weight'].default_value=1;p.inputs['Coat Roughness'].default_value=.18
printer=bpy.data.objects['Root_printer'];printer.location=(.68,.28,.74);printer.scale=(.90,)*3
for o in printer.children_recursive:
 if o.type=='MESH':
  for sl in o.material_slots:
   if sl.material and any(k in sl.material.name for k in ['Body','Lid','Tray','Trim']):sl.material=offwhite
# Replace notebook with a stationary spread, retaining destination root.
book=bpy.data.objects['Root_notebook']
for o in list(book.children_recursive):retire(o)
book.location=(.30,-.12,.74);book.rotation_euler.z=-.10
box('Sketchbook_Cover',(.292,.207,.003),(0,0,.0015),charcoal,book,bevel=.002)
for side in [-1,1]:
 box('Sketchbook_PageBlock',(.140,.198,.008),(side*.072,0,.006),paper,book,bevel=.001)
 verts=[];uv=[];nx=24
 for j in range(2):
  for i in range(nx+1):
   u=i/nx;x=side*(.002+u*.140);z=.011+.003*math.exp(-u*8)+.002*u**8;verts.append((x,(j-.5)*.198,z));uv.append((u if side==1 else 1-u,j))
 faces=[(i,i+1,i+nx+2,i+nx+1) if side==1 else (i+nx+1,i+nx+2,i+1,i) for i in range(nx)]
 mesh('Sketchbook_Page_'+('Right' if side==1 else 'Left'),verts,faces,paper,book,uv=uv)
pen=bpy.data.objects['Root_pen'];pen.location=(.37,-.14,.758);pen.rotation_euler.z=.8
# A separate resume lies flat to the right of the sketchbook.
resume=bpy.data.objects['Resume_Static_TraySheet'];retire(resume)
resumeRoot=root('Root_resume');resumeRoot.location=(.60,-.115,.741);resumeRoot.rotation_euler.z=.06
resumeMat=resume.data.materials[0];nx=24;verts=[];uv=[]
for j in range(2):
 for i in range(nx+1):
  u=i/nx;verts.append(((u-.5)*.216,(j-.5)*.279,.0015+u**10*.002));uv.append((u,j))
mesh('Resume_Sheet',verts,[(i,i+1,i+nx+2,i+nx+1) for i in range(nx)],resumeMat,resumeRoot,uv=uv)
# Foreground leather chair with chrome rails, cropped below the desk.
chair=root('Root_chair',W);chair.location=(.03,-.80,0);chair.rotation_euler.z=-.035
box('Chair_Back_Core',(.51,.065,.56),(0,0,.45),leather,chair,W,.022)
for i in range(9):box('Chair_Back_Cushion_%02d'%i,(.475,.026,.048),(0,-.041,.20+i*.057),leather,chair,W,.014)
for x in [-.26,.26]:
 box('Chair_Chrome_Side',(.014,.025,.58),(x,0,.45),chrome,chair,W,.006)
 box('Chair_Chrome_Arm',(.026,.33,.016),(x,-.09,.49),chrome,chair,W,.007)
box('Chair_Chrome_Top',(.53,.022,.018),(0,0,.74),chrome,chair,W,.008)
box('Chair_Seat',(.50,.46,.065),(0,.14,.20),leather,chair,W,.026)
# Keep armrests beside the seat with clear chrome mounting joints.
exec((R/'blender/scene-realism/fix-chair-arms.py').read_text())
exec((R/'blender/scene-realism/remove-mug.py').read_text())
# Wall and motivated soft studio lights.
wall=mat('MAT_Wall_Charcoal',(.018,.016,.014),.95);box('Wall',(12,.08,7),(0,1.55,2),wall,col=W,bevel=0)
for o in bpy.data.collections['COL_Lighting'].objects:
 if o.type=='LIGHT':
  if o.name=='Key':o.location=(-1.7,-1.3,2.8);o.data.energy=155;o.data.size=1.6;o.data.color=(1,.80,.59)
  elif o.name=='Fill':o.data.energy=28;o.data.size=2.0
  else:o.data.energy=65;o.data.size=1.2
  o.rotation_euler=(Vector((0,0,.8))-o.location).to_track_quat('-Z','Y').to_euler()
bg=next(n for n in s.world.node_tree.nodes if n.type=='BACKGROUND');bg.inputs['Strength'].default_value=.12
s.render.resolution_x=1440;s.render.resolution_y=1000;s.render.resolution_percentage=100;s.render.filepath=str(R/'blender/scene-realism/blockout.png')
bpy.ops.wm.save_as_mainfile(filepath=str(R/'blender/scene-realism.blend'));bpy.ops.render.render(write_still=True)
print('Reference blockout saved')
