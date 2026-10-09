"""Run once on the backed-up Reference Desk. Only the six approved changes."""
import bpy,math,ast,bmesh
from pathlib import Path
from mathutils import Vector,Matrix
R=Path('/Users/daxmanuel/Documents/ChatGPT/portfolio-site-blender');T=R/'design/desk-fixes';s=bpy.context.scene
assert s.name=='Reference Desk'
assert not s.get('approved_six_fixes'), 'Already applied; use the saved scene for subsequent edits.'
C=bpy.data.collections['COL_Interactables'];W=bpy.data.collections['COL_Workspace']
a=ast.parse((R/'blender/interactive-workspace/assemble.py').read_text());exec(compile(ast.Module(body=[n for n in a.body if isinstance(n,ast.FunctionDef)],type_ignores=[]),'helpers','exec'))
archive=bpy.data.collections.new('COL_Archive_SixFixes');archive.use_fake_user=True
def retire(o):
 for c in list(o.users_collection):c.objects.unlink(o)
 archive.objects.link(o)
def art(obj,file,name,emission=0):
 m=mat(name,(1,1,1),.7,tex=file,emission=emission);obj.data.materials.clear();obj.data.materials.append(m)
 return m
# Pi mechanically mounted on the rear deck, behind the driver's seat.
car=bpy.data.objects['Root_car'];pi=bpy.data.objects['Root_pi'];pi.parent=car;pi.matrix_parent_inverse=Matrix.Identity(4);pi.location=(0,.78,.485);pi.rotation_euler=(0,0,0);pi.scale=(.95/.195,)*3
carbon=bpy.data.materials['MAT_Car_CarbonComposite'];box('FSAE_DataLogger_Mount',(.48,.36,.024),(0,.78,.46),carbon,car,bevel=.009)
for o in list(car.children_recursive):
 if o.type=='FONT':retire(o)
# Existing Hack Atlantic landing page, not a newly designed hero.
art(bpy.data.objects['MacBook_Screen'],'hack-landing.png','MAT_Figma_laptop',.8)
# Curved screen and matching shell, 1400 mm radius in model space.
monitor=bpy.data.objects['Root_monitor'];charcoal=bpy.data.materials['MAT_PowderCoat_Charcoal']
for o in list(monitor.children):
 if o.name in ['Monitor_Housing','Monitor_Back_Recess','Screen_Ultrawide_Projects_Reference']:retire(o)
def curve(x):return 1.4*(math.cos(x/1.4)-1)
N=64;verts=[]
for i in range(N+1):
 x=-.4325+.865*i/N
 for y,z in [(-.0095,.172),(-.0095,.538),(.012,.172),(.012,.538)]:verts.append((x,y+curve(x),z))
faces=[]
for i in range(N):
 a=i*4;b=(i+1)*4;faces.extend([(a,b,b+1,a+1),(a+2,a+3,b+3,b+2),(a,a+2,b+2,b),(a+1,b+1,b+3,a+3)])
faces.extend([(0,1,3,2),(N*4,N*4+2,N*4+3,N*4+1)])
shell=mesh('Monitor_CurvedHousing',verts,faces,charcoal,monitor);bm=bmesh.new();bm.from_mesh(shell.data);bmesh.ops.recalc_face_normals(bm,faces=bm.faces);bm.to_mesh(shell.data);bm.free()
bevel=shell.modifiers.new('Manufactured edge radius','BEVEL');bevel.width=.002;bevel.segments=3;shell.modifiers.new('Surface normals','WEIGHTED_NORMAL')
verts=[];uv=[]
for j,z in enumerate([.180,.530]):
 for i in range(N+1):
  u=i/N;x=-.423+.846*u;verts.append((x,-.0103+curve(x),z));uv.append((u,j))
screen=mesh('Screen_Ultrawide_Projects_Curved',verts,[(i,i+1,i+N+2,i+N+1)for i in range(N)],None,monitor,uv=uv)
art(screen,'personal-projects.png','MAT_Figma_monitor',.8)
for p in screen.data.polygons:p.use_smooth=True
monitor['curveRadiusMeters']=1.4;monitor['destination']='projects'
# Restore the notebook's original cover and inside pages; runtime controls its hinge.
book=bpy.data.objects['Root_notebook']
for o in list(book.children_recursive):retire(o)
book.location=(.42,.035,.74);book.rotation_euler.z=-.1;book['destination']='ultra-maritime'
cover=mat('SixFixes / notebook linen',(.78,.73,.62),.65);paper=bpy.data.materials['MAT_Paper_Cream']
box('UM_Notebook_Back',(.152,.214,.0025),(.074,0,.00125),cover,book,bevel=.0018)
box('UM_Notebook_PageBlock',(.143,.203,.012),(.0745,0,.0085),paper,book,bevel=.0007)
page=panel('UM_Notebook_RightPage',.143,.203,.0147,None,book,x=.003);art(page,'um-page-right.png','MAT_UM_Contributions')
hinge=root('UM_Notebook_CoverHinge');hinge.parent=book;hinge.location=(0,0,.017);hinge['openingAxis']='local Y in Blender / local Z in glTF';hinge['openRadians']=-math.pi
box('UM_Notebook_Front',(.152,.214,.0025),(.074,0,0),cover,hinge,bevel=.0018)
front=panel('UM_Notebook_CoverArtwork',.148,.210,.0014,None,hinge);art(front,'um-cover-front.png','MAT_UM_Cover')
left=panel('UM_Notebook_LeftPage',.143,.203,-.0014,None,hinge,x=.003,down=True);art(left,'um-page-left.png','MAT_UM_InsideCover')
box('UM_Notebook_Spine',(.003,.211,.017),(-.001,0,.0085),charcoal,book,bevel=.001)
bpy.data.objects['Root_pen'].location=(.61,.015,.758)
# Deep output tray: inset receiver, sloped shelf, side guides and raised paper stop.
printer=bpy.data.objects['Root_printer'];offwhite=bpy.data.materials['MAT_Printer_OffWhite']
for o in list(printer.children_recursive):
 if any(q in o.name for q in ['OutputTray','TrayEdge']):retire(o)
tray=root('Printer_OutputTray_Fixed');tray.parent=printer;tray.location=(0,-.205,.056);tray.rotation_euler.x=-.025
box('Printer_Tray_Shelf',(.243,.210,.004),(0,0,0),offwhite,tray,bevel=.002)
box('Printer_Tray_Extension',(.218,.100,.003),(0,-.136,-.0015),offwhite,tray,bevel=.0015)
for x in [-.119,.119]:box('Printer_Tray_SideGuide',(.004,.210,.010),(x,0,.004),offwhite,tray,bevel=.0018)
box('Printer_Tray_PaperStop',(.218,.004,.013),(0,-.184,.003),offwhite,tray,bevel=.0015)
for x in [-.08,.08]:box('Printer_Tray_Support',(.014,.105,.008),(x,.06,-.006),charcoal,tray,bevel=.002)
resume=bpy.data.objects['Root_resume'];resume.parent=tray;resume.matrix_parent_inverse=Matrix.Identity(4);resume.location=(0,-.04,.003);resume.rotation_euler=(0,0,0);resume.scale=(.91,)*3
# Preserve static phone and printer behavior.
s['approved_six_fixes']=True;bpy.context.view_layer.update();bpy.ops.wm.save_as_mainfile(filepath=str(R/'blender/scene-realism.blend'))
exec((R/'blender/scene-realism/export-preview.py').read_text())
print('Approved six fixes saved and exported.')
