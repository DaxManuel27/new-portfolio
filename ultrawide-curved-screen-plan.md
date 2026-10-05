# Ultrawide curved screen — seamless curved display plan

Status: **implemented 2026-10-03** (see Results at the end).

## Problem

The ultrawide housing is curved, but the picture on it is flat. In the screenshot, the projects preview sits on a flat rectangle while the bezel bends away behind it, so the glass and the frame do not line up.

There are two causes, one in Blender and one in the website.

| # | Where | What happens now |
|---|---|---|
| 1 | `blender/station_reorder.py`, `screen()` (lines 46–58) | The curved, UV-mapped screen from `curve_ultrawide.py` (1.5 m radius, 48 segments, matches the housing) is **hidden** and replaced by a **flat 4-vertex quad** placed 1 mm in front of the bounding box. The housing bends 57 mm deep over the 0.82 m width (sagitta `R − √(R² − (w/2)²)` = 0.057 m), so the flat quad floats off the curve at both ends. |
| 2 | `web/src/scene.ts` `reelProjection()` + `web/src/main.ts` `updateReel()` | During the ultrawide arrival and zoom, the live DOM reel is laid onto the glass with a CSS `matrix()` (an affine transform). An affine transform can only make a flat parallelogram, so even on a curved mesh the preview would still look flat and slide over the bezel when the camera moves. |

Both have to change. Fixing only the mesh would still leave the DOM overlay flat on top of it.

## Goal

- The screen picture follows the housing curve exactly, at every camera angle (arrival, approach, hold, zoom), with no visible gap, overlap or flicker against the bezel.
- At the end of the zoom, when the screen fills the window, the hand-off to the live Projects reel is **pixel-identical**, with no jump in layout, colour or text position.
- The Projects reel itself does not change: cards, titles, layout, scroll length and the hand-off to the desk all stay the same.
- Reverse scrolling, direct `#projects` links, phone size and reduced motion all keep working.

## Approach

### 1. Blender: put the curved glass back

Work in `blender/portfolio-station-reorder.blend`, scene `Reorder — Ultrawide`. Save a backup first under `backups/pre-curved-ultrawide/`.

- Change `screen()` in `station_reorder.py` so it takes a `curved=True` option for the ultrawide. Instead of a flat quad, it builds an arc mesh that is **concentric with the housing's front face**:
  - same 1.5 m radius and the same 48 segment x-positions as `Ultrawide_CurvedHousing_Mesh`, so the glass edge follows every housing facet;
  - set 0.5–1 mm in front of the black inner bezel surface along its whole length, so it never z-fights or shows a gap;
  - same 0.82 × 0.351 m active area as now.
- **UV layout: spaced by chord, not by arc length.** `u` runs evenly with the straight-across x-position (`x = R sin θ`), not with distance along the curve. Seen straight on, which is how the camera sees it at the end of the zoom, the picture then lands exactly where a flat screen would put it, so the hand-off can match pixel for pixel. Seen at an angle, it still wraps the curve like a real panel. The original `curve_ultrawide.py` mesh is already spaced this way (even x steps), so the new code reuses that rule. Name the UV layer `ArtworkUV` to match the other screens.
- Keep the object name `Screen_Ultrawide_Projects` and its material slot, so the website finds it the same way it does now.
- Re-render `projects-monitor.png` onto the curved UVs (used for stills, posters and the fallback before the live texture is ready), then re-export `station-projects.glb` through `web/scripts/prepare-station-reorder.mjs` / `prepare-assets.mjs`.
- Add to the manifest screen frame (`journey.json` → `reorder.ultrawide.screen`): `curvature: { radius, segments, chordWidth, sagitta }`. The camera framing keeps using the chord rectangle (centre, width, height), which is unchanged.
- Check the two Workstation monitors (Ultra Maritime and Formula SAE). If their housings are flat, they need no change; if either is curved, apply the same fix to it.

### 2. Website: draw the preview onto the curved glass instead of overlaying the DOM

- New module `web/src/reel-preview.ts`. It draws the reel's **first frame** into a `CanvasTexture`, which is set as the `map` of `Screen_Ultrawide_Projects` with an unlit, non-tone-mapped material so its colours match the DOM exactly.
- The layout is **measured from the real DOM** rather than copied:
  1. lay out the reel off-screen at position 0, invisible and with no transform;
  2. read each element's box (`#reel-heading`, every `.reel-card` with its name, `#reel-frame`, `#reel-hint`) and its computed font and colour;
  3. draw them at those exact positions on the canvas, with the stage's radial-gradient background behind them.
  
  This way any later CSS change carries over to the preview automatically.
