"""Run in Blender to build the portfolio's standalone station assets."""
import bpy
import math
import os
from mathutils import Vector

BASE = '/Users/daxmanuel/Documents/ChatGPT/portfolio-site-blender'
SCENE_NAME = 'Portfolio Elements'
if bpy.data.scenes.get(SCENE_NAME):
    raise RuntimeError('Portfolio Elements already exists; preserve it rather than rebuilding over it.')
scene = bpy.data.scenes.new(SCENE_NAME)
bpy.context.window.scene = scene
scene.unit_settings.system = 'METRIC'
scene.unit_settings.scale_length = 1.0
world = bpy.data.worlds.new('Portfolio Preview World')
scene.world = world
world.use_nodes = True
bg = next(n for n in world.node_tree.nodes if n.type == 'BACKGROUND')
bg.inputs[0].default_value = (0.12, 0.10, 0.08, 1)
bg.inputs[1].default_value = 0.25

def material(name, color, metal=0, rough=0.5, emission=0):
    m = bpy.data.materials.new(name)
    m.use_nodes = True
    p = next(n for n in m.node_tree.nodes if n.type == 'BSDF_PRINCIPLED')
    p.inputs[0].default_value = (*color, 1)
    p.inputs[1].default_value = metal
    p.inputs[2].default_value = rough
    p.inputs[28].default_value = (*color, 1)
    p.inputs[29].default_value = emission
    m.diffuse_color = (*color, 1)
    return m

M = {
 'wood': material('Desktop | smoked walnut', (0.115, 0.055, 0.025), rough=0.38),
 'dark': material('Frame | charcoal powder coat', (0.022, 0.026, 0.03), metal=0.35, rough=0.4),
 'black': material('Device | graphite', (0.012, 0.014, 0.019), rough=0.32),
 'silver': material('MacBook | anodized aluminum', (0.38, 0.40, 0.43), metal=0.8, rough=0.27),
 'keys': material('Keyboard | black keycaps', (0.009, 0.011, 0.015), rough=0.6),
 'screen': material('Screen | idle slate', (0.022, 0.048, 0.07), rough=0.22, emission=0.3),
 'grey': material('Check-in | light grey laminate', (0.53, 0.55, 0.56), rough=0.53),
 'paper': material('Plaque | white acrylic', (0.78, 0.8, 0.82), rough=0.45),
 'rubber': material('FSAE | slick rubber', (0.012, 0.014, 0.016), rough=0.8),
 'rim': material('FSAE | satin alloy', (0.19, 0.21, 0.23), metal=0.85, rough=0.28),
 'red': material('FSAE | oxblood bodywork', (0.32, 0.012, 0.018), metal=0.28, rough=0.27),
 'carbon': material('FSAE | dark composite', (0.018, 0.023, 0.027), rough=0.38),
 'steel': material('FSAE | chassis steel', (0.13, 0.15, 0.17), metal=0.8, rough=0.35),
 'belt': material('FSAE | harness', (0.6, 0.045, 0.025), rough=0.65),
 'floor': material('Preview | dark ground', (0.035, 0.031, 0.028), rough=0.7),
}

def collection(name):
    c = bpy.data.collections.new(name)
    scene.collection.children.link(c)
    return c

def root(c, name, loc):
    o = bpy.data.objects.new(name, None)
    c.objects.link(o)
    o.location = loc
    o.empty_display_size = 0.15
    return o

def mesh(name, vertices, faces, mat, c, parent=None):
    data = bpy.data.meshes.new(name + '_Mesh')
    data.from_pydata(vertices, [], faces)
    data.update()
    obj = bpy.data.objects.new(name, data)
    c.objects.link(obj)
    if mat: data.materials.append(mat)
    if parent: obj.parent = parent
    return obj

def box(name, loc, size, mat, c, parent=None, bevel=0.005):
    x,y,z = (s/2 for s in size)
    vs = [(-x,-y,-z), (x,-y,-z), (x,y,-z), (-x,y,-z),
          (-x,-y,z), (x,-y,z), (x,y,z), (-x,y,z)]
    fs = [(0,3,2,1),(4,5,6,7),(0,1,5,4),(1,2,6,5),(2,3,7,6),(3,0,4,7)]
    o = mesh(name, vs, fs, mat, c, parent)
    o.location = loc
    if bevel:
        b = o.modifiers.new('Soft manufactured edges', 'BEVEL')
        b.width = min(bevel, min(size)*0.35)
        b.segments = 3
        o.modifiers.new('Corner normals', 'WEIGHTED_NORMAL')
    return o

