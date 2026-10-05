import {readFile,writeFile,copyFile} from 'node:fs/promises';
import sharp from 'sharp';
const root=new URL('../../',import.meta.url),shot=JSON.parse(await readFile(new URL('exports/continuous-pi/shot.json',root),'utf8'));
for(const dir of ['web/public/assets','exports/web']){
 const path=new URL(`${dir}/journey.json`,root),manifest=JSON.parse(await readFile(path,'utf8'));
 manifest.reorder.car.dataShot=shot;await writeFile(path,JSON.stringify(manifest));
 await sharp(new URL('exports/continuous-pi/raspberry-pi-5.png',root).pathname).webp({quality:94}).toFile(new URL(`${dir}/raspberry-pi-5.webp`,root).pathname);
}
await copyFile(new URL('exports/continuous-pi/raspberry-pi-5.png',root),new URL('exports/fsae-details/raspberry-pi-5.png',root));
