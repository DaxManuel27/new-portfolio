import content from './ultra-maritime.json';
export const notebookContent=content;
export const PAGE_WIDTH=1000, PAGE_HEIGHT=1420;
export type InkLine={text:string;x:number;y:number;size:number;underline?:boolean};
export type NotebookLayout={lines:InkLine[];sketch:boolean;pageNumber:string;side:'left'|'right'};
export type Measure=(text:string,size:number)=>number;
export function wrapNotebookText(text:string,maxWidth:number,size:number,measure:Measure){
 const lines:string[]=[];let line='';
 for(const word of (text.match(/over 50%\S*|35\+ functions\S*|\S+/g)??[])){const candidate=line?`${line} ${word}`:word;if(line&&measure(candidate,size)>maxWidth){lines.push(line);line=word;}else line=candidate;}
 if(line)lines.push(line);return lines;
}
export function notebookLayout(side:'left'|'right',mobile:boolean,page:number,measure:Measure):NotebookLayout{
 const lines:InkLine[]=[];const add=(text:string,x:number,y:number,size:number,underline=false)=>lines.push({text,x,y,size,underline});
 if(side==='left'){
  add('Ultra',110,324,100);add('Maritime',110,433,100,true);
  add(content.role,110,562,mobile?51:44);
  add(content.dates,110,632,mobile?50:42);add(content.location,110,701,mobile?50:42);
  return {lines,sketch:false,pageNumber:'01',side};
 }
 add('What I worked on',110,157,mobile?64:61,true);
 const entries=mobile?content.contributions.slice(page===2?2:0,page===2?4:2):content.contributions;
 const size=mobile?54:37,leading=mobile?72:52;let y=mobile?270:255;
 for(const text of entries){
  const wrapped=wrapNotebookText(text,755,size,measure);add('—',85,y,size);
  for(const line of wrapped){add(line,140,y,size);y+=leading;}
  y+=mobile?36:30;
 }
 if(y>1320)throw new Error('Notebook text exceeds page margins');
 return {lines,sketch:false,pageNumber:mobile?(page===2?'03':'02'):'02',side};
}