def tube(name, a, b, radius, mat, c, parent=None, segments=12):
    a,b = Vector(a),Vector(b)
    axis = (b-a).normalized()
    ref = Vector((0,0,1)) if abs(axis.z)<0.95 else Vector((0,1,0))
    u = axis.cross(ref).normalized()
    v = axis.cross(u).normalized()
    vs = [tuple(p + radius*(math.cos(t*math.tau/segments)*u + math.sin(t*math.tau/segments)*v))
          for p in (a,b) for t in range(segments)]
    fs = [(i,(i+1)%segments,(i+1)%segments+segments,i+segments) for i in range(segments)]
    fs += [tuple(reversed(range(segments))),tuple(range(segments,segments*2))]
    o = mesh(name,vs,fs,mat,c,parent)
    for p in o.data.polygons: p.use_smooth = len(p.vertices)==4
    return o

def graphic_material(name, filename, alpha=False):
    m = material(name,(1,1,1),rough=0.65)
    p = next(n for n in m.node_tree.nodes if n.type=='BSDF_PRINCIPLED')
    t = m.node_tree.nodes.new('ShaderNodeTexImage')
    t.image = bpy.data.images.load(os.path.join(BASE,'assets','textures',filename),check_existing=True)
    m.node_tree.links.new(t.outputs[0],p.inputs[0])
    if alpha: m.node_tree.links.new(t.outputs[1],p.inputs[4])
    return m

def face(name, x,y,z,w,h,mat,c,parent):
    o = mesh(name,[(x-w/2,y,z),(x+w/2,y,z),(x+w/2,y,z+h),(x-w/2,y,z+h)],[(0,1,2,3)],mat,c,parent)
    uv = o.data.uv_layers.new(name='UVMap')
    for i,coord in enumerate([(0,0),(1,0),(1,1),(0,1)]): uv.data[i].uv = coord
    return o

def desk(c,r,prefix,width=1.65,depth=0.75,mat=None):
    box(prefix+'_Desktop',(0,0,0.72),(width,depth,0.04),mat or M['wood'],c,r,0.012)
    for x in (-width/2+0.09,width/2-0.09):
        for y in (-depth/2+0.08,depth/2-0.08):
            box(prefix+'_Leg',(x,y,0.35),(0.045,0.045,0.70),M['dark'],c,r)
            box(prefix+'_Foot',(x,y,0.008),(0.055,0.055,0.016),M['rubber'],c,r,0.003)
        box(prefix+'_SideRail',(x,0,0.65),(0.035,depth-0.12,0.05),M['dark'],c,r)
    box(prefix+'_RearRail',(0,depth/2-0.08,0.65),(width-0.14,0.035,0.05),M['dark'],c,r)

def monitor(c,r,prefix,x,width,height):
    base_z=0.748
    box(prefix+'_StandBase',(x,0.17,base_z+0.008),(0.24,0.19,0.016),M['dark'],c,r)
    box(prefix+'_StandStem',(x,0.21,0.91),(0.046,0.038,0.31),M['dark'],c,r)
    z=1.14
    box(prefix+'_Housing',(x,0.18,z),(width+0.022,0.035,height+0.024),M['black'],c,r,0.008)
    face(prefix+'_Screen',x,0.161,z-height/2,width,height,M['screen'],c,r)
    box(prefix+'_PowerLED',(x+width/2-0.025,0.157,z-height/2-0.006),(0.003,0.001,0.002),M['paper'],c,r,0)

personal=collection('Station_Personal')
pr=root(personal,'Personal_Root',(-2,0,0))
desk(personal,pr,'Personal',1.75)
monitor(personal,pr,'Personal_Ultrawide',0.08,0.82,0.351)
box('MacBook_Base',(-0.42,-0.17,0.756),(0.355,0.247,0.016),M['silver'],personal,pr,0.008)
box('MacBook_KeyboardWell',(-0.42,-0.13,0.765),(0.315,0.105,0.002),M['keys'],personal,pr,0.003)
for row in range(5):
    for col in range(14):
        box('MacBook_Key_%02d_%02d'%(row,col),(-0.566+col*0.0224,-0.173+row*0.020,0.767),
            (0.018,0.016,0.003),M['black'],personal,pr,0.0015)
box('MacBook_Spacebar',(-0.42,-0.186,0.769),(0.115,0.009,0.002),M['black'],personal,pr,0.001)
box('MacBook_Trackpad',(-0.42,-0.245,0.765),(0.145,0.070,0.001),M['silver'],personal,pr,0.003)
for x in (-0.59,-0.25):
    box('MacBook_SpeakerGrille',(x,-0.13,0.766),(0.008,0.093,0.001),M['dark'],personal,pr,0.001)
hinge=root(personal,'MacBook_DisplayHinge',(0,0,0))
hinge.parent=pr
hinge.location=(-0.42,-0.049,0.765)
hinge.rotation_euler.x=math.radians(-12)
box('MacBook_DisplayHousing',(0,0,0.115),(0.355,0.007,0.23),M['silver'],personal,hinge,0.006)
box('MacBook_DisplayBezel',(0,-0.004,0.116),(0.345,0.001,0.218),M['black'],personal,hinge,0.002)
face('Personal_MacBook_Screen',0,-0.005,0.016,0.332,0.202,M['screen'],personal,hinge)
box('MacBook_CameraNotch',(0,-0.0055,0.214),(0.027,0.001,0.008),M['black'],personal,hinge,0.001)
print('PERSONAL station created:',len(personal.objects),'objects')

