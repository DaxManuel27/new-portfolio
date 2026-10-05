import {PROJECTS_REEL_REVEAL} from './projects-desk-transition';
import { clamp, ease, type JourneyState } from './journey';

/** Fraction of each card's scroll slice spent holding it still before sliding to the next. */
export const REEL_HOLD = .4;

/** Continuous card position (0 … count−1) for reel progress 0–1: hold, glide, hold, glide … */
export function reelPosition(progress: number, count: number) {
  if (count <= 1) return 0;
  const u = clamp(progress) * count, k = Math.min(count - 1, Math.floor(u)), f = u - k;
  return k >= count - 1 ? count - 1 : k + ease((f - REEL_HOLD) / (1 - REEL_HOLD));
}

export interface CardLayout { x: number; scale: number; opacity: number; z: number }
/** Layout of a card at signed distance d (in cards) from the centre slot; x is in multiples of card width. */
export function cardLayout(d: number): CardLayout {
  const a = Math.abs(d), past = d < 0;
  const x = Math.sign(d) * (a <= 1 ? a : 1 + (a - 1) * .55);
  const scale = a <= 1 ? 1 - .28 * a : Math.max(.5, .72 - .12 * (a - 1));
  const opacity = a <= 1 ? (past ? 1 - .65 * a : 1 - .15 * a) : Math.max(0, past ? .35 - .25 * (a - 1) : .85 - .35 * (a - 1));
  return { x, scale, opacity, z: Math.round(100 - a * 10) };
}

export interface ReelView {
  /** Whether the reel overlay is in the DOM flow at all. */
  visible: boolean;
  /** Opacity of the whole overlay content (headline, cards). */
  opacity: number;
  /** Continuous position; the extra "desk" card sits at index count. */
  position: number;
  /** Headline/hint opacity multiplier. */
  chrome: number;
  /** Live 3D canvas treatment while the desk card takes over the screen. */
  canvas: { mode: 'normal' | 'hidden' | 'card'; opacity: number; expand: number };
}

/** Pure mapping from journey state to everything the reel and canvas should do. */
export function reelView(state: Pick<JourneyState, 'phase' | 'local'>, count: number): ReelView {
  const { kind, station } = state.phase, p = state.local;
  const none: ReelView = { visible: false, opacity: 0, position: 0, chrome: 0, canvas: { mode: 'normal', opacity: 1, expand: 0 } };
  if (kind === 'projects-monitor-entry') {
    // The ultrawide reaches full framing before the existing reel takes over.
    const t = p >= PROJECTS_REEL_REVEAL ? 1 : 0;
    return { visible: t > 0, opacity: t, position: 0, chrome: 1, canvas: { mode: 'normal', opacity: 1 - t, expand: 0 } };
  }
  if (station === 4 && kind === 'reel') {
    return { visible: true, opacity: 1, position: reelPosition(p, count), chrome: 1, canvas: { mode: 'card', opacity: 1, expand: 0 } };
  }
  if (kind === 'contact-card-center') {
    return { visible:true,opacity:1,position:count-1+ease(p),chrome:1-ease(p),canvas:{mode:'card',opacity:1,expand:0} };
  }
  if (kind === 'contact-card-expand') {
    const expand=ease(p);
    return {visible:expand<1,opacity:1,position:count,chrome:0,canvas:{mode:expand<1?'card':'normal',opacity:1,expand}};
  }
  return none;
}

export interface ContactWindow { x:number; y:number; width:number; height:number; radius:number }
/** Rect shared by the live canvas and its card; no independent animation clocks. */
export function expandContactWindow(rect:ContactWindow,viewport:{width:number;height:number},expand:number):ContactWindow {
 const t=clamp(expand);
 return {x:rect.x*(1-t),y:rect.y*(1-t),width:rect.width+(viewport.width-rect.width)*t,height:rect.height+(viewport.height-rect.height)*t,radius:rect.radius*(1-t)};
}
