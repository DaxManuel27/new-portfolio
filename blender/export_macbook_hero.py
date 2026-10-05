"""Validate, export, round-trip check, and save the standalone hero scene through MCP."""
import bpy, bmesh, json, math, os
from mathutils import Vector
from mathutils.bvhtree import BVHTree
BASE=os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
scene=bpy.data.scenes['MacBook Hero']; bpy.context.window.scene=scene
asset=bpy.data.collections['COL_MacBook_Export']
hinge=bpy.data.objects['MacBook_LidPivot']; base=bpy.data.objects['MacBook_BaseGroup']
report={'status':'PASS','budget_triangles':15000,'meshes':[],'hinge_sweep':[]}
for o in asset.objects:
    if o.type!='MESH':continue
    m=o.data; m.calc_loop_triangles(); bm=bmesh.new(); bm.from_mesh(m)
    item={'name':o.name,'triangles':len(m.loop_triangles),'degenerate_faces':sum(f.calc_area()<1e-14 for f in bm.faces),'nonmanifold_edges':sum(not e.is_manifold for e in bm.edges),'uv_layers':len(m.uv_layers),'scale':list(o.scale)}
    assert item['degenerate_faces']==0
    assert item['nonmanifold_edges']==0 or o.name=='MacBook_Screen'
    assert item['uv_layers']>0 and all(abs(v-1)<1e-6 for v in o.scale)
    assert all(math.isfinite(v) for vert in m.vertices for v in vert.co)
    report['meshes'].append(item); bm.free()
report['triangles']=sum(i['triangles'] for i in report['meshes'])
assert report['triangles']<=report['budget_triangles']
report['materials']=len(set(m.name for o in asset.objects if o.type=='MESH' for m in o.data.materials))

def bounds(objects):
    pts=[o.matrix_world@Vector(v) for o in objects if o.type=='MESH' for v in o.bound_box]
    return [min(v[i] for v in pts) for i in range(3)],[max(v[i] for v in pts) for i in range(3)]

def tree(objects, exclude_hinge=False):
    vs=[];fs=[]
    for o in objects:
        if o.type!='MESH':continue
        m=o.data; m.calc_loop_triangles(); offset=len(vs)
        verts=[o.matrix_world@v.co for v in m.vertices]; vs.extend(verts)
        for t in m.loop_triangles:
            # Mechanical overlap within 12 mm of the hinge axis is intentional.
            if exclude_hinge and all((verts[i]-hinge.matrix_world.translation).yz.length<.012 for i in t.vertices): continue
            fs.append(tuple(offset+i for i in t.vertices))
    return BVHTree.FromPolygons(vs,fs,all_triangles=True)

action=hinge.animation_data.action; hinge.animation_data.action=None
base_tree=tree(base.children,True)
for angle in range(0,109,3):
    hinge.rotation_euler.x=math.radians(90-angle); bpy.context.view_layer.update()
    collisions=base_tree.overlap(tree(hinge.children,True))
    report['hinge_sweep'].append({'opening_degrees':angle,'intersections_outside_hinge':len(collisions)})
    assert not collisions, (angle,len(collisions))
    if angle==0:
        low,high=bounds(asset.objects);report['closed_dimensions_m']=[high[i]-low[i] for i in range(3)]
hinge.animation_data.action=action;scene.frame_set(31)
low,high=bounds(asset.objects);report['open_dimensions_m']=[high[i]-low[i] for i in range(3)]
bpy.ops.object.select_all(action='DESELECT')
for o in asset.objects:o.select_set(True)
bpy.context.view_layer.objects.active=base
path=os.path.join(BASE,'exports/macbook-hero.glb')
bpy.ops.export_scene.gltf(filepath=path,export_format='GLB',use_selection=True,use_active_scene=True,export_yup=True,export_animations=True,export_animation_mode='ACTIONS',export_frame_range=True,export_force_sampling=True,export_extras=True,export_cameras=False,export_lights=False)
report['export_bytes']=os.path.getsize(path)
# Round-trip in an independent verification scene, preserving the editable hero.
check=bpy.data.scenes.new('MacBook Export Verification');bpy.context.window.scene=check
bpy.ops.import_scene.gltf(filepath=path)
imported=list(check.objects)
report['roundtrip_objects']=len(imported)
report['roundtrip_names']=[o.name for o in imported]
assert len(imported)==len(asset.objects)
check.frame_set(31);bpy.context.view_layer.update()
report['roundtrip_animations']=[o.animation_data.action.name for o in imported if o.animation_data and o.animation_data.action]
assert report['roundtrip_animations']
# Imported animation is sampled to the same 30 fps as the source.
check.render.fps=30;check.frame_set(31);bpy.context.view_layer.update()
low,high=bounds(imported);report['roundtrip_open_dimensions_m']=[high[i]-low[i] for i in range(3)]
assert max(abs(a-b) for a,b in zip(report['open_dimensions_m'],report['roundtrip_open_dimensions_m']))<.002
bpy.context.window.scene=scene;scene.frame_set(31)
for o in imported:bpy.data.objects.remove(o,do_unlink=True)
bpy.data.scenes.remove(check)
with open(os.path.join(BASE,'exports/macbook-hero-validation.json'),'w') as f:json.dump(report,f,indent=2)
# Write only this scene and its dependencies; leave portfolio-elements.blend untouched.
bpy.data.libraries.write(os.path.join(BASE,'blender/macbook-hero.blend'),{scene},fake_user=True,compress=True)
print(json.dumps(report))
