"""Reproducible material/light revision; run through Blender MCP.

Physical geometry, pivots, actions, cameras and shape keys are preserved.
New surface maps use a separate metric UV layer so existing labels stay intact.
"""
import bpy, json, math, hashlib
from pathlib import Path
from mathutils import Vector

ROOT = Path(__file__).resolve().parents[1]
TEX = ROOT / 'assets/textures/photoreal'
OUT = ROOT / 'blender/previews/photorealism'
OUT.mkdir(parents=True, exist_ok=True)
UV = 'UV_Realism'
TAG = 'portfolio_photorealism'

def shader(material):
    material.use_nodes = True
    return next(n for n in material.node_tree.nodes if n.type == 'BSDF_PRINCIPLED')

def image(name, color=False):
    im = bpy.data.images.load(str(TEX/name), check_existing=True)
    space = 'sRGB' if color else 'Non-Color'
    assert space in {e.identifier for e in im.colorspace_settings.bl_rna.properties['name'].enum_items}
    im.colorspace_settings.name = space
    im.pack()
    return im

def texture(material, filename, socket, color=False, normal_strength=.5):
    nodes, links = material.node_tree.nodes, material.node_tree.links
    p = shader(material)
    for old in list(p.inputs[socket].links): links.remove(old)
    uv = next((n for n in nodes if n.type == 'UVMAP' and n.uv_map == UV), None)
    if not uv: uv=nodes.new('ShaderNodeUVMap'); uv.uv_map=UV; uv[TAG]=True
    node=nodes.new('ShaderNodeTexImage'); node.image=image(filename,color); node[TAG]=True
    links.new(uv.outputs['UV'],node.inputs['Vector'])
    if socket == 'Normal':
        normal=nodes.new('ShaderNodeNormalMap'); normal.inputs['Strength'].default_value=normal_strength; normal.uv_map=UV; normal[TAG]=True
        links.new(node.outputs['Color'],normal.inputs['Color']); links.new(normal.outputs['Normal'],p.inputs[socket])
    else: links.new(node.outputs['Color'],p.inputs[socket])

def surface(material, kind, strength=.5):
    # Remove only this revision's prior nodes, making repeat runs safe.
    for n in list(material.node_tree.nodes):
        if n.get(TAG): material.node_tree.nodes.remove(n)
    texture(material,kind+'-roughness.png','Roughness')
    texture(material,kind+'-normal.png','Normal',normal_strength=strength)
    material[TAG]=kind

def metric_uv(obj, tile):
    mesh=obj.data
    if UV in mesh.uv_layers: return
    layer=mesh.uv_layers.new(name=UV)
    for face in mesh.polygons:
        # Dominant-plane box mapping gives consistent physical grain on each face.
        axis=max(range(3),key=lambda k:abs(face.normal[k]))
        axes=[k for k in range(3) if k!=axis]
        for index in face.loop_indices:
            co=mesh.vertices[mesh.loops[index].vertex_index].co
            layer.data[index].uv=(co[axes[0]]*obj.scale[axes[0]]/tile,co[axes[1]]*obj.scale[axes[1]]/tile)

def geometry_signature():
    result={}
    for o in bpy.data.objects:
        if o.type!='MESH':continue
        result[o.name]={'vertices':len(o.data.vertices),'polygons':len(o.data.polygons),'position_hash':hashlib.sha256(b''.join(repr(tuple(v.co)).encode() for v in o.data.vertices)).hexdigest(),'matrix':[list(r) for r in o.matrix_basis],'action':o.animation_data.action.name if o.animation_data and o.animation_data.action else None,'shape_keys':len(o.data.shape_keys.key_blocks) if o.data.shape_keys else 0}
    return result

