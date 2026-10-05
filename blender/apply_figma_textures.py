import bpy,json,os,hashlib
from pathlib import Path
BASE=Path('/Users/daxmanuel/Documents/ChatGPT/portfolio-site-blender')
manifest=json.loads((BASE/'assets/textures/texture-manifest.json').read_text())
devices=json.loads((BASE/'assets/textures/devices/manifest.json').read_text())
scene=bpy.context.scene
def protected(o):
    if any('macbook' in c.name.lower() for c in o.users_collection): return True
    p=o
    while p:
        if 'macbook' in p.name.lower() or 'personal_m5' in p.name.lower(): return True
        p=p.parent
    return False
def snapshot(o):
    return {'matrix':list(v for row in o.matrix_world for v in row),'data':o.data.name if o.data else None,'materials':[s.material.name if s.material else None for s in o.material_slots],'uv':[(u.name,len(u.data)) for u in o.data.uv_layers] if o.type=='MESH' else []}
protected_before={o.name:snapshot(o) for o in bpy.data.objects if protected(o)}
target=[o for o in scene.objects if o.type=='MESH' and not protected(o) and any(c.name.startswith('Station_') for c in o.users_collection)]
needed=[s['file'] for s in manifest['screens'] if 'MacBook' not in s['name']]+[s['file'] for s in manifest['surfaces'] if 'MacBook' not in s['material'] and 'Keyboard' not in s['material']]+[s['file'] for s in manifest['originals']]+[m['file'] for d in devices['materials'] if not d['name'].startswith('MacBook') for m in d['maps']]
assert all((BASE/p).is_file() for p in needed)
backup=BASE/'blender/portfolio-elements-before-figma-textures.blend'
if not backup.exists(): bpy.ops.wm.save_as_mainfile(filepath=str(backup),copy=True)
images={}; changed=set(); mats=[]; uv_names=[]
def imagefile(path,space='sRGB'):
    key=(path,space)
    if key not in images:
        im=bpy.data.images.load(str(BASE/path),check_existing=False)
        im.name='Figma | '+Path(path).stem
        im.colorspace_settings.name=space
        im.pack()
        images[key]=im
    return images[key]
def material(name,old=None):
    m=old.copy() if old else bpy.data.materials.new(name)
    m.name=name;m.use_nodes=True;m.use_fake_user=True
    p=next(n for n in m.node_tree.nodes if n.type=='BSDF_PRINCIPLED')
    mats.append(m)
    return m,p
def texture(m,p,path,space='sRGB',socket='Base Color',uv='FigmaSurfaceUV',extend=False):
    n=m.node_tree.nodes.new('ShaderNodeTexImage');n.image=imagefile(path,space);n.label=Path(path).stem
    n.extension='EXTEND' if extend else 'REPEAT';n.interpolation='Linear'
    coord=m.node_tree.nodes.new('ShaderNodeUVMap');coord.uv_map=uv
    m.node_tree.links.new(coord.outputs['UV'],n.inputs['Vector'])
    if socket: m.node_tree.links.new(n.outputs['Color'],p.inputs[socket])
    return n
def project(o,tile=1):
    # Overlapping UV islands are intentional for reusable tiled surface maps.
    if o.data.users>1: o.data=o.data.copy()
    uv=o.data.uv_layers.get('FigmaSurfaceUV') or o.data.uv_layers.new(name='FigmaSurfaceUV')
    scale=o.matrix_world.to_scale()
    for poly in o.data.polygons:
        axis=max(range(3),key=lambda i:abs(poly.normal[i]))
        axes=((1,2),(0,2),(0,1))[axis]
        for li in poly.loop_indices:
            v=o.data.vertices[o.data.loops[li].vertex_index].co
            uv.data[li].uv=(v[axes[0]]*abs(scale[axes[0]])/tile,v[axes[1]]*abs(scale[axes[1]])/tile)
    uv_names.append(o.name)
