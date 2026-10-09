import bpy,math,random,ast
from pathlib import Path
from mathutils import Vector,Matrix
R=Path('/Users/daxmanuel/Documents/ChatGPT/portfolio-site-blender');T=R/'design/interactive-workspace/textures';s=bpy.context.scene;C=bpy.data.collections['COL_Interactables'];W=bpy.data.collections['COL_Workspace']
a=ast.parse((R/'blender/interactive-workspace/assemble.py').read_text());exec(compile(ast.Module(body=[n for n in a.body if isinstance(n,ast.FunctionDef)],type_ignores=[]),'helpers','exec'))
cam=s.camera;cam.data.lens=48;cam.rotation_euler=(Vector((0,0,.83))-cam.location).to_track_quat('-Z','Y').to_euler()
monitor=bpy.data.objects['Root_monitor']
for o in monitor.children:
 if 'Monitor_' in o.name or 'Screen_' in o.name:o.location.z+=.075
car=bpy.data.objects['Root_car'];car.rotation_euler.z=1.0;car.scale=(.195,)*3;car.location.x=-.60
# Glazed ceramic mug restored from existing source, flattened to local geometry.
with bpy.data.libraries.load(str(R/'blender/portfolio-shared-desk.blend'),link=False) as (a,b):b.objects=[n for n in a.objects if n in ['UltraMaritime_Ultra_UM_Mug_Handle','UltraMaritime_Ultra_UM_Mug_Body']]
for o in b.objects:C.objects.link(o)
bpy.context.view_layer.update();obs=list(b.objects);mats={o:o.matrix_world.copy() for o in obs};lo,hi=bounds(obs);center=Vector(((lo.x+hi.x)/2,(lo.y+hi.y)/2,lo.z));mug=root('Root_mug');mug.location=(-.43,.23,.74)
ceramic=mat('MAT_Ceramic_WarmWhite',(.78,.73,.63),.2);p=next(n for n in ceramic.node_tree.nodes if n.type=='BSDF_PRINCIPLED');p.inputs['Coat Weight'].default_value=.35
for o,m in mats.items():o.parent=mug;o.matrix_parent_inverse=Matrix.Identity(4);m.translation-=center;o.matrix_basis=m;o.data.materials.clear();o.data.materials.append(ceramic)
# Curved lettering decal.
body=next(o for o in obs if 'Body' in o.name);verts=[];uv=[];n=32
for j in range(2):
 for i in range(n+1):
  a=-math.pi/2+(i/n-.5)*1.7;verts.append((.0433*math.cos(a),.0433*math.sin(a),.020+j*.067));uv.append((i/n,j))
m=mat('MAT_Mug_Lettering',(1,1,1),.25,tex='mug-lettering.png');p=next(n for n in m.node_tree.nodes if n.type=='BSDF_PRINCIPLED');t=next(n for n in m.node_tree.nodes if n.type=='TEX_IMAGE');m.node_tree.links.new(t.outputs['Alpha'],p.inputs['Alpha']);mesh('Mug_Lettering',verts,[(i,i+1,i+n+2,i+n+1) for i in range(n)],m,body,uv=uv)
# Smooth heart-shaped pothos leaves with curved surfaces and visible veins.
def lathe(name,profile,material,parent):
 n=48;v=[(r*math.cos(i*2*math.pi/n),r*math.sin(i*2*math.pi/n),z) for r,z in profile for i in range(n)];f=[(j*n+i,j*n+(i+1)%n,(j+1)*n+(i+1)%n,(j+1)*n+i) for j in range(len(profile)-1) for i in range(n)];o=mesh(name,v,f,material,parent)
 for p in o.data.polygons:p.use_smooth=True
 return o
def tube(name,points,r,material,parent):
 v=[];n=8
 for i,p in enumerate(points):
  tangent=Vector(points[min(i+1,len(points)-1)])-Vector(points[max(i-1,0)]);q=tangent.to_track_quat('Z','Y')
  for j in range(n):v.append(tuple(Vector(p)+q@Vector((r*math.cos(j*2*math.pi/n),r*math.sin(j*2*math.pi/n),0))))
 o=mesh(name,v,[(i*n+j,i*n+(j+1)%n,(i+1)*n+(j+1)%n,(i+1)*n+j) for i in range(len(points)-1) for j in range(n)],material,parent)
 for p in o.data.polygons:p.use_smooth=True
 return o
leafM=[mat('MAT_Pothos_Leaf_%d'%i,(.025+i*.016,.048+i*.012,.009+i*.004),.43) for i in range(3)];veinM=mat('MAT_Pothos_Vein',(.13,.16,.025),.60);soil=mat('MAT_Pot_Soil',(.016,.010,.005),.96)
for m in leafM:
 p=next(n for n in m.node_tree.nodes if n.type=='BSDF_PRINCIPLED');p.inputs['Sheen Weight'].default_value=.18;p.inputs['Subsurface Weight'].default_value=.045
