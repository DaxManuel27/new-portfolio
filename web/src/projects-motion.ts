import { Quaternion, Vector3 } from 'three';
import { clamp, ease } from './journey';
import type { LaptopPose } from './desk-arrival';
import type { Station } from './types';

export const PROJECTS_MOTION = {
  incomingBlendStart: 13.6,
  incomingReference: 14,
  incomingAligned: 14.4,
  incomingHover: 15.2,
  docked: 16,
  slideEnd: 16.4,
  sideClear: 17.3,
  handoff: 18,
  forwardSlide: .1,
  incomingSideOffset: -.6,
  outgoingSideX: 8.72,
} as const;

const interval = (time: number, start: number, end: number) => ease((time - start) / (end - start));
function mix(a: LaptopPose, b: LaptopPose, amount: number): LaptopPose {
  return {
    position: new Vector3().fromArray(a.position).lerp(new Vector3().fromArray(b.position), amount).toArray(),
    quaternion: new Quaternion().fromArray(a.quaternion).slerp(new Quaternion().fromArray(b.quaternion), amount).toArray(),
    lid: new Quaternion().fromArray(a.lid).slerp(new Quaternion().fromArray(b.lid), amount).toArray(),
  };
}

// The original flip passes through a half-turn during the incoming blend. A
// shortest-arc slerp would switch directions there and visibly snap. Preserve the
// continuous quaternion branch around the original t=14 pose while unwinding.
function unwind(sample: number[], target: number[], reference: number[], amount: number) {
  const a = new Quaternion().fromArray(sample), b = new Quaternion().fromArray(target), anchor = new Quaternion().fromArray(reference);
  if (a.dot(anchor) < 0) a.set(-a.x, -a.y, -a.z, -a.w);
  if (b.dot(anchor) < 0) b.set(-b.x, -b.y, -b.z, -b.w);
  const angle = Math.acos(clamp(a.dot(b), -1, 1)), sine = Math.sin(angle);
  if (Math.abs(sine) < 1e-6) return a.slerp(b, amount).toArray();
  const wa = Math.sin((1 - amount) * angle) / sine, wb = Math.sin(amount * angle) / sine;
  return new Quaternion(a.x * wa + b.x * wb, a.y * wa + b.y * wb, a.z * wa + b.z * wb, a.w * wa + b.w * wb).normalize().toArray();
}

/** One reversible, printer-independent route through the Projects monitor area.
 * Capture incomingApex at t=14 and departureApex at t=18 from the original clip.
 * Apply once after restoring the baked pose and before ordinary docking blends.
 */
export function projectsPose(time: number, bakedPose: LaptopPose, projectsDock: Station['dock'], incomingApex: LaptopPose, departureApex: LaptopPose): LaptopPose {
  const route = PROJECTS_MOTION;
  if (time < route.incomingBlendStart || time > route.handoff) return bakedPose;
  const forwardZ = projectsDock.position[2] + route.forwardSlide;
  if (time < route.incomingAligned) {
    const amount = interval(time, route.incomingBlendStart, route.incomingAligned);
    const aligned = { ...projectsDock, position: [projectsDock.position[0] + route.incomingSideOffset, incomingApex.position[1], forwardZ] };
    const pose = mix(bakedPose, aligned, amount);
    pose.quaternion = unwind(bakedPose.quaternion, aligned.quaternion, incomingApex.quaternion, amount);
    return pose;
  }
  if (time < route.docked) {
    const aligned = { ...projectsDock, position: [projectsDock.position[0] + route.incomingSideOffset, incomingApex.position[1], forwardZ] };
    const hover = { ...projectsDock, position: [projectsDock.position[0], incomingApex.position[1], projectsDock.position[2]] };
    return time < route.incomingHover
      ? mix(aligned, hover, interval(time, route.incomingAligned, route.incomingHover))
      : mix(hover, projectsDock, interval(time, route.incomingHover, route.docked));
  }
  const slide = { ...projectsDock, position: [projectsDock.position[0], projectsDock.position[1], forwardZ] };
  if (time < route.slideEnd) return mix(projectsDock, slide, interval(time, route.docked, route.slideEnd));
  const side = { ...departureApex, position: [route.outgoingSideX, departureApex.position[1], forwardZ] };
  return time < route.sideClear
    ? mix(slide, side, interval(time, route.slideEnd, route.sideClear))
    : mix(side, departureApex, interval(time, route.sideClear, route.handoff));
}
