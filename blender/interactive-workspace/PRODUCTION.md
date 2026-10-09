# Interactive workspace production brief

Target: realistic desktop/mobile web portfolio, GLB exports with independent object selection and prop clips. New source: blender/interactive-workspace.blend. Existing files and unsaved live state must be preserved.

Reference: design/interactive-workspace/sources/desk-concept.png. Elevated front view; wide ivory tabletop, laptop front-center, ultrawide behind, miniature Formula car and Pi left, closed Ultra Maritime notebook right, printer rear-right and red phone front-right. Remove foreground chair. Notebook must open without hitting nearby props. Match broad warm upper-left key, cool gentle fill, dark seamless background, soft grounded shadows. Palette: ivory #F1E9DC, charcoal #101111, silver #A7A9AA, oxblood #781C17, blue logo #064B8E. No new claims on screens.

Camera: establish 45–55 mm overview looking down roughly 30 degrees. Frame all destinations; separate focus and portrait cameras. Prioritize readable silhouettes over exact mockup proportions.

Budget: <=250k evaluated overview triangles, <=100 render primitives after static material consolidation, <=2K hero textures. Initial compressed target <=8MB measured, with independent detail loading if needed. Notebook target 10–20k or less if silhouette is smooth. Preserve original hero meshes in original files; optimize derived copies only.

Scale: 1 unit = 1m. Desk top 0.74m; laptop approx 14-inch device; notebook nominal A5 with 18.5mm spine. Car is deliberately tabletop scale. Pivots: desk contact for roots, notebook spine hinge, phone receiver grip center.

Animation: 30fps. Notebook open 1–37 with reversible exact endpoints; phone receiver lift 1–25; reuse printer-local feed from existing validated GLB with matching source printer anchor. Export clips separately so browser camera control is independent. No scale animation.

Skills: blender-director, prop-artist, realistic-style, materials, uv-workflow, camera-cinematography, animation, lighting, rendering, asset-optimization, export-pipeline, qa-review.

Sequence: preserve live state; inspect reused assets; assemble/establish camera; screenshot check; build hinged notebook and textures; grounded materials/light review; optimize derived assets; export/round-trip and browser GLTFLoader verification; save manifest and final renders.

## Current revision
Phone and printer animation removed at user request. Resume is a permanent static sheet on the output tray. Plant and mug removed. Hack Atlantic screen restored to the original landing-page capture in web/public/assets/hack-atlantic-hero.png. Notebook remains the only animated prop. The saved scene and latest revision script supersede earlier animation requirements.
