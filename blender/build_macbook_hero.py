"""Execute through Blender MCP with the portfolio master loaded. Preserves source scenes."""
import bpy, math, json, os
import numpy as np
from mathutils import Vector, Matrix

BASE = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
NAME = 'MacBook Hero'
if bpy.data.scenes.get(NAME):
    raise RuntimeError('MacBook Hero already exists; do not overwrite it.')
source = bpy.data.objects.get('MacBook_Base')
if source is None:
    raise RuntimeError('Load portfolio-elements.blend first.')
scene = bpy.data.scenes.new(NAME)
bpy.context.window.scene = scene
scene.unit_settings.system = 'METRIC'
scene.unit_settings.scale_length = 1
asset = bpy.data.collections.new('COL_MacBook_Export')
studio = bpy.data.collections.new('COL_MacBook_Review')
scene.collection.children.link(asset)
scene.collection.children.link(studio)

def empty(name, parent=None, loc=(0,0,0)):
    o = bpy.data.objects.new(name, None)
    asset.objects.link(o)
    o.parent = parent
    o.location = loc
    o.empty_display_size = .05
    return o

travel = empty('MacBook_TravelRoot')
spin = empty('MacBook_SpinPivot', travel)
base = empty('MacBook_BaseGroup', spin)
hinge = empty('MacBook_LidPivot', spin, (0,.121,.023))
hinge['closed_angle_degrees'] = 0
hinge['open_angle_degrees'] = 108
hinge['blender_rotation_x_formula'] = 'radians(90 - openingDegrees)'
travel['units'] = 'meters'
travel['purpose'] = 'Move travel root; rotate spin pivot; animate lid pivot independently.'

def clone(src, name, parent):
    o = src.copy()
    o.data = src.data.copy()
    o.animation_data_clear()
    o.name = name
    asset.objects.link(o)
    o.parent = parent
    o.matrix_parent_inverse = Matrix.Identity(4)
    return o

body = clone(source, 'SM_MacBook_Base', base)
body.location = (0,0,0)
lid = clone(bpy.data.objects['MacBook_DisplayHousing'], 'SM_MacBook_Lid', hinge)
bezel = clone(bpy.data.objects['MacBook_DisplayBezel'], 'SM_MacBook_Bezel', hinge)
screen = clone(bpy.data.objects['Personal_MacBook_Screen'], 'MacBook_Screen', hinge)
notch = clone(bpy.data.objects['MacBook_CameraNotch'], 'SM_MacBook_Notch', hinge)
notch.location.y=-.005
for v in notch.data.vertices: v.co.y*=.0625
lid.location.z*=.244/.23
for v in lid.data.vertices: v.co.z*=.244/.23
bezel.location.z*=.244/.23
for v in bezel.data.vertices: v.co.z*=.244/.23
notch.location.z+=.014
for v in screen.data.vertices: v.co.z+=.007
trackpad = clone(bpy.data.objects['MacBook_Trackpad'], 'SM_MacBook_Trackpad', base)
trackpad.location = (0,-.075,.0087)
screen['content_uv'] = '0..1, bottom-left origin; display width .332m, height .202m'

def scalar(name, color, metallic=0, roughness=.45):
    m = bpy.data.materials.new(name)
    m.use_nodes = True
    p = next(n for n in m.node_tree.nodes if n.type == 'BSDF_PRINCIPLED')
    p.inputs['Base Color'].default_value = (*color,1)
    p.inputs['Metallic'].default_value = metallic
    p.inputs['Roughness'].default_value = roughness
    return m

dark = scalar('MAT_MacBook_KeyboardRubber', (.009,.011,.014), roughness=.58)
screenmat = scalar('MAT_MacBook_ScreenContent', (.015,.022,.035), roughness=.5)

def assign(o, m):
    o.data.materials.clear()
    o.data.materials.append(m)

