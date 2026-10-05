"""Material/placement update; load through Blender MCP after backing up inputs."""
import bpy, math, json, os
from pathlib import Path
from mathutils import Vector
ROOT=Path('/Users/daxmanuel/Documents/ChatGPT/portfolio-site-blender')
OUT=ROOT/'exports/figma-sync'
OUT.mkdir(exist_ok=True)

def scene_set(sc):
    bpy.context.window_manager.windows[0].scene=sc
    bpy.context.view_layer.update()

def linear(h):
    rgb=[int(h[i:i+2],16)/255 for i in (0,2,4)]
    return tuple(v/12.92 if v<=.04045 else ((v+.055)/1.055)**2.4 for v in rgb)+(1,)

def material(name,color,rough,metal=0,coat=0,trans=0,ior=1.5):
    m=bpy.data.materials.get(name) or bpy.data.materials.new(name)
    m.use_nodes=True;m.node_tree.nodes.clear()
    b=m.node_tree.nodes.new('ShaderNodeBsdfPrincipled');o=m.node_tree.nodes.new('ShaderNodeOutputMaterial')
    m.node_tree.links.new(b.outputs['BSDF'],o.inputs['Surface'])
    for k,v in {'Base Color':linear(color),'Roughness':rough,'Metallic':metal,'Coat Weight':coat,'Coat Roughness':.05,'Transmission Weight':trans,'IOR':ior,'Emission Strength':0}.items():b.inputs[k].default_value=v
    m.diffuse_color=linear(color)
    return m,b

def assign(o,m):
    if o.data.users>1:o.data=o.data.copy()
    o.data.materials.clear();o.data.materials.append(m)

def update_macbooks():
    alu,_=material('MAT_MacBook_Silver','C9CBCE',.38,1)
    keys,_=material('MAT_MacBook_Keys','1F1F23',.55)
    glass,_=material('MAT_MacBook_BlankGlass','000000',.05)
    rows=[]
    metal_ids={'zNRfbdNyoCOxSDD','HdeQgqDhVRltuvQ','XvtJEVWVvyDeJRR','WiyOPYJEeiHNVjF'}
    key_ids={'sqkqSXQCeccDMmm','waAAeDqzqDLObIi','kMkIQgtfAZdmtyc'}
    for o in bpy.data.objects:
        if o.type!='MESH' or o.name.startswith(('Previous','Archived')):continue
        if not ('M5_' in o.name or 'MacBook_Screen' in o.name):continue
        names={m.name.split('.')[0] for m in o.data.materials if m}
        dest=None
        if 'MacBook_Screen' in o.name or 'ZtrFkpzRROyZncn' in names:dest=glass
        elif names & metal_ids:dest=alu
        elif names & key_ids:dest=keys
        if dest:assign(o,dest);rows.append({'object':o.name,'material':dest.name})
    return rows

