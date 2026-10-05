"""Measure the processor's metal lid and export the Pi-local website portal frame."""
import bpy,json,math,shutil
from pathlib import Path
from mathutils import Vector,Matrix
ROOT=Path(__file__).resolve().parents[1]
def run():
 s=bpy.data.scenes['FSAE — Raspberry Pi 5'];obj=next(o for o in s.objects if o.type=='MESH')
 # The processor has a 17 mm package at this measured CAD position; its top metal lid
 # is distinct from the taller USB/Ethernet housings and the smaller wireless shield.
 faces=[p for p in obj.data.polygons if p.normal.z>.99 and -.019<p.center.x<0 and -.014<p.center.y<.004 and .0033<p.center.z<.0039 and obj.data.materials[p.material_index].name.startswith('RPI5_Metal')]
 face=max(faces,key=lambda p:p.area);vs=[obj.matrix_world@obj.data.vertices[i].co for i in face.vertices]
 lo=Vector(tuple(min(v[i] for v in vs) for i in range(3)));hi=Vector(tuple(max(v[i] for v in vs) for i in range(3)));center=(lo+hi)/2;center.z=hi.z+.00003
 anchor=bpy.data.objects.get('Pi_ProjectsPortal')
 if not anchor:anchor=bpy.data.objects.new('Pi_ProjectsPortal',None);s.collection.objects.link(anchor)
 anchor.location=center;anchor['width']=hi.x-lo.x;anchor['height']=hi.y-lo.y;anchor['purpose']='Website transition through processor lid'
 C=Matrix.Rotation(-math.pi/2,4,'X')
 data={'center':list(C@center),'normal':[0,1,0],'up':[0,0,-1],'right':[1,0,0],'width':hi.x-lo.x,'height':hi.y-lo.y,'mesh':'Pi_ProjectsPortal'}
 (ROOT/'exports/fsae-details/pi-portal.json').write_text(json.dumps(data,indent=2))
 path=ROOT/'blender/raspberry-pi-5.blend';backup=ROOT/'backups/pi-monitor-transition';backup.mkdir(exist_ok=True)
 if not (backup/path.name).exists():shutil.copy2(path,backup/path.name)
 bpy.data.libraries.write(str(path),{s});print(json.dumps(data))