def box(name, loc, size, mat, parent=base, bevel=.001, target=asset):
    x,y,z = (s/2 for s in size)
    vs = [(-x,-y,-z),(x,-y,-z),(x,y,-z),(-x,y,-z),(-x,-y,z),(x,-y,z),(x,y,z),(-x,y,z)]
    fs = [(0,3,2,1),(4,5,6,7),(0,1,5,4),(1,2,6,5),(2,3,7,6),(3,0,4,7)]
    data = bpy.data.meshes.new(name+'_Mesh')
    data.from_pydata(vs,[],fs)
    data.update()
    o = bpy.data.objects.new(name,data)
    target.objects.link(o)
    o.parent=parent; o.location=loc
    assign(o,mat)
    if bevel:
        mod=o.modifiers.new('Manufactured edges','BEVEL')
        mod.width=min(bevel,min(size)*.35); mod.segments=2
        o.modifiers.new('Weighted normals','WEIGHTED_NORMAL')
    return o

well = box('SM_MacBook_KeyboardWell',(0,.039,.0084),(.303,.127,.0008),dark)
keys=[]
# Six readable keyboard rows: function row, four typing rows, modifier/space row.
for row in range(5):
    count=14
    widths=[1]*count
    if row in (1,2,3,4): widths[0]=1.25; widths[-1]=1.6
    available=.292; gap=.0014
    unit=(available-gap*(count-1))/sum(widths)
    cursor=-available/2
    for col,w in enumerate(widths):
        width=unit*w
        keys.append(box('Key_%d_%d'%(row,col),(cursor+width/2,.090-row*.022,.0098),(width,.013 if row==0 else .018,.002),dark,bevel=.0008))
        cursor+=width+gap
widths=[.025,.021,.024,.117,.024,.021,.025]
cursor=-sum(widths)/2-.0015*3
for i,w in enumerate(widths):
    keys.append(box('Key_Bottom_%d'%i,(cursor+w/2,-.020,.0098),(w,.018,.002),dark,bevel=.0008))
    cursor+=w+.0015

def cylinder(name, loc, radius, depth, mat, parent=base, segments=16):
    bpy.ops.mesh.primitive_cylinder_add(vertices=segments, radius=radius, depth=depth, location=loc)
    o=bpy.context.object; o.name=name
    for c in list(o.users_collection): c.objects.unlink(o)
    asset.objects.link(o); o.parent=parent
    assign(o,mat)
    return o

for x in (-.137,.137):
    for y in (-.087,.087):
        cylinder('SM_MacBook_Foot',(x,y,-.009),.012,.003,dark,segments=24)
for x in (-.163,.163):
    for y in (-.107,0,.107):
        cylinder('SM_MacBook_UndersideScrew',(x,y,-.0081),.0018,.0003,dark,segments=12)
for side in (-1,1):
    for y,w in ((.075,.013),(.046,.009),(.017,.009)):
        box('SM_MacBook_PortInset',(side*.17755,y,0),(.0005,w,.0032),dark,bevel=.0005)
    box('SM_MacBook_SpeakerBed',(side*.161,.04,.0083),(.008,.105,.0005),dark,bevel=.0002)
# Hinge bar remains attached to the base while the display pivots.
bar=cylinder('SM_MacBook_HingeBar',(0,.121,.015),.004,.31,dark,segments=16)
bar.rotation_euler.y=math.pi/2

