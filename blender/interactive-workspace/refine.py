# Run after assemble.py; functions from that script remain available in MCP namespace.
import random
s.frame_set(1);bpy.context.view_layer.update()
g=roots['mug'];lo,hi=bounds(list(g.children));g.location+=Vector((-.55,.28,.74))-Vector(((lo.x+hi.x)/2,(lo.y+hi.y)/2,lo.z))
# Lower the monitor stand while retaining its screen proportions.
g=roots['monitor']
for o in g.children:
 if 'StandStem' in o.name:o.scale.z*=.64;o.location.z-=.06
 elif 'StandBase' not in o.name:o.location.z-=.115
s.camera.location=(.36,-2.40,1.98);s.camera.rotation_euler=(Vector((0,0,.88))-s.camera.location).to_track_quat('-Z','Y').to_euler();s.camera.data.lens=48
# Darker red enamel preserves the reference's oxblood accent.
red=mat('Phone / oxblood enamel',(.24,.012,.009),.23,.08)
for o in roots['phone'].children_recursive:
 if o.type=='MESH':
  for slot in o.material_slots:
   m=slot.material
   if m and any(k in m.name.lower() for k in ['red','plastic']):slot.material=red
# Apply dial graphics to circular faces using planar XY projection.
for token,tex in [('CentreCard','phone-center.png'),('NumberPlate','phone-dial-digits.png')]:
 o=next(o for o in s.objects if token in o.name and o.get('workspace_asset')=='phone')
 o.data=o.data.copy();o.data.materials.clear();o.data.materials.append(mat('Artwork / '+token,(1,1,1),.43,tex=tex))
 uv=o.data.uv_layers.active or o.data.uv_layers.new();vs=o.data.vertices;xs=[v.co.x for v in vs];ys=[v.co.y for v in vs];w=max(xs)-min(xs);h=max(ys)-min(ys)
 for p in o.data.polygons:
  for li in p.loop_indices:
   v=vs[o.data.loops[li].vertex_index].co;uv.data[li].uv=((v.x-min(xs))/w,(v.y-min(ys))/h)
# Back cover and narrow spine surface use the corresponding artwork.
panel('Notebook_BackArtwork',.148,.210,-.00003,mat('Artwork / notebook back',(1,1,1),.7,tex='um-cover-back.png'),book,down=True)
mesh('Notebook_SpineArtwork',[(-.00255,-.105,0),(-.00255,.105,0),(-.00255,.105,.017),(-.00255,-.105,.017)],[(0,1,2,3)],mat('Artwork / spine',(1,1,1),.7,tex='um-spine.png'),book,uv=[(0,0),(0,1),(1,1),(1,0)])
# A curved mug label, offset from the ceramic surface. Alpha is connected explicitly.
lo,hi=bounds(list(g.children)) if False else bounds(list(roots['mug'].children));mg=roots['mug'];m=mat('Artwork / mug lettering',(1,1,1),.35,tex='mug-lettering.png');p=next(n for n in m.node_tree.nodes if n.type=='BSDF_PRINCIPLED');tex=next(n for n in m.node_tree.nodes if n.type=='TEX_IMAGE');m.node_tree.links.new(tex.outputs['Alpha'],p.inputs['Alpha'])
# Pot and leaf cluster at back-left, behind the car.
plant=root('Root_plant');plant.location=(-.74,.29,.74);roots['plant']=plant
pot=mat('Plant / warm ceramic',(.60,.54,.43),.52);leafm=[mat('Plant / leaf %d'%i,(.028+i*.008,.060+i*.009,.014),.47) for i in range(3)]
def lathe(name,profile,material,parent):
 n=40;vs=[(rad*math.cos(i*2*math.pi/n),rad*math.sin(i*2*math.pi/n),z) for rad,z in profile for i in range(n)];faces=[]
 for j in range(len(profile)-1):
  for i in range(n):faces.append((j*n+i,j*n+(i+1)%n,(j+1)*n+(i+1)%n,(j+1)*n+i))
 o=mesh(name,vs,faces,material,parent)
 for p in o.data.polygons:p.use_smooth=True
 return o
lathe('Plant_Pot',[(0,0),(.049,0),(.058,.083),(.058,.088),(.051,.088),(.046,.015),(0,.015)],pot,plant)
lathe('Plant_Soil',[(0,.078),(.051,.078)],mat('Plant / soil',(.028,.018,.009),.95),plant)
random.seed(9)
for i in range(27):
 a=i*2.4;rad=random.uniform(.025,.105);z=random.uniform(.105,.23);length=random.uniform(.045,.075);width=length*.35;center=Vector((rad*math.cos(a),rad*math.sin(a),z));direction=Vector((math.cos(a),math.sin(a),-.4));side=Vector((-math.sin(a),math.cos(a),0));base=center-direction*length/2;tip=center+direction*length/2
 verts=[base,center+side*width,center+Vector((0,0,.009)),center-side*width,tip];o=mesh('Plant_Leaf_%02d'%i,[tuple(v) for v in verts],[(0,1,2),(0,2,3),(1,4,2),(2,4,3)],leafm[i%3],plant)
 # Fine stems with square section, visually unobtrusive at overview distance.
 start=Vector((0,0,.078));mid=(start+base)/2;stem=box('Plant_Stem',(.0012,.0012,(base-start).length),mid,leafm[0],plant,bevel=0);stem.rotation_euler=(base-start).to_track_quat('Z','Y').to_euler()
# Paper feed is a separate root-local morph clip parented to the validated anchor.
before=set(bpy.data.objects);bpy.ops.import_scene.gltf(filepath=str(R/'exports/completion/printer-paper-feed.glb'))
anchor=bpy.data.objects['Shared_Resume_Prop_Printer.PaperAnchor']
for o in set(bpy.data.objects)-before:
 for c in list(o.users_collection):c.objects.unlink(o)
 C.objects.link(o);o.parent=anchor;o.location=(0,0,0);o['workspace_asset']='printer-feed'
# Simplify high-density derived CAD meshes, leaving all original files untouched.
for o in list(s.objects):
 if o.type!='MESH':continue
 asset=o.get('workspace_asset');n=len(o.data.polygons)
 ratio=.48 if asset=='macbook' else .30 if asset=='pi' else .40 if asset=='phone' else 1
 if ratio<1 and n>600:
  mod=o.modifiers.new('Web mesh reduction','DECIMATE');mod.ratio=ratio
# Save and inspect before export.
s.frame_set(1);bpy.ops.wm.save_as_mainfile(filepath=str(R/'blender/interactive-workspace.blend'))
print('refined')
