# Figma components — build report

Updated master: `blender/portfolio-elements.blend`. Main station scene: `Portfolio Elements`. New scene: `Figma Components`, collection `FIGMA_Components`.

The main file was selected after inspecting all non-backup .blend files. It contains the accepted M5 and all four station collections, the latest Figma textures, and UM mug. Other files are individual assets, older snapshots, or the Hack Atlantic staging variant. See `file_inventory.json`.

## Audit before building

| Item | Figma nodes | Status | Blender match / evidence |
|---|---|---|---|
| C1 | 29:843,29:840,29:841,29:842,43:6648,43:6641,43:6642,43:6643,53:7003,53:7000,53:7001,53:7002,60:8570,55:7160 | EXISTS | MacBook_TravelRoot, MacBook_BaseGroup, MacBook_LidPivot, MacBook_Screen; Accepted M5: 311.730 mm wide (0.999134× requested width), separate animated lid pivot and display. Visual checked against saved M5 preview and supplied render. Existing rig conventions preserved. |
| C2 | 31:656,52:6712,31:666,31:697,31:728,31:772,31:813,52:6667,52:6676,52:6685 | MISSING | ; 0/7 matching supplied station screens. Existing monitor/project graphics serve other surfaces. |
| C3 | 29:851 | MISSING | ; No matching name and dimensional candidate. |
| C4 | 11:391 | MISSING | ; No matching name and dimensional candidate. |
| C5 | 11:360,55:7252 | MISSING | ; No matching name and dimensional candidate. |
| C6 | 11:385,44:5864 | MISSING | ; No matching name and dimensional candidate. |
| C7 | 44:5817 | MISSING | ; No matching name and dimensional candidate. |
| C8 | 55:7265 | MISSING | ; No matching name and dimensional candidate. |
| C9 | 29:843,43:6648,53:7003,60:8570,55:7160 | MISSING | ; {'CAM_Figma_34': [], 'CAM_Figma_DeskRenders': [], 'CAM_Figma_Front': [], 'CAM_Figma_HackAtlantic': [], 'CAM_Figma_Top': []} |

## Created and skipped

Created six prop assemblies: Desk_Station, Prop_LandingDesk, Prop_Printer, Prop_RotaryTelephone, Notebook_Open, Resume_Page. Added seven M_Screen_* materials with the supplied PNGs and five CAM_Figma_* orthographic cameras. Tagged the new scene, collections, objects, mesh/curve data, materials, images, world, lights and camera data. New component collections are marked as assets. All new geometry is in the new scene only.

Skipped the accepted MacBook, the Hack Atlantic booth, FSAE car, Ultra Maritime desk, personal desk, and all other existing objects. No existing object received a new material, a different name, transform, parent or scene membership. No existing animation changed.

Screen materials are deliberately unassigned. They would replace slot 0 on `MacBook_Screen` in the hero, or slot 0 on `Personal_MacBook_Screen` for the stationary copy. The scale-preview material assignment is on disposable copies only.

Copied nine supplied textures to `blender/textures/figma/`: seven screens, notebook spread and resume sheet. Their image paths are relative `//textures/figma/...`; none is packed. The reference pack is copied into project-local `figma_refs/` for fully offline reruns.

Original backup: `blender/portfolio-elements.pre-figma-20261001-2030.blend`. Later pre-figma snapshots are incremental recovery copies.

## Dimensions

All measured specified parts and the desk/landing assemblies pass the ±0.5 mm checks. Rotated parts are compared against their analytically rotated spec bounds; unrotated parts use the supplied dimensions directly. Curved trim/cord and the notebook gutter surface have informational world bounds plus nominal construction dimensions. Hidden cutters and cameras/empties/lights have no rendered geometry. Full per-object results: `verification.json` and `verify.log`.

| Assembly/part | Measured world bbox, mm | Max error, mm | Status |
|---|---|---|---|
| Desk_Station.Top | 720.000 × 396.000 × 19.200 | 0.0000 | PASS |
| Notebook_Open.Cover | 306.000 × 219.000 × 2.000 | 0.0002 | PASS |
| Prop_Printer.Body | 300.000 × 210.000 × 120.000 | 0.0000 | PASS |
| Prop_RotaryTelephone.Body | 219.804 × 209.804 × 108.990 | 0.1962 | PASS |
| Resume_Page.Sheet | 215.900 × 279.400 × 0.100 | 0.0001 | PASS |
| Desk_Station (complete assembly) | 720.000 × 396.000 × 67.200 | 0.0000 | PASS |
| Prop_LandingDesk (complete assembly) | 740.000 × 300.350 × 74.000 | 0.3500 | PASS |

