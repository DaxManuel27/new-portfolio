# Pi zoom → inside the wide monitor → Projects

Status: revised on 3 October 2026. The processor-screen portal is superseded by the blackout transition described below. Earlier sections are historical design context.

## Experience

Start at the existing Pi 5 reading section. On continued scrolling, fade the text, centre the Pi, and push into its main processor. The processor surface becomes the visual doorway into the wide monitor's display. The Projects content appears through that surface and expands until the viewer is inside the display, where the existing Projects reel takes over.

The intended destination is the wide monitor's screen content. Do not return to the car or stop at a distant view of the physical monitor. A brief glimpse of the curved screen edge during the reveal can establish the monitor, but the movement should continue inward throughout, without a pullback or a second zoom sequence.

## Proposed scroll choreography

Replace the current data return, car exit, car-to-monitor transfer, monitor approach, monitor hold, and monitor screen zoom with one `pi-monitor-entry` phase. Start with a 1.5-viewport scroll budget and tune after visual review.

| Progress | Visible action |
| --- | --- |
| 0–15% | Fade the Pi text; smoothly centre the board from its desktop/right or mobile/upper composition. |
| 15–60% | Rotate toward the processor face and zoom into it. Board geometry remains visible around the target so the movement reads as entering the Pi. |
| 60–85% | Reveal the wide monitor's first Projects frame within the processor surface. Expand that reveal as the camera keeps moving inward. |
| 85–100% | Resolve onto the monitor display, match its crop to the full-screen Projects frame, then complete the handoff to the live reel. |

These are overlapping parts of one movement, not separate holds. Do not wait for a time-based animation to finish. Pausing scrolling freezes the composition; reversing retraces it exactly.

The current route spends 4.6 units between the end of the Pi hold and the reel. Replacing those phases with 1.5 reduces the current total from 26.1 to approximately 23.0 units, subject to final pacing.

## Processor target and Blender preparation

1. Inspect the Pi source and identify the main processor's exposed top face from the official model. Do not choose a connector or assume the board origin is the processor centre.
2. Add a named `Pi_ProjectsPortal` anchor with centre, surface normal, up direction, and face dimensions in the exported Pi model's local coordinate system.
3. Export the anchor metadata alongside the existing FSAE detail data. Keep geometry and pose measurements reproducible through `blender/build_fsae_details.py` and `web/scripts/prepare-fsae-details.mjs`.
4. If the optimized Pi mesh has merged component names, measure the target in the editable source and export an empty/metadata record before optimization. Preserve that record explicitly.
5. Keep this portal a website presentation effect; it does not represent a real screen on the hardware. No new physical Pi or monitor model is required.

## Camera design

- Begin at the exact existing `detailPose` for the current viewport. Position, orientation, framing, model scale, and opacity must agree with the end of `data-hold`.
- Interpolate both camera position and look target toward the processor. Ease the board toward a readable, near-front-on view before the extreme close-up.
- With the current orthographic renderer, reducing view width supplies the apparent zoom; translating the camera alone will not magnify the board. Use a smooth, monotonic width curve once the initial centring is complete.
- Stop the Pi camera above the processor surface. Use screen coverage to complete the portal transition rather than moving through the mesh and showing its underside or clipping artifacts.
- Define the destination using the real curved wide-monitor display and its existing screen metadata. Its entry pose is already close to the display, not the monitor's wide exterior pose.
- Keep any coordinate-space change hidden behind the same rendered Projects image. Never interpolate the camera through the empty world space between the isolated Pi and the monitor.

## Portal rendering and screen match

