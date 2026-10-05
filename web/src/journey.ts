import intro from './intro-config.json';
import { PROJECTS } from './projects';

export const IDS = ['intro', 'hack-atlantic', 'ultra-maritime', 'formula-sae', 'projects', 'resume', 'contact'];
export const NAMES = ['Intro', 'Hack Atlantic', 'Workstation · Ultra Maritime + Formula SAE', 'Formula SAE', 'Projects', 'Resume', 'Contact'];
export type PhaseKind = 'intro' | 'ultra-story' | 'hack-story' | 'travel' | 'approach' | 'hold' | 'exit' | 'screen-zoom' | 'pan' | 'monitor-hold' | 'reel' | 'contact-card-center' | 'contact-card-expand' | 'data-dive' | 'data-isolate' | 'data-reveal' | 'data-hold' | 'data-return' | 'car-shrink' | 'projects-reveal' | 'projects-monitor-entry';
export interface Phase { kind: PhaseKind; station: number; start: number; end: number }
export interface JourneyState {
  phase: Phase; local: number; units: number; heroTime: number;
  dock: number; cameraMode: 'travel' | 'station'; cameraMix: number; paper: number;
}
export const clamp = (x: number, lo = 0, hi = 1) => Math.min(hi, Math.max(lo, x));
export const ease = (x: number) => { const t = clamp(x); return t * t * (3 - 2 * t); };
export const phases: Phase[] = [];
function add(kind: PhaseKind, station: number, length: number) {
  const start = phases.at(-1)?.end ?? 0; phases.push({ kind, station, start, end: start + length });
}
add('intro', 0, .6);
/** Scroll units (≈ viewport heights) spent on the Projects reel: one slice per card. */
export const REEL_UNITS = PROJECTS.length * .9 + .3;
add('travel', 1, 1.5); add('approach', 1, .9); add('hold', 1, .6); add('hack-story',1,4.5); add('exit', 1, .7);
add('travel', 2, 1.5); add('approach', 2, .9); add('hold', 2, .8); add('ultra-story',2,2.0);
add('pan', 2, .8); add('monitor-hold', 2, .35);
add('screen-zoom', 3, 1.2); add('hold', 3, .8);
add('data-dive',3,.9); add('data-isolate',3,.7); add('data-reveal',3,.4); add('data-hold',3,1.2); add('data-return',3,1.1); add('car-shrink',3,1.3);
add('projects-reveal',4,.8); add('projects-monitor-entry',4,1.0);
add('reel', 4, REEL_UNITS); add('contact-card-center', 4, .4); add('contact-card-expand', 4, .7);
add('approach', 5, .9); add('hold', 5, .6); add('exit', 5, .25);
add('travel', 6, .15); add('approach', 6, .25); add('hold', 6, 1);
export const totalUnits = phases.at(-1)!.end;
export function openingTime(time: number) {
  if (time >= intro.handoffTime) return time;
  const u = clamp(time / intro.handoffTime), u2 = u * u, u3 = u2 * u;
  // Cubic Hermite time remap: still at the reference pose, then join the baked
  // clock at unit speed. Camera, lid and root all sample this same absolute time.
  return (2 * u3 - 3 * u2 + 1) * intro.startTime
    + (-2 * u3 + 3 * u2) * intro.handoffTime
    + (u3 - u2) * intro.handoffTime;
}
export function evaluate(progress: number, printedProgress = 0): JourneyState {
  const units = clamp(Number.isFinite(progress) ? progress : 0) * totalUnits;
  const phase = phases.find(p => units < p.end) ?? phases.at(-1)!;
  const local = clamp((units - phase.start) / (phase.end - phase.start));
  const state: JourneyState = { phase, local, units, heroTime: phase.station * 4, dock: 0, cameraMode: 'travel', cameraMix: 0, paper: clamp(Number.isFinite(printedProgress) ? printedProgress : 0) };
  if (phase.kind === 'intro') state.heroTime = intro.startTime;
  if (phase.kind === 'travel') state.heroTime = openingTime((phase.station - 1 + local) * 4);
  if (phase.kind === 'approach') {
    // The camera makes one uninterrupted move; the laptop settles early within it.
    state.cameraMode = 'station'; state.cameraMix = ease(local);
    state.dock = ease((units - phase.start) / .35);
  }
  if (phase.kind === 'hold' || phase.kind === 'hack-story' || phase.kind === 'ultra-story') {
    state.dock = 1; state.cameraMode = 'station'; state.cameraMix = 1;
  }
  if (phase.kind === 'screen-zoom' || phase.kind === 'pan' || phase.kind === 'monitor-hold' || phase.kind === 'car-shrink' || phase.kind === 'projects-reveal' || phase.kind === 'projects-monitor-entry') { state.cameraMode = 'station'; state.cameraMix = 1; state.dock = 1; }
  if (phase.kind === 'reel' || phase.kind === 'contact-card-center' || phase.kind === 'contact-card-expand') state.heroTime = 20;
  if (phase.kind === 'exit') {
    state.cameraMode = 'station'; state.cameraMix = 1 - ease(local);
    const undockDuration = phase.station === 2 ? .7 : .25;
    state.dock = ease((phase.end - units) / undockDuration);
  }
  if (state.cameraMode === 'station' && phase.station === 1) {
    // Keep framing in step with the laptop's turn toward the straight-on view.
    // The full-phase component keeps the camera moving smoothly after docking finishes.
    state.cameraMix = .75 * state.dock + .25 * state.cameraMix;
  }
  // Keep the laptop landed through the shared desk switch.
  if (phase.station === 6 || (phase.station === 5 && phase.kind === 'exit')) {
    state.heroTime = 20; state.dock = 1;
  }
  if (phase.station === 2 && phase.kind !== 'travel') state.heroTime = 8;
  return state;
}
/** Visibility is evaluated directly; no direction or previous-frame state. */
export function heroVisible(state: Pick<JourneyState, 'phase'>) { return state.phase.station <= 2; }
export function stationProgress(index: number) {
  if (index === 0) return 0;
  if(index===1){const p=phases.find(p=>p.kind==='hack-story')!;return (p.start+.12*(p.end-p.start))/totalUnits;}
  const p = phases.find(p => p.station === index && p.kind === (index === 4 ? 'reel' : 'hold'))!;
  // The reel opens on a held first card; ordinary stations settle shortly after docking.
  return (p.start + (p.kind === 'reel' ? .04 : .15) * (p.end - p.start)) / totalUnits;
}
