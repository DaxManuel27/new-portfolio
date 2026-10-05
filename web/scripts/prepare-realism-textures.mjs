// Fine surface maps are generated deterministically; photographic wood/HDRI
// sources and their CC0 provenance are recorded alongside the output.
import sharp from 'sharp';
import { mkdir, copyFile, writeFile } from 'node:fs/promises';
const out = '../assets/textures/photoreal';
await mkdir(out, { recursive: true });
for (const [source, name] of [['T_MacBookPro_Silver_Normal_Hero.png','aluminum-normal.png'],['T_MacBookPro_Silver_Roughness.png','aluminum-roughness.png']]) {
  await sharp(`../assets/textures/devices/${source}`).resize(1024,1024).png().toFile(`${out}/${name}`);
}
await sharp(`${out}/walnut_color_2k.png`).resize(1024,1024).png().toFile(`${out}/walnut-color.png`);
await sharp(`${out}/walnut_normal_2k.png`).resize(1024,1024).png().toFile(`${out}/walnut-normal.png`);
const wood = await sharp(`${out}/walnut_roughness_2k.png`).resize(1024,1024).greyscale().raw().toBuffer();
for (let i=0;i<wood.length;i++) wood[i] = Math.round(255*(.32+.2*wood[i]/255));
await sharp(wood,{raw:{width:1024,height:1024,channels:1}}).png().toFile(`${out}/walnut-roughness.png`);

const n = 512;
for (const [name, center, variance, normalAmplitude] of [['plastic',.43,.035,.025],['paper',.78,.025,.015],['laminate',.48,.025,.018],['trackpad',.4,.022,.008]]) {
  const noise = Buffer.alloc(n*n); let seed = 8142;
  for(let i=0;i<noise.length;i++) { seed = (Math.imul(seed,1664525)+1013904223)>>>0; noise[i]=seed>>>24; }
  const height = await sharp(noise,{raw:{width:n,height:n,channels:1}}).blur(.6).raw().toBuffer();
  const normal=Buffer.alloc(n*n*3),rough=Buffer.alloc(n*n);
  for(let y=0;y<n;y++)for(let x=0;x<n;x++) {
    const i=y*n+x,dx=(height[y*n+(x+1)%n]-height[y*n+(x+n-1)%n])/255;
    const dy=(height[((y+1)%n)*n+x]-height[((y+n-1)%n)*n+x])/255;
    normal[i*3]=Math.round(128-dx*255*normalAmplitude);normal[i*3+1]=Math.round(128-dy*255*normalAmplitude);normal[i*3+2]=255;
    // A faint, localized handling mark on the full-trackpad map.
    const handling=name==='trackpad' ? .028*Math.exp(-(((x/n-.67)/.13)**2+((y/n-.39)/.19)**2))*(.5+.5*Math.cos(Math.hypot(x/n-.67,y/n-.39)*500)) : 0;
    rough[i]=Math.round(255*(center+variance*(height[i]/255-.5)+handling));
  }
  await sharp(normal,{raw:{width:n,height:n,channels:3}}).png().toFile(`${out}/${name}-normal.png`);
  await sharp(rough,{raw:{width:n,height:n,channels:1}}).png().toFile(`${out}/${name}-roughness.png`);
}
await copyFile(`${out}/studio_small_09_1k.hdr`, 'public/assets/studio-small-09.hdr');
await writeFile(`${out}/surface-config.json`,JSON.stringify({aluminum:{tileMeters:.02},plastic:{tileMeters:.035},paper:{tileMeters:.025},laminate:{tileMeters:.08},trackpad:{mapping:'entire local surface'},wood:{tileMeters:1.5,finish:'walnut veneer, smooth satin varnish'},normalConvention:'OpenGL tangent space; no displacement',textureResolution:{wood:1024,aluminum:1024,otherSurfaces:512}},null,2));
console.log('Prepared physically scaled microdetail maps and CC0 walnut/environment assets.');
