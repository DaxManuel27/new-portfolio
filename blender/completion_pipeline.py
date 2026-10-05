"""Approved Figma completion, executed in the backed-up live Blender session."""
import bpy, math, json, importlib.util
import numpy as np
from pathlib import Path
from mathutils import Vector, Matrix
ROOT = Path('/Users/daxmanuel/Documents/ChatGPT/portfolio-site-blender')
TEX = ROOT/'assets/textures/figma-completion'
OUT = ROOT/'exports/completion'
PRE = ROOT/'blender/previews/completion'
OUT.mkdir(parents=True, exist_ok=True)
PRE.mkdir(parents=True, exist_ok=True)
spec = importlib.util.spec_from_file_location('sync_helpers',ROOT/'blender/sync_figma_materials.py')
helpers = importlib.util.module_from_spec(spec); spec.loader.exec_module(helpers)
material, assign, linear = helpers.material, helpers.assign, helpers.linear
MAN = json.loads((ROOT/'figma_refs/completion/motion-manifest.json').read_text())
VERT_CACHE = {}

def active(sc):
    bpy.context.window.scene = sc
    bpy.context.view_layer.update()

def enum(block, field, value):
    assert value in {e.identifier for e in block.bl_rna.properties[field].enum_items}, (field,value)
    setattr(block,field,value)

def collection(sc,name):
    c=bpy.data.collections.new('COL_Completion_'+name);sc.collection.children.link(c);return c

def empty(c,name,loc=(0,0,0)):
    o=bpy.data.objects.new(name,None);c.objects.link(o);o.location=loc;return o

def mesh(c,name,verts,faces,mat=None,parent=None):
    d=bpy.data.meshes.new(name);d.from_pydata(verts,[],faces);d.update()
    o=bpy.data.objects.new(name,d);c.objects.link(o);o.parent=parent
    if mat:d.materials.append(mat)
    return o

def box(c,name,size,loc,mat,parent=None,bevel=.001):
    x,y,z=[v/2 for v in size]
    o=mesh(c,name,[(-x,-y,-z),(x,-y,-z),(x,y,-z),(-x,y,-z),(-x,-y,z),(x,-y,z),(x,y,z),(-x,y,z)],[(0,3,2,1),(4,5,6,7),(0,1,5,4),(1,2,6,5),(2,3,7,6),(3,0,4,7)],mat,parent);o.location=loc
    if bevel:
        m=o.modifiers.new('Soft manufactured edge','BEVEL');m.width=bevel;m.segments=3
        o.modifiers.new('Weighted normals','WEIGHTED_NORMAL')
    return o

def cylinder_x(c,name,x0,x1,r0,r1,mat,parent,offset=(0,0,.00545),segments=48):
    vs=[(x,offset[1]+r*math.cos(2*math.pi*i/segments),offset[2]+r*math.sin(2*math.pi*i/segments)) for x,r in [(x0,r0),(x1,r1)] for i in range(segments)]
    fs=[tuple(reversed(range(segments))),tuple(range(segments,2*segments))]+[(i,(i+1)%segments,(i+1)%segments+segments,i+segments) for i in range(segments)]
    o=mesh(c,name,vs,fs,mat,parent)
    for p in o.data.polygons:p.use_smooth=p.index>1
    return o

def image_mat(name,file,rough=.6,alpha=False):
    m,b=material(name,'FFFFFF',rough)
    im=bpy.data.images.load(str(TEX/file),check_existing=True);im.colorspace_settings.name='sRGB';im.pack()
    n=m.node_tree.nodes.new('ShaderNodeTexImage');n.image=im
    m.node_tree.links.new(n.outputs['Color'],b.inputs['Base Color'])
    if alpha:
        m.node_tree.links.new(n.outputs['Alpha'],b.inputs['Alpha']);enum(m,'surface_render_method','DITHERED')
    return m

def uv_xy(o,w,h,cy=0):
    uv=o.data.uv_layers.get('ArtworkUV') or o.data.uv_layers.new(name='ArtworkUV')
    o.data.uv_layers.active=uv
    for p in o.data.polygons:
        for li in p.loop_indices:
            v=o.data.vertices[o.data.loops[li].vertex_index].co
            uv.data[li].uv=(v.x/w+.5,(v.y-cy)/h+.5)
    uv.active_render=True

def copy_objects(source,c,prefix,root_name=None,position=None,scale=None,exclude=()):
    src=[o for o in source if not any(o.name.startswith(e) for e in exclude)]
    mp={}
    for o in src:
        n=o.copy();n.name=prefix+o.name;n.animation_data_clear();c.objects.link(n);mp[o]=n
    for o,n in mp.items():
        n.parent=mp.get(o.parent)
        n.matrix_parent_inverse=o.matrix_parent_inverse.copy();n.matrix_basis=o.matrix_basis.copy()
        for mod in n.modifiers:
            if hasattr(mod,'object') and mod.object in mp:mod.object=mp[mod.object]
        for con in n.constraints:
            if hasattr(con,'target') and con.target in mp:con.target=mp[con.target]
    root=mp.get(bpy.data.objects.get(root_name)) if root_name else next((n for n in mp.values() if not n.parent),None)
    if root and position is not None:root.location=position
    if root and scale is not None:root.scale=scale
    return root,list(mp.values())

def copy_col(name,c,prefix,root,position,scale=None,exclude=()):
    return copy_objects(bpy.data.collections[name].objects,c,prefix,root,position,scale,exclude)

def laptop(c,prefix,pos=(0,0,.74),yaw=0,lid=106):
    root,obs=copy_col('COL_MacBook_Export',c,prefix,'MacBook_TravelRoot',(pos[0],pos[1],pos[2]+.009483764))
    root.rotation_euler=(0,0,math.radians(yaw))
    hinge=next(o for o in obs if o.name.endswith('MacBook_LidPivot'))
    hinge.rotation_euler.x=math.radians(110-lid)
    return root,obs,hinge