def update_phone():
    col=bpy.data.collections.get('FC_Prop_RotaryTelephone')
    if not col:return []
    sc=bpy.data.scenes['Figma Components'];scene_set(sc)
    plastic,b=material('MAT_Phone_RedPlastic','A3101A',.22,coat=1)
    nodes=plastic.node_tree.nodes;links=plastic.node_tree.links
    uv=nodes.new('ShaderNodeUVMap');uv.uv_map='PhoneTileUV'
    # A 25 mm physical tile maintains fine grain consistently across every part.
    import numpy as np
    for name,space,socket in [('albedo','sRGB','Base Color'),('roughness','Non-Color','Roughness'),('normal','Non-Color',None)]:
        im=bpy.data.images.load(str(ROOT/'assets/textures/red-phone'/f'{name}.png'),check_existing=True)
        im.colorspace_settings.name=space;im.pack()
        tex=nodes.new('ShaderNodeTexImage');tex.image=im
        tex.extension=next(e.identifier for e in tex.bl_rna.properties['extension'].enum_items if e.identifier=='REPEAT')
        links.new(uv.outputs['UV'],tex.inputs['Vector'])
        if name=='normal':
            n=nodes.new('ShaderNodeNormalMap');n.inputs['Strength'].default_value=.15;n.uv_map='PhoneTileUV'
            links.new(tex.outputs['Color'],n.inputs['Color']);links.new(n.outputs['Normal'],b.inputs['Normal'])
        elif name=='roughness':
            pixels=np.array(im.pixels[:]).reshape(-1,4)
            mean=float(pixels[:,:3].mean());factor=.22/mean
            mul=nodes.new('ShaderNodeMath');mul.operation=next(e.identifier for e in mul.bl_rna.properties['operation'].enum_items if e.identifier=='MULTIPLY')
            mul.inputs[1].default_value=factor;links.new(tex.outputs['Color'],mul.inputs[0]);links.new(mul.outputs[0],b.inputs[socket])
            plastic['roughness_source_mean']=mean;plastic['roughness_multiplier']=factor;plastic['roughness_target_mean']=.22
        else:links.new(tex.outputs['Color'],b.inputs[socket])
    ivory,_=material('MAT_Phone_NumberRing','F4F1EA',.6)
    acrylic,_=material('MAT_Phone_Acrylic','FFFFFF',.05,trans=1,ior=1.49)
    chrome,_=material('MAT_Phone_Chrome','D7D8DC',.15,1)
    rows=[]
    for o in list(col.objects):
        if o.type not in ('MESH','CURVE'):continue
        part=o.name.split('.')[-1]
        if part.startswith(('Body','Handset','CupTrim','CradleProng','ProngBrass','FrontTrim','CoiledCord')):dest=plastic
        elif part in ('NumberPlate','CentreCard'):dest=ivory
        elif part=='FingerWheel':dest=acrylic
        elif part in ('FingerStop','CardRing','DialBezel','CentrePin'):dest=chrome
        else:continue
        if dest==plastic:
            if o.type=='CURVE':
                dg=bpy.context.evaluated_depsgraph_get();mesh=bpy.data.meshes.new_from_object(o.evaluated_get(dg))
                old=o.data;new=bpy.data.objects.new(o.name+'_mesh',mesh)
                new.parent=o.parent;new.matrix_parent_inverse=o.matrix_parent_inverse.copy();new.matrix_basis=o.matrix_basis.copy()
                for c in o.users_collection:c.objects.link(new)
                for k in o.keys():new[k]=o[k]
                name=o.name;bpy.data.objects.remove(o,do_unlink=True);new.name=name;o=new
            if o.data.users>1:o.data=o.data.copy()
            layer=o.data.uv_layers.get('PhoneTileUV') or o.data.uv_layers.new(name='PhoneTileUV')
            for poly in o.data.polygons:
                axis=max(range(3),key=lambda i:abs(poly.normal[i]));axes=[i for i in range(3) if i!=axis]
                for li in poly.loop_indices:
                    co=o.data.vertices[o.data.loops[li].vertex_index].co
                    layer.data[li].uv=(co[axes[0]]/.025,co[axes[1]]/.025)
        assign(o,dest);rows.append({'object':o.name,'material':dest.name})
    plastic['tile_size_m']=.025
    return rows

def bounds(obs):
    p=[o.matrix_world@Vector(c) for o in obs if o.type=='MESH' for c in o.bound_box]
    return Vector([min(v[i] for v in p) for i in range(3)]),Vector([max(v[i] for v in p) for i in range(3)])

