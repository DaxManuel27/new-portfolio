# Floating laptop opening — animation plan

Date: 2026-10-02. Status: implemented and verified in the local browser preview. Original Blender files and animation exports are preserved.

This plan replaces the table-based Intro in `scroll-implementation-plan.md`. The supplied screenshot is the opening composition reference. Subsequent station camera moves follow the implemented single approach → hold → exit sequence in `scroll-camera-fix-plan.md`.

## Implementation result

Browser inspection found the reference pose at baked time **1.2 seconds**, frame 37. Intro now holds that exact hero and fitted camera sample. A shared time remap replaces the proposed transform bridge below: during the first half of the first travel interval, original time 0–2 seconds maps monotonically to baked time 1.2–2 seconds. With `u = originalTime / 2`, the sampled time is `1.2 + 0.4u² + 0.4u³`. This begins at zero speed and rejoins the baked clock at unit speed, preserving the remainder of the first flight without returning to the table.

`web/src/intro-config.json` records the start time, handoff time and poster filename, and asset preparation includes it in both runtime manifests. Hero, lid and camera sample the same time. Intro station opacity is always zero; startup, visibility loading and prefetching never request its GLB.

`web/scripts/capture-intro.mjs` renders the accepted opening into transparent `exports/web/intro-floating.png` and lossless `web/public/assets/intro.webp`. Initial loading, reduced motion and failure fallback share this composition. Asset preparation reuses the new source instead of restoring the tabletop poster.

Verified in Chrome at 1644×1530, 1440×960 and 390×844: reference framing, stable opening hold, first-flight projection, reverse/direct seeks, no Intro asset request, loading, reduced motion and hero-load failure. Captures and measurements are in `web/test-results/floating-intro/`. The current 27 automated tests and production build pass. The full journey browser suite is being updated alongside separate changes to the final station timing; its earlier fixed-total-duration assertion is not an opening regression. Physical-device and cross-browser release checks remain outstanding.

## Opening composition

Start with one closed silver MacBook suspended against the existing near-black background. Present the outside of the lid and its logo, with enough perspective to show the thin chassis edge. In screen space, the laptop's long edge rises toward the right by roughly 20–25°. Match the screenshot's visible silhouette and logo orientation rather than guessing equivalent world-axis angles.

Center the visible geometry at approximately 50% / 50%. At the reference aspect ratio, its projected bounding box occupies about 49% of the viewport width and 46% of its height. Treat these as initial framing targets to tune against a capture. Retain the existing maximum travel bounds of 56% width / 64% height when fitting other viewport shapes. Preserve physical model scale; compose with the camera.

Keep the complete Intro station hidden: table, props, floor and their shadows. The laptop should have soft aluminum reflections and a readable edge against the dark background. Keep the subtle warm background glow restrained. Exclude the screenshot's lower-left textured fragment from the target composition; retain the existing Reduce motion control.

## Scroll storyboard

| Interval | Action | Composition |
| --- | --- | --- |
| Initial load and Intro, existing 60vh | Hold the closed floating pose | Reference framing; camera and laptop stay still when scrolling stops |
| Beginning of the existing 150vh first travel | Ease out of the diagonal opening pose into the first flight | Keep the lid closed through the opening blend; follow the visible laptop center without a zoom detour |
| Remainder of first travel | Continue toward Hack Atlantic using the authored flight and rotation | Introduce Hack Atlantic with its existing arrival visibility curve; Intro remains hidden |
| Hack Atlantic approach, existing 90vh | Settle the laptop, then finish the single camera move into the straight-on station focus | Table and standees belong to this arrival; laptop opening follows the station choreography |
| Hack Atlantic hold and exit | Hold, then depart once | Continue the existing sequence through Formula SAE, Ultra Maritime, Projects, Resume and Contact |

No automatic floating loop or idle tumble is needed. Scroll owns all movement. Reverse scroll returns smoothly to the same closed floating opening. A fresh visit at scroll zero displays that pose; restored scroll positions continue to resolve directly to their correct chapter.

