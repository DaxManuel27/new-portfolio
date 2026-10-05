# Plan: Natural MacBook landing at Hack Atlantic

Status: implemented in the web animation sampler on October 4, 2026. The initial height correction below was subsequently replaced by `hack-atlantic-continuous-descent-plan.md` to remove a dip, rise, and hover.

## Implementation notes

The web sampler now uses the existing station dock as the authoritative target. Alignment completes above the table: body alignment by animation time 3.5 seconds, horizontal positioning by 3.7 seconds, then a vertical descent ending at 4.0 seconds. The laptop remains planted through the camera approach, content, and exit. Departure lifts vertically before rejoining the existing flight.

This uses the isolated runtime correction allowed in section C instead of editing the Blender export. The correction lives in `web/src/hero.ts` and is shared by the renderer and geometry tests. The Blender source and GLB remain the original authored flight; the corrected route is a web presentation layer. Final dock, screen framing, and fallback poses are unchanged.

Validation: banner/stand clearance retains the 1 cm margin; measured mesh-to-table contact gap is approximately 0.12 mm; stationary transforms, vertical descent, continuity, and repeated/reverse seeks pass. Browser captures at 2048×1051, 1440×960, and 390×844 pass without page errors. See `web/test-results/natural-landing/` and `web/scripts/review-natural-landing.mjs`.

Production build passes. The full suite initially reports 83/84 passing; the unrelated desk-return test still expects the older monitor layout, while the current manifest has inward-facing monitors. Targeted landing and flight tests also exercise the runtime correction.

## Goal

The MacBook should arrive over a clear spot between the banners, finish aligning while airborne, descend gently onto the table, and remain planted while the camera moves toward its screen. There should be no sideways or backward sliding, rotation on the tabletop, second docking movement, or sudden snap.

This plan addresses the Hack Atlantic arrival shown in the three screenshots supplied on October 4, 2026.

## Confirmed cause

There are two separate sources of movement:

1. **The baked animation continues translating after reaching table height.** Sampling the current exported laptop animation shows its feet root at approximately `y = 0.740 m` at animation time 3.7 seconds, while its depth continues from `z = 0.0917 m` toward `z = 0 m` by 4.0 seconds. This explains the apparent slide before the close-up.
2. **The runtime then blends to a different dock pose.** At 4.0 seconds, the baked position is approximately `[2.075, 0.740, 0]`, and its rotation differs from the final dock orientation by about 17.3°. The final dock position is `[2.075, 0.740, -0.040]`, with identity rotation. During the first 0.35 scroll units of `approach`, the runtime moves the laptop those remaining 4 cm and rotates it into place.

These numbers describe the rig’s feet-root transform. Confirm the actual rubber-foot contact against the tabletop geometry when implementing; root height alone is not a collision test.

The camera also changes framing during docking, which can emphasize the adjustment. Fix the object’s motion first, then evaluate the camera independently.

## Intended movement

### 1. Approach the landing spot

Keep the recognizable incoming flight and rotation. As the MacBook reaches the Hack Atlantic table, steer it toward the final dock position while it is visibly above the tabletop.

Use the existing approved final dock as the initial target. It already supports the later screen close-up and sits between the banners. Change that spot only if geometry checks reveal insufficient clearance.

### 2. Finish alignment in the air

Bring the horizontal position and heading to their final values before contact. Avoid completing the turn while the rubber feet are at tabletop height.

Suggested starting point for tuning: finish alignment during the final quarter of the incoming flight, leaving the final portion for a short vertical descent. Choose the exact timing and clearance after inspecting the full laptop silhouette, including the open lid.

Do not remove or shortcut the intended earlier rotation by interpolating directly between its start and end quaternions.

### 3. Descend and settle

Once aligned, hold the horizontal position and heading constant. Lower the MacBook vertically with a smooth slowdown into contact.

- No horizontal movement during the final descent.
- No rotation once the feet contact the table.
- No exaggerated bounce or spring overshoot.
- No penetration of the tabletop or visible floating gap.
- The terminal baked pose must match the runtime dock pose, including the lid angle.

### 4. Stay planted while the camera advances

After touchdown, preserve the exact feet position and body rotation through `approach`, `hold`, and `hack-story`.

The camera may continue moving toward the laptop’s display. That should change perspective while the laptop remains fixed relative to the table and banners.

Keep the current final screen framing and content handoff unless a change is necessary to remove a discontinuity.

## Implementation approach

### A. Establish a single authoritative dock pose

Use the station’s dock data in `web/public/assets/journey.json` as the starting reference:

- Feet position: approximately `[2.075, 0.740, -0.040]` metres in browser coordinates.
- Body quaternion: `[0, 0, 0, 1]`.
- Lid quaternion: approximately `[0.0348995, 0, 0, 0.9993908]`.

