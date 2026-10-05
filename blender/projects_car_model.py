"""Display-car reference for Blender posters; browser reuses the live FSAE car GLB."""
import bpy,json,math,importlib.util
from pathlib import Path
from mathutils import Matrix,Vector,Quaternion
ROOT=Path('/Users/daxmanuel/Documents/ChatGPT/portfolio-site-blender')
def build():
 dest=ROOT/'backups/car-desk-model/portfolio-station-reorder.blend'
 if not dest.exists():bpy.ops.wm.save_as_mainfile(filepath=str(dest),copy=True)
 s=bpy.data.scenes['Reorder — Ultrawide'];bpy.context.window.scene=s;bpy.context.view_layer.update()
 for o in list(s.objects):
  if o.name.startswith('Text_PersonalProjects') or o.get('runtime_reference'):bpy.data.objects.remove(o,do_unlink=True)
 layout=json.loads((ROOT/'exports/station-reorder/layout.json').read_text());origin=Vector(layout['origins']['ultrawide'])
 spec=layout.setdefault('projects',{}).setdefault('carModel',{'sourceGround':[.2484549117,.7400000058,-.0009123053],'ground':list(origin+Vector((-.56,.742,-.14))),'scale':.32,'quaternion':[0,math.sin(.1),0,math.cos(.1)]})
 (ROOT/'exports/station-reorder/layout.json').write_text(json.dumps(layout,indent=2)+'\n')
 rot=Quaternion((spec['quaternion'][3],*spec['quaternion'][:3]));scale=spec['scale'];pos=Vector(spec['ground'])-origin-rot@(Vector(spec['sourceGround'])*scale)
 C=Matrix.Rotation(-math.pi/2,4,'X');matrix=C.inverted()@Matrix.LocRotScale(pos,rot,Vector((scale,)*3))@C
 wrapper=bpy.data.objects.new('Projects_DisplayCar_Reference',None);s.collection.objects.link(wrapper);wrapper.matrix_world=matrix;wrapper['runtime_reference']=True
 source=bpy.data.objects['Reorder_FormulaSAE_FSAE_Root'];mapping={}
 for o in [source,*source.children_recursive]:
  if any(x in o.name for x in ['Label','Connector','Title','Anchor']):continue
  n=o.copy();n.name='Projects_DisplayCar_'+o.name;n['runtime_reference']=True;s.collection.objects.link(n);mapping[o]=n
 for old,new in mapping.items():
  new.parent=mapping.get(old.parent,wrapper);new.matrix_parent_inverse=old.matrix_parent_inverse.copy();new.hide_render=False;new.hide_viewport=False
 screen=s.objects['Screen_Ultrawide_Projects'];old=screen.active_material
 mat=old.copy();mat.name='MAT_PersonalProjects_Reel';mat.use_nodes=True
 bs=next(n for n in mat.node_tree.nodes if n.type=='BSDF_PRINCIPLED');image=bpy.data.images.load(str(ROOT/'assets/textures/station-reorder/projects-monitor.png'),check_existing=True);image.pack()
 tex=mat.node_tree.nodes.new('ShaderNodeTexImage');tex.image=image
 for name in ['Base Color','Emission Color']:
  for link in list(bs.inputs[name].links):mat.node_tree.links.remove(link)
  mat.node_tree.links.new(tex.outputs['Color'],bs.inputs[name])
 bs.inputs['Emission Strength'].default_value=.5;screen.data.materials.clear();screen.data.materials.append(mat)
 bpy.context.view_layer.update();bpy.ops.wm.save_as_mainfile(filepath=str(ROOT/'blender/portfolio-station-reorder.blend'))
 specmod=importlib.util.spec_from_file_location('cp',ROOT/'blender/completion_pipeline.py');cp=importlib.util.module_from_spec(specmod);specmod.loader.exec_module(cp);cp.OUT=ROOT/'exports/station-reorder';cp.export_objects(s,[o for o in s.objects if not o.get('runtime_reference')],'station-projects')
 print('Removed physical chapter lettering; saved display-car reference and title-card screen. Runtime export reuses the existing car asset.')