## Original implementation proposal

The implementation result above supersedes the proposed custom-pose and transform-bridge work in steps 1–4. Reusing the exact authored reference pose made those additional transforms unnecessary. Separate changes to later station timing are outside this opening revision.

1. **Author a distinct Intro pose.** Add an opening configuration containing hero root position, spin orientation, calibrated closed-lid orientation, and camera position/orientation/width. Tune those values in the browser against the reference before fixing them in the runtime manifest. The current `heroTime = 0` samples a table pose and cannot serve as the new opening unmodified. Use the existing hero hierarchy; new geometry is unnecessary.

2. **Replace the start of the first flight with a short bridge.** Review the first four-second clip and select a closed, airborne handoff before its major turn. Begin by reviewing the first 20% of that clip as a candidate bridge interval, then choose the endpoint from actual poses. Within that interval, replace the baked departure from the Intro table with a continuous path from the floating pose to the selected baked pose. Reach the baked root, spin, lid and camera exactly at the handoff, matching motion tangents so the laptop does not hesitate or jerk. If no suitable closed endpoint exists, revise the first departure segment explicitly rather than forcing a lid mismatch. Keep the existing first travel scroll budget.

3. **Preserve deliberate turns.** Use quaternion interpolation for the short opening orientation adjustment only. Resume the baked tracks at the handoff, retaining their subsequent full turn and lid choreography. Account for any rotation replaced by the bridge when reviewing the first flight; do not blend across a full revolution using only endpoint quaternions. Later five travel segments remain as authored.

4. **Evaluate everything from one progress value.** Extend `web/src/journey.ts`, `web/src/camera.ts` and `web/src/scene.ts` so the opening and bridge derive hero transforms, camera and visibility from absolute progress. Sample the baked hero first, then apply the Intro/bridge transform override as the single final owner during its interval. Do not add a second animation that runs on load or on threshold crossings. Test the join into normal travel for position, orientation, lid, framing and velocity.

5. **Suppress Intro visibility throughout.** Override station index 0 opacity in the runtime evaluator, including reverse travel. Remove Intro station loading from the opening's required/prefetch assets. Keep its preserved review export available. Continue prefetching Hack Atlantic while the floating hero is visible. Put opening configuration in the asset-preparation input so regenerating `journey.json` preserves it.

6. **Match posters and accessibility.** Replace the opening `intro.webp` with a still of the accepted floating composition and check the initial image source in `web/index.html` as well as runtime poster selection. Use that still for Intro loading, hero-load failure and reduced motion. Reduced motion keeps the floating opening as a static image, followed by the existing static station compositions. No table image should flash on initial load or when changing modes.

7. **Review framing across sizes.** Compare the opening at the screenshot's aspect ratio, the existing 1440×960 desktop test size and 390×844 portrait size. Fit from visible geometry without cropping the lid or chassis. Blend the responsive opening camera into the responsive travel camera; avoid a recentering or size jump at the handoff.

## Acceptance checks

- At scroll zero, the laptop is closed, floating, centered and diagonally framed like the reference, with no visible Intro table or stray props.
- The loading still and first rendered frame agree in pose, background and apparent size.
- Intro → first flight → Hack Atlantic has no downward move to the old platform, abrupt lid change, zoom reversal, or visible pose jump.
- Stop, reverse, seek directly, refresh and resize: the same progress produces the same pose. The retained remainder of the first flight's rotation remains visible.
- Hack Atlantic and later stations retain the single approach/hold/exit camera behavior, station dock poses, Resume feed and Contact interactions.
- The initial floating composition also appears in reduced motion and failure fallbacks.

The opening regression suite is `web/tests/floating-intro.mjs`, with pure timeline/camera checks in `web/tests/intro.test.ts`. These cover the stable hold, monotonic time remap, zero-speed departure, unit-speed handoff, hidden Intro opacity and prepared configuration agreement.
