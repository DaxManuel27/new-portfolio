# Continuous Pi zoom — implementation and verification

Completed 3 October 2026. Plan: `continuous-pi-zoom-plan.md`.

## Result

One official Raspberry Pi 5 model remains at the behind-seat anchor throughout the full-car → close-up → isolated hero → return sequence. Position `[4.693262577, 0.840000033, -12.158147812]`, scale `0.25`, yaw `−π/10`, object identity and material opacity remain unchanged. The old `.86` relocation threshold and remote detail origin are removed.

The camera follows a centripetal Catmull–Rom route above the rear wing and roll hoop. The car stays opaque during the dive, then its final rendered RGB darkens to black through a shared shader uniform. At 70% of isolation it stops rendering and occluding the Pi; only then does the camera orbit into the desktop/right or phone/upper hero composition. The Pi remains lit. Return reverses the same clocks: text out, orbit back, car in, pull back to the exact full-car pose.

Phase budgets are `data-dive .9`, `data-isolate .7`, `data-reveal .4`, `data-hold 1.2`, `data-return 1.1`: **4.3 units**. The current journey totals **26.0 units**. `#fsae-data-logging` lands at the middle of the hold. Camera near was already `0.001`, which is retained; no new near-plane switch is needed.

## Geometry finding and adjustment

The original Pi anchor was inside a closed rear-body panel. A **46 × 46 mm fixed access bay** was opened around the logger, leaving the anchor and board pose intact. A higher camera waypoint and clear behind-seat close view replace the obstructed route. The car does not use an animated transparency cutaway during this shot.

The one Pi is also included in the Workstation monitor's live car preview. After the data sequence ends, it follows the existing car-to-desk model transformation. Direct entry into later model views now preloads it as well.

## Preserved concurrent work

The car-shrink → projects-reveal → projects-monitor-entry route and current Projects presentation were being updated elsewhere in the shared workspace. Those edits were preserved. The return ends exactly at the car-shrink camera start, and the car title remains hidden through this return.

Concurrent copy cleanup removed the eyebrow, lead sentence and visible licence credit. The current **title → subtitle → body** layout receives the staged, scroll-controlled reveal. No removed copy was restored and no new work claims were invented. The MIT licence and model attribution remain distributed with the asset. Additional technical case-study copy remains Dax's future content work.

The text panel stays in the accessibility tree; opacity handles its visual state. Reduced motion retains normal document flow, with a local opacity-only full-car → Pi still crossfade. The hero still was re-rendered at the same viewing angle. The project list and static station order remain intact.

## Figma and Blender

Figma file `AAoP4nNd3n9QzR9C2Cjarm`, page `0:1`: board **159:13160**, “Continuous Pi / one object, no swap”. Created nodes span `159:13160`–`159:13198`; final copy updates affect `159:13162`, `159:13183`, `159:13184`, `159:13190`. The composition screenshot was inspected for clipping and overlap.

