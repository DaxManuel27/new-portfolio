import type {ContactWindow} from './reel';
import * as THREE from 'three';
import {carModelTransform,modelSceneState} from './projects-desk-transition';
import { GLTFLoader, type GLTF } from 'three/addons/loaders/GLTFLoader.js';
import { MeshoptDecoder } from 'three/addons/libs/meshopt_decoder.module.js';
import { HDRLoader } from 'three/addons/loaders/HDRLoader.js';
import { RectAreaLightUniformsLib } from 'three/addons/lights/RectAreaLightUniformsLib.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { clamp, ease, heroVisible, type JourneyState } from './journey';
import { evaluateCamera, carPreviewPose, portalSize, SCREEN_SWAP } from './camera';
import { paintOverlay, paintReel, paintTree, previewGeometry } from './reel-preview';
import {ultraTextureSize,ultraScroll,fitUltraRole} from './ultra-screen';
import { fsaeTitleOpacity, monitorTitleRect, type Rect } from './fsae-title';
import { createHeroSampler } from './hero';
import { fsaeFocus, piPlacement, type FsaeProject } from './fsae-focus';
import { FSAE_PROJECTS } from './fsae-projects';
import { workstationLid } from './workstation-motion';
import type { Manifest } from './types';

const ROOT = `${import.meta.env.BASE_URL}assets/`;
interface LoadedStation { group: THREE.Group; materials: THREE.Material[]; fade: { value: number }; callouts: THREE.Object3D[]; cutaway: {value:number}; seatCutaway: {value:number}; annotations:{value:number}; lastUsed: number }
interface PrinterControl {
  key: THREE.Object3D; anchor: THREE.Object3D; rest: THREE.Vector3;
  keyMaterials: { material: THREE.MeshStandardMaterial; emissive: THREE.Color; intensity: number }[];
  lights: { material: THREE.MeshStandardMaterial; color: THREE.Color; intensity: number }[];
}
interface ScreenBounds { left: number; top: number; right: number; bottom: number; width: number; height: number }
export interface PrintControlProjection {
  visible: boolean; x: number; y: number; width: number; height: number;
  keyBounds: ScreenBounds; targetBounds: ScreenBounds; hovered: boolean; focused: boolean; pressDepth: number;
}
export interface NotebookLinkProjection { id: string; visible: boolean; left: number; top: number; width: number; height: number }
// Handwritten phonebook entries, as rectangles in the notebook's Blender-local space (metres, Z up).
// Measured from the ink in notebook-pages.png (ArtworkUV) and the XContact lettering in portfolio-shared-desk.blend.
const NOTEBOOK_LINKS: { id: string; corners: number[][] }[] = [
  { id: 'github', corners: [[-.12748, .05009, .00803], [-.03512, .05009, .00802], [-.03512, .03737, .00802], [-.12748, .03737, .00803]] },
  { id: 'linkedin', corners: [[-.12733, .01743, .00803], [-.00506, .01743, .00568], [-.00506, .0037, .00568], [-.12733, .0037, .00803]] },
  { id: 'email', corners: [[-.12719, -.0161, .00803], [-.04986, -.0161, .00803], [-.04986, -.02795, .00803], [-.12719, -.02795, .00803]] },
  { id: 'phone', corners: [[-.1269, -.04963, .00803], [-.06865, -.04963, .00803], [-.06865, -.0609, .00803], [-.1269, -.0609, .00803]] },
  { id: 'x', corners: [[-.12842, -.0791, .00808], [-.05414, -.0791, .00808], [-.05414, -.0956, .00808], [-.12842, -.0956, .00808]] },
];
const v = (x: number[]) => new THREE.Vector3().fromArray(x);
const q = (x: number[]) => new THREE.Quaternion().fromArray(x);

