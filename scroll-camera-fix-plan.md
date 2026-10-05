# Fix the repeated zoom at table stops

Date: 2026-10-02. Status: implemented and verified in Chrome on desktop and portrait layouts.

The desired sequence is **land → one smooth move into the station close-up → hold → one smooth departure into the next transition**. Scrolling backward must trace the same path in reverse.

## Confirmed cause

`web/src/journey.ts` currently schedules `reveal → close → hold → pullback → depart`. In `web/src/scene.ts`, these phases send the camera through **travel boundary → wide overview → close-up → wide overview → travel boundary**. The two wide-overview detours produce the repeated zoom.

The camera's visible horizontal span confirms the size of the detour. A smaller span means a closer view:

| Station | Travel boundary | Wide overview | Close-up |
| --- | ---: | ---: | ---: |
| Hack Atlantic | 0.823 | 4.937 | 0.628 |
| Ultra Maritime | 0.849 | 3.159 | 0.460 |
| Projects | 0.849 | 3.060 | 0.460 |

The camera follows this route deterministically; the issue is the chosen path through the views. Existing tests check joins and reverse playback but do not detect a continuous path that zooms out and back in unnecessarily.

## Implementation

1. **Use one focus target per station.** Hack Atlantic, Ultra Maritime and Projects keep their approved straight-on close-ups. Resume and Contact keep their overhead close-ups. Formula SAE uses its existing car overview and side-positioned laptop, because it has no separate close-up. Wide overview data and stills remain available for review, but are no longer mandatory intermediate stops for stations with close-ups.

2. **Replace the two-part arrival with one approach.** Merge the existing 35vh reveal and 55vh close into a 90vh approach. Interpolate the full camera pose—position, rotation and view width—directly from the exact incoming travel boundary to the station focus. Ease once across the whole approach, with no pause or zoom reversal at the old reveal/close boundary. Keep the laptop's settling movement in the initial 35vh subrange so it reaches its station dock before the focus view settles.

3. **Replace the two-part departure with one exit.** Merge the 45vh pullback and 25vh departure into a 70vh exit. Move directly from the focus camera to the exact outgoing travel boundary. Return the laptop from its dock to its travel pose during the final 25vh subrange. The next travel segment then continues from that same pose without visiting the wide camera first. Formula SAE retains its single 35vh approach, 80vh hold and 70vh exit; Contact finishes at its hold.

4. **Preserve timing and other motion.** Keep the current total scroll length and station hold positions. Preserve all six baked laptop motions, physical scale, centered travel framing and the Formula SAE exception. Keep Resume's paper-feed interval in the last 55vh of its approach: printed through forward departure, retracting only when reversing through that interval. Contact links remain active only during its settled hold.

5. **Keep one deterministic evaluator.** Update phase definitions in `web/src/journey.ts`, and have `web/src/scene.ts` consume the resulting approach/exit camera factor. Extract camera interpolation into a pure helper if needed for testing. Scroll direction must not select different paths. Update review phase labels and the tests that currently look for `close`, `pullback` or `depart`. No Blender geometry, materials, textures or GLB exports need changing for this fix.

## Verification and completion criteria

- First verify the entire Intro → Hack Atlantic stop → next travel, then apply the same route to the remaining stations.
- Sample approach and exit densely, including both sides of the old phase boundaries. View width must move toward its target without an intermediate wide excursion; holds must keep an identical camera pose.
- Check position, quaternion rotation and view width at every join, plus exact agreement with the incoming/outgoing travel boundary. Continue checking laptop position, lid, scale and station visibility.
- Inspect projected laptop size as well as camera width. Rotation and lid movement affect visible size, so a smooth width curve alone is insufficient. Review before/after captures for any remaining apparent zoom reversal.
- Verify forward scrolling, reverse scrolling, direct seeks, refresh, resize and station links produce the same poses. Confirm the résumé feed and Contact links retain their current behavior.
- Review desktop and portrait layouts. Hack Atlantic must still crop a standee at each edge in the close-up; Ultra Maritime and Projects must still end straight-on; Formula SAE must still show the car; Resume and Contact must still end overhead.
- Run the timeline/asset tests, browser regression checks and production build. Add a regression that fails on the old wide-camera detours, then save updated browser captures and results.

The fix is complete when each table stop has one intentional move into its focus view, a stable hold and one intentional exit, with no extra wide-to-close cycle while the laptop is resting on the table.


## Implementation notes

- `journey.ts` now uses one approach and one exit. `camera.ts` evaluates the direct travel-boundary/focus path, including responsive framing.
- At the three straight-on laptop stops, camera progress follows 75% of the docking curve and 25% of the full-phase curve. This preserves smooth movement through the former phase boundary and avoids an apparent shrink as the laptop turns. Formula SAE and the overhead stops retain the ordinary full-phase camera curve.
- `hero.ts` restores all three baked animation tracks before each dock blend. This fixes accumulation when repeated frames share the same animation time, including departure after a hold.
- Programmatic seeks use the browser's actual rounded scroll position. Refresh saves the latest progress before navigation, including rapid seeks.
- The fix changes browser motion and tests; it does not require editing Blender geometry or materials.

Validation: production build passes; all 26 current automated tests pass. Chrome 154.0.8037.93 passed 252 station camera samples across 1440×960 and 390×844 layouts, 42 travel samples, forward/reverse/repeated seeks, stable holds, preserved paper timing, refresh/resize restoration and loading recovery. The three straight-on stations pass the projected-width check: no intermediate sample falls more than 2% below the smaller endpoint. Physical phone and other-browser testing remain outside this local verification. Results: `exports/web/camera-fix-browser-validation.json`; captures: `web/test-results/camera-fix/`.
