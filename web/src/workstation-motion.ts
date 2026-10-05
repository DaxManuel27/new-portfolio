import { Quaternion } from 'three';
import { ease, type JourneyState } from './journey';
const CLOSED = new Quaternion(Math.sin(110 * Math.PI / 360), 0, 0, Math.cos(110 * Math.PI / 360));
/** Resolve the departure hinge from scroll, preserving the original first-flight bake. */
export function workstationLid(state: Pick<JourneyState,'phase'|'local'>, sampled: Quaternion) {
  if (state.phase.station === 2 && state.phase.kind === 'travel') return CLOSED.clone();
  if (state.phase.station === 1 && state.phase.kind === 'exit') return sampled.clone().slerp(CLOSED, ease(state.local / .8));
  return sampled.clone();
}