export class PortfolioScene {
  readonly scene = new THREE.Scene();
  readonly camera = new THREE.OrthographicCamera(-1, 1, 1, -1, .001, 100);
  readonly renderer: THREE.WebGLRenderer;
  readonly loader = new GLTFLoader().setMeshoptDecoder(MeshoptDecoder);
  readonly stations = new Map<number, LoadedStation>();
  readonly pending = new Map<number, Promise<void>>();
  readonly errors = new Map<number, Error>();
  private hero!: GLTF; private sampleHero!: (time: number) => void;
  private feet!: THREE.Object3D; private spin!: THREE.Object3D; private lid!: THREE.Object3D;
  private paper?: GLTF; private paperMixer?: THREE.AnimationMixer; private paperAction?: THREE.AnimationAction;
  private paperPromise?: Promise<void>; private paperFailed = false;
  private printer?: PrinterControl;
  private printHovered = false; private printFocused = false; private printPressDepth = 0;
  private printControl?: PrintControlProjection;
  private notebook?: THREE.Object3D; private notebookLinks: NotebookLinkProjection[] = [];
  private environment: THREE.Texture; private key: THREE.DirectionalLight;
  private readonly environmentReady: Promise<void>;
  private readonly softbox = new THREE.RectAreaLight(0xfff4e5, 3.5, 2.2, 1.6);
  private readonly fillbox = new THREE.RectAreaLight(0xe5edff, 1.2, 1.5, 1.5);
  private readonly carTarget = new THREE.WebGLRenderTarget(1440, 960, { type: THREE.HalfFloatType, samples: 4 });
  private readonly carCamera = new THREE.OrthographicCamera(-1, 1, 1, -1, .01, 100);
  /** The monitor shows `carComposite`: the title, then the tone-mapped car over it (so the car overlaps the title,
   * as it does full screen), already in display colours so the page-coloured title stays exact. */
  private readonly carComposite = new THREE.WebGLRenderTarget(1440, 960, { type: THREE.HalfFloatType });
  private readonly compositeScene = new THREE.Scene();
  private readonly compositeCamera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
  private readonly compositeTitle = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), new THREE.MeshBasicMaterial({ transparent: true, depthTest: false, depthWrite: false, toneMapped: false }));
  private readonly compositeCar = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), new THREE.ShaderMaterial({
    uniforms: { map: { value: null }, toneMappingExposure: { value: 1 } },
    vertexShader: 'varying vec2 vUv; void main() { vUv = uv; gl_Position = vec4(position.xy, 0., 1.); }',
    // The renderer tone-maps with AgX on screen only; apply the same curve here (premultiplied, over the title).
    fragmentShader: '#include <tonemapping_pars_fragment>\nuniform sampler2D map; varying vec2 vUv;\nvoid main() { vec4 c = texture2D(map, vUv); vec3 rgb = c.a > 1e-4 ? c.rgb / c.a : vec3(0.); gl_FragColor = vec4(AgXToneMapping(rgb) * c.a, c.a); }',
    transparent: true, depthTest: false, depthWrite: false, toneMapped: false,
    blending: THREE.CustomBlending, blendSrc: THREE.OneFactor, blendDst: THREE.OneMinusSrcAlphaFactor, blendSrcAlpha: THREE.OneFactor, blendDstAlpha: THREE.OneMinusSrcAlphaFactor,
  }));
  private carPortal?: THREE.Mesh;
  /** Curved ultrawide display and the painted first frame of the Projects reel shown on it. */
  /** "UNB Formula Racing": a painted card behind the car, framed 1:1 by the car overview camera. */
  private fsaeTitle?: { mesh: THREE.Mesh; canvas: HTMLCanvasElement; texture: THREE.CanvasTexture; key: string };
  /** The same title laid over the FSAE monitor glass. The live car preview is tone-mapped by the monitor
   * material, so the title is composited after it to keep the exact page colours on both screens. */
  private fsaeTitleBox: Rect = { left: 0, top: 0, right: 0, bottom: 0 };
  private readonly modelShadow=new THREE.Mesh(new THREE.PlaneGeometry(.30,.23),new THREE.MeshBasicMaterial({color:0x000000,transparent:true,opacity:0,depthWrite:false,toneMapped:false}));
  private ultrawideScreen?: THREE.Mesh; private reelCanvas?: HTMLCanvasElement; private reelTexture?: THREE.CanvasTexture; private reelPreviewKey = '';
  private ultraTexture?:THREE.CanvasTexture; private ultraCanvas?:HTMLCanvasElement; private ultraKey='';
  private details = new Map<FsaeProject, THREE.Group>();
  private readonly carBrightness = {value:1};
  private readonly monitorFallback=new THREE.Mesh(new THREE.PlaneGeometry(1,1),new THREE.MeshBasicMaterial({toneMapped:false,depthWrite:false,depthTest:false}));
  private portalFallbackTexture?:THREE.CanvasTexture;
  private portalFallbackCanvas?:HTMLCanvasElement;
  private detailPending = new Set<FsaeProject>();
  private detailErrors = new Set<FsaeProject>();
  private detailMaterials = new Map<FsaeProject, THREE.Material[]>();
  private loadDetails() {
    for (const id of ['data'] as const) {
      if(this.details.has(id)||this.detailPending.has(id)||this.detailErrors.has(id))continue;
      this.detailPending.add(id);
      void this.loader.loadAsync(ROOT+FSAE_PROJECTS[id].asset).then(gltf=>{
        if(this.disposed){this.disposeGroup(gltf.scene);return;}
        const group=gltf.scene,placement=piPlacement(this.manifest);group.position.fromArray(placement.position);group.scale.setScalar(placement.scale);group.rotation.set(0,placement.yaw,0);group.visible=false;
        const materials:THREE.Material[]=[];
        group.traverse(o=>{if(o instanceof THREE.Mesh){o.castShadow=false;o.receiveShadow=false;for(const m of Array.isArray(o.material)?o.material:[o.material]){materials.push(m);}}});
        this.detailMaterials.set(id,materials);this.details.set(id,group);this.scene.add(group);
      }).catch(()=>this.detailErrors.add(id)).finally(()=>{this.detailPending.delete(id);this.onAssetsChanged();});
    }
  }
  get detailsLoading() { return this.detailPending.size>0; }
  private disposed = false; private aspect = 1.5; private lastState?: JourneyState;
  private frameMs: number[] = []; private resourceEpoch = 0;
  ready = false;
  onAssetsChanged = () => {};
  constructor(readonly canvas: HTMLCanvasElement, readonly manifest: Manifest) {
    const shadowCanvas=document.createElement('canvas');shadowCanvas.width=shadowCanvas.height=128;
    const shadow=shadowCanvas.getContext('2d')!,gradient=shadow.createRadialGradient(64,64,12,64,64,64);
    gradient.addColorStop(0,'rgba(0,0,0,.65)');gradient.addColorStop(1,'rgba(0,0,0,0)');shadow.fillStyle=gradient;shadow.fillRect(0,0,128,128);
    this.modelShadow.material.map=new THREE.CanvasTexture(shadowCanvas);this.modelShadow.rotation.x=-Math.PI/2;this.modelShadow.visible=false;this.scene.add(this.modelShadow);
    this.monitorFallback.visible=false;this.monitorFallback.renderOrder=100;this.scene.add(this.monitorFallback);
    this.renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true, powerPreference: 'high-performance' });
    this.renderer.setPixelRatio(Math.min(devicePixelRatio, 1.5));
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.toneMapping = THREE.AgXToneMapping;
    this.renderer.toneMappingExposure = .85;
    this.renderer.shadowMap.enabled = true; this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    const pmrem = new THREE.PMREMGenerator(this.renderer), room = new RoomEnvironment();
    this.environment = pmrem.fromScene(room, .04).texture; this.scene.environment = this.environment;
    this.scene.environmentIntensity = .45; room.dispose(); pmrem.dispose();
    this.environmentReady = this.loadPhotographicEnvironment();
    RectAreaLightUniformsLib.init(); this.scene.add(this.softbox, this.fillbox);
    this.scene.add(new THREE.HemisphereLight(0xdde7f2, 0x251a12, .18));
    this.key = new THREE.DirectionalLight(0xfff1df, 1.2); this.key.castShadow = true;
    this.key.shadow.mapSize.set(2048, 2048); this.key.shadow.camera.left = -2.5; this.key.shadow.camera.right = 2.5;
    this.key.shadow.camera.top = 2.5; this.key.shadow.camera.bottom = -2.5; this.key.shadow.camera.near = .1; this.key.shadow.camera.far = 12;
    this.key.shadow.normalBias = .004; this.key.shadow.bias = .0005; this.key.shadow.radius = 3;
    this.scene.add(this.key, this.key.target);
    this.resize();
  }
  private async loadPhotographicEnvironment() {
    try {
      const hdr = await new HDRLoader().loadAsync(ROOT + 'studio-small-09.hdr');
      if (this.disposed) { hdr.dispose(); return; }
      const pmrem = new THREE.PMREMGenerator(this.renderer);
      const next = pmrem.fromEquirectangular(hdr).texture;
      hdr.dispose(); pmrem.dispose(); this.environment.dispose();
      this.environment = next; this.scene.environment = next;
    } catch {
      // The small built-in room remains usable if the optional HDR download fails.
    }
  }
  // Byte-level download progress for the opening loader.
  private readonly downloads = new Map<string, { loaded: number; total: number }>();
  onDownloadProgress = () => {};
  private async loadTracked(url: string): Promise<GLTF> {
    const entry = { loaded: 0, total: 0 }; this.downloads.set(url, entry); this.onDownloadProgress();
    try {
      return await this.loader.loadAsync(url, event => {
        entry.loaded = event.loaded; if (event.lengthComputable && event.total) entry.total = event.total;
        this.onDownloadProgress();
      });
    } finally { entry.total ||= entry.loaded || 1; entry.loaded = entry.total; this.onDownloadProgress(); }
  }
  /** Fraction (0–1) of the assets requested so far; files without a known size count as pending until done. */
  downloadProgress() {
    let loaded = 0, total = 0, known = 0;
    for (const entry of this.downloads.values()) if (entry.total) { loaded += entry.loaded; total += entry.total; known++; }
    if (!this.downloads.size || !total) return 0;
    return Math.min(1, loaded / total) * known / this.downloads.size;
  }
  async loadHero() {
    await this.environmentReady;
    const hero = await this.loadTracked(ROOT + 'macbook-journey.glb');
    if (this.disposed) { this.disposeGroup(hero.scene); return; }
    this.hero = hero; this.scene.add(hero.scene);
    this.feet = hero.scene.getObjectByName('Journey_TravelFeet')!;
    this.spin = hero.scene.getObjectByName('Journey_MacBook_SpinPivot')!;
    this.lid = hero.scene.getObjectByName('Journey_MacBook_LidPivot')!;
    if (!this.feet || !this.spin || !this.lid || hero.animations.length !== 1) throw new Error('The laptop animation is incomplete.');
    this.sampleHero = createHeroSampler(hero.scene, hero.animations[0], this.manifest.stations[1].dock);
    this.setupMeshes(hero.scene);
    this.ready = true; this.onAssetsChanged();
  }
  private seek(mixer: THREE.AnimationMixer, action: THREE.AnimationAction, time: number) {
    // LoopOnce pauses at the endpoint. Reset that flag so seeking backward is reliable.
    action.enabled = true; action.paused = false; action.setEffectiveWeight(1); action.setEffectiveTimeScale(1);
    mixer.setTime(time);
  }
  private setupMeshes(group: THREE.Object3D) {
    group.traverse(o => {
      if (!(o instanceof THREE.Mesh)) return;
      const mats = Array.isArray(o.material) ? o.material : [o.material];
      o.castShadow = !mats.some(m => m.transparent || (m instanceof THREE.MeshPhysicalMaterial && m.transmission > 0));
      o.receiveShadow = true;
      for (const mat of mats) {
        if (mat instanceof THREE.MeshStandardMaterial) {
          mat.envMapIntensity = .65; mat.shadowSide = THREE.FrontSide;
          if (/MacBook_BlankGlass/.test(mat.name) || /SM_M5_Lid_(eFpSjyrDhTgtyuf|MwJmMcLbTBwQpxl)/.test(o.name)) {
            mat.color.setRGB(0, 0, 0); mat.emissive.setRGB(0, 0, 0); mat.emissiveIntensity = 0;
            mat.envMap = this.environment; mat.envMapIntensity = .015; mat.metalness = 0; mat.roughness = .05;
          }
          if (mat.map) mat.map.anisotropy = Math.min(8, this.renderer.capabilities.getMaxAnisotropy());
        }
      }
    });
  }
  private setupPrinter(group: THREE.Group) {
    const prefix = 'Shared_Resume_Prop_Printer.';
    // GLTFLoader removes periods when it makes names safe for animation bindings.
    const find = (suffix: string) => group.getObjectByName(prefix + suffix) ?? group.getObjectByName(THREE.PropertyBinding.sanitizeNodeName(prefix + suffix));
    const key = find('PrintButton'), anchor = find('PaperAnchor'), led = find('StatusLED');
    if (!key || !anchor || !led) throw new Error('The printer controls or paper anchor are missing.');
    const keyMaterials: PrinterControl['keyMaterials'] = [], lights: PrinterControl['lights'] = [];
    // These controls must not tint another mesh that shares the original plastic or LED material.
    for (const [object, isKey] of [[key, true], [led, false]] as const) object.traverse(o => {
      if (!(o instanceof THREE.Mesh) || (isKey && o !== key && /Label/.test(o.name))) return;
      const cloned = (Array.isArray(o.material) ? o.material : [o.material]).map(material => {
        const result = material.clone();
        if (result instanceof THREE.MeshStandardMaterial) {
          if (isKey) keyMaterials.push({ material: result, emissive: result.emissive.clone(), intensity: result.emissiveIntensity });
          else lights.push({ material: result, color: result.emissive.clone(), intensity: result.emissiveIntensity });
        }
        return result;
      });
      o.material = Array.isArray(o.material) ? cloned : cloned[0];
    });
    this.printer = { key, anchor, rest: key.position.clone(), keyMaterials, lights };
  }
  setPrintInteraction(hovered: boolean, focused: boolean) {
    this.printHovered = hovered; this.printFocused = focused;
  }
  private updatePrinter(state: JourneyState) {
    const printer = this.printer;
    if (!printer) return;
    const time = state.paper * 4, pressing = time > 0 && time < .18;
    this.printPressDepth = pressing ? .0007 * (time < .075 ? ease(time / .075) : 1 - ease((time - .075) / .105)) : 0;
    // Printer-local up is Y after glTF's Blender-to-browser axis conversion.
    printer.key.position.copy(printer.rest); printer.key.position.y -= this.printPressDepth;
    const interactive = state.phase.station === 5 && state.phase.kind === 'hold' && state.paper === 0;
    const highlighted = interactive && (this.printHovered || this.printFocused);
    for (const { material, emissive, intensity } of printer.keyMaterials) {
      if (highlighted) material.emissive.setHex(0xb59565); else material.emissive.copy(emissive);
      material.emissiveIntensity = highlighted ? this.printFocused ? .24 : .13 : intensity;
    }
    for (const { material, color, intensity } of printer.lights) {
      material.emissive.copy(color);
      material.emissiveIntensity = time > 0 && time < 4 ? intensity * (.55 + .45 * (.5 + .5 * Math.sin(time * Math.PI * 4))) : intensity;
    }
  }
  private projectPrintControl(): PrintControlProjection | undefined {
    if (!this.printer) return undefined;
    const { key } = this.printer, rect = this.canvas.getBoundingClientRect();
    const box = new THREE.Box3().setFromObject(key, true), screen = new THREE.Box2();
    for (const x of [box.min.x, box.max.x]) for (const y of [box.min.y, box.max.y]) for (const z of [box.min.z, box.max.z]) {
      const point = new THREE.Vector3(x, y, z).project(this.camera);
      screen.expandByPoint(new THREE.Vector2(rect.left + (point.x + 1) * rect.width / 2, rect.top + (1 - point.y) * rect.height / 2));
    }
    const center = box.getCenter(new THREE.Vector3()).project(this.camera);
    const x = rect.left + (center.x + 1) * rect.width / 2, y = rect.top + (1 - center.y) * rect.height / 2;
    const width = Math.max(44, screen.max.x - screen.min.x), height = Math.max(44, screen.max.y - screen.min.y);
    const bounds = (left: number, top: number, right: number, bottom: number): ScreenBounds => ({ left, top, right, bottom, width: right - left, height: bottom - top });
    const state = this.lastState;
    let visible = this.ready && !!this.paper && !this.paperFailed && state?.phase.station === 5 && state.phase.kind === 'hold'
      && !!this.stations.get(5)?.group.visible && this.stations.get(5)!.fade.value > .99
      && center.z >= -1 && center.z <= 1 && screen.min.x >= rect.left && screen.max.x <= rect.right && screen.min.y >= rect.top && screen.max.y <= rect.bottom;
    if (visible) {
      const ray = new THREE.Raycaster(), meshes: THREE.Object3D[] = [];
      ray.setFromCamera(new THREE.Vector2(center.x, center.y), this.camera);
      this.scene.traverseVisible(object => { if (object instanceof THREE.Mesh) meshes.push(object); });
      const hit = ray.intersectObjects(meshes, false)[0]?.object;
      visible = !!hit && (hit === key || key.getObjectById(hit.id) !== undefined);
    }
    return { visible, x, y, width, height, keyBounds: bounds(screen.min.x, screen.min.y, screen.max.x, screen.max.y),
      targetBounds: bounds(x - width / 2, y - height / 2, x + width / 2, y + height / 2),
      hovered: visible && this.printHovered, focused: visible && this.printFocused, pressDepth: this.printPressDepth };
  }
  printControlProjection() { return this.printControl; }
  notebookLinkProjection() { return this.notebookLinks; }
  private projectNotebookLinks(): NotebookLinkProjection[] {
    const book = this.notebook, state = this.lastState, station = this.stations.get(5);
    if (!book || !state || !station) return [];
    const rect = this.canvas.getBoundingClientRect();
    const active = this.ready && state.phase.station === 6 && state.phase.kind === 'hold' && station.group.visible && station.fade.value > .99;
    let meshes: THREE.Object3D[] | undefined;
    return NOTEBOOK_LINKS.map(({ id, corners }) => {
      const box = new THREE.Box2(), center = new THREE.Vector3();
      for (const [x, y, z] of corners) {
        // glTF converts Blender's Z-up local axes to Y-up: (x, y, z) -> (x, z, -y).
        const world = new THREE.Vector3(x, z, -y).applyMatrix4(book.matrixWorld);
        center.add(world);
        const p = world.project(this.camera);
        box.expandByPoint(new THREE.Vector2(rect.left + (p.x + 1) * rect.width / 2, rect.top + (1 - p.y) * rect.height / 2));
      }
      center.multiplyScalar(1 / corners.length);
      let visible = active && box.min.x >= rect.left && box.max.x <= rect.right && box.min.y >= rect.top && box.max.y <= rect.bottom;
      if (visible) {
        // Only expose a link when the page itself is the nearest surface under it.
        if (!meshes) { meshes = []; const list = meshes; this.scene.traverseVisible(o => { if (o instanceof THREE.Mesh) list.push(o); }); }
        const ndc = center.clone().project(this.camera), ray = new THREE.Raycaster();
        ray.setFromCamera(new THREE.Vector2(ndc.x, ndc.y), this.camera);
        const hit = ray.intersectObjects(meshes, false)[0]?.object;
        visible = !!hit && book.getObjectById(hit.id) !== undefined;
      }
      return { id, visible, left: box.min.x, top: box.min.y, width: box.max.x - box.min.x, height: box.max.y - box.min.y };
    });
  }
  loadStation(index: number): Promise<void> {
    if (index === 6) index = 5;
    if (index <= 0 || index > 6 || this.stations.has(index)) return Promise.resolve();
    if (this.pending.has(index)) return this.pending.get(index)!;
    if (this.errors.has(index)) return Promise.resolve();
    const pending = (async () => {
      try {
        const gltf = await this.loadTracked(ROOT + this.manifest.stations[index].asset);
        if (this.disposed) { this.disposeGroup(gltf.scene); return; }
        const group = gltf.scene; group.position.fromArray(this.manifest.stations[index].origin); group.visible = false;
        this.setupMeshes(group);
        // Display artwork is unlit; the portal preview uses the same live car camera as its destination.
        group.traverse(o => {
          if (!(o instanceof THREE.Mesh) || !o.name.startsWith('Screen_')) return;
          const old = o.material as THREE.MeshStandardMaterial;
          if (o.name === 'Screen_Ultrawide_Projects') {
            // Baked first frame until the live layout is painted (chord-uniform UVs on curved glass).
            o.material = new THREE.MeshBasicMaterial({ map: old.map, color: old.map ? 0xffffff : 0x101010, toneMapped: false });
            o.castShadow = o.receiveShadow = false; this.ultrawideScreen = o; this.reelPreviewKey = '';
            return;
          }
          o.material = new THREE.MeshBasicMaterial({ map: o.name === 'Screen_Workstation_UM' ? old.map : null, color: o.name === 'Screen_Workstation_UM' ? 0xffffff : 0x101010, toneMapped: false });
          o.castShadow = o.receiveShadow = false;
        });
        if (index === 2) {
          const f = this.manifest.reorder.workstation.screens.fsae;
          const portal = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), new THREE.MeshBasicMaterial({ map: this.carComposite.texture, toneMapped: false }));
          portal.name = 'Live_FSAE_Preview'; portal.position.fromArray(f.center).sub(v(this.manifest.stations[2].origin)).addScaledVector(v(f.normal), .0001);
          portal.quaternion.setFromRotationMatrix(new THREE.Matrix4().makeBasis(v(f.right),v(f.up),v(f.normal)));
          portal.castShadow = portal.receiveShadow = false; group.add(portal); this.carPortal = portal;
        }
        if (index === 5) { this.setupPrinter(group); this.notebook = group.getObjectByName('Shared_Contact_Notebook_Open'); }
        // Rebuild the two diagram labels as transparent text, without baked label cards.
        if(index===3)group.traverse(o=>{
          if(!(o instanceof THREE.Mesh)||!o.name.includes('FSAE_Label_DataLogging'))return;
          const text='Data logging';
          const canvas=document.createElement('canvas');canvas.width=1024;canvas.height=323;
          const ctx=canvas.getContext('2d')!;
          let font=canvas.height*.46;ctx.font=`600 ${font}px Arial`;
          font*=Math.min(1,canvas.width*.88/ctx.measureText(text).width);
          ctx.font=`600 ${font}px Arial`;ctx.fillStyle='#e9e5de';ctx.textAlign='center';ctx.textBaseline='middle';
          ctx.fillText(text,canvas.width/2,canvas.height/2);
          const texture=new THREE.CanvasTexture(canvas);texture.colorSpace=THREE.SRGBColorSpace;texture.flipY=false;
          const previous=Array.isArray(o.material)?o.material:[o.material];
          o.material=new THREE.MeshBasicMaterial({map:texture,transparent:true,depthWrite:false,side:THREE.DoubleSide,toneMapped:false});
          o.castShadow=o.receiveShadow=false;
          for(const material of previous)material.dispose();
        });
        if(index===3 && this.manifest.reorder.car.anchors){
          group.updateMatrixWorld(true);
          for(const [id,suffix] of [['data','DataLogging']] as const){
            let label:THREE.Mesh|undefined,connector:THREE.Mesh|undefined;
            group.traverse(o=>{if(o instanceof THREE.Mesh){if(o.name.includes('FSAE_Label_'+suffix))label=o;if(o.name.includes('FSAE_Connector_'+suffix))connector=o;}});
            if(label&&connector){
              const bounds=new THREE.Box3().setFromObject(label,true),start=bounds.getCenter(new THREE.Vector3());start.y=id==='data'?bounds.min.y:bounds.max.y;
              const end=v(this.manifest.reorder.car.anchors[id]);
              const mid=start.clone().lerp(end,.55);
              const points=[start,mid,end].map(point=>connector!.worldToLocal(point));
              const old=connector.geometry;connector.geometry=new THREE.TubeGeometry(new THREE.CatmullRomCurve3(points),20,.00045,4,false);old.dispose();
            }
          }
        }
        const cutaway={value:1},seatCutaway={value:1},cutMaterials=new Set<THREE.Material>(),seatMaterials=new Set<THREE.Material>();
        if(index===3)group.traverse(o=>{
          if(o instanceof THREE.Mesh && /FSAE_(Seat|ShoulderHarness|HarnessBuckle|RearBody|Nose|Dash|Steering)/.test(o.name)){
            const list=(Array.isArray(o.material)?o.material:[o.material]).map(m=>{const clone=m.clone();cutMaterials.add(clone);if(/FSAE_(Seat|ShoulderHarness|HarnessBuckle)/.test(o.name))seatMaterials.add(clone);return clone;});o.material=Array.isArray(o.material)?list:list[0];
          }
        });
        const annotations={value:1},annotationMaterials=new Set<THREE.Material>();
        group.traverse(o=>{if(o instanceof THREE.Mesh&&/FSAE_Label_|FSAE_Connector_/.test(o.name)){const ms=(Array.isArray(o.material)?o.material:[o.material]).map(m=>{const c=m.clone();annotationMaterials.add(c);return c;});o.material=Array.isArray(o.material)?ms:ms[0];}});
        const fade = { value: 1 }, materials = new Set<THREE.Material>(), callouts: THREE.Object3D[] = [];
        group.traverse(o => {
          if (/FSAE_Label_|FSAE_Connector_/.test(o.name)) callouts.push(o);
          if (o instanceof THREE.Mesh) for (const material of Array.isArray(o.material) ? o.material : [o.material]) materials.add(material);
        });
        // Screen-space coverage fade preserves original alpha and physical transmission.
        for (const mat of materials) {
          mat.onBeforeCompile = shader => {
            shader.uniforms.uStationOpacity = index===4?{value:1}:fade;
            shader.uniforms.uDeskBrightness=index===4?fade:{value:1};
            shader.uniforms.uCarBrightness = index===3?this.carBrightness:{value:1};
            shader.uniforms.uAnnotationOpacity=annotationMaterials.has(mat)?annotations:{value:1};
            shader.uniforms.uCutawayOpacity = seatMaterials.has(mat)?seatCutaway:cutMaterials.has(mat)?cutaway:{value:1};
            shader.fragmentShader = 'uniform float uDeskBrightness; uniform float uCarBrightness; uniform float uStationOpacity; uniform float uCutawayOpacity; uniform float uAnnotationOpacity;\n' + shader.fragmentShader;
            shader.fragmentShader = shader.fragmentShader.replace('#include <alphatest_fragment>', '#include <alphatest_fragment>\nfloat coverageNoise = fract(52.9829189 * fract(dot(gl_FragCoord.xy, vec2(0.06711056, 0.00583715))));\nif (coverageNoise > uStationOpacity * uCutawayOpacity * uAnnotationOpacity) discard;');
          };
          mat.onBeforeCompile = ((previous) => shader => { previous(shader,this.renderer); shader.fragmentShader=shader.fragmentShader.replace('#include <colorspace_fragment>','#include <colorspace_fragment>\ngl_FragColor.rgb *= uCarBrightness * uDeskBrightness;'); })(mat.onBeforeCompile);
          mat.customProgramCacheKey = () => index===4?'projects-desk-darken-v1':'portfolio-station-coverage-darken-v4'; mat.needsUpdate = true;
        }
        this.scene.add(group); this.stations.set(index, { group, materials: [...materials], fade, callouts, cutaway, seatCutaway, annotations, lastUsed: performance.now() });
      } catch (e) { this.errors.set(index, e instanceof Error ? e : new Error(String(e))); }
      finally { this.pending.delete(index); this.resourceEpoch++; this.onAssetsChanged(); }
    })();
    this.pending.set(index, pending); return pending;
  }
  private loadPaper() {
    if (this.paperPromise || this.paper) return;
    this.paperPromise = (async () => {
      try {
        const paper = await this.loadTracked(ROOT + 'printer-paper-feed.glb');
        if (this.disposed) { this.disposeGroup(paper.scene); return; }
        this.paper = paper; paper.scene.visible = false; this.scene.add(paper.scene);
        this.paperMixer = new THREE.AnimationMixer(paper.scene); this.paperAction = this.paperMixer.clipAction(paper.animations[0]).setLoop(THREE.LoopOnce, 1);
        this.paperAction.clampWhenFinished = true; this.paperAction.play(); this.setupMeshes(paper.scene);
        // Temporary print artwork; keep the existing physically anchored paper feed.
        const placeholder=document.createElement('canvas');placeholder.width=850;placeholder.height=1100;
        const ctx=placeholder.getContext('2d')!;ctx.fillStyle='#faf9f6';ctx.fillRect(0,0,850,1100);
        ctx.fillStyle='#252525';ctx.font='600 48px Arial';ctx.fillText('RESUME',72,122);
        ctx.fillStyle='#737373';ctx.font='24px Arial';ctx.fillText('Placeholder — full resume coming soon',72,172);
        ctx.fillStyle='#d6d5d1';ctx.fillRect(72,214,706,3);
        for(const top of [280,470,660]){
          ctx.fillStyle='#b8b7b3';ctx.fillRect(72,top,220,14);
          ctx.fillStyle='#dfded9';for(let row=0;row<4;row++)ctx.fillRect(72,top+42+row*26,row===3?470:706,7);
        }
        const texture=new THREE.CanvasTexture(placeholder);texture.colorSpace=THREE.SRGBColorSpace;texture.flipY=false;
        texture.anisotropy=this.renderer.capabilities.getMaxAnisotropy();
        const replaced=new Set<THREE.Texture>();
        paper.scene.traverse(object=>{if(object instanceof THREE.Mesh)for(const material of Array.isArray(object.material)?object.material:[object.material]){
          if(material instanceof THREE.MeshStandardMaterial){if(material.map)replaced.add(material.map);material.map=texture;material.color.set(0xffffff);material.needsUpdate=true;}
        }});
        replaced.forEach(old=>old.dispose());
      } catch { this.paperFailed = true; }
      finally { this.onAssetsChanged(); }
    })();
  }
  retry() { this.errors.clear(); this.detailErrors.clear(); if (this.paperFailed) { this.paperPromise = undefined; this.paperFailed = false; } this.onAssetsChanged(); }
  resize() {
    const width = this.canvas.clientWidth || innerWidth, height = this.canvas.clientHeight || innerHeight;
    this.aspect = width / height; this.renderer.setSize(width, height, false);
    const frame = this.manifest.reorder.workstation.screens.fsae;
    this.carTarget.setSize(1920, Math.round(1920 * frame.height / frame.width)); this.carComposite.setSize(1920, Math.round(1920 * frame.height / frame.width));
  }
  private contactWindow?:ContactWindow;
  setContactWindow(rect?:ContactWindow){this.contactWindow=rect;}
  update(state: JourneyState) {
    this.camera.clearViewOffset();
    this.lastState = state;
    const { sample, pose } = evaluateCamera(this.manifest, state, this.aspect), i = state.phase.station;
    const width = pose.width;
    this.camera.position.fromArray(pose.position); this.camera.quaternion.fromArray(pose.quaternion);
    this.camera.left = -width / 2; this.camera.right = width / 2; this.camera.top = width / this.aspect / 2; this.camera.bottom = -this.camera.top; this.camera.updateProjectionMatrix();
    const heroShown = heroVisible(state);
    if (this.ready) this.hero.scene.visible = heroShown;
    if (this.ready && heroShown) {
      this.sampleHero(state.heroTime);
      const dock = this.manifest.stations[i].dock;
      this.feet.position.lerp(v(dock.position), state.dock); this.spin.quaternion.slerp(q(dock.quaternion), state.dock); this.lid.quaternion.slerp(q(dock.lid), state.dock);
      this.lid.quaternion.copy(workstationLid(state, this.lid.quaternion));
    }
    const kind = state.phase.kind;
    const focus = fsaeFocus(state);
    const entry=kind==='projects-monitor-entry';
    const contact=kind==='reel'||kind==='contact-card-center'||kind==='contact-card-expand';
    const model=modelSceneState(state),shrinking=kind==='car-shrink',revealing=kind==='projects-reveal';
    const transform=carModelTransform(this.manifest,model.progress);
    const car=this.stations.get(3);
    if(car){car.group.position.copy(transform.position);car.group.quaternion.copy(transform.rotation);car.group.scale.setScalar(transform.scale);}
    this.modelShadow.visible=model.model&&i<=4&&!contact&&model.desk>0;this.modelShadow.material.opacity=model.desk*.6;
    this.modelShadow.position.fromArray(this.manifest.reorder.projects.carModel.ground);this.modelShadow.position.y-=.001;this.modelShadow.rotation.set(-Math.PI/2,0,-.2);
    if(i===2||i===3||entry||revealing||kind==='reel')this.loadDetails();
    for(const [id,group] of this.details){
      const placement=piPlacement(this.manifest);
      // Immutable throughout the car/Pi sequence; follow only the subsequent desk-model move.
      group.position.fromArray(placement.position);
      group.scale.setScalar(placement.scale);group.rotation.set(0,placement.yaw,0);
      if(model.model){
        group.position.sub(v(this.manifest.stations[3].origin)).multiplyScalar(transform.scale).applyQuaternion(transform.rotation).add(transform.position);
        group.quaternion.premultiply(transform.rotation);group.scale.multiplyScalar(transform.scale);
      }
      group.visible=i===3||((revealing||entry)&&model.model);
      for(const mat of this.detailMaterials.get(id)??[])mat.opacity=1;
    }

    const carZoom = i === 3 && kind === 'screen-zoom' && state.local < SCREEN_SWAP;
    const lightOrigin = contact?this.manifest.stations[5].origin:carZoom ? this.manifest.stations[2].origin : this.manifest.stations[i].origin;
    const modelLight=transform.ground.clone().sub(v(this.manifest.reorder.projects.carModel.sourceGround));
    this.positionLights(shrinking?modelLight:revealing?modelLight.lerp(v(this.manifest.stations[4].origin),ease(state.local/.9)):v(lightOrigin));
    const visible = state.cameraMode === 'travel' ? sample.opacity : this.manifest.stations.map((_, k) => k === i ? 1 : 0);
    if (i === 3) { visible.fill(0); visible[carZoom ? 2 : 3] = focus.project && focus.carOpacity<=0 ? 0 : 1; }
    if(shrinking)visible[4]=model.desk;
    if (i === 4) {
      visible.fill(0);
      if(entry||revealing){visible[3]=1;visible[4]=1;}
      else if (contact) visible[5] = 1;
      else visible[4] = 1;
    }
    this.scene.background = shrinking?new THREE.Color(0x101010).multiplyScalar(model.desk):(i === 3 && !carZoom)?new THREE.Color(0x000000):null;
    if (this.carPortal) { const size = this.manifest.reorder.workstation.screens.fsae; this.carPortal.scale.set(size.width, size.height, 1); }
    this.updateFsaeTitle(state);
    // One physical group survives both chapters.
    visible[5] += visible[6]; visible[6] = 0;
    this.carBrightness.value=focus.project?focus.carOpacity:1;
    if(focus.project)this.blendPiLighting(focus.lightMix);
    const needed = visible.flatMap((opacity, index) => opacity > .001 ? [index] : []);
    if (visible[2] > 0 && !needed.includes(3)) needed.push(3);
    for (const index of needed) void this.loadStation(index);
    if (i >= 4) this.loadPaper();
    // Prefetch only adjacent stations; evict far scenes after a direct jump.
    for (const index of [i - 1, i, i + 1]) if (index > 0 && index <= 6) void this.loadStation(index);
    // Start the shared desk early: the Projects reel hands off to it live.
    if (i >= 3) void this.loadStation(5);
    for (const [index, loaded] of this.stations) {
      loaded.cutaway.value=index===3?focus.cutaway:1;
      loaded.seatCutaway.value=index===3?focus.seatCutaway:1;
      loaded.annotations.value=index===3?model.labels*focus.calloutOpacity:1;
      const alpha = visible[index]; loaded.fade.value = alpha; loaded.group.visible = alpha > .001;
      for (const label of loaded.callouts) label.visible = model.labels*focus.calloutOpacity>0;
      if (loaded.group.visible) loaded.lastUsed = performance.now();
      if (Math.abs(index - i) > 2 && !needed.includes(index)) {
        this.scene.remove(loaded.group); this.disposeGroup(loaded.group); this.stations.delete(index);
        if (index === 2) this.carPortal = undefined;
        if (index === 4) { this.ultrawideScreen = undefined; this.reelPreviewKey = ''; }
        if (index === 3 && this.fsaeTitle) this.fsaeTitle.key = '';
        if (index === 5) { this.printer = undefined; this.printControl = undefined; this.notebook = undefined; this.notebookLinks = []; }
      }
    }
    this.monitorFallback.visible=false;
    if(entry&&!this.stations.has(4)&&this.portalFallbackTexture){
      this.monitorFallback.visible=true;if(this.monitorFallback.material.map!==this.portalFallbackTexture){this.monitorFallback.material.map=this.portalFallbackTexture;this.monitorFallback.material.needsUpdate=true;}
      this.monitorFallback.position.copy(this.camera.position).add(new THREE.Vector3(0,0,-2).applyQuaternion(this.camera.quaternion));
      this.monitorFallback.quaternion.copy(this.camera.quaternion);this.monitorFallback.scale.set(width,width/this.aspect,1);
    }
    this.updatePrinter(state);
    this.scene.updateMatrixWorld(true); this.camera.updateMatrixWorld(true);
    if (this.paper && this.paperMixer && this.paperAction) {
      this.seek(this.paperMixer, this.paperAction, state.paper * 4);
      if (this.printer) this.printer.anchor.matrixWorld.decompose(this.paper.scene.position, this.paper.scene.quaternion, this.paper.scene.scale);
      this.paper.scene.visible = !!this.printer && visible[5] > .95 && state.paper > 0;
      this.paper.scene.updateMatrixWorld(true);
    }
    this.printControl = this.projectPrintControl();
    this.notebookLinks = this.projectNotebookLinks();
    const failed = needed.some(index => !(entry&&index===4)&&this.errors.has(index)) || (i >= 5 && this.paperFailed);
    const waiting = !this.ready || ((i===2||i===3)&&this.detailPending.size>0) || needed.some(index => !(entry&&index===4)&&!this.stations.has(index)) || (i >= 5 && !this.paper);
    return { waiting, failed, poster: this.manifest.stations[i].poster, current: i };
  }
  render() {
    if(this.lastState?.phase.kind==='reel'&&!this.contactWindow)return;
    const start=performance.now(),rect=this.contactWindow;
    if(rect&&this.lastState){
      const {pose}=evaluateCamera(this.manifest,this.lastState,rect.width/rect.height);
      this.camera.position.fromArray(pose.position);this.camera.quaternion.fromArray(pose.quaternion);
      this.camera.left=-pose.width/2;this.camera.right=pose.width/2;this.camera.top=pose.width*rect.height/rect.width/2;this.camera.bottom=-this.camera.top;
      // Expand the card's camera to the full canvas, then scissor to the visible window.
      this.camera.setViewOffset(rect.width,rect.height,-rect.x,-rect.y,this.canvas.clientWidth,this.canvas.clientHeight);
      this.camera.updateMatrixWorld(true);
      const x=Math.max(0,rect.x),y=Math.max(0,rect.y),right=Math.min(this.canvas.clientWidth,rect.x+rect.width),bottom=Math.min(this.canvas.clientHeight,rect.y+rect.height);
      this.renderer.setScissor(x,this.canvas.clientHeight-bottom,Math.max(0,right-x),Math.max(0,bottom-y));this.renderer.setScissorTest(true);
    }
    this.renderCarPreview();this.renderer.render(this.scene,this.camera);this.renderer.setScissorTest(false);this.frameMs.push(performance.now()-start);
    if (this.frameMs.length > 240) this.frameMs.shift();
  }
  probe(x = 0, y = 0) {
    const ray = new THREE.Raycaster(); ray.setFromCamera(new THREE.Vector2(x, y), this.camera);
    return ray.intersectObjects(this.scene.children, true).slice(0, 12).map(hit => {
      const o = hit.object as THREE.Mesh, m = (Array.isArray(o.material) ? o.material[hit.face?.materialIndex ?? 0] : o.material) as THREE.MeshStandardMaterial;
      return { name: o.name, material: m.name, color: m.color?.getHexString(), roughness: m.roughness, metalness: m.metalness, environment: m.envMapIntensity, distance: hit.distance };
    });
  }
  private blendPiLighting(t:number) {
    const anchor=v(piPlacement(this.manifest).position),scale=.25;
    this.key.position.lerp(anchor.clone().add(new THREE.Vector3(-2,4,3).multiplyScalar(scale)),t);
    this.key.target.position.lerp(anchor,t);
    for(const [light,offset] of [[this.softbox,new THREE.Vector3(-1.1,2.5,1.4)],[this.fillbox,new THREE.Vector3(1.3,1.8,-.8)]] as const){
      const old=light.quaternion.clone();light.position.lerp(anchor.clone().add(offset.multiplyScalar(scale)),t);light.lookAt(anchor);light.quaternion.copy(old.slerp(light.quaternion,t));
    }
  }
  private positionLights(origin: THREE.Vector3) {
    this.key.position.copy(origin).add(new THREE.Vector3(-2, 4, 3)); this.key.target.position.copy(origin).add(new THREE.Vector3(0,.75,0));
    this.softbox.position.copy(origin).add(new THREE.Vector3(-1.1,2.5,1.4)); this.softbox.lookAt(origin.clone().add(new THREE.Vector3(0,.85,0)));
    this.fillbox.position.copy(origin).add(new THREE.Vector3(1.3,1.8,-.8)); this.fillbox.lookAt(origin.clone().add(new THREE.Vector3(0,.9,0)));
  }
  private renderCarPreview() {
    if (!this.ready) return;
    const workstation = this.stations.get(2), car = this.stations.get(3);
    if (!workstation?.group.visible || !car || !this.carPortal) return;
    const saved = [...this.stations.values()].map(s => ({ s, visible: s.group.visible, alpha: s.fade.value }));
    const detailVisibility=[...this.details.values()].map(group=>({group,visible:group.visible}));
    for(const {group} of detailVisibility)group.visible=true;
    const hero = this.hero.scene.visible, background = this.scene.background,shadowVisible=this.modelShadow.visible;this.modelShadow.visible=false;
    const lightOrigin=this.key.position.clone().sub(new THREE.Vector3(-2,4,3));
    for (const {s} of saved) s.group.visible = s === car;
    car.fade.value = 1; this.hero.scene.visible = false; this.scene.background = new THREE.Color(0x000000);
    this.positionLights(v(this.manifest.stations[3].origin));
    const frame = this.manifest.reorder.workstation.screens.fsae;
    const screenAspect = frame.width / frame.height;
    const state = this.lastState;
    const zoom = state?.phase.station === 3 && state.phase.kind === 'screen-zoom' ? state.local : 0;
    const p = carPreviewPose(this.manifest.reorder.car.close, frame, this.aspect, zoom), cam = this.carCamera;
    cam.position.fromArray(p.position); cam.quaternion.fromArray(p.quaternion); cam.left = -p.width/2; cam.right = p.width/2; cam.top = p.width/screenAspect/2; cam.bottom = -cam.top; cam.updateProjectionMatrix();
    const titleCard = this.fsaeTitle?.mesh, titleVisible = titleCard?.visible ?? false;
    if (titleCard) titleCard.visible = false;
    // Pass 1: the car alone on a transparent background (linear, not yet tone-mapped).
    const clear = this.renderer.getClearColor(new THREE.Color()), clearAlpha = this.renderer.getClearAlpha();
    this.scene.background = null; this.renderer.setClearColor(0x000000, 0);
    this.renderer.setRenderTarget(this.carTarget); this.renderer.render(this.scene, cam);
    if (titleCard) titleCard.visible = titleVisible;
    // Pass 2: black glass, the title (kept on the glass, see monitorTitleRect), then the car over it.
    const t = this.fsaeTitleBox, vw = innerWidth, vh = innerHeight, title = this.compositeTitle;
    const titleMaterial = title.material as THREE.MeshBasicMaterial;
    title.visible = !!this.fsaeTitle?.key && titleVisible;
    if (title.visible) {
      const viewWidth = this.carHoldCamera().width, w = frame.width * viewWidth / p.width, h = w / this.aspect;
      const endWidth = (t.right - t.left) / vw * portalSize(frame, this.aspect).width;
      const r = monitorTitleRect(t, { width: vw, height: vh }, { width: w, height: h }, frame, frame.width * .03, endWidth);
      const uv = title.geometry.getAttribute('uv'), pos = title.geometry.getAttribute('position');
      // Plane corners are classified by vertex position; the canvas texture's v runs bottom-up.
      for (let k = 0; k < uv.count; k++) uv.setXY(k, (pos.getX(k) < 0 ? t.left : t.right) / vw, 1 - (pos.getY(k) > 0 ? t.top : t.bottom) / vh);
      uv.needsUpdate = true;
      title.position.set((r.left + r.right) / frame.width, (r.top + r.bottom) / frame.height, -.5);
      title.scale.set(2 * (r.right - r.left) / frame.width, 2 * (r.top - r.bottom) / frame.height, 1);
      if(titleMaterial.map!==this.fsaeTitle!.texture){titleMaterial.map=this.fsaeTitle!.texture;titleMaterial.needsUpdate=true;} titleMaterial.opacity = (titleCard!.material as THREE.MeshBasicMaterial).opacity;
    }
    const carMaterial = this.compositeCar.material as THREE.ShaderMaterial;
    carMaterial.uniforms.map.value = this.carTarget.texture; carMaterial.uniforms.toneMappingExposure.value = this.renderer.toneMappingExposure;
    if (!title.parent) { title.renderOrder = 0; this.compositeCar.renderOrder = 1; this.compositeScene.add(title, this.compositeCar); }
    this.renderer.setClearColor(0x000000, 1); this.renderer.setRenderTarget(this.carComposite); this.renderer.render(this.compositeScene, this.compositeCamera);
    this.renderer.setRenderTarget(null); this.renderer.setClearColor(clear, clearAlpha);
    for (const {s,visible,alpha} of saved) { s.group.visible = visible; s.fade.value = alpha; }
    this.hero.scene.visible = hero; this.scene.background = background;this.modelShadow.visible=shadowVisible;
    for(const {group,visible} of detailVisibility)group.visible=visible;
    this.positionLights(lightOrigin);
  }
  paintUltraScreen(root:HTMLElement,state:JourneyState){
    const group=this.stations.get(2)?.group;
    if(!group?.visible)return;
    const mesh=group.getObjectByName('Screen_Workstation_UM') as THREE.Mesh|undefined;
    const frame=this.screenFrame('Screen_Workstation_UM');
    if(!mesh||!frame||document.fonts.status!=='loaded')return;
    const aspect=frame.width/frame.height;
    root.style.setProperty('--um-page-height',`${1200/aspect}px`);
    root.style.height=`${2400/aspect}px`;
    const a=frame.center.clone().addScaledVector(frame.right,-frame.width/2).project(this.camera);
    const b=frame.center.clone().addScaledVector(frame.right,frame.width/2).project(this.camera);
    const projected=Math.hypot((b.x-a.x)*innerWidth/2,(b.y-a.y)*innerHeight/2);
    const size=ultraTextureSize(projected,devicePixelRatio,aspect,this.renderer.capabilities.maxTextureSize);
    size.width=Math.max(size.width,this.ultraCanvas?.width??0);size.width=Math.min(size.width,Math.floor(this.renderer.capabilities.maxTextureSize*aspect/2));size.height=Math.round(2*size.width/aspect);
    const key=`${size.width}:${size.height}:${root.dataset.revision}`;
    const material=mesh.material as THREE.MeshBasicMaterial;
    if(key!==this.ultraKey){
      fitUltraRole(root);
      const canvas=this.ultraCanvas??document.createElement('canvas');
      if(!this.ultraCanvas){canvas.id='ultra-screen-artwork';canvas.hidden=true;document.body.append(canvas);this.ultraCanvas=canvas;}
      canvas.width=size.width;canvas.height=size.height;
      const ctx=canvas.getContext('2d')!,rect=root.getBoundingClientRect();
      ctx.fillStyle='#000';ctx.fillRect(0,0,size.width,size.height);
      ctx.save();ctx.scale(size.width/rect.width,size.height/rect.height);ctx.translate(-rect.left,-rect.top);paintTree(ctx,root);ctx.restore();
      this.ultraTexture?.dispose();
      const texture=new THREE.CanvasTexture(canvas);texture.colorSpace=THREE.SRGBColorSpace;texture.flipY=false;texture.repeat.y=.5;texture.anisotropy=this.renderer.capabilities.getMaxAnisotropy();
      this.ultraTexture=texture;this.ultraKey=key;
    }
    this.ultraTexture!.offset.y=ultraScroll(state)*.5;
    if(material.map!==this.ultraTexture){material.map?.dispose();material.map=this.ultraTexture!;material.color.set(0xffffff);material.needsUpdate=true;}
  }
  /** Project the MacBook display plane into CSS pixels (the journey camera is orthographic). */
  hackScreenProjection() {
    const mesh=this.hero?.scene.getObjectByName('Journey_MacBook_Screen') as THREE.Mesh|undefined;
    if(!mesh)return;
    mesh.updateWorldMatrix(true,false);
    const positions=mesh.geometry.getAttribute('position'),normals=mesh.geometry.getAttribute('normal');
    const normal=new THREE.Vector3().fromBufferAttribute(normals,0).normalize();
    const right=new THREE.Vector3(1,0,0),up=new THREE.Vector3().crossVectors(normal,right).normalize();
    if(up.y<0)up.negate();
    let left=Infinity,rightEdge=-Infinity,bottom=Infinity,top=-Infinity,depth=0;
    for(let i=0;i<positions.count;i++){
      const p=new THREE.Vector3().fromBufferAttribute(positions,i);
      left=Math.min(left,p.x);rightEdge=Math.max(rightEdge,p.x);
      bottom=Math.min(bottom,p.dot(up));top=Math.max(top,p.dot(up));depth+=p.dot(normal)/positions.count;
    }
    const rect=this.renderer.domElement.getBoundingClientRect();
    const point=(x:number,y:number)=>{
      const p=right.clone().multiplyScalar(x).addScaledVector(up,y).addScaledVector(normal,depth).applyMatrix4(mesh.matrixWorld).project(this.camera);
      return {x:rect.left+(p.x+1)*rect.width/2,y:rect.top+(1-p.y)*rect.height/2};
    };
    return {a:point(left,top),b:point(rightEdge,top),c:point(left,bottom),aspect:(rightEdge-left)/(top-bottom)};
  }
  /** Query a real named screen mesh; independent of the hero rig. */
  private screenFrame(name: string) {
    const node = this.scene.getObjectByName(name) as THREE.Mesh | undefined;
    if (!node?.isMesh) return;
    node.updateWorldMatrix(true, false);
    const positions = node.geometry.getAttribute('position'), uv = node.geometry.getAttribute('uv');
    if (!uv) return;
    const corner = (u:number,v:number) => {
      let best=0,distance=Infinity;
      for(let i=0;i<uv.count;i++){const d=(uv.getX(i)-u)**2+(uv.getY(i)-v)**2;if(d<distance){distance=d;best=i;}}
      return new THREE.Vector3().fromBufferAttribute(positions,best).applyMatrix4(node.matrixWorld);
    };
    const a=corner(0,0), b=corner(1,0), c=corner(0,1), d=corner(1,1);
    const right=b.clone().sub(a), up=c.clone().sub(a), width=right.length(),height=up.length();
    right.normalize();up.normalize();
    // glTF flips V relative to Blender UVs; physical up is +Y for these monitor meshes.
    if (up.y < 0) up.negate();
    return {center:a.add(b).add(c).add(d).multiplyScalar(.25),right,up,normal:right.clone().cross(up).normalize(),width,height};
  }
  debugScreenFrame(name = 'Screen_Ultrawide_Projects') { const f = this.screenFrame(name); return f && { center:f.center.toArray(), normal:f.normal.toArray(), up:f.up.toArray(), width:f.width, height:f.height }; }
  /** The car overview camera at the current window shape (matches evaluateCamera's station-3 hold). */
  private carHoldCamera() {
    const pose = this.manifest.reorder.car.close, width = pose.width * Math.max(1, this.aspect / 1.5);
    const cam = new THREE.OrthographicCamera(-width / 2, width / 2, width / this.aspect / 2, -width / this.aspect / 2, .01, 100);
    cam.position.fromArray(pose.position); cam.quaternion.fromArray(pose.quaternion); cam.updateMatrixWorld(true); cam.updateProjectionMatrix();
    return { cam, width };
  }
  /** For each viewport band [top, bottom] (CSS px), the left-most x (px) of car geometry at the overview camera. */
  fsaeObstacleEdges(bands: [number, number][], labelsOnly = false, bodyOnly = false) {
    const car = this.stations.get(3);
    if (!car) return bands.map(() => Infinity);
    const { cam } = this.carHoldCamera(), edges = bands.map(() => Infinity), p = new THREE.Vector3();
    car.group.updateMatrixWorld(true);
    car.group.traverse(o => {
      if (!(o instanceof THREE.Mesh) || o === this.fsaeTitle?.mesh) return;
      // The title may tuck under the car, but never under the callout labels.
      if (labelsOnly && !o.name.includes('FSAE_Label_DataLogging')) return;
      if (bodyOnly && /FSAE_Label_|FSAE_Connector_/.test(o.name)) return;
      const position = o.geometry.getAttribute('position');
      for (let i = 0; i < position.count; i++) {
        p.fromBufferAttribute(position, i).applyMatrix4(o.matrixWorld).project(cam);
        const x = (p.x + 1) / 2 * innerWidth, y = (1 - p.y) / 2 * innerHeight;
        bands.forEach(([top, bottom], k) => { if (y >= top && y <= bottom && x < edges[k]) edges[k] = x; });
      }
    });
    return edges;
  }
  private baseCarClose?: { position: number[]; quaternion: number[]; width: number };
  /**
   * Move the car in the overview by (x, y) CSS px (right, down) by shifting the overview camera the other way.
   * Every view of the overview (hold, monitor preview, zoom, the start of the component routes) reads this pose.
   */
  setCarShift(x: number, y: number) {
    const pose = this.manifest.reorder.car.close, base = this.baseCarClose ??= structuredClone(pose);
    const width = base.width * Math.max(1, this.aspect / 1.5), height = width / this.aspect, q = new THREE.Quaternion().fromArray(base.quaternion);
    const right = new THREE.Vector3(1, 0, 0).applyQuaternion(q), up = new THREE.Vector3(0, 1, 0).applyQuaternion(q);
    pose.position = new THREE.Vector3().fromArray(base.position).addScaledVector(right, -x / innerWidth * width).addScaledVector(up, y / innerHeight * height).toArray();
  }
  /** Right-most x (CSS px) of the car body at the overview camera. */
  fsaeBodyRight() {
    const car = this.stations.get(3);
    if (!car) return 0;
    const { cam } = this.carHoldCamera(), p = new THREE.Vector3(); let right = -Infinity;
    car.group.updateMatrixWorld(true);
    car.group.traverse(o => {
      if (!(o instanceof THREE.Mesh) || o === this.fsaeTitle?.mesh || /FSAE_Label_|FSAE_Connector_/.test(o.name)) return;
      const position = o.geometry.getAttribute('position');
      for (let i = 0; i < position.count; i++) right = Math.max(right, (p.fromBufferAttribute(position, i).applyMatrix4(o.matrixWorld).project(cam).x + 1) / 2 * innerWidth);
    });
    return right;
  }
  /** Screen rectangles (CSS px) of the callout labels at the car overview camera. */
  fsaeLabelRects() {
    const car = this.stations.get(3), rects: { left: number; top: number; right: number; bottom: number }[] = [];
    if (!car) return rects;
    const { cam } = this.carHoldCamera(), p = new THREE.Vector3();
    car.group.updateMatrixWorld(true);
    car.group.traverse(o => {
      if (!(o instanceof THREE.Mesh) || !o.name.includes('FSAE_Label_DataLogging')) return;
      const r = { left: Infinity, top: Infinity, right: -Infinity, bottom: -Infinity }, position = o.geometry.getAttribute('position');
      for (let i = 0; i < position.count; i++) {
        p.fromBufferAttribute(position, i).applyMatrix4(o.matrixWorld).project(cam);
        const x = (p.x + 1) / 2 * innerWidth, y = (1 - p.y) / 2 * innerHeight;
        r.left = Math.min(r.left, x); r.right = Math.max(r.right, x); r.top = Math.min(r.top, y); r.bottom = Math.max(r.bottom, y);
      }
      rects.push(r);
    });
    return rects;
  }
  withSourceCar(paint:()=>void){
    const car=this.stations.get(3);if(!car){paint();return false;}
    const position=car.group.position.clone(),rotation=car.group.quaternion.clone(),scale=car.group.scale.clone(),key=this.fsaeTitle?.key;
    car.group.position.fromArray(this.manifest.stations[3].origin);car.group.quaternion.identity();car.group.scale.setScalar(1);car.group.updateMatrixWorld(true);
    paint();car.group.position.copy(position);car.group.quaternion.copy(rotation);car.group.scale.copy(scale);car.group.updateMatrixWorld(true);
    return key!==this.fsaeTitle?.key;
  }
  needsFsaeTitle(key: string) { return !!this.stations.get(3) && this.fsaeTitle?.key !== key; }
  /** Paint the laid-out title (`root`) and place its card behind the car, sized to the overview camera's view. */
  paintFsaeTitle(root: HTMLElement, key: string) {
    const car = this.stations.get(3);
    if (!car) return false;
    if (!this.fsaeTitle) {
      const canvas = document.createElement('canvas'), texture = new THREE.CanvasTexture(canvas);
      texture.colorSpace = THREE.SRGBColorSpace; texture.anisotropy = this.renderer.capabilities.getMaxAnisotropy();
      const mesh = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), new THREE.MeshBasicMaterial({ map: texture, transparent: true, depthWrite: false, toneMapped: false }));
      mesh.name = 'FSAE_Title_Card'; mesh.castShadow = mesh.receiveShadow = false;
      this.fsaeTitle = { mesh, canvas, texture, key: '' };
    }
    const title = this.fsaeTitle;
    if (!paintOverlay(title.canvas, root, this.renderer.getPixelRatio())) return false;
    // Title box in CSS px with room for glyph overhang, clamped to the window.
    { const b = root.getBoundingClientRect(), pad = parseFloat(getComputedStyle(root).fontSize) * .12;
      this.fsaeTitleBox = { left: Math.max(0, b.left - pad), top: Math.max(0, b.top - pad), right: Math.min(innerWidth, b.right + pad), bottom: Math.min(innerHeight, b.bottom + pad) }; }
    title.texture.dispose(); title.texture.needsUpdate = true;
    // Behind the whole car along the overview camera's axis; orthographic, so depth does not change its size.
    const { cam, width } = this.carHoldCamera(), forward = new THREE.Vector3(0, 0, -1).applyQuaternion(cam.quaternion);
    const box = new THREE.Box3();
    car.group.updateMatrixWorld(true);
    car.group.traverse(o => { if (o instanceof THREE.Mesh && o !== title.mesh) box.expandByObject(o); });
    let depth = 1;
    for (const x of [box.min.x, box.max.x]) for (const y of [box.min.y, box.max.y]) for (const z of [box.min.z, box.max.z]) depth = Math.max(depth, new THREE.Vector3(x, y, z).sub(cam.position).dot(forward));
    title.mesh.position.copy(cam.position).addScaledVector(forward, depth + .25).sub(car.group.position);
    title.mesh.quaternion.copy(cam.quaternion); title.mesh.scale.set(width, width / this.aspect, 1);
    if (title.mesh.parent !== car.group) car.group.add(title.mesh);
    title.key = key;
    // Repainting can follow a resize or a freshly reloaded car in this very frame.
    // Restore opacity now, rather than waiting for another scroll event.
    if(this.lastState)this.updateFsaeTitle(this.lastState);
    (this.compositeTitle.material as THREE.MeshBasicMaterial).needsUpdate=true;
    return true;
  }
  private updateFsaeTitle(state: JourneyState) {
    const title = this.fsaeTitle;
    if (!title) return;
    const opacity = title.key ? fsaeTitleOpacity(state) : 0;
    (title.mesh.material as THREE.MeshBasicMaterial).opacity = opacity; title.mesh.visible = opacity > .001;
  }
  /** Review/test hook: the painted reel frame as a PNG data URL. */
  reelPreviewImage() { return this.reelPreviewKey ? this.reelCanvas?.toDataURL('image/png') : undefined; }
  /** True when the ultrawide is loaded and its painted reel frame is missing or stale for `key`. */
  needsReelPreview(key: string) { return this.reelPreviewKey !== key || (!!this.ultrawideScreen && (this.ultrawideScreen.material as THREE.MeshBasicMaterial).map!==this.reelTexture); }
  /** Paint the reel's laid-out first frame (`root`) onto the curved ultrawide glass. */
  paintReelPreview(root: HTMLElement, stage: HTMLElement, key: string) {
    const screen = this.ultrawideScreen;
    const geometry = previewGeometry(this.manifest.reorder.ultrawide.screen, { width: innerWidth, height: innerHeight }, Math.min(4096, this.renderer.capabilities.maxTextureSize));
    const canvas = this.reelCanvas ??= document.createElement('canvas');
    const resized = canvas.width !== geometry.width || canvas.height !== geometry.height;
    if (!paintReel(canvas, root, stage, geometry)) return false;
    if (!this.reelTexture) {
      const texture = this.reelTexture = new THREE.CanvasTexture(canvas);
      // glTF UVs: v = 0 is the top row; keep the canvas the right way up.
      texture.flipY = false; texture.colorSpace = THREE.SRGBColorSpace;
      texture.anisotropy = this.renderer.capabilities.getMaxAnisotropy(); texture.minFilter = THREE.LinearMipmapLinearFilter; texture.generateMipmaps = true;
    } else { if (resized) this.reelTexture.dispose(); this.reelTexture.needsUpdate = true; }
    if(screen){
      const material=screen.material as THREE.MeshBasicMaterial;
      if(material.map!==this.reelTexture){material.map?.dispose();material.map=this.reelTexture;material.color.set(0xffffff);material.needsUpdate=true;}
    }
    const cropped=this.portalFallbackCanvas??=document.createElement('canvas');
    const crop=geometry.portal;cropped.width=Math.round(crop.width);cropped.height=Math.round(crop.height);
    cropped.getContext('2d')!.drawImage(canvas,crop.x,crop.y,crop.width,crop.height,0,0,cropped.width,cropped.height);
    if(!this.portalFallbackTexture){this.portalFallbackTexture=new THREE.CanvasTexture(cropped);this.portalFallbackTexture.colorSpace=THREE.SRGBColorSpace;}
    this.portalFallbackTexture.needsUpdate=true;
    this.reelPreviewKey = key; return true;
  }
  diagnostics() {
    const box = this.ready ? new THREE.Box3().setFromObject(this.hero.scene, true) : new THREE.Box3();
    const sorted = [...this.frameMs].sort((a, b) => a - b);
    const projected = new THREE.Box2();
    if (this.ready) this.hero.scene.traverse(o => {
      if (!(o instanceof THREE.Mesh)) return;
      const position = o.geometry.getAttribute('position'), vertex = new THREE.Vector3();
      for (let i = 0; i < position.count; i++) { vertex.fromBufferAttribute(position, i).applyMatrix4(o.matrixWorld).project(this.camera); projected.expandByPoint(new THREE.Vector2((vertex.x + 1) / 2, (1 - vertex.y) / 2)); }
    });
    const pi=this.details.get('data'),piBounds=pi?new THREE.Box3().setFromObject(pi,true):undefined;
    return { pi:pi?{uuid:pi.uuid,position:pi.position.toArray(),scale:pi.scale.toArray(),quaternion:pi.quaternion.toArray(),visible:pi.visible,opacity:this.detailMaterials.get('data')?.map(m=>m.opacity),bounds:piBounds?[piBounds.min.toArray(),piBounds.max.toArray()]:[]}:undefined,carBrightness:this.carBrightness.value,cameraNear:this.camera.near,detailPending:this.detailPending.size,
      contactWindow:this.contactWindow,contactReady:this.stations.has(5),
      modelTransform:{position:this.stations.get(3)?.group.position.toArray(),scale:this.stations.get(3)?.group.scale.x},monitorFallback:this.monitorFallback.visible, detailReady: this.lastState ? this.details.has(fsaeFocus(this.lastState).project!) : false, detailFailed: this.lastState ? this.detailErrors.has(fsaeFocus(this.lastState).project!) : false, ready: this.ready, phase: this.lastState?.phase, time: this.lastState?.heroTime, dock: this.lastState?.dock, paper: this.lastState?.paper, paperVisible: this.paper?.scene.visible ?? false, printControl: this.printControl,
      feet: this.feet?.position.toArray(), spin: this.spin?.quaternion.toArray(), lid: this.lid?.quaternion.toArray(), camera: this.camera.position.toArray(), cameraQuaternion: this.camera.quaternion.toArray(), cameraWidth: this.camera.right * 2,
      projectedBounds: [projected.min.toArray(), projected.max.toArray()], heroScale: this.hero?.scene.scale.toArray(), heroVisible: this.hero?.scene.visible ?? false, reelPreview: this.reelPreviewKey, loaded: [...this.stations.keys()], pending: [...this.pending.keys()], errors: [...this.errors.keys()], epoch: this.resourceEpoch,
      visibleStations: [...this.stations].filter(([, loaded]) => loaded.group.visible).map(([index]) => index),
      triangles: this.renderer.info.render.triangles, calls: this.renderer.info.render.calls, cpuRenderMedianMs: sorted[Math.floor(sorted.length / 2)] ?? 0, cpuRenderP95Ms: sorted[Math.floor(sorted.length * .95)] ?? 0,
      worldBounds: [box.min.toArray(), box.max.toArray()], textures: this.renderer.info.memory.textures };
  }
  private disposeGroup(group: THREE.Object3D) {
    const geometries = new Set<THREE.BufferGeometry>(), materials = new Set<THREE.Material>(), textures = new Set<THREE.Texture>();
    group.traverse(o => { if (o instanceof THREE.Mesh) { geometries.add(o.geometry); for (const m of Array.isArray(o.material) ? o.material : [o.material]) materials.add(m); } });
    for (const material of materials) for (const value of Object.values(material)) if (value instanceof THREE.Texture) textures.add(value);
    geometries.forEach(x => x.dispose()); materials.forEach(x => x.dispose());
    
    if(this.portalFallbackTexture)textures.delete(this.portalFallbackTexture);
    textures.delete(this.carTarget.texture); textures.delete(this.carComposite.texture);
    if (this.reelTexture) textures.delete(this.reelTexture);
    if (this.ultraTexture) textures.delete(this.ultraTexture);
    textures.forEach(x => { x.dispose(); if (typeof ImageBitmap !== 'undefined' && x.source.data instanceof ImageBitmap) x.source.data.close(); });
  }
  dispose() { this.disposed = true;this.ultraTexture?.dispose();this.ultraCanvas?.remove();this.modelShadow.material.map?.dispose();this.modelShadow.material.dispose();this.modelShadow.geometry.dispose();this.monitorFallback.geometry.dispose();this.monitorFallback.material.dispose();this.portalFallbackTexture?.dispose();this.reelTexture?.dispose(); for(const group of this.details.values())this.disposeGroup(group); if (this.hero) this.disposeGroup(this.hero.scene); for (const x of this.stations.values()) this.disposeGroup(x.group); if (this.paper) this.disposeGroup(this.paper.scene); this.carTarget.dispose(); this.carComposite.dispose(); this.environment.dispose(); this.renderer.dispose(); }
}
