/**
 * Paints the Projects reel's first frame onto the curved ultrawide display.
 *
 * The live reel is DOM, and the DOM can only be overlaid with flat (affine) transforms, which
 * cannot follow the curved glass. Instead, the reel is laid out off-screen exactly as it will
 * appear, measured element by element, and painted into a canvas that becomes the display's
 * texture. The display mesh has chord-uniform UVs, so when the screen zoom ends straight on,
 * the texture lands on the same pixels as the DOM it hands over to.
 */
import { portalSize } from './camera';

export interface PreviewGeometry {
  /** Texture size in pixels (whole glass). */
  width: number; height: number;
  /** Viewport-shaped area inside the glass that fills the window at the end of the zoom. */
  portal: { x: number; y: number; width: number; height: number };
  /** Texture pixels per CSS pixel inside the portal. */
  scale: number;
}

/** Pure: the texture covers the whole glass; the portal is centred, matching the camera's end framing. */
export function previewGeometry(frame: { width: number; height: number }, viewport: { width: number; height: number }, maxWidth = 4096): PreviewGeometry {
  const width = maxWidth, height = Math.round(maxWidth * frame.height / frame.width);
  const portal = portalSize(frame, viewport.width / viewport.height);
  const pw = width * portal.width / frame.width, ph = height * portal.height / frame.height;
  return { width, height, portal: { x: (width - pw) / 2, y: (height - ph) / 2, width: pw, height: ph }, scale: pw / viewport.width };
}

type Box = { left: number; top: number; width: number; height: number };
/** A colour stop; `px` in unscaled CSS pixels or `fraction` of the gradient line, or neither (auto). */
interface Stop { color: string; px?: number; fraction?: number }
interface Layer { kind: 'radial' | 'linear' | 'repeating-linear'; config: string; stops: Stop[] }

/** Split on commas that are not inside parentheses. */
export function splitTop(value: string): string[] {
  const out: string[] = []; let depth = 0, start = 0;
  for (let i = 0; i < value.length; i++) {
    const c = value[i];
    if (c === '(') depth++; else if (c === ')') depth--;
    else if (c === ',' && depth === 0) { out.push(value.slice(start, i).trim()); start = i + 1; }
  }
  out.push(value.slice(start).trim());
  return out.filter(Boolean);
}

