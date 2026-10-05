import bpy, os, json, math
from mathutils import Vector
import io_scene_gltf2
BASE='/Users/daxmanuel/Documents/ChatGPT/portfolio-site-blender'
scene=bpy.data.scenes['Portfolio Elements'];bpy.context.window.scene=scene
os.makedirs(os.path.join(BASE,'exports'),exist_ok=True)
os.makedirs(os.path.join(BASE,'blender','previews'),exist_ok=True)
assets=[('Station_Personal','Personal_Root','personal-desk'),
        ('Station_UltraMaritime','UltraMaritime_Root','ultra-maritime-desk'),
        ('Station_HackAtlantic','HackAtlantic_Root','hack-atlantic-check-in'),
        ('Station_FSAE','FSAE_Root','fsae-car')]
# Ground contacts and a source attribution on the plaque.
bpy.data.objects['Preview_Ground'].location.z=-.04
hack=bpy.data.collections['Station_HackAtlantic']
base=bpy.data.objects['HackAtlantic_Banner_Large_Base']
delta=-min(v.co.z+base.location.z for v in base.data.vertices)
for o in hack.objects:
    if o.name.startswith('HackAtlantic_Banner_Large'):o.location.z+=delta
bpy.data.objects['Ultra_OfficialLogo']['source']='https://umaritime.com/wp-content/uploads/2026/02/Ultra-Maritime-site-Logo.png'

report=[]
dg=bpy.context.evaluated_depsgraph_get()
for cn,rn,slug in assets:
    col=bpy.data.collections[cn]
    tris=0;materials=set();bad=[];points=[]
    for o in col.objects:
        if o.type!='MESH':continue
        ev=o.evaluated_get(dg);me=ev.to_mesh();me.calc_loop_triangles()
        tris+=len(me.loop_triangles)
        if any(not math.isfinite(v) for vertex in me.vertices for v in vertex.co):bad.append(o.name+' nonfinite')
        if any(p.area<1e-12 for p in me.polygons):bad.append(o.name+' degenerate face')
        if any(abs(s-1)>1e-5 for s in o.scale):bad.append(o.name+' nonunit scale')
        materials.update(m.name for m in me.materials if m)
        points.extend(o.matrix_world@Vector(v) for v in o.bound_box)
        ev.to_mesh_clear()
    bounds=[max(p[i] for p in points)-min(p[i] for p in points) for i in range(3)]
    entry={'asset':slug,'objects':len(col.objects),'triangles_evaluated':tris,'materials':len(materials),
           'dimensions_m':bounds,'geometry_issues':bad,'budget_triangles':30000,'budget_pass':tris<=30000}
    assert not bad and entry['budget_pass'],entry
    report.append(entry)
    for img in bpy.data.images:
        if img.source=='FILE' and img.filepath and not img.packed_file:
            img.pack()

fmt=next(i[0] for i in io_scene_gltf2.get_format_items(None,bpy.context) if '.glb' in i[1])
for (cn,rn,slug),entry in zip(assets,report):
    col=bpy.data.collections[cn];r=bpy.data.objects[rn]
    old=r.location.copy();r.location=(0,0,0)
    bpy.context.view_layer.update()
    for o in scene.objects:o.select_set(False)
    for o in col.objects:o.select_set(True)
    bpy.context.view_layer.objects.active=r
    path=os.path.join(BASE,'exports',slug+'.glb')
    try:
        bpy.ops.export_scene.gltf(filepath=path,export_format=fmt,use_selection=True,use_active_scene=True,
            export_apply=True,export_animations=False,export_extras=True,export_yup=True)
    finally:r.location=old
    entry['glb_bytes']=os.path.getsize(path)
    print('EXPORTED',slug,entry['triangles_evaluated'],'triangles',entry['glb_bytes'],'bytes')

cam=scene.camera
cam.location=(8,-10,8)
cam.rotation_euler=(Vector((-.2,1.7,.75))-cam.location).to_track_quat('-Z','Y').to_euler()
cam.data.lens=48
for o in scene.objects:o.select_set(False)
for area in bpy.context.screen.areas:
    if area.type=='VIEW_3D':
        s=area.spaces.active;s.region_3d.view_location=Vector((-.2,1.7,.75))
        s.region_3d.view_rotation=cam.rotation_euler.to_quaternion();s.region_3d.view_distance=10
        s.overlay.show_overlays=False
        s.shading.type='RENDERED'
scene.render.image_settings.file_format='PNG'
scene.render.resolution_x=1100;scene.render.resolution_y=800
scene.cycles.samples=16
scene.render.filepath=os.path.join(BASE,'blender','previews','elements-overview.png')
scene['asset_phase']='Standalone elements pass complete; room, camera journey and interface deferred.'
with open(os.path.join(BASE,'exports','validation.json'),'w') as f:json.dump(report,f,indent=2)
bpy.ops.wm.save_as_mainfile(filepath=os.path.join(BASE,'blender','portfolio-elements.blend'))
print('Master saved. Validation report:',json.dumps(report))
