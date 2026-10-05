# Station reorder — Workstation → Formula SAE car → Ultrawide → Projects

Status: implemented and verified, 2026-10-02. Execution followed plan → Figma → Blender → website → verification. Originals are copied, without replacement, into `backups/pre-station-reorder/`. Final results and screenshots: `station-reorder-validation.md`.

## Order, indexes and links

| Index | ID / hash | Name | Source |
| --- | --- | --- | --- |
| 0 | intro | Intro | Unchanged |
| 1 | hack-atlantic | Hack Atlantic | Unchanged |
| 2 | ultra-maritime | Workstation · Ultra Maritime + Formula SAE | Existing two-monitor desk |
| 3 | formula-sae | Formula SAE | Existing car + diagrams, no laptop |
| 4 | projects | Projects | Ultrawide arrival, screen zoom, then unchanged reel |
| 5 | resume | Resume | Existing shared desk |
| 6 | contact | Contact | Same physical shared desk |

`#ultra-maritime` resolves to the left-monitor hold; `#formula-sae` resolves to the live car hold; `#projects` still resolves to the first held reel card. Ultrawide is the lead-in within index 4, not an additional reel card. Static mode adds an ultrawide still immediately before the existing project list. No titles, card layout, per-card budget (4 × .9 + .3 = 3.9 units), handoff (.9 units), printer, notebook links, loader or name treatment change.

## Production brief and placement

Reuse the photographic assets, geometry and scale (metres), UV them only where needed. No new decorative geometry: budget +6 screen triangles, maximum 2048 px source screen textures, meshopt GLB output with original maps preserved. Rig pivot chain and glTF conversion `(x,y,z) → (x,z,-y)` stay intact. Skills: Figma Use + component reconciliation; Blender Director, camera/animation and export workflow. Preserve original scenes; create `COL_Reorder_*` collections and a separate `blender/portfolio-station-reorder.blend`.

Hack Atlantic origin stays x=2. Final Workstation origin is glTF `(4.4,0,.8)` (slightly beyond the suggested 3.75, because the Hack Atlantic desk spans x=.65–3.35 and the 1.8 m Workstation needs clearance); Workstation spans x=3.5–5.3. Ultrawide origin remains `(6,0,0)`, spans x=5.125–6.875. Moving the Workstation forward .8 m gives adjacent tabletops .05 m depth clearance; visibility also isolates them. The FSAE stage is off-line at `(4.4,0,-12)`. Shared desk stays x=10. The laptop's world feet dock is glTF `(4.4,.74,1.02)`, before the monitor stands. Geometry tests sample the entire flight/opening and verify stand/mug clearance and tabletop contact. Depth alignment completes during the initial lift, before crossing the monitor corridor.

## Scroll budget

Preserve Intro .6; Hack Atlantic travel 1.5, approach .9, hold .6, exit .7. New Workstation travel 1.5, approach .9, Ultra Maritime hold .8, monitor pan .8, FSAE monitor hold .35. FSAE screen zoom 1.2, live car hold .8, pullback .65. Transfer to ultrawide 1.0, ultrawide approach .8, hold .35, screen zoom 1.2. Reel 3.9 and handoff .9 unchanged. Resume approach .9, hold .6, exit .25; Contact travel .15, approach .25, hold 1 unchanged. Total 22.6 units.

All interpolation is absolute scroll evaluation, with eased endpoints. Hero visible only through Workstation's FSAE monitor hold; false at the first sample of the car screen zoom, and everywhere later. Reverse restores the exact docked pose. Hidden hero clocks need not be continuous, but visible poses and cameras must be.

## Camera convention

Pose notation is Blender metres, `(position → target; orthographic horizontal width)` at desktop aspect 1.5. Monitor fronts face -Y. Camera quaternions come from these vectors, never Euler interpolation. Width accommodates phone framing; screen endpoints use viewport aspect. Car poses are translated to the isolated stage; exact measured poses are recorded in `exports/station-reorder/layout.json` after Blender inspection.

A = preserved Hack Atlantic departure camera. W = Workstation wide `(5.48,-3.19,1.91) → (4.4,-.8,.92); 2.15`. U = left monitor `(4.075,-3.2,1.14) → (4.075,-.64,1.14); .69`. F = right monitor `(4.725,-3.2,1.14) → (4.725,-.64,1.14); .69`. C = existing FSAE orientation, re-centered on the car and both callouts, widths 1.23349 close / 1.66521 wide. X = ultrawide wide `(7.09,-2.39,1.89) → (6,0,.94); 2.15`. S = straight-on ultrawide `(6.08,-2.4,1.14)`, width .97. Monitor screen-fill endpoints preserve front orientation and use a responsive inner rectangle fitted to the glass. Exact quaternions and positions are in `exports/station-reorder/layout.json`; browser captures evaluate these poses directly.

