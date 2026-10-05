"""Build a representative Formula SAE car in the existing asset scene."""
import bpy, math, os
from mathutils import Vector
BASE='/Users/daxmanuel/Documents/ChatGPT/portfolio-site-blender'
scene=bpy.data.scenes['Portfolio Elements']
bpy.context.window.scene=scene
if bpy.data.collections.get('Station_FSAE'):
    raise RuntimeError('FSAE asset already exists; preserve it.')
source=open(os.path.join(BASE,'blender','build_elements.py')).read()
exec(source[source.index('def collection('):source.index('personal=collection(')])
M={
 'rubber':bpy.data.materials['FSAE | slick rubber'],
 'rim':bpy.data.materials['FSAE | satin alloy'],
 'red':bpy.data.materials['FSAE | oxblood bodywork'],
 'carbon':bpy.data.materials['FSAE | dark composite'],
 'steel':bpy.data.materials['FSAE | chassis steel'],
 'belt':bpy.data.materials['FSAE | harness'],
 'black':bpy.data.materials['Device | graphite'],
}
c=collection('Station_FSAE')
r=root(c,'FSAE_Root',(2,3.5,0))
r['asset_description']='Original representative Formula SAE car; not a replica of the UNB vehicle.'
r['author']='Dax Manuel portfolio project / Blender procedural construction'

def wheel(name,x,y):
    z=0.235
    # Closed revolved tire cross-section around the axle, including a hollow hub.
    profile=[(-0.1,0.137),(-0.108,0.18),(-0.093,0.222),(-0.075,0.235),
             (0.075,0.235),(0.093,0.222),(0.108,0.18),(0.1,0.137)]
    n=48
    vs=[(x+a,y+rad*math.cos(i*math.tau/n),z+rad*math.sin(i*math.tau/n))
        for a,rad in profile for i in range(n)]
    fs=[(j*n+i,j*n+(i+1)%n,((j+1)%len(profile))*n+(i+1)%n,((j+1)%len(profile))*n+i)
        for j in range(len(profile)) for i in range(n)]
    tire=mesh(name+'_SlickTire',vs,fs,M['rubber'],c,r)
    for p in tire.data.polygons:p.use_smooth=True
    # Alloy rim barrel and five radial spokes visible from the outer side.
    tube(name+'_RimBarrel',(x-0.079,y,z),(x+0.079,y,z),0.139,M['rim'],c,r,48)
    outer=x+(0.094 if x>0 else -0.094)
    tube(name+'_Hub',(outer-0.008,y,z),(outer+0.008,y,z),0.032,M['steel'],c,r,24)
    for i in range(5):
        t=i*math.tau/5
        tube(name+'_Spoke_%d'%i,(outer,y+0.026*math.cos(t),z+0.026*math.sin(t)),
             (outer,y+0.125*math.cos(t+0.15),z+0.125*math.sin(t+0.15)),0.013,M['rim'],c,r)
    for i in range(5):
        t=i*math.tau/5
        tube(name+'_Lug_%d'%i,(outer-0.009,y+0.022*math.cos(t),z+0.022*math.sin(t)),
             (outer+0.012,y+0.022*math.cos(t),z+0.022*math.sin(t)),0.005,M['black'],c,r)

for x in (-0.67,0.67):
    for y in (-0.83,0.79):wheel(('Left' if x<0 else 'Right')+('_Front' if y<0 else '_Rear'),x,y)

# Tapered nose with chamfered cross-sections, front toward negative Y.
def shell(name,sections,mat):
    vs=[]
    for y,w,bottom,top in sections:
        vs.extend([(-w*.72,y,bottom),(w*.72,y,bottom),(w,y,bottom+.035),
                   (w*.86,y,top-.025),(w*.60,y,top),(-w*.60,y,top),
                   (-w*.86,y,top-.025),(-w,y,bottom+.035)])
    fs=[]
    for j in range(len(sections)-1):
        fs.extend([(j*8+i,j*8+(i+1)%8,(j+1)*8+(i+1)%8,(j+1)*8+i) for i in range(8)])
    fs.extend([tuple(reversed(range(8))),tuple(range((len(sections)-1)*8,len(sections)*8))])
    o=mesh(name,vs,fs,mat,c,r)
    b=o.modifiers.new('Body edge highlights','BEVEL');b.width=0.009;b.segments=3
    o.modifiers.new('Body normals','WEIGHTED_NORMAL')
    return o

shell('FSAE_Nose',[(-1.24,.075,.16,.23),(-1.05,.12,.15,.28),(-.75,.205,.15,.38),(-.47,.28,.15,.46)],M['red'])
shell('FSAE_RearBody',[(.46,.30,.14,.46),(.75,.29,.14,.43),(1.03,.21,.14,.35)],M['red'])
box('FSAE_Undertray',(0,0,.14),(.64,1.83,.035),M['carbon'],c,r,0.012)

