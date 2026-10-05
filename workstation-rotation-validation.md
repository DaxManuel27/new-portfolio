# Hack Atlantic → Workstation rotation — implementation and verification

Completed 2026-10-02, following `hack-atlantic-workstation-rotation-plan.md`.

## Result

The closed MacBook lifts from Hack Atlantic, performs the earlier full heading turn with a small pitch tilt, aligns before descending, and lands at the existing Workstation dock. The camera follows with a stable 0.70 m horizontal framing envelope during the middle of the flight. The turn occupies travel 18–72%, with the existing 1.5-unit flight and 22.6-unit journey preserved.

The old heading endpoint of 385° is adapted to 360° for the new dock. Exported samples prove approximately 377.3° of signed heading change, including the initial −17.3° dock alignment. The original 12° pitch peak remains. There is no barrel roll or camera roll. At the 72% stop, interpolation between adjacent 30 fps samples leaves at most 0.064° of residual orientation; it is fully settled before landing.

The lid now closes smoothly during the first 80% of Hack Atlantic's exit and stays shut through travel. This small runtime hinge correction avoids the inherited open pose at the first flight sample while preserving the earlier baked Intro/Hack transforms. The body spin remains entirely baked and evaluated from absolute scroll progress.

## Figma and Blender

Figma file `AAoP4nNd3n9QzR9C2Cjarm`, page `0:1`: new section **156:13160**, alongside the existing boards. The earlier rows are retained.

| Travel | Cell node | Silhouette node |
| --- | --- | --- |
| 10% | 156:13164 | 156:13166 |
| 30% | 156:13173 | 156:13175 |
| 50% | 156:13182 | 156:13184 |
| 70% | 156:13191 | 156:13193 |
| 90% | 156:13200 | 156:13202 |

[Open the Figma rotation revision](https://www.figma.com/design/AAoP4nNd3n9QzR9C2Cjarm?node-id=156-13160). Screenshot: `figma_refs/workstation-rotation/storyboard.png`; labels checked for clipping and overlap.

Blender MCP authored the animation in `blender/portfolio-station-reorder.blend`, action `AN_Workstation_OriginalTurntable`. `blender/workstation_rotation.py` reproduces the unwrapped angle curves and travel camera. `blender/station_reorder.py` applies it after the existing Hack banner clearance correction. No path or station geometry changes were needed. Headless Workbench produced 25 station-transition renders; the five rotation captures are `exports/station-reorder/keyframes/row-1-{10,30,50,70,90}.png`.

## Changed files

- `blender/workstation_rotation.py`, `blender/station_reorder.py`, `blender/portfolio-station-reorder.blend`.
- `exports/station-reorder/macbook-journey.glb`, `travel.json`, `rotation-keyframes.json`.
- Optimized `macbook-journey.glb` and `journey.json` in `web/public/assets/` and `exports/web/`.
- `web/src/workstation-motion.ts` and `web/src/scene.ts`: deterministic departure hinge closure.
- `web/tests/workstation-rotation.test.ts` and `web/tests/workstation-rotation.mjs`: rotation, preservation, hinge joins, framing, captures and reverse seeks.
- Plan status and this report; Figma section and verification images.

Backups are under `backups/pre-workstation-rotation/`, including the live Blender file before authoring. Concurrent Hack Atlantic banner clearance and full-turn test work were preserved. Existing asset preparation's hero-only route exported the revised hero and manifest without rebuilding station assets.

## Verification

All required checks pass:

- `npx tsc --noEmit`.
- `npm test`: **50 passed, zero failures**.
- `npm run build`: passed; the existing large-bundle advisory remains.
- `node tests/browser.mjs`: passed at 1440×960 and 390×844.
- `node tests/workstation-rotation.mjs`: passed, with five captures per viewport and 81 forward/reverse samples from Hack exit through landing. Feet, body, hinge, camera position and orientation agree within 2×10⁻⁷; no browser errors.

Geometry tests cover banner/stand clearance with a 1 cm margin, Workstation monitors and mug, tabletop contact, and fractional rotation samples. Every tested silhouette corner stays within 97% of the viewport bounds. Camera joins, historic hashes, reload/resize restoration, hero visibility, print completion, notebook links, static mode, reduced motion, loading retry and fallbacks pass the existing regression.

The exported manifest's station poses are unchanged. Its first 121 camera samples and every sample after frame 241 exactly match the backup. The first four seconds of exported hero transforms also match the pre-rotation backup, including the concurrent banner correction.

FSAE handoff mean channel differences: desktop 0.09896, phone 0.08617; Projects handoff: desktop 0.00000024, phone 0.00000203. Both remain within the existing acceptance thresholds. Reel card centers, counters and live-desk handoff pass unchanged.

## Visual comparison and evidence

Reviewed Blender and browser 10/30/50/70/90 captures against the Figma revision. Rotation and tilt follow the specified angles and finish before descent. Figma uses schematic silhouettes; the website adds the existing desk, monitor content, lighting and material detail. The camera changes composition during departure and landing, so the silhouettes' apparent screen angle differs from the schematic's fixed view. Phone uses the same turn with more vertical space. No clipping was observed.

Evidence is in `web/test-results/workstation-rotation/`: desktop/phone PNGs, three contact sheets, `report.json`, and copied verification logs. The full regression report is also copied there as `browser-report.json`.

No new copy or placeholders were introduced. Existing Ultra Maritime content and all later journey behavior remain as before this rotation revision. No open implementation questions remain.