/** Parse computed `background-image` gradients (Chrome/Safari/Firefox serialisations). Unknown layers are skipped. */
export function parseGradients(value: string): Layer[] {
  if (!value || value === 'none') return [];
  const layers: Layer[] = [];
  for (const layer of splitTop(value)) {
    const match = /^(repeating-linear-gradient|linear-gradient|radial-gradient)\((.*)\)$/s.exec(layer);
    if (!match) continue;
    const kind = match[1] === 'radial-gradient' ? 'radial' : match[1] === 'linear-gradient' ? 'linear' : 'repeating-linear';
    const args = splitTop(match[2]);
    let config = '';
    if (args.length && /(deg|turn|rad|^to |\bat\b|circle|ellipse|closest|farthest)/.test(args[0]) && !/^(rgb|hsl|#|transparent)/.test(args[0])) config = args.shift()!;
    const stops: Stop[] = [];
    for (const arg of args) {
      const colorMatch = /^((?:rgba?|hsla?|color)\([^)]*\)|#[0-9a-f]+|[a-z]+)\s*(.*)$/i.exec(arg);
      if (!colorMatch) continue;
      const positions = colorMatch[2].split(/\s+/).filter(Boolean);
      if (!positions.length) stops.push({ color: colorMatch[1] });
      for (const p of positions) stops.push(p.endsWith('%') ? { color: colorMatch[1], fraction: parseFloat(p) / 100 } : { color: colorMatch[1], px: parseFloat(p) });
    }
    layers.push({ kind, config, stops });
  }
  return layers;
}
/** Resolve stops to 0–1 offsets along a gradient line `length` CSS px long, filling gaps like CSS. */
export function resolveStops(stops: Stop[], length: number): { color: string; offset: number }[] {
  const raw: (number | null)[] = stops.map(s => s.fraction ?? (s.px !== undefined ? s.px / length : null));
  if (raw[0] === null) raw[0] = 0;
  if (raw[raw.length - 1] === null) raw[raw.length - 1] = 1;
  for (let i = 1; i < raw.length; i++) if (raw[i] !== null && raw[i]! < raw[i - 1]!) raw[i] = raw[i - 1];
  for (let i = 1; i < raw.length; i++) if (raw[i] === null) {
    let j = i; while (raw[j] === null) j++;
    for (let k = i; k < j; k++) raw[k] = raw[i - 1]! + (raw[j]! - raw[i - 1]!) * (k - i + 1) / (j - i + 1);
  }
  return stops.map((s, i) => ({ color: s.color, offset: raw[i]! }));
}

function roundedRect(ctx: CanvasRenderingContext2D, b: Box, r: number) {
  const radius = Math.max(0, Math.min(r, b.width / 2, b.height / 2));
  ctx.beginPath(); ctx.roundRect(b.left, b.top, b.width, b.height, radius);
}

function paintGradient(ctx: CanvasRenderingContext2D, layer: Layer, b: Box, scale: number) {
  if (layer.kind === 'radial') {
    const at = /at\s+([-\d.]+)(%|px)\s+([-\d.]+)(%|px)/.exec(layer.config);
    const cx = b.left + (at ? (at[2] === '%' ? b.width * +at[1] / 100 : +at[1] * scale) : b.width / 2);
    const cy = b.top + (at ? (at[4] === '%' ? b.height * +at[3] / 100 : +at[3] * scale) : b.height / 2);
    // Default ellipse sized to the farthest corner keeps the farthest-side aspect ratio, scaled by √2.
    const rx = Math.max(cx - b.left, b.left + b.width - cx) * Math.SQRT2, ry = Math.max(cy - b.top, b.top + b.height - cy) * Math.SQRT2;
    if (!(rx > 0 && ry > 0)) return;
    const gradient = ctx.createRadialGradient(0, 0, 0, 0, 0, 1);
    for (const s of resolveStops(layer.stops, rx / scale)) gradient.addColorStop(Math.min(1, s.offset), s.color);
    ctx.save(); ctx.translate(cx, cy); ctx.scale(rx, ry); ctx.fillStyle = gradient;
    ctx.fillRect((b.left - cx) / rx, (b.top - cy) / ry, b.width / rx, b.height / ry); ctx.restore();
    return;
  }
  const angleMatch = /([-\d.]+)deg/.exec(layer.config), a = (angleMatch ? +angleMatch[1] : 180) * Math.PI / 180;
  const dx = Math.sin(a), dy = -Math.cos(a), length = Math.abs(b.width * dx) + Math.abs(b.height * dy);
  const cx = b.left + b.width / 2, cy = b.top + b.height / 2;
  const gradient = ctx.createLinearGradient(cx - dx * length / 2, cy - dy * length / 2, cx + dx * length / 2, cy + dy * length / 2);
  if (layer.kind === 'linear') for (const s of resolveStops(layer.stops, length / scale)) gradient.addColorStop(Math.min(1, s.offset), s.color);
  else {
    // Stops are in CSS px; repeat the period across the whole gradient line.
    const stops = layer.stops.map(s => ({ color: s.color, at: s.fraction !== undefined ? s.fraction * length / scale : s.px ?? 0 }));
    const period = (stops[stops.length - 1].at - stops[0].at) * scale;
    if (!(period > 0)) return;
    for (let start = 0; start < length; start += period) for (const s of stops) {
      const offset = (start + (s.at - stops[0].at) * scale) / length;
      if (offset <= 1) gradient.addColorStop(offset, s.color);
    }
  }
  ctx.fillStyle = gradient; ctx.fillRect(b.left, b.top, b.width, b.height);
}

const scaleOf = (el: HTMLElement, rect: DOMRect) => el.offsetWidth > 0 ? rect.width / el.offsetWidth : 1;
const px = (value: string) => parseFloat(value) || 0;

/** Paint an element's own box: background colour, gradient layers, images and border. */
function paintBox(ctx: CanvasRenderingContext2D, el: HTMLElement, rect: DOMRect, s: number) {
  const cs = getComputedStyle(el), radius = px(cs.borderTopLeftRadius) * s, b: Box = rect;
  const bg = cs.backgroundColor;
  if (bg && !/rgba\(0, 0, 0, 0\)|transparent/.test(bg)) { ctx.fillStyle = bg; roundedRect(ctx, b, radius); ctx.fill(); }
  const layers = parseGradients(cs.backgroundImage);
  if (layers.length) { ctx.save(); roundedRect(ctx, b, radius); ctx.clip(); for (const layer of layers.reverse()) paintGradient(ctx, layer, b, s); ctx.restore(); }
  if (el instanceof HTMLImageElement && el.complete && el.naturalWidth) {
    // object-fit: cover
    const k = Math.max(b.width / el.naturalWidth, b.height / el.naturalHeight), w = el.naturalWidth * k, h = el.naturalHeight * k;
    ctx.save(); roundedRect(ctx, b, radius); ctx.clip(); ctx.drawImage(el, b.left + (b.width - w) / 2, b.top + (b.height - h) / 2, w, h); ctx.restore();
  }
  const bw = px(cs.borderTopWidth) * s;
  if (bw > 0 && cs.borderTopStyle !== 'none') {
    ctx.save(); ctx.strokeStyle = cs.borderTopColor; ctx.lineWidth = bw;
    if (cs.borderTopStyle === 'dashed') ctx.setLineDash([3 * bw, 3 * bw]);
    roundedRect(ctx, { left: b.left + bw / 2, top: b.top + bw / 2, width: b.width - bw, height: b.height - bw }, Math.max(0, radius - bw / 2)); ctx.stroke(); ctx.restore();
  }
}

/** Paint a text node word by word at the positions the browser laid them out. */
function paintText(ctx: CanvasRenderingContext2D, node: Text, parent: HTMLElement, s: number) {
  const cs = getComputedStyle(parent), text = node.data, range = document.createRange();
  ctx.font = `${cs.fontStyle} ${cs.fontWeight} ${px(cs.fontSize) * s}px ${cs.fontFamily}`;
  ctx.fillStyle = cs.color; ctx.textBaseline = 'alphabetic';
  if ('letterSpacing' in ctx) (ctx as CanvasRenderingContext2D & { letterSpacing: string }).letterSpacing = `${(cs.letterSpacing === 'normal' ? 0 : px(cs.letterSpacing)) * s}px`;
  const upper = cs.textTransform === 'uppercase';
  for (const match of text.matchAll(/\S+/g)) {
    range.setStart(node, match.index!); range.setEnd(node, match.index! + match[0].length);
    const rect = range.getClientRects()[0];
    if (!rect || !rect.width) continue;
    const word = upper ? match[0].toUpperCase() : match[0], metrics = ctx.measureText(word);
    const ascent = metrics.fontBoundingBoxAscent ?? metrics.actualBoundingBoxAscent, descent = metrics.fontBoundingBoxDescent ?? metrics.actualBoundingBoxDescent;
    // Range boxes span the font's content area; centre the font box in it to find the baseline.
    ctx.fillText(word, rect.left, rect.top + (rect.height - ascent - descent) / 2 + ascent);
  }
}

interface Item { order: number; z: number; opacity: number; clips: { box: Box; radius: number }[]; paint: (ctx: CanvasRenderingContext2D) => void }

/**
 * Paint `root` (laid out at the reel's first frame, invisible but rendered) over `stage`'s background
 * into the portal area of a canvas sized by `geometry`. Coordinates are measured in CSS pixels
 * relative to the viewport and scaled into texture pixels.
 */
export function paintReel(canvas: HTMLCanvasElement, root: HTMLElement, stage: HTMLElement, geometry: PreviewGeometry) {
  canvas.width = geometry.width; canvas.height = geometry.height;
  const ctx = canvas.getContext('2d');
  if (!ctx) return false;
  const stageStyle = getComputedStyle(stage), outer = parseGradients(stageStyle.backgroundImage)[0]?.stops.at(-1)?.color ?? stageStyle.backgroundColor;
  // Glass outside the viewport-shaped portal continues the page's outer colour.
  ctx.fillStyle = outer || '#101010'; ctx.fillRect(0, 0, geometry.width, geometry.height);
  const { portal, scale } = geometry, viewport = { left: 0, top: 0, width: innerWidth, height: innerHeight };
  ctx.save(); ctx.translate(portal.x, portal.y); ctx.scale(scale, scale);
  ctx.beginPath(); ctx.rect(0, 0, viewport.width, viewport.height); ctx.clip();
  // The page background behind the reel.
  if (stageStyle.backgroundColor && !/rgba\(0, 0, 0, 0\)/.test(stageStyle.backgroundColor)) { ctx.fillStyle = stageStyle.backgroundColor; ctx.fillRect(0, 0, viewport.width, viewport.height); }
  for (const layer of parseGradients(stageStyle.backgroundImage).reverse()) paintGradient(ctx, layer, viewport, 1);

  paintTree(ctx, root);
  ctx.restore();
  return true;
}

/** Paint `root`'s boxes and text (measured where the browser laid them out) in CSS-pixel coordinates. */
export function paintTree(ctx: CanvasRenderingContext2D, root: HTMLElement) {
  // Collect boxes and text in DOM order with their stacking z-index, cumulative opacity and clips.
  const items: Item[] = [];
  let order = 0;
  const walk = (el: HTMLElement, z: number, opacity: number, clips: Item['clips']) => {
    const cs = getComputedStyle(el);
    if (cs.display === 'none') return;
    const ownZ = el !== root && cs.position !== 'static' && cs.zIndex !== 'auto' ? +cs.zIndex : null;
    // The outermost z-index below the reel root decides paint order (nested contexts inherit it).
    const zHere = z === Number.NEGATIVE_INFINITY ? (ownZ ?? 0) : z;
    const zNext = z === Number.NEGATIVE_INFINITY && ownZ !== null ? ownZ : z;
    const alpha = el === root ? 1 : opacity * +cs.opacity;
    if (alpha <= .001) return;
    const rect = el.getBoundingClientRect(), s = scaleOf(el, rect);
    if (el !== root) items.push({ order: order++, z: zHere, opacity: alpha, clips, paint: ctx => paintBox(ctx, el, rect, s) });
    const childClips = cs.overflow === 'hidden' && el !== root ? [...clips, { box: rect, radius: px(cs.borderTopLeftRadius) * s }] : clips;
    for (const child of el.childNodes) {
      if (child instanceof HTMLElement) walk(child, zNext, alpha, childClips);
      else if (child instanceof Text && child.data.trim()) {
        items.push({ order: order++, z: zHere, opacity: alpha, clips: childClips, paint: ctx => paintText(ctx, child as Text, el, s) });
      }
    }
  };
  walk(root, Number.NEGATIVE_INFINITY, 1, []);
  items.sort((a, b) => a.z - b.z || a.order - b.order);
  for (const item of items) {
    ctx.save(); ctx.globalAlpha = item.opacity;
    for (const clip of item.clips) { roundedRect(ctx, clip.box, clip.radius); ctx.clip(); }
    item.paint(ctx); ctx.restore();
  }
}

/**
 * Paint a viewport-sized transparent overlay of `root` (e.g. a stage title) at `pixelRatio`.
 * The root's own opacity is ignored, so a visually hidden source element still paints.
 */
export function paintOverlay(canvas: HTMLCanvasElement, root: HTMLElement, pixelRatio: number) {
  canvas.width = Math.round(innerWidth * pixelRatio); canvas.height = Math.round(innerHeight * pixelRatio);
  const ctx = canvas.getContext('2d');
  if (!ctx) return false;
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.save(); ctx.scale(canvas.width / innerWidth, canvas.height / innerHeight); paintTree(ctx, root); ctx.restore();
  return true;
}