Confirm coordinate conversion before applying these values in Blender. Browser coordinates use Y up; Blender uses Z up.

The baked arrival endpoint, runtime dock target, and departure start must agree. Do not hide a disagreement with a faster docking blend.

### B. Correct the authored landing path

Inspect `blender/hack_banner_clearance.py` and the source scene/export pipeline that produced the current `macbook-journey.glb`.

Adjust the late incoming segment so lateral movement and rotation finish above the table, followed by the vertical descent. Preserve the earlier Intro flight and unrelated station motions.

Use continuous position and rotation curves, with gentle terminal velocity. Retain intermediate rotation keys that carry the intended full turn.

Re-export the affected hero animation through the existing preparation pipeline. Keep source and distributed assets consistent.

### C. Remove the second on-table docking correction

Relevant runtime code:

- `web/src/journey.ts`: computes `heroTime`, `dock`, and the Hack Atlantic camera mix.
- `web/src/hero.ts`: samples the baked animation.
- `web/src/scene.ts`: applies the feet, body, and lid docking blends after sampling.

Once the baked endpoint matches the dock, the approach blend should have no positional or rotational effect at Hack Atlantic. Prefer retaining shared docking behavior for other stations and making the Hack Atlantic endpoint agree with it.

If a station-specific runtime landing correction is necessary, implement it as a deterministic, isolated pose function applied consistently in rendering and geometry tests. It must finish before contact and join the baked route continuously. Do not add a hidden snap or accumulated per-frame adjustment.

### D. Preserve a smooth departure

The same endpoint is used in reverse and when leaving Hack Atlantic. Check both paths after changing the landing.

If the existing departure begins from the old baked pose, update its initial segment to start from the corrected dock. Lift clear of the table before translating or rotating away. Preserve the established banner-clearance route and closed-lid travel behavior.

### E. Review camera coupling

Hack Atlantic currently combines the docking progress with the camera mix. Once the landing is corrected, check whether that coupling creates an unnecessary acceleration in the close-up.

Keep the camera moving smoothly from the arrival view to the existing screen framing. Only retune the coupling if visual review shows a jerk; do not change camera behavior solely because the laptop trajectory changed.

## Verification

### Geometry and deterministic motion

Update or extend the existing checks in:

- `web/tests/hack-clearance.test.ts`
- `web/tests/hero.test.ts`
- Relevant camera and journey tests

Check the actual rendered pose, including any runtime correction, rather than testing only the unmodified baked animation.

Required checks:

- After touchdown, horizontal position changes by no more than 0.1 mm and body rotation by no more than 0.01° through the stationary phases.
- Horizontal position and heading are fixed during the final vertical descent.
- Feet touch the table without penetration; validate against actual mesh geometry.
- The full laptop clears banners and stands by the existing 1 cm margin.
- Position, orientation, and visible speed remain continuous at the corrected segment boundaries.
- Repeated direct seeks and forward/reverse sampling produce identical poses.
- The arrival endpoint, runtime dock, and departure start agree.
- Intro and Workstation behavior remain unchanged outside the intentionally edited boundary region.

### Browser review

Capture a short sequence covering:

1. Incoming flight before alignment.
2. Alignment complete above the table.
3. Mid-descent.
4. First contact.
5. Early and late camera approach.
6. Screen-content entry.
7. Reverse scroll and departure.

Review at the screenshot’s wide desktop proportions, 1440×960, and 390×844. Keep the table and banners visible during landing review so object motion can be distinguished from camera motion.

Use a fixed diagnostic camera for one comparison sequence. If the laptop moves against the table in that view after touchdown, the object pose still needs correction.

Run the existing relevant tests and production build. Refresh any fallback image whose final pose changes.

## Acceptance checklist

- [ ] The laptop selects its spot while airborne.
- [ ] Horizontal travel and heading alignment finish before touchdown.
- [ ] Final descent is gentle and vertical.
- [ ] No tabletop sliding, pivoting, or second docking adjustment.
- [ ] The MacBook remains fixed as the camera zooms toward the screen.
- [ ] Feet contact the tabletop cleanly.
- [ ] Banners and stands remain clear throughout arrival and departure.
- [ ] Reverse scrolling follows the same path without jumps.
- [ ] Existing screen content and final close-up still align.
- [ ] Source animation, runtime exports, checks, and any affected fallback images agree.

## Decisions to revisit during visual review

Default to the existing landing spot, no bounce, and the current final close-up. Tune the airborne clearance and descent duration from the actual geometry and captured motion. A new landing location is unnecessary unless clearance testing shows otherwise.
