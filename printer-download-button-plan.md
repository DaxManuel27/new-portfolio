# Physical printer download button

Status: Implemented in Blender and the website. Build and 17 focused geometry/navigation tests pass.

Design: https://www.figma.com/design/Ssf8hjRBXrVXtGwfEgwFxL?node-id=2-35

Component set: `2:34`. Review frame: `2:35`.

## Intended behavior

Replace the floating download pill with a physical key on the printer. Show the entire key assembly only after the camera reaches the résumé close-up. Hide it immediately when leaving that view, including scroll-up, Back to desk, Escape, browser navigation, and opening another destination. The desk overview has no download button.

Activating the key downloads the existing, unchanged `web/public/documents/dax-manuel-resume.pdf` as `Dax-Manuel-Resume.pdf`. Retain the physical printed résumé.

## Figma design

- Matte charcoal-green key cap, warm cream lettering and download symbol, shallow inset surround matching the ivory printer.
- Exact label: “Download PDF”, IBM Plex Mono Medium, matching the portfolio's existing control typography.
- Starting dimensions: 72 × 24 mm face, approximately 3 mm cap height, 2 mm edge bevel, 0.8 mm downward press travel. Final dimensions follow measured clearance and projected readability.
- Four editable component variants: Default, Hover, Focus, Pressed. Hover lightens the cap; keyboard focus adds a thin warm outline; press lowers the cap into its surround.
- Figma contains a schematic placement study on the right of the printer control panel above the paper-feed slot. This is not a replacement printer model. Use the existing printer mesh to establish the final position.
- Six local color variables and a shared label text style are included. The design uses native vectors, text, components, and instances rather than a flattened screenshot.

## 1. Measure placement and camera clearance

Inspect `Root_printer`, `Root_resume`, and `Resume_PDF_Surface` in `blender/scene-realism.blend`. Find an unobstructed area on the control panel, to the right of the feed slot, clear of the paper, feed opening, and existing switches. Place the button flush with that surface and align its text to read upright from the résumé camera.

The present résumé camera tightly frames the paper and crops the printer's upper panel. Update résumé framing to include both the full paper and the new key, using their combined projected bounds and consistent margins. Derive this from actual geometry, not a screen-space offset. Check desktop and portrait before finalizing the key's position or enlarging the camera framing. Avoid shrinking the paper more than necessary.

## 2. Build the physical assembly in Blender

Back up the current blend and exported GLB first. Create an idempotent script that adds a `Printer_Download_Control` child under `Root_printer` with separately named surround, cap, label, and optional focus trim. Keep the cap pivot aligned with the surface normal so press travel is local and predictable.

Model a shallow beveled recess/surround and a raised key. Use the Figma label artwork as a small transparent texture or thin vector geometry on the cap, with enough surface offset to avoid flickering. Retain printer materials and scale; use a matte cap with subtle edge highlights. Aim for fewer than 1,500 added triangles and one label texture no larger than 1024 × 256.

The key is conditionally visible. Do not cut a permanent hole into the housing or bake the key's shadow into the shared printer lightmap: those would remain visible in the overview when the assembly is hidden. Use the local surround and material shading for depth. Keep its mesh names and hierarchy intact through GLB compression; exclude the moving cap from any merge that destroys its identity.

Export through the existing `export-preview.py` and `encode-reference-desk.mjs` pipeline. Retain unchanged compressed textures. Verify exported bounds, label orientation, node names, and paper clearance.

## 3. Replace the floating website controls

In `web/src/workspace.ts` and `workspace.css`, remove the overview `.printer-download` pill and the floating `.resume-actions` bar, including the separate Open PDF pill. Remove `printerDownloadAnchor()` from `workspace-scene.ts` once unused. The visible download control is the modeled key.

Add an initially hidden printer-control reference in `WorkspaceScene`. Reveal it only on completed résumé arrival; reset it on every exit or destination change. Handle direct `#resume` loads, resize, interrupted transitions, and reduced motion without a one-frame flash in the overview.

The current immersive dialog captures input above the canvas. Add a transparent, accessible download link inside that dialog, projected to the key's visible face. It is only an interaction target: no pill background, border, independent label, or fixed-position action bar. Use a projected polygon when needed so the hit area follows perspective, and disable it while hidden or occluded. This also preserves native download behavior from a real link click.

Wire pointer hover, focus, and press to the corresponding mesh appearance. Enter activates the download; pointer cancellation and blur restore the cap. Start the download directly from the activation event, then animate the cap approximately 0.8 mm down and back over 120–180 ms. Reduced motion uses an instant state change. Do not claim the download finished merely because the browser accepted the click.

Provide an accessible name “Download résumé PDF”. Ensure a minimum 44 × 44 CSS-pixel touch target and visible keyboard focus on the physical key. If WebGL fails, preserve a simple text download link in the fallback content.

## 4. Verification

- No floating download control or bottom action bar in the overview or résumé view.
- Key, label, hit target, and focus trim hidden outside the settled résumé view.
- Entire résumé and button visible with readable labeling at desktop and portrait sizes; no overlap with the feed slot, paper, or Back to desk control.
- Hover, focus, press, pointer cancellation, and reduced-motion states match the Figma variants.
- Keyboard and touch activate one download per action. Confirm the served PDF is byte-identical to the supplied résumé.
- Scroll-up, Escape, Back to desk, browser history, direct hashes, and interrupted transitions all restore the correct visibility.
- Check that no permanent key shadow, empty recess, or clickable invisible control remains on the overview printer.
- Run the build and focused geometry/navigation tests; save overview, résumé, and mobile screenshots.

## Delivery order

Figma design → measure printer and camera → build/export Blender assembly → wire visibility and download interaction → verify and open the preview.

## Implementation record

- Source assembly: `blender/scene-realism/add-printer-download.py`; retained as `Root_printer_download` with separate `Root_printer_download_cap`.
- Artwork: approved Figma label exported to `design/printer-download/label.svg` and a transparent PNG texture.
- Camera fit: `web/src/printer-key.ts` includes the raised key depth in perspective framing.
- Runtime: arrival-only visibility, projected native download link, mesh hover/focus feedback, 180 ms press movement, and instant exit hiding.
- Removed both floating action controls. Original PDF remains unchanged.
- Desktop UI verified; portrait and landscape geometry framing verified by tests.
