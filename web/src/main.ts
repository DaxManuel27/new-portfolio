import {createUltraContent} from './ultra-screen';
import {createHackAtlanticSection,hackStoryView} from './hack-atlantic';
import ultraMaritime from './ultra-maritime.json';
import './style.css';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { evaluate, IDS, NAMES, phases, stationProgress, totalUnits, clamp } from './journey';
import { PortfolioScene } from './scene';
import type { Manifest } from './types';
import { PrintJob } from './print-job';
import { SCROLL_DISTANCE_MULTIPLIER, smoothScrollProgress } from './scroll-pacing';
import { PROJECTS } from './projects';
import { cardLayout, reelView, expandContactWindow, type ReelView } from './reel';
import { fsaeFocus, detailTextItems } from './fsae-focus';

import { FSAE_PROJECTS } from './fsae-projects';
import { reducedStills } from './reduced-stills';

gsap.registerPlugin(ScrollTrigger); ScrollTrigger.config({ ignoreMobileResize: true, autoRefreshEvents: 'visibilitychange,DOMContentLoaded,load' });
const el = <T extends HTMLElement>(id: string) => document.getElementById(id) as T;
const canvas = el<HTMLCanvasElement>('scene'), space = el('scroll-space'), loading = el('loading');
const poster = el<HTMLImageElement>('poster'), label = el('loading-label'), hint = el('hint');
const reduced = matchMedia('(prefers-reduced-motion: reduce)');
const printJob = new PrintJob(), printControls = el('print-controls');
const printButton = el<HTMLButtonElement>('print-resume');
printButton.setAttribute('aria-describedby', 'print-status');
let printHovered = false, printFocused = false;
let printPointer: { id: number; x: number; y: number; scroll: number; cancelled: boolean } | undefined;
let staticMode = false, scene: PortfolioScene | undefined, manifest: Manifest, trigger: ScrollTrigger | undefined;
let targetProgress = 0, lastMotionFrame = 0, resizeTarget = 0;
let progress = 0, queued = false, vh = innerHeight, lastWidth = innerWidth, generation = 0;
history.scrollRestoration = 'manual';
const restoredProgress = history.state?.portfolioProgress;
let initial = true, resizeTimer = 0, resizing = false, resizeProgress = 0;
let historyTimer = 0, lastHistoryWrite = 0;
function saveProgress(force = false) {
  clearTimeout(historyTimer);
  const remaining = 500 - (performance.now() - lastHistoryWrite);
  if (!force && remaining > 0) { historyTimer = window.setTimeout(() => saveProgress(true), remaining); return; }
  history.replaceState({ ...history.state, portfolioProgress: targetProgress }, ''); lastHistoryWrite = performance.now();
}
const params = new URLSearchParams(location.search), reviewMode = params.has('review');
const scrub = el<HTMLInputElement>('scrub'), chapter = el<HTMLSelectElement>('chapter');
for (let i = 0; i < IDS.length; i++) {
  const opt = new Option(NAMES[i], String(i)); chapter.append(opt);
  const figure = document.createElement('figure'); figure.id = 'still-' + IDS[i];
  const caption = document.createElement('figcaption'); caption.textContent = NAMES[i];
  if (IDS[i] === 'projects') {
    const screen = document.createElement('figure'); screen.id = 'still-ultrawide';
    const image = new Image(); image.src = `${import.meta.env.BASE_URL}assets/ultrawide.webp`; image.alt = 'Personal Projects: Formula SAE display model on the desk, with a Personal Projects monitor title card, a 60% mechanical keyboard, and a mouse'; image.loading = 'lazy';
    const text = document.createElement('figcaption'); text.textContent = 'Personal projects'; const frame=document.createElement('div');frame.className='projects-still-frame';
    const from=new Image();from.src=`${import.meta.env.BASE_URL}assets/formula-sae.webp`;from.alt='';from.setAttribute('aria-hidden','true');from.className='projects-still-from';frame.append(image,from);screen.append(frame,text);el('stills').append(screen);
    // Projects is a reel of cards, so the still view lists them instead of showing a render.
    const list = document.createElement('ol'); list.className = 'project-list';
    for (const [index, project] of PROJECTS.entries()) { const item = document.createElement('li'); item.textContent = project.title; if(!project.title)item.setAttribute('aria-label', `Project placeholder ${index+1}`); list.append(item); }
    const contact=document.createElement('a');contact.className='contact-still-entry';contact.href='#accessible-contact';contact.innerHTML=`<div class="contact-still-frame"><img src="${import.meta.env.BASE_URL}assets/resume-contact-preview.webp" alt="Desk with rotary phone, notebook and printer" loading="lazy"><img class="contact-still-end" src="${import.meta.env.BASE_URL}assets/resume.webp" alt="" aria-hidden="true" loading="lazy"></div><span>Resume &amp; contact</span>`;
    const heading=document.createElement('h2');heading.textContent='Personal projects';
    figure.append(heading,list,contact);
  } else {
    const img = new Image(); img.src = `${import.meta.env.BASE_URL}assets/${IDS[i]}.webp`; img.alt = `${NAMES[i]} portfolio scene`; img.loading = 'lazy';
    figure.append(img, caption);
  }
  el('stills').append(figure);
  if (i === 5) {
    const controls = document.createElement('div'); controls.className = 'resume-controls';
    const button = document.createElement('button'); button.dataset.resumePrint = ''; button.textContent = 'Print Resume';
    const status = document.createElement('span'); status.dataset.printStatus = ''; status.setAttribute('role', 'status'); status.setAttribute('aria-live', 'polite');
    controls.append(button, status); figure.append(controls);
  }
}
const hackStory=document.createElement('div');hackStory.id='hack-story';hackStory.hidden=true;hackStory.inert=true;
const hackContent=createHackAtlanticSection();hackStory.append(hackContent);el('stage').append(hackStory);
// The existing 3D MacBook is the frame. Its display contains the website and recap.
const hackHeroImage=hackContent.querySelector<HTMLImageElement>('.ha-laptop img')!;
hackContent.querySelector('.ha-hero')!.replaceChildren(hackHeroImage);
const hackStill=createHackAtlanticSection();el('still-hack-atlantic').replaceChildren(hackStill);
function updateHackStory(state:ReturnType<typeof evaluate>){
 const active=state.phase.station===1&&['approach','hold','hack-story','exit'].includes(state.phase.kind);hackStory.hidden=!active;hackStory.inert=!active;
 if(!active)return;
 const frame=scene?.hackScreenProjection();if(!frame){hackStory.hidden=true;return;}
 const width=1200,height=width/frame.aspect,{a,b,c}=frame;
 hackStory.style.height=`${height}px`;
 hackStory.style.setProperty('--screen-height',`${height}px`);
 hackStory.style.transform=`matrix(${(b.x-a.x)/width},${(b.y-a.y)/width},${(c.x-a.x)/height},${(c.y-a.y)/height},${a.x},${a.y})`;
 const view=hackStoryView(state,hackContent.offsetHeight,height);
 const opacity=state.phase.kind==='approach'?clamp(state.local/.3):state.phase.kind==='exit'?1-clamp(state.local/.3):1;
 hackStory.style.opacity=String(opacity);
 const y=state.phase.kind==='exit'?-Math.max(0,hackContent.offsetHeight-height):state.phase.kind==='hack-story'?view.y:0;
 hackContent.style.transform=`translateY(${y}px)`;
}
const ultraCopy=createUltraContent();ultraCopy.id='accessible-ultra-maritime';
const ultraSource=createUltraContent();ultraSource.id='ultra-screen-source';ultraSource.setAttribute('aria-hidden','true');ultraSource.inert=true;document.body.append(ultraSource);
void document.fonts.ready.then(()=>{ultraSource.dataset.revision=String(Date.now());requestFrame();});
el('still-ultra-maritime').append(ultraCopy);
const ultraRead=document.createElement('button');ultraRead.id='ultra-read';ultraRead.textContent='Read experience';ultraRead.hidden=true;el('stage').append(ultraRead);
const ultraDialog=document.createElement('dialog');ultraDialog.id='ultra-experience';ultraDialog.setAttribute('aria-label','Ultra Maritime experience');
const ultraClose=document.createElement('button');ultraClose.textContent='Close';ultraClose.addEventListener('click',()=>ultraDialog.close());
const ultraDialogCopy=ultraCopy.cloneNode(true) as HTMLElement;ultraDialogCopy.removeAttribute('id');ultraDialog.append(ultraClose,ultraDialogCopy);document.body.append(ultraDialog);
ultraRead.addEventListener('click',()=>ultraDialog.showModal());
const focusPanel=document.createElement('section');focusPanel.id='fsae-detail';focusPanel.hidden=false;
const accessibleFsae=document.createElement('section');accessibleFsae.id='accessible-fsae';
for(const [id,project] of Object.entries(FSAE_PROJECTS)){
 const article=document.createElement('article');article.dataset.project=id;article.hidden=false;
 article.innerHTML=`<h1>${project.title}</h1><p class="fsae-subtitle">${project.subtitle}</p><div class="fsae-description">${project.description.map(text=>`<p>${text}</p>`).join('')}</div>`;
 focusPanel.append(article);
 const section=document.createElement('section');section.id='static-'+project.hash;section.className='fsae-static';
 section.innerHTML=`<div class="pi-still-frame"><img class="pi-still-to" src="${import.meta.env.BASE_URL}assets/${project.poster}" alt="${project.subtitle}" loading="lazy"><img class="pi-still-from" src="${import.meta.env.BASE_URL}assets/formula-sae.webp" alt="" aria-hidden="true" loading="lazy"></div><div><h2>${project.title}</h2><p class="fsae-subtitle">${project.subtitle}</p>${project.description.map(text=>`<p>${text}</p>`).join('')}</div>`;
 accessibleFsae.append(section);
}
el('stage').append(focusPanel);el('still-formula-sae').after(accessibleFsae);
const focusPoster=new Image();focusPoster.id='fsae-poster';focusPoster.hidden=true;el('stage').append(focusPoster);
function updateFsae(state:ReturnType<typeof evaluate>){
 const focus=fsaeFocus(state),show=!!focus.project&&focus.textOpacity>0;
 // Opacity keeps the one text panel in reading order even before its visual reveal.
 focusPanel.style.opacity=focus.project?'1':'0';focusPanel.style.pointerEvents=show?'auto':'none';
 const items=detailTextItems(focus.reveal,reduced.matches||staticMode);
 for(const article of focusPanel.querySelectorAll<HTMLElement>('article')){
  [...article.children].forEach((child,i)=>{const item=items[i];const node=child as HTMLElement;node.style.opacity=String(item.opacity);node.style.transform=`translateY(${item.y}px)`;});
  for(const link of article.querySelectorAll('a'))link.tabIndex=focus.reveal>.99?0:-1;
 }
 const fallback=!!focus.project&&focus.detailOpacity>0&&!scene?.diagnostics().detailReady;
 focusPoster.hidden=!fallback;
 if(focus.project){const project=FSAE_PROJECTS[focus.project];focusPoster.src=`${import.meta.env.BASE_URL}assets/${project.poster}`;focusPoster.alt=project.subtitle;focusPoster.style.opacity=String(focus.detailOpacity);}
}
const stillFades = reducedStills(el('stills'));
function paintPiStill(){
 const frame=document.querySelector<HTMLElement>('.pi-still-frame'),from=document.querySelector<HTMLElement>('.pi-still-from'),to=document.querySelector<HTMLElement>('.pi-still-to');if(!frame||!from||!to)return;
 const p=clamp((innerHeight*.8-frame.getBoundingClientRect().top)/(innerHeight*.4)),fade=p*p*(3-2*p);
 from.style.opacity=String(1-fade);to.style.opacity=String(fade);
}
window.addEventListener('scroll',paintPiStill,{passive:true});window.addEventListener('resize',paintPiStill);

