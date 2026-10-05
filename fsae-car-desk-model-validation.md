# Formula SAE → display model → Projects

Implemented 2026-10-03.

## Result

The existing live Formula car becomes a roughly 23 cm display model on the separate wooden Projects desk. Its orthographic camera scales and rotates with the model, keeping its projected silhouette steady. Translation finishes before the desk appears, so the tyres remain grounded through the fade. The desk fades smoothly from black, with a soft contact shadow. The camera then reveals the complete desk, holds briefly, and enters the ultrawide.

The physical PERSONAL PROJECTS lettering was removed from the saved Blender scene and GLB. The ultrawide now shows OWN WORK above PERSONAL / PROJECTS and blends into the existing first reel frame. The keyboard, mouse, desk locations, reel cards, and later chapters remain in place. Blender has a render-only car reference for its poster; the runtime reuses the original car asset rather than shipping a duplicate in the desk GLB.

Newer Pi work concurrently present in the shared workspace is preserved, including its dive/isolate/reveal phases and heading visibility. Phase-based hashes and chapter navigation follow the current timeline rather than a hardcoded total. The model remains on Projects; Resume/Contact occupy another desk.

## Verification

- Production build passes. Existing large-bundle advisory remains.
- All 69 unit/asset tests pass, including camera continuity, constant projected silhouette, reverse transforms, desk grounding, geometry placement, and absence of exported physical title/duplicate car.
- Chrome at 1200×900 and 390×844: sampled all four transition phases forward and backward; no page or console errors; camera, model transform, and title opacity restore exactly.
- Last car-return frame vs first shrink frame: zero mean pixel-channel difference on both sizes.
- Monitor entry vs reel: mean pixel-channel difference 0.0342 desktop, 0.0021 phone (0–255 scale).
- Deep link to data logging opens its hold phase. The reduced-motion path keeps Formula → Data logging → Personal projects in document order and crossfades the Formula still into the new Projects desk still without spatial animation.
- Blender viewport and regenerated still inspected. No floating 3D title remains in the current scene or poster.
- Physical mobile/mid-range laptop frame rate has not been measured. Headless viewport tests establish correctness, not device FPS; collected CPU timings include cold shader compilation.

## Review

Preview: http://127.0.0.1:5173/#fsae-data-logging

Review hooks: `window.__portfolio.transitionFrame('return' | 'shrink' | 'reveal')`.

Evidence: `web/test-results/car-model-verified/` (screenshots and report), `web/test-results/car-model-unit-tests.txt`.

Sources: `web/src/projects-desk-transition.ts`, `web/src/scene.ts`, `web/src/journey.ts`, `blender/projects_car_model.py`, `blender/portfolio-station-reorder.blend`.
