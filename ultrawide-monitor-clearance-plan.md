# Ultrawide monitor clearance

Status: implemented, 2026-10-02. The browser now applies a deterministic clearance route on arrival and departure, and the camera follows the corrected laptop center. Monitor placement and visibility timing are preserved.

## Implementation record

- `web/src/projects-motion.ts` defines the corrected route. Arrival blends away from the original flip during 13.6–14.4 s, aligns in front of the monitor, moves over the parked position by 15.2 s and descends vertically by 16 s. The quaternion blend retains a continuous branch through the original half-turn.
- The actual Projects dock is the common arrival, hold and departure endpoint. During exit the laptop remains parked while the camera pulls back. Departure follows the forward-slide, lift-and-turn and side-clear waypoints below, meeting the existing Resume landing exactly at 18 s.
- `web/src/scene.ts` restores the original sampled pose first, applies the correction and follows the change in the laptop's full bounds center. The same center tracking keeps the late Resume alignment fully visible. The station cameras take over through the existing continuous focus blend.
- The correction is runtime source, so regenerating the preserved GLB does not discard it. The Blender review script consumes the geometry test's exact 30 fps pose export and writes a separate review file without replacing the canonical animation assets.
- `web/tests/projects-clearance.test.ts` reconstructs the shipped models and covers the entire base and hinged lid. The browser regression checks desktop and portrait views, the screenshot's 77% point, continuous camera joins, fixed docking and matching reverse/direct seeks. Normal, overhead and side captures and videos are in `web/test-results/projects-motion-review/`.

The final clearance sweep covers 12–20 s in **9,604 intervals**, with a conservative minimum separation of **39.18 mm** from the monitor's separately enclosed housing, screen, stem and base. The closest part is the stand base near the parked pose. Base/lid hull extrema are checked against all exported vertices; analytic movement bounds cover the gaps between samples. The forward slide leaves **24.54 mm** inside the desk's front edge. The desktop/portrait browser check passes **180 forward samples**, matching reverse/direct seeks and all stage joins. Printer, shared-desk, safe-landing and full-journey browser regressions also pass.

## What the screenshot shows

The curved ultrawide belongs to **Projects**. The review menu says **Resume · travel · 77%** because the next flight has started, while the Projects desk is still visible.

The parked Projects laptop and the baked flight endpoint do not match. The parked feet are approximately `(7.9, 0.74, 0.14)` in browser coordinates, facing straight ahead. The old flight boundary is approximately `(7.9, 0.74, 0)`, with a different yaw. The current exit blend therefore pulls the laptop **14 cm backward toward the monitor while turning it**, before the outgoing flight begins. The original flight then starts lifting/rotating beside the screen. The camera does not cause that displacement; it makes the intersection visible.

This needs a physical path correction, including the boundary between the parked pose and flight. Camera reframing alone cannot solve it.

A dense scan of the actual exported meshes' world-space bounds also found potential overlap during the incoming Projects flight/approach (roughly 63.27–66.50% of the journey), the Projects exit (75.49–76.40%), and the flight toward Resume (76.40–79.66%). These are conservative bounding-box diagnostics, not triangle-intersection proof. The existing flight apex at baked time 18 s is already clear: the laptop's leftmost bound is about **18.3 cm beyond the monitor's rightmost bound**.

## Motion

1. **Leave from the actual parked position.** During the camera's initial pullback, keep the laptop at its present Projects desk pose. Remove the backward slide and rotation toward the obsolete flight endpoint.
2. **Move clear in front of the monitor.** Slide approximately **10 cm toward the viewer**, keeping the laptop's yaw and open lid fixed. This fits on the existing desk: the tested forward pose ends about 2.5 cm inside its front edge. Complete this clearance movement before the main rise and turn. Any additional initial hover or lid motion must pass the same full-geometry clearance checks.
3. **Lift and turn in open space.** Start the main rise, yaw and travel toward Resume only after the entire laptop—including lid corners—has a clear envelope in front of or beyond the side of the ultrawide. Do not drift backward through the screen while rotating.
4. **Join the safe Resume landing.** Reconnect at the existing, verified-clear apex at baked time **18 s**, before the alignment and vertical descent into the empty laptop bay. Preserve the separation from the phone, printer and notebook and the current 19–19.6 s vertical touchdown.