function paintProjectsStill(){
 const frame=document.querySelector<HTMLElement>('.projects-still-frame'),from=document.querySelector<HTMLElement>('.projects-still-from');if(!frame||!from)return;
 const p=clamp((innerHeight*.9-frame.getBoundingClientRect().top)/(innerHeight*.55));from.style.opacity=String(1-p);
}
function paintContactStill(){const frame=document.querySelector<HTMLElement>('.contact-still-frame'),end=document.querySelector<HTMLElement>('.contact-still-end');if(frame&&end)end.style.opacity=String(clamp((innerHeight*.45-frame.getBoundingClientRect().top)/(innerHeight*.2)));}
window.addEventListener('scroll',paintContactStill,{passive:true});window.addEventListener('resize',paintContactStill);
window.addEventListener('scroll',paintProjectsStill,{passive:true});window.addEventListener('resize',paintProjectsStill);

function updatePrintControls() {
  const printing = printJob.status === 'printing', printed = printJob.status === 'printed';
  for (const button of document.querySelectorAll<HTMLButtonElement>('[data-resume-print]')) {
    const disabled = printJob.status !== 'idle', text = button === printButton ? 'Print Resume' : printed ? 'Printed' : printing ? 'Printing…' : 'Print Resume';
    if (button.disabled !== disabled) button.disabled = disabled;
    if (button.textContent !== text) button.textContent = text;
  }
  for (const status of document.querySelectorAll<HTMLElement>('#print-status, [data-print-status]')) {
    const message = printed ? 'Placeholder resume printed.' : printing ? 'Printing a placeholder resume…' : '';
    if (status.textContent !== message) status.textContent = message;
  }
  const still = document.querySelector<HTMLImageElement>('#still-resume img')!;
  const src = `${import.meta.env.BASE_URL}assets/${printed ? 'resume-printed' : 'resume'}.webp`;
  if (still.getAttribute('src') !== src) still.src = src;
}
function startPrint() {
  if (printJob.status !== 'idle') return;
  const phase = evaluate(progress).phase;
  if (!staticMode && (phase.station !== 5 || phase.kind !== 'hold' || printControls.hidden || !scene?.ready || !scene.printControlProjection()?.visible || resizing)) return;
  printJob.start(staticMode); updatePrintControls(); requestFrame();
}
for (const button of document.querySelectorAll<HTMLButtonElement>('[data-resume-print]')) button.addEventListener('click', event => {
  if (button === printButton && event.detail > 0 && (!printPointer || printPointer.cancelled)) { event.preventDefault(); return; }
  startPrint();
});
function printInteractionChanged() {
  printControls.classList.toggle('is-hovered', printHovered); printControls.classList.toggle('is-focused', printFocused);
  scene?.setPrintInteraction(printHovered, printFocused); requestFrame();
}
printButton.addEventListener('pointerenter', event => { if (event.pointerType !== 'touch') { printHovered = true; printInteractionChanged(); } });
printButton.addEventListener('pointerleave', () => { printHovered = false; printInteractionChanged(); });
printButton.addEventListener('focus', () => { printFocused = true; printInteractionChanged(); });
printButton.addEventListener('blur', () => { printFocused = false; printInteractionChanged(); });
printButton.addEventListener('pointerdown', event => {
  printPointer = { id: event.pointerId, x: event.clientX, y: event.clientY, scroll: window.scrollY, cancelled: !event.isPrimary || event.button !== 0 };
});
function trackPrintPointer(event: PointerEvent) {
  if (printPointer?.id === event.pointerId && (Math.hypot(event.clientX - printPointer.x, event.clientY - printPointer.y) > 8 || Math.abs(window.scrollY - printPointer.scroll) > 2)) printPointer.cancelled = true;
}
document.addEventListener('pointermove', trackPrintPointer, { passive: true });
document.addEventListener('pointerup', trackPrintPointer, { passive: true });
document.addEventListener('pointercancel', event => { if (printPointer?.id === event.pointerId) printPointer.cancelled = true; }, { passive: true });
window.addEventListener('scroll', () => { if (printPointer && Math.abs(window.scrollY - printPointer.scroll) > 2) printPointer.cancelled = true; }, { passive: true });
// Opening loader: counts 0–100 from real download progress, reaches 100 only once the first frame is drawn.
const boot = el('boot'), bootCount = el('boot-count'), bootBar = el('boot-bar');
let booting = true, bootReady = false, bootShown = 0, bootDone = 0;
const bootStart = performance.now();
function bootTarget() {
  if (bootReady) return 100;
  if (!manifest) return 0;
  return Math.min(99, 4 + 95 * (scene?.downloadProgress() ?? 0));
}
function finishBoot(immediate = false) {
  if (!booting) return;
  booting = false; boot.setAttribute('aria-valuenow', '100');
  if (immediate) { boot.hidden = true; return; }
  boot.classList.add('done'); window.setTimeout(() => { boot.hidden = true; }, 800);
}
function tickBoot(now: number) {
  if (!booting) return;
  // Count at a readable pace even when everything is cached: at most 100 in ~0.9 s.
  const goal = Math.min(bootTarget(), (now - bootStart) / 9);
  if (goal > bootShown) bootShown = Math.min(goal, bootShown + Math.max(.35, (goal - bootShown) * .16));
  const value = bootReady && bootShown >= 99.5 ? 100 : Math.min(99, Math.floor(bootShown));
  if (bootCount.textContent !== String(value)) { bootCount.textContent = String(value); boot.setAttribute('aria-valuenow', String(value)); }
  bootBar.style.transform = `scaleX(${(bootShown / 100).toFixed(4)})`;
  if (value === 100) { if (!bootDone) bootDone = now; if (now - bootDone > 280) { finishBoot(); return; } }
  requestAnimationFrame(tickBoot);
}
requestAnimationFrame(tickBoot);
const introName = el('intro-name');
// The name holds through the opening and fades out early in the first flight.
function updateIntroName(state: ReturnType<typeof evaluate>) {
  const { kind, station } = state.phase;
  const opacity = kind === 'intro' ? 1 : kind === 'travel' && station === 1 ? 1 - Math.min(1, state.local / .22) : 0;
  const value = opacity.toFixed(3);
  if (introName.style.opacity !== value) introName.style.opacity = value;
  introName.style.visibility = opacity > 0 ? 'visible' : 'hidden';
}
const notebookNav = el('notebook-links');
function positionNotebookLinks(showPoster: boolean) {
  const projected = showPoster ? [] : scene?.notebookLinkProjection() ?? [];
  const stage = el('stage').getBoundingClientRect();
  let any = false;
  for (const anchor of notebookNav.querySelectorAll<HTMLAnchorElement>('[data-notebook-link]')) {
    const link = projected.find(item => item.id === anchor.dataset.notebookLink);
    anchor.hidden = !link?.visible;
    if (!link?.visible) continue;
    any = true;
    // Keep a usable target centred on the handwriting without overlapping the next ruled line.
    const width = Math.max(44, link.width), height = Math.max(24, link.height);
    anchor.style.left = `${link.left + link.width / 2 - width / 2 - stage.left}px`; anchor.style.top = `${link.top + link.height / 2 - height / 2 - stage.top}px`;
    anchor.style.width = `${width}px`; anchor.style.height = `${height}px`;
  }
  notebookNav.hidden = !any;
  el('model-credits').hidden = evaluate(progress).phase.station !== 6;
}
function positionPrintControl(showPoster: boolean) {
  const control = scene?.printControlProjection();
  printControls.hidden = showPoster || !control?.visible;
  if (printControls.hidden || !control) return;
  const stage = el('stage').getBoundingClientRect();
  printControls.style.left = `${control.x - stage.left}px`; printControls.style.top = `${control.y - stage.top}px`;
  printControls.style.width = `${control.width}px`; printControls.style.height = `${control.height}px`;
}

