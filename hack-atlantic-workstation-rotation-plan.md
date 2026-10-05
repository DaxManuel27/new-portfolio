# Hack Atlantic → Workstation — restore the original flight rotations

Status: implemented, 2026-10-02. The original Hack departure turntable spin is restored on the new Workstation route. Verification evidence is recorded in `workstation-rotation-validation.md`.

## Desired result

Restore the deliberate rotating-laptop transition when leaving Hack Atlantic for the Ultra Maritime + Formula SAE Workstation. The closed laptop lifts, makes the earlier turntable spin with its slight tilt, aligns with the new desk, and lands. The camera keeps the rotating silhouette readable before moving to the Ultra Maritime monitor.

The attached screenshot shows the current issue: a small, nearly flat laptop hovering in the middle of an otherwise empty portrait viewport. Treat it as evidence of the current presentation, rather than a target pose to reproduce. The primary change is the laptop's body rotation; camera adjustments support its readability.

## What the previous animation actually did

The earlier journey contained two different rotations around this part of the experience:

| Previous route | Motion | Authoritative reference |
| --- | --- | --- |
| Hack Atlantic → Formula SAE | Lift and full turntable spin, slight pitch, no barrel roll | `figma_refs/completion/motion-manifest.json`, transition 2; Figma `48:6021` |
| Formula SAE → Ultra Maritime | Full barrel roll, with smaller heading changes | Same manifest, transition 3; Figma `48:6638` |

**Implementation choice:** restore the old Hack Atlantic departure's turntable spin on the new direct Hack Atlantic → Workstation route. It is the closest match to the previous transition from the same starting scene. The barrel roll is a separately identified reference, available if Dax meant the old arrival into Ultra Maritime. Do not combine both rotations into this one flight by default.

The original motion remains recoverable in `backups/pre-station-reorder/web/public/assets/macbook-journey.glb` and `backups/pre-station-reorder/blender/live-before-reorder.blend`. The Figma manifest records the unwrapped angles, which a single pair of endpoint quaternions cannot recover.

Read-only sampling of the exported spin-pivot tracks confirms:

- Earlier Hack departure, animation seconds 4–8: approximately **417.6° of total angular travel**, including heading and pitch changes.
- Current replacement, seconds 4–8: approximately **17.3°**, simply aligning the departure heading to identity.
- Earlier Formula SAE → UM, seconds 8–12: approximately **369.2° of total angular travel**, dominated by its barrel roll.

These totals sum angular distance between successive quaternion samples; they are not single-axis yaw measurements.

## Cause and correction

In `blender/station_reorder.py`, the onward-flight authoring currently uses:

```python
spin.rotation_euler = sq.slerp(Quaternion(), smo(p)).to_euler()
```

That follows the shortest path from Hack Atlantic's baked departure orientation to the Workstation's identity orientation. It removes the previous complete revolution. The exported GLB faithfully contains this short alignment, so changing scroll timing alone cannot restore the missing spin.

Replace that body-orientation authoring with the original **unwrapped XYZ angle curves**, retimed into the current safe flight. Keep the existing feet-root path as the starting position route. Convert each evaluated Euler pose to the exported rotation at dense frame samples, retaining the complete revolution through intermediate quaternions. Never interpolate only the start/end quaternions, normalize angles modulo 360°, or accumulate rotation from previous scroll frames.

## Rotation reference and new landing orientation

Angles below use the manifest's Blender convention: pitch = X, roll = Y, yaw = Z, rotation order XYZ. The glTF conversion is `(x,y,z) → (x,z,−y)`; Blender yaw must be converted through the existing export pipeline, not applied as browser Z rotation.

| Source keyframe | Original pitch | Original roll | Original yaw | Adapted pitch | Adapted roll | Adapted yaw |
| --- | ---: | ---: | ---: | ---: | ---: | ---: |
| 10% | 360° | 0° | −17.3° | 0° | 0° | −17.3° |
| 30% | 372° | 0° | −20° | 12° | 0° | −20° |
| 50% | 372° | 0° | 120° | 12° | 0° | 120° |
| 70% | 364° | 0° | 290° | 4° | 0° | 290° |
| 90% | 360° | 0° | 385° | 0° | 0° | **360°** |

Subtracting the constant 360° from pitch preserves its physical orientation. Preserve unwrapped yaw throughout. The old end heading, 385°, belongs to the old Formula SAE composition; the new Workstation requires 0°, represented as **360°** at the end of the full turn. This adapts the final heading by 25° while retaining the original turn direction, anticipation and main middle poses.

