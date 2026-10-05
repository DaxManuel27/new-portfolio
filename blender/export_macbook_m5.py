"""Validate supplied M5 rig, replace desk copy, export and save through Blender MCP."""
import bpy, math, os, json
from mathutils import Vector
from mathutils.bvhtree import BVHTree
BASE=os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
scene=bpy.data.scenes['MacBook Hero'];bpy.context.window.scene=scene
asset=bpy.data.collections['COL_MacBook_Export'];h=bpy.data.objects['MacBook_LidPivot'];base=bpy.data.objects['MacBook_BaseGroup']
report={'status':'PASS','model':'User supplied MacBook Pro 14-inch M5','budget_triangles':180000,'budget_note':'Preserve supplied detail; browser optimization remains pending','meshes':[],'hinge_sweep':[]}
for o in asset.objects:
    if o.type!='MESH':continue
    m=o.data;m.calc_loop_triangles()
    row={'name':o.name,'triangles':len(m.loop_triangles),'zero_area':sum(t.area<1e-16 for t in m.loop_triangles),'uv_layers':len(m.uv_layers),'scale':list(o.scale)}
    assert row['zero_area']==0 and row['uv_layers']>0 and all(abs(v-1)<1e-6 for v in o.scale)
    assert all(math.isfinite(v) for vert in m.vertices for v in vert.co)
    report['meshes'].append(row)
report['triangles']=sum(r['triangles'] for r in report['meshes']);assert report['triangles']<report['budget_triangles']
report['materials']=len({m.name for o in asset.objects if o.type=='MESH' for m in o.data.materials})

def bounds(obs):
    pts=[o.matrix_world@v.co for o in obs if o.type=='MESH' for v in o.data.vertices]
    return [max(p[i] for p in pts)-min(p[i] for p in pts) for i in range(3)]

def tree(obs):
    vs=[];fs=[]
    for o in obs:
        if o.type!='MESH':continue
        offset=len(vs);m=o.data;m.calc_loop_triangles();verts=[o.matrix_world@v.co for v in m.vertices];vs.extend(verts)
        for t in m.loop_triangles:
            if all((verts[i]-h.matrix_world.translation).yz.length<.015 for i in t.vertices):continue
            fs.append(tuple(offset+i for i in t.vertices))
    return BVHTree.FromPolygons(vs,fs,all_triangles=True)

action=h.animation_data.action;h.animation_data.action=None;bt=tree(base.children)
for angle in range(0,109,3):
    h.rotation_euler.x=math.radians(110-angle);bpy.context.view_layer.update()
    count=len(bt.overlap(tree(h.children)));assert count==0,(angle,count)
    report['hinge_sweep'].append({'degrees':angle,'intersections_outside_15mm_hinge_region':count})
    if angle==0:report['closed_dimensions_m']=bounds(asset.objects)
h.animation_data.action=action;scene.frame_set(31);report['open_dimensions_m']=bounds(asset.objects)
bpy.ops.object.select_all(action='DESELECT')
for o in asset.objects:o.select_set(True)
bpy.context.view_layer.objects.active=base
path=os.path.join(BASE,'exports/macbook-hero.glb')
bpy.ops.export_scene.gltf(filepath=path,export_format='GLB',use_selection=True,use_active_scene=True,export_yup=True,export_animations=True,export_animation_mode='ACTIONS',export_force_sampling=True,export_extras=True,export_lights=False,export_cameras=False)
report['export_bytes']=os.path.getsize(path)
check=bpy.data.scenes.new('M5 Roundtrip');bpy.context.window.scene=check;check.render.fps=30
bpy.ops.import_scene.gltf(filepath=path);imported=list(check.objects);check.frame_set(31);bpy.context.view_layer.update()
assert len(imported)==len(asset.objects)
report['roundtrip_objects']=len(imported);report['roundtrip_dimensions_m']=bounds(imported)
assert max(abs(a-b) for a,b in zip(report['open_dimensions_m'],report['roundtrip_dimensions_m']))<.002
report['roundtrip_animations']=[o.animation_data.action.name for o in imported if o.animation_data and o.animation_data.action]
assert report['roundtrip_animations']
bpy.context.window.scene=scene
for o in imported:bpy.data.objects.remove(o,do_unlink=True)
bpy.data.scenes.remove(check)
scene.frame_set(31)
bpy.data.libraries.write(os.path.join(BASE,'blender/macbook-hero.blend'),{scene},fake_user=True,compress=True)

# Replace only the stationary laptop at the personal desk. Keep the old one archived.
full=bpy.data.scenes['Portfolio Elements'];bpy.context.window.scene=full
station=bpy.data.collections['Station_Personal'];pr=bpy.data.objects['Personal_Root']
previous=bpy.data.collections.new('COL_Previous_DeskMacBook');full.collection.children.link(previous)
previous.hide_viewport=True;previous.hide_render=True
for o in list(station.objects):
    if o.name.startswith('MacBook_') or o.name=='Personal_MacBook_Screen':
        station.objects.unlink(o);previous.objects.link(o);o.name='PreviousDesk_'+o.name
copies={}
for src in asset.objects:
    o=src.copy();o.animation_data_clear();o.name='Personal_M5_'+src.name;station.objects.link(o);copies[src]=o
for src,o in copies.items():
    o.parent=copies.get(src.parent);o.matrix_parent_inverse=src.matrix_parent_inverse.copy()
root=copies[bpy.data.objects['MacBook_TravelRoot']];root.parent=pr
lowest=min((o.matrix_world@v.co).z for o in base.children if o.type=='MESH' for v in o.data.vertices)
root.location=(-.42,-.17,.7401-lowest)
copies[h].rotation_euler.x=math.radians(2)
copies[bpy.data.objects['MacBook_Screen']].name='Personal_MacBook_Screen'
bpy.context.view_layer.update()
bpy.ops.object.select_all(action='DESELECT')
for o in station.objects:o.select_set(True)
saved=pr.location.copy();pr.location=(0,0,0);bpy.context.view_layer.update()
bpy.ops.export_scene.gltf(filepath=os.path.join(BASE,'exports/personal-desk.glb'),export_format='GLB',use_selection=True,use_active_scene=True,export_yup=True,export_animations=False,export_lights=False,export_cameras=False)
pr.location=saved;bpy.context.view_layer.update()
report['personal_desk_updated']=True
bpy.data.libraries.write(os.path.join(BASE,'blender/portfolio-elements.blend'),{full},fake_user=True,compress=True)
bpy.data.libraries.write(os.path.join(BASE,'blender/portfolio-elements-with-macbook.blend'),{full,scene},fake_user=True,compress=True)
with open(os.path.join(BASE,'exports/macbook-hero-validation.json'),'w') as f:json.dump(report,f,indent=2)
print(json.dumps({k:v for k,v in report.items() if k not in ('meshes','hinge_sweep')}))
