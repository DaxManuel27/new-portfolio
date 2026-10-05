const page=figma.createPage();page.name='Device PBR textures';await figma.setCurrentPageAsync(page);
const ids=[page.id],masters=[];
const specs=[
{name:'MacBookPro_Silver',color:[202,205,209],rough:.28,metal:1,grain:.018,mm:20,bump:.000012,objects:['MacBook_Base','MacBook_DisplayHousing']},
{name:'MacBookPro_Trackpad',color:[194,197,201],rough:.43,metal:0,grain:.012,mm:20,bump:.000004,objects:['MacBook_Trackpad']},
{name:'Monitor_Housing',color:[37,40,44],rough:.46,metal:0,grain:.035,mm:30,bump:.000025,objects:['Personal_Ultrawide_Housing','Ultra_Monitor_Left_Housing','Ultra_Monitor_Right_Housing']},
{name:'Device_BlackBezel',color:[20,22,25],rough:.31,metal:0,grain:.015,mm:20,bump:.000008,objects:['MacBook_DisplayBezel','MacBook_CameraNotch','monitor front rim faces']},
{name:'Monitor_Stand',color:[47,50,54],rough:.39,metal:0,grain:.028,mm:30,bump:.00002,objects:['Personal_Ultrawide_StandBase','Personal_Ultrawide_StandStem','Ultra_Monitor_Left_StandBase','Ultra_Monitor_Left_StandStem','Ultra_Monitor_Right_StandBase','Ultra_Monitor_Right_StandStem']}
];
for(let row=0;row<specs.length;row++){
const s=specs[row];let seed=7823+row;function rnd(){seed=(seed*1664525+1013904223)>>>0;return seed/4294967296}
const dots=Array.from({length:1400},()=>({x:rnd()*512,y:rnd()*512,r:.25+rnd()*.55,v:rnd()}));
for(let col=0;col<4;col++){
const channel=['BaseColor','Roughness','Metallic','Height'][col];const bg=col===0?'rgb('+s.color.join(',')+')':col===1?'rgb('+Array(3).fill(Math.round(s.rough*255)).join(',')+')':col===2?(s.metal?'#ffffff':'#000000'):'#808080';
let svg='<svg xmlns="http://www.w3.org/2000/svg" width="512" height="512" viewBox="0 0 512 512"><rect width="512" height="512" fill="'+bg+'"/>';
if(col!==2){for(const d of dots){const opacity=col===0?s.grain:col===1?.06:.16;const fill=d.v>.5?'#ffffff':'#000000';for(const dx of [-512,0,512])for(const dy of [-512,0,512]){let x=d.x+dx,y=d.y+dy;if(x+d.r>=0&&x-d.r<=512&&y+d.r>=0&&y-d.r<=512)svg+='<circle cx="'+x.toFixed(3)+'" cy="'+y.toFixed(3)+'" r="'+d.r.toFixed(3)+'" fill="'+fill+'" opacity="'+opacity+'"/>';}}}
svg+='</svg>';const f=figma.createNodeFromSvg(svg);f.name='T_'+s.name+'_'+channel;page.appendChild(f);f.x=120+col*650;f.y=120+row*680;f.clipsContent=true;f.exportSettings=[{format:'PNG',suffix:'',colorProfile:'SRGB',constraint:{type:'SCALE',value:2}}];ids.push(f.id,...f.findAll().map(n=>n.id));masters.push({id:f.id,name:f.name,width:1024,height:1024,channel,material:s.name,tile_mm:s.mm,bump_distance_m:s.bump,roughness:s.rough,metallic:s.metal,objects:s.objects});}}
return {createdNodeIds:ids,pageId:page.id,masters};