# Open cockpit with side panels, floor, seat, harness, steering and dash.
for sign in (-1,1):
    shell('FSAE_Sidepod_'+str(sign),[(-.28,.12,.15,.31),(.05,.14,.15,.33),(.56,.12,.15,.36)],M['red']).location.x=sign*.36
    box('FSAE_CockpitSide_'+str(sign),(sign*.285,.0,.32),(.035,.86,.29),M['red'],c,r,0.009)
    tube('FSAE_SideTopRail_'+str(sign),(sign*.27,-.45,.46),(sign*.27,.46,.47),.018,M['steel'],c,r)
    tube('FSAE_SideBottomRail_'+str(sign),(sign*.27,-.45,.18),(sign*.27,.46,.18),.018,M['steel'],c,r)
    for y in (-.45,.0,.46):
        tube('FSAE_ChassisUpright',(sign*.27,y,.18),(sign*.27,y,.46),.014,M['steel'],c,r)
    tube('FSAE_ChassisDiagonal',(sign*.27,-.45,.18),(sign*.27,.0,.46),.014,M['steel'],c,r)
    tube('FSAE_ChassisDiagonal',(sign*.27,.0,.18),(sign*.27,.46,.46),.014,M['steel'],c,r)

box('FSAE_SeatBase',(0,.15,.23),(.39,.42,.085),M['carbon'],c,r,.025)
seat=box('FSAE_SeatBack',(0,.36,.48),(.38,.065,.49),M['carbon'],c,r,.028)
seat.rotation_euler.x=math.radians(-14)
for x in (-.075,.075):
    belt=box('FSAE_ShoulderHarness',(x,.315,.49),(.042,.008,.40),M['belt'],c,r,.003)
    belt.rotation_euler.x=math.radians(-14)
box('FSAE_HarnessBuckle',(0,.08,.30),(.06,.055,.022),M['rim'],c,r,.005)
box('FSAE_Dash',(0,-.31,.46),(.37,.06,.105),M['carbon'],c,r,.012)
box('FSAE_DashDisplay',(0,-.345,.475),(.105,.004,.052),M['black'],c,r,.002)
tube('FSAE_SteeringColumn',(0,-.35,.39),(0,-.13,.47),.013,M['steel'],c,r)
# Steering wheel ring, in XZ plane.
for i in range(24):
    a=i*math.tau/24;b=(i+1)*math.tau/24
    tube('FSAE_SteeringRim',(math.cos(a)*.105,-.13,.47+math.sin(a)*.077),
         (math.cos(b)*.105,-.13,.47+math.sin(b)*.077),.010,M['black'],c,r,8)
for a in (0,math.pi,math.pi*1.5):
    tube('FSAE_SteeringSpoke',(0,-.13,.47),(.1*math.cos(a),-.13,.47+.07*math.sin(a)),.008,M['rim'],c,r)

# Main and front roll hoops; curved corners represented by connected tube segments.
def hoop(name,y,width,top,bottom):
    pts=[(-width,y,bottom),(-width,y,top-.09),(-width+.04,y,top-.03),
         (-width+.09,y,top),(width-.09,y,top),(width-.04,y,top-.03),(width,y,top-.09),(width,y,bottom)]
    for i in range(len(pts)-1):tube(name+'_%d'%i,pts[i],pts[i+1],.022,M['steel'],c,r,16)
hoop('FSAE_MainRollHoop',.48,.29,.96,.18)
hoop('FSAE_FrontHoop',-.37,.25,.54,.18)
for sign in (-1,1):
    tube('FSAE_RollHoopBrace',(sign*.21,.48,.91),(sign*.25,.95,.24),.019,M['steel'],c,r)

# Double wishbones with hub joints and inboard dampers.
for sign in (-1,1):
    for axle in (-.83,.79):
        for z,in_z in [(.19,.19),(.32,.34)]:
            for dy in (-.16,.16):
                tube('FSAE_Wishbone',(sign*.25,axle+dy,in_z),(sign*.57,axle,z),.012,M['steel'],c,r)
        tube('FSAE_Upright',(sign*.57,axle,.17),(sign*.57,axle,.33),.023,M['rim'],c,r)
        tube('FSAE_Pushrod',(sign*.56,axle,.20),(sign*.18,axle+.03,.44),.009,M['steel'],c,r)
        tube('FSAE_Damper',(sign*.16,axle,.27),(sign*.21,axle+.03,.46),.022,M['carbon'],c,r)
        tube('FSAE_Axle',(sign*.27,axle,.235),(sign*.68,axle,.235),.014,M['steel'],c,r)

# Restrained front and rear aero with thin end plates.
for y,z,w,d in [(-1.20,.135,1.30,.27),(1.04,.69,1.13,.24)]:
    foil=box('FSAE_WingMain',(0,y,z),(w,d,.025),M['carbon'],c,r,.010)
    foil.rotation_euler.x=math.radians(-5)
    box('FSAE_WingFlap',(0,y+.10,z+.055),(w-.04,.095,.018),M['carbon'],c,r,.006)
    for sign in (-1,1):
        box('FSAE_WingEndplate',(sign*w/2,y,z+.045),(.018,d+.09,.15),M['red'],c,r,.005)
        if y>0:tube('FSAE_RearWingMount',(sign*.19,.87,.30),(sign*.19,y,.69),.018,M['steel'],c,r)

print('FSAE representative asset created:',len(c.objects),'objects')
print('All four stations complete in scene:',scene.name)
