const notebook=component('Texture / Notebook pages · flat · 2048w',698.56,500.32);notebook.fills=paint('F4F1EA');png(notebook,2048);
const src=await figma.getNodeByIdAsync('44:5818');await fonts(src);
for(const n of src.children){if(['Rule','Margin'].includes(n.name)||n.type==='TEXT'){const c=n.clone();notebook.appendChild(c);recordTree(c);c.effects=[];}}
notebook.description='Flat page albedo, sRGB, opaque. 296 × 212 mm UV domain; authored page content 296 × 210 mm plus 2 mm lower strip to fit existing Blender UVs. Existing contact strings preserved. Cover, shadows, page-edge thickness, gutter shading and ribbon excluded.';
const resume=component('Texture / Resume page · flat · US Letter',648,648*279.4/215.9);resume.fills=paint('FFFFFF');png(resume,2048*215.9/279.4);
for(const id of ['55:7268','55:7269','55:7270']){const c=await clone(id,resume);c.x-=24;c.y-=24;c.effects=[];}
resume.exportSettings=[{format:'PNG',suffix:'',constraint:{type:'HEIGHT',value:2048}}];
resume.description='US Letter 215.9 × 279.4 mm. Current source content only: name, contact line, rule. No additional résumé claims. Flat opaque white sRGB albedo, no paper shadow.';
const p=panel('04 / Paper artwork','Actual unlit texture masters · current contact details preserved');
const row=stack(p,'Paper previews','HORIZONTAL',72);inst(notebook,row,1.6);inst(resume,row,.85);
txt(p,'Notebook: 2048 px wide · 296 × 212 mm UV coverage. Current handwriting is preserved, with no gutter lighting baked in.\nRésumé: 2048 px long edge · US Letter. Existing name and contact line are preserved; the source contains no experience/body copy.',23);
const mat=panel('05 / Materials','Shared production values · Blender Principled BSDF · flat color and texture references');
const swatches=stack(mat,'Material swatches','HORIZONTAL',32);
for(const [name,hex]of[['Silver aluminium','C9CBCE'],['Keys / black glass','1F1F23'],['Red phone','A3101A'],['Number plate','F4F1EA'],['Chrome','D7D8DC']]){const col=stack(swatches,name);rect(col,name,0,0,390,140,hex,12);txt(col,name+'\n#'+hex,23,390);}
txt(mat,'MacBook: silver #C9CBCE / metallic 1 / roughness 0.38. Keys #1F1F23 / roughness 0.55. Screen: black glass / roughness 0.05 / zero emission.\nPhone: albedo sRGB, roughness and OpenGL normal Non-Color. 25 mm tile repeat; mean roughness 0.22; normal strength 0.15; metallic 0; coat 1; coat roughness 0.05; IOR 1.5.\nAcrylic wheel: transmission 1 / roughness 0.05 / IOR 1.49. Chrome: #D7D8DC / metallic 1 / roughness 0.15.',23);
const maps=stack(mat,'Original 512² maps','HORIZONTAL',40);
for(const [id,title]of[['99:11028','Albedo · sRGB'],['99:11030','Roughness · Non-Color'],['99:11032','Normal · OpenGL +Y']]){const c=stack(maps,title);const m=await clone(id,c,title);m.resize(320,320);txt(c,title,23,640);}
txt(mat,'Source: 99:11025. Reuse original 512² images rather than resampling these presentation tiles. No PBR maps are needed for the solid pen finishes.',23);
await p.screenshot();
return {createdNodeIds:made,assets:{notebook:notebook.id,resume:resume.id},panels:[p.id,mat.id],paperText:notebook.findAllWithCriteria({types:['TEXT']}).map(t=>t.characters)};
