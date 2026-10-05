# Plan: Remove the extra lift before the Hack Atlantic landing

Status: implemented. This document supersedes the arrival-height portion of `hack-atlantic-natural-landing-plan.md`.

## Implementation and validation

The shared hero sampler now replaces incoming vertical motion from animation time 2.8 to 4.0 seconds with one monotone Hermite descent. It samples the baked start height and incoming slope, limits the tangent to prevent overshoot, and ends at the exact dock height with zero downward speed. The old elevated target and height plateau are removed. Horizontal alignment, body/lid alignment, and departure are unchanged.

The proposed 3.2-second start was checked and rejected because the rotating laptop dipped into the tabletop. Starting at the existing high point at 2.8 seconds provides clearance without a late lift.

Geometry checks pass across 1,001 descent samples: strictly decreasing height, no table penetration, matching incoming velocity, and zero terminal velocity. Existing banner/stand clearance, contact, docking, and deterministic-seek tests pass. Production build passes. Full suite: 84/85 pass; the existing unrelated desk-return monitor-layout expectation still fails. Browser evidence is saved in `web/test-results/continuous-landing/`.

## Intended result

The MacBook finishes its incoming turn, descends smoothly into its spot, and remains on the table as the camera approaches. During the late arrival it must never descend, rise again, hover, and then descend a second time.

Keep the successful parts of the previous fix: alignment before contact, no tabletop sliding or pivoting, the existing landing spot, and the current screen-content framing.

## Confirmed cause

The runtime correction in `web/src/hero.ts` blends the baked height toward a target 12 cm above the dock between animation times 3.3 and 3.5 seconds. The laptop is already below that target when the blend begins. This forces it upward, holds it at that height until 3.7 seconds, then starts another descent.

Measured feet-root heights from the actual sampler:

| Animation time | Height above world origin | Motion |
| --- | --- | --- |
| 3.200 s | 0.8700 m | Descending |
| 3.300 s | 0.8338 m | Descending |
| 3.375 s | 0.8193 m | Near the bottom of the dip |
| 3.400 s | 0.8245 m | Rising again |
| 3.500 s | 0.8600 m | Raised about 4.1 cm |
| 3.600 s | 0.8600 m | Hovering |
| 3.700 s | 0.8600 m | Hovering |
| 3.800 s | 0.8289 m | Descending again |
| 4.000 s | 0.7400 m | Docked |

These are animation-time samples, not elapsed playback seconds; scrolling controls the timeline. The screenshots also contain camera movement, but the height reversal exists in the object itself.

The previous regression test checked monotonic height only from 3.7 to 4.0 seconds. It therefore passed while missing the dip, rise, and hover immediately before that interval.

## Proposed change

### 1. Replace the incoming height blend with one descent curve

Give vertical position one authoritative trajectory during late arrival. Remove the blend toward a fixed elevated height and the intermediate height plateau.

Start the replacement before the current reversal, initially around animation time 3.2 seconds, where the unmodified feet root is approximately 0.87 m high. End at the existing dock height of approximately 0.74 m at 4.0 seconds.

Use a monotone cubic Hermite curve, or equivalent shape-preserving curve, with:

- Start height sampled from the baked animation at the chosen boundary.
- Start downward velocity matching the adjacent baked segment, constrained to prevent overshoot.
- Exact dock height at touchdown.
- Zero vertical velocity at touchdown.
- Strict downward motion between the endpoints, with no intermediate hold or upward segment.

A plain smoothstep beginning with zero velocity could introduce a visible hesitation where the existing flight is still descending. Match the incoming slope where possible; if monotonicity requires substantial slope limiting, move the start boundary earlier and inspect that join.

Do not accumulate height from previous frames or clamp against the previously rendered height. The same scroll position must always produce the same pose, including reverse scrolling and direct seeks.

### 2. Coordinate alignment with the descending path

Initially preserve the current horizontal and rotational alignment schedule: body alignment finishes around 3.5 seconds, horizontal positioning around 3.7 seconds, and touchdown remains at 4.0 seconds.

Validate the full laptop geometry while lowering the height. A monotone feet-root path alone does not prove clearance while the body is rotating.

