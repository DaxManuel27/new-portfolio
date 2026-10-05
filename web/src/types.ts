export interface CameraPose { position: number[]; quaternion: number[]; width: number; minHeight?: number }
export interface Station {
  id: string; name: string; origin: number[]; asset: string; poster: string;
  dock: { position: number[]; quaternion: number[]; lid: number[] };
  wide: CameraPose; close: CameraPose; hasClose: boolean;
}
export interface TravelSample extends CameraPose { frame: number; center: number[]; opacity: number[] }
export interface ScreenFrame { mesh: string; center: number[]; right: number[]; up: number[]; normal: number[]; width: number; height: number;
  /** Curved glass (ultrawide): arc radius and chord-uniform UVs; width/height are the chord rectangle. */
  curvature?: { radius: number; segments: number; chordWidth: number; sagitta: number; gap: number; uv: 'chord-uniform' } }
export interface Manifest { fps: number; stations: Station[]; travel: TravelSample[]; reorder: {
  piPortal: ScreenFrame;
  projects: {carModel:{sourceGround:number[];ground:number[];scale:number;quaternion:number[]}};
  workstation: { wide: CameraPose; close: CameraPose; monitorClose: CameraPose; screens: { um: ScreenFrame; fsae: ScreenFrame } };
  car: { dataShot?: { dive: {width:number} }; close: CameraPose; wide: CameraPose; anchors?: { data: number[] }; focusRoutes?: Record<'data', {position:number[];target:number[];width:number}[]> }; ultrawide: { wide: CameraPose; close: CameraPose; screen: ScreenFrame };
} }
