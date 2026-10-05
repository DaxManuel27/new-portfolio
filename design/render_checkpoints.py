import bpy, os, math, json
from mathutils import Vector
from bpy_extras.object_utils import world_to_camera_view
ROOT='/Users/daxmanuel/Documents/ChatGPT/portfolio-site-blender'
OUT=ROOT+'/design/figma-assets'
bpy.ops.wm.open_mainfile(filepath=ROOT+'/blender/portfolio-elements-with-macbook.blend')
original=bpy.context.scene
results={}
def shot(name, source, objects, opening=None, direction=(1,-2,1.1), margin=1.18):
    sc=bpy.data.scenes.new('FIGMA_'+name)
    bpy.context.window.scene=sc
    copies={}
    for src in objects:
        o=src.copy();o.data=src.data.copy() if src.data else None;o.animation_data_clear();sc.collection.objects.link(o);copies[src]=o
    for src,o in copies.items():
        o.parent=copies.get(src.parent);o.matrix_parent_inverse=src.matrix_parent_inverse.copy()
    if opening is not None:
        for src,o in copies.items():
            if src.name=='MacBook_LidPivot':o.rotation_euler.x=math.radians(110-opening)
    screen=None
    for src,o in copies.items():
        if src.name=='MacBook_Screen':
            screen=o
            m=bpy.data.materials.new('FIGMA_blank_display');m.use_nodes=True
            shader=next(n for n in m.node_tree.nodes if n.type=='BSDF_PRINCIPLED');shader.inputs['Base Color'].default_value=(.012,.028,.024,1);shader.inputs['Roughness'].default_value=.7
            o.data.materials.clear();o.data.materials.append(m)
    bpy.context.view_layer.update()
    pts=[o.matrix_world@v.co for o in sc.objects if o.type=='MESH' for v in o.data.vertices]
    low=Vector([min(p[i] for p in pts) for i in range(3)]);hi=Vector([max(p[i] for p in pts) for i in range(3)]);center=(low+hi)/2;size=(hi-low).length
    cam_data=bpy.data.cameras.new('FIGMA_cam');cam_data.type='ORTHO'
    cam=bpy.data.objects.new('FIGMA_cam',cam_data);sc.collection.objects.link(cam);sc.camera=cam
    cam.location=center+Vector(direction).normalized()*size*3;cam.rotation_euler=(center-cam.location).to_track_quat('-Z','Y').to_euler()
    bpy.context.view_layer.update();inv=cam.matrix_world.inverted();pp=[inv@p for p in pts];span=max(max(p.x for p in pp)-min(p.x for p in pp),max(p.y for p in pp)-min(p.y for p in pp));cam_data.ortho_scale=span*margin
    for label,d,power in [('key',(-1,-2,3),700),('rim',(2,1,2),950),('fill',(0,-3,1),300)]:
        data=bpy.data.lights.new('FIGMA_'+label,'AREA');data.energy=power*size*size;data.color={'key':(1,.68,.37),'rim':(1,.83,.6),'fill':(.62,.7,.82)}[label];data.shape='DISK';data.size=size*2
        l=bpy.data.objects.new('FIGMA_'+label,data);sc.collection.objects.link(l);l.location=center+Vector(d)*size;l.rotation_euler=(center-l.location).to_track_quat('-Z','Y').to_euler()
    sc.world=bpy.data.worlds.new('FIGMA_world');sc.world.use_nodes=True
    bg=next(n for n in sc.world.node_tree.nodes if n.type=='BACKGROUND');bg.inputs[0].default_value=(.35,.4,.38,1);bg.inputs[1].default_value=.6
    sc.render.engine='CYCLES';sc.cycles.samples=20;sc.cycles.use_denoising=True
    sc.render.resolution_x=1000;sc.render.resolution_y=1000;sc.render.resolution_percentage=100
    sc.render.film_transparent=True;sc.render.image_settings.file_format='PNG';sc.render.image_settings.color_mode='RGBA';sc.render.filepath=OUT+'/'+name+'.png'
    sc.view_settings.view_transform='AgX'
    bpy.ops.render.render(write_still=True)
    if screen:
        vv=[world_to_camera_view(sc,cam,screen.matrix_world@v.co) for v in screen.data.vertices]
        results[name]={'screen_bounds':[min(v.x for v in vv)*1000,(1-max(v.y for v in vv))*1000,max(v.x for v in vv)*1000,(1-min(v.y for v in vv))*1000]}
    else:results[name]={}
    print('CHECKPOINT_RENDER',name,results[name],flush=True)
hero=list(bpy.data.collections['COL_MacBook_Export'].objects)
shot('macbook-open',None,hero,108,(0,-1,.364),1.13)
shot('macbook-closed',None,hero,0,(1,-1.6,1.55),1.16)
for name,col in [('hack-atlantic','Station_HackAtlantic'),('formula-sae','Station_FSAE'),('ultra-maritime','Station_UltraMaritime'),('personal-desk','Station_Personal')]:
    objs=[o for o in bpy.data.collections[col].objects if not o.name.startswith('Personal_M5_') and o.name!='Personal_MacBook_Screen']
    shot(name,None,objs,direction=(1,-2,1.0),margin=1.13)
with open(OUT+'/render-metadata.json','w') as f:json.dump(results,f,indent=2)
