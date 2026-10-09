// Execute through Figma MCP. Texture artwork stays editable in the existing file.
const page = await figma.getNodeByIdAsync('166:13160');
await figma.setCurrentPageAsync(page);
if (page.children.some(n => n.name === 'Workspace / Texture masters v1')) return {alreadyExists: true};
const created = [];
const track = n => { created.push(n.id); return n; };
const serif = {family:'Cormorant Garamond',style:'Medium'};
const sans = {family:'Geist',style:'Regular'};
const mono = {family:'IBM Plex Mono',style:'Regular'};
await Promise.all([serif,sans,mono].map(f=>figma.loadFontAsync(f)));
const vars = await figma.variables.getLocalVariablesAsync();
const cream = vars.find(v=>v.id==='VariableID:2:3');
const dark = vars.find(v=>v.id==='VariableID:2:5');
const muted = vars.find(v=>v.id==='VariableID:2:6');
const col = figma.variables.createVariableCollection('Workspace / Surface colors');
const makeColor=(name,hex)=>{const v=figma.variables.createVariable(name,col,'COLOR');v.scopes=['FRAME_FILL','SHAPE_FILL','TEXT_FILL','STROKE_COLOR'];v.setValueForMode(col.defaultModeId,{r:parseInt(hex.slice(0,2),16)/255,g:parseInt(hex.slice(2,4),16)/255,b:parseInt(hex.slice(4,6),16)/255,a:1});return v;};
const ink=makeColor('color/paper-ink','34332F');
const blueprint=makeColor('color/blueprint','121C21');
const blue=makeColor('color/logo-blue','064B8E');
const fill=(v,opacity=1)=>figma.variables.setBoundVariableForPaint({type:'SOLID',color:{r:0,g:0,b:0},opacity},'color',v);
function rect(parent,name,x,y,w,h,v,opacity=1){const n=track(figma.createRectangle());parent.appendChild(n);n.name=name;n.resize(w,h);n.x=x;n.y=y;n.fills=[fill(v)];n.opacity=opacity;return n;}
function text(parent,value,size,v=ink,font=sans,w=800){const t=track(figma.createText());parent.appendChild(t);t.name=value.slice(0,60);t.fontName=font;t.fontSize=size;t.characters=value;t.fills=[fill(v)];t.textAutoResize='HEIGHT';t.resize(w,t.height);t.lineHeight={unit:'PERCENT',value:125};return t;}
function stack(parent,name,x,y,w,gap=24){const a=track(figma.createAutoLayout('VERTICAL'));parent.appendChild(a);a.name=name;a.x=x;a.y=y;a.resize(w,100);a.fills=[];a.itemSpacing=gap;a.primaryAxisSizingMode='AUTO';a.counterAxisSizingMode='FIXED';return a;}
function label(parent,value,x,y,w=800,v=ink){const t=text(parent,value,22,v,mono,w);t.x=x;t.y=y;t.letterSpacing={unit:'PIXELS',value:3};return t;}
function svg(parent,name,source,x,y,w,h){const n=figma.createNodeFromSvg(source);parent.appendChild(n);n.name=name;n.resize(w,h);n.x=x;n.y=y;created.push(n.id,...n.findAll().map(n=>n.id));return n;}
const board=track(figma.createFrame());page.appendChild(board);board.name='Workspace / Texture masters v1';board.x=100;board.y=1300;board.resize(7400,3950);board.fills=[fill(dark)];board.clipsContent=false;
const title=text(board,'WORKSPACE / FLAT TEXTURE MASTERS',32,cream,mono,2400);title.x=80;title.y=50;
const manifest=[];
function master(name,file,x,y,w,h,bg,target){const c=track(figma.createComponent());board.appendChild(c);c.name=name;c.description='Editable flat artwork for '+target+'. Lighting, grain, bevels and shadows belong in Blender.';c.resize(w,h);c.x=x;c.y=y;c.fills=[fill(bg)];c.clipsContent=true;c.exportSettings=[{format:'PNG',constraint:{type:'SCALE',value:1},suffix:''}];manifest.push({nodeId:c.id,name,file,width:w,height:h,target});return c;}
const cover=master('Texture / Ultra Maritime / front cover','um-cover-front.png',80,150,1024,1448,cream,'Notebook_FrontCover, 148 × 210 mm');
rect(cover,'Spine band',0,0,34,1448,ink);
label(cover,'EXPERIENCE / 2026',110,120,820);
const logo=rect(cover,'Existing Ultra Maritime logo — transparent source',240,320,544,544,cream);
const coverCopy=stack(cover,'Cover title',110,940,810,18);
text(coverCopy,'Ultra Maritime',82,ink,serif,810);
text(coverCopy,'Software Engineer Intern',31,ink,sans,810);
label(cover,'DAX MANUEL',110,1320,810);
const back=master('Texture / Ultra Maritime / back cover','um-cover-back.png',1170,150,1024,1448,cream,'Notebook_BackCover, 148 × 210 mm');
rect(back,'Spine band',990,0,34,1448,ink);label(back,'DAX MANUEL',110,1230,810);label(back,'MAY — AUGUST 2026',110,1290,810);
const spine=master('Texture / Ultra Maritime / spine','um-spine.png',2260,150,128,1448,ink,'Notebook_Spine, 18.5 × 210 mm');
const spineType=text(spine,'UM',45,cream,serif,100);spineType.x=20;spineType.y=95;
label(spine,'26',25,1330,90,cream);
const left=master('Texture / Ultra Maritime / left page','um-page-left.png',2450,150,1024,1448,cream,'Notebook_PageLeft, 140 × 200 mm');
label(left,'WORK NOTES / 01',90,95,800);
const intro=stack(left,'Experience introduction',90,260,800,30);
text(intro,'Ultra\nMaritime',108,ink,serif,800);
text(intro,'Software Engineer Intern',37,ink,sans,800);
text(intro,'May 2026 – Aug 2026\nDartmouth, NS',28,ink,mono,800);
rect(left,'Rule',90,765,800,2,ink,0.3);
const notes=stack(left,'Technical focus',90,830,800,26);
text(notes,'Tools, tests &\nconnected systems.',56,ink,serif,800);
text(notes,'Python / REST APIs / ZeroMQ\nLinux / Automated testing',26,ink,mono,800);
label(left,'DAX MANUEL',90,1320,730);
const right=master('Texture / Ultra Maritime / right page','um-page-right.png',3550,150,1024,1448,cream,'Notebook_PageRight, 140 × 200 mm');
label(right,'SELECTED CONTRIBUTIONS / 02',125,95,800);
const entries=[['01 / EXPORT AUTOMATION','Engineered an internal tool exporting test suites from DOORS into Excel files with Python via REST API, reducing export times by over 50%.'],['02 / TEST COVERAGE','Authored test suites covering 30+ functions and implemented tests to validate Automated Test Environment behaviors.'],['03 / MESSAGE EMITTER','Developed a message emitter in Python using ZMQ sockets for TCP/IP, enabling an Automated Test Environment to validate data transmission via PUB/SUB and REQ/REP.'],['04 / LINUX TEST RACK','Restored legacy software on a Linux test rack, configuring network IPs and creating virtual machines to test software.']];
const contributions=stack(right,'Four verified contributions',125,220,790,44);
for(const [head,body] of entries){const group=stack(contributions,head,0,0,790,18);text(group,head,22,ink,mono,790);text(group,body,29,ink,sans,790);}
label(right,'ENGINEERING / SUMMER 2026',125,1320,790);
const hack=master('Texture / Hack Atlantic / laptop screen','hack-atlantic-screen.png',80,1710,2048,1352,dark,'MacBook display; existing Figma surface ratio 1412:932');
const wallpaper=rect(hack,'Sunset coastline — discrete photographic background',0,0,2048,1352,dark);
rect(hack,'Legibility veil',0,0,2048,1352,dark,0.17);
const hackText=stack(hack,'Hack Atlantic headline',135,130,1000,42);
text(hackText,'Hack\nAtlantic',178,cream,serif,1000);
rect(hackText,'Short rule',0,0,100,2,cream);
label(hack,'FOUNDED BY DAX MANUEL',135,1180,1600,cream);
const monitor=master('Texture / Personal projects / ultrawide index','personal-projects-screen.png',2220,1710,2048,877,blueprint,'Screen_Ultrawide_Projects; 0.82 × 0.351 m, chord-uniform UV');
for(let x=0;x<2048;x+=64)rect(monitor,'Blueprint grid / vertical',x,0,1,877,cream,0.025);
for(let y=0;y<877;y+=64)rect(monitor,'Blueprint grid / horizontal',0,y,2048,1,cream,0.025);
label(monitor,'DAX MANUEL / SELECTED WORK',85,70,1400,cream);
const monitorHead=stack(monitor,'Project index heading',85,170,600,36);
text(monitorHead,'Personal\nprojects',112,cream,serif,600);
text(monitorHead,'Choose a project\nto take a closer look.',28,cream,sans,520);
const projects=[['01','Recap','iOS app'],['02','Codex for CAD',''],['03','ML Library','']];
const projectCards=[];
for(let i=0;i<projects.length;i++){const x=755+i*420;rect(monitor,'Index separator',x-30,175,1,570,cream,0.18);label(monitor,projects[i][0],x,185,280,muted);const c=stack(monitor,'Project / '+projects[i][1],x,500,350,18);text(c,projects[i][1],48,cream,serif,350);if(projects[i][2])text(c,projects[i][2],22,muted,sans,350);projectCards.push({x});}
const drawings=[
'<rect x="100" y="10" width="120" height="210" rx="20"/><path d="M135 35h50M125 80h70M125 105h50M125 160h70M125 185h45"/><circle cx="160" cy="205" r="3"/>',
'<path d="M160 20 260 75 260 180 160 235 60 180 60 75Z M60 75 160 130 260 75 M160 130v105 M160 20v105 M60 180 160 125 260 180"/>',
'<path d="M35 210H285 M35 210V20 M50 185 95 170 135 155 180 110 225 80 270 35"/><circle cx="95" cy="170" r="6"/><circle cx="180" cy="110" r="6"/><circle cx="270" cy="35" r="6"/>'
];
drawings.forEach((d,i)=>svg(monitor,'Illustrative project diagram / not a product screenshot','<svg xmlns="http://www.w3.org/2000/svg" width="320" height="260" viewBox="0 0 320 260"><g fill="none" stroke="#9BABA9" stroke-width="1.5">'+d+'</g></svg>',projectCards[i].x,260,320,230));
label(monitor,'SOFTWARE / EXPERIMENTS / IDEAS',85,787,1500,muted);
const mug=master('Texture / Mug / lettering','mug-lettering.png',4370,1710,1024,1024,cream,'Mug front decal; export alpha artwork');mug.fills=[];
const mugCopy=stack(mug,'Mug lettering',275,280,475,22);['BETTER','THINGS','AHEAD'].forEach(v=>{const t=text(mugCopy,v,70,ink,mono,475);t.letterSpacing={unit:'PIXELS',value:10};});
const phone=master('Texture / Phone / center medallion','phone-center.png',5450,1710,512,512,cream,'Phone dial center, separate from existing digits');
const rim=track(figma.createEllipse());phone.appendChild(rim);rim.resize(470,470);rim.x=21;rim.y=21;rim.fills=[];rim.strokes=[fill(ink,0.45)];rim.strokeWeight=2;
const name=text(phone,'DAX',93,ink,serif,330);name.x=91;name.y=175;name.textAlignHorizontal='CENTER';
label(phone,'CONTACT',148,310,260);
const meta=text(board,'Flat color artwork only. Real grain, reflections, page curvature and lighting are authored in Blender.\nNotebook pages use existing verified experience copy. Monitor diagrams are illustrations, not product screenshots.',25,cream,sans,5000);meta.x=80;meta.y=3210;
return {createdNodeIds:created,createdVariableIds:[ink.id,blueprint.id,blue.id],collectionId:col.id,boardId:board.id,manifest,uploadTargets:{logo:logo.id,wallpaper:wallpaper.id},fontFamilies:[serif.family,sans.family,mono.family],discovery:{codeConnect:'None found',existingComponents:'Old surface artwork inspected; retain separately',libraries:'No subscribed library; community app kits do not supply bespoke physical texture artwork',tokens:'Reused cream/dark/muted; introduced only missing surface colors'}};