def camera(sc,name,pos,target,width):
    d=bpy.data.cameras.new(name);enum(d,'type','ORTHO');d.ortho_scale=width;d.clip_start=.001;d.clip_end=100
    o=bpy.data.objects.new(name,d);sc.collection.objects.link(o);o.location=pos
    o.rotation_euler=(Vector(target)-o.location).to_track_quat('-Z','Y').to_euler();sc.camera=o;return o

def light(sc,name,loc,target,power,size,color):
    d=bpy.data.lights.new(name,'AREA');d.energy=power;d.size=size;d.color=color
    o=bpy.data.objects.new(name,d);sc.collection.objects.link(o);o.location=loc;o.rotation_euler=(Vector(target)-o.location).to_track_quat('-Z','Y').to_euler();return o

def setup_scene(name):
    sc=bpy.data.scenes.new('Completion — '+name);active(sc);sc.unit_settings.scale_length=1;sc.render.fps=30
    try:sc.render.engine='CYCLES'
    except TypeError:pass
    sc.cycles.samples=32;sc.cycles.use_denoising=True
    sc.render.resolution_x=1440;sc.render.resolution_y=960;sc.render.resolution_percentage=65
    enum(sc.render.image_settings,'file_format','PNG');enum(sc.render.image_settings,'color_mode','RGBA')
    sc.render.film_transparent=False
    w=bpy.data.worlds.new('World_Completion_'+name);w.use_nodes=True
    bg=next(n for n in w.node_tree.nodes if n.type=='BACKGROUND');bg.inputs['Color'].default_value=(.018,.017,.015,1);bg.inputs['Strength'].default_value=.35;sc.world=w
    light(sc,name+'_Key',(-1,-1.2,2.5),(0,0,.8),110,1.6,(1,.83,.65))
    light(sc,name+'_Fill',(1,-.4,1.7),(0,0,.8),75,1.3,(.72,.84,1))
    light(sc,name+'_Rim',(.3,.9,2),(0,0,.8),130,1,(1,.92,.81))
    return sc,collection(sc,name+'_Assets')

def points(obs):
    return [o.matrix_world@Vector(p) for o in obs if o.type=='MESH' and not o.hide_render for p in o.bound_box]

def exact_extent(obs,rotation=None):
    lows=[];highs=[]
    for o in obs:
        if o.type!='MESH' or o.hide_render:continue
        key=o.data.as_pointer()
        if o.data.shape_keys:
            ev=o.evaluated_get(bpy.context.evaluated_depsgraph_get());a=np.empty(len(ev.data.vertices)*3,dtype=np.float32);ev.data.vertices.foreach_get('co',a);local=a.reshape(-1,3)
        elif key not in VERT_CACHE:
            a=np.empty(len(o.data.vertices)*3,dtype=np.float32);o.data.vertices.foreach_get('co',a);VERT_CACHE[key]=a.reshape(-1,3)
            local=VERT_CACHE[key]
        else:local=VERT_CACHE[key]
        matrix=o.matrix_world if rotation is None else rotation.to_4x4()@o.matrix_world
        w=np.asarray(matrix);a=local@w[:3,:3].T+w[:3,3]
        lows.append(a.min(axis=0));highs.append(a.max(axis=0))
    return Vector(np.min(lows,axis=0)),Vector(np.max(highs,axis=0))

def fit(cam,obs,width_fraction=.82,height_fraction=.82,center=(.5,.5)):
    bpy.context.view_layer.update();r=cam.rotation_euler.to_matrix();q=r.inverted()
    lo,hi=exact_extent(obs,q)
    width=max((hi.x-lo.x)/width_fraction,1.5*(hi.y-lo.y)/height_fraction)
    c=(lo+hi)*.5;c.x+=(.5-center[0])*width;c.y+=(.5-center[1])*width/1.5
    cam.location=r@(c+Vector((0,0,3)));cam.data.ortho_scale=width
    return width

def stage(c,prefix,width=1.2,depth=.7):
    root,obs=copy_col('FC_Desk_Station',c,prefix,'Desk_Station',(-width/2,depth/2,.74),(width/.72,depth/.396,1))
    root['assembly_note']='Original Figma short display plinth, top at 0.74 m';return root,obs

def static_assets():
    active(bpy.data.scenes['Figma Components'])
    dial=bpy.data.objects['Prop_RotaryTelephone.NumberPlate'];assign(dial,image_mat('MAT_Completion_DialNumbers','phone-number-plate.png'));uv_xy(dial,.122,.122)
    for obj,file,w,h,cy in [('Notebook_Open.Pages','notebook-pages.png',.296,.212,-.001),('Resume_Page.Sheet','resume-page.png',.2159,.2794,0)]:
        o=bpy.data.objects[obj];assign(o,image_mat('MAT_Completion_'+obj,file));uv_xy(o,w,h,cy)
    col=collection(bpy.context.scene,'Pen');r=empty(col,'Pen_ContactOrigin');r['dimensions_mm']='140 length; 10.9 barrel diameter';r['figma_node']='112:11081,112:11088'
    black=material('MAT_Pen_WarmBlack','1B1916',.42)[0];gold=material('MAT_Pen_Nose','D8AF79',.28,1)[0];clip=material('MAT_Pen_Clip','DB9E5D',.24,1)[0];nib=material('MAT_Pen_Nib','0B0C0D',.25,.7)[0]
    cylinder_x(col,'Pen_Barrel',-.07,.0432,.00545,.00545,black,r)
    cylinder_x(col,'Pen_Taper',.0432,.0672,.00545,.0011,gold,r)
    cylinder_x(col,'Pen_Nib',.0672,.07,.0011,.0002,nib,r)
    cylinder_x(col,'Pen_EndCap',-.07,-.067,.00545,.00545,gold,r)
    box(col,'Pen_ClipBridge',(.008,.004,.0035),(-.058,0,.01265),clip,r,.0008)
    box(col,'Pen_Clip',(.0458,.0036,.0024),(-.0391,0,.0141),clip,r,.001)
    print('Applied three new paper/dial textures; built six-part 140 mm pen.')

