# Printer paper path and physical print button

Date: 2026-10-02. Status: implemented. The shared Blender source, paper export, runtime assets and printer-mounted interaction have been updated. Validation results are recorded in `web/test-results/printer-clearance/`, `web/test-results/print-resume/` and `web/test-results/printer-motion/`.

The printer should feel like one physical object: press its own labelled button, watch a sheet emerge through the output slot, slide above the tray and its rim, then settle onto the desk. Continue using the approved placeholder résumé artwork.

## Findings from the current assets

- The grey obstruction is the printer's output tray and its front rim. Sampling the actual exported paper morph animation at 401 times, with paper vertices and triangle centres checked against those surfaces, found below-surface samples between approximately **1.36 and 3.40 seconds**. The worst measured gap was **11.5 mm below the rim at 1.54 seconds**. This confirms a geometry/path problem rather than just a camera illusion; this sampling is diagnostic evidence, not an exhaustive collision proof.
- `blender/completion_pipeline.py` creates seven paper shapes and interpolates between them. The feed shapes curve toward desk height, and a later polish pass replaces the last two shapes with a different supported resting shape. The interpolated sheet does not maintain clearance above the tray throughout that transition. Merely fixing the final resting pose is insufficient.
- The printer already has an **86 × 36 mm control strip** on its top-front-left surface, with a green LED and a separate **12.7 mm round button**. That is the appropriate place for the interaction. The current browser control is a detached HTML button below the scene.
- Existing tests cover click activation, feed progress and visibility. They do not yet check exposed paper against the tray geometry or verify that the button is attached to the printer.

## Intended sequence

Keep the complete interaction close to the existing four seconds. The ranges below are starting targets to tune in the mechanical blockout.

| Time after activation | Printer and button | Paper |
| --- | --- | --- |
| Before clicking | Labelled key is ready; status light steady | Output tray is empty |
| 0–0.18 s | Key depresses about 0.6–0.8 mm, then releases | Sheet remains inside |
| 0.18–0.4 s | Brief motor-start pause; light begins a restrained pulse | Leading edge reaches the slot |
| 0.4–3.6 s | Feed continues steadily | Sheet slides over the tray, clears its rim, then bends down toward the desk |
| 3.6–4.0 s | Feed slows to a stop; light settles | Final gentle settling, with the upper portion supported by the tray |
| Complete | Key returns to its normal position; further activation is disabled | One sheet stays printed through later scrolling |

The button label stays **Print Resume** on the physical key. A short accessible status announces printing and completion. Scrolling continues to control the camera; it does not start, reverse or retract the printed sheet. Keep the existing pause when leaving the desk or hiding the tab, and the fresh empty state on reload. Reduced motion reveals the result immediately after activation.

## 1. Build a supported paper path

1. **Use the actual printer surfaces as guides.** In the preserved shared-desk Blender scene, identify the output slot, tray top, raised rim and desktop. Establish the paper path in printer-local coordinates, so moving the printer cannot separate it from the sheet. Export a stable paper/slot anchor and resolve it in the browser instead of relying only on the present independent world-position offset.

2. **Keep the sheet above the tray until it clears the rim.** The first visible portion leaves the slot at the slot's height and travels across the tray. Use a small render clearance, initially about 0.5–1 mm, including sheet thickness and export precision. Begin the downward bend only beyond the front rim. The sheet can then form a gentle unsupported curve toward the desk. Its final supported shape must clear the same surfaces as every earlier frame.

3. **Advance the sheet along one continuous path.** Parameterize travel by distance along the path, maintaining the sheet's physical width and length. Hidden paper can follow an internal guide inside the printer. Keep the visible part continuous: no stretching, shrinking, edge reversal or last-moment morph to a separately positioned final sheet. Give the paper a subtle thickness and correct front/back shading so it does not disappear at a low viewing angle.

4. **Bake enough intermediate deformation.** Retain a reproducible mesh/morph export or a small baked rig; the preferred first attempt is a denser morph bake using the current lightweight sheet topology. Bake at 30 fps and validate fractional times between those frames. Add samples where curvature or clearance requires them. A cloth simulation is unnecessary for this controlled mechanical feed.

5. **Preserve depth and contact.** Fix the model/path rather than hiding the tray, forcing paper to draw over objects, or disabling depth testing. Keep the existing placeholder texture attached consistently to the same sheet and maintain its orientation throughout the feed.

## 2. Put the control on the printer

1. **Replace the small round key with a real labelled key.** Use the existing top-front-left control strip, retain the green LED to its left, and replace the ring/button pair with a bevelled rectangular key and shallow socket. Start around **60 × 30 mm**, centred near printer-local **(−81.5, −73, 126) mm**, then adjust within the strip after checking the actual mesh. Put a two-line **Print / Resume** label on the key surface, using a crisp decal or small label texture. Keep the current dark plastic material language.

