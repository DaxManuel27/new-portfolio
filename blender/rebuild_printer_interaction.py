"""Focused, repeatable rebuild of the shared printer and its local paper clip.

Run through Blender MCP with portfolio-shared-desk.blend open. Source coordinates
are metres, Z up. Paper moves along one arclength guide; no final-pose crossfade.
The existing scene cameras, layout metadata and laptop animation are preserved.
"""
import bpy, math, bisect, json
from pathlib import Path
from mathutils import Vector

ROOT = Path(__file__).resolve().parents[1]
PREFIX = 'Shared_Resume_Prop_Printer'
WIDTH, LENGTH, THICKNESS, SEGMENTS = .2159, .2794, .00012, 96

def enum(block, field, value):
    assert value in {e.identifier for e in block.bl_rna.properties[field].enum_items}
    setattr(block, field, value)

def mesh(name, verts, faces, col, material=None, parent=None):
    data = bpy.data.meshes.new(name)
    data.from_pydata(verts, [], faces); data.update()
    obj = bpy.data.objects.new(name, data); col.objects.link(obj); obj.parent = parent
    if material: data.materials.append(material)
    return obj

def box(name, dimensions, position, col, material, parent, bevel=0):
    x,y,z = [v/2 for v in dimensions]
    obj = mesh(name, [(-x,-y,-z),(x,-y,-z),(x,y,-z),(-x,y,-z),(-x,-y,z),(x,-y,z),(x,y,z),(-x,y,z)],
        [(0,3,2,1),(4,5,6,7),(0,1,5,4),(1,2,6,5),(2,3,7,6),(3,0,4,7)], col, material, parent)
    obj.location = position
    if bevel:
        mod = obj.modifiers.new('Manufactured edge', 'BEVEL'); mod.width=bevel; mod.segments=3
        obj.modifiers.new('Face normals', 'WEIGHTED_NORMAL')
    return obj

def ring(name, outer, inner, y, col, material, parent):
    # A real open slot, including inner walls; the former solid plates blocked it.
    verts=[]
    for yy in [y-.0002,y+.0002]:
        for w,h in [outer,inner]:
            verts.extend([(-w/2,yy,.069-h/2),(w/2,yy,.069-h/2),(w/2,yy,.069+h/2),(-w/2,yy,.069+h/2)])
    faces=[]
    for i in range(4):
        j=(i+1)%4
        faces.extend([(i,j,j+4,i+4),(i+8,i+12,j+12,j+8),(i,i+8,j+8,j),(i+4,j+4,j+12,i+12)])
    return mesh(name,verts,faces,col,material,parent)

def smooth(t):
    t=max(0,min(1,t));return t*t*(3-2*t)

def guide():
    # Hidden path folds once INSIDE the shell, instead of extending through its back.
    # Build it backwards from the mouth, then reverse to increasing feed distance.
    inside=[]
    for i in range(1671): inside.append((-.107+i*.0001,.069))
    for i in range(1,568):
        a=math.pi*i/567
        inside.append((.060+.018*math.sin(a),.051+.018*math.cos(a)))
    for i in range(1,1001): inside.append((.060-i*.0001,.033))
    points=list(reversed(inside))
    mouth=len(points)-1
    for i in range(1,4001):
        d=i*.0001
        if d <= .048: z=.069-.012*smooth(d/.048)
        elif d <= .055: z=.057
        else: z=.057-.056*smooth((d-.055)/.105)
        points.append((-.107-d,z))
    arcs=[0.]
    for a,b in zip(points,points[1:]): arcs.append(arcs[-1]+math.dist(a,b))
    origin=arcs[mouth];arcs=[s-origin for s in arcs]
    def sample(distance):
        i=max(0,min(len(arcs)-2,bisect.bisect_right(arcs,distance)-1))
        f=(distance-arcs[i])/(arcs[i+1]-arcs[i])
        a,b=points[i:i+2]
        return (a[0]+(b[0]-a[0])*f,a[1]+(b[1]-a[1])*f)
    return sample

def travel(t):
    # 0.4 s startup, gentle 0.4 s acceleration/deceleration, steady central feed.
    u=max(0,min(1,(t-.4)/3.6)); ramp=1/9
    if u<ramp: f=(u*u/(2*ramp))/(1-ramp)
    elif u>1-ramp: f=1-((1-u)**2/(2*ramp))/(1-ramp)
    else: f=(u-ramp/2)/(1-ramp)
    return -.004+(LENGTH+.014)*f

