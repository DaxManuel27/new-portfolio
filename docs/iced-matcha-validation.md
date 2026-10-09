# Iced matcha desk addition

## Current appearance revision

Per user feedback, the drink is uniformly green inside a clear PET shell. The shell uses sharp alpha transparency with stronger reflections at grazing angles, a visible clear base/rim, and a nearly transparent lid. Removed frosted normals and screen-space transmission to prevent blurred contents. Ice retains crisp shaded geometry. This supersedes the original layered/transmission implementation below. Build and responsive browser checks were rerun.


Implemented the procedural iced matcha only. The requested Red Bull files are absent from both repository-root `public/` and Vite's `web/public/`: `models/redbull-can.glb` and `textures/redbull-zero-label.jpg`. No model or texture was downloaded, and no can or speculative attribution was added. To finish the can, supply those files in `web/public/` plus the actual model's author/title/license.

## Scale and placement

Scene units are meters. Measured open-laptop world bounds are 0.41499 × 0.28276 × 0.39635 (width × height × depth); this is the full open model, not a claimed manufacturer specification. The desk surface measures y=0.73999735. The 0.160 m cup has a 0.095 m rim diameter and 0.060 m base diameter, with a straw reaching approximately 4.5 cm above its lid. Its base is placed directly on the measured desk at x=-0.263, z=0.160, between the laptop and car and forward of the lamp.

## Implementation

- `web/src/iced-matcha.ts`: tapered inner/outer PET surfaces, rolled lip, annular lid with straw hole, angled hollow straw, two milk/matcha volumes with a 1.5 cm vertex-color blend, six rounded irregular ice cubes, procedural droplet normals that fade above the lower two-thirds, and a faint contact shadow.
- Clear surfaces use Three.js physical transmission and the existing renderer pass. Ice includes cloudy interiors because nested transmissive surfaces are not included in that pass's background. This is an approximation, not physically complete nested refraction.
- `web/src/workspace-scene.ts`: adds the cup after room setup and includes its bounds among label obstacles. Every cup mesh has a no-op raycast; no labels, controls, lights or animation were added.
- `web/scripts/verify-matcha.mjs`: reproducible browser verification and screenshots.

## Verification

- Production build and TypeScript check pass. Existing large-chunk advisory remains. No lint script is configured.
- Full suite: 123/125 pass. Two failures depend on untouched pre-existing files: workstation layout no longer equals the historic backup (`desk-return.test.ts`), and the existing desk GLB exceeds its 8 MB test budget (`desk-six-fixes.test.ts`). Neither test imports the matcha or changed scene module.
- Browser verification passes at 1440×960, 1024×768, and 390×844: correct cup dimensions and desk contact, no laptop/car bounding-box intersection, no label-button overlap, zero decorative raycast hits, and no obstruction of the focused laptop screen or camera.
- Screenshots inspected for layers, cup/lid, ice and placement; overview label leaders remain clear. Browser reports no JS or shader errors. One shadow-casting light remains. Sampled median frame interval is approximately 16.7 ms on this machine; not a performance guarantee for mobile hardware.
- Evidence: `web/test-results/matcha/report.json`, `overview-{1440,1024,390}.png`, `laptop-{1440,1024,390}.png`, and `detail.png`.

Attribution added: none. The matcha is original procedural geometry; the can remains pending its supplied asset and license.
