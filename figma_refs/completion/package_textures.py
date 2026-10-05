from pathlib import Path
import hashlib,json,shutil
from PIL import Image
root=Path(__file__).resolve().parent
project=root.parent.parent
dst=project/'assets/textures/figma-completion';dst.mkdir(parents=True,exist_ok=True)
entries=[
 ('phone-number-plate','112:11116','44:5864',[122,122],'sRGB','opaque','M_Phone_NumberPlate.BaseColor'),
 ('fsae-data-logging','112:11147','40:3463',None,'sRGB','straight alpha with transparent padding','FSAE_Label_DataLogging.BaseColor/Alpha'),
 ('fsae-accelerator-pedal-sensor','112:11150','40:3463',None,'sRGB','straight alpha with transparent padding','FSAE_Label_Accelerator.BaseColor/Alpha'),
 ('notebook-pages','123:13219','44:5818',[296,212],'sRGB','opaque','M_Notebook_Pages.BaseColor'),
 ('resume-page','123:13259','55:7265',[215.9,279.4],'sRGB','opaque','M_Resume_Paper.BaseColor'),
]
for name,node,space,slot in [('albedo','99:11028','sRGB','M_Phone_RedPlastic.BaseColor'),('roughness','99:11030','Non-Color','M_Phone_RedPlastic.Roughness'),('normal','99:11032','Non-Color / OpenGL +Y','M_Phone_RedPlastic.Normal')]:
 shutil.copyfile(project/f'assets/textures/red-phone/{name}.png',root/f'textures/phone-plastic-{name}.png')
 entries.append((f'phone-plastic-{name}',node,'99:11025',[25,25],space,'opaque',slot))
manifest={'version':'1.1','date':'2026-10-01','file_key':'AAoP4nNd3n9QzR9C2Cjarm','review_node':'111:11081','motion_node':'48:5573','assets':[],'notes':[
 'Keep texture RGB unchanged; set color space on Blender image datablock. Material alpha is OPAQUE except FSAE labels.',
 'FSAE physical dimensions depend on camera distance; match 17 px text in a 1440-wide scene. Source label boxes are 330x104 and 570x104 with 34 px text.',
 'Phone UV square spans the 122 mm plate; local +Y maps to image top. Hole radius 42 mm, angles 57+27i degrees, digits 1 through 9 then 0.',
 'No synthesized maps for pen: solid material specifications are on the Figma sheet.',
 'Resume contains existing name/contact/rule only. No experience content was supplied in its source artwork.',
 'Mechanical FSAE anchors and final metric camera fit require verification in Blender.'
]}
validation=[]
for name,node,source,mm,space,alpha,slot in entries:
 p=root/f'textures/{name}.png';im=Image.open(p).convert('RGBA');a=im.getchannel('A');lo,hi=a.getextrema()
 if alpha=='opaque':assert lo==255,(name,lo)
 else:
  assert lo==0 and hi==255,(name,lo,hi)
  assert all(im.getpixel(xy)[3]==0 for xy in [(0,0),(im.width-1,0),(0,im.height-1),(im.width-1,im.height-1)])
 shutil.copyfile(p,dst/p.name)
 item={'name':name,'file':str(p.relative_to(project)),'working_file':str((dst/p.name).relative_to(project)),'file_key':manifest['file_key'],'node_id':node,'source_node_id':source,'dimensions_px':list(im.size),'physical_dimensions_mm':mm,'color_space':space,'alpha_policy':alpha,'material_slot':slot,'version':'1.1','date':'2026-10-01','sha256':hashlib.sha256(p.read_bytes()).hexdigest()}
 svg=p.with_suffix('.svg')
 if svg.exists():item['svg_master']={'file':str(svg.relative_to(project)),'sha256':hashlib.sha256(svg.read_bytes()).hexdigest()}
 manifest['assets'].append(item);validation.append({'name':name,'dimensions_px':list(im.size),'alpha_range':[lo,hi],'alpha_bounds':a.getbbox(),'nonempty':True})
state=json.loads((root/'figma-state-final.json').read_text());manifest['phone_digit_registration']=state['propsResult']['registrations']
(root/'texture-manifest.json').write_text(json.dumps(manifest,indent=2)+'\n')
(root/'texture-validation.json').write_text(json.dumps(validation,indent=2)+'\n')
print(json.dumps({'textures':len(entries),'all_opaque_or_alpha_checks_passed':True,'working_directory':str(dst)}))