For the initial block, use cubic smoothstep between angle anchors, matching the previous manifest's interpolation. Keep any later smoothing conservative and verify it against the reference poses and continuous endpoint velocities.

## Timing and 10/30/50/70/90% storyboard

Keep the current scroll allocation: Hack Atlantic exit **.7 units**, Workstation travel **1.5**, approach **.9**, UM hold **.8**. The full journey remains **22.6 units**. The flight spans baked frames **121–241** / seconds **4–8**; frames 1–121 retain the original Intro/Hack animation.

Use this initial timing, subject to actual geometry clearance:

1. **0–18% of travel:** lift and complete the current forward depth adjustment. Hold the departure body orientation until the laptop clears the desk/props. Keep the lid shut.
2. **18–72%:** perform the full turn in clear air. Map the five adapted rotation anchors to travel progress **18%, 31.5%, 45%, 58.5%, 72%**. This retains the original pose sequence while finishing rotation before the existing vertical descent.
3. **72–100%:** hold the final physical identity orientation and descend to the exact dock. No residual spin during tabletop contact.
4. **Approach:** retain the current landed pose and opening into the Workstation presentation, then the camera's move toward Ultra Maritime.

For reference evaluation, define `r = clamp((travelProgress − .18) / .54)`. Evaluate the adapted angle anchors at `r = 0, .25, .5, .75, 1` with smoothstep between adjacent anchors. Before this interval hold its first pose; afterward hold its last pose. The endpoint has yaw 360° and pitch/roll 0°, physically identical to the dock quaternion.

| Travel sample | Laptop action | Camera / scene |
| --- | --- | --- |
| 10% | Closed; lifting at the Hack departure heading | Continuous departure camera, laptop fully inside the viewport; Hack still supplies context |
| 30% | Clear of the desktop; slight tilt and beginning the original heading turn | Follow the spin pivot; preserve readable body thickness |
| 50% | Main turn in progress; closed silhouette changes visibly | Stable framing through the turn; no camera counter-rotation that visually cancels it |
| 70% | Finishing the turn and flattening for landing | Workstation becomes visible; camera begins resolving into the existing wide pose |
| 90% | Rotation complete; descending at the final dock heading | Both monitors visible; retain exact Workstation-wide endpoint |

The 10/30/50/70/90 capture labels refer to **current travel progress**. They differ from the old manifest's keyframe percentages because the spin is retimed to finish before descent.

## Position, hinge and camera

Use the current metric placement: Workstation origin glTF `(4.4,0,.8)`; laptop feet dock `(4.4,.74,1.02)`. The rig remains `Journey_TravelFeet → Journey_MacBook_TravelRoot → Journey_MacBook_SpinPivot → Journey_MacBook_LidPivot`. No mesh scale animation, new geometry or texture changes are required.

The current path was validated with little rotation. A full spin increases its swept footprint, so recheck the entire path against Hack Atlantic's desk/banner, both Workstation monitors and stands, the mug and tabletop. If clearance fails, adjust the middle airborne height or front corridor, while retaining departure and dock endpoints. In particular, finish the full heading change before descending between the stands. Do not assume the earlier clearance result still applies.

Keep the closed hinge throughout flight. The canonical closed Blender hinge angle is 110°; confirm the exported closed pose rather than setting an identity hinge quaternion. Opening happens after landing, as in the current Workstation approach.

During the spin, fit the laptop more prominently than in the supplied screenshot. Initial desktop framing targets: maximum hero width about **48–56%** of the viewport and maximum height **64%**, consistent with the earlier motion specification. Derive a safe flight framing envelope from the whole rotating body and blend into/out of it smoothly; do not resize the camera independently at every thin edge-on silhouette, which would create zoom pumping. Check portrait framing from the actual rotated bounds.

The camera stays upright, with no roll, cuts or extra revolution. It follows the laptop through the airborne middle and joins the current Hack departure and Workstation-wide poses continuously. Adjust only the affected travel samples in `journey.json`; preserve the existing station poses and later monitor camera moves.

## Implementation sequence