def dock(sc):
    scene_set(sc)
    table=next((o for o in sc.objects if o.name.startswith('HackAtlantic_Desktop')),None)
    hero=next((o for o in sc.objects if o.name.startswith('MacBook_TravelRoot')),None)
    if not table or not hero:return None
    left=next(o for o in sc.objects if o.name.startswith('HackAtlantic_Banner_Table_Left_Base'))
    right=next(o for o in sc.objects if o.name.startswith('HackAtlantic_Banner_Table_Right_Base'))
    midpoint=(left.matrix_world.translation+right.matrix_world.translation)/2
    # Figma 16:1198 groups the tabletop standees closely around the laptop.
    for side,base,offset in [('Left',left,-.34),('Right',right,.34)]:
        delta=midpoint.x+offset-base.matrix_world.translation.x
        for o in sc.objects:
            if o.name.startswith('HackAtlantic_Banner_Table_'+side):o.location.x+=delta
    hero.location.x=midpoint.x;hero.location.y=midpoint.y-.12
    hinge=next(o for o in hero.children_recursive if 'LidPivot' in o.name)
    hinge.animation_data_clear();hinge.rotation_euler.x=math.radians(2)
    hero.rotation_euler=(0,0,0)
    bpy.context.view_layer.update()
    base=next(o for o in hero.children_recursive if 'BaseGroup' in o.name)
    low,_=bounds(base.children_recursive);_,top=bounds([table])
    hero.location.z+=top.z-low.z+.0001;bpy.context.view_layer.update()
    return {'scene':sc.name,'laptop':list(hero.location),'standee_midpoint_x':midpoint.x,'table_top':top.z,'feet_bottom':bounds(base.children_recursive)[0].z}

def export_collection(sc,col,slug,root=None,animated=False):
    scene_set(sc)
    obs=[o for o in col.all_objects if not o.hide_render and not o.name.startswith('FC_FingerHoleCutter')]
    dg=bpy.context.evaluated_depsgraph_get();tri=0
    for o in obs:
        if o.type!='MESH':continue
        ev=o.evaluated_get(dg);me=ev.to_mesh();me.calc_loop_triangles();tri+=len(me.loop_triangles)
        assert all(math.isfinite(a) for v in me.vertices for a in v.co),o.name
        ev.to_mesh_clear()
    assert tri<250000,(slug,tri)
    for o in sc.objects:o.select_set(False)
    for o in obs:o.select_set(True)
    bpy.context.view_layer.objects.active=next(o for o in obs if o.type=='MESH')
    old=root.location.copy() if root else None
    if root:root.location=(0,0,0);bpy.context.view_layer.update()
    import io_scene_gltf2
    fmt=next(i[0] for i in io_scene_gltf2.get_format_items(None,bpy.context) if '.glb' in i[1])
    try:bpy.ops.export_scene.gltf(filepath=str(ROOT/'exports'/f'{slug}.glb'),export_format=fmt,use_selection=True,use_active_scene=True,export_yup=True,export_apply=True,export_animations=animated,export_extras=True)
    finally:
        if root:root.location=old;bpy.context.view_layer.update()
    return {'file':slug+'.glb','triangles':tri,'objects':len(obs)}

def save():
    # Retain legacy zero-user datablocks, as in the original component build.
    sc=bpy.data.scenes.get('Figma Components') or bpy.context.scene
    keep={}
    for label in ['materials','images','meshes','curves','actions','collections','worlds']:
        for d in getattr(bpy.data,label):
            if d.users==0:keep[f'{label}:{d.name}']=d
    sc['material_sync_preserved_ids']=keep
    bpy.ops.wm.save_as_mainfile(filepath=bpy.data.filepath)