- Canvas size: the viewport-aspect "portal" rectangle from `portalSize()`, drawn at up to 4096 px wide, centred in a texture with the glass's aspect ratio. The area outside the portal is the stage gradient, so the whole glass reads as one screen. The texture gets mipmaps and anisotropic filtering, and is redrawn only on resize, after fonts load, or when the projects list changes. It is never redrawn every frame.
- Remove the affine overlay path: `reelProjection()` in `scene.ts`, the `preview` branch and `matrix()` transform in `updateReel()` in `main.ts`, and the related `reelProjection` field in `diagnostics()`. The DOM reel only becomes visible during the last part of the screen zoom (`reelView` already fades it in from 0.8 to 1.0), always untransformed.
- Hand-off: at the end of the zoom the camera looks straight at the screen. The chord-spaced UVs plus the measured layout make the canvas picture land on the same pixels as the DOM, so the existing crossfade (canvas out, DOM in) is invisible.
- `screenFrame()` already finds the corners from the UV extremes, so it keeps working on the curved mesh: the corners become the chord ends and the width becomes the chord length. Add a unit test so this stays true.
- Fallback: if the canvas texture can't be built (no 2D context, or fonts never load), keep the baked `projects-monitor.png` on the mesh. The crossfade still works, just without the pixel-identical guarantee.

### 3. Figma

Update `Screen XL / Projects reel preview` to note that it is mapped onto a curved display with chord-spaced UVs. Add one storyboard frame to the station-reorder section showing the curved ultrawide at the arrival angle, before and after.

## Verification

- **Blender:** headless renders of the housing and screen at the arrival, the 45° approach and straight on. Measure per segment that the screen-to-bezel distance stays within 0.5–1 mm with no intersections. Workbench close-ups of both screen edges show no gap.
- **Unit tests:**
  - the chord-spaced UV mapping function;
  - `screenFrame()` on a curved test mesh gives chord width and centre;
  - `reelView` timings unchanged;
  - the existing journey, camera and reel tests still pass.
- **Browser tests** (desktop 1440×960 and phone 390×844):
  - the measured canvas layout matches the DOM rectangles within 1 px;
  - at the swap point, a pixel diff between the last canvas-only frame and the first DOM frame shows no visible difference (mean error under 2 %, no shifted edges);
  - screenshots at 10/30/50/70/90 % of the ultrawide arrival, approach and zoom show the picture following the curve with no gap at the bezel;
  - reverse scrolling and `#projects` links behave as before;
  - no console errors.
- Run `npx tsc --noEmit`, `npm test` and `node tests/browser.mjs`. All must pass.

## Files touched

`blender/station_reorder.py` (plus a small `blender/curve_ultrawide_screen.py` helper), `blender/portfolio-station-reorder.blend`, `web/public/assets/station-projects.glb`, `journey.json` and the ultrawide poster/still; `web/src/reel-preview.ts` (new), `scene.ts`, `main.ts`, `types.ts`; new and updated tests in `web/tests/`; the Figma screen component. Backups of every changed file go in `backups/pre-curved-ultrawide/`.

## Risks

- **Text sharpness:** canvas text is a raster. At 4096 px it stays sharp through the zoom, and the DOM takes over before the text gets larger than that.
- **Font matching:** the canvas uses the same computed font, but sub-pixel anti-aliasing can differ slightly. The crossfade already covers the last 20 % of the zoom, which hides this.
- **Phone:** the portal is a tall, narrow rectangle in the middle of a very wide screen. That is unchanged from today; only the curve is fixed.

## Results

- **Blender:** `Screen_Ultrawide_Projects` is now a 96-segment arc, radius 1.49925 m, concentric with the bezel's front face (circle-fit error 1e-8 m). It sits 0.75 mm in front of the bezel along its whole length (measured from 0.749 to 0.751 mm), inside the bezel on every side, with chord-uniform `ArtworkUV`. Built by `blender/curve_ultrawide_screen.py`; `station_reorder.py` now calls it, so rebuilds keep the curve. Close-up Cycles renders of both edges show no gap or overlap.
- **Assets:** `station-projects.glb`, `journey.json` (`reorder.ultrawide.screen` gains `curvature`, and its centre moves to the chord rectangle's centre) and `ultrawide.webp` were regenerated with `prepare-station-reorder.mjs --only=station-projects`. The baked fallback texture `projects-monitor.png` is now painted by the website's own preview painter, so it no longer contains the "Reduce motion" button.
- **Website:** new `web/src/reel-preview.ts` paints the measured first frame of the DOM reel into a canvas texture on the curved glass. The affine `reelProjection()` overlay is removed; the DOM reel only appears untransformed during the last part of the zoom.
- **Hand-off check** (`tests/ultrawide-curve.mjs`), comparing the canvas-only frame with the DOM-only frame: desktop 1440×960 mean error 0.32 % with no positional shift (best-match offset 0 px for title, card, counter and hint); phone 390×844 mean error 0.52 %.
- **Unit tests:** new `tests/ultrawide-curve.test.ts` (4 tests) passes. The full suite has the same 6 failures with and without this change; they come from earlier work (missing `backups/…` and `exports/completion` fixtures, an outdated desk-arrival check, a Pi source test). The older `tests/browser.mjs` still expects 22.6 scroll units, but the FSAE focus work raised the total to 28.8 units.
