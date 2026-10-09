import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {notebookLayout,notebookContent,wrapNotebookText} from '../src/notebook-layout';
import {loadNotebookFont} from '../src/notebook-display';
const measure=(text:string,size:number)=>text.length*size*.44;
function notes(layout:ReturnType<typeof notebookLayout>){return layout.lines.filter(l=>l.x===140).map(l=>l.text).join(' ');}
test('desktop and mobile preserve all contribution text exactly',()=>{
 assert.equal(notes(notebookLayout('right',false,0,measure)),notebookContent.contributions.join(' '));
 assert.equal([1,2].map(p=>notes(notebookLayout('right',true,p,measure))).join(' '),notebookContent.contributions.join(' '));
});
test('measured browser layouts fit the margins and retain the exact copy',()=>{
 const reports=JSON.parse(fs.readFileSync(new URL('../../reference/compare/handwritten-notebook/layout-report.json',import.meta.url),'utf8'));
 const get=(id:string)=>reports.find((r:any)=>r.id===id).layout;
 assert.equal(notes(get('right')),notebookContent.contributions.join(' '));
 assert.equal(notes(get('mobile-notes-1'))+' '+notes(get('mobile-notes-2')),notebookContent.contributions.join(' '));
 for(const r of reports)assert.ok(r.layout.lines.every((l:any)=>l.y<1320&&l.x>=80));
 for(const key of ['role','dates','location'] as const)assert.ok(get('left').lines.some((l:any)=>l.text===notebookContent[key]));
 assert.ok(get('mobile-notes-1').lines.filter((l:any)=>l.x===140).every((l:any)=>l.size>=52));
});
test('achievement phrases stay together for pen highlights',()=>{
 const lines=wrapNotebookText('reducing export times by over 50%. covering 35+ functions',320,40,measure);
 assert.ok(lines.some(l=>l.includes('over 50%')));assert.ok(lines.some(l=>l.includes('35+ functions')));
});
test('font failure and timeout both select the readable fallback',async()=>{
 await assert.rejects(loadNotebookFont({load:async()=>[]}),/unavailable/);
 await assert.rejects(loadNotebookFont({load:async()=>{throw Error('network failure');}}),/network failure/);
 await assert.rejects(loadNotebookFont({load:()=>new Promise(()=>{})},5),/unavailable/);
});
