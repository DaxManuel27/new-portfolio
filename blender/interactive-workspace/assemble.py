import bpy,math,json
from pathlib import Path
from mathutils import Vector,Matrix
R=Path('/Users/daxmanuel/Documents/ChatGPT/portfolio-site-blender');T=R/'design/interactive-workspace/textures'
s=bpy.data.scenes['Interactive Workspace'];bpy.context.window.scene=s;s.frame_set(31)
C=bpy.data.collections['COL_Interactables'];W=bpy.data.collections['COL_Workspace']
def enum(o,k,v):
 assert v in {i.identifier for i in o.bl_rna.properties[k].enum_items},(k,v)
 setattr(o,k,v)
def root(name,col=C):
 o=bpy.data.objects.new(name,None);col.objects.link(o);return o
def bounds(obs):
 bpy.context.view_layer.update();p=[o.matrix_world@Vector(c) for o in obs if o.type=='MESH' for c in o.bound_box]
 return Vector([min(v[i] for v in p) for i in range(3)]),Vector([max(v[i] for v in p) for i in range(3)])
def group(asset,pos,scale=1,angle=0):
 obs=[o for o in s.objects if o.get('workspace_asset')==asset]; mats={o:o.matrix_world.copy() for o in obs};lo,hi=bounds(obs);center=Vector(((lo.x+hi.x)/2,(lo.y+hi.y)/2,lo.z))
 g=root('Root_'+asset);g['destination']=asset
 for o,m in mats.items():
  o.animation_data_clear();o.parent=g;o.matrix_parent_inverse=Matrix.Identity(4);m.translation-=center;o.matrix_basis=m
 g.location=pos;g.scale=(scale,)*3;g.rotation_euler.z=angle
 return g
roots={}
roots['macbook']=group('macbook',(-.09,-.22,.74))
roots['monitor']=group('monitor',(-.11,.26,.74))
roots['car']=group('car',(-.56,-.14,.74),.145,-.30)
roots['pi']=group('pi',(-.42,-.34,.74),1.12,-.15)
roots['phone']=group('phone',(.60,-.30,.74),.85,-.12)
roots['printer']=group('printer',(.60,.26,.74))
roots['pen']=group('pen',(.41,-.11,.745),1,1.38)
def mat(name,color,rough=.5,metal=0,tex=None,emission=0):
 m=bpy.data.materials.new(name);m.use_nodes=True;p=next(n for n in m.node_tree.nodes if n.type=='BSDF_PRINCIPLED');p.inputs['Base Color'].default_value=(*color,1);p.inputs['Roughness'].default_value=rough;p.inputs['Metallic'].default_value=metal
 if tex:
  n=m.node_tree.nodes.new('ShaderNodeTexImage');n.image=bpy.data.images.load(str(T/tex),check_existing=True);m.node_tree.links.new(n.outputs['Color'],p.inputs['Base Color'])
  if emission:m.node_tree.links.new(n.outputs['Color'],p.inputs['Emission Color']);p.inputs['Emission Strength'].default_value=emission
 return m
ivory=mat('Workspace / warm ivory lacquer',(.72,.67,.57),.3);dark=mat('Workspace / charcoal metal',(.019,.022,.021),.3,.65)
paper=mat('Notebook / page edges',(.84,.80,.69),.8);cover=mat('Notebook / linen ivory',(.78,.73,.62),.65)
def mesh(name,verts,faces,material,parent=None,col=C,uv=None):
 d=bpy.data.meshes.new(name);d.from_pydata(verts,[],faces);d.update();o=bpy.data.objects.new(name,d);col.objects.link(o);o.parent=parent
 if material:d.materials.append(material)
 if uv:
  layer=d.uv_layers.new(name='UVMap')
  for face in d.polygons:
   for li in face.loop_indices:layer.data[li].uv=uv[d.loops[li].vertex_index]
 return o
def box(name,dims,pos,material,parent=None,col=C,bevel=.002):
 x,y,z=[v/2 for v in dims];o=mesh(name,[(-x,-y,-z),(x,-y,-z),(x,y,-z),(-x,y,-z),(-x,-y,z),(x,-y,z),(x,y,z),(-x,y,z)],[(0,3,2,1),(4,5,6,7),(0,1,5,4),(1,2,6,5),(2,3,7,6),(3,0,4,7)],material,parent,col);o.location=pos
 if bevel:
  mod=o.modifiers.new('Soft manufactured edges','BEVEL');mod.width=bevel;mod.segments=3;o.modifiers.new('Face normals','WEIGHTED_NORMAL')
 return o
def panel(name,w,h,z,material,parent,x=0,y=0,down=False):
 vs=[(x,y-h/2,z),(x+w,y-h/2,z),(x+w,y+h/2,z),(x,y+h/2,z)];uv=[(0,0),(1,0),(1,1),(0,1)]
 if down:uv=[(1,0),(0,0),(0,1),(1,1)]
 return mesh(name,vs,[(3,2,1,0) if down else (0,1,2,3)],material,parent,uv=uv)
box('Desk_Top',(1.75,.96,.042),(0,0,.719),ivory,col=W,bevel=.022)
for x in [-.75,.75]:
 for y in [-.35,.35]:box('Desk_Leg',(.032,.032,.697),(x,y,.3485),dark,col=W,bevel=.005)
box('Desk_RearBrace',(1.5,.025,.07),(0,.35,.61),dark,col=W,bevel=.004)
# Correct original screen UVs are retained.
for name,tex in [('MacBook_Screen','hack-atlantic-screen.png'),('Screen_Ultrawide_Projects','personal-projects-screen.png')]:
 o=bpy.data.objects.get(name);o.data.materials.clear();o.data.materials.append(mat('Artwork / '+name,(1,1,1),.4,tex=tex,emission=.3))