# Copy every surface material rather than editing any shared original.
for s in manifest['surfaces']:
    if 'MacBook' in s['material'] or 'Keyboard' in s['material']: continue
    matches=[(o,i) for o in target for i,slot in enumerate(o.material_slots) if slot.material and slot.material.name==s['material']]
    if not matches: continue
    m,p=material('MAT_Figma_'+s['material'].replace(' | ','_'),bpy.data.materials[s['material']])
    p.inputs['Metallic'].default_value=s['metallic'];p.inputs['Roughness'].default_value=s['roughness']
    texture(m,p,s['file'])
    tile=.128 if 'composite' in s['material'] else 1
    for o,i in matches:
        project(o,tile);o.material_slots[i].material=m;changed.add(o.name)
# Higher-detail monitor materials supersede their generic color swatches.
devm={}
for d in devices['materials']:
    if d['name'].startswith('MacBook'): continue
    m,p=material('MAT_Figma_'+d['name']);devm[d['name']]=m
    p.inputs['Metallic'].default_value=d['metallic'];p.inputs['Roughness'].default_value=d['roughness']
    for mp in d['maps']:
        channel=mp['name'].rsplit('_',1)[1]
        socket={'BaseColor':'Base Color','Roughness':'Roughness','Metallic':'Metallic','Height':None}[channel]
        n=texture(m,p,mp['file'],mp['color_space'],socket)
        if channel=='Height':
            bump=m.node_tree.nodes.new('ShaderNodeBump');bump.inputs['Strength'].default_value=.2;bump.inputs['Distance'].default_value=d['bump_distance_m']
            m.node_tree.links.new(n.outputs['Color'],bump.inputs['Height']);m.node_tree.links.new(bump.outputs['Normal'],p.inputs['Normal'])
    for name in d['objects']:
        o=scene.objects.get(name)
        if o and o in target:
            project(o,d['tile_mm']/1000);o.data.materials.clear();o.data.materials.append(m);changed.add(o.name)
for name in ['Personal_Ultrawide_Housing','Ultra_Monitor_Left_Housing','Ultra_Monitor_Right_Housing']:
    o=scene.objects.get(name)
    if o and o in target:
        o.data.materials.append(devm['Device_BlackBezel'])
        for face in o.data.polygons:
            if face.normal.y<-.7: face.material_index=len(o.data.materials)-1
# Screens: preserve existing UVs; alternate project materials retained in file.
screen_mats=[]
for s in manifest['screens']:
    if 'MacBook' in s['name'] or not s.get('enabled', True): continue
    o=scene.objects.get(s['object'])
    if not o or o not in target: continue
    m,p=material('MAT_Figma_'+s['name'])
    p.inputs['Roughness'].default_value=.3
    n=texture(m,p,s['file'],uv='UVMap',extend=True)
    m.node_tree.links.new(n.outputs['Color'],p.inputs['Emission Color']);p.inputs['Emission Strength'].default_value=.65
    screen_mats.append(m.name)
    if '__project_' not in s['name']:
        o.data.materials.clear();o.data.materials.append(m);changed.add(o.name)
    else: o['figma_project_'+s['name'].rsplit('_',1)[1]]=m.name
# Original graphics retain exact original pixels and full UV.
for s in manifest['originals']:
    matches=[scene.objects.get(n) for n in s['objects']]
    matches=[o for o in matches if o and o in target]
    if not matches: continue
    m,p=material('MAT_Figma_'+Path(s['file']).stem)
    p.inputs['Roughness'].default_value=.65
    n=texture(m,p,s['file'],uv='UVMap',extend=True)
    if 'logo' in s['file']: m.node_tree.links.new(n.outputs['Alpha'],p.inputs['Alpha'])
    for o in matches: o.data.materials.clear();o.data.materials.append(m);changed.add(o.name)
after={o.name:snapshot(o) for o in bpy.data.objects if protected(o)}
assert protected_before==after,'MacBook preservation check failed'
report={'changed_objects':sorted(changed),'protected_macbook_objects':len(after),'macbook_unchanged':protected_before==after,'packed_images':[im.name for im in images.values()],'materials':[m.name for m in mats],'screen_materials':screen_mats,'uv_objects':sorted(set(uv_names)),'backup':str(backup)}
(BASE/'blender/figma-texture-application-report.json').write_text(json.dumps(report,indent=2))
bpy.app.driver_namespace['figma_texture_protected_snapshot']=protected_before
print(json.dumps({'changed_objects':len(changed),'protected_macbook_objects':len(after),'packed_images':len(images),'materials':len(mats),'macbook_unchanged':True}))
