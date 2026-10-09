# Reference desk asset pipeline (in progress)

Requested final direction follows the pasted reference brief exactly. See PLAN.md for phase state and unresolved differences.

## Sources

- Target: reference/target.png, copied from the user's earlier generated desk concept.
- Baseline: reference/current.png, 1440×1000 browser capture.
- Blender working source: blender/scene-realism.blend, scene Reference Desk.
- Preserved prior source: assets/_legacy/interactive-workspace-before-reference.blend.
- Original model files are unchanged. No existing asset files were deleted.
- Figma specification: design/scene-realism/figma-spec.md. New file creation awaits the user's required team selection.

## Authoring

Creation sequence is recorded by blender/scene-realism/rebuild.py, detail.py, bake.py and export-preview.py. These are sequential authoring scripts, not idempotent rebuild commands; do not rerun them in the populated scene. Use the saved .blend for editing. The scripts depend on existing portfolio source models and helper functions in blender/interactive-workspace/assemble.py.

Bakes: Cycles diffuse direct+indirect, excluding colour, unique padded UV1, 1024px desk/wall and 256px smaller structural parts. Files and assignments: blender/scene-realism/lightmaps.json. Runtime lightmaps use UV1, sRGB decoding and intensity .8; their final colour/exposure still requires visual convergence. Do not drop unreferenced TEXCOORD_1 during glTF optimization.

Export the scene with semantic roots and custom lightmap metadata; exclude stage/cameras/lights, convert temporary copies of race lettering to mesh. `node web/scripts/prepare-reference-desk.mjs` writes the provisional Meshopt/WebP GLB to exports/scene-realism/. Texture compression for lightmaps is currently separate from that script and must be consolidated for final regeneration.

Review only: http://127.0.0.1:8766/exports/scene-realism/viewer.html, served from repo root. This is not the production site and not the final UI. Current screenshots are in reference/compare/. Old production routes and content remain unchanged.

## Provenance

Sunset artwork is the existing self-generated coastal source; no external photography was added. Race text is original generic text. Existing model provenance remains as documented in the repository. The final no-logo and texture-provenance audit is still pending. Resume remains placeholder artwork and must not be offered as a finished CV.

## Outstanding delivery requirements

Figma editable overlay and all requested textures; final car refinement; accurate projected labels/hover/keyboard/touch UI; production integration; dev reference overlay; KTX2; finalized lightmap/HDR budget; 1280×800/mobile comparisons; landmark measurements; Lighthouse and frame-time validation. No claim is made that these are complete.
