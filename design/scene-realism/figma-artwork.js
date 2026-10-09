const created=[];
const fonts=[{family:'Cormorant Garamond',style:'Light'},{family:'Cormorant Garamond',style:'Regular'},{family:'IBM Plex Mono',style:'Regular'},{family:'Cormorant Garamond',style:'Italic'}];
await Promise.all(fonts.map(f=>figma.loadFontAsync(f)));
const vars=await figma.variables.getLocalVariablesAsync();
const paint=name=>figma.variables.setBoundVariableForPaint({type:'SOLID',color:{r:0,g:0,b:0}},'color',vars.find(v=>v.name===name));
const frames=await Promise.all(['2:16','2:17','2:18','2:19','2:20','2:21','2:22'].map(id=>figma.getNodeByIdAsync(id)));
function text(p,s,x,y,size=16,font=2,col='text/cream',tracking=0){const n=figma.createText();n.fontName=fonts[font];n.characters=s;n.fontSize=size;n.lineHeight={unit:'PERCENT',value:112};n.letterSpacing={unit:'PERCENT',value:tracking};n.fills=[paint(col)];n.name=s.slice(0,44);p.appendChild(n);n.x=x;n.y=y;created.push(n.id);return n;}
function svg(p,s,w,h,x=0,y=0,name='Original line artwork'){const n=figma.createNodeFromSvg(`<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">${s}</svg>`);p.appendChild(n);n.x=x;n.y=y;n.name=name;created.push(n.id,...n.findAll().map(c=>c.id));return n;}
const [monitor,laptop,mug,dial,left,right,resume]=frames;
let art='';
for(let x=0;x<1024;x+=32)art+=`<path d="M${x} 0V439" stroke="#7c9ca4" opacity=".05"/>`;
for(let y=0;y<439;y+=32)art+=`<path d="M0 ${y}H1024" stroke="#7c9ca4" opacity=".05"/>`;
for(let k=0;k<25;k++){let d='';for(let x=0;x<=1024;x+=8){const y=302+k*5+15*Math.sin(x/82+k*.17)-30*Math.exp(-Math.pow((x-650)/150,2));d+=(x?'L':'M')+x+' '+y.toFixed(2)+' ';}art+=`<path d="${d}" fill="none" stroke="#9caeac" stroke-width=".55" opacity=".27"/>`;}
// Original three-quarter research vessel: ruled hull, deck, bridge, and mast.
art+='<g fill="none" stroke="#d0dbd9" stroke-width=".72" opacity=".72"><path d="M300 271L499 293L609 267L581 324L514 345L335 310Z M300 271L414 243L609 267 M499 293L514 345 M414 243L421 290 M335 310L421 290L581 324 M315 286L505 313L595 289 M324 299L510 327L589 307"/>';
for(let i=0;i<18;i++){let t=i/17;art+=`<path d="M${300+199*t} ${271+22*t}L${335+179*t} ${310+35*t} M${499+110*t} ${293-26*t}L${514+67*t} ${345-21*t}"/>`;}
art+='<path d="M406 265V216L491 224L533 213V273 M406 216L450 202L533 213 M421 249V231L490 238L521 229V252Z M444 219V185L498 189L517 183V217 M444 185L463 177L517 183 M461 181V161L491 165L503 159V185 M461 161L474 156L503 159 M475 156V104 M458 120H495 M462 136H500 M467 146H489 M454 182L472 114L493 177 M357 267V238L391 241V271 M357 238L374 232L407 236L391 241 M374 232V197 M370 208H380 M538 282V253L560 247L578 251V273 M331 274V260L397 244 M331 260L504 279L592 256 M331 269L503 288L592 264"/>';
for(let x=429;x<485;x+=11)art+=`<path d="M${x} 233V246 M${x+19} 190V204"/>`;
for(let i=0;i<4;i++)art+=`<circle cx="${540+i*11}" cy="${291-i*3}" r="3"/>`;
art+='</g><g fill="none" stroke="#b8c9ca" stroke-width=".65" opacity=".4"><circle cx="874" cy="190" r="140"/>';
for(const rx of [24,62,105])art+=`<ellipse cx="874" cy="190" rx="${rx}" ry="140" stroke-dasharray="1.5 3"/>`;
for(const ry of [30,68,110])art+=`<ellipse cx="874" cy="190" rx="140" ry="${ry}" stroke-dasharray="1.5 3"/>`;
art+='<path d="M778 98L799 112L805 140L829 157L817 175L837 196L844 218L825 234L817 267L796 280 M876 61L894 90L918 101L923 126L904 141L918 155L937 142L962 161L973 185L955 205L971 229L947 250 M788 131L773 162L782 181L765 202"/></g>';
svg(monitor,art,1024,439,0,0,'Original wireframe research ship, ocean contours and globe');
text(monitor,'Ultra Maritime',58,56,48,0);text(monitor,'ENGINEERING\nSYSTEMS\nFOR A CLEANER\nOCEAN',62,126,10,2,'text/muted',26).lineHeight={unit:'PERCENT',value:175};
text(monitor,'SAFER SEAS\nBRIGHTER\nTOMORROWS',878,178,9,2,'text/muted',25).lineHeight={unit:'PERCENT',value:180};
svg(monitor,'<path d="M62 218H91 M879 245H895" stroke="#ece6da" opacity=".7"/>',1024,439);
text(laptop,'Hack\nAtlantic',74,78,92,0);svg(laptop,'<path d="M76 296H133" stroke="#ece6da" stroke-width="2"/>',1024,676);
const mt=text(mug,'BETTER\nTHINGS\nAHEAD',126,143,36,2,'ink/graphite',14);mt.lineHeight={unit:'PERCENT',value:146};svg(mug,'<path d="M128 330H177" stroke="#514e47" stroke-width="2"/>',512,512);
let rings='<g fill="none" stroke="#7b7568"><circle cx="256" cy="256" r="246" stroke-width="2"/><circle cx="256" cy="256" r="226"/><circle cx="256" cy="256" r="114" stroke-width="2"/><circle cx="256" cy="256" r="104"/></g>';
svg(dial,rings,512,512);for(let i=0;i<10;i++){let a=(-55-i*28)*Math.PI/180;let n=text(dial,String((i+1)%10),256+173*Math.cos(a)-15,256+173*Math.sin(a)-23,40,1,'pill/text');}
text(dial,'DAX',215,223,39,1,'pill/text');text(dial,'CONTACT',209,270,13,2,'pill/text',10);
// Original technical car drawings, separate editable vector groups.
function carTop(){return '<g fill="none" stroke="#514e47" stroke-width="1.6"><path d="M305 43L282 139L271 291L285 418L325 454L365 418L379 291L368 139L345 43Z M305 43H345 M285 418H365 M292 144L325 129L359 144L356 218L340 236H310L292 218Z M290 238L325 252L360 238 M281 286H369 M287 322H365 M316 43V118H334V43 M303 346L325 365L347 346 M290 392L325 408L361 392"/><rect x="208" y="55" width="50" height="88" rx="9"/><rect x="391" y="55" width="50" height="88" rx="9"/><rect x="198" y="326" width="57" height="104" rx="10"/><rect x="394" y="326" width="57" height="104" rx="10"/><path d="M258 67L290 153 M258 124L288 164 M391 67L361 153 M391 124L365 164 M255 346L286 310 M255 405L288 326 M394 346L369 310 M394 405L365 326 M222 24H429V44H222Z M198 439H451V469H198Z M208 446H442 M208 455H442"/></g>';}
function carSide(){return '<g fill="none" stroke="#514e47" stroke-width="1.7"><circle cx="127" cy="186" r="49"/><circle cx="127" cy="186" r="25"/><circle cx="479" cy="186" r="53"/><circle cx="479" cy="186" r="28"/><path d="M53 188L180 171L220 139L331 146L374 187L536 191L548 211L177 216L71 210Z M195 184L210 148L246 134L313 145L333 184Z M206 146L209 86L270 85L293 144 M218 136V99H257L281 143 M177 205L209 155L257 205L303 156L344 205 M373 188L359 165L409 166L445 189 M447 128V54H519V146 M429 50H550V65H429Z M430 68H553V80H430 M53 194H95V218H48Z M65 202H89"/></g>';}
text(left,'VEHICLE STUDIES',48,42,16,2,'ink/graphite',15);text(left,'01 / chassis & packaging',48,70,18,3,'ink/graphite');
svg(left,carSide(),600,270,48,138,'Original Formula SAE side elevation');svg(left,carTop(),600,490,48,451,'Original Formula SAE plan view');
svg(left,'<g stroke="#888276" fill="none"><path d="M124 386H534 M124 378V394 M534 378V394 M112 410V364 M546 410V364 M80 518V895 M71 518H89 M71 895H89 M82 705H153"/></g>',724,1024);
text(left,'wheelbase / study',238,393,16,3,'ink/graphite');text(left,'front wing\nclearance',442,535,17,3,'ink/graphite');text(left,'Rev. 01 — concept notebook',48,976,14,2,'ink/graphite');
text(right,'DESIGN NOTES',48,42,16,2,'ink/graphite',15);text(right,'02 / suspension geometry',48,72,20,3,'ink/graphite');
svg(right,'<g stroke="#514e47" fill="none" stroke-width="1.7"><path d="M101 224L302 159L427 277L101 224L316 326L427 277 M302 159L316 326 M169 172L304 214L383 138 M304 214L351 307 M427 178V359 M449 178V359 M427 178H477V359H427 M101 224V383 M101 383H449 M101 374V392 M449 374V392"/><circle cx="302" cy="159" r="8"/><circle cx="316" cy="326" r="8"/><circle cx="101" cy="224" r="8"/><path d="M360 145L373 158L360 169L377 181L365 193L382 205L370 217L387 229"/></g>',624,410,40,152,'Original suspension wishbone study');
text(right,'keep mass close to centreline\nverify full steering clearance\ncheck fastener access',57,572,22,3,'ink/graphite').lineHeight={unit:'PERCENT',value:165};
text(right,'NEXT ITERATION',57,748,15,2,'ink/graphite',12);text(right,'• refine aero surfaces\n• compare load paths\n• prototype / test / repeat',57,786,19,3,'ink/graphite').lineHeight={unit:'PERCENT',value:160};
text(right,'D. M.  /  sketch studies',57,970,15,3,'ink/graphite');
text(resume,'DAX MANUEL',56,56,45,1,'pill/text',8);text(resume,'ENGINEERING  /  DESIGN  /  TECHNOLOGY',58,117,12,2,'ink/graphite',10);
svg(resume,'<path d="M56 157H668" stroke="#514e47" stroke-width="1"/>',724,1024);
for(const [j,title]of ['Experience','Projects','Skills','Education'].entries()){const y=192+j*180;text(resume,title.toUpperCase(),58,y,16,2,'pill/text',18);let rules='';for(let i=0;i<5;i++)rules+=`<path d="M58 ${y+44+i*18}H${i===4?472:660}" stroke="#514e47" stroke-width="2" opacity="${i===0?.65:.27}"/>`;svg(resume,rules,724,1024);}
text(resume,'PORTFOLIO RÉSUMÉ — CONTENT PREVIEW',58,958,11,2,'ink/graphite',12);
return {createdNodeIds:created,mutatedNodeIds:frames.map(f=>f.id),frames:frames.map(f=>({id:f.id,name:f.name,children:f.children.length})),fonts:fonts};