ultra=collection('Station_UltraMaritime')
ur=root(ultra,'UltraMaritime_Root',(1,0,0))
desk(ultra,ur,'Ultra',1.8,mat=M['grey'])
monitor(ultra,ur,'Ultra_Monitor_Left',-0.325,0.598,0.336)
monitor(ultra,ur,'Ultra_Monitor_Right',0.325,0.598,0.336)
box('Ultra_LogoPlaque',(-0.61,-0.22,0.84),(0.18,0.025,0.20),M['paper'],ultra,ur,0.004)
logo=graphic_material('Ultra Maritime | official logo','ultra-maritime-logo.png',True)
face('Ultra_OfficialLogo',-0.61,-0.233,0.75,0.175,0.175,logo,ultra,ur)
print('ULTRA station created:',len(ultra.objects),'objects')

hack=collection('Station_HackAtlantic')
hr=root(hack,'HackAtlantic_Root',(-2,3.5,0))
desk(hack,hr,'HackAtlantic',2.7,0.70,M['grey'])
large=graphic_material('Hack Atlantic | standing artwork','hack-atlantic-standing.png')
small=graphic_material('Hack Atlantic | tabletop artwork','hack-atlantic-tabletop.png')
def banner(prefix,x,y,z,h,mat):
    img=next(n.image for n in mat.node_tree.nodes if n.type=='TEX_IMAGE')
    w=h*img.size[0]/img.size[1]
    box(prefix+'_Backing',(x,y,z+h/2),(w,0.014,h),M['black'],hack,hr,0.002)
    face(prefix,x,y-0.008,z,w,h,mat,hack,hr)
    box(prefix+'_TopRail',(x,y,z+h+0.005),(w+0.018,0.018,0.012),M['rim'],hack,hr,0.002)
    box(prefix+'_Base',(x,y,z-0.014),(w+0.025,0.13,0.028),M['rim'],hack,hr,0.005)
    tube(prefix+'_Support',(x,y+0.025,z),(x,y+0.025,z+h),0.007,M['steel'],hack,hr)
banner('HackAtlantic_Banner_Large',-1.88,0.12,0.04,1.94,large)
banner('HackAtlantic_Banner_Table_Left',-0.63,0.16,0.77,0.32,small)
banner('HackAtlantic_Banner_Table_Right',0.78,0.16,0.77,0.32,small)
print('HACK ATLANTIC station created:',len(hack.objects),'objects')

preview=collection('Preview_Rig')
box('Preview_Ground',(0,1.9,-0.045),(12,10,0.08),M['floor'],preview,bevel=0)
for name,x,y in [('Personal',-2,0),('Ultra',1,0),('HackAtlantic',-2,3.5),('FSAE',2,3.5)]:
    d=bpy.data.lights.new(name+'_WarmKey','AREA')
    d.energy=260 if name!='FSAE' else 450
    d.color=(1.0,0.72,0.43)
    d.shape='DISK'
    d.size=2.4
    o=bpy.data.objects.new(name+'_WarmKey',d)
    preview.objects.link(o)
    o.location=(x,y-0.5,3.1)
    o.rotation_euler=(Vector((x,y,0.6))-o.location).to_track_quat('-Z','Y').to_euler()
d=bpy.data.lights.new('Warm_Fill','AREA')
d.energy=400; d.color=(1,0.84,0.68); d.size=5
o=bpy.data.objects.new('Warm_Fill',d); preview.objects.link(o)
o.location=(0,-4,4)
o.rotation_euler=(Vector((0,2,0.5))-o.location).to_track_quat('-Z','Y').to_euler()
camdata=bpy.data.cameras.new('Asset_Review_Camera')
cam=bpy.data.objects.new('Asset_Review_Camera',camdata)
preview.objects.link(cam)
cam.location=(8,-10,8)
cam.rotation_euler=(Vector((-0.3,1.7,0.7))-cam.location).to_track_quat('-Z','Y').to_euler()
camdata.lens=48
scene.camera=cam
try: scene.render.engine='CYCLES'
except TypeError: pass
if hasattr(scene,'cycles'): scene.cycles.samples=24
scene.render.resolution_x=1400; scene.render.resolution_y=1000; scene.render.resolution_percentage=100
for area in bpy.context.screen.areas:
    if area.type=='VIEW_3D':
        area.spaces.active.region_3d.view_distance=11
        area.spaces.active.region_3d.view_location=Vector((-0.2,1.5,0.75))
        area.spaces.active.region_3d.view_rotation=cam.rotation_euler.to_quaternion()
        area.spaces.active.shading.type='MATERIAL'
print('Three desk stations ready in Portfolio Elements; original scene preserved.')
