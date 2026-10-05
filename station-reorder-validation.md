# Station reorder — implementation and verification

Completed 2026-10-02 in the requested sequence: plan, Figma storyboard, Blender, website, verification. The portfolio now runs Intro → Hack Atlantic → Workstation (Ultra Maritime, then Formula SAE monitor) → Formula SAE car → ultrawide → existing Projects reel → Resume → Contact. Total scroll budget: 22.6 units.

The hero is visible through the Workstation hold, then `visible = false` from the first sample of the FSAE screen zoom onward. Reverse scrolling restores its docked pose. The former MacBook-screen dive is removed. The real car render fills the right monitor; the unchanged live DOM reel is projected into the ultrawide, keeping its text sharp and its first frame identical at handoff.

## Deliverables

- Plan: [station-reorder-plan.md](station-reorder-plan.md).
- Blender scene: [portfolio-station-reorder.blend](blender/portfolio-station-reorder.blend). The original shared-desk and station files are preserved. New scenes are `Reorder — Workstation`, `Reorder — Formula SAE`, and `Reorder — Ultrawide`; the journey review has 721 frames at 30 fps.
- Blender authoring/export scripts: `blender/station_reorder.py`, `blender/station_reorder_review.py`. Source exports, measured camera/screen layout, textures, posters and render report are in `exports/station-reorder/`; screen artwork is in `assets/textures/station-reorder/`.
- Website changes: `web/src/journey.ts`, `camera.ts`, `scene.ts`, `types.ts`, `main.ts`, `reel.ts`, `style.css`; new `reduced-stills.ts`. Asset preparation: `web/scripts/prepare-assets.mjs` and new `prepare-station-reorder.mjs`. Four optimized GLBs and `journey.json` are updated in `web/public/assets/` and `exports/web/`; UM/FSAE posters are refreshed and an ultrawide poster is added.
- Tests: updated journey/camera/reel/browser tests; new geometry helper and Workstation clearance test. Deleted-route tests are preserved under `web/tests/legacy/` with an explanation. Original backups are in `backups/pre-station-reorder/`.

`web/src/projects.ts`, reel markup, card titles/layout/scroll budget, shared-desk GLB, printer animation, notebook links, Intro configuration and Hack Atlantic assets remain unchanged. The original Intro/Hack rig transforms are compared against the backed-up GLB. HDR and RectArea lighting are retained in the runtime, recovered from the prior lighting implementation because the starting scene file lacked them. Two failure-path fixes prevent a loading overlay blocking Retry and prevent rendering the car preview before the hero finishes loading; the normal 0→100 loader is unchanged.

## Figma

