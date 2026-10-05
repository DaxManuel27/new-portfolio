import fs from 'node:fs';import {evaluate,phases,totalUnits} from '../src/journey.ts';import {evaluateCamera} from '../src/camera.ts';import {fsaeFocus} from '../src/fsae-focus.ts';
const m=JSON.parse(fs.readFileSync('public/assets/journey.json','utf8'));const rows=[];
for(const kind of ['data-dive','data-isolate','data-reveal','data-hold','data-return'])for(const local of [.1,.3,.5,.7,.9]){const phase=phases.find(p=>p.kind===kind);const state={...evaluate((phase.start+.1)/totalUnits),phase,local};rows.push({kind,local,pose:evaluateCamera(m,state,1.5).pose,focus:fsaeFocus(state)});}
fs.writeFileSync('../exports/continuous-pi/review-poses.json',JSON.stringify(rows,null,2));