1. **Back up and inspect.** Copy every file/asset to be changed into a fresh `backups/pre-workstation-rotation/` directory. Record source hashes and re-read each file immediately before editing. Inspect the current Blender scene through MCP; recover the old curves from the manifest/backup without replacing the active scene wholesale.
2. **Figma storyboard through MCP.** Add a rotation revision alongside row `144:13155` in section `144:13152`. Show the five travel samples, full-turn direction, tilt, closed hinge and landing orientation. Keep the current row as a comparison. Include the source reference `48:6021`, and explicitly identify the separate barrel-roll reference `48:6638`.
3. **Blender block and clearance through MCP.** Preserve the rig and source scene. Author a named `AN_` rotation revision for frames 121–241. Block the recovered pose sequence, test the swept geometry, then ease/bake at 30 fps. Keep positions initially; make only justified corridor changes if the rotating geometry needs them. Update the journey review camera/visibility to match the resulting flight.
4. **Export and runtime.** Update `blender/station_reorder.py` so rebuilding reproduces the spin. Use the existing GLB/meshopt preparation pipeline and regenerate the hero animation and affected travel-camera samples. Keep this as baked animation, with `createHeroSampler()` evaluating absolute clip time. Avoid a second runtime rotation layer that would duplicate or cancel the exported spin.
5. **Verify and document.** Compare Figma, Blender and browser captures at all five samples, scrub normally and slowly in both directions, and record any retiming or clearance adjustments.

## Expected files

| File | Expected work |
| --- | --- |
| `blender/station_reorder.py` | Replace shortest-path body alignment with recovered unwrapped rotation anchors and retiming |
| `blender/station_reorder_review.py` | Update review timing/camera sampling if the fitted travel camera changes |
| `blender/portfolio-station-reorder.blend` | Revised hero action and matching camera review |
| `exports/station-reorder/macbook-journey.glb`, `travel.json` | Revised source animation and travel-camera samples |
| `web/public/assets/macbook-journey.glb`, `journey.json`; matching `exports/web/` assets | Optimized animation and manifest |
| `web/tests/workstation-clearance.test.ts` | Independent full-turn, join, swept-clearance and endpoint assertions |
| `web/tests/camera.test.ts`, `web/tests/browser.mjs` | Travel framing, deterministic reverse/direct seeks, screenshot coverage |
| Figma rotation-revision row; validation Markdown | Visual reference and implementation evidence |

`web/src/camera.ts` or the asset-preparation script should change only if the fitted travel samples cannot deliver the desired framing through their existing interfaces. The current `journey.ts` phase clock and `scene.ts` dock blending should already play a correctly baked turn; inspect for any overrides before adding runtime code.

## Acceptance checks

- The Hack → Workstation flight visibly completes one full heading turn, with the earlier slight tilt and the same direction. Fractional intermediate poses prove the rotation exists; identical start/end orientations alone do not.
- Preserve the old middle rotation anchors; allow the documented final-heading correction and timing remap. Confirm the correct XYZ/glTF axis conversion.
- The hinge stays shut in flight. Body rotation is complete before descent; the landed heading is exactly the current Workstation dock.
- The rotating laptop clears all actual desk/monitor/stand/mug geometry, including fractional samples between baked frames. Its feet rest on the tabletop after landing.
- No laptop clipping or abrupt zoom on desktop 1440×960 and phone 390×844. Keep the lid/body thickness readable through edge-on portions.
- Position, orientation and camera are continuous at Hack exit → flight and flight → approach. Validate near-boundary values and velocity behavior as well as endpoint equality.
- Forward, backward, repeated and direct seeks produce identical poses for the same progress. Scroll-controlled rotation has no timers, direction flags or accumulated angles.
- Intro and Hack Atlantic's initial flight retain their existing backed-up transforms. The MacBook still becomes invisible from the FSAE monitor zoom onward and returns at its dock on reverse.
- The existing FSAE and ultrawide handoff image checks continue to pass; project cards, Resume print interaction and notebook links retain their current behavior.
- Phone uses the same complete rotation with fitted framing. Reduced motion retains still-image crossfades; static mode retains the current still order/project list.
- Capture 10/30/50/70/90% in Blender and desktop/phone browser views, plus slow forward/reverse review. Run `npx tsc --noEmit`, `npm test`, `node tests/browser.mjs` and `npm run build` after implementation.

## Decision recorded for implementation

The default is the **earlier Hack Atlantic turntable spin**, adapted to land at the new Workstation heading. The old Ultra Maritime barrel roll is documented as an alternative reference, not silently added to this flight. Final airborne framing and any small clearance adjustment are resolved during the Blender block and browser review.
