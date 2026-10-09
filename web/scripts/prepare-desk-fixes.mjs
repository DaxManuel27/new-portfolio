import sharp from 'sharp';
import {mkdir,copyFile} from 'node:fs/promises';
const root=new URL('../../',import.meta.url),dest=new URL('design/desk-fixes/',root);await mkdir(dest,{recursive:true});
await sharp(new URL('web/public/assets/hack-atlantic-hero.png',root).pathname).resize(2048,1352,{fit:'contain',background:'#e8b887'}).png().toFile(new URL('hack-landing.png',dest).pathname);
const svg=`<svg xmlns="http://www.w3.org/2000/svg" width="2048" height="848"><rect width="2048" height="848" fill="#121d21"/><text x="110" y="125" fill="#c9c3b4" font-family="monospace" font-size="25" letter-spacing="6">DAX MANUEL / SELECTED WORK</text><text x="110" y="400" fill="#efe9dd" font-family="Georgia" font-size="118">Personal projects</text><path d="M110 470H1938" stroke="#66716e" stroke-width="1"/><text x="110" y="575" fill="#c9c3b4" font-family="sans-serif" font-size="33">More to come.</text></svg>`;
await sharp(Buffer.from(svg)).png().toFile(new URL('personal-projects.png',dest).pathname);
for(const name of ['um-cover-front.png','um-page-left.png','um-page-right.png'])await copyFile(new URL('design/interactive-workspace/textures/'+name,root),new URL(name,dest));
