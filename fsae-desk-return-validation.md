# FSAE return and Projects desk validation

Implemented 3 October 2026.

## Delivered

Data logging returns through the behind-seat location to the full Formula car, then backs out through the original FSAE monitor. The camera reveals the workstation, travels to the existing separate Projects desk, and enters its unchanged ultrawide display and Projects reel. The old Pi push-in and blackout route are retired.

The Projects desk has PERSONAL above PROJECTS as physical 3D lettering at the rear-left, a 61-key 60% mechanical keyboard, and a mouse to the keyboard’s right. Existing desk, monitor, and screen transforms remain unchanged. The editable Blender title and idempotent generator are saved with the canonical source; pre-change source and exports are backed up under `backups/fsae-desk-return`.

## Geometry and rendering

Added geometry totals 14,364 triangles: title 4,548; keyboard 6,804; legends 2,160; mouse 852. The props are consolidated for export and require no added image textures. The Projects GLB is approximately 2.49 MB. Export uses GLB, +Y up, physical meter scale. `exports/station-reorder/projects-props-report.json` records the measured bounds, key count, and budgets. Tests verify tabletop contact, rear-left title placement, and unchanged monitor geometry and origins.

The FSAE heading is restored during the outgoing overview and composited into its monitor preview. The compositing plane sits inside its camera’s clipping range, and repaint restores opacity immediately after a scene reload or viewport change. This fixes the heading flicker found during browser regression without changing its content or design.

## Checks

- Production build passed.
- All 67 unit and asset tests passed, including the new reverse-route, camera-boundary, original-layout, and prop-placement checks.
- Targeted browser checks passed at 1200×900, 390×844, and 2040×1134 for the return, desk arrival, monitor entry, reverse/direct seeks, resize, and failed Pi/Projects model downloads.
- Across the live-car/monitor scene substitution, mean channel differences were 0.794, 0.851, and 0.882 on a 0–255 scale. The two renderings keep the same composition; minor differences arise from render-target filtering.
- Desk travel to monitor-entry boundary had zero pixel difference at all three sizes.
- Final desk screenshots, handoff screenshots, browser measurements, and the forward/reverse recording are in `web/test-results/desk-return`.

Animated journey regression passed on desktop and phone: 101 forward/reverse samples each, arbitrary seeks, camera joins, original FSAE entrance, unchanged reel card centers, Resume handoff, historic hashes, refresh/resize restoration, keyboard printing, and five notebook links. The final reduced-motion check initially expected the obsolete still crossfade; the site already uses normal document flow for project reading sections. Updated that assertion without changing reduced-motion behavior and ran the remaining fallback checks separately; normal-flow stills, the new Projects poster, WebGL fallback, asset retry, and hero-load fallback passed. Evidence is in `web/test-results/station-reorder/`, with the separate fallback receipt in `fallback-report.json`.


## Desk separation correction — 3 October 2026

Per the follow-up request, the Projects desk now occupies a distinct location rather than sitting alongside the workstation. Its complete assembly moved from runtime origin `[6, 0, 0]` to `[9, 0, -2.5]`; the title, keyboard, mouse, monitor, and camera/screen anchors move together. The original workstation remains unchanged. The camera widens over the gap and settles into the same Projects arrival composition. Lighting follows the travel continuously. This supersedes the earlier requirement to preserve the Projects desk world position; internal prop placement and screen content remain unchanged.

Source generator and exported/runtime metadata agree. Production build and 17 targeted camera/route/reel tests passed. Desktop and phone captures in `web/test-results/desk-separation` show the physical gap and isolated Projects arrival, with no browser runtime errors.