// Projects reel: DOM cards driven by the same journey state as the 3D scene.
const reel = el('reel'), reelTrack = el('reel-track'), reelHeading = el('reel-heading');
const reelHint = el('reel-hint'), reelAnnouncement = el('reel-announcement');
let announcedReelIndex = -1;
const reelCards = [...PROJECTS.map(project => project.title), 'Resume & contact'].map((title, index) => {
  const card = document.createElement('li'); card.className = 'reel-card' + (index===PROJECTS.length ? ' reel-card--next' : '');
  const media = document.createElement('div'); media.className = 'reel-media'; media.setAttribute('aria-hidden', 'true');
  const source = PROJECTS[index]?.media;
  if (source) { const image = new Image(); image.src = source; image.alt = ''; media.append(image); }
  card.append(media);
  if (title) {
    const name = document.createElement('span'); name.className = 'reel-name'; name.textContent = title;
    card.append(name);
  }
  if(index===PROJECTS.length)card.setAttribute('aria-label','Next: resume and contact');
  else if(!title)card.setAttribute('aria-label',`Project placeholder ${index+1}`);
  reelTrack.append(card); return card;
});
let reelSize = { cw: 0, ch: 0 }, reelCanvas = '';
function reelMetrics() {
  const ch = Math.min(innerHeight * .56, 620), cw = Math.min(ch * .74, innerWidth * .62);
  return { cw, ch: Math.min(ch, cw / .74) };
}
/** Position headline, cards and frame for a reel view (DOM only). */
function layoutReel(view: ReelView, handoff: number) {
  const count = PROJECTS.length, { cw, ch } = reelMetrics();
  if (cw !== reelSize.cw || ch !== reelSize.ch) { reelSize = { cw, ch }; reel.style.setProperty('--cw', `${cw}px`); reel.style.setProperty('--ch', `${ch}px`); }
  reel.style.opacity = view.opacity.toFixed(3);
  reelCards.forEach((card, index) => {
    const layout = cardLayout(index - view.position), desk = index === count;
    if(desk){for(const property of ['left','top','margin','width','height','visibility'])card.style.removeProperty(property);}
    const fade = desk ? 1 : view.chrome;
    if(desk){card.style.background='transparent';card.style.borderColor=`rgba(255,255,255,${.09*(1-Math.min(1,handoff/.3))})`; (card.querySelector('.reel-name') as HTMLElement).style.opacity=String(1-Math.min(1,handoff/.3));}
    const mobile=innerWidth<=700,late=clamp(view.position-(count-2)),distance=clamp(count-view.position);
    const x=mobile?(desk?layout.x*(1-.46*late):layout.x-.26*late*distance):layout.x;
    const scale=mobile&&desk?layout.scale-.22*late*distance:layout.scale;
    card.style.transform = `translate3d(${(x * cw).toFixed(1)}px,0,0) scale(${scale.toFixed(4)})`;
    card.style.opacity = ((desk?1:layout.opacity) * fade).toFixed(3); card.style.zIndex = String(layout.z);
  });
  (reelHeading.parentElement as HTMLElement).style.transform=`translateX(${-40*(1-view.chrome)}px)`;
  (reelHeading.parentElement as HTMLElement).style.opacity = view.chrome.toFixed(3);
  reelHint.style.opacity = (view.chrome * Math.max(0, 1 - view.position * 2)).toFixed(3);
  el('reel-frame').style.transform=innerWidth<=700?`translateX(${-cw*.26*clamp(view.position-(count-2))*clamp(count-view.position)}px)`:'';
  el('reel-frame').style.opacity = (1 - Math.min(1, handoff / .3)).toFixed(3);
}
// The ultrawide shows the reel's first frame on its curved glass: lay the reel out invisibly at
// that frame, let the scene paint it into the display texture, then restore the live state.
let reelFonts = false;
void document.fonts?.ready.then(() => { reelFonts = true; requestFrame(); });
function paintReelPreview() {
  if (!reelFonts) return;
  const key = `personal-projects-v1|${innerWidth}x${innerHeight}@${devicePixelRatio}|${PROJECTS.map(p => p.title + (p.media ?? '')).join('|')}|${reelFonts ? 'fonts' : 'pending'}`;
  if (!scene?.needsReelPreview(key)) return;
  const hidden = reel.hidden, visibility = reel.style.visibility;
  reel.hidden = false; reel.style.visibility = 'hidden';
  layoutReel(reelView({ phase: { kind: 'reel', station: 4, start: 0, end: 1 }, local: 0 }, PROJECTS.length), 0);
  scene.paintReelPreview(reel, el('stage'), key);
  reel.hidden = hidden; reel.style.visibility = visibility;
}
/** Width of the title's top line as a fraction of the window (desktop). The car is drawn over its end. */
const FSAE_TITLE_WIDTH = .72;
// "UNB Formula Racing": size the two lines to end just left of the car at the overview camera,
// then let the scene paint the title onto a card behind the car (seen on the FSAE monitor and full screen).
const fsaeTitle = el('fsae-title');
function paintFsaeTitle() {
  const key = `${innerWidth}x${innerHeight}|${reelFonts ? 'fonts' : 'pending'}`;
  if (!scene?.needsFsaeTitle(key)) return;
  const lines = [...fsaeTitle.querySelectorAll<HTMLElement>('.first, .last')], phone = innerWidth <= 700;
  fsaeTitle.style.setProperty('--fsae-title-size', '100px');
  const widths = lines.map(line => line.getBoundingClientRect().width / 100), left = fsaeTitle.getBoundingClientRect().left;
  // Like the intro name: big on the left, with the car drawn over the part of the text that runs under it. The callout
  // labels sit in front of the car, so the title drops below any label it would meet, and only shrinks if needed.
  let size = phone ? (innerWidth * .88) / widths[0] : Math.min(innerWidth * FSAE_TITLE_WIDTH / widths[0], innerHeight * .25);
  let top = phone ? innerHeight * .09 : innerHeight * .11;
  if (!phone) {
    const gap = innerHeight * .025;
    // Below any callout label it would meet (labels sit in front of the car and move with it).
    const placeBelowLabels = () => {
      const labels = scene!.fsaeLabelRects();
      top = innerHeight * .11;
      for (let pass = 0; pass < 6; pass++) {
        fsaeTitle.style.setProperty('--fsae-title-size', `${size}px`); fsaeTitle.style.setProperty('--fsae-title-top', `${top}px`);
        const r = fsaeTitle.getBoundingClientRect();
        const hit = labels.filter(l => r.left < l.right + gap && r.right > l.left - gap && r.top < l.bottom + gap && r.bottom > l.top - gap);
        if (!hit.length) return true;
        const below = Math.max(...hit.map(l => l.bottom + gap));
        if (below + r.height < innerHeight * .92 && below > top - 1) top = Math.ceil(below) + 1; else return false;
      }
      return true;
    };
    // The car moves down and right so it covers at most the last two letters of the top line and none of RACING.
    const textNode = lines[0].firstChild as Text, range = document.createRange();
    const allowed = () => {
      range.setStart(textNode, textNode.length - 2); range.setEnd(textNode, textNode.length - 1);
      return [range.getBoundingClientRect().left, lines[1].getBoundingClientRect().right + innerWidth * .02];
    };
    const down = innerHeight * .035;
    let shift = innerWidth * .03;
    for (let attempt = 0; attempt < 8; attempt++) {
      for (let pass = 0; pass < 4; pass++) {
        scene.setCarShift(shift, down);
        if (!placeBelowLabels()) break;
        const bands = lines.map(line => { const r = line.getBoundingClientRect(); return [r.top, r.bottom] as [number, number]; });
        const edges = scene.fsaeObstacleEdges(bands, false, true), limits = allowed();
        const need = Math.max(0, ...limits.map((limit, i) => Number.isFinite(edges[i]) ? limit - edges[i] : 0));
        if (need < 1) break;
        shift += need;
      }
      // Keep the whole car on screen; if it cannot move far enough, use a slightly smaller title.
      if (scene.fsaeBodyRight() <= innerWidth * .97) break;
      size *= .94; shift = innerWidth * .03;
    }
  }
  fsaeTitle.style.setProperty('--fsae-title-top', `${top}px`);
  fsaeTitle.style.setProperty('--fsae-title-size', `${size.toFixed(2)}px`);
  // Match the role line to R-A-C-I-N, leaving the G outside its right edge.
  const role=fsaeTitle.querySelector<HTMLElement>('.fsae-role')!,racing=lines[1].firstChild!;
  const roleRange=document.createRange();roleRange.setStart(racing,0);roleRange.setEnd(racing,5);
  const roleWidth=roleRange.getBoundingClientRect().width;
  role.style.fontSize='100px';
  let roleSize=100;
  for(let fit=0;fit<4;fit++){roleSize*=roleWidth/role.getBoundingClientRect().width;role.style.fontSize=`${roleSize}px`;}
  scene.paintFsaeTitle(fsaeTitle, key);
}
function updateReel(state: ReturnType<typeof evaluate>) {
  const count = PROJECTS.length, view = reelView(state, count), c = view.canvas;
  reel.hidden = !view.visible;
  layoutReel(view,c.expand);
  scene?.setContactWindow(undefined);
  let css='';
  if(c.mode==='card'){
    // One layout read supplies the clip, projection and scissor for this frame.
    const card=reelCards[count],bounds=card.getBoundingClientRect();
    const rect=expandContactWindow({x:bounds.x,y:bounds.y,width:bounds.width,height:bounds.height,radius:8*bounds.width/reelMetrics().cw},{width:innerWidth,height:innerHeight},c.expand);
    const visible=cardLayout(count-view.position).opacity>0&&rect.x<innerWidth&&rect.x+rect.width>0;
    card.style.visibility=visible?'visible':'hidden';
    if(visible){
      scene?.setContactWindow(rect);
      css=`clip-path:inset(${rect.y}px ${innerWidth-rect.x-rect.width}px ${innerHeight-rect.y-rect.height}px ${rect.x}px round ${rect.radius}px)`;
      if(c.expand>0){card.style.transform='none';card.style.left=`${rect.x}px`;card.style.top=`${rect.y}px`;card.style.margin='0';card.style.width=`${rect.width}px`;card.style.height=`${rect.height}px`;}
    } else css='visibility:hidden';
  } else if(c.mode==='hidden')css='visibility:hidden';
  else if(c.opacity<1)css=`opacity:${c.opacity}`;
  if(css!==reelCanvas){reelCanvas=css;canvas.style.cssText=css;}
  if(!view.visible){announcedReelIndex=-1;return;}
  const active=Math.round(view.position);
  if(active!==announcedReelIndex){announcedReelIndex=active;reelAnnouncement.textContent=active<count?`${PROJECTS[active].title || 'Project placeholder'}, ${active+1} of ${count}`:'Next: resume and contact';}
}
el('review').hidden = !reviewMode;
if(reviewMode){
 const exportArtwork=document.createElement('button');exportArtwork.textContent='Prepare UM artwork';
 const downloadArtwork=document.createElement('a');downloadArtwork.id='ultra-artwork-download';downloadArtwork.textContent='Download UM artwork';downloadArtwork.download='ultra-maritime.png';downloadArtwork.hidden=true;
 exportArtwork.addEventListener('click',()=>{const painted=document.querySelector<HTMLCanvasElement>('#ultra-screen-artwork');if(painted){const firstPage=document.createElement('canvas');firstPage.width=painted.width;firstPage.height=Math.round(painted.height/2);firstPage.getContext('2d')!.drawImage(painted,0,0);downloadArtwork.href=firstPage.toDataURL('image/png');downloadArtwork.hidden=false;}});
 const exportStill=document.createElement('button');exportStill.textContent='Prepare scene still';
 const downloadStill=document.createElement('a');downloadStill.id='scene-still-download';downloadStill.textContent='Download scene still';downloadStill.download='scene.png';downloadStill.hidden=true;
 exportStill.addEventListener('click',()=>{if(scene){scene.render();downloadStill.href=canvas.toDataURL('image/png');downloadStill.hidden=false;}});
 const exportProjects=document.createElement('button');exportProjects.textContent='Prepare projects artwork';
 const downloadProjects=document.createElement('a');downloadProjects.id='projects-artwork-download';downloadProjects.textContent='Download projects artwork';downloadProjects.download='projects-monitor.png';downloadProjects.hidden=true;
 exportProjects.addEventListener('click',()=>{const image=scene?.reelPreviewImage();if(image){downloadProjects.href=image;downloadProjects.hidden=false;}});
 el('review').append(exportArtwork,downloadArtwork,exportStill,downloadStill,exportProjects,downloadProjects);
 for(const [label,kind,local] of [['UM bullets','ultra-story',.85],['Hack hero','hack-story',.12],['Hack recap','hack-story',.48],['Hack numbers','hack-story',.88],['Pi dive end','data-dive',1],['Car half-dark','data-isolate',.35],['Pi isolated','data-isolate',1],['Pi reading','data-hold',.5],['Contact preview','reel',.9],['Contact centre','contact-card-center',.5],['Contact expand','contact-card-expand',.5],['Desk start','approach',0]] as const){
  const button=document.createElement('button');button.textContent=label;button.addEventListener('click',()=>{const p=phases.find(p=>p.kind===kind&&(label!=='Desk start'||p.station===5))!;jump((p.start+local*(p.end-p.start))/totalUnits);});el('review').append(button);
 }
}
function sizeScroll() { space.style.height = `${(1 + totalUnits * SCROLL_DISTANCE_MULTIPLIER) * vh}px`; }
function maxScroll() { return Math.max(1, space.offsetHeight - innerHeight); }
function jump(p: number) {
  progress = clamp(p);
  if (!staticMode) {
    window.scrollTo(0, maxScroll() * progress); trigger?.update();
    // Browsers round scroll offsets. Identical pixel positions must produce identical poses,
    // even when a repeated seek does not fire ScrollTrigger's onUpdate callback.
    progress = clamp(window.scrollY / maxScroll());
  }
  // Persist explicit navigation before the ordinary scroll debounce can run.
  targetProgress = progress; lastMotionFrame = 0;
  saveProgress(true); requestFrame();
}
function restoreHash() {
  let hash=location.hash.slice(1);
  if(hash==='fsae-pedal-sensor'){hash='formula-sae';history.replaceState(null,'','#'+hash);}
  const project=Object.entries(FSAE_PROJECTS).find(([,p])=>p.hash===hash);
  if(project){if(staticMode)document.getElementById('static-'+hash)?.scrollIntoView();else {const phase=phases.find(p=>p.kind===project[0]+'-hold')!;jump((phase.start+(phase.end-phase.start)*.5)/totalUnits);}return;}
  const index = IDS.indexOf(hash);
  if (index >= 0) {
    if (staticMode) stillFades.seek('still-' + IDS[index]);
    else jump(stationProgress(index));
  }
}
function requestFrame() {
  if (queued || staticMode || document.hidden) return;
  queued = true; requestAnimationFrame(() => { queued = false; draw(); });
}
function draw() {
  if (staticMode || !scene) return;
  const now = performance.now();
  if (!resizing) progress = smoothScrollProgress(progress, targetProgress, lastMotionFrame ? (now-lastMotionFrame)/1000 : 1/60, maxScroll());
  lastMotionFrame = progress === targetProgress ? 0 : now;
  const onDesk = evaluate(progress).phase.station >= 5;
  printJob.advance(performance.now(), onDesk);
  const state = evaluate(progress, printJob.progress);
  const deskApproach = state.phase.kind === 'projects-reveal' || state.phase.kind === 'car-shrink' || state.phase.kind === 'projects-monitor-entry';
  canvas.setAttribute('aria-label', deskApproach ? 'Personal Projects: a Formula SAE scale model on a desk with an ultrawide title card, a 60% mechanical keyboard, and a mouse' : 'A MacBook travels through seven portfolio scenes');
  try {
    const status = scene.update(state);
    const showPoster = status.waiting || status.failed;
    if (showPoster) printJob.pause();
    // Let the existing retry control receive input if the opening asset failed.
    if (status.failed) finishBoot(true);
    const activePoster = state.phase.station === 5 && printJob.status === 'printed' ? 'resume-printed.webp' : status.poster;
    const nextPoster = `${import.meta.env.BASE_URL}assets/${activePoster}`;
    if (poster.getAttribute('src') !== nextPoster) poster.src = nextPoster;
    loading.classList.toggle('opening', state.phase.station === 0);
    loading.classList.toggle('ready', !showPoster); loading.setAttribute('aria-hidden', String(!showPoster));
    loading.inert = !showPoster;
    label.textContent = status.failed ? 'This scene could not load.' : scene.ready ? 'Preparing the next scene…' : 'Preparing the journey…';
    el('retry').hidden = !status.failed;
    hint.style.opacity = progress < .6 / totalUnits && !showPoster ? '1' : '0';
    positionPrintControl(showPoster);
    positionNotebookLinks(showPoster);
    ultraRead.hidden=state.phase.station!==2||!['hold','ultra-story'].includes(state.phase.kind);
    updateIntroName(state);
    updateFsae(state);
    updateHackStory(state);
    scene.paintUltraScreen(ultraSource,state);
    paintReelPreview();
    if(scene.withSourceCar(paintFsaeTitle))scene.update(state);
    updateReel(state);
    if (!showPoster && scene.ready) bootReady = true;
    updatePrintControls();
    scene.render();
    if ((!resizing && progress !== targetProgress) || (printJob.status === 'printing' && onDesk && !showPoster)) requestFrame();
    if (reviewMode) { scrub.value = String(progress); chapter.value = String(state.phase.station); el('phase-label').textContent = `${state.phase.kind} · ${Math.round(progress * 100)}%`; }
  } catch (e) { console.error(e); void setStatic(true, 'The 3D view is unavailable. You can still explore every scene below.'); }
}
async function start3D() {
  const token = ++generation;
  try {
    await document.fonts.ready; reelFonts = true;
    manifest ??= await fetch(`${import.meta.env.BASE_URL}assets/journey.json`).then(r => { if (!r.ok) throw new Error('Missing journey data'); return r.json(); });
    if (token !== generation || staticMode) return;
    scene = new PortfolioScene(canvas, manifest); scene.onAssetsChanged = requestFrame; scene.setPrintInteraction(printHovered, printFocused);
    sizeScroll(); trigger?.kill();
    trigger = ScrollTrigger.create({ start: 0, end: () => maxScroll(), invalidateOnRefresh: true, onUpdate: self => {
      if (resizing) return;
      targetProgress = self.progress; requestFrame();
      saveProgress();
    } });
    if (initial) {
      initial = false; const saved = restoredProgress;
      if (typeof saved === 'number') jump(saved); else if (location.hash) restoreHash(); else jump(window.scrollY / maxScroll());
    } else jump(progress);
    requestFrame();
    await scene.loadHero(); requestFrame();
  } catch (e) { console.error(e); if (token === generation) await setStatic(true, 'The 3D view could not load. Explore the still views below.'); }
}
async function setStatic(value: boolean, note?: string) {
  targetProgress = progress; lastMotionFrame = 0;
  staticMode = value; document.body.classList.toggle('static-mode', value); el('fallback').hidden = !value;
  el('motion-toggle').textContent = value ? 'Enable animation' : 'Reduce motion'; el('motion-toggle').setAttribute('aria-pressed', String(value));
  el('review').hidden = !reviewMode || value;
  if (note) el('fallback-note').textContent = note;
  if (value) { hackStory.hidden=true;hackStory.inert=true;reel.hidden = true; canvas.style.cssText = ''; finishBoot(true); printJob.finish(); updatePrintControls(); generation++; trigger?.kill(); trigger = undefined; scene?.dispose(); scene = undefined; window.scrollTo(0, 0); }
  stillFades.enable(false);requestAnimationFrame(()=>{paintProjectsStill();paintPiStill();paintContactStill();}); // Project reading sections use normal document flow.
  if (value && location.hash) restoreHash();
  if (!value) { loading.classList.remove('ready'); await start3D(); }
}
el('motion-toggle').addEventListener('click', () => { const value = !staticMode; localStorage.setItem('portfolio-reduced-motion', String(value)); void setStatic(value); });
el('skip').addEventListener('click', async () => { await setStatic(true); el('accessible-contact').scrollIntoView(); el('accessible-contact').tabIndex = -1; el('accessible-contact').focus({ preventScroll: true }); });
el('retry').addEventListener('click', () => { scene?.retry(); requestFrame(); });
chapter.addEventListener('change', () => { history.pushState({ portfolioProgress: stationProgress(Number(chapter.value)) }, '', '#' + IDS[Number(chapter.value)]); jump(stationProgress(Number(chapter.value))); });
scrub.addEventListener('input', () => jump(Number(scrub.value)));
window.addEventListener('hashchange', restoreHash);
window.addEventListener('popstate', () => { const p = history.state?.portfolioProgress; if (typeof p === 'number') jump(p); else restoreHash(); });
window.addEventListener('resize', () => {
  if (!resizing) { resizeProgress = progress; resizeTarget = targetProgress; }
  resizing = true; scene?.resize(); requestFrame(); clearTimeout(resizeTimer);
  resizeTimer = window.setTimeout(() => {
    if (staticMode) { resizing = false; return; }
    if (innerWidth !== lastWidth || Math.abs(innerHeight - vh) > 150) {
      vh = innerHeight; lastWidth = innerWidth; sizeScroll(); ScrollTrigger.refresh(); resizing = false; jump(resizeTarget); progress = resizeProgress; lastMotionFrame = 0;
    } else resizing = false;
    requestFrame();
  }, 140);
});
document.addEventListener('visibilitychange', () => { printJob.pause(); progress = targetProgress; lastMotionFrame = 0; requestFrame(); });
reduced.addEventListener('change', event => { if (localStorage.getItem('portfolio-reduced-motion') === null) void setStatic(event.matches); });
canvas.addEventListener('webglcontextlost', event => { event.preventDefault(); void setStatic(true, 'The 3D view was interrupted. The portfolio remains available below.'); });
window.addEventListener('pagehide', () => saveProgress(true));
window.addEventListener('beforeunload', () => saveProgress(true));