Use smooth acceleration and deceleration through each stage. These are stages within a scroll-controlled journey, not additional real-time waits. Reverse scrolling must trace the same safe path backward.

### Implemented departure route

The departure uses these waypoints:

| Animation interval | Motion in browser world coordinates |
| --- | --- |
| Projects exit | Keep the actual parked pose; let the camera pull back |
| 16–16.4 s | Move from `(7.9, 0.74, 0.14)` to `(7.9, 0.74, 0.24)`, holding orientation and lid |
| 16.4–17.3 s | Rise and move right to `(8.72, 1.2, 0.24)`, turning in the clear forward lane |
| 17.3–18 s | Curve back to the existing apex, after the whole laptop has passed the screen's right edge |
| 18 s onward | Continue the current safe Resume alignment and descent |

The original diagnostic report remains in `web/test-results/projects-clearance-analysis/report.json`. Current geometry and browser results are in `web/test-results/projects-clearance/` and `web/test-results/projects-motion/`.

## Implementation approach

- Measure the actual shipped monitor screen, bezel, housing, stem and foot, plus the laptop base and hinged lid, in one world coordinate frame. Do not use only the laptop pivot to judge clearance.
- Define a clearance route with a visible safety gap, initially targeting **at least 3 cm** from the monitor's swept collision envelope. Fit this against the curved screen's actual surfaces or tight convex parts, rather than treating its whole bounding box as a solid rectangle.
- Make the parked Projects pose the canonical endpoint for both arrival and departure. Audit the incoming Projects approach too: it currently blends the same mismatched flight endpoint into the parked pose. If it crosses the monitor, route it through the same clear space and complete orientation before its final descent.
- Add a focused, deterministic pose evaluator for the affected Projects approach/exit and the adjacent flight segments. Restore the original sampled transform first, then apply the corrected pose once. Keep evaluation independent of scroll direction and previous frames, following the current safe-desk-arrival pattern.
- Keep the late Resume descent controlled by the existing landing implementation. Explicitly verify the positional and rotational handoff rather than layering two corrections on top of each other.
- Make the camera follow the corrected subject position and fit the complete laptop throughout the maneuver. Blend into and out of the current camera path with continuous position, rotation and framing. Preserve the Projects close-up and the Resume overhead stop.
- Keep the monitor in its current position and retain its normal visibility timing. Do not conceal an intersection by fading it sooner, hiding the lid, scaling the laptop or disabling depth testing.
- Record the corrected route in a reproducible source/configuration and update the Blender review motion or derived clip as appropriate, so later exports cannot silently restore the old endpoint. Preserve the current source before altering any baked animation.

Likely files: `web/src/journey.ts`, `web/src/scene.ts`, a focused Projects motion helper, and `web/src/camera.ts` where needed for corrected framing. Relevant existing references are `web/src/desk-arrival.ts`, `web/src/hero.ts`, `figma_refs/completion/build_motion.py`, and `blender/completion_pipeline.py`. Only regenerate animation/camera assets if the implementation changes their authored source; unrelated station models do not need rebuilding.

## Acceptance checks

- Verify the entire laptop against the real ultrawide assembly throughout the incoming approach, parked hold, exit and outgoing flight—including the screenshot's approximately 77% position.
- Check fractional times between baked frames and the swept corners of the base/lid. Report minimum clearance and the worst pose; a few screenshots or bounding-box overlap alone are not a collision proof.
- Review slow continuous playback from the normal camera, overhead and a side angle. No backward recoil, screen penetration, premature turn, tabletop penetration or sudden acceleration at stage joins.
- Test forward, reverse and direct seeking, especially across the Projects exit/Resume travel boundary and the handoff to the corrected desk landing.
- Check desktop and portrait framing, with no cropped laptop, abrupt zoom or camera jump.
- Run the current camera, shared-desk, safe-landing and printing regressions plus the production build. Add an exported-geometry regression that would fail for the old Projects path.

Completion means the laptop visibly clears the monitor before rising and turning, and the safe route remains continuous when scrolling in either direction.