1. Pre-render the existing first Projects frame through the current reel preview system. Reuse its layout, typography, gradients, and responsive crop; do not create a separate imitation screenshot.
2. Map that preview onto a small plane/mask aligned with the processor face, slightly offset to avoid z-fighting. Introduce it only late in the zoom so the original chip remains recognizable first.
3. Grow the preview's screen coverage with the zoom. Keep it clipped to the processor during the initial reveal, then use a full-screen compositing pass once the surface covers the viewport.
4. At full coverage, switch to the wide monitor's tightly framed display using the identical preview. Its curved geometry and chord-uniform UV mapping need explicit crop validation against the portal image.
5. Complete the existing display-to-live-reel technique: first card position, colour, scale, and text must match at the substitution. The live reel starts at progress zero and does not advance while the portal is still entering.
6. If a visible curved edge makes the match less clean, shorten that reveal and favour the uninterrupted forward movement. Do not introduce a zoom-out to show the whole monitor.

Keep the portal texture owned by one renderer subsystem. The monitor and Pi may share it; neither material may dispose it while the other is using it. Hide the Pi portal from any scene pass that would sample its own render target, and restore renderer state after off-screen rendering.

## Code changes

### Journey and camera

- `web/src/journey.ts`: replace `data-return`, FSAE `exit`, Projects `transfer`, `approach`, `hold`, and `screen-zoom` with `pi-monitor-entry` followed by the existing `reel`. Other stations and the reel-to-desk handoff keep their behaviour.
- Assign the entry phase to station 4 and explicitly support both its Pi and monitor resources. Do not rely solely on the station number for subject visibility or light placement.
- `web/src/fsae-focus.ts`: remove the now-unused Pi return path. Keep data approach and hold; expose the Pi visibility/text state needed during monitor entry.
- Add `web/src/pi-monitor-transition.ts` for pure progress evaluation: Pi camera pose, portal reveal, monitor reveal, preview crop, and live-reel handoff state.
- `web/src/camera.ts`: evaluate the new entry phase before generic station camera logic; remove the replaced car-to-monitor path. Keep the reel camera endpoint unchanged.

### Scene and presentation

- `web/src/scene.ts`: add the processor-aligned portal, share the Projects preview, control both subject groups and their lighting explicitly, and remove obsolete FSAE-exit/monitor-approach visibility branches.
- `web/src/main.ts`: fade the one Pi text panel at entry, preload and paint the first Projects frame before it becomes visible, and reveal the live reel only at the matching boundary.
- `web/src/reel-preview.ts`: reuse the existing painter and crop calculations. Add an explicit portal crop only if the chip's aspect ratio requires it.
- `web/src/types.ts`: add the measured Pi portal frame to the manifest schema.
- Do not bring back the FSAE car title, callout, or component buttons during this transition.
- Keep `#fsae-data-logging` landing on the Pi reading section and `#projects` landing on the first live reel card. Update saved-progress handling and duration checks for the shorter journey.

## Loading, responsive layout, and reduced motion

- Prefetch the monitor, first Projects preview, and required fonts during the Pi reading section. Avoid reallocating a large render target on every scroll event.
- Size preview textures to screen needs with an upper limit appropriate to the renderer; reuse them until viewport or content changes.
- Recalculate the processor projection, monitor crop, and portal coverage on resize. Desktop, portrait, and ultrawide viewports must reach full coverage without borders.
- Direct seeking into the entry phase must produce the correct state without previously visiting the car or Pi.
- If the Pi model fails to load, retain its existing poster/text fallback, then transition from that poster into the Projects preview. If the monitor model fails, resolve directly to the live Projects reel. Do not leave a blank screen waiting for an asset.
- Reduced motion retains the existing normal document flow: data logging followed by Projects, without the extreme zoom. No new buttons are required.

## Implementation order

1. Inspect and export the processor anchor; verify its location on the Pi visually.
2. Implement the pure transition evaluator and new phase order, leaving the old branch available locally until endpoint checks pass.
3. Add the Pi portal using the existing first Projects preview.
4. Match the monitor crop and live reel handoff; validate forward and reverse motion.
5. Remove obsolete phases, visibility logic, and return-path tests once the replacement works.
6. Update documentation and capture the final desktop/phone sequence.

