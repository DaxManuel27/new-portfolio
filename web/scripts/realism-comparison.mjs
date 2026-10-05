import sharp from 'sharp';
const root='/Users/daxmanuel/Documents/ChatGPT/portfolio-site-blender';const parts=[];
for(const [row,index,label] of [[0,4,'Laptop · glass and walnut'],[1,5,'Printer · molded plastic'],[2,6,'Contact · paper and pen']]){
 const title=Buffer.from(`<svg width="1200" height="44"><rect width="1200" height="44" fill="#171717"/><text x="18" y="29" font-family="sans-serif" font-size="19" fill="#eae5dd">${label}</text><text x="495" y="29" font-family="sans-serif" font-size="15" fill="#bdb4a6">Before</text><text x="1095" y="29" font-family="sans-serif" font-size="15" fill="#bdb4a6">After</text></svg>`);
 parts.push({input:title,left:0,top:row*444});for(const [col,phase] of [[0,'before'],[1,'after']])parts.push({input:await sharp(`${root}/web/test-results/realism/${phase}/desktop-${index}.png`).resize(600,400).toBuffer(),left:col*600,top:row*444+44});
}
await sharp({create:{width:1200,height:1332,channels:3,background:'#101010'}}).composite(parts).png().toFile(`${root}/blender/previews/photorealism/browser-comparison.png`);