2. **Separate the moving parts.** Give the key, socket, label and LED stable names under the printer hierarchy. The label follows the key. Move the key along its local surface normal for the short press and release. Animate only the LED's own material; do not brighten the printer body or other shared materials.

3. **Connect both input paths to one print action.** Pointer/touch hits on the key and keyboard activation must call the same guarded `startPrint()` operation. Drive the key press, LED and paper from the same print-job clock. Multiple clicks while printing or after completion must not create another sheet or restart the feed.

4. **Keep a semantic button attached to the physical key.** Retain the `#print-resume` HTML button for keyboard and assistive technology, project it onto the key's screen position, and use it as the aligned hit target. It should have no detached button chrome below the scene. Show focus on or immediately around the physical key. Use at least a 44 × 44 CSS-pixel target, extending invisibly around the key where needed, and confirm the printed label or a nearby focus/hover hint is readable on a phone.

5. **Respect the camera and normal scrolling.** Activate only when the Resume focus view is settled and the printer assets are ready. Hide/disable the projected control when offscreen, occluded or outside that view. Update its projection on resize and camera changes. A touch scroll or pointer drag across the printer must not trigger a print. A plain labelled HTML button remains in the reduced-motion/failure presentation.

## Production brief and file handoff

| Item | Decision |
| --- | --- |
| Asset and target | Interactive printer prop and one sheet, Blender source → Three.js browser portfolio |
| Look and scale | Current dark plastic printer and placeholder paper; existing metric dimensions |
| Geometry budget | Reuse the printer; target at most 2,000 additional triangles for key/socket and paper refinement |
| Texture budget | Reuse current paper artwork; at most one new label texture, up to 512 × 256 |
| Motion | Four-second print job; local key press and deterministic baked sheet deformation |
| Export | glTF/GLB, existing metre scale and Y-up conversion; stable named interaction/slot anchors |
| Source safety | Preserve the current Blender file and exports before rebuilding derived versions |

- Update the printer source in `blender/figma_components/figma_components.py` and paper generation in `blender/completion_pipeline.py`, or factor their focused rebuild operations into a dedicated printer script. Make the resulting revision reproducible.
- Carry the control and paper anchors into `blender/portfolio-shared-desk.blend` and `exports/shared-desk/station-shared.glb`. Regenerate the paper clip and the two derived station assets that share this printer. Avoid duplicate sheet geometry in the station GLBs.
- Preserve the current shared-desk camera/layout data when regenerating: `blender/shared_desk.py` still contains older Resume framing values and must not overwrite the current responsive printer view.
- Update `web/src/scene.ts` for named mesh references, physical press/LED state, paper anchoring and hit testing; update `web/src/main.ts` and its styles for the projected semantic control. Extend `web/src/print-job.ts` with synchronized press/start/feed/settle phases as needed.
- Keep the safe laptop landing and shared Resume/Contact desk transition. Refresh empty/printed posters using `web/scripts/capture-desk-posters.mjs` so loading and reduced motion show the revised printer.

## Review and acceptance

First validate a side-view mechanical blockout before material or label polish. Then review the exported assets in the actual browser lighting and cameras.

- Sample the exposed paper throughout the feed, including triangle interiors, the old failing interval and fractional times between baked keys. Check against tray, rim and slot surfaces, allowing only intended surface contact. A bounding-box check alone is insufficient for this thin sheet and sloping tray.
- Capture 0%, 10%, 25%, 35%, 38.5%, 50%, 65%, 85%, 95% and 100%, plus a continuous playback, from the overhead view and a low side angle. No portion of the emerged sheet may pass below or through the grey tray/rim; final contact must remain stable.
- Compare source Blender deformation with both uncompressed and optimized GLBs. Check paper length, normals, texture orientation and clearance after compression.
- Test clicking the visible key, tapping its surrounding target, Enter/Space, focus indication and dragging to scroll. Confirm the projected target remains attached at desktop and portrait sizes and cannot activate in transit.
- Confirm one activation starts one coordinated press/light/feed sequence, idle scrolling leaves the tray empty, completed paper persists on return, and repeated clicks are ignored. Reduced motion must work without a moving key or feed animation.
- Run the print, safe-landing, shared-desk and full-journey regressions and the production build. Update the tests to include tray clearance and the on-printer control, then regenerate review images.

Completion means the sheet is visibly supported until it clears the tray, and the interaction looks and behaves like pressing a button built into the printer.