def build_stations():
    result={}
    for name in ['Intro','Hack Atlantic','Formula SAE','Ultra Maritime','Projects','Resume','Contact']:
        sc,c=setup_scene(name);p=name.replace(' ','')+'_'
        if name=='Intro':copy_col('FC_Prop_LandingDesk',c,p,'Prop_LandingDesk',(0,0,.666))
        elif name=='Hack Atlantic':copy_col('Station_HackAtlantic.001',c,p,'HackAtlantic_Root.001',(0,0,0))
        elif name=='Ultra Maritime':copy_col('Station_UltraMaritime',c,p,'UltraMaritime_Root',(0,0,0))
        elif name=='Projects':copy_col('Station_Personal',c,p,'Personal_Root',(0,0,0),exclude=('Personal_M5_','Personal_MacBook_Screen'))
        else:stage(c,p)
        pos={'Intro':(0,0,.74),'Hack Atlantic':(.075,.04,.74),'Formula SAE':(-.25,-.04,.74),'Ultra Maritime':(0,-.12,.74),'Projects':(-.10,-.14,.74),'Resume':(-.30,.045,.74),'Contact':(-.28,.06,.74)}[name]
        yaw=0 if name in ['Hack Atlantic','Ultra Maritime','Projects'] else 25
        lr,lo,hinge=laptop(c,p,pos,yaw,0 if name in ['Intro','Formula SAE'] else 106)
        if name=='Formula SAE':
            car,carobs=copy_col('Station_FSAE',c,p,'FSAE_Root',(.25,.025,.74),(.25,)*3);car.rotation_euler.z=math.radians(-18)
        if name=='Contact':
            copy_col('FC_Notebook_Open',c,p,'Notebook_Open',(.11,-.16,.74))
            copy_col('FC_Prop_RotaryTelephone',c,p,'Prop_RotaryTelephone',(.315,.145,.755))
            pr,po=copy_col('COL_Completion_Pen',c,p,'Pen_ContactOrigin',(.17,-.218,.7481));pr.rotation_euler.z=math.radians(-28)
        if name=='Resume':
            copy_col('FC_Prop_Printer',c,p,'Prop_Printer',(.23,.14,.74))
            copy_col('FC_Resume_Page',c,p,'Resume_Page',(.23,-.12,.742))
        cam=camera(sc,'CAM_'+p+'Wide',(1,-2.2,2.0),(0,0,.8),1.8);fit(cam,c.objects,.83,.79)
        sc['figma_file']='AAoP4nNd3n9QzR9C2Cjarm';sc['station']=name;sc['hero']=lr.name
        if name in ['Hack Atlantic','Ultra Maritime','Projects']:
            close=camera(sc,'CAM_'+p+'StraightOn',(0,-2,1.1),(0,0,.8),.65)
            close.rotation_euler=(math.radians(78),0,0)
            fit(close,lo,.496 if name=='Hack Atlantic' else .678,.95,(.5,.47))
            close['figma_node']={'Hack Atlantic':'54:6828','Ultra Maritime':'54:6950','Projects':'54:7071'}[name]
        elif name in ['Resume','Contact']:
            target=(.23,-.12,.742) if name=='Resume' else (.11,-.16,.748)
            close=camera(sc,'CAM_'+p+'Birdseye',(target[0],target[1],2),target,.45 if name=='Resume' else .48)
            close['figma_node']='55:7271' if name=='Resume' else '13:2882'
        sc.camera=cam;result[name]=len(c.objects)
    print(json.dumps(result))

def render_station(name,close=False,percent=65):
    sc=bpy.data.scenes['Completion — '+name];active(sc)
    cams=[o for o in sc.objects if o.type=='CAMERA']
    sc.camera=next(o for o in cams if ('Wide' not in o.name if close else 'Wide' in o.name))
    sc.render.resolution_percentage=percent;sc.render.filepath=str(PRE/(name.lower().replace(' ','-')+('-close' if close else '-wide')+'.png'))
    bpy.ops.render.render(write_still=True)
    print(sc.render.filepath)

def line(c,name,coords,mat,radius=.0006):
    d=bpy.data.curves.new(name,'CURVE');enum(d,'dimensions','3D');d.bevel_depth=radius;d.bevel_resolution=2
    s=d.splines.new('POLY');s.points.add(len(coords)-1)
    for p,co in zip(s.points,coords):p.co=(*co,1)
    o=bpy.data.objects.new(name,d);c.objects.link(o);d.materials.append(mat);return o

def callouts():
    sc=bpy.data.scenes['Completion — Formula SAE'];active(sc);c=collection(sc,'FSAE_Callouts')
    cam=bpy.data.objects['CAM_FormulaSAE_Wide'];car=bpy.data.objects['FormulaSAE_FSAE_Root'];R=cam.rotation_euler.to_matrix()
    ink=material('MAT_Callout_Connector','E7E1D6',.65)[0]
    for key,file,w,h,x,y,anchor in [('DataLogging','fsae-data-logging.png',.23,.07255,.63,.82,(0,-.31,.46))]:
        o=mesh(c,'FSAE_Label_'+key,[(-w/2,-h/2,0),(w/2,-h/2,0),(w/2,h/2,0),(-w/2,h/2,0)],[(0,1,2,3)],image_mat('MAT_Label_'+key,file,.9,True));uv_xy(o,w,h)
        o.rotation_euler=cam.rotation_euler;o.location=cam.location+R@Vector(((x-.5)*cam.data.ortho_scale,(y-.5)*cam.data.ortho_scale/1.5,-2.5))
        a=car.matrix_world@Vector(anchor);label=o.location+R@Vector((0,-h/2 if y>.5 else h/2,0))
        mid=(label+a)/2+R@Vector((.025,0,0));line(c,'FSAE_Connector_'+key,[label,mid,a],ink)
        mark=empty(c,'FSAE_Anchor_'+key,a);mark['association']='Conceptual dash / footwell anchor; component location not mechanically verified';o['figma_source']='40:3463';o['browser_overlay']=True
    sc['callout_note']='Data logger is behind the seat; mounting detail is representative.'
    print('Added independent labels, connector curves and explicit conceptual anchors.')

