const made=[];
const col=h=>({r:parseInt(h.slice(0,2),16)/255,g:parseInt(h.slice(2,4),16)/255,b:parseInt(h.slice(4,6),16)/255});
const paint=h=>[{type:'SOLID',color:col(h)}];
const vars=await figma.variables.getLocalVariablesAsync();
const bind=(n,prop,name)=>{const v=vars.find(v=>v.name===name);if(v)n.setBoundVariable(prop,v);};
const fill=(n,hex,name)=>{const v=vars.find(v=>v.name===name);n.fills=v?[figma.variables.setBoundVariableForPaint(paint(hex)[0],'color',v)]:paint(hex);};
for(const f of [{family:'Geist',style:'Regular'},{family:'Geist',style:'Medium'},{family:'Geist',style:'SemiBold'},{family:'Geist Mono',style:'Regular'}])await figma.loadFontAsync(f);
const board=await figma.getNodeByIdAsync('111:11082');
const masters=await figma.getNodeByIdAsync('111:11085');
function track(n){made.push(n.id);return n;}
function box(p,name,w,h,c,x=0,y=0){const n=track(figma.createFrame());p.appendChild(n);n.name=name;n.resize(w,h);n.x=x;n.y=y;n.fills=c?paint(c):[];n.clipsContent=false;return n;}
function rect(p,name,x,y,w,h,c,r=0){const n=track(figma.createRectangle());p.appendChild(n);n.name=name;n.resize(w,h);n.x=x;n.y=y;n.fills=paint(c);n.cornerRadius=r;return n;}
function ellipse(p,name,x,y,w,h,c){const n=track(figma.createEllipse());p.appendChild(n);n.name=name;n.resize(w,h);n.x=x;n.y=y;n.fills=c?paint(c):[];return n;}
function txt(p,str,size=24,w=2200,c='F1E9DC',style='Regular'){const n=track(figma.createText());n.fontName={family:'Geist',style};n.fontSize=size;n.characters=str;n.fills=paint(c);n.lineHeight={unit:'PERCENT',value:140};n.textAutoResize='HEIGHT';n.resize(w,n.height);p.appendChild(n);return n;}
function stack(p,name,dir='VERTICAL',gap=24){const n=track(figma.createAutoLayout(dir));p.appendChild(n);n.name=name;n.fills=[];n.itemSpacing=gap;return n;}
function panel(title,desc){const n=stack(board,title);n.resize(2352,100);n.primaryAxisSizingMode='AUTO';n.paddingTop=n.paddingBottom=n.paddingLeft=n.paddingRight=40;fill(n,'1B1916','color/white');n.cornerRadius=20;txt(n,title,42,2272,'F1E9DC','SemiBold');if(desc)txt(n,desc,23,2272,'A49B8F');return n;}
async function fonts(n){const ts=n.type==='TEXT'?[n]:('findAllWithCriteria'in n?n.findAllWithCriteria({types:['TEXT']}):[]);const fs=new Map();for(const t of ts)for(const s of t.getStyledTextSegments(['fontName']))fs.set(JSON.stringify(s.fontName),s.fontName);for(const f of fs.values())await figma.loadFontAsync(f);}
function recordTree(n){made.push(n.id);if('children'in n)for(const c of n.children)recordTree(c);}
async function clone(id,p,name){const n=await figma.getNodeByIdAsync(id);await fonts(n);const c=n.clone();p.appendChild(c);c.name=name||n.name;recordTree(c);return c;}
function inst(c,p,scale=1){const n=c.createInstance();p.appendChild(n);if(scale!==1)n.rescale(scale);recordTree(n);return n;}
function component(name,w,h){const n=track(figma.createComponent());masters.appendChild(n);n.name=name;n.resize(w,h);n.fills=[];return n;}
function png(n,width){n.exportSettings=[{format:'PNG',suffix:'',constraint:{type:'WIDTH',value:width}}];}
function packedIds(){const groups={};for(const id of [...new Set(made)]){const k=id.slice(0,id.lastIndexOf(':')+1),v=id.slice(id.lastIndexOf(':')+1);(groups[k]||(groups[k]=[])).push(v);}return groups;}
async function scene(id,p,name,width=1080){const src=await figma.getNodeByIdAsync(id);await fonts(src);const n=box(p,name,src.width,src.height);n.fills=src.fills;n.clipsContent=true;for(const c of src.children.filter(c=>c.visible&&!c.name.startsWith('_old'))){const v=c.clone();n.appendChild(v);recordTree(v);}for(const c of n.findAll(c=>c.name==='Screen content'||/^Screen light on/.test(c.name)))c.visible=false;n.rescale(width/src.width);return n;}
