# Photorealism improvement plan

Status: implemented and validated, 2026-10-02. See `photorealism-validation.md` for delivered changes, comparison captures, measurements and retained design choices.

## Goal

Make the existing portfolio models look like real objects photographed on a desk. Aim for clean, lightly handled products with believable materials, reflections, scale and contact shadows. Preserve recognizable shapes, readable content and the working scroll experience.

The largest gains should come from surface materials and lighting before adding geometry. Evaluate improvements in both Blender and the browser: a polished Blender render alone does not establish that the live website looks better.

## Inspection findings

Inspected through Blender MCP in Blender 5.2.2 LTS, with `blender/portfolio-shared-desk.blend` open and the Projects clearance review active.

- The Blender review already uses Cycles, AgX and three broad area lights. Its world has a background shader without an image-based environment. Its camera is orthographic.
- The inspected travelling MacBook base uses `MAT_MacBook_Silver`, with metallic set to 1 and uniform roughness around 0.38. Its main surface has no linked texture or normal detail.
- The Projects desk has a 1024-pixel wood color image, but constant roughness and no linked normal detail.
- The printer body and lid use plain colors, constant roughness around 0.45 and no surface textures. Existing bevels provide a starting point for edge highlights.
- Notebook pages have a color image, but no fiber detail or variation in roughness.
- The red phone already has color, roughness and normal textures, clearcoat and a transmitting acrylic dial. It needs refinement rather than a complete material replacement.
- The browser uses a generated room environment, hemisphere fill and a directional shadow light. It explicitly sets laptop screen color to black and reduces screen environment reflections to 0.015, which contributes to the flat glass appearance.
- Device texture sets already exist in `assets/textures/devices/`, including silver aluminum and trackpad maps. Check their suitability, UV scale and actual assignment before creating replacements.

## Production approach

Motion-compatible visual revision of existing portfolio assets, retaining meter scale and the current feet, spin and hinge pivots. Keep geometry additions limited to visible silhouette or construction improvements. Use texture detail for fine grain and wear.

Use Blender Director, Realistic Style, Materials and Lookdev guidance. Execute Blender changes through MCP, with a backup first. Build a neutral comparison rig, adjust one major variable per pass, then compare the result from identical cameras. Limit each model review to three to five focused iterations before deciding what still needs work.

Start with 1K–2K surface maps; use higher resolution only where the actual close-up demonstrates a need. Reuse materials and pack export-compatible roughness/metallic/occlusion channels where appropriate. Record texture size, dimensions and any triangle increases in the validation report.

## Work order

| Priority | Work | Reason |
| --- | --- | --- |
| 1 | Capture baselines and establish photographic lighting | Separates lighting problems from material and geometry problems |
| 2 | MacBook aluminum, trackpad and screen glass | The laptop appears throughout the journey and has prominent close-ups |
| 3 | Desk grain and finish | Large surface area strongly affects the entire scene |
| 4 | Printer plastic and construction details | The printer is a focal interaction with currently uniform surfaces |
| 5 | Notebook, résumé and pen | Close-up materials should read as paper, ink and metal |
| 6 | Phone and monitor refinement | These already have useful material foundations |
| 7 | Browser integration and complete journey review | Ensures the improvement survives export and works during animation |

## Phase 1: reference and baseline

1. Back up the current Blender file, affected exports and browser material/lighting configuration.
2. Collect real product photographs for each surface: anodized aluminum, trackpad glass, matte printer plastic, finished walnut, notebook paper, glossy phone plastic and monitor glass. Prefer close-ups with readable reflections and material scale.
3. Verify object dimensions against those references. Do not change dimensions simply to improve a single camera view.
4. Capture current Blender and browser views of Intro, Projects, Resume and Contact, including desktop and portrait views. Record camera, exposure and lighting settings.
5. Create separate neutral and photographic look-development collections and cameras. Use a grey material pass where a shape or edge treatment is uncertain.

## Phase 2: lighting and presentation

- Establish one coherent lighting direction, resembling a broad window or studio softbox, with gentle fill and a restrained edge light.
- Test a suitable HDR room/studio environment for believable reflections. Keep background appearance independent where useful, so the existing dark portfolio backdrop can remain.
- Improve soft contact shadows beneath the laptop feet, printer, phone, notebook and monitor stand. Avoid heavy dark halos and shadows detached from surfaces.
- Retain AgX and tune exposure against neutral references. Avoid clipping silver and paper highlights or crushing dark plastic detail.
- Compare the current orthographic framing with a mild perspective or long-lens product-photo view. Adopt a camera change only if it improves realism while preserving composition, animation continuity and mobile framing.
- Use subtle depth of field only in suitable still close-ups. Keep interactive labels and controls sharp; assess browser cost before including it in the live experience.

## Phase 3: model-specific changes

### MacBook

