"""Open only the logger access bay in the existing rear panel; Pi anchor is unchanged."""
import bpy,math,json,importlib.util,contextlib,io
from pathlib import Path
from mathutils import Matrix,Vector
ROOT=Path(__file__).resolve().parents[1]
def run(export=True):
 s=bpy.data.scenes['Reorder — Formula SAE'];bpy.context.window.scene=s
 m=json.loads((ROOT/'web/public/assets/journey.json').read_text());anchor=Vector(m['reorder']['car']['anchors']['data']);origin=Vector(m['stations'][3]['origin']);I=Matrix.Rotation(math.pi/2,4,'X')
 body=next(o for o in s.objects if o.name.endswith('FSAE_RearBody'))
 if not body.get('logger_access_bay'):
  body.data=body.data.copy()
  bpy.ops.mesh.primitive_cube_add(size=1,location=I@(anchor-origin+Vector((0,.029,0))))
  cutter=bpy.context.object;cutter.name='LoggerBay_Cutter';cutter.dimensions=(.046,.046,.065)
  bpy.ops.object.transform_apply(location=False,rotation=False,scale=True)
  bpy.context.view_layer.objects.active=body
  mod=body.modifiers.new('Logger access bay','BOOLEAN');mod.operation='DIFFERENCE';mod.object=cutter
  bpy.ops.object.modifier_apply(modifier=mod.name);bpy.data.objects.remove(cutter,do_unlink=True);body['logger_access_bay']=True
 # Preserve the original first route as history; export a higher wing/hoop clearance waypoint.
 route={'data':[{'position':list(anchor+Vector((0,.36,-.18))),'target':list(anchor),'width':.32},{'position':list(anchor+Vector((0,.12,-.035))),'target':list(anchor),'width':.055}]}
 (ROOT/'exports/fsae-details/routes.json').write_text(json.dumps(route,indent=2))
 spec=importlib.util.spec_from_file_location('cp',ROOT/'blender/completion_pipeline.py');cp=importlib.util.module_from_spec(spec);spec.loader.exec_module(cp);cp.OUT=ROOT/'exports/station-reorder'
 if export:
  with contextlib.redirect_stdout(io.StringIO()):cp.export_objects(s,list(s.objects),'station-formula-sae')
 # Save an isolated source so concurrent journey work cannot be overwritten.
 bpy.data.libraries.write(str(ROOT/'blender/fsae-continuous-pi.blend'),{s})
 print('Opened fixed logger access bay and exported car; saved focused source independently.')