## Keyframes: 10 / 30 / 50 / 70 / 90 percent

| Transition | 10% | 30% | 50% | 70% | 90% | Hero / textures |
| --- | --- | --- | --- | --- | --- | --- |
| Hack Atlantic → Workstation | A; closed, lifting | Follow airborne rig | Track rig in clear corridor | Align over front dock | W; vertical touchdown | Visible; left UM info, right real car render |
| UM hold → FSAE monitor | U, readable | 22% U→F | 50% U→F | 78% U→F | F, car preview | Docked and visible; never zoom through UM text |
| FSAE monitor → car | F; screen-only push begins | Ease toward inner glass frame | Car image enlarged | Glass fills viewport | Live car at exactly matching framing | Hidden from 0%; preview is render of real car; matched crossfade after fill |
| FSAE → ultrawide | Pull back from car close | Car wide | Travel at wide framing; car exits view | X; ultrawide revealed | Ease X→S | Hidden; no flip/roll; Projects first-frame preview |
| Ultrawide → DOM reel | S; native preview inside screen | Zoom toward preview | Frame expands | Inner screen fills viewport | Identical DOM first frame, canvas retired | Hidden; same DOM layout projected into screen, then identity transform |

Each row will have five dark #0B0C0D storyboard cells, cream type and Geist Mono labels. Screen components are `Screen XL / Ultra Maritime`, `Screen / FSAE car preview`, `Screen XL / Projects reel preview`. Existing UM components are blank artwork: use explicitly marked role/work/contribution placeholders unless Dax supplies text. Existing FSAE callouts remain conceptual, as previously documented.

## Seamless screen transfers

Generalize screen geometry framing by named mesh and manifest screen bounds. FSAE preview is the real car render at the destination camera; a screen-shaped live viewport may replace that render before the zoom completes to avoid a render/lighting mismatch. At full screen only, swap the remote car camera without a visible cut. Ultrawide uses the actual unchanged DOM reel first frame projected into the glass, with native text and viewport-relative layout; the transform becomes identity at handoff. The mesh also has a rendered preview for Blender/stills. This avoids enlarged raster text and matches every viewport, including 390×844. No changes to card transforms, list, typography or subsequent reel progress.

Reduced-motion view uses stills and opacity fades, no camera zoom. Static view keeps the project list and contact/print accessibility. Loading failures continue to show relevant posters, retry and static fallback.

## Risks and verification

- Monitor bounds/UV orientation and laptop stand clearance: measure evaluated geometry and inspect EEVEE/Workbench keyframes before export.
- Continuous joins: compare positions, quaternion angle and width on both aspects; only allow remote scene substitution while monitor content fully covers viewport.
- Source lighting discrepancy: current scene.ts lacks HDR/RectArea lights; recover exact photographic setup from `backups/pre-reel/src/scene.ts`, preserving current reel/print/link logic.
- Concurrent edits: backups plus targeted patches, never wholesale restoration of the scene file.
- Preserve Intro/Hack animation samples; re-author only frames after Hack landing through Workstation, then hold the parked rig to frame 721.
- Old `projects-motion` and laptop `desk-arrival` tests describe deleted flights. Archive those tests under `web/tests/legacy/` with this rationale; retain printer geometry/interaction and shared-desk tests where applicable.
- Required: TypeScript, all active unit tests, browser regression at 1440×960 and 390×844; 50 transition screenshots; forward/reverse/direct/hash/refresh checks; hero visibility, both portal joins, original reel card centers, desk handoff, print and notebook links; loader and static/reduced motion.

## Evidence ledger

Figma storyboard: `144:13152`; rows `144:13155`, `144:13258`, `144:13361`, `144:13420`, `144:13512`. Screen components: UM `52:6676`, FSAE `144:13616`, Projects `144:13618`. Separate verified desktop/phone sheet: `153:13160`. Existing superseded boards are retained.

`npx tsc --noEmit`, `npm test` (44/44), `node tests/browser.mjs` and `npm run build` passed. Captures: 50 browser keyframes plus both handoff comparisons, 25 headless Workbench renders, five Figma row screenshots. Browser checks include both viewport sizes, 101 forward and reverse samples per viewport, direct/hash/refresh/resize, dock restoration, print, links, loading retry and reduced-motion still crossfades. No known functional blockers remain; content placeholders are listed in the validation report.