If the laptop needs more clearance, begin the continuous descent earlier from a higher point or complete alignment earlier. Do not restore a late upward correction. Keep the final portion vertical once horizontal alignment is complete.

Treat the exact start time and tangents as values to validate against the actual geometry, rather than assuming the suggested 3.2-second boundary is final.

### 3. Preserve contact and subsequent behavior

The endpoint must still equal the station dock for position, body orientation, and lid angle. Keep the laptop planted throughout approach, hold, story, and the pre-departure exit. Retain the existing departure lift and later flight unless a boundary check reveals a new mismatch.

Keep the correction in the shared sampler so rendering and geometry tests use the same route. This is a runtime animation change; Blender source and exported GLB remain the underlying flight, as in the previous implementation.

### 4. Review the camera separately

First verify the object with a fixed diagnostic camera and visible table reference. Then review the normal scrolling camera through the flight-to-approach transition.

If apparent vertical bobbing remains after the world-space reversal is gone, inspect the camera position, framing target, and interpolation across that boundary. Adjust only the confirmed discontinuity and retain the final screen framing. Do not use camera movement to conceal an object-height reversal.

## Files to update during implementation

- `web/src/hero.ts`: replace only the incoming vertical correction with the continuous descent.
- `web/tests/hack-clearance.test.ts`: extend motion checks across the full late arrival, retaining table-contact and banner-clearance checks.
- `web/tests/hero.test.ts`: add focused curve boundary and deterministic sampling checks if the curve is extracted into a helper.
- `web/scripts/review-natural-landing.mjs`: capture the previously missed dip interval, plus normal-camera and fixed-camera sequences.
- `hack-atlantic-natural-landing-plan.md`: record that this plan replaces the height plateau from the first implementation.

## Verification and acceptance

### Automated checks

- Sample the actual corrected feet-root height densely across at least animation times 3.0–4.0, including every join. Height must not increase by more than numerical tolerance (1 micrometre).
- Verify the descent has no intentional plateau before contact. Check its derivative inside the replacement interval; only the touchdown endpoint should settle to zero speed.
- Verify position continuity and one-sided vertical velocity at the start boundary, and zero terminal velocity at contact. Account for the baked clip's piecewise interpolation when comparing slopes.
- Confirm constant horizontal position and heading during the final vertical segment.
- Keep the existing full-mesh 1 cm banner/stand clearance requirement throughout arrival and departure. Check the laptop does not penetrate the table while rotating.
- Confirm actual mesh-to-table contact remains within the existing 0.2 mm tolerance.
- Confirm exact docking and no post-contact motion, within the existing 0.1 mm position and 0.01-degree rotation tolerances.
- Repeat forward, reverse, repeated-time, and shuffled direct seeks; poses must agree.
- Confirm the early Intro flight and departure/later stations remain unchanged outside the revised arrival interval.

### Visual review

Capture closely spaced frames around 3.2, 3.3, 3.35, 3.4, 3.45, 3.5, 3.6, 3.7, 3.8, 3.9, and 4.0 seconds, then early and late camera approach. Review continuous slow scrolling as well as still frames so a brief hesitation cannot hide between screenshots.

Review at 2048×1051, 1440×960, and 390×844. For each, confirm one smooth descent, no rise or hover, clean table contact, no sliding, and smooth reverse scrolling. Include a fixed-camera sequence to separate object motion from camera framing.

Run the targeted landing, hero, and flight checks, then the production build and full suite. Report unrelated failures separately; the previous run already had a monitor-layout expectation failure in the desk-return test.

## Completion checklist

- [ ] One continuous descending height curve replaces the late lift and plateau.
- [ ] The full arrival interval is tested, including the previously missed reversal.
- [ ] Alignment and geometry clearance remain correct before touchdown.
- [ ] No tabletop sliding, pivoting, floating, or penetration.
- [ ] Fixed-camera and normal-camera review both show a natural landing.
- [ ] Forward and reverse scrolling follow the same trajectory.
- [ ] Final content framing and departure remain intact.
- [ ] Validation results are recorded without claiming still-frame checks prove continuous motion.
