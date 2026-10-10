# Responsive name / Hack Atlantic clearance

Status: implemented on 10 October 2026.

The screenshot shows the Hack Atlantic frame obscuring the lower-right portion of MANUEL. `WorkspaceScene.syncTitle()` sizes the name to 46% of viewport width on desktop and 86% below 760 px, with a fixed mobile top offset. It never measures the poster, so those independent layouts can overlap. The abrupt size change at 760 px also needs coverage.

## Proposed fix

1. Measure the screen-space bounds of the full `Root_scroll_frame`, including its wooden bars and hanging hardware, using the overview camera. Measure the name's actual painted area using its existing `inkBounds`, rather than transparent texture margins.
2. Reserve a gap around the poster: start with 24 px on desktop/tablet and 16 px on phones. Keep the existing large, upper-left name where it fits.
3. On narrower screens, fit both lines of the name into the clear area above the poster. Move the name upward within safe margins first, then reduce its size proportionally until the actual projected ink clears the poster and viewport edges. Use available projected space, not a single mobile width breakpoint. Preserve both lines and their proportions.
4. Project the chosen layout onto the wall and remeasure the result. Account for camera perspective; do not assume two unprojected corners guarantee the intended screen-space rectangle. Keep the poster's physical placement and interaction target consistent.
5. Recalculate on initial overview, resize/orientation changes, and return from a section, using the canonical overview camera. Avoid changing the wall lettering during a zoom transition.

## Verification

Extend `web/scripts/verify-overview.mjs` to assert a visible gap between projected name ink and the complete poster bounds, as well as viewport containment. Cover 320×568, 390×844, 430×932, 768×1024, 1024×768, 1256×1010 (near the supplied screenshot), 1440×960, and phone landscape. Include widths immediately below and above 760 px and resizing while a section is open, followed by returning to the desk.

Capture comparison screenshots; check that the name remains prominent and readable, labels stay clear, and Hack Atlantic still opens and returns correctly. Run the production build and existing responsive navigation checks.


## Result

`syncTitle()` now uses the canonical overview camera to measure the full poster and actual name ink, preserves the texture proportions, corrects perspective skew, and fits the name with 16 px mobile / 24 px larger-screen clearance. The preferred width changes smoothly with viewport aspect ratio. Resizing within a detail view uses the overview camera so returning remains consistent.

`web/scripts/verify-name-clearance.mjs` passed at all 11 viewport sizes, including 759/760/761 px and a resize inside Hack Atlantic before returning. Screenshots and measured bounds are in `web/test-results/name-clearance/`. Production build passed.
