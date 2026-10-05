/** Native scroll distance per journey unit, in viewport heights, at every screen width. */
export const SCROLL_DISTANCE_MULTIPLIER = 1.15;

/** Shared animation response; native scrolling remains immediate. */
export function smoothScrollProgress(current: number, target: number, dt: number, distance: number) {
  const next = current + (target - current) * (1 - Math.exp(-Math.max(0, Math.min(dt, .064)) / .1));
  return Math.abs(target - next) * distance < .25 ? target : next;
}
