import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
function glb(name:string) { const data=fs.readFileSync(`public/assets/${name}.glb`); assert.equal(data.readUInt32LE(0),0x46546c67);return JSON.parse(data.subarray(20,20+data.readUInt32LE(12)).toString()); }
const manifest=JSON.parse(fs.readFileSync('public/assets/journey.json','utf8'));
test('runtime has one travelling MacBook and no station duplicates',()=>{
 const hero=glb('macbook-journey');assert.equal(hero.animations.length,1);assert.equal(hero.nodes.filter((n:any)=>n.name==='Journey_TravelFeet').length,1);
 for(const station of manifest.stations){const j=glb(station.asset.replace('.glb',''));assert.ok(!j.nodes.some((n:any)=>/MacBook|SM_M5/.test(n.name)),station.id);}
});
test('phone retains physical surface and transparent wheel materials',()=>{
 const j=glb('station-contact');for(const e of ['KHR_materials_clearcoat','KHR_materials_transmission','KHR_materials_ior'])assert.ok(j.extensionsUsed.includes(e),e);
 const transmission=j.materials.find((m:any)=>m.extensions?.KHR_materials_transmission?.transmissionFactor===1);assert.ok(transmission);assert.equal(transmission.extensions.KHR_materials_ior.ior,1.4900000095367432);
});
test('camera samples and station transforms are finite and unit quaternions',()=>{
 assert.equal(manifest.travel.length,721);assert.equal(manifest.stations.length,7);
 for(const camera of [...manifest.travel,...manifest.stations.flatMap((s:any)=>[s.wide,s.close])]){
  assert.ok(camera.position.every(Number.isFinite));assert.ok(camera.width>0);assert.ok(Math.abs(Math.hypot(...camera.quaternion)-1)<1e-5);
 }
});
test('paper has one morph animation and no duplicated printed page in station',()=>{
 const paper=glb('printer-paper-feed');assert.equal(paper.animations.length,1);assert.ok(paper.animations[0].channels.some((c:any)=>c.target.path==='weights'));
 assert.ok(!glb('station-resume').nodes.some((n:any)=>/ResumePaperFeed|Resume_Page/.test(n.name)));
});

test('Resume and Contact use the same table layout with all three props',()=>{
 for(const name of ['station-resume','station-contact']){
  const nodes=glb(name).nodes;
  for(const root of ['Shared_Resume_Prop_Printer','Shared_Contact_Prop_RotaryTelephone','Shared_Contact_Notebook_Open'])assert.equal(nodes.filter((n:any)=>n.name===root).length,1,root);
  assert.equal(nodes.filter((n:any)=>n.name==='Shared_Resume_Desk_Station.Top').length,1);
 }
 assert.deepEqual(glb('station-resume'),glb('station-contact'));
});
