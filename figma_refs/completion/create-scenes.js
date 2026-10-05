const pen=await figma.getNodeByIdAsync('112:11081');
const mutated=[];
for(const id of ['4:810','13:2882']){const n=await figma.getNodeByIdAsync(id);await fonts(n);if(id==='13:2882'){const old=await figma.getNodeByIdAsync('44:6050');old.visible=false;mutated.push(old.id);const v=inst(pen,n,264.279663/700);v.name='Pen / finished master';v.x=818.8;v.y=585.12;v.rotation=old.rotation;}else{const v=inst(pen,n,.235);v.name='Pen / finished master';v.x=1013;v.y=744;v.rotation=8;}}
// Remove old screen designs from current references, leaving underlying black glass.
const screens=figma.currentPage.findAll(n=>n.name==='Screen content'||/^Screen light on (desk|table)$/.test(n.name));
for(const n of screens){let p=n,old=false;while(p&&p.type!=='PAGE'){if(p.name.startsWith('_old'))old=true;p=p.parent;}if(old)continue;await fonts(n);n.visible=false;mutated.push(n.id);}
const contact=panel('06 / Contact station','Wide and close references · source 4:810 / 13:2882 · pen and links resolved');
const cr=stack(contact,'Contact views','HORIZONTAL',48);const cw=await scene('4:810',cr,'Contact / Wide · final',1100);const ct=await scene('13:2882',cr,'Contact / Bird’s-eye · final',1100);
txt(contact,'Top-down hero: notebook occupies 64% of the frame width. The MacBook is intentionally clipped at the left edge; the red phone enters at the right. Pen rests on the right page, leaving all four links unobstructed.',23);
txt(contact,'Metric layout / desk 1200 × 700 mm, top Z 740 mm. X right, Y toward back. MacBook centre (-280, 60), notebook (110, -160), phone (315, 145). Notebook cover 306 × 219 mm. Phone body 220 × 240 mm; route the cord in the right-side free strip and keep ≥20 mm from the notebook. Pen centre (170, -218), length 140 mm.',23);
const resume=panel('07 / Resume station','Wide and paper-focused bird’s-eye · source 4:775 / 55:7271');
const rr=stack(resume,'Resume views','HORIZONTAL',48);const rw=await scene('4:775',rr,'Resume / Wide · final',1100);const rt=await scene('55:7271',rr,'Resume / Bird’s-eye · final',1100);
txt(resume,'Metric layout / same 1200 × 700 mm desk at Z 740 mm. MacBook centre (-300, 45), printer (230, 140), page final centre (230, -120). Printer 300 mm wide. Letter page 215.9 × 279.4 mm, portrait, top edge toward printer. Page stays on the desk: lower edge Y -259.7 mm; ≥90 mm front margin.',23);
txt(resume,'Paper feed / travel along local -Y. Leading edge starts at Y +210 mm inside the printer, emerges at slot Y +19.7 mm, stops at Y -259.7 mm. The sheet becomes fully visible without detaching from its axis. Keep 2 mm above desk; no tabletop intersection. Hidden → 40% exposed → 100% exposed; stop and hold.',23);
await contact.screenshot();
return {createdNodeIdsByPrefix:packedIds(),mutatedNodeIds:mutated,panels:{contact:contact.id,resume:resume.id},scenes:{contactWide:cw.id,contactTop:ct.id,resumeWide:rw.id,resumeTop:rt.id},blankedScreenCount:screens.length};
