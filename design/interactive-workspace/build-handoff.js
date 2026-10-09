const p=await figma.getNodeByIdAsync('166:13160');await figma.setCurrentPageAsync(p);
if(p.children.some(n=>n.name==='Review / Workspace surface previews'))return {alreadyExists:true};
const created=[];const track=n=>{created.push(n.id);return n;};
const serif={family:'Cormorant Garamond',style:'Medium'},sans={family:'Geist',style:'Regular'},mono={family:'IBM Plex Mono',style:'Regular'};
await Promise.all([serif,sans,mono].map(f=>figma.loadFontAsync(f)));
const v=await figma.variables.getLocalVariablesAsync();
const cream=v.find(v=>v.id==='VariableID:2:3'),dark=v.find(v=>v.id==='VariableID:2:5'),ink=v.find(v=>v.id==='VariableID:169:13161'),muted=v.find(v=>v.id==='VariableID:2:6');
const fill=v=>figma.variables.setBoundVariableForPaint({type:'SOLID',color:{r:0,g:0,b:0}},'color',v);
function frame(parent,name,x,y,w,h,color=dark){const f=track(figma.createFrame());parent.appendChild(f);f.name=name;f.resize(w,h);f.x=x;f.y=y;f.fills=[fill(color)];return f;}
function text(parent,s,x,y,size=24,w=800,font=sans,color=cream){const t=track(figma.createText());parent.appendChild(t);t.fontName=font;t.fontSize=size;t.characters=s;t.name=s.slice(0,50);t.fills=[fill(color)];t.textAutoResize='HEIGHT';t.resize(w,t.height);t.lineHeight={unit:'PERCENT',value:135};t.x=x;t.y=y;return t;}
const masters={};for(const id of ['169:13166','169:13181','169:13192','169:13208','169:13215','169:13294','169:13299'])masters[id]=await figma.getNodeByIdAsync(id);
function instance(parent,id,x,y,width){const n=masters[id].createInstance();parent.appendChild(n);n.rescale(width/n.width);n.x=x;n.y=y;created.push(n.id,...n.findAll().map(n=>n.id));return n;}
const review=frame(p,'Review / Workspace surface previews',100,5500,2200,1850);
text(review,'THE WORKSPACE',70,55,20,1400,mono);
text(review,'A closer look at the surfaces.',70,105,70,1900,serif);
instance(review,'169:13166',70,270,410);
instance(review,'169:13181',540,270,410);instance(review,'169:13192',953,270,410);
text(review,'ULTRA MARITIME / COVER + OPEN SPREAD',70,890,20,1600,mono);
instance(review,'169:13215',70,1020,1294);
instance(review,'169:13208',1425,270,700);
text(review,'PERSONAL PROJECTS / ULTRAWIDE',70,1605,20,1300,mono);
text(review,'HACK ATLANTIC / MACBOOK',1425,790,19,700,mono);
const mug=frame(review,'Ivory mug color preview — not part of alpha export',1470,960,540,430,cream);instance(mug,'169:13294',80,20,390);
instance(review,'169:13299',1600,1480,250);
text(review,'LETTERING / MUG + PHONE',1440,1770,18,700,mono);
const story=frame(p,'Storyboard / Ultra Maritime opens on approach',2500,5500,2800,1100);
text(story,'ULTRA MARITIME / OPENING SEQUENCE',60,50,24,2300,mono);
const stages=[['01 / ON THE DESK','Closed cover; logo faces the overview camera.'],['02 / HOVER OR FOCUS','A restrained outline and label identify the notebook.'],['03 / APPROACH + OPEN','Camera approaches as the cover rotates outward.'],['04 / READ','Stable open spread with selectable HTML text.'],['05 / RETURN','Cover closes while the camera returns to the desk.']];
for(let i=0;i<5;i++){const x=60+i*545;const cell=frame(story,stages[i][0],x,145,505,830);text(cell,stages[i][0],20,20,18,465,mono);if(i<2||i===4){const book=instance(cell,'169:13166',130,115,220);if(i===1){book.strokes=[fill(cream)];book.strokeWeight=3;}}else{instance(cell,'169:13181',30,145,218);instance(cell,'169:13192',249,145,218);if(i===2){const c=instance(cell,'169:13166',245,125,190);c.rotation=-22;}}text(cell,stages[i][1],20,570,26,465);text(cell,i===2?'0.0–1.2 s':i===3?'Reading hold':i===4?'0.8–1.0 s':'Await selection',20,745,18,465,mono,muted);}
text(story,'Storyboard frames explain timing; the physical opening motion will be authored and clearance-tested in Blender.',60,1000,23,2600);
const mobile=frame(p,'Mobile / Ultra Maritime reading view',5500,5500,390,1050,cream);
text(mobile,'← Back to desk',24,24,15,342,sans,ink);
text(mobile,'Ultra Maritime',24,72,44,342,serif,ink);
instance(mobile,'169:13181',24,150,170);instance(mobile,'169:13192',195,150,170);
const content=track(figma.createAutoLayout('VERTICAL'));mobile.appendChild(content);content.name='Accessible reading content';content.resize(342,500);content.x=24;content.y=420;content.fills=[];content.itemSpacing=18;content.primaryAxisSizingMode='AUTO';content.counterAxisSizingMode='FIXED';
text(content,'Software Engineer Intern',0,0,23,342,serif,ink);
text(content,'May 2026 – Aug 2026 · Dartmouth, NS',0,0,13,342,sans,ink);
text(content,'Export automation',0,0,18,342,sans,ink);
text(content,'Engineered an internal tool exporting test suites from DOORS into Excel files with Python via REST API, reducing export times by over 50%.',0,0,16,342,sans,ink);
text(content,'Test coverage',0,0,18,342,sans,ink);
text(content,'Authored test suites covering 30+ functions and implemented tests to validate Automated Test Environment behaviors.',0,0,16,342,sans,ink);
text(content,'Continue reading ↓',0,0,14,342,sans,ink);
text(p,'Mobile reading layout — additional contributions continue below; text must remain selectable.',5500,6600,22,680);
const notes=frame(p,'Handoff / Surface mapping and behavior',6250,5500,1280,1550);
text(notes,'FIGMA → BLENDER',60,50,24,1160,mono);
const blocks=[['Typography','Cormorant Garamond Medium for editorial titles, Geist for readable details, IBM Plex Mono for small labels. Chosen to approximate the generated reference; its original font cannot be recovered exactly.'],['Surface treatment','Use these files as flat color artwork. Add cloth, paper grain, metal, page curvature, reflections and shadows in Blender. Keep the logo blue and undistorted.'],['Notebook geometry','Closed A5 cover: 148 × 210 mm. Spine: 18.5 mm. Page art has a 90–125 px safe margin. Hinge on the left; reserve desk clearance for the opening cover.'],['Monitor mapping','Personal projects only. Ultrawide artwork: 2048 × 877, matching the existing 0.82 × 0.351 m screen. Icons are illustrative diagrams, not application screenshots.'],['Content and accessibility','Ultra Maritime copy is sourced from web/src/ultra-maritime.json. Long reading text must also exist in HTML. Mobile and reduced motion go directly to a stable reading view.'],['Preserved assets','Existing résumé is a placeholder; it is not a finished CV. Existing rotary dial digits are retained separately. No résumé download should be enabled until a real file is supplied.']];
const notesStack=track(figma.createAutoLayout('VERTICAL'));notes.appendChild(notesStack);notesStack.name='Production handoff';notesStack.resize(1160,1200);notesStack.x=60;notesStack.y=140;notesStack.itemSpacing=28;notesStack.fills=[];notesStack.primaryAxisSizingMode='AUTO';notesStack.counterAxisSizingMode='FIXED';
for(const [h,b] of blocks){text(notesStack,h,0,0,33,1160,serif);text(notesStack,b,0,0,25,1160);}
for(const m of Object.values(masters)){if(m.height===1448)m.exportSettings=[{format:'PNG',constraint:{type:'HEIGHT',value:2048},suffix:''}];}
const back=await figma.getNodeByIdAsync('169:13174'),spine=await figma.getNodeByIdAsync('169:13178');for(const n of [back,spine])n.exportSettings=[{format:'PNG',constraint:{type:'HEIGHT',value:2048},suffix:''}];
await review.screenshot({scale:.6});
return {createdNodeIds:created,mutatedNodeIds:['169:13166','169:13181','169:13192',back.id,spine.id],reviewId:review.id,storyboardId:story.id,mobileId:mobile.id,handoffId:notes.id,mobileContentBottom:content.y+content.height,notesContentBottom:notesStack.y+notesStack.height};