def preview(obs,slug,rotation=(60,0,-20)):
    original=bpy.context.scene
    sc=bpy.data.scenes.new('MaterialSyncPreview');scene_set(sc)
    for o in obs:sc.collection.objects.link(o)
    sc.frame_set(original.frame_current);bpy.context.view_layer.update()
    data=bpy.data.cameras.new('MaterialSyncPreviewCamera')
    data.type=next(e.identifier for e in data.bl_rna.properties['type'].enum_items if e.identifier=='ORTHO')
    cam=bpy.data.objects.new(data.name,data);sc.collection.objects.link(cam);sc.camera=cam
    cam.rotation_euler=tuple(math.radians(v) for v in rotation);R=cam.rotation_euler.to_matrix()
    pts=[R.inverted()@(o.matrix_world@Vector(c)) for o in obs if o.type=='MESH' and not o.hide_render for c in o.bound_box]
    lo=Vector([min(p[i] for p in pts) for i in range(3)]);hi=Vector([max(p[i] for p in pts) for i in range(3)])
    center=R@((lo+hi)/2);span=max((hi.x-lo.x)*1.15,(hi.y-lo.y)*1.25*1.15)
    cam.location=center+R@Vector((0,0,2));data.ortho_scale=span
    temp=[cam]
    for name,delta,power in [('Key',(-.5,-.6,.8),18),('Fill',(.6,-.2,.5),12),('Rim',(.2,.5,.7),20)]:
        d=bpy.data.lights.new(name,'AREA');d.energy=power*.35*(span/.5)**2;d.size=span
        o=bpy.data.objects.new(name,d);sc.collection.objects.link(o);o.location=center+Vector(delta)*(span/.5)
        o.rotation_euler=(center-o.location).to_track_quat('-Z','Y').to_euler();temp.append(o)
    world=bpy.data.worlds.new('MaterialSyncPreviewWorld');world.use_nodes=True
    bg=next(n for n in world.node_tree.nodes if n.type=='BACKGROUND');bg.inputs['Color'].default_value=(.3,.3,.3,1);bg.inputs['Strength'].default_value=.4;sc.world=world
    try:sc.render.engine='CYCLES'
    except TypeError:pass
    sc.cycles.samples=64;sc.cycles.use_denoising=True
    sc.render.resolution_x=1000;sc.render.resolution_y=800;sc.render.resolution_percentage=100;sc.render.film_transparent=True
    st=sc.render.image_settings;st.file_format=next(e.identifier for e in st.bl_rna.properties['file_format'].enum_items if e.identifier=='PNG')
    sc.render.filepath=str(ROOT/'blender/previews'/f'{slug}.png')
    bpy.ops.render.render(write_still=True)
    scene_set(original)
    for o in temp:bpy.data.objects.remove(o,do_unlink=True)
    bpy.data.scenes.remove(sc);bpy.data.worlds.remove(world)

def apply():
    report={'file':bpy.data.filepath,'macbook':update_macbooks(),'phone':update_phone(),'placement':[],'exports':[]}
    for sc in bpy.data.scenes:
        if 'Hack Atlantic' in sc.name:
            r=dock(sc)
            if r:report['placement'].append(r)
    filename=Path(bpy.data.filepath).name
    if filename=='portfolio-elements.blend':
        sc=bpy.data.scenes['Figma Components'];col=bpy.data.collections['FC_Prop_RotaryTelephone']
        report['exports'].append(export_collection(sc,col,'rotary-phone',bpy.data.objects['Prop_RotaryTelephone']))
        sc=bpy.data.scenes['Portfolio Elements'];col=bpy.data.collections['Station_Personal']
        report['exports'].append(export_collection(sc,col,'personal-desk',bpy.data.objects['Personal_Root']))
    elif filename=='macbook-hero.blend':
        sc=bpy.data.scenes['MacBook Hero'];sc.frame_set(31)
        report['exports'].append(export_collection(sc,bpy.data.collections['COL_MacBook_Export'],'macbook-hero',bpy.data.objects['MacBook_TravelRoot'],True))
    elif filename=='hack-atlantic-docked-reviewed.blend':
        sc=next(s for s in bpy.data.scenes if 'Hack Atlantic' in s.name);scene_set(sc)
        col=bpy.data.collections.new('COL_HackAtlantic_Docked_Export');sc.collection.children.link(col)
        for o in list(sc.objects):
            if o.type not in ('LIGHT','CAMERA'):col.objects.link(o)
        report['exports'].append(export_collection(sc,col,'hack-atlantic-docked'))
    save()
    (OUT/(filename+'.json')).write_text(json.dumps(report,indent=2))
    print(json.dumps({k:v for k,v in report.items() if k not in ['macbook','phone']}))
    return report