[Open storyboard](https://www.figma.com/design/AAoP4nNd3n9QzR9C2Cjarm?node-id=159-13160).

Blender MCP authored the access bay, measured shot and isolated review source:

- `blender/pi_access_bay.py`, `blender/fsae_focus_routes.py`, `blender/station_reorder.py`: geometry and reproducible camera-route export; complete station export reapplies the bay.
- `blender/fsae-continuous-pi.blend`: focused car source with the access bay.
- `blender/continuous_pi_review.py`, `blender/continuous-pi-review.blend`: fixed Pi, linked car geometry, camera checkpoints and matching hero poster.
- `blender/review_continuous_pi.py`: headless geometry/framing review using exact browser camera poses.

Headless Workbench rendered **25 checkpoints**, under `exports/continuous-pi/keyframes/`. It is a geometry/framing review: object colours and studio shading differ from the site's HDR/area-light materials. Browser captures provide the final visual evidence. The original journey source was not replaced wholesale; focused Blender sources preserve other ongoing work.

## Website and assets

- `web/src/fsae-focus.ts`: phase clocks, fixed placement, spline dive, orbit and text staging.
- `web/src/journey.ts`, `web/src/fsae-title.ts`: new phases and matching title behavior.
- `web/src/scene.ts`: fixed opaque Pi, independent car darkening, continuous lighting blend, preview inclusion, loading and review diagnostics.
- `web/src/main.ts`, `web/src/style.css`, `web/src/types.ts`: accessible text reveal, hold deep link, four review waypoints, measured metadata and local still crossfade.
- `web/scripts/prepare-pi-access-bay.mjs`, `prepare-continuous-pi.mjs`, `prepare-fsae-details.mjs`: optimized car, refreshed Pi poster and measured metadata. Updated assets are `station-formula-sae.glb`, `raspberry-pi-5.webp`, `journey.json` in `web/public/assets/` and `exports/web/`; the Pi GLB is reused.
- Focus, journey, title, return and browser tests; `web/tests/continuous-pi.mjs`; indexed geometry support in `web/tests/asset-geometry.ts`; relevant developer review scripts.

Backups are in `backups/pre-continuous-pi/`, including the live Blender snapshot, affected assets and source files. The existing Intro/Hack/Workstation rotation and lighting work were preserved.

Rebuild: run `pi_access_bay.run()` through Blender MCP after assembling the car, then `continuous_pi_review.run()`. Run `node web/scripts/prepare-pi-access-bay.mjs` and `node web/scripts/prepare-continuous-pi.mjs`. Complete station exports also invoke the bay, and the existing detail preparation reapplies continuous-shot metadata and poster output.

## Verification

All checks pass:

- `npx tsc --noEmit`.
- `npm test`: **70 passed, zero failures**.
- `npm run build`: passed, with the existing large-bundle advisory.
- `node tests/browser.mjs`: full desktop 1440×960 and phone 390×844 regression passed.
- `node tests/continuous-pi.mjs`: same Pi UUID, position, scale, orientation, visibility and full opacity at **205 forward samples per viewport**, with reverse replay and direct seeks. No browser or shader errors. The lit green board remains visible at isolation, with no whole-frame blackout. Text reversal matches the same clock, accounting for native scroll-pixel rounding.
- `node scripts/verify-fsae-details.mjs`: deep links, one project panel, reverse seeks, reduced motion and failed-model poster fallback passed.
- **1,000 indexed-triangle camera samples** show no car crossing; the last 20% of the dive has an unobstructed sightline to the logger.

Unit checks cover continuous camera joins, desktop/phone copy clearance, staged text, exact full-car return, rotation preservation and existing desk geometry. The full regression covers monitor handoffs, current reel card positions/announcements, desk handoff, hero visibility, historic hashes, current reload behavior, resize, keyboard printing, notebook links, static reading and loading fallbacks.

Preview/live handoff mean channel differences remain within the existing thresholds: car desktop **0.8443**, phone **0.8511**; Projects desktop **0.03473**, phone **0.001667**. No channel differences over 12 occur at the Projects handoff.

Measured renderer CPU p95 in the focused headless Chrome review: approximately **1.1 ms desktop**, **0.8 ms phone**. These measure render submission on this machine, not GPU frame time or a separate mid-range device benchmark.

## Evidence and differences

`web/test-results/continuous-pi/` contains 50 browser PNGs (10/30/50/70/90% of each phase on both viewports), contact sheets, `report.json`, `portfolio-regression.json`, the reduced-motion crossfade screenshot and verification logs. `exports/continuous-pi/` contains the hero still, shot metadata, exact review poses and 25 Blender renders.

The Figma board is a schematic phase reference. The final shot uses actual car geometry and the opened logger bay; it keeps the Pi centred during darkening, then shifts it into the reading composition during the final 30% of isolation. The phone reserves the lower region for copy. Captures show no Pi clipping or copy overlap. The reading hold stays still.

No open implementation blockers remain. Differences from the pasted proposal are the necessary fixed access bay, the already-sufficient near plane and preservation of the current simplified copy/concurrent Projects route.