The existing MacBook base is 311.730 × 220.909 mm, a width ratio of 0.999134 against the requested 312 mm. Its separate lid pivot and screen were inspected, including the saved M5 preview. It has its own opening-angle convention and existing animation; the script does not change them or add Figma presets. No C1 model was created, so no new-lid sweep or C1 overlay applies.

## Previews and overlays

Overall visual validation: NEEDS_REVIEW. Numerical, original-data preservation, and idempotency checks pass.

Eight Figma/render side-by-sides are in `previews/compare_*.png`: station desk, landing desk, printer front/top, phone front/top, notebook top, resume top. The left panel is always Figma. Transparent renders are composited on #C4C4C4. Renders use a dark world and neutral key/fill/rim lights. Physical shading differs from Figma’s painted gradients.

The desk overlay uses exactly the supplied 1751 × 637 resolution, (68,0,-25) camera rotation, 2.1333 px/mm, and top/back-left anchor (0,243.2). `previews/overlay_desk_34.png` is the 50% alpha-over result.

93.74% of the reference silhouette boundary is within 3 px. The tabletop edges align closely. The remaining differences are mainly the legs: Figma draws flattened front faces, whereas the specified 19.2 × 19.2 mm legs have visible side faces (about 17 px projected). Some joint/corner contours reach about 31 px. This does **not** satisfy a universal 3 px overlay limit; the physical dimensions were retained instead of hiding faces or moving the camera.

The throwaway FIGMA_Preview scene produced `previews/relative_scale_resume.png` and `compare_relative_scale.png`, using copied desk/laptop/printer geometry and M_Screen_Resume. That scene and every temporary datablock were deleted. The accepted laptop’s existing open pose is used; its root is compensated to place the actual footprint at the brief’s desk offset.

## Untouched-data proof and idempotency

Existing authored datablock differences: 0. Preview-induced differences: 0. See `audit_before.json`, `audit_after.json`, and `untouched_data.json`. Mesh vertex/topology/UV hashes, material node settings/links, object matrices/parents/modifiers/constraints and scene membership are compared. Runtime memory addresses, session IDs, evaluation timers and ID user counts are excluded from comparison.

Blender normally omits zero-user datablocks when saving. To preserve legacy unused materials and images, the **new** scene holds ID references in `preserved_legacy_datablocks`. Their original fake-user flags and contents stay unchanged. No original datablock is deleted.

Second build: 0 new datablocks. See `idempotency.json`. All changes remain uncommitted.

## Needs your decision

No checklist item is PARTIAL in this master. These reference/spec differences remain for review:

- Desk overlay: keep physically square legs as specified (current result), or authorize a flattened Figma-style alternative. The 3 px limit is not met at all leg contours.
- Phone: the brief’s 30° dial face produces an ellipse from the low front camera; the Figma front drawing is nearly round. The right-hand cord follows the top view, as instructed. The receiver uses rounded cups and an arched handle rather than the front drawing’s painted outline.
- Printer: the specified 300 mm printer is almost the width of the 312 mm laptop. The Resume checkpoint depicts a smaller printer. The scale preview keeps the supplied dimensions. Its front/top views are also slightly inconsistent about rear-support and tray shapes; the physical parts follow the numeric spec.
- Landing platform: 300 mm assumed depth as authorized; fine edge accents use narrow solid material strips.
- C1 was matched and preserved; the current realistic M5 has a logo and its original rig/presets. Exact no-logo Figma laptop geometry would require a separate explicit decision and is not created.

## Exact rerun commands

Run these from the project directory. No network or external Python packages are required; Blender’s bundled NumPy handles image compositing.

```sh
cd "/Users/daxmanuel/Documents/ChatGPT/portfolio-site-blender"
"/Applications/Blender.app/Contents/MacOS/Blender" -b blender/portfolio-elements.blend --python blender/figma_components/figma_components.py -- audit --output blender/figma_components/audit_current.json
"/Applications/Blender.app/Contents/MacOS/Blender" -b blender/portfolio-elements.blend --python blender/figma_components/figma_components.py -- build
"/Applications/Blender.app/Contents/MacOS/Blender" -b blender/portfolio-elements.blend --python blender/figma_components/figma_components.py -- verify
```

To replace a newly generated component: append `--rebuild C3` (or C4–C8) to build. The flag removes only matching `created_by="figma_components.py"` objects and unused owned data; it rejects the protected accepted C1 asset. The build targets this audited master and does not supply a replacement C1 generator. `--refs /path/to/figma_refs` supports a relocated reference pack.