def build():
    sc=bpy.data.scenes['Completion — Shared Resume Contact'];bpy.context.window.scene=sc
    printer=bpy.data.objects[PREFIX];col=printer.users_collection[0]
    for suffix in ['PowerButton','PowerRing','PrintButton','PrintButtonLabel','PrintButtonSocket','PaperAnchor','SlotAnchor','OutputSlot','OutputRim']:
        old=bpy.data.objects.get(PREFIX+'.'+suffix)
        if old: bpy.data.objects.remove(old,do_unlink=True)
    for suffix in ['PaperAnchor','SlotAnchor']:
        anchor=bpy.data.objects.new(PREFIX+'.'+suffix,None);col.objects.link(anchor);anchor.parent=printer
        if suffix=='SlotAnchor':anchor.location=(0,-.107,.069)
    dark=bpy.data.materials['M_Printer_SlotFeet']; body=bpy.data.materials['M_Printer_Body']
    ring(PREFIX+'.OutputRim',(.228,.0196),(.226,.018),-.10512,col,bpy.data.materials['M_Printer_OutputRim'],printer)
    ring(PREFIX+'.OutputSlot',(.226,.018),(.223,.015),-.1054,col,dark,printer)
    box(PREFIX+'.PrintButtonSocket',(.063,.033,.001),(-.0815,-.073,.1257),col,dark,printer,.00045)
    key=box(PREFIX+'.PrintButton',(.060,.030,.0025),(-.0815,-.073,.1266),col,body,printer,.001)
    labelmat=bpy.data.materials.get('MAT_Printer_PrintLabel') or bpy.data.materials.new('MAT_Printer_PrintLabel')
    labelmat.use_nodes=True
    nodes=labelmat.node_tree.nodes;links=labelmat.node_tree.links
    bsdf=next(n for n in nodes if n.type=='BSDF_PRINCIPLED');bsdf.inputs['Roughness'].default_value=.55
    tex=next((n for n in nodes if n.type=='TEX_IMAGE'),None) or nodes.new('ShaderNodeTexImage')
    tex.image=bpy.data.images.load(str(ROOT/'assets/textures/figma-completion/printer-button.png'),check_existing=True);tex.image.pack()
    links.new(tex.outputs['Color'],bsdf.inputs['Base Color']);links.new(tex.outputs['Alpha'],bsdf.inputs['Alpha'])
    enum(labelmat,'surface_render_method','DITHERED')
    label=mesh(PREFIX+'.PrintButtonLabel',[(-.026,-.012,.00128),(.026,-.012,.00128),(.026,.012,.00128),(-.026,.012,.00128)],[(0,1,2,3)],col,labelmat,key)
    uv=label.data.uv_layers.new(name='LabelUV')
    for li,co in enumerate([(0,0),(1,0),(1,1),(0,1)]):uv.data[li].uv=co
    led=bpy.data.objects[PREFIX+'.StatusLED']
    led.data=led.data.copy();led.data.materials[0]=led.data.materials[0].copy();led.data.materials[0].name='MAT_Printer_PrintStatusLED'
    # Dedicated paper scene has no parent/world offsets; browser attaches to PaperAnchor.
    paperScene=bpy.data.scenes.get('Printer Feed Export') or bpy.data.scenes.new('Printer Feed Export')
    for old in list(paperScene.objects): bpy.data.objects.remove(old,do_unlink=True)
    paperScene.render.fps=30;paperScene.frame_start=1;paperScene.frame_end=121
    pcol=bpy.data.collections.new('COL_Printer_PaperFeed');paperScene.collection.children.link(pcol)
    sample=guide(); rows=SEGMENTS+1
    def coordinates(t):
        out=[]
        for layer in [1,-1]:
            for j in range(rows):
                s=travel(t)-j*LENGTH/SEGMENTS;y,z=sample(s)
                ya,za=sample(s-.00001);yb,zb=sample(s+.00001)
                dy,dz=yb-ya,zb-za;norm=math.hypot(dy,dz)
                ny,nz=dz/norm,-dy/norm
                for x in [-WIDTH/2,WIDTH/2]:out.append((x,y+layer*ny*THICKNESS/2,z+layer*nz*THICKNESS/2))
        return out
    off=rows*2;faces=[]
    for j in range(SEGMENTS):
        i=j*2;faces.extend([(i,i+1,i+3,i+2),(off+i+2,off+i+3,off+i+1,off+i),(i,i+2,off+i+2,off+i),(i+1,off+i+1,off+i+3,i+3)])
    faces.extend([(0,off,off+1,1),(off-2,off-1,2*off-1,2*off-2)])
    mat=bpy.data.objects['Resume_PaperFeed_Sheet'].data.materials[0]
    paper=mesh('Resume_PaperFeed_Sheet_Local',coordinates(0),faces,pcol,mat)
    uv=paper.data.uv_layers.new(name='ArtworkUV')
    for poly in paper.data.polygons:
        for li in poly.loop_indices:
            idx=paper.data.loops[li].vertex_index%off
            uv.data[li].uv=(idx%2,(idx//2)/SEGMENTS)
        poly.use_smooth=True
    paper.shape_key_add(name='Basis')
    # One 30 fps target per frame. Linear interpolation approximates a smooth,
    # distance-preserving guide instead of interpolating seven unrelated silhouettes.
    for frame in range(1,122):
        k=paper.shape_key_add(name=f'Feed_{frame:03}')
        for v,co in zip(k.data,coordinates((frame-1)/30)):v.co=co
        for f,w in [(max(1,frame-1),0),(frame,1),(min(121,frame+1),0)]:
            if f==frame and w==0:continue
            k.value=w;k.keyframe_insert(data_path='value',frame=f)
    action=paper.data.shape_keys.animation_data.action;action.name='AN_Printer_Feed'
    for slot in action.slots:
        for layer in action.layers:
            for strip in layer.strips:
                bag=strip.channelbag(slot)
                if bag:
                    for fc in bag.fcurves:
                        for kp in fc.keyframe_points:kp.interpolation='LINEAR'
    paper['paper_width_m']=WIDTH;paper['paper_length_m']=LENGTH
    paper['motion']='Printer-local arclength path; 0.4s startup, tray clearance, rim clearance, smooth desk bend.'
    # Preserve a named NLA strip for Blender review/export handoff.
    track=paper.data.shape_keys.animation_data.nla_tracks.new();track.name='AN_Printer_Feed'
    track.strips.new(action.name,1,action);track.mute=True
    bpy.context.window.scene=paperScene;paperScene.frame_set(1)
    bpy.ops.object.select_all(action='DESELECT');paper.select_set(True);bpy.context.view_layer.objects.active=paper
    props=bpy.ops.export_scene.gltf.get_rna_type().properties
    mode='ACTIVE_ACTIONS';assert mode in {x.identifier for x in props['export_animation_mode'].enum_items}
    bpy.ops.export_scene.gltf(filepath=str(ROOT/'exports/completion/printer-paper-feed.glb'),export_format='GLB',use_selection=True,use_active_scene=True,export_animations=True,export_animation_mode=mode,export_frame_range=True,export_force_sampling=True,export_anim_slide_to_zero=True,export_extras=True,export_yup=True)
    bpy.context.window.scene=sc
    bpy.ops.object.select_all(action='DESELECT')
    for obj in sc.objects:
        if obj.type not in ('LIGHT','CAMERA') and 'Resume_Page' not in obj.name and 'PaperFeed_Review' not in obj.name and 'Cutter' not in obj.name:
            obj.hide_set(False);obj.select_set(True)
    bpy.ops.export_scene.gltf(filepath=str(ROOT/'exports/shared-desk/station-shared.glb'),export_format='GLB',use_selection=True,use_active_scene=True,export_apply=True,export_animations=False,export_extras=True,export_yup=True,export_cameras=False,export_lights=False)
    # Review the new deformed sheet in the real shared scene without exporting a duplicate.
    for obj in list(sc.objects):
        if obj.name=='Printer_PaperFeed_Review':bpy.data.objects.remove(obj,do_unlink=True)
    review=paper.copy();review.name='Printer_PaperFeed_Review';col.objects.link(review);review.parent=printer
    review.hide_render=True;review.hide_viewport=True
    for obj in sc.objects:
        if 'Resume_Page' in obj.name:obj.hide_render=True;obj.hide_viewport=True
    sc.camera=bpy.data.objects['CAM_Shared_Resume_Birdseye'];sc.camera.location=(.36,0,2);sc.camera.data.ortho_scale=.72
    bpy.context.view_layer.update()
    bpy.ops.wm.save_as_mainfile(filepath=str(ROOT/'blender/portfolio-shared-desk.blend'))
    print(json.dumps({'paper_vertices':len(paper.data.vertices),'paper_triangles':sum(len(p.vertices)-2 for p in paper.data.polygons),'targets':121,'key_dimensions':list(key.dimensions),'anchor':PREFIX+'.PaperAnchor'}))

if __name__=='__main__':build()
