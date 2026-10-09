const created=[];
const color=h=>({r:parseInt(h.slice(1,3),16)/255,g:parseInt(h.slice(3,5),16)/255,b:parseInt(h.slice(5,7),16)/255});
const palette={'bg/wall':'#1d1c1b','bg/wall-pool':'#2b2927','desk/top':'#d8d3ca','desk/edge':'#bfb9af','text/cream':'#ece6da','text/muted':'#a8a297','pill/bg':'#efe8dc','pill/text':'#2a2622','accent/glow':'#f3d9a8','phone/red':'#6e0d0d','screen/navy':'#0c141b','paper/cream':'#eee8da','ink/graphite':'#514e47'};
const collection=figma.variables.createVariableCollection('Scene palette');
const variables={};
for(const [name,hex]of Object.entries(palette)){const v=figma.variables.createVariable(name,collection,'COLOR');v.scopes=['FRAME_FILL','SHAPE_FILL','TEXT_FILL','STROKE_COLOR'];v.setValueForMode(collection.defaultModeId,{...color(hex),a:1});v.setVariableCodeSyntax('WEB','--'+name.replaceAll('/','-'));variables[name]=v;}
const paint=name=>figma.variables.setBoundVariableForPaint({type:'SOLID',color:color(palette[name])},'color',variables[name]);
const frames={};
for(const [name,w,h,x,y,bg]of [['Monitor — Ultra Maritime',1024,439,200,100,'screen/navy'],['Laptop — Hack Atlantic',1024,676,1424,100,'screen/navy'],['Mug — transparent decal',512,512,2648,100,null],['Phone — dial face',512,512,3360,100,'pill/bg'],['Sketchbook — left',724,1024,200,976,'paper/cream'],['Sketchbook — right',724,1024,1124,976,'paper/cream'],['Résumé — Dax Manuel',724,1024,2048,976,'paper/cream'],['Overlay — desktop 1440',1440,1000,4072,100,'bg/wall']]){const f=figma.createFrame();f.name=name;f.resize(w,h);f.x=x;f.y=y;f.fills=bg?[paint(bg)]:[];f.exportSettings=[{format:'PNG',constraint:{type:'SCALE',value:2}}];frames[name]=f.id;created.push(f.id);}
figma.currentPage.name='Scene textures + overlay';
return {createdNodeIds:created,mutatedNodeIds:[figma.currentPage.id],frames,collectionId:collection.id,variables:Object.fromEntries(Object.entries(variables).map(([k,v])=>[k,v.id]))};
