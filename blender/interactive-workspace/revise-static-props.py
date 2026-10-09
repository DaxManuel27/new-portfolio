import bpy,json,contextlib,io
from pathlib import Path
from mathutils import Vector
R=Path('/Users/daxmanuel/Documents/ChatGPT/portfolio-site-blender');out=R/'exports/interactive-workspace';s=bpy.data.scenes['Interactive Workspace'];bpy.context.window.scene=s
bpy.ops.wm.save_as_mainfile(filepath=str(R/'blender/interactive-workspace/before-static-props.blend'),copy=True)
# Bake the fully delivered sheet. No morph targets or actions remain on it.
s.frame_set(121);bpy.context.view_layer.update();paper=bpy.data.objects['Resume_PaperFeed_Sheet_Local'];dg=bpy.context.evaluated_depsgraph_get();data=bpy.data.meshes.new_from_object(paper.evaluated_get(dg),depsgraph=dg);paper.data=data;paper.animation_data_clear();paper.name='Resume_Static_TraySheet';paper['workspace_asset']='resume-static';paper['presentation']='Permanent resume resting on output tray'
s.frame_set(1);bpy.context.view_layer.update()
for name in ['Phone_Receiver','Phone_FlexibleLead']:
 o=bpy.data.objects[name]
 if o.type=='MESH' and o.data.shape_keys:o.data=bpy.data.meshes.new_from_object(o.evaluated_get(dg),depsgraph=dg)
 o.animation_data_clear()
for name in ['Root_plant','Root_mug']:
 o=bpy.data.objects.get(name)
 if o:
  for child in list(o.children_recursive):bpy.data.objects.remove(child,do_unlink=True)
  bpy.data.objects.remove(o,do_unlink=True)
label=bpy.data.objects.get('Shared_Resume_Prop_Printer.PrintButtonLabel')
if label:bpy.data.objects.remove(label,do_unlink=True)
o=bpy.data.objects['MacBook_Screen'];m=o.data.materials[0];n=next(n for n in m.node_tree.nodes if n.type=='TEX_IMAGE');n.image=bpy.data.images.load(str(R/'web/public/assets/hack-atlantic-hero.png'),check_existing=True);m.name='Artwork / Hack Atlantic original landing page'
# The only live workspace clip is Notebook_Open.
for name,obs in [('workspace',[o for o in s.objects if o.type not in ('CAMERA','LIGHT') and o.name!='Stage'])]+[(name,[bpy.data.objects['Root_'+name]]+list(bpy.data.objects['Root_'+name].children_recursive)) for name in ['phone','printer','macbook']]:
 bpy.ops.object.select_all(action='DESELECT')
 for o in obs:o.select_set(True)
 with contextlib.redirect_stdout(io.StringIO()):bpy.ops.export_scene.gltf(filepath=str(out/(name+'-source.glb')),export_format='GLB',use_selection=True,use_active_scene=True,export_apply=True,export_animations=True,export_animation_mode='NLA_TRACKS',export_frame_range=False,export_force_sampling=True,export_anim_slide_to_zero=True,export_extras=True,export_yup=True,export_cameras=False,export_lights=False)
manifest=json.loads((out/'manifest.json').read_text());manifest['clips']={k:v for k,v in manifest['clips'].items() if k=='notebook'};manifest['staticProps']=['phone','printer','resume'];manifest['hackAtlanticScreen']='../../web/public/assets/hack-atlantic-hero.png'
pts=[o.matrix_world@Vector(v) for o in [bpy.data.objects['Root_printer']]+list(bpy.data.objects['Root_printer'].children_recursive) if o.type=='MESH' for v in o.bound_box];p=[[v.x,v.z,-v.y] for v in pts];manifest['destinations']['resume']['boundsClosed']=[[min(v[i] for v in p) for i in range(3)],[max(v[i] for v in p) for i in range(3)]];(out/'manifest.json').write_text(json.dumps(manifest,indent=2))
s.camera=bpy.data.objects['Camera_Overview'];s.frame_set(1);bpy.ops.file.pack_all();bpy.ops.wm.save_as_mainfile(filepath=str(R/'blender/interactive-workspace.blend'));s.render.filepath=str(out/'previews/overview.png');bpy.ops.render.render(write_still=True)
print('Revised scene saved and exported; only notebook is animated')