manifest=json.load(open(os.path.join(BASE,'assets/textures/devices/manifest.json')))
materials={}
for spec in manifest['materials']:
    if spec['name'] not in ('MacBookPro_Silver','MacBookPro_Trackpad','Device_BlackBezel'): continue
    m=scalar(spec['material_name']+'_Hero',(1,1,1),spec['metallic'],spec['roughness'])
    p=next(n for n in m.node_tree.nodes if n.type=='BSDF_PRINCIPLED')
    for channel,socket in [('BaseColor','Base Color'),('Roughness','Roughness')]:
        item=next(i for i in spec['maps'] if i['name'].endswith('_'+channel))
        tex=m.node_tree.nodes.new('ShaderNodeTexImage')
        tex.image=bpy.data.images.load(os.path.join(BASE,item['file']),check_existing=True)
        tex.image.colorspace_settings.name=item['color_space']
        m.node_tree.links.new(tex.outputs['Color'],p.inputs[socket])
    # Convert seamless height to tangent-space normals, so micrograin survives glTF export.
    item=next(i for i in spec['maps'] if i['name'].endswith('_Height'))
    img=bpy.data.images.load(os.path.join(BASE,item['file']),check_existing=True)
    w,h=img.size
    pixels=np.empty(w*h*4,dtype=np.float32); img.pixels.foreach_get(pixels)
    height=pixels.reshape(h,w,4)[:,:,0]
    factor=spec['bump_distance_m']*.2/(spec['tile_mm']/1000)
    dx=(np.roll(height,-1,axis=1)-np.roll(height,1,axis=1))*w*.5*factor
    dy=(np.roll(height,-1,axis=0)-np.roll(height,1,axis=0))*h*.5*factor
    n=np.stack((-dx,-dy,np.ones_like(dx)),axis=2)
    n/=np.linalg.norm(n,axis=2,keepdims=True)
    rgba=np.ones((h,w,4),dtype=np.float32); rgba[:,:,:3]=n*.5+.5
    normal=bpy.data.images.new('T_'+spec['name']+'_Normal_Hero',width=w,height=h)
    normal.colorspace_settings.name='Non-Color'; normal.pixels.foreach_set(rgba.ravel())
    normal.filepath_raw=os.path.join(BASE,'assets/textures/devices',normal.name+'.png')
    normal.file_format='PNG'; normal.save(); normal.pack()
    tex=m.node_tree.nodes.new('ShaderNodeTexImage'); tex.image=normal
    norm=m.node_tree.nodes.new('ShaderNodeNormalMap')
    m.node_tree.links.new(tex.outputs['Color'],norm.inputs['Color'])
    m.node_tree.links.new(norm.outputs['Normal'],p.inputs['Normal'])
    materials[spec['name']]=m

for o in (body,lid): assign(o,materials['MacBookPro_Silver'])
assign(trackpad,materials['MacBookPro_Trackpad'])
for o in (bezel,notch): assign(o,materials['Device_BlackBezel'])
assign(screen,screenmat)
tex=screenmat.node_tree.nodes.new('ShaderNodeTexImage')
tex.image=bpy.data.images.load(os.path.join(BASE,'assets/textures/figma/Personal_MacBook_Screen.png'),check_existing=True)
p=next(n for n in screenmat.node_tree.nodes if n.type=='BSDF_PRINCIPLED')
screenmat.node_tree.links.new(tex.outputs['Color'],p.inputs['Base Color'])
screenmat.node_tree.links.new(tex.outputs['Color'],p.inputs['Emission Color'])
p.inputs['Emission Strength'].default_value=.5

# Apply bevels on the independent hero meshes; source meshes remain editable and untouched.
for o in list(asset.objects):
    if o.type!='MESH': continue
    bpy.context.view_layer.objects.active=o
    for mod in list(o.modifiers): bpy.ops.object.modifier_apply(modifier=mod.name)
    if o==screen: continue
    uv=o.data.uv_layers.new(name='UVMap')
    # Face projection at physical density; deliberate repeats for seamless micrograin.
    tile=.020
    for poly in o.data.polygons:
        axis=max(range(3),key=lambda i:abs(poly.normal[i]))
        dims=[i for i in range(3) if i!=axis]
        for li in poly.loop_indices:
            v=o.data.vertices[o.data.loops[li].vertex_index].co
            uv.data[li].uv=(v[dims[0]]/tile,v[dims[1]]/tile)

