# Interactive workspace — Blender handoff

Editable source: `../../blender/interactive-workspace.blend`. Open the **Interactive Workspace** scene; the default scene and prior live session were preserved. All artwork is packed into the Blender file. Overview starts at frame 1. Existing portfolio source files and the production website have not been replaced.

## Deliverables

- `workspace.glb`: complete optimized desktop, 4,472,068 bytes, 162,206 triangles, 87 material primitives. Shadow passes may add browser draw calls.
- Independent `notebook.glb`, `phone.glb`, `printer.glb`, `macbook.glb`, `monitor.glb`, `car.glb`, and `pi.glb` support separate loading. These retain their desk world placement; do not load them on top of the combined asset.
- `*-source.glb`: uncompressed interchange exports, suitable for Blender reimport.
- `manifest.json`: Y-up metre coordinates, named semantic roots, closed bounds, focus and overview camera poses, clip names/durations.
- `previews/overview.png`, `previews/notebook-open.png`: Blender renders.
- `viewer.html`: standalone Three.js asset review, not the production website.
- `asset-report.json`, `blender-validation.json`: measured budgets and checks.

## Object destinations

| Root | Destination |
| --- | --- |
| Root_monitor | Personal projects |
| Root_notebook | Ultra Maritime |
| Root_macbook | Hack Atlantic |
| Root_car | Formula SAE |
| Root_pi | Data logging |
| Root_printer | Résumé |
| Root_phone | Contact |

The notebook uses the approved Figma cover, back, spine, and inside-page artwork. It has a left-spine hinge with 180° opening clearance. The design follows the reference composition and palette using the existing portfolio models; it is not a pixel-identical recreation of the generated photograph.

## Animation contract

Only `Notebook_Open` remains (1.2 seconds, Blender frames 1–37). Reverse it to close. Phone, connecting lead, printer and résumé are static meshes; the résumé permanently rests on the output tray. Plant and mug are removed. Hack Atlantic uses the original `web/public/assets/hack-atlantic-hero.png` landing-page preview.

Use LoopOnce and clampWhenFinished for the notebook. The camera remains under application control. Keep hinge metadata named `pivotDescription`; `pivot` is interpreted by Three.js as a transform.

## Verification

- New scene rendered in Blender; notebook closed/open orientation and desktop clearance reviewed.
- Source GLB reimported successfully into a temporary Blender scene; temporary scene removed afterward.
- Compressed GLB loaded in Three.js 0.186.1 with MeshoptDecoder. Updated static scene visually checked in the browser. Export inspection confirms only the notebook animation remains.
- 4.47 MB < 8 MB; 162,206 exported triangles < 250,000; 87 material primitives < 100.
- Semantically separate roots and named clips retained during material consolidation.
- Both wide Blender framing and narrow browser preview checked. Final responsive UI, accessibility, text panels, touch selection, and device performance testing belong to the website integration phase.

The résumé sheet is a placeholder, not a finished CV. It remains visible on the tray; do not offer the placeholder as a downloadable résumé.

## Preview and rebuilding exports

From the repository root, serve it locally with `python3 -m http.server 8766 --bind 127.0.0.1`, then open `http://127.0.0.1:8766/exports/interactive-workspace/viewer.html`.

After reexporting source GLBs from Blender, run `node web/scripts/prepare-interactive-workspace.mjs`. It writes only this handoff directory and preserves semantic root boundaries while joining static geometry. Meshopt and WebP decoding are required.

The creation scripts under `blender/interactive-workspace/` document the authoring sequence; they are not safe to repeatedly run in a populated scene because they append objects. Use the saved `.blend` as the editable source of truth.
