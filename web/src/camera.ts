import { carAnchoredPose, projectsRevealPose, projectsEntryPose } from './projects-desk-transition';
import { fsaeCamera } from './fsae-focus';
import { MathUtils, Matrix4, Quaternion, Vector3 } from 'three';
import { clamp, ease, type JourneyState } from './journey';
import type { CameraPose, Manifest, TravelSample, ScreenFrame } from './types';

export function mixCamera(a: CameraPose, b: CameraPose, t: number): CameraPose {
  return {
    position: new Vector3().fromArray(a.position).lerp(new Vector3().fromArray(b.position), t).toArray(),
    quaternion: new Quaternion().fromArray(a.quaternion).slerp(new Quaternion().fromArray(b.quaternion), t).toArray(),
    width: MathUtils.lerp(a.width, b.width, t),
  };
}

export function sampleTravel(manifest: Manifest, time: number): TravelSample {
  const last = manifest.travel.length - 1;
  const frame = clamp(time * manifest.fps, 0, last);
  const i = Math.floor(frame), j = Math.min(last, i + 1), t = frame - i;
  const a = manifest.travel[i], b = manifest.travel[j];
  return {
    ...mixCamera(a, b, t), frame: frame + 1,
    center: a.center.map((x, k) => MathUtils.lerp(x, b.center[k], t)),
    // The Intro platform is a preserved review asset, never part of the journey.
    opacity: a.opacity.map((x, k) => k === 0 ? 0 : MathUtils.lerp(x, b.opacity[k], t)),
  };
}

export function evaluateCamera(manifest: Manifest, state: JourneyState, aspect = 1.5): { sample: TravelSample; pose: CameraPose } {
  const sample = sampleTravel(manifest, state.heroTime);
  if(state.phase.kind==='car-shrink')return {sample,pose:carAnchoredPose(manifest,state.local,aspect)};
  if(state.phase.kind==='projects-reveal')return {sample,pose:projectsRevealPose(manifest,state.local,aspect)};
  if(state.phase.kind==='projects-monitor-entry')return {sample,pose:projectsEntryPose(manifest,state.local,aspect)};
  const detail = fsaeCamera(manifest,state,aspect);
  if(detail)return {sample,pose:detail};
  const station = manifest.stations[state.phase.station];
  const target = station.hasClose ? station.close : station.wide;
  // Keep the printer and its paper path visible on short viewports, while
  // retaining the tighter horizontal framing available on portrait screens.
  const focus = { ...target, width: Math.max(target.width, (target.minHeight ?? 0) * Math.min(aspect, 1.5)) };
  const focusMix = state.cameraMode === 'station' ? state.cameraMix : 0;
  // Approach and exit share the same boundary/focus endpoints; no wide-view detour.
  let authored = mixCamera(sample, focus, focusMix);
  // Lift above the shared desk, then drop directly onto the book.
  if (state.phase.station === 5 && state.phase.kind === 'exit') {
    authored = mixCamera(focus, station.wide, ease(state.local));
  } else if (state.phase.station === 6) {
    authored = state.phase.kind === 'hold' ? focus
      : state.phase.kind === 'approach' ? mixCamera(station.wide, focus, ease(state.local))
      : station.wide;
  }
  const { kind, station: index } = state.phase, r = manifest.reorder;
  if (index === 2 && kind === 'approach') authored = mixCamera(r.workstation.wide, r.workstation.close, ease(state.local));
  if (index === 2 && kind === 'pan') authored = mixCamera(r.workstation.close, r.workstation.monitorClose, ease(state.local));
  if (index === 2 && kind === 'monitor-hold') authored = r.workstation.monitorClose;
  if (index === 3) {
    authored = r.car.close;
    if(kind==='screen-zoom'&&state.local<SCREEN_SWAP)return {sample,pose:screenZoom(responsive(r.workstation.monitorClose,aspect),r.workstation.screens.fsae,state.local/SCREEN_FILL,aspect)};
  }
  if (index === 4) {
    // The card and the printer approach share one destination framing.
    if (kind === 'reel' || kind === 'contact-card-center' || kind === 'contact-card-expand') authored = contactDeskPose(manifest);
  }
  if(index===5&&kind==='approach')authored=mixCamera(contactDeskPose(manifest),focus,ease(state.local));
  const width = authored.width * Math.max(1, aspect / 1.5);
  const position = new Vector3().fromArray(authored.position);
  const right = new Vector3(1, 0, 0).applyQuaternion(new Quaternion().fromArray(authored.quaternion));
  // Preserve the Formula SAE travel offset on wider viewports, blending it out at focus.
  position.addScaledVector(right, (.5 - sample.center[0]) * (width - authored.width) * (1 - focusMix));
  return { sample, pose: { position: position.toArray(), quaternion: authored.quaternion, width } };
}

/** The image fills the viewport before the scene substitution. */
export const SCREEN_FILL = .8;
export const SCREEN_SWAP = .9;
export function responsive(pose: CameraPose, aspect: number): CameraPose {
  return { ...pose, width: Math.max(pose.width * Math.max(1, aspect / 1.5), (pose.minHeight ?? 0) * aspect) };
}
export function portalSize(frame: Pick<ScreenFrame, 'width' | 'height'>, aspect: number) {
  const width = Math.min(frame.width, frame.height * aspect) * .94;
  return { width, height: width / aspect };
}
/** Generic monitor zoom, independent of asset loading or previous scroll samples. */
export function screenZoom(start: CameraPose, frame: ScreenFrame, progress: number, aspect: number): CameraPose {
  const t = ease(progress), width = portalSize(frame, aspect).width;
  const orientation = new Matrix4().makeBasis(new Vector3().fromArray(frame.right), new Vector3().fromArray(frame.up), new Vector3().fromArray(frame.normal));
  const end: CameraPose = { position: new Vector3().fromArray(frame.center).addScaledVector(new Vector3().fromArray(frame.normal), 2.56).toArray(), quaternion: new Quaternion().setFromRotationMatrix(orientation).toArray(), width };
  const pose = mixCamera(start, end, t);
  pose.width = Math.exp(Math.log(start.width) * (1-t) + Math.log(width) * t);
  return pose;
}

/** Render edge-to-edge on the physical monitor, then match the full-screen crop. */
export function carPreviewPose(pose: CameraPose, frame: ScreenFrame, aspect: number, zoom: number): CameraPose {
  const start = responsive(pose, frame.width / frame.height);
  const endWidth = responsive(pose, aspect).width * frame.width / portalSize(frame, aspect).width;
  return { ...start, width: MathUtils.lerp(start.width, endWidth, ease(zoom / SCREEN_FILL)) };
}

/** Shared wide framing for the live contact card and the start of the printer approach. */
export function contactDeskPose(manifest:Manifest):CameraPose {
 const start=sampleTravel(manifest,20);
 return {position:[manifest.stations[5].origin[0],start.position[1],start.position[2]],quaternion:start.quaternion,width:manifest.stations[5].wide.width};
}