def apply():
    before=geometry_signature()
    touched={}
    silver=bpy.data.materials['MAT_MacBook_Silver'];surface(silver,'aluminum',.35)
    p=shader(silver);p.inputs['Base Color'].default_value=(.60,.62,.64,1);p.inputs['Metallic'].default_value=1
    track=bpy.data.materials.get('MAT_MacBook_Trackpad_Satin') or bpy.data.materials.new('MAT_MacBook_Trackpad_Satin')
    p=shader(track);p.inputs['Base Color'].default_value=(.39,.415,.44,1);p.inputs['Metallic'].default_value=0
    surface(track,'trackpad',.25)
    for o in bpy.data.objects:
        if o.type=='MESH' and o.name.endswith('SM_M5_Base_WzbwnVztmigkRgn'):
            for i in range(len(o.data.materials)): o.data.materials[i]=track
    wood=bpy.data.materials['MAT_Figma_Desktop_smoked walnut'];surface(wood,'walnut',.16)
    texture(wood,'walnut-color.png','Base Color',color=True)
    shader(wood).inputs['Metallic'].default_value=0
    shader(wood).inputs['Coat Weight'].default_value=.12
    shader(wood).inputs['Coat Roughness'].default_value=.3
    for m in list(bpy.data.materials):
        if m.name.startswith(('M_Printer_Body','M_Printer_Lid','M_Printer_Tray')):
            surface(m,'plastic',.4);shader(m).inputs['Metallic'].default_value=0
        elif m.name=='M_Desk_Top':
            surface(m,'laminate',.3)
        elif m.name in ['MAT_Completion_Notebook_Open.Pages','MAT_Completion_Resume_Page.Sheet','M_Notebook_PageEdges','M_Printer_Paper','M_Printer_PaperStack']:
            surface(m,'paper',.35)
        elif m.name in ['MAT_Pen_WarmBlack','M_Notebook_Cover']:
            surface(m,'plastic',.3)
        elif m.name in ['MAT_Figma_Monitor_Stand','MAT_Figma_Monitor_Housing']:
            surface(m,'plastic',.25)
            p=shader(m)
            for link in list(p.inputs['Base Color'].links): m.node_tree.links.remove(link)
            for link in list(p.inputs['Metallic'].links): m.node_tree.links.remove(link)
            p.inputs['Base Color'].default_value=(.035,.043,.052,1)
            p.inputs['Metallic'].default_value=.15 if m.name.endswith('Stand') else 0
    tiles={'aluminum':.02,'walnut':1.5,'plastic':.035,'paper':.025,'laminate':.08,'trackpad':.13}
    for o in bpy.data.objects:
        if o.type!='MESH':continue
        kinds=[m.get(TAG) for m in o.data.materials if m and m.get(TAG)]
        if kinds:
            metric_uv(o,tiles[kinds[0]]);touched[o.name]=kinds
    glass=bpy.data.materials['MAT_MacBook_BlankGlass'];p=shader(glass)
    p.inputs['Base Color'].default_value=(.004,.006,.009,1);p.inputs['Roughness'].default_value=.13
    p.inputs['Coat Weight'].default_value=.25;p.inputs['Coat Roughness'].default_value=.09
    phone=bpy.data.materials['MAT_Phone_RedPlastic'];p=shader(phone)
    p.inputs['Coat Weight'].default_value=.55;p.inputs['Coat Roughness'].default_value=.11
    dial=bpy.data.materials['MAT_Phone_Acrylic'];shader(dial).inputs['Roughness'].default_value=.09
    display=bpy.data.materials['MAT_Monitor_CleanDarkDisplay'];shader(display).inputs['Roughness'].default_value=.19

    # A photographed studio supplies coherent broad reflection sources.
    world=bpy.data.worlds.get('WORLD_Photographic_Studio') or bpy.data.worlds.new('WORLD_Photographic_Studio')
    world.use_nodes=True;nodes=world.node_tree.nodes;nodes.clear()
    output=nodes.new('ShaderNodeOutputWorld');background=nodes.new('ShaderNodeBackground');environment=nodes.new('ShaderNodeTexEnvironment')
    environment.image=bpy.data.images.load(str(TEX/'studio_small_09_1k.hdr'),check_existing=True);environment.image.pack()
    background.inputs['Strength'].default_value=.22
    world.node_tree.links.new(environment.outputs['Color'],background.inputs['Color']);world.node_tree.links.new(background.outputs[0],output.inputs[0])
    for sc in bpy.data.scenes:
        if sc.name.startswith(('Completion —','Review —')):
            sc.world=world;sc.view_settings.exposure=-.65
    after=geometry_signature()
    assert before==after,'This material pass must preserve every vertex, transform, action and shape key'
    report={'status':'PASS','objects_with_metric_uv':len(touched),'surface_bindings':touched,'geometry_and_motion_preserved':len(before),'triangle_delta':0,'new_maps':'1K wood/aluminum; 512px plastic/paper/laminate/trackpad','environment':'Poly Haven Studio Small09,1K,CC0','source':'blender/portfolio-shared-desk.blend'}
    (OUT/'material-report.json').write_text(json.dumps(report,indent=2))
    bpy.ops.wm.save_as_mainfile(filepath=str(ROOT/'blender/portfolio-shared-desk.blend'))
    print(json.dumps({k:v for k,v in report.items() if k!='surface_bindings'}))

def export():
    # Existing export helper preserves scene origins and animation sampling.
    import importlib.util
    spec=importlib.util.spec_from_file_location('completion_export',ROOT/'blender/completion_pipeline.py')
    pipeline=importlib.util.module_from_spec(spec);spec.loader.exec_module(pipeline)
    for name in ['Intro','Hack Atlantic','Formula SAE','Ultra Maritime','Projects']:
        sc=bpy.data.scenes['Completion — '+name];sc.frame_set(121)
        pipeline.export_objects(sc,list(sc.objects),'station-'+name.lower().replace(' ','-'))
    sc=bpy.data.scenes['Completion — Portfolio Journey']
    root=bpy.data.objects['Journey_TravelFeet']
    pipeline.export_objects(sc,[root,*root.children_recursive],'macbook-journey',True,1,721)
    sc=bpy.data.scenes['Printer Feed Export']
    pipeline.export_objects(sc,list(sc.objects),'printer-paper-feed',True,1,121)
    sc=bpy.data.scenes['Completion — Shared Resume Contact'];bpy.context.window.scene=sc
    bpy.ops.object.select_all(action='DESELECT')
    for o in sc.objects:
        if o.type not in ('LIGHT','CAMERA') and not o.hide_render and not any(k in o.name for k in ['Resume_Page','PaperFeed_Review','Cutter']):
            o.hide_set(False);o.select_set(True)
    bpy.ops.export_scene.gltf(filepath=str(ROOT/'exports/shared-desk/station-shared.glb'),export_format='GLB',use_selection=True,use_active_scene=True,export_apply=True,export_animations=False,export_extras=True,export_yup=True,export_cameras=False,export_lights=False)
    bpy.ops.wm.save_as_mainfile(filepath=str(ROOT/'blender/portfolio-shared-desk.blend'))
    print('Exported photographic hero, stations, shared desk and paper; camera metadata preserved.')

if __name__=='__main__': apply()
