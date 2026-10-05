"""Render the saved delivery in a separate Blender process, then encode preview."""
import bpy, json, time
from pathlib import Path
ROOT=Path('/Users/daxmanuel/Documents/ChatGPT/portfolio-site-blender')
OUT=ROOT/'blender/previews/completion/journey-frames'
OUT.mkdir(parents=True,exist_ok=True)
sc=bpy.data.scenes['Completion — Portfolio Journey']
bpy.context.window.scene=sc
sc.render.resolution_x=720;sc.render.resolution_y=480;sc.render.resolution_percentage=100
sc.cycles.samples=12;sc.cycles.use_denoising=True
sc.render.image_settings.file_format=next(x.identifier for x in sc.render.image_settings.bl_rna.properties['file_format'].enum_items if x.identifier=='PNG')
files=[];start=time.time()
for index,frame in enumerate(range(1,722,3)):
    sc.frame_set(frame);path=OUT/f'{index:04d}.png';files.append(path)
    sc.render.filepath=str(path)
    if not path.exists():bpy.ops.render.render(write_still=True)
    if index%10==0:
        (OUT.parent/'preview-progress.json').write_text(json.dumps({'done':index+1,'total':241,'elapsed_seconds':time.time()-start}))
seq=bpy.data.scenes.new('Journey preview encode');bpy.context.window.scene=seq
seq.render.resolution_x=720;seq.render.resolution_y=480;seq.render.resolution_percentage=100;seq.render.fps=10
editor=seq.sequence_editor_create()
strip=editor.strips.new_image('Journey',str(files[0]),channel=1,frame_start=1)
for path in files[1:]:strip.elements.append(path.name)
seq.frame_start=1;seq.frame_end=len(files)
seq.render.image_settings.media_type=next(x.identifier for x in seq.render.image_settings.bl_rna.properties['media_type'].enum_items if x.identifier=='VIDEO')
seq.render.image_settings.file_format=next(x.identifier for x in seq.render.image_settings.bl_rna.properties['file_format'].enum_items if x.identifier=='FFMPEG')
for field,value in [('format','MPEG4'),('codec','H264'),('constant_rate_factor','HIGH')]:
    assert value in {x.identifier for x in seq.render.ffmpeg.bl_rna.properties[field].enum_items};setattr(seq.render.ffmpeg,field,value)
seq.render.filepath=str(OUT.parent/'portfolio-journey.mp4')
# Input frames are already display-referred PNGs.
# OCIO enums are dynamic and empty in RNA; these identifiers were verified live.
seq.view_settings.view_transform='Standard'
seq.view_settings.look='None'
bpy.ops.render.render(animation=True)
(OUT.parent/'preview-progress.json').write_text(json.dumps({'done':241,'total':241,'encoded':seq.render.filepath,'elapsed_seconds':time.time()-start}))
print('JOURNEY_PREVIEW_COMPLETE',flush=True)
