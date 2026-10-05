# FSAE focused sections — implementation receipt

Implemented October 2, 2026 (America/Moncton).

## Delivered

- Six deterministic scroll phases: data focus/hold/return, then pedal focus/hold/return. Total journey length is now 28.8 units; station IDs and the existing Projects reel remain unchanged.
- A camera approach toward each existing conceptual anchor, followed by a fade through black into an isolated, readable project presentation. Camera substitution occurs only while both subjects are invisible. Reverse scroll follows the same state function.
- Separate HTML reading panels, two information beats per project, direct section links, and return to the original car overview/ultrawide transfer.
- Pi 5 converted from Raspberry Pi Ltd's official STEP archive, which contains an explicit MIT licence. Original archive, STEP, licence and checksum are retained in assets/models/raspberry-pi-5. Converted and optimized in Blender at physical scale.
- Pi: 64,607 triangles, seven materials, approximately 1.07 MB compressed. Representative pedal mechanism: 2,688 triangles, four materials, 39 KB compressed.
- Editable Blender files: blender/raspberry-pi-5.blend and blender/pedal-sensor.blend. Authoring/conversion: blender/convert_pi_step.py and blender/build_fsae_details.py. Website export: web/scripts/prepare-fsae-details.mjs, invoked by the existing asset preparation pipeline when detail sources exist.
- Pi licence distributed with browser, export and Blender assets. CAD copyright also embedded in the optimized GLB metadata.
- Matching rendered fallback posters. A failed detail download leaves the text and poster available. Reduced-motion sections appear in normal document order after the FSAE overview.
- Details are prefetched at the Workstation, excluded from the live monitor portal, and disposed when the renderer is disposed.

## Verification

- 56 automated tests passed, including existing camera joins, workstation spin/clearance and Hack Atlantic banner clearance.
- New tests cover section order, added timing, exact forward/reverse visibility, invisible camera substitution, actual exported geometry fitting the desktop/portrait/ultrawide presentation regions, physical board scale, poster presence and distributed licence.
- Browser checks passed for direct hashes, project navigation, forward/reverse seeks, hidden detail UI outside the sections, reduced-motion content and simulated Pi-download failure.
- Desktop 1200×900 and phone 390×844 captures reviewed. Automated geometry framing also covers 2040×1134 and 3:1 aspect ratios. Captures: web/test-results/fsae-details.
- Production build passed. Existing large-JavaScript-bundle advisory remains. Real-device frame-rate benchmarking has not been performed.

## Content and modelling limits

The user has been asked for project role, logger interfaces/software/results and the actual pedal sensor. No such details were supplied during this implementation. Public text is intentionally descriptive, with no invented results. The pedal assembly and car anchor locations are labelled representative/conceptual. Replace the text in web/src/fsae-projects.ts and the pedal illustration when verified references are available.

The official source used here excludes silkscreen graphics. Major board geometry, connectors and components are retained; materials were simplified for browser delivery. This is an appearance model, not manufacturing data.

## Preview

- http://127.0.0.1:5173/#fsae-data-logging
- http://127.0.0.1:5173/#fsae-pedal-sensor

## Intentional component approaches — 3 October 2026

- Logger route arcs around the back of the seat and targets the Pi at that location. Seat stays visible for context.
- Pedal route rotates behind the driver, enters the cockpit, and moves forward into the footwell. Obstructing seat, harness and body panels fade during the approach.
- Detail models appear at their in-car anchors before transitioning to the focused presentation. Callout connectors now point to those anchors.
- Each component has one stable text panel throughout its reading section; no rotating text beats.
- Approach durations increased to 1.1 and 1.4 scroll units respectively; total journey is 29.7 units. Camera routes and anchors are reproducible through blender/fsae_focus_routes.py and asset preparation.
- Production build and all 56 tests passed. Desktop and phone route captures reviewed in web/test-results/fsae-routes; no browser runtime errors.
- These regions follow the user's placement guidance; exact mounting hardware and pedal design remain representative.

## Direct logger-to-pedal transition — 3 October 2026

Replaced the separate data return and pedal approach with one 1.4-unit component transfer. The camera briefly returns to the behind-seat installation, moves directly through the cockpit into the footwell, then enters the pedal presentation. It never returns to the full-car overview between these projects. Both in-car models remain visible during the connecting move; the seat fades to clear the path. Single reading panels and reverse-scroll behaviour are preserved. Total journey is now 29.1 units.

Production build passed, all 61 current tests passed, and desktop/phone captures in web/test-results/fsae-transfer show the close transition without runtime errors.

## Pedal project removed — 3 October 2026

This revision supersedes the earlier two-component flow. FSAE now contains only Data logging and the Raspberry Pi 5. Removed pedal text, scene detail, label/connector/anchor nodes, camera routes, focus/hold/return phases, poster and shipped GLBs. Active source generators now produce only the logger. Pedal source and pre-change scene/export are retained in backups/fsae-pedal-removal.

Added a 0.6-unit data return before the existing exit; journey is 26.1 units. The return follows the logger approach in reverse. Camera target interpolation keeps the car in view while turning to/from the rear. Old pedal hashes redirect to the FSAE overview. No component navigation buttons were added.

Saved the Blender source, exported the cleaned car, refreshed car and workstation fallback stills, and removed stale pedal exports. Browser checks passed for the sole article, absence of pedal requests, old-hash redirect, Projects/reverse navigation, reduced motion, and failed Pi downloads. All 64 automated tests passed; after the camera-aim refinement the 16 relevant camera/FSAE tests passed again. Desktop and phone route captures reviewed. Production build passed.

## Pi-to-monitor exit — 3 October 2026

The return-to-car exit is superseded by the implemented processor portal in fsae-pi-monitor-transition-plan.md. The Pi zooms directly into the wide-monitor display and then the Projects reel. Journey total: 23.0 units. Production build, 66 tests, and browser/fallback checks passed.


## Pi zoom with blackout — 3 October 2026

Supersedes the processor portal above: no screen content appears on the Pi. Zoom into the processor, fade fully to black, switch to the wide-monitor exterior pose while hidden, then reveal and zoom into the monitor before the Projects reel.

Production build and 17 relevant automated tests passed. Browser checks passed at 1200×900, 390×844, and 2040×1134, including full black coverage at the scene switch (zero pixel difference), reverse scrolling, resize, and missing Pi/monitor assets. Updated forward/reverse recording: web/test-results/pi-monitor/forward-reverse.webm.


## Return through FSAE monitor and separate Projects desk — 3 October 2026

Supersedes the Pi blackout transition. Data logging returns to the car, pulls out through the FSAE monitor, and travels to the original separate Projects desk. Added two-line PERSONAL PROJECTS text at the rear-left, a 60% mechanical keyboard, and mouse. Existing monitors, desk placements, screen contents, reel, Resume, and Contact are preserved. Production build and 67 unit/asset tests passed; animated journey and fallback browser checks passed. See `fsae-desk-return-validation.md` for evidence and `fsae-return-and-three-monitor-plan.md` for the implemented plan.