book=root('Root_notebook');roots['notebook']=book;book.location=(.25,-.14,.74);book.rotation_euler.z=-.08;book['destination']='ultra-maritime'
box('Notebook_Back',(.152,.214,.0025),(.074,0,.00125),cover,book,bevel=.0018)
box('Notebook_PageBlock',(.143,.203,.012),(.0745,0,.0085),paper,book,bevel=.0007)
for i in range(9):box('Notebook_PageEdge_%02d'%i,(.00012,.202,.00012),(.1461,0,.0035+i*.0012),mat('Page line %d'%i,(.55,.52,.46),.9),book,bevel=0)
right=mat('Artwork / notebook right',(1,1,1),.78,tex='um-page-right.png');panel('Notebook_RightPage',.143,.203,.0146,right,book,x=.003)
hinge=root('Notebook_CoverHinge');hinge.parent=book;hinge.location=(0,0,.017);hinge['pivotDescription']='left spine; negative local Y opens'
box('Notebook_Front',(.152,.214,.0025),(.074,0,0),cover,hinge,bevel=.0018)
panel('Notebook_CoverArtwork',.148,.210,.0013,mat('Artwork / Ultra Maritime cover',(1,1,1),.7,tex='um-cover-front.png'),hinge)
panel('Notebook_LeftPage',.143,.203,-.0013,mat('Artwork / notebook left',(1,1,1),.8,tex='um-page-left.png'),hinge,x=.003,down=True)
spine=box('Notebook_Spine',(.003,.211,.017),(-.001,0,.0085),dark,book,bevel=.001)
# Cover opens 180 degrees, left inside face ends above the tabletop.
hinge.rotation_euler.y=0;hinge.keyframe_insert(data_path='rotation_euler',frame=1);hinge.rotation_euler.y=-math.pi;hinge.keyframe_insert(data_path='rotation_euler',frame=37);hinge.animation_data.action.name='Notebook_Open'
# Receiver movement independent of the phone base.
phone=roots['phone'];receiver=root('Phone_Receiver');receiver.parent=phone
parts=[o for o in phone.children if any(q in o.name for q in ['Handset','CupTrim','SpeakerHole'])]
for o in parts:m=o.matrix_basis.copy();o.parent=receiver;o.matrix_basis=m
receiver.keyframe_insert(data_path='location',frame=1);receiver.location.z=.12;receiver.keyframe_insert(data_path='location',frame=25);receiver.animation_data.action.name='Phone_Receiver_Lift'
# Reuse ceramic geometry, replace its old artwork with plain ceramic.
with bpy.data.libraries.load(str(R/'blender/portfolio-shared-desk.blend'),link=False) as (a,b):b.objects=[n for n in a.objects if n in ['UltraMaritime_Ultra_UM_Mug_Handle','UltraMaritime_Ultra_UM_Mug_Body']]
for o in b.objects:
 C.objects.link(o);o['workspace_asset']='mug'
mug=group('mug',(-.53,.28,.74));roots['mug']=mug
ceramic=mat('Mug / ivory ceramic',(.78,.73,.63),.22)
for o in mug.children:
 if o.type=='MESH':o.data.materials.clear();o.data.materials.append(ceramic)
# Stage and cameras.
floor=mat('Stage / charcoal',(.018,.020,.019),.85);box('Stage',(200,200,.1),(0,0,-.055),floor,col=W,bevel=0)
def camera(name,pos,target,lens=50):
 d=bpy.data.cameras.new(name);o=bpy.data.objects.new(name,d);bpy.data.collections['COL_Cameras'].objects.link(o);o.location=pos;o.rotation_euler=(Vector(target)-o.location).to_track_quat('-Z','Y').to_euler();d.lens=lens;d.clip_start=.01;d.clip_end=250;return o
s.camera=camera('Camera_Overview',(1.00,-2.55,2.02),(0,0,.86),48)
camera('Camera_Notebook',(.30,-.62,1.22),(.17,-.14,.75),55)
camera('Camera_Portrait',(1.55,-3.9,2.75),(0,0,.83),50)
for key,g in roots.items():
 if key not in ['mug','pen','notebook']:
  p=g.location;camera('Camera_'+key,p+Vector((.08,-.60,.36)),p+Vector((0,0,.09)),50)
world=bpy.data.worlds.new('Workspace World');world.use_nodes=True;s.world=world
bg=next(n for n in world.node_tree.nodes if n.type=='BACKGROUND');bg.inputs['Color'].default_value=(.15,.17,.19,1);bg.inputs['Strength'].default_value=.25
for name,pos,power,color,size in [('Key',(-2,-1,3.5),250,(1,.83,.65),3),('Fill',(2,-.3,2.4),100,(.73,.84,1),2),('Rim',(0,2,2.8),200,(1,.9,.76),2)]:
 d=bpy.data.lights.new(name,'AREA');o=bpy.data.objects.new(name,d);bpy.data.collections['COL_Lighting'].objects.link(o);o.location=pos;o.rotation_euler=(Vector((0,0,.8))-o.location).to_track_quat('-Z','Y').to_euler();d.energy=power;d.color=color;d.size=size
s.render.resolution_x=1440;s.render.resolution_y=1000;s.render.resolution_percentage=70;s.frame_start=1;s.frame_end=120;s.frame_set(1)
s.render.filepath=str(R/'blender/interactive-workspace/overview.png')
bpy.ops.wm.save_as_mainfile(filepath=str(R/'blender/interactive-workspace.blend'))
print('assembled',len(s.objects),'saved')
