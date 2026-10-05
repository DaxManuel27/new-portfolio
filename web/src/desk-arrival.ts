import { Quaternion, Vector3 } from 'three';
import { ease } from './journey';
import type { Station } from './types';

export const DESK_ARRIVAL_START = 18;
export const DESK_ALIGNMENT_END = 19;
export const DESK_TOUCHDOWN = 19.6;
export interface LaptopPose { position: number[]; quaternion: number[]; lid: number[] }

/** Finish the flight in the shared desk's empty laptop bay before descending. */
export function deskArrivalPose(time: number, apex: LaptopPose, dock: Station['dock']): LaptopPose {
  const align = ease((time - DESK_ARRIVAL_START) / (DESK_ALIGNMENT_END - DESK_ARRIVAL_START));
  const descend = ease((time - DESK_ALIGNMENT_END) / (DESK_TOUCHDOWN - DESK_ALIGNMENT_END));
  const position = new Vector3().fromArray(apex.position).lerp(new Vector3(dock.position[0], apex.position[1], dock.position[2]), align);
  position.y += (dock.position[1] - apex.position[1]) * descend;
  return {
    position: position.toArray(),
    quaternion: new Quaternion().fromArray(apex.quaternion).slerp(new Quaternion().fromArray(dock.quaternion), align).toArray(),
    lid: new Quaternion().fromArray(apex.lid).slerp(new Quaternion().fromArray(dock.lid), align).toArray(),
  };
}
