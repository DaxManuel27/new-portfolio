import bpy, math
from mathutils import Vector
scene=bpy.data.scenes['Portfolio Elements']
bpy.context.window.scene=scene
radius=1.5
segments=48

def curve_y(x):
    return math.sqrt(radius*radius-x*x)-radius

housing=bpy.data.objects['Personal_Ultrawide_Housing']
old=housing.data
old.name='Ultrawide_FlatHousing_Backup'
old.use_fake_user=True
w,h,depth=.842,.375,.035
vs=[]
for y in (-depth/2,depth/2):
    for z in (-h/2,h/2):
        for i in range(segments+1):
            x=-w/2+w*i/segments
            vs.append((x,y+curve_y(x),z))
n=segments+1
fs=[]
for i in range(segments):
    fs.extend([(i,i+1,n+i+1,n+i),
               (2*n+i,3*n+i,3*n+i+1,2*n+i+1),
               (i,2*n+i,2*n+i+1,i+1),
               (n+i,n+i+1,3*n+i+1,3*n+i)])
fs.extend([(0,n,3*n,2*n),(segments,2*n+segments,3*n+segments,n+segments)])
data=bpy.data.meshes.new('Ultrawide_CurvedHousing_Mesh')
data.from_pydata(vs,[],fs);data.update()
for mat in old.materials:data.materials.append(mat)
housing.data=data
for p in data.polygons:p.use_smooth=len(p.vertices)==4
housing['curvature_radius_m']=radius

screen=bpy.data.objects['Personal_Ultrawide_Screen']
old=screen.data;old.name='Ultrawide_FlatScreen_Backup';old.use_fake_user=True
w,h=.82,.351
vs=[]
for z in (1.14-h/2,1.14+h/2):
    for i in range(n):
        x=-w/2+w*i/segments
        vs.append((.08+x,.161+curve_y(x),z))
fs=[(i,i+1,n+i+1,n+i) for i in range(segments)]
data=bpy.data.meshes.new('Ultrawide_CurvedScreen_Mesh')
data.from_pydata(vs,[],fs);data.update()
for mat in old.materials:data.materials.append(mat)
uv=data.uv_layers.new(name='UVMap')
for p in data.polygons:
    p.use_smooth=True
    for li in p.loop_indices:
        vi=data.loops[li].vertex_index
        uv.data[li].uv=((vi%n)/segments,vi//n)
screen.data=data
screen['curvature_radius_m']=radius
led=bpy.data.objects.get('Personal_Ultrawide_PowerLED')
if led:led.location.y=.157+curve_y(led.location.x-.08)
cam=scene.camera
cam.location=(-.3,-2.4,2.0)
cam.rotation_euler=(Vector((-1.95,.04,1.02))-cam.location).to_track_quat('-Z','Y').to_euler()
for area in bpy.context.screen.areas:
    if area.type=='VIEW_3D':
        sp=area.spaces.active
        sp.region_3d.view_location=Vector((-1.95,.04,1.02))
        sp.region_3d.view_rotation=cam.rotation_euler.to_quaternion()
        sp.region_3d.view_distance=2.5
        sp.overlay.show_overlays=False
print('Ultrawide curved: 1500 mm radius, 48 horizontal segments, matching housing and UV-mapped screen.')