# Consolidate static parts by material and parent, keeping the screen and lid independent.
for parent in (base,hinge):
    mats=set(o.data.materials[0] for o in asset.objects if o.type=='MESH' and o.parent==parent and o!=screen)
    for mat in mats:
        group=[o for o in asset.objects if o.type=='MESH' and o.parent==parent and o!=screen and o.data.materials[0]==mat]
        if len(group)<2: continue
        bpy.ops.object.select_all(action='DESELECT')
        for o in group: o.select_set(True)
        bpy.context.view_layer.objects.active=group[0]
        bpy.ops.object.join()
        group[0].name='SM_MacBook_'+('Lid' if parent==hinge else 'Base')+'_'+mat.name.replace('MAT_','')

# Refine the existing blockout to a slim closed profile without changing its footprint.
for o in asset.objects:
    if o.type!='MESH': continue
    if o.parent==base:
        o.location.z*=.65
        for v in o.data.vertices: v.co.z*=.65
    elif o.parent==hinge:
        o.location.y*=.6
        for v in o.data.vertices: v.co.y*=.6
hinge.location.z=.011
for m in (dark,materials['Device_BlackBezel'],screenmat):
    p=next(n for n in m.node_tree.nodes if n.type=='BSDF_PRINCIPLED')
    p.inputs['Specular IOR Level'].default_value=.15

scene.render.fps=30; scene.frame_start=1; scene.frame_end=91
for frame,opening in ((1,0),(31,108),(61,108),(91,0)):
    hinge.rotation_euler.x=math.radians(90-opening)
    hinge.keyframe_insert(data_path='rotation_euler',frame=frame)
hinge.animation_data.action.name='MacBook_Lid_OpenClose'
for f,name in ((1,'Closed'),(31,'Open 108 degrees'),(61,'Reading hold'),(91,'Closed')):
    scene.timeline_markers.new(name,frame=f)
scene.frame_set(31)

world=bpy.data.worlds.new('MacBook Studio World'); world.use_nodes=True; scene.world=world
bg=next(n for n in world.node_tree.nodes if n.type=='BACKGROUND')
bg.inputs['Color'].default_value=(.13,.15,.19,1); bg.inputs['Strength'].default_value=.45
for name,loc,power,size,color in [('Key',(.2,-.4,.6),18,.5,(1,.83,.65)),('Fill',(-.4,-.1,.35),12,.4,(.73,.83,1)),('Rim',(.1,.4,.5),22,.4,(1,1,1))]:
    d=bpy.data.lights.new('MacBook_'+name,'AREA'); d.energy=power; d.shape='DISK'; d.size=size; d.color=color
    o=bpy.data.objects.new(d.name,d); studio.objects.link(o); o.location=loc
    o.rotation_euler=(Vector((0,0,.09))-o.location).to_track_quat('-Z','Y').to_euler()
camdata=bpy.data.cameras.new('CAM_MacBook_Review'); cam=bpy.data.objects.new(camdata.name,camdata); studio.objects.link(cam)
cam.location=(.46,-.67,.43); target=Vector((0,.015,.105))
cam.rotation_euler=(target-cam.location).to_track_quat('-Z','Y').to_euler(); camdata.lens=55; scene.camera=cam
scene.render.resolution_x=1200; scene.render.resolution_y=1000; scene.render.resolution_percentage=100
try: scene.render.engine='CYCLES'
except TypeError: pass
if hasattr(scene,'cycles'): scene.cycles.samples=48; scene.cycles.use_denoising=True
scene.render.image_settings.file_format='PNG'
for area in bpy.context.screen.areas:
    if area.type=='VIEW_3D':
        area.spaces.active.region_3d.view_location=target
        area.spaces.active.region_3d.view_distance=.8
        area.spaces.active.region_3d.view_rotation=cam.rotation_euler.to_quaternion()
        area.spaces.active.shading.type='MATERIAL'
for img in bpy.data.images:
    if img.source=='FILE' and img.filepath and os.path.isfile(bpy.path.abspath(img.filepath)): img.pack()
print(json.dumps({'scene':scene.name,'objects':len(asset.objects),'meshes':sum(o.type=='MESH' for o in asset.objects),'texture_source':manifest['figma_url']}))