// Local review API is also used by the browser regression checks.
Object.assign(window, { __portfolio: { seek: jump, station: (index: number) => jump(stationProgress(index)), phases, totalUnits,
  transitionFrame: (frame: 'return'|'shrink'|'reveal') => { const [kind,local]=frame==='return'?['data-return',.999999] as const:frame==='shrink'?['car-shrink',.5] as const:['projects-reveal',.999999] as const; const p=phases.find(p=>p.kind===kind)!;jump((p.start+local*(p.end-p.start))/totalUnits); },
  contactFrame: (frame:'preview'|'center'|'expand'|'desk') => {const kind=frame==='preview'?'reel':frame==='center'?'contact-card-center':frame==='expand'?'contact-card-expand':'approach';const p=phases.find(p=>p.kind===kind&&(kind!=='approach'||p.station===5))!;jump((p.start+(p.end-p.start)*(frame==='preview'?.9:frame==='desk'?0:.5))/totalUnits);},
  probe: (x?: number, y?: number) => scene?.probe(x,y), reelPreviewImage: () => scene?.reelPreviewImage(), screenFrame: () => scene?.debugScreenFrame(), snapshot: () => ({ progress, targetProgress, staticMode, waiting: !loading.classList.contains('ready'), printStatus: printJob.status, printProgress: printJob.progress, paper: printJob.progress, ...scene?.diagnostics() }),
  settled: () => !scene || (progress === targetProgress && !scene.pending.size && !scene.detailsLoading && loading.classList.contains('ready')),
} });
sizeScroll();
const preference = localStorage.getItem('portfolio-reduced-motion');
void setStatic(params.has('still') || (preference === null ? reduced.matches : preference === 'true'));
