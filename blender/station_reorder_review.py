"""Author deterministic review cameras/visibility and render 25 storyboard keyframes."""
import bpy,json,math
from pathlib import Path
from mathutils import Vector,Quaternion,Matrix
ROOT=Path('/Users/daxmanuel/Documents/ChatGPT/portfolio-site-blender');OUT=ROOT/'exports/station-reorder';layout=json.loads((OUT/'layout.json').read_text());C=Matrix.Rotation(math.pi/2,4,'X')
def ease(x):
 t=max(0,min(1,x));return t*t*(3-2*t)
def mix(a,b,t):
 qa=Quaternion((a['quaternion'][3],*a['quaternion'][:3]));qb=Quaternion((b['quaternion'][3],*b['quaternion'][:3]));q=qa.slerp(qb,t)
 return {'position':list(Vector(a['position']).lerp(Vector(b['position']),t)),'quaternion':[q.x,q.y,q.z,q.w],'width':a['width']*(1-t)+b['width']*t}
def zoom(a,f,t):
 e={'position':list(Vector(f['center'])+Vector((0,0,2.56))),'quaternion':[0,0,0,1],'width':min(f['width'],f['height']*1.5)*.94}
 p=mix(a,e,ease(t));p['width']=math.exp(math.log(a['width'])*(1-ease(t))+math.log(e['width'])*ease(t));return p
def author():
 s=bpy.data.scenes['Completion — Portfolio Journey'];bpy.context.window.scene=s;cam=s.camera
 ws=[o for o in s.objects if o.name.startswith('Review_Reorder_Ultra') or o.name in ['Review_Screen_Workstation_UM','Review_Screen_Workstation_FSAE']]
 car=[o for o in s.objects if o.name.startswith('Review_Reorder_Formula') or o.name.startswith('Review_Reorder_FSAE')]
 ultra=[o for o in s.objects if o.name.startswith('Review_Reorder_Projects') or o.name=='Review_Screen_Ultrawide_Projects']
 root=bpy.data.objects['Journey_TravelFeet'];hero=[root,*root.children_recursive]
 hack=list(bpy.data.objects['Journey_Station_1'].children_recursive)
 allobs=set(ws+car+ultra+hero+hack)
 for o in s.objects:
  if o.type=='MESH' and o not in allobs:o.animation_data_clear();o.hide_render=True;o.hide_viewport=True
 for o in ws+car+ultra+hack:
  o.animation_data_clear();o.hide_viewport=False
  if 'SM_M5' in o.name or 'MacBook' in o.name:o.hide_viewport=True
 for f in range(122,722):
  s.frame_set(f)
  if f<=241:pose=None;groups=[hack] if f<169 else [ws] if f>193 else []
  elif f<=271:pose=mix(layout['workstation']['wide'],layout['workstation']['close'],ease((f-241)/30));groups=[ws]
  elif f<=331:pose=mix(layout['workstation']['close'],layout['workstation']['monitorClose'],ease((f-271)/60));groups=[ws]
  elif f<=391:
   p=(f-331)/60;pose=zoom(layout['workstation']['monitorClose'],layout['workstation']['screens']['fsae'],min(1,p/.8));groups=[ws]
   if p>=.9:pose=layout['car']['close'];groups=[car]
  elif f<=421:pose=layout['car']['close'];groups=[car]
  elif f<=451:pose=mix(layout['car']['close'],layout['car']['wide'],ease((f-421)/30));groups=[car]
  elif f<=511:pose=mix(layout['car']['wide'],layout['ultrawide']['wide'],ease((f-451)/60));groups=[car,ultra]
  elif f<=551:pose=mix(layout['ultrawide']['wide'],layout['ultrawide']['close'],ease((f-511)/40));groups=[ultra]
  else:pose=zoom(layout['ultrawide']['close'],layout['ultrawide']['screen'],min(1,(f-551)/60));groups=[ultra]
  vis=set(o for g in groups for o in g)
  for o in ws+car+ultra+hack:
   o.hide_render=o not in vis or o.hide_viewport or 'Desk_Station' in o.name or ('_Screen' in o.name and not o.name.startswith('Review_Screen'))
   o.keyframe_insert(data_path='hide_render',frame=f)
  for o in hero:o.hide_render=f>=332;o.keyframe_insert(data_path='hide_render',frame=f)
  if pose:
   cam.location=C@Vector(pose['position']);q=Quaternion((pose['quaternion'][3],*pose['quaternion'][:3]));cam.rotation_euler=(C.to_quaternion()@q).to_euler();cam.data.ortho_scale=pose['width'];cam.keyframe_insert(data_path='location',frame=f);cam.keyframe_insert(data_path='rotation_euler',frame=f);cam.data.keyframe_insert(data_path='ortho_scale',frame=f)
 s['station_reorder_note']='MacBook hidden from FSAE zoom. Review textures represent browser live portals; authoritative responsive screen projection lives in the website.'
 s.frame_set(241);bpy.ops.wm.save_as_mainfile(filepath=str(ROOT/'blender/portfolio-station-reorder.blend'))
 print('Authored review cameras and visibility through frame 721')
def render_checks():
 s=bpy.data.scenes['Completion — Portfolio Journey'];bpy.context.window.scene=s
 s.render.engine='BLENDER_WORKBENCH';s.render.resolution_x=960;s.render.resolution_y=640;s.render.resolution_percentage=100
 s.render.image_settings.file_format='PNG';s.display.shading.light='STUDIO';s.display.shading.color_type='MATERIAL';s.render.film_transparent=False
 out=OUT/'keyframes';out.mkdir(exist_ok=True)
 rows=[(121,241),(271,331),(331,391),(421,551),(551,611)];report=[]
 for r,(a,b) in enumerate(rows):
  for p in [.1,.3,.5,.7,.9]:
   f=round(a+(b-a)*p);s.frame_set(f);s.render.filepath=str(out/f'row-{r+1}-{round(p*100)}.png');bpy.ops.render.render(write_still=True)
   hero=[o for o in s.objects if o.name.startswith('Journey_') and ('MacBook' in o.name or 'SM_M5' in o.name)]
   hidden=all(o.hide_render for o in hero)
   assert f<332 or hidden,(f,'hero visible')
   report.append({'row':r+1,'percent':round(p*100),'frame':f,'heroHidden':hidden,'camera':list(s.camera.location),'width':s.camera.data.ortho_scale})
 (OUT/'blender-keyframe-report.json').write_text(json.dumps(report,indent=2));print('25 Workbench keyframe renders complete')
if __name__=='__main__':render_checks()