## Acceptance checks

- The transition begins at the existing Pi composition with no jump.
- The processor is visibly the zoom target, and the move continues inward until Projects appears.
- No return to the car, wide-monitor pullback, empty-world travel, second zoom, or extra hold occurs.
- The preview and first live card match at handoff: no flash, black gap, border, doubled text, or crop change.
- The car title and data-logging text do not linger over Projects.
- Reverse scroll, rapid scrubbing, direct seeks, reload, and resize remain deterministic.
- Verify desktop 1200×900, portrait 390×844, and wide 2040×1134, including frames immediately before and after each scene substitution.
- Test delayed/failed asset loading, reduced motion, and both supported hashes.
- Tests cover phase order/duration, endpoint continuity, portal coverage, crop agreement, and live-reel progress. Run the production build and existing regression suite after integration.

## Review deliverable

A local preview plus a short forward/reverse capture showing Pi hold → processor zoom → wide-monitor display → first Projects card. Update this document with final timing and verification results after implementation.

## Implementation receipt — 3 October 2026

- One 1.5-unit `pi-monitor-entry` phase replaces the six exit/approach phases. Journey total is 23.0 units; Projects cards and the later desk handoff keep their existing timing.
- Measured the processor metal lid in the editable Pi CAD mesh and saved `Pi_ProjectsPortal` in the Pi Blender source. Geometry is unchanged. Anchor metadata is exported through `blender/pi_projects_portal.py`, invoked by the detail authoring pipeline, and distributed in the journey manifest.
- The camera centres and turns toward the lid, then narrows its orthographic view. A processor-aligned portal shows a live rendering of the actual curved monitor. Its surface covers the viewport at 74% before changing camera spaces. The monitor advances slightly inward and matches the live reel at 94%; the final 6% hands over to the DOM.
- A dedicated render target is isolated from the portal itself, preventing feedback. Monitor and portal use the same painted first Projects frame. Text fades during the first 15%; car/title never return.
- Pi loading failures retain the poster early in the transition. A missing monitor uses the matching flat Projects preview. Normal document flow is retained for reduced motion.
- Production build passed; 66 automated tests passed. Browser verification covered desktop 1200×900, portrait 390×844, and wide 2040×1134; forward/reverse scrubbing, resize, old hashes, reduced motion, and failed Pi/monitor downloads passed. No browser runtime errors.
- Average RGB difference across the portal camera substitution was 0.57–0.67 on a 0–255 scale. Monitor-to-live-reel differences were 0.73–1.37, including text rasterization differences.
- Captures, the machine-readable validation report, and the WebGL forward/reverse recording are in `web/test-results/pi-monitor/`. Recording: `forward-reverse.webm` (canvas capture; DOM text/UI are not included).
- Existing production bundle-size advisory remains. Real-device performance benchmarking has not been performed.

## Revised transition: processor zoom → blackout → monitor zoom

Per user correction, no Projects image appears on the Pi. Removed the processor plane and its live monitor render target. The measured processor anchor is retained solely as a camera target.

The camera zooms into the processor during the first 46% of the transition. Black fades in from 30–44%, remains fully opaque through 54%, and fades out by 67%. The scene switches at 49%, entirely behind black. The wide monitor is then revealed while the camera zooms from its exterior wide pose toward the display, reaching the matched Projects frame at 94%. The final handoff to the reel is unchanged. All motion and blackout opacity derive from scroll position, including reverse scrolling.

Validation: production build and 17 relevant camera/transition/reel tests passed. Browser verification checks a fully black scene substitution, monitor-to-reel matching, reverse movement, resize, and asset failures. The transition recording is regenerated by verify-pi-monitor.mjs.

Browser validation passed at desktop, phone, and wide desktop sizes. Both sides of the scene switch are completely black with zero pixel difference. Reverse scrolling, resizing, and missing-model fallbacks passed; the forward/reverse recording has been regenerated.
