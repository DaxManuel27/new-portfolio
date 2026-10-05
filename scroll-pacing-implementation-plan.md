# Plan: calmer, more controllable scroll animations

Status: revised after feedback that 1.6× distance required too much effort. Current implementation uses **1.15 viewport-heights per unit** and a **100ms exponential smoothing response** shared by all animated content. Phase lengths remain unchanged.

The implementation separates native target progress from rendered progress, settles within a quarter scroll pixel, caps long frame deltas at 64ms, keeps direct navigation immediate, preserves both positions during resize, and synchronises on visibility changes. Unit checks cover frame-rate consistency, convergence, reversal, and long frame gaps. Browser checks confirmed native scrolling eases toward its target, settles, and reverses. The recommendations below record the original staged plan.

## Goal

Make small wheel movements and trackpad gestures produce smaller animation changes, with enough room to watch transitions and read content. Preserve the current scene order, camera paths, monitor layout, artwork, and interactions.

## What the current code does

- `web/src/main.ts` allocates approximately one viewport-height of scrolling per journey unit on desktop, and only 0.8 viewport-heights below 700px wide.
- ScrollTrigger's `onUpdate` assigns `self.progress` directly to the rendered `progress`. There is no time-based smoothing between the scroll position and the scene.
- `web/src/journey.ts` includes short phases: the Pi reveal and contact-card centring each use 0.4 units; the monitor pan uses 0.8; the Pi dive uses 0.9.
- The scene already eases many individual movements. That changes their acceleration profile but does not increase the physical scroll distance required to complete them.

For example, on a 900px-high desktop viewport, the 0.8-unit monitor pan currently spans about 720px. A 120px scroll moves through about 17% of that phase. This is a numerical illustration, not a measurement of a particular mouse or trackpad.

## Recommended approach

### 1. Increase scroll distance first

Introduce a small `web/src/scroll-pacing.ts` configuration with an initial animated-journey distance multiplier of **1.6** on both desktop and narrow screens.

- Update `sizeScroll()` to use this multiplier instead of the existing desktop 1 / narrow-screen 0.8 split.
- Keep one consistent mapping: `maxScroll = totalUnits × viewportHeight × distanceMultiplier` (subject to browser pixel rounding).
- Leave `evaluate()`, the phase lengths, and camera paths unchanged in the first pass.
- Continue deriving jumps and chapter navigation from `maxScroll()`; do not introduce a separate navigation scale.
- Keep native scrolling, touch gestures, keyboard scrolling, and the scrollbar.

Expected effect: the same pixel movement advances roughly 37.5% less through an animation on desktop and 50% less on narrow screens. The example monitor pan grows from approximately 720px to 1,152px. The entire desktop journey grows from 31.8 to 50.88 viewport-heights, so checking for fatigue is part of acceptance.

The 1.6 value is a starting point for visual review. Compare 1.4, 1.6, and 1.8 using temporary review controls; choose the lowest value that feels controlled. These are scroll-distance multipliers, not animation durations in seconds.

### 2. Tune only transitions that still rush

After reviewing the global change, selectively lengthen the busiest phases in `journey.ts`. Do not apply all increases automatically on top of the global multiplier.

| Phase | Current units | Candidate units if still too quick |
| --- | ---: | ---: |
| Workstation monitor pan | 0.8 | 1.0 |
| Formula SAE screen zoom | 1.2 | 1.5 |
| Pi dive | 0.9 | 1.2 |
| Pi reveal | 0.4 | 0.6 |
| Car shrinking onto the projects desk | 1.3 | 1.6 |
| Projects monitor entry | 1.0 | 1.3 |
| Contact card centre / expand | 0.4 / 0.7 | 0.6 / 0.9 |

Review reading sections separately. Hack Atlantic and Ultra Maritime should remain easy to read without adding excessive empty scrolling. Preserve the three placeholder project cards and the existing contact handoff.

If phase lengths change, check docking and departure formulas that use absolute journey units, and update duration expectations in tests. No camera path redesign is included.

### 3. Add light smoothing only if needed

Distance fixes sensitivity. Smoothing can soften abrupt input, but on its own it only delays the same movement. First review the distance-only version.

If necessary, introduce a single shared rendered progress:

