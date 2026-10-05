const pen=component('Prop / Pen · top · 140 mm',700,90);
pen.description='Source 44:6050. 140 mm overall, barrel diameter 10.9 mm. Tip points +X; underside origin at barrel centre. Warm black body, brass nose and copper clip. Solid PBR finishes; no bitmap maps required.';
const pv=await clone('44:6050',pen,'Editable original silhouette');pv.rescale(700/264.2796630859375);pv.x=0;pv.y=0;
const side=component('Prop / Pen · side · 140 mm',700,90);
rect(side,'Barrel',43,28,521,54,'1B1916',26);
const tip=track(figma.createNodeFromSvg('<svg width="136" height="55" viewBox="0 0 136 55" xmlns="http://www.w3.org/2000/svg"><path d="M0 0H10L124 24V31L10 55H0Z" fill="#D8AF79"/><path d="M124 24H136V31H124Z" fill="#0B0C0D"/></svg>'));side.appendChild(tip);tip.x=564;tip.y=28;for(const n of tip.findAll(()=>true))made.push(n.id);
rect(side,'Clip raised 2 mm',43,15,229,12,'DB9E5D',5);rect(side,'Clip root',43,18,18,23,'DB9E5D',4);
side.description='Side silhouette, 5 px/mm. Clip 45.8 × 2.4 mm, 2 mm stand-off; barrel Ø10.9 mm. Nose tapers over 24 mm; exposed dark nib 2.8 mm. Material slots Pen_Barrel, Pen_Nose, Pen_Clip, Pen_Nib.';
const p=panel('01 / Pen', 'Top and side views · source 44:6050 · dimensions are production specifications');
const well=box(p,'Pen / orthographic views',2272,360,'24211C');const pi=inst(pen,well,2);pi.x=90;pi.y=40;const si=inst(side,well,2);si.x=90;si.y=200;
txt(p,'140 mm overall  /  Ø10.9 mm barrel  /  45.8 mm clip  /  2 mm clip clearance',28);
txt(p,'Barrel #1B1916 · Metallic 0 · Roughness 0.42\nNose #D8AF79 · Metallic 1 · Roughness 0.28\nClip #DB9E5D · Metallic 1 · Roughness 0.24\nNib #0B0C0D · Metallic 0.7 · Roughness 0.25',23);
txt(p,'Contact placement: right notebook page, pointing toward the outer edge; 12 mm inside the lower edge. Keep the left-page contact links unobstructed.',23);
const dial=component('Texture / Phone number plate · 1024²',1024,1024);dial.fills=paint('F4F1EA');dial.description='Flat sRGB albedo. Square UV bounds cover the full 122 mm number-plate diameter; disc clips the square in Blender. Centre (512,512), pitch radius 352.5246 px = 42 mm. Digits 1–9 then 0 at angles 57+27i degrees from +X; image Y points down. No wheel, guides, shadow or reflection.';png(dial,1024);
const angles=Array.from({length:10},(_,i)=>57+27*i),registrations=[];
for(let i=0;i<10;i++){const a=angles[i]*Math.PI/180,x=512+(42/122)*1024*Math.cos(a),y=512-(42/122)*1024*Math.sin(a);const t=txt(dial,String((i+1)%10),60,100,'1F1F23','Medium');t.textAlignHorizontal='CENTER';t.x=x-50;t.y=y-t.height/2;registrations.push({digit:(i+1)%10,angle_deg:angles[i],x_px:x,y_px:y});}
const dp=panel('02 / Rotary phone · number plate','Flat, editable registration artwork · source 44:5864 · exact match to the existing 10-hole dial');
const dr=stack(dp,'Plate and registration','HORIZONTAL',64);inst(dial,dr,.64);const notes=stack(dr,'Registration notes');txt(notes,'Ø122 mm plate\nØ84 mm pitch circle\nØ17 mm finger holes\nØ39.5 mm centre ring',32,1250);txt(notes,'Numbers: 1–9, then 0\nStart 57°; step 27° counter-clockwise\nUV top = local +Y\nIvory #F4F1EA · roughness 0.6\nDark print #1F1F23',24,1250);txt(dp,'Export contains only ivory and digits. The acrylic wheel and chrome centre stay separate materials. Guide circle and hole centres are recorded in the local manifest.',23);
const labelStyle=figma.createTextStyle();labelStyle.name='Portfolio / Prop callout';labelStyle.fontName={family:'Geist',style:'Medium'};labelStyle.fontSize=34;labelStyle.lineHeight={unit:'PERCENT',value:130};
const labels=[];
for(const text of ['Data logging','Accelerator pedal sensor']){const c=component('Texture / FSAE / '+text,text==='Data logging'?330:570,104);c.clipsContent=true;const bg=rect(c,'Backing',16,16,c.width-32,72,'0B0C0D',12);bg.opacity=.9;fill(bg,'0B0C0D','color/forest');const t=txt(c,text,34,c.width-64,'F1E9DC','Medium');await t.setTextStyleIdAsync(labelStyle.id);t.textAlignHorizontal='CENTER';t.x=32;t.y=(104-t.height)/2;fill(t,'F1E9DC','color/cream');png(c,1024);c.description='Transparent outer padding 16 px. Rounded dark backing at 90% opacity. Geist Medium 34px, cream type. Connector and anchor excluded from export. Camera-facing label; mechanical anchor unverified.';labels.push(c);}
const lp=panel('03 / Formula SAE · callout artwork','Camera-facing labels with separate connector geometry · source 40:3463');
const lr=stack(lp,'Callouts','HORIZONTAL',72);for(const c of labels)inst(c,lr,1.5);
txt(lp,'Connector: 1.5 px at 1440-wide reference. Round 6 px endpoint. Keep 12 px clear of label backing. Screen anchors: Data logging (930.44, 427.86); pedal sensor (868.34, 486.51).',23);
txt(lp,'ANCHOR VERIFICATION REQUIRED / These are the existing screen-space anchors, not verified mechanical component locations. Resolve against the car model before assigning 3D attachment points.',23,2272,'D8AF79');
return {createdNodeIds:made,styles:[labelStyle.id],assets:{pen:pen.id,penSide:side.id,dial:dial.id,labels:labels.map(n=>({id:n.id,name:n.name,w:n.width,h:n.height}))},panels:[p.id,dp.id,lp.id],registrations};