- Apply fine, physically scaled anodized aluminum grain and restrained roughness variation to body and display housing. Evaluate the existing texture package first.
- Keep the trackpad a separate glass-like surface with a different finish from the aluminum.
- Add barely visible handling marks in plausible areas, primarily through roughness. Avoid large scratches, painted highlights and excessive bump strength.
- Restore soft, controlled room reflections on the blank screen while keeping it dark. Tune the browser screen override alongside the Blender material.
- Inspect bevels, seams, hinge, keyboard and speaker detail at the actual display size. Add or adjust geometry only where a visible construction issue remains.

### Desk

- Add matching grain relief and roughness textures, aligned with the wood color image and real grain direction.
- Set UV density using measured surface size, avoiding stretched or oversized grain.
- Give top and edge surfaces appropriate grain direction. Determine whether the desk represents solid wood or veneer before introducing end grain.
- Add a restrained finish response and small surface variations. Review current edge rounding against the reference.

### Printer

- Add fine molded-plastic grain and subtle roughness variation to the housing, lid, tray and key.
- Distinguish surfaces through finish and construction rather than arbitrary color changes.
- Inspect panel gaps, lid seams, output opening, vents and edge radii. Add selected visible construction details where supported by reference.
- Keep the physical Print Resume key, label, status light, output anchor and paper corridor intact. Any geometry change near the output must pass the paper-clearance tests again.

### Notebook, résumé and pen

- Add paper fiber detail at a subtle scale and a mostly matte response.
- Improve notebook spine curvature, page thickness and page-edge variation. Keep contact text legible and its clickable projection aligned with the page.
- Use gentle natural curvature on the printed résumé without disturbing the feed path or exposing paper through printer geometry.
- Distinguish pen barrel, clip and tip materials with believable reflections and restrained handling marks.

### Phone and monitor

- Refine the phone's existing plastic maps and clearcoat under the new lighting before adding more texture detail.
- Introduce restrained handling marks around the handset and dial. Preserve clean red color and avoid uniform grunge.
- Verify the clear dial's reflections and transmission in both renderers. Keep numbers readable.
- Refine monitor enclosure grain, stand finish and dark-screen reflections. Preserve the ultrawide's position, visibility timing and verified laptop clearance.

## Phase 4: export and browser integration

- Bake procedural surface effects to glTF-compatible texture maps where the exporter cannot reproduce them directly.
- Use sRGB for color images and non-color data for roughness, metallic and normal maps. Check tangent-space normals, UVs and map strength after export.
- Update the canonical hero and affected station exports through their existing source pipelines, preserving original copies and shared-desk naming/anchors.
- Regenerate compressed assets and verify that their materials retain the intended detail. Do not export duplicate stationary laptops into the runtime scenes.
- Tune `web/src/scene.ts` environment, lights, reflections and shadows using the actual browser result. Match the approved photographic direction while retaining clear dark screens.
- Regenerate loading and reduced-motion posters after the final appearance is approved.
- Check download size, draw calls and representative render performance on desktop and portrait layouts. Preserve the existing loading and failure behavior.

## Validation and acceptance

- Compare before/after captures at identical framing and exposure. Material identity should be evident: aluminum, glass, plastic, wood and paper must respond differently to light.
- Check close-ups and normal viewing distance. Fine texture should be subtle and should not sparkle, shimmer, tile visibly or resemble coarse noise during movement.
- Confirm plausible highlights, readable dark surfaces and grounded contact shadows. Surface imperfections should be localized and restrained.
- Confirm browser appearance as well as Blender appearance. Exported normal, roughness, clearcoat and transmission behavior must match the intended result closely enough for the website.
- Verify all animation clearances and unchanged physical scale, especially the ultrawide corridor, shared-desk landing and printer feed.
- Check physical print-button input, phonebook links, printed-state persistence, keyboard interaction and reduced motion.
- Run relevant asset/material tests, the full unit suite, full-journey browser checks, Projects and safe-landing checks, printing/shared-desk regressions and the production build.
- Record remaining browser limitations honestly, including any effects reserved for Blender stills.

## Deliverables

- Backed-up and updated Blender source with organized materials and look-development lighting.
- Export-ready texture maps and updated compressed website assets.
- Before/after comparison captures of the main close-ups and updated posters.
- Working browser preview with a consistent photographic appearance.
- Validation report covering visual comparisons, preserved interactions, asset sizes and performance observations.

## References

- [Three.js MeshStandardMaterial: environment, roughness and normal maps](https://threejs.org/docs/pages/MeshStandardMaterial.html)
- [Blender Principled BSDF: material response](https://docs.blender.org/manual/en/4.5/render/shader_nodes/shader/principled.html)
- Local source: `blender/portfolio-shared-desk.blend`
- Browser lighting/material integration: `web/src/scene.ts`
- Existing device materials: `assets/textures/devices/README.md`
- Existing texture/export pipeline: `web/scripts/prepare-assets.mjs`