- `targetProgress`: native scroll position, updated by ScrollTrigger.
- `renderedProgress`: the value consumed by every scene and visible overlay.
- Start with a frame-rate-independent exponential response: `alpha = 1 - exp(-dt / 0.08)` and move rendered progress toward the target by `alpha`.
- An 80ms time constant reaches approximately 95% of a fixed target in 240ms. Tune downward if it feels delayed.
- Never overshoot. Reverse input changes the target immediately.
- Continue requesting frames while progress is settling, then stop once the remaining gap is below a small scroll-pixel-equivalent threshold.
- Clamp frame delta after interruptions; synchronise on returning from a hidden tab so there is no delayed catch-up flight.

All camera poses, laptop motion, monitor content, Pi text, reel layout, contact-window geometry, chapter announcements, and print hit targets must consume the same rendered progress. Do not smooth each subsystem independently.

Audit existing `evaluate(progress)` calls, including `updatePrintControls()`, so a button cannot become active before its visible scene arrives. Save target progress for navigation/history; use rendered progress for what is visible. Preserve print timing as its own clock.

Do not rely on adding a `scrub` option alone to the current ScrollTrigger: this trigger directly updates application state and is not driving an attached GSAP animation.

## Navigation, resizing, and accessibility

- Explicit chapter links, hash navigation, review-slider seeks, refresh-to-top, and test seeks synchronise target and rendered progress immediately. They should not slowly fly through the whole journey.
- On resize, preserve the target and rendered normalised positions independently, recalculate the scroll distance, and suppress intermediate scroll callbacks while restoring the offset. Do not snap a settling camera to its target as a side effect of resizing.
- Switching into reduced motion or static fallback cancels smoothing and uses the existing accessible layout. The increased distance applies only to the animated journey.
- Leaving reduced motion reinitialises both progress values consistently at the intended destination.
- Native scrollbar dragging and Page Down may intentionally cross multiple phases. Do not force visitors to watch every transition before reaching a section.
- Keep scroll listeners passive where possible. No wheel interception, `preventDefault()` scroll controller, scroll snapping, new scrolling dependency, or public speed setting is required.

## Implementation sequence

1. Add the pacing configuration and apply the 1.6 distance multiplier in `main.ts`.
2. Review mouse wheel, slow and fast trackpad gestures, reverse scrolling, and mobile swipes. Settle on the distance multiplier.
3. Adjust only the phase budgets that remain rushed; review total journey effort again.
4. If abruptness remains, implement and test the optional shared progress smoother.
5. Run the production build and relevant journey, camera, reel, contact, and print-interaction checks.
6. Capture before/after samples at identical scroll distances and final screenshots of key handoffs.

## Validation and acceptance

- A fixed 120px scroll advances approximately 62.5% as far through the desktop journey as before at the proposed global multiplier.
- Small trackpad gestures are easy to control; stopping does not produce a long floating tail.
- Reverse scrolling follows the same route and ends at the same pose for the same scroll position.
- Text and models remain locked together during monitor zooms, Pi transitions, and the contact-card expansion.
- The lower-level phase and camera endpoint tests still pass; update hardcoded duration totals only if phase budgets actually change.
- If smoothing is added, test equal elapsed-time responses at 30/60/120Hz, monotonic convergence, reversal, exact seeks, and hidden-tab recovery using a controlled clock.
- Verify refresh starts at the top, direct links land correctly, resizing preserves position, and reduced motion remains usable.
- Verify the print button is clickable at the visible printer and the paper animation still completes independently of scrolling.
- Compare desktop and portrait layouts and check touch interaction on a real touch device when available; viewport emulation alone does not validate touch feel.
- No geometry, content, scene order, camera paths, or public controls change as part of this work.

## Files expected to change

- `web/src/scroll-pacing.ts`: central distance settings; optional pure smoothing helper.
- `web/src/main.ts`: scroll-space calculation; optional target/rendered progress and lifecycle integration.
- `web/src/journey.ts`: only phase durations selected after review.
- `web/tests/`: pacing tests and relevant journey/browser expectations.

## Recommended first delivery

Ship the increased scroll distance for review first. It directly addresses oversensitivity and preserves the existing deterministic animation system. Add selective phase timing changes or smoothing only where the review shows a remaining problem.
