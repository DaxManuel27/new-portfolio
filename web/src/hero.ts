import { Object3D, PropertyBinding, Quaternion, Vector3, type AnimationClip, type Interpolant, type KeyframeTrack } from 'three';
import type { Station } from './types';

const ease = (value: number) => { const t = Math.max(0, Math.min(1, value)); return t * t * (3 - 2 * t); };

export function createHeroSampler(root: Object3D, clip: AnimationClip, hackDock?: Station['dock']): (time: number) => void {
  const feet = root.getObjectByName('Journey_TravelFeet');
  const spin = root.getObjectByName('Journey_MacBook_SpinPivot');
  const lid = root.getObjectByName('Journey_MacBook_LidPivot');
  const landing = hackDock && {
    position: new Vector3().fromArray(hackDock.position),
    rotation: new Quaternion().fromArray(hackDock.quaternion),
    lid: new Quaternion().fromArray(hackDock.lid),
  };
  const tracks = clip.tracks.map(track => {
    const binding = PropertyBinding.parseTrackName(track.name);
    const target = PropertyBinding.findNode(root, binding.nodeName);
    const property = binding.propertyName;
    if (!(target instanceof Object3D) || (property !== 'position' && property !== 'quaternion')) {
      throw new Error(`Unsupported laptop animation track: ${track.name}`);
    }
    // Three sets this factory from the track's interpolation mode (also used by AnimationMixer).
    const interpolant = (track as KeyframeTrack & { createInterpolant(): Interpolant }).createInterpolant();
    return { target, property, interpolant };
  });
  // Match the incoming baked height and slope, then descend to contact once.
  // With a zero end tangent, limiting the start tangent to [3*delta, 0]
  // keeps this Hermite segment monotone without a hover or overshoot.
  const descentStart = 2.8, descentEnd = 4;
  const heightTrack = tracks.find(track => track.target === feet && track.property === 'position');
  const startHeight = Number(heightTrack?.interpolant.evaluate(descentStart)[1] ?? 0);
  const previousHeight = Number(heightTrack?.interpolant.evaluate(descentStart - .001)[1] ?? startHeight);
  const heightDelta = landing ? landing.position.y - startHeight : 0;
  const startTangent = Math.max(3 * heightDelta, Math.min(0, (startHeight - previousHeight) / .001 * (descentEnd - descentStart)));
  return time => {
    const t = Math.max(0, Math.min(clip.duration, time));
    for (const { target, property, interpolant } of tracks) {
      // Always restore the baked pose before docking, including repeated times and clip holds.
      const value = interpolant.evaluate(t);
      if (property === 'position') target.position.fromArray(value);
      else target.quaternion.fromArray(value).normalize();
    }
    // The exported route reaches table height before its lateral motion ends.
    // Resolve that short boundary against the manifest's authoritative dock pose.
    // Sampling from scratch makes reverse scroll and repeated seeks identical.
    if (landing && feet && spin && lid && t > 3.3 && t < 4.8) {
      const arriving = t <= 4;
      const weight = arriving ? ease((t - 3.3) / .2) : 1 - ease((t - 4.3) / .5);
      feet.position.x += (landing.position.x - feet.position.x) * weight;
      feet.position.z += (landing.position.z - feet.position.z) * (arriving ? ease((t - 3.5) / .2) : weight);
      if (!arriving) feet.position.y += (landing.position.y + .2 * ease((t - 4) / .3) - feet.position.y) * weight;
      spin.quaternion.slerp(landing.rotation, weight);
      // Preserve the authored lid closing on departure after leaving the dock.
      lid.quaternion.slerp(landing.lid, arriving ? weight : 1 - ease((t - 4) / .3));
    }
    if (landing && feet && t > descentStart && t <= descentEnd) {
      const u = (t - descentStart) / (descentEnd - descentStart);
      feet.position.y = startHeight + heightDelta * ease(u) + startTangent * u * (1 - u) ** 2;
    }
  };
}