def fcurves(block):
    ad=block.animation_data
    if not ad or not ad.action:return []
    action=ad.action
    if hasattr(action,'fcurves'):return list(action.fcurves)
    return [fc for layer in action.layers for strip in layer.strips for bag in strip.channelbags for fc in bag.fcurves]

def linear_keys(block):
    for fc in fcurves(block):
        for k in fc.keyframe_points:enum(k,'interpolation','LINEAR')

def camera_moves():
    for name in ['Hack Atlantic','Ultra Maritime','Projects','Resume','Contact']:
        sc=bpy.data.scenes['Completion — '+name];active(sc);p=name.replace(' ','')+'_'
        wide=bpy.data.objects['CAM_'+p+'Wide'];end=next(o for o in sc.objects if o.type=='CAMERA' and o!=wide)
        animated=wide.copy();animated.data=wide.data.copy();animated.name='CAM_'+p+'Animated';sc.collection.objects.link(animated)
        q0=wide.rotation_euler.to_quaternion();q1=end.rotation_euler.to_quaternion();enum(animated,'rotation_mode','QUATERNION')
        for f in range(1,122):
            t=min(1,max(0,((f-1)/120-.1)/.8));t=t*t*(3-2*t)
            animated.location=wide.location.lerp(end.location,t);animated.rotation_quaternion=q0.slerp(q1,t);animated.data.ortho_scale=(1-t)*wide.data.ortho_scale+t*end.data.ortho_scale
            animated.keyframe_insert(data_path='location',frame=f);animated.keyframe_insert(data_path='rotation_quaternion',frame=f);animated.data.keyframe_insert(data_path='ortho_scale',frame=f)
        linear_keys(animated);linear_keys(animated.data);sc.frame_start=1;sc.frame_end=121;sc.camera=animated;sc.frame_set(121)
        sc.timeline_markers.new('Wide hold',frame=1);sc.timeline_markers.new('Close hold',frame=109)
    print('Baked five reversible push-in / birdseye camera moves.')

def paper_feed():
    sc=bpy.data.scenes['Completion — Resume'];active(sc);c=collection(sc,'Resume_PaperFeed')
    old=bpy.data.objects['Resume_Resume_Page.Sheet'];old.hide_render=True;old.hide_viewport=True
    # The existing slot is 69 mm above the desktop. Curve the emerging sheet down
    # to the tray and desk, then settle flat after it clears the slot.
    width=.2159;length=.2794;segments=48
    verts=[(x,-length/2+j*length/segments,0) for j in range(segments+1) for x in [-width/2,width/2]]
    faces=[(j*2,j*2+1,j*2+3,j*2+2) for j in range(segments)]
    o=mesh(c,'Resume_PaperFeed_Sheet',verts,faces,old.data.materials[0]);o.location=(.23,0,0);uv_xy(o,width,length)
    o.shape_key_add(name='Basis')
    states=[0,.1,.3,.5,.7,.9,1]
    for index,t in enumerate(states):
        k=o.shape_key_add(name='Feed_'+str(index))
        travel=max(0,(t-.1)/.8)*.32
        settle=max(0,(t-.9)/.1)
        for j,v in enumerate(k.data):
            x,y,_=verts[j];distance=travel-(y+length/2)
            if distance<0:
                yy=.033-distance*.40;zz=.809+.035*math.sin(-distance*8)
            else:
                yy=.033-distance
                u=min(1,max(0,(distance-.015)/.12));u=u*u*(3-2*u);zz=.809*(1-u)+.7422*u
            final_y=y-.12;v.co=(x,yy*(1-settle)+final_y*settle,zz*(1-settle)+.7422*settle)
        for f,weight in [(1+120*s,1 if s==t else 0) for s in states]:k.value=weight;k.keyframe_insert(data_path='value',frame=f)
    linear_keys(o.data.shape_keys)
    o['feed_note']='Sheet exits actual elevated slot, bends to desktop, then settles flat. Reversible morph animation.'
    o['figma_source']='55:7271';sc.frame_set(121)
    print('Built seven reversible paper-feed states with constant topology.')

def interp(poses,p,key):
    a,b=poses[0],poses[-1]
    for left,right in zip(poses,poses[1:]):
        if left['p']<=p<=right['p']:a,b=left,right;break
    t=0 if b['p']==a['p'] else (p-a['p'])/(b['p']-a['p']);t=t*t*(3-2*t)
    av,bv=a[key],b[key]
    if isinstance(av,list):return [(1-t)*x+t*y for x,y in zip(av,bv)]
    return (1-t)*av+t*bv

