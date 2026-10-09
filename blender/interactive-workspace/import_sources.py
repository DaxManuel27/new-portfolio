import bpy, json
from pathlib import Path
from mathutils import Vector
ROOT=Path('/Users/daxmanuel/Documents/ChatGPT/portfolio-site-blender')
S=bpy.data.scenes['Interactive Workspace']
bpy.context.window.scene=S
COL=bpy.data.collections['COL_Interactables']
def bounds(obs):
    pts=[o.matrix_world@Vector(c) for o in obs if o.type=='MESH' for c in o.bound_box]
    return [[min(p[i] for p in pts) for i in range(3)],[max(p[i] for p in pts) for i in range(3)]]
def ingest(name,path,keep=None):
    before=set(bpy.data.objects)
    bpy.ops.import_scene.gltf(filepath=str(ROOT/path))
    obs=list(set(bpy.data.objects)-before)
    for o in obs:
        o['source_asset']=path
        o['workspace_asset']=name
        for c in list(o.users_collection): c.objects.unlink(o)
        COL.objects.link(o)
    if keep:
        remove=[o for o in obs if not keep(o)]
        # Preserve evaluated placement while pruning parent structures.
        mats={o:o.matrix_world.copy() for o in obs if o not in remove}
        for o,m in mats.items():o.parent=None;o.matrix_world=m
        for o in remove:bpy.data.objects.remove(o,do_unlink=True)
        obs=list(mats)
    bpy.context.view_layer.update()
    print(name, 'bounds',bounds(obs),'objects',len(obs),'actions',[(o.name,o.animation_data.action.name) for o in obs if o.animation_data and o.animation_data.action])
    return obs
ingest('macbook','exports/macbook-hero.glb')
ingest('car','exports/fsae-car.glb')
ingest('pi','exports/fsae-details/raspberry-pi-5.glb')
ingest('monitor','exports/station-reorder/station-projects.glb',lambda o:'Ultrawide' in o.name)
ingest('phone','exports/completion/rotary-phone.glb')
ingest('pen','exports/completion/pen.glb')
# The amended source printer has the open output slot and real print button.
with bpy.data.libraries.load(str(ROOT/'blender/portfolio-shared-desk.blend'),link=False) as (src,dst):
    dst.objects=[n for n in src.objects if n.startswith('Shared_Resume_Prop_Printer')]
for o in dst.objects:
    if o:
        COL.objects.link(o);o['workspace_asset']='printer';o['source_asset']='blender/portfolio-shared-desk.blend'
bpy.context.view_layer.update()
print('printer','bounds',bounds([o for o in dst.objects if o]),'objects',len(dst.objects))
print('Actions',[(a.name,list(a.frame_range)) for a in bpy.data.actions])