plant=root('Root_plant');plant.location=(-.70,.26,.74)
lathe('Pothos_Pot',[(0,0),(.061,0),(.067,.014),(.072,.09),(.071,.102),(.065,.103),(.061,.020),(0,.020)],ceramic,plant);lathe('Pothos_Soil',[(0,.096),(.064,.096)],soil,plant)
random.seed(22)
for i in range(45):
 a=i*2.399;rad=random.uniform(.035,.14);z=random.uniform(.12,.24);trail=i>30
 if trail:rad+=.025;z-=.085
 center=Vector((rad*math.cos(a),rad*math.sin(a),z));axis=Vector((math.cos(a),math.sin(a),-.65 if trail else -.2));side=Vector((-math.sin(a),math.cos(a),0));length=random.uniform(.055,.09);v=[];uv=[];N=14
 for k in range(N+1):
  t=k/N;width=length*.38*math.sin(math.pi*t)**.7*(1+.35*math.cos(math.pi*t));point=center+axis*(t-.40)*length
  for j in [-1,0,1]:v.append(tuple(point+side*j*width+Vector((0,0,(1-j*j)*.006*math.sin(math.pi*t)))));uv.append(((j+1)/2,t))
 o=mesh('Pothos_Leaf_%02d'%i,v,[(k*3+j,k*3+j+1,(k+1)*3+j+1,(k+1)*3+j) for k in range(N) for j in range(2)],leafM[i%3],plant,uv=uv)
 for p in o.data.polygons:p.use_smooth=True
 start=Vector((0,0,.09));base=center-axis*.4*length;tube('Pothos_Stem',[start,(start+base)/2+Vector((0,0,.02)),base],.00065,leafM[0],plant)
 tube('Pothos_CenterVein',[Vector(v[k*3+1])+Vector((0,0,.0002)) for k in range(N+1)],.00024,veinM,plant)
# Car: layered wings, sidepod vents, fasteners, original race markings.
carbon=bpy.data.materials['MAT_Car_CarbonComposite'];alloy=bpy.data.materials['MAT_Car_DarkAlloy'];white=mat('MAT_RaceMarkings_Ivory',(.80,.79,.72),.55)
for y,z,w in [(-1.05,.22,1.26),(1.17,.79,1.09)]:
 for j in range(2):
  o=box('FSAE_AeroCascade', (w,.055,.012),(0,y+j*.065,z+j*.035),carbon,car,bevel=.008);o.rotation_euler.x=.18
for side in [-1,1]:
 for j in range(6):box('FSAE_Sidepod_Louvre',(.018,.11,.025),(side*.49,-.12+j*.13,.27),alloy,car,bevel=.005)
 for j in range(8):
  o=box('FSAE_Panel_Fastener',(.014,.014,.008),(side*.16,-.65+j*.16,.32),alloy,car,bevel=.006)
def label(name,body,pos,rot,size):
 d=bpy.data.curves.new(name,'FONT');d.body=body;d.size=size;d.extrude=.0002;d.materials.append(white);o=bpy.data.objects.new(name,d);C.objects.link(o);o.parent=car;o.location=pos;o.rotation_euler=rot;return o
label('FSAE_Number_Nose','01',(-.115,-.98,.246),(0,0,0),.19)
for side in [-1,1]:
 label('FSAE_Number_Side','01',(side*.502,-.34,.18),(math.pi/2,0,side*math.pi/2),.15)
 label('FSAE_Wing_E01','E-01',(side*.575,1.02,.72),(math.pi/2,0,side*math.pi/2),.10)
label('FSAE_Original_Decal','STUDENT MOTORSPORT',(-.23,-.20,.35),(0,0,0),.037)
label('FSAE_Original_Decal','ENGINEERING LAB',(-.16,-.56,.31),(0,0,0),.031)
# Fine satin variation. These procedural shading details are later baked for web.
for m in [bpy.data.materials['MAT_Laminate_Greige'],carbon,bpy.data.materials['MAT_Leather_Black']]:
 p=next(n for n in m.node_tree.nodes if n.type=='BSDF_PRINCIPLED');noise=m.node_tree.nodes.new('ShaderNodeTexNoise');noise.inputs['Scale'].default_value=350 if m==carbon else 550;noise.inputs['Roughness'].default_value=.6;bump=m.node_tree.nodes.new('ShaderNodeBump');bump.inputs['Strength'].default_value=.12;bump.inputs['Distance'].default_value=.00005;m.node_tree.links.new(noise.outputs['Fac'],bump.inputs['Height']);m.node_tree.links.new(bump.outputs['Normal'],p.inputs['Normal'])
s.cycles.samples=24;s.cycles.use_denoising=True;s.render.resolution_percentage=75;s.render.filepath=str(R/'blender/scene-realism/detail.png')
bpy.ops.wm.save_as_mainfile(filepath=str(R/'blender/scene-realism.blend'));bpy.ops.render.render(write_still=True);print('geometry detailed and Cycles preview saved')
