import { ease, type JourneyState } from './journey';

/**
 * "UNB Formula Racing" title beside the Formula SAE car. It belongs to the car overview only:
 * shown on the Workstation's FSAE monitor, through the zoom into it and the car hold, then faded
 * out as the camera starts toward Data logging, then restored on the return to the car and monitor.
 */
export function fsaeTitleOpacity(state: Pick<JourneyState, 'phase' | 'local'>) {
  const { station, kind } = state.phase;
  if (station === 2) return 1;
  if(kind==='car-shrink')return 0;
  if (kind === 'data-return') return 0;
  if (station === 3 && (kind === 'screen-zoom' || kind === 'hold')) return 1;
  // Gone within the first tenth of the move, before the camera has visibly turned.
  if (station === 3 && kind === 'data-dive') return 1 - ease(state.local / .1);
  return 0;
}

/**
 * Largest font size (px) so that each title line, set from `left`, ends `gap` before the car.
 * `widths` are line widths per pixel of font size; `edges` the car's nearest left edge beside each line.
 */
export function fitTitleSize(left: number, widths: number[], edges: number[], gap: number, min: number, max: number) {
  let size = max;
  widths.forEach((w, i) => { if (Number.isFinite(edges[i]) && w > 0) size = Math.min(size, (edges[i] - gap - left) / w); });
  return Math.max(min, size);
}

export interface Rect { left: number; top: number; right: number; bottom: number }
/**
 * Where the title sits on the FSAE monitor glass (glass-centred units, y up).
 * `title` is the laid-out title box in CSS px; `region` is the size, on the glass, of the part of the live preview
 * that becomes the full-screen view. Where that natural placement would leave the glass before the zoom, the title is
 * slid inside the `margin` (wide windows) or tucked into the top-left corner (tall phone windows). Near the end of
 * the zoom the natural placement fits, so it hands over to the full-screen title exactly.
 */
export function monitorTitleRect(title: Rect, viewport: { width: number; height: number }, region: { width: number; height: number }, glass: { width: number; height: number }, margin: number, endWidth = 0, maxWidthFraction = .26): Rect {
  const x = (px: number) => (px / viewport.width - .5) * region.width, y = (py: number) => (.5 - py / viewport.height) * region.height;
  let left = x(title.left), right = x(title.right), top = y(title.top), bottom = y(title.bottom);
  const minLeft = -glass.width / 2 + margin, maxTop = glass.height / 2 - margin, minBottom = -glass.height / 2 + margin;
  // Wide windows: the full-screen frame is wider than the glass before the zoom. Slide the title in from the
  // left edge at full size (the car is composited over it, as full screen), so it keeps its size next to the car.
  if (left < minLeft) { right += minLeft - left; left = minLeft; }
  // A title wider than the glass is scaled about its left edge to fit.
  const maxRight = glass.width / 2 - margin;
  if (right > maxRight) { const k = (maxRight - left) / (right - left); right = maxRight; bottom = top - (top - bottom) * k; }
  const tall = top > maxTop;
  if (top > maxTop) { bottom -= top - maxTop; top = maxTop; }
  if (bottom < minBottom) { const k = (top - minBottom) / (top - bottom); bottom = minBottom; left = right - (right - left) * k; }
  // On tall (phone) windows the frame overflows the glass vertically before the zoom: keep the title to the
  // top-left corner beside the car instead of pushing it down over the car (never binds at the zoom's end).
  // `endWidth` is the title's natural width when the zoom ends, so the cap can never change the hand-off frame.
  const maxWidth = Math.max(glass.width * maxWidthFraction, endWidth * 1.001);
  if (tall && right - left > maxWidth) { const k = maxWidth / (right - left); right = left + maxWidth; bottom = top - (top - bottom) * k; }
  return { left, top, right, bottom };
}