[Open the storyboard](https://www.figma.com/design/AAoP4nNd3n9QzR9C2Cjarm/?node-id=144-13152). Page `0:1`, section `144:13152`.

| Row | Node | Screenshot |
| --- | --- | --- |
| Hack Atlantic → Workstation | `144:13155` | [Row 1](figma_refs/station-reorder/row-1.png) |
| UM → FSAE monitor pan | `144:13258` | [Row 2](figma_refs/station-reorder/row-2.png) |
| FSAE screen → car | `144:13361` | [Row 3](figma_refs/station-reorder/row-3.png) |
| FSAE → ultrawide | `144:13420` | [Row 4](figma_refs/station-reorder/row-4.png) |
| Ultrawide → DOM reel | `144:13512` | [Row 5](figma_refs/station-reorder/row-5.png) |

Screen components: `52:6676` (Ultra Maritime), `144:13616` (real FSAE car preview), `144:13618` (Projects reel preview). The exact browser first frame is image node `147:13160` inside the Projects component. The old blank UM component was cloned before editing.

[Verified desktop/phone comparison sheet](https://www.figma.com/design/AAoP4nNd3n9QzR9C2Cjarm/?node-id=153-13160): section `153:13160`, desktop image `153:13162`, phone image `153:13163`. The drawings remain intact; the actual captures are a separate comparison section. Automatic review rejected an attempted broad replacement of drawings, so that replacement was not performed.

Old routes are retained and marked SUPERSEDED: `4:740`, `13:2443`, `49:6477`, `49:7128`, `48:6021`, `48:6638`, `138:12988`, `138:12989`, `138:13159`, `138:13164`, `138:13169`, `138:13174`.

## Verification results

All required commands passed:

- `npx tsc --noEmit`
- `npm test` — **44 passed, 0 failed**
- `node tests/browser.mjs` — **PASS**, Chrome 154.0.8037.97, desktop **1440×960**, phone **390×844**
- `npm run build` — PASS; Vite reports the existing large-bundle warning.

Browser verification captured 10/30/50/70/90% of all five transitions at both viewport sizes: **50 transition images**, plus handoff, card, print, contact and reduced-motion captures. It checked 101 forward samples and the same 101 samples backward per viewport, arbitrary direct seeks, visible camera joins, all three historic hashes, refresh/resize restoration, each held card center, live desk handoff, keyboard printing, five notebook links, static order, reduced-motion crossfade reversal, native scrolling, context loss, asset retry and hero-load fallback. No page errors occurred.

| Handoff | Desktop mean channel difference / 255 | Phone mean channel difference / 255 |
| --- | ---: | ---: |
| Monitor preview → live car | 0.098955 | 0.086171 |
| Ultrawide preview → DOM reel | 0.000000241 | 0.000002025 |

Car differences are tiny rasterization/antialiasing changes; fewer than 0.17% of channels differ by more than 12/255. Reel card bounds differ by less than .2 pixels. Both visible handoffs pass the image comparison thresholds.

Headless Workbench rendered all **25 Blender keyframes**. The report asserts hero invisibility from the FSAE zoom onward. Inspection found and fixed a displaced review-only ultrawide screen; the final screen is flush with its housing. No unintended station geometry or camera intersections remain in the final captures. Workbench is a geometry check and displays flat gray screens; textured Cycles posters and browser screenshots verify the screen content.

Workstation world origin is `(4.4,0,.8)` in glTF coordinates, with a .05 m gap between adjacent tabletops. The isolated car is at `(4.4,0,-12)`, ultrawide at `(6,0,0)`, shared desk unchanged at x=10. Geometry tests sample flight and opening against actual monitor/mug bounds and verify the laptop rests on the tabletop. The first Intro/Hack flight matches the original rig within 0.00002 m/radians.

Evidence:

- [Browser report](web/test-results/station-reorder/browser-report.json), [camera poses at all keyframes](web/test-results/station-reorder/camera-keyframes.json)
- [Desktop contact sheet](web/test-results/station-reorder/desktop-contact-sheet.png), [phone contact sheet](web/test-results/station-reorder/phone-contact-sheet.png)
- [Blender contact sheet](exports/station-reorder/blender-contact-sheet.png), [25-frame Blender report](exports/station-reorder/blender-keyframe-report.json)
- [Reduced-motion crossfade](web/test-results/station-reorder/reduced-motion-crossfade.png)
- Command logs: `web/test-results/station-reorder/{unit-tests,production-build,browser,blender-render}.log`

## Storyboard comparison

All five rows retain their 10/30/50/70/90 labels and captions without overlapping annotation text. Cropping within monitor-pan and screen-fill drawings represents intentional camera framing. The original storyboard is schematic; the separate verified sheet records the final photographic result.

| Row | Difference from the schematic |
| --- | --- |
| Landing | Runtime retains the real desk materials and follows the rig through empty space. Depth alignment occurs during lift for physical monitor clearance. |
| Monitor pan | Runtime frames each monitor more tightly; the outgoing UM text leaves the viewport during the pan. The held UM view contains all placeholder copy. |
| Car zoom | Runtime uses the real car and existing callouts, with a viewport-shaped inner image. It fills at 80% and swaps to the identical live framing at 90%. |
| Ultrawide arrival | The middle of the transfer is empty space while the camera travels; the schematic already suggests the destination there. There is no flip or roll. |
| Reel zoom | Runtime and the final screen component use the exact existing DOM layout and native font. The schematic uses Geist Mono annotations and approximate card drawings. |
| Phone | Portrait-shaped inner previews fit inside the glass, then expand to the full viewport. More empty vertical space is visible around the 3D objects; the existing phone reel layout remains unchanged. |

Reduced motion crossfades stationary stills as the user scrolls; static mode presents the eight still/list entries in the new order. Both retain the project list and accessible Resume/Contact controls.

## Content still needed

Ultra Maritime's existing Figma screen contained no factual work copy. It now explicitly says **CONTENT PENDING / DAX TO PROVIDE**, followed by `[Role and dates]`, `[What I worked on]`, and `[Contribution 01]`, `[Contribution 02]`, `[Contribution 03]`. These five fields need Dax's text; no employment facts were invented.

The four pre-existing reel media placeholders remain unchanged: Hack Atlantic ATS, Recap - iOS app, Codex for CAD, and ML Library. Existing FSAE callouts (Data logging; Accelerator pedal sensor) were reused, not expanded with new claims. No unresolved implementation questions remain.