def journey():
    sc,c=setup_scene('Portfolio Journey');sc.frame_start=1;sc.frame_end=721;active(sc)
    names=['Intro','Hack Atlantic','Formula SAE','Ultra Maritime','Projects','Resume','Contact'];station_groups=[]
    for idx,name in enumerate(names):
        src=bpy.data.collections['COL_Completion_'+name+'_Assets'];srcscene=bpy.data.scenes['Completion — '+name]
        # Only one detailed travelling laptop exists in this scene.
        hero=bpy.data.objects[srcscene['hero']];excluded={hero,*hero.children_recursive}
        root,obs=copy_objects([o for o in src.objects if o not in excluded],c,'Journey_'+name.replace(' ','')+'_')
        sr=empty(c,'Journey_Station_'+str(idx),(idx*2,0,0))
        for o in obs:
            if not o.parent:o.parent=sr
        station_groups.append((sr,obs))
    travel,hero,hinge=laptop(c,'Journey_',pos=(0,0,.74),yaw=25,lid=0)
    feet=empty(c,'Journey_TravelFeet');travel.parent=feet;travel.location=(0,0,.009483764);travel.rotation_euler=(0,0,0)
    spin=next(o for o in hero if o.name.endswith('MacBook_SpinPivot'))
    cam=camera(sc,'CAM_Journey_Centered',(0,-2,1.5),(0,0,.82),.7);cam.rotation_euler=(math.radians(63.3),0,0)
    # Keep illumination relative to the subject throughout the six moves.
    lamps=[o for o in sc.objects if o.type=='LIGHT'];light_offsets=[o.location.copy() for o in lamps]
    records=[]
    for frame in range(1,722):
        ti=min(5,(frame-1)//120);p=((frame-1)-120*ti)/120;tr=MAN['transitions'][ti];poses=tr['poses']
        pos=interp(poses,p,'position_m');feet.location=pos
        spin.rotation_euler=tuple(math.radians(interp(poses,p,k)) for k in ['pitch_deg','roll_deg','yaw_deg'])
        hinge.rotation_euler.x=math.radians(110-interp(poses,p,'lid_deg'))
        for o,path in [(feet,'location'),(spin,'rotation_euler'),(hinge,'rotation_euler')]:o.keyframe_insert(data_path=path,frame=frame)
        bpy.context.view_layer.update()
        center=interp(poses,p,'subject_target_normalized');width=fit(cam,hero,interp(poses,p,'hero_max_width_fraction'),.64,center)
        cam.keyframe_insert(data_path='location',frame=frame);cam.data.keyframe_insert(data_path='ortho_scale',frame=frame)
        for lamp,offset in zip(lamps,light_offsets):
            lamp.location=offset+Vector((pos[0],pos[1],pos[2]-.74));lamp.keyframe_insert(data_path='location',frame=frame)
        # Deterministic visibility is delivered separately, since GLB has no standard visibility track.
        vis=[]
        for idx,(sr,obs) in enumerate(station_groups):
            visible=(idx==ti and p<=.32) or (idx==ti+1 and p>=.68)
            for o in obs:
                if 'Cutter' in o.name:continue
                o.hide_render=not visible;o.keyframe_insert(data_path='hide_render',frame=frame)
            vis.append(visible)
        records.append({'frame':frame,'transition':ti+1,'progress':round(p,6),'camera_position':list(cam.location),'camera_rotation_euler':list(cam.rotation_euler),'ortho_width':width,'subject_center':center,'station_visible':vis})
    for o in [feet,spin,hinge,cam,*lamps]:linear_keys(o)
    linear_keys(cam.data)
    for tr in MAN['transitions']:
        f=1+(tr['id']-1)*120;sc.timeline_markers.new(str(tr['id'])+' '+tr['from']+' → '+tr['to'],frame=f)
    sc['motion_note']='Single physical-scale hero. Baked reversible transforms and camera fit. Formula SAE is the only horizontal framing exception.'
    (OUT/'motion-runtime.json').write_text(json.dumps({'fps':30,'frame_range':[1,721],'transitions':[{'id':t['id'],'from':t['from'],'to':t['to'],'start':1+(t['id']-1)*120,'end':1+t['id']*120} for t in MAN['transitions']],'frames':records,'source_manifest':'../../figma_refs/completion/motion-manifest.json','reduced_motion':'Use landed station scenes and fully printed page; no flips or feed.','visibility_note':'Boolean station visibility switches outside the hero; optional browser alpha crossfade uses authored manifest.'},indent=2))
    sc.frame_set(61);print('Baked 721 frames, six reversible transitions, one MacBook and centered camera.')

def refine_journey():
    sc=bpy.data.scenes['Completion — Portfolio Journey'];active(sc)
    root=bpy.data.objects['Journey_MacBook_TravelRoot'];hero=[root]+list(root.children_recursive)
    feet=bpy.data.objects['Journey_TravelFeet'];cam=bpy.data.objects['CAM_Journey_Centered']
    path=OUT/'motion-runtime.json';runtime=json.loads(path.read_text());corrections=[]
    for row in runtime['frames']:
        frame=row['frame'];sc.frame_set(frame)
        lo,hi=exact_extent(hero)
        if lo.z<.74009:
            dz=.7401-lo.z;feet.location.z+=dz;feet.keyframe_insert(data_path='location',frame=frame);corrections.append([frame,dz]);bpy.context.view_layer.update()
        tr=MAN['transitions'][row['transition']-1];p=row['progress']
        width=fit(cam,hero,interp(tr['poses'],p,'hero_max_width_fraction'),.64,row['subject_center'])
        cam.keyframe_insert(data_path='location',frame=frame);cam.data.keyframe_insert(data_path='ortho_scale',frame=frame)
        row.update(camera_position=list(cam.location),ortho_width=width)
    linear_keys(feet);linear_keys(cam);linear_keys(cam.data)
    runtime['camera_fit']='Actual mesh vertices, not inflated rotated bounding boxes';runtime['contact_height_corrections']=corrections
    path.write_text(json.dumps(runtime,indent=2));sc.frame_set(61)
    print(json.dumps({'accurately_centered_frames':721,'contact_height_corrections':len(corrections)}))

def contexts():
    sc=bpy.data.scenes['Completion — Contact'];active(sc)
    cam=camera(sc,'CAM_Contact_Birdseye_Context',(.055,-.035,2),(.055,-.035,.748),.72)
    cam['note']='Additional overview includes notebook, cropped laptop and phone; authored tight notebook view is retained.'
    sc.camera=cam;sc.render.filepath=str(PRE/'contact-context.png');sc.render.resolution_percentage=75;bpy.ops.render.render(write_still=True)
    sc=bpy.data.scenes['Completion — Resume'];active(sc);sc.frame_set(121)
    cam=camera(sc,'CAM_Resume_Birdseye_Context',(.08,-.035,2),(.08,-.035,.748),.74)
    cam['note']='Additional context view; authored tight page view retained.'
    sc.camera=cam;sc.render.filepath=str(PRE/'resume-context.png');sc.render.resolution_percentage=75;bpy.ops.render.render(write_still=True)

def export_objects(sc,obs,slug,animated=False,frame_start=None,frame_end=None,cameras=False):
    active(sc);bpy.ops.object.select_all(action='DESELECT')
    selected=[]
    for o in obs:
        if o.name not in sc.objects or o.hide_render or 'Cutter' in o.name or o.get('runtime_reference'):continue
        if o.type in ('LIGHT','CAMERA') and not cameras:continue
        o.hide_set(False);o.select_set(True);selected.append(o)
    if selected:bpy.context.view_layer.objects.active=selected[0]
    old_range=(sc.frame_start,sc.frame_end)
    if frame_start is not None:sc.frame_start=frame_start
    if frame_end is not None:sc.frame_end=frame_end
    import io_scene_gltf2
    assert 'GLB' in {x[0] for x in io_scene_gltf2.get_format_items(None,bpy.context)}
    frozen=[]
    if not animated:
        dg=bpy.context.evaluated_depsgraph_get()
        for o in selected:
            if o.type=='MESH' and o.data.shape_keys:
                old=o.data;new=bpy.data.meshes.new_from_object(o.evaluated_get(dg));o.data=new;frozen.append((o,old,new))
    kwargs=dict(filepath=str(OUT/(slug+'.glb')),export_format='GLB',use_selection=True,use_active_scene=True,export_apply=not any(o.type=='MESH' and o.data.shape_keys for o in selected),export_animations=animated,export_extras=True,export_yup=True,export_cameras=cameras,export_lights=False)
    if animated:
        props=bpy.ops.export_scene.gltf.get_rna_type().properties
        mode='ACTIVE_ACTIONS';assert mode in {x.identifier for x in props['export_animation_mode'].enum_items}
        kwargs.update(export_animation_mode=mode,export_frame_range=True,export_force_sampling=True,export_anim_slide_to_zero=True,export_nla_strips_merged_animation_name=slug)
    bpy.ops.export_scene.gltf(**kwargs)
    for o,old,new in frozen:o.data=old;bpy.data.meshes.remove(new)
    sc.frame_start,sc.frame_end=old_range
    print('Exported '+slug)

def export_static():
    for name in ['Intro','Hack Atlantic','Formula SAE','Ultra Maritime','Projects','Resume','Contact']:
        sc=bpy.data.scenes['Completion — '+name];active(sc);sc.frame_set(121)
        export_objects(sc,list(sc.objects),'station-'+name.lower().replace(' ','-'))
    sc=bpy.data.scenes['Figma Components'];active(sc)
    for col,slug in [('COL_Completion_Pen','pen'),('FC_Prop_RotaryTelephone','rotary-phone'),('FC_Notebook_Open','notebook'),('FC_Resume_Page','resume-page')]:
        c=bpy.data.collections[col];roots=[o for o in c.objects if not o.parent];saved=[o.location.copy() for o in roots]
        for o in roots:o.location=(0,0,0)
        bpy.context.view_layer.update();export_objects(sc,list(c.objects),slug)
        for o,loc in zip(roots,saved):o.location=loc
    sc=bpy.data.scenes['Completion — Resume'];active(sc)
    export_objects(sc,[bpy.data.objects['Resume_PaperFeed_Sheet']],'printer-paper-feed',True,1,121)

def export_motion():
    sc=bpy.data.scenes['Completion — Portfolio Journey'];active(sc);sc.frame_set(1)
    root=bpy.data.objects['Journey_TravelFeet'];obs=[root]+list(root.children_recursive)
    for t in MAN['transitions']:
        export_objects(sc,obs,'transition-'+str(t['id'])+'-'+t['from'].lower().replace(' ','-')+'-to-'+t['to'].lower().replace(' ','-'),True,1+(t['id']-1)*120,1+t['id']*120)
    export_objects(sc,obs,'macbook-journey',True,1,721)

def polish_scene_motion():
    resume=bpy.data.scenes['Completion — Resume'];active(resume)
    paper=bpy.data.objects['Resume_PaperFeed_Sheet'];final=paper.data.shape_keys.key_blocks['Feed_6']
    for v in final.data:
        u=max(0,min(1,(v.co.y+.12)/.1397));u=u*u*(3-2*u)
        v.co.z=.7422+.067*u
    for idx,lead in [(2,.0197),(3,-.0921),(4,-.1759)]:
        key=paper.data.shape_keys.key_blocks['Feed_'+str(idx)];travel=.033-lead
        for j,v in enumerate(key.data):
            y=-.2794/2+(j//2)*.2794/48;distance=travel-(y+.2794/2)
            if distance<0:yy=.033-distance*.4;zz=.809+.035*math.sin(-distance*8)
            else:
                yy=.033-distance;u=min(1,max(0,(distance-.015)/.12));u=u*u*(3-2*u);zz=.809*(1-u)+.7422*u
            v.co.y=yy;v.co.z=zz
    for a,b in zip(paper.data.shape_keys.key_blocks['Feed_5'].data,final.data):a.co=b.co
    paper['feed_note']='Reversible morph feed through actual elevated slot. Printed sheet rests over the output tray; its header remains visible above the tray.'
    resume.frame_set(121);bpy.context.view_layer.update()
    dg=bpy.context.evaluated_depsgraph_get();d=bpy.data.meshes.new_from_object(paper.evaluated_get(dg))
    journey=bpy.data.scenes['Completion — Portfolio Journey'];active(journey)
    old=bpy.data.objects['Journey_Resume_Resume_Resume_Page.Sheet'];bpy.data.objects.remove(old,do_unlink=True)
    c=bpy.data.collections['COL_Completion_Portfolio Journey_Assets'];o=bpy.data.objects.new('Journey_PrintedPage',d);c.objects.link(o);o.parent=bpy.data.objects['Journey_Station_5'];o.location=paper.location
    for idx in range(7):
        root=bpy.data.objects['Journey_Station_'+str(idx)];obs=list(root.children_recursive);maps={}
        for o in obs:
            if 'Cutter' in o.name or o.type not in ('MESH','CURVE'):continue
            for slot in o.material_slots:
                orig=slot.material
                if not orig or not orig.use_nodes:continue
                if orig not in maps:
                    mat=orig.copy();mat.name='MAT_JourneyFade_'+str(idx)+'_'+orig.name;nodes=mat.node_tree.nodes;links=mat.node_tree.links
                    factors=[]
                    for bsdf in [n for n in nodes if n.type=='BSDF_PRINCIPLED']:
                        alpha=bsdf.inputs['Alpha'];factor=nodes.new('ShaderNodeMath');enum(factor,'operation','MULTIPLY');factor.inputs[0].default_value=alpha.default_value
                        if alpha.is_linked:links.new(alpha.links[0].from_socket,factor.inputs[0])
                        links.new(factor.outputs[0],alpha);factors.append(factor.inputs[1])
                    enum(mat,'surface_render_method','DITHERED')
                    for ti,tr in enumerate(MAN['transitions']):
                        for pose in tr['poses']:
                            value=pose['station_visibility']['from'] if idx==ti else pose['station_visibility']['to'] if idx==ti+1 else 0
                            for f in factors:f.default_value=value;f.keyframe_insert(data_path='default_value',frame=1+ti*120+round(pose['p']*120))
                    linear_keys(mat.node_tree);maps[orig]=mat
                enum(slot,'link','OBJECT');slot.material=maps[orig]
            for frame in range(1,722):
                ti=min(5,(frame-1)//120);p=(frame-1-ti*120)/120
                visible=(idx==ti and p<.5) or (idx==ti+1 and p>.5)
                o.hide_render=not visible;o.keyframe_insert(data_path='hide_render',frame=frame)
    runtime=json.loads((OUT/'motion-runtime.json').read_text())
    for row in runtime['frames']:
        ti=row['transition']-1;p=row['progress'];poses=MAN['transitions'][ti]['poses']
        # Opacity follows the same smooth, authored per-segment progress as travel.
        a,b=poses[0],poses[-1]
        for left,right in zip(poses,poses[1:]):
            if left['p']<=p<=right['p']:a,b=left,right;break
        t=0 if b['p']==a['p'] else (p-a['p'])/(b['p']-a['p'])
        row['station_opacity']=[(1-t)*a['station_visibility']['from']+t*b['station_visibility']['from'] if i==ti else (1-t)*a['station_visibility']['to']+t*b['station_visibility']['to'] if i==ti+1 else 0 for i in range(7)]
        row['station_visible']=[v>0 for v in row['station_opacity']]
    runtime['visibility_note']='Blender station materials fade. Apply station_opacity from this manifest in the future website; GLB transform clips omit visibility.'
    (OUT/'motion-runtime.json').write_text(json.dumps(runtime,indent=2));journey.frame_set(1)
    print('Printed page clears the tray; station materials now fade with the approved choreography.')

def export_cameras():
    records={}
    for name in ['Hack Atlantic','Ultra Maritime','Projects','Resume','Contact']:
        sc=bpy.data.scenes['Completion — '+name];active(sc);cam=bpy.data.objects['CAM_'+name.replace(' ','')+'_Animated'];rows=[]
        for f in range(1,122):
            sc.frame_set(f);rows.append({'frame':f,'position':list(cam.location),'quaternion_wxyz':list(cam.rotation_quaternion),'orthographic_width':cam.data.ortho_scale})
        records[name]={'fps':30,'frames':rows,'static_cameras':[{'name':o.name,'matrix_world':[list(r) for r in o.matrix_world],'ortho_width':o.data.ortho_scale} for o in sc.objects if o.type=='CAMERA' and o!=cam]}
    (OUT/'station-cameras.json').write_text(json.dumps(records,indent=2));print('Saved static and animated station cameras.')

def validate_live():
    report={'units':'metres','scenes':{},'textures':{},'materials':{},'motion':{}}
    for sc in bpy.data.scenes:
        if not sc.name.startswith('Completion —'):continue
        active(sc);sc.frame_set(121 if 'Journey' not in sc.name else 1);dg=bpy.context.evaluated_depsgraph_get();tri=0;finite=True
        for o in sc.objects:
            if o.type!='MESH' or o.hide_render:continue
            eo=o.evaluated_get(dg);me=eo.to_mesh();me.calc_loop_triangles();tri+=len(me.loop_triangles)
            a=np.empty(len(me.vertices)*3,dtype=np.float32);me.vertices.foreach_get('co',a);finite=finite and bool(np.isfinite(a).all());eo.to_mesh_clear()
        report['scenes'][sc['station'] if 'station' in sc else sc.name]={'visible_evaluated_triangles':tri,'finite_vertices':finite,'objects':len(sc.objects),'camera':sc.camera.name}
    for name in ['MAT_MacBook_Silver','MAT_MacBook_Keys','MAT_MacBook_BlankGlass','MAT_Phone_RedPlastic','MAT_Phone_Acrylic','MAT_Phone_Chrome']:
        mat=bpy.data.materials[name];b=next(n for n in mat.node_tree.nodes if n.type=='BSDF_PRINCIPLED')
        report['materials'][name]={k:float(b.inputs[k].default_value) for k in ['Metallic','Roughness','Coat Weight','Coat Roughness','IOR','Transmission Weight','Emission Strength']}
        report['materials'][name]['base_color']=list(b.inputs['Base Color'].default_value)
    for im in bpy.data.images:
        if 'figma-completion' in im.filepath or '/red-phone/' in im.filepath:report['textures'][im.name]={'size':list(im.size),'packed':bool(im.packed_file),'color_space':im.colorspace_settings.name}
    sc=bpy.data.scenes['Completion — Portfolio Journey'];active(sc);cam=bpy.data.objects['CAM_Journey_Centered'];root=bpy.data.objects['Journey_MacBook_TravelRoot'];hero=[root]+list(root.children_recursive)
    runtime=json.loads((OUT/'motion-runtime.json').read_text());max_error=0;min_z=100;max_width=0;max_height=0;states={}
    for row in runtime['frames']:
        sc.frame_set(row['frame']);lo,hi=exact_extent(hero,cam.rotation_euler.to_matrix().inverted());p=cam.rotation_euler.to_matrix().inverted()@cam.location
        center=[((lo.x+hi.x)*.5-p.x)/cam.data.ortho_scale+.5,((lo.y+hi.y)*.5-p.y)/(cam.data.ortho_scale/1.5)+.5]
        max_error=max(max_error,max(abs(a-b) for a,b in zip(center,row['subject_center'])))
        max_width=max(max_width,(hi.x-lo.x)/cam.data.ortho_scale);max_height=max(max_height,(hi.y-lo.y)/(cam.data.ortho_scale/1.5))
        z=exact_extent(hero)[0].z;min_z=min(min_z,z)
        if row['frame']%30==1:states[row['frame']]=[list(root.matrix_world.translation),list(cam.location),cam.data.ortho_scale]
    reverse_error=0
    for frame,state in reversed(list(states.items())):
        sc.frame_set(frame);now=[list(root.matrix_world.translation),list(cam.location),cam.data.ortho_scale]
        reverse_error=max(reverse_error,max(abs(x-y) for a,b in zip(state[:2],now[:2]) for x,y in zip(a,b)),abs(state[2]-now[2]))
    report['motion']={'frames_checked':721,'maximum_center_error_pixels_at_1440':max_error*1440,'maximum_projected_width_fraction':max_width,'maximum_projected_height_fraction':max_height,'minimum_world_z':min_z,'reverse_playback_error':reverse_error,'hero_physical_scale':list(root.scale)}
    assert max_error<.001 and min_z>=.7399 and max_height<.641 and max_width<.561
    assert report['materials']['MAT_MacBook_BlankGlass']['Emission Strength']==0
    report['remaining_notes']=['FSAE callout anchors are conceptual; actual sensor locations are unverified.','Existing laptop dimensions preserved (about 311.7 × 224.1 × 17.9 mm closed).','Authored tight birdseye crops retained; additional wider context cameras are available.','Paper final pose follows the elevated physical output tray instead of passing underneath it.']
    (OUT/'blender-validation.json').write_text(json.dumps(report,indent=2));sc.frame_set(1);print(json.dumps(report['motion']))

def roundtrip(only=None):
    original=bpy.context.scene
    results=json.loads((OUT/'roundtrip-validation.json').read_text()) if only and (OUT/'roundtrip-validation.json').exists() else {}
    for path in sorted(OUT.glob('*.glb')):
        if only and path.name not in only:continue
        sc=bpy.data.scenes.new('QA_Import_'+path.stem);active(sc);sc.render.fps=30
        before={o.as_pointer() for o in bpy.data.objects}
        bpy.ops.import_scene.gltf(filepath=str(path))
        sc.frame_set(0);bpy.context.view_layer.update();obs=[o for o in sc.objects if o.type=='MESH'];finite=True
        for o in obs:
            a=np.empty(len(o.data.vertices)*3,dtype=np.float32);o.data.vertices.foreach_get('co',a);finite=finite and bool(np.isfinite(a).all())
        lo,hi=exact_extent(obs);images={n.image for o in obs for mat in o.data.materials if mat and mat.use_nodes for n in mat.node_tree.nodes if n.type=='TEX_IMAGE' and n.image}
        results[path.name]={'imported_meshes':len(obs),'finite':finite,'dimensions_m':list(hi-lo),'textures':len(images),'all_textures_packed':all(im.packed_file is not None for im in images),'animated_objects':sum(bool(o.animation_data) for o in sc.objects),'animated_shape_keys':sum(bool(o.data.shape_keys and o.data.shape_keys.animation_data) for o in obs)}
        assert finite and len(obs)>0
        active(original)
        for o in list(sc.objects):bpy.data.objects.remove(o,do_unlink=True)
        bpy.data.scenes.remove(sc)
    (OUT/'roundtrip-validation.json').write_text(json.dumps(results,indent=2));print(json.dumps(results))

def save():
    for im in bpy.data.images:
        if im.source=='FILE' and im.has_data and not im.packed_file:
            try:im.pack()
            except RuntimeError:pass
    bpy.ops.wm.save_as_mainfile(filepath=str(ROOT/'blender/portfolio-elements.blend'))
    bpy.ops.wm.save_as_mainfile(filepath=str(ROOT/'blender/portfolio-completed.blend'),copy=True)
    print('Saved master and portfolio-completed.blend delivery copy.')
