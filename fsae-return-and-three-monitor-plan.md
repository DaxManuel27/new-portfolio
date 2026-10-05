# FSAE return to the separate Projects desk

Status: implemented — 3 October 2026. Implementation and validation notes are recorded below.
 
This plan supersedes thePi-to-monitor transition in `fsae-pi-monitor-transition-plan.md`. Its scope is limited to the exit after Data logging, camera travel to the ultrawide on its existing separate desk, and three additions to that desk: physical 3D text reading **PERSONAL PROJECTS**, a 60% mechanical keyboard, and a mouse. The earlier three-monitor workstation proposal is superseded. All current screen content and the remainder of the experience stay the same. The filename is retained so existing links to this plan continue to work.

## Intended experience

**Data logging / Raspberry Pi → pull back to the Formula car → pull back out of the FSAE monitor → travel to the separate Projects desk → reveal PERSONAL PROJECTS in 3D → zoom into the ultrawide → existing Projects screen and reel.**

1. Finish the existing Data logging reading section. As scrolling continues, its single text panel fades away and the camera returns from the Pi presentation to the logger location behind the driver's seat.
2. Continue backing away until the existing full Formula car composition is visible. Restore any bodywork hidden during the component approach. Give the car a short, readable moment within the moving transition; do not add another content section.
3. Pull back from that same car composition to reveal it inside the existing FSAE monitor. The monitor bezel and workstation emerge around the car image as the camera retreats. The car stays registered with its screen image during this transfer.
4. Move from the workstation to the ultrawide on its existing separate desk. Frame the monitor and physical **PERSONAL PROJECTS** lettering together as the camera arrives. Keep the lettering readable during the beginning of the zoom, then let it naturally leave the frame as the monitor screen fills the view. Use the existing screen-entry treatment to reach Projects.
5. Continue the exact existing Projects reel, then the existing Resume and Contact experience.

The previous Pi processor push-in, blackout, and direct jump to the Projects monitor are removed from this route. The new transition is scroll-driven and reversible, with no new buttons or effects. The only new copy is the requested physical desk title, **PERSONAL PROJECTS**. The only new desk props are a 60% mechanical keyboard and a mouse.

## Scope boundaries

| Area | Planned treatment |
| --- | --- |
| Intro and Hack Atlantic | Preserve all content, camera motion, and laptop animation. |
| Workstation entry and original two monitors | Preserve their placement, screen content, and existing camera beats. Keep the original two-monitor arrangement. |
| FSAE entrance, car, and Data logging | Preserve the current content, models, labels, behind-seat approach, Pi presentation, and reading duration. Add only the return after the reading section. |
| Ultrawide | Keep the existing separate desk and monitor placement. Preserve dimensions, curve, materials, screen mapping, and Projects content. Add the requested two-line desk lettering, 60% mechanical keyboard, and mouse. |
| Projects | Preserve cards, order, copy, typography, behavior, and reading duration. Adjust only its incoming camera route; show the new desk title during the approach and initial zoom. |
| Resume and Contact | Preserve appearance, timing within their phases, printer behavior, and links. |

Do not reintroduce the accelerator pedal, diagram boxes, or component-navigation buttons. Do not redesign the desk, move the original monitor pair, change lighting, or replace screen artwork. Adding return travel changes total scroll length and later absolute scroll offsets; it must not change unrelated phase durations or content.

## Projects desk, 3D title, keyboard, and mouse in Blender

Production brief: preserve the two existing desk setups and add the physical text, a 60% mechanical keyboard, and a mouse to the Projects desk. Retain the current scene style, scale, materials, and GLB delivery. No monitor relocation, new furniture, or screen-artwork changes are required.

Layout: the original workstation retains its Ultra Maritime and FSAE monitors. The ultrawide remains on its existing separate Projects desk, at its current position and orientation.

- Back up the canonical Blender file and affected exports. Inspect the actual desk, monitor stand, and other prop bounds through Blender MCP before choosing the title placement.
- Create a text object with the exact uppercase wording **PERSONAL PROJECTS**. Use the existing site heading typeface where available, with a simple restrained extrusion and small bevel. Use a warm off-white material consistent with the site's existing text; avoid glow or new lighting.
- Place the title at the **top-left of the Projects tabletop**, interpreted as the rear-left area when looking at the desk from the front, not the top-left of the browser viewport. Use exactly two left-aligned lines with an intentional line break:

  ```text
  PERSONAL
  PROJECTS
  ```

- Use a shared left edge, consistent letter sizing, and enough vertical separation for both lines to read clearly. Stand the title on the tabletop facing the arriving camera; keep its footprint in that rear-left zone and both lines clear of the monitor housing and screen. Determine exact size, line spacing, and placement from measured clearance and desktop/phone framing. Do not reflow it to one line or move existing furniture or props to make room.
- The title must be genuine scene geometry with depth, perspective, and existing scene lighting. It must not be a floating HTML heading, screen texture, or camera-attached overlay.
- Keep the title stationary. Make it readable through camera composition and the start of the monitor zoom, without a separate title animation, reading section, or change to the Projects reel typography. As the camera enters the display, the desk and letters naturally move out of view.
- Retain an editable source text object in the Blender file and export a mesh representation with a stable name such as `Text_PersonalProjects`. Ensure the source text and exported mesh are not both rendered. Target no more than 10,000 added triangles, one material, and no new image textures.
- Preserve `Screen_Ultrawide_Projects`, its UVs, curvature, world transform, and existing screen metadata. Export the added title, keyboard, and mouse geometry and necessary new camera/target anchors with the affected station asset. Update its fallback poster to include all three additions.
- Keep generation idempotent: rebuilding updates the same named text, keyboard, and mouse objects rather than duplicating them. Existing unrelated assets and workstation exports must remain unchanged.

### 60% mechanical keyboard and mouse

- Add a compact **60% mechanical keyboard** on the tabletop in front of the ultrawide, centered on the monitor where existing clear space permits. Use a conventional staggered layout of roughly 61 keys, with a number row and mechanical keycap profiles. Omit the numpad, dedicated function row, and separate navigation/arrow clusters so the silhouette clearly reads as 60%.
- Model a shallow keyboard case, individually readable raised keycaps, a spacebar, and the larger modifier keys. Keep realistic proportions and a slight typing incline. Use a restrained dark case and keycaps consistent with the current desk styling; no RGB effects, logos, or new branding.
- Place a simple unbranded mouse to the keyboard's right with a comfortable visible gap. Include a rounded shell, left/right button separation, and a scroll wheel. Keep its finish consistent with the keyboard. Do not add a mouse pad, cables, or other accessories beyond the requested props.
- Place both props with their feet/base resting on the tabletop and no intersection with the monitor stand, desk title, or existing objects. Keep **PERSONAL / PROJECTS** in the rear-left zone and leave the screen unobstructed.
- Keep both props static and decorative: no input handling, clicking, key animations, or interaction prompts. They naturally leave the frame with the desk as the camera zooms into the monitor.
- Author editable Blender objects with stable names such as `Projects_Keyboard_60` and `Projects_Mouse`. Reuse keycap geometry where practical. Target at most 20,000 added keyboard triangles and 5,000 mouse triangles, with up to three shared prop materials and no new image textures. Together with the text, the initial added geometry budget is at most 35,000 triangles; verify exported counts and browser performance.
- Preserve all original desk and monitor transforms. Choose the size and placement of the new props together with the two-line title so everything fits without changing existing furniture.

## Camera and rendering implementation

### 1. Return from Data logging to the car

Add a `data-return` phase immediately after `data-hold`. Reuse the existing behind-seat approach in reverse, including its component-to-car visual handoff. The Pi reading pose must match the first return frame exactly, and the return must end at the same responsive car overview used by the FSAE monitor preview.

Restore car visibility and cutaway state as the camera leaves the logger location. Fade the Data logging article once at the start of the return; do not replay an article or add a second text section. Evaluate all transforms and opacities from scroll position, including direct jumps and reverse scrolling.

### 2. Exit through the FSAE screen

Add a `car-monitor-return` phase after the car return. Reverse the established FSAE screen-entry mapping rather than interpolating through the physical distance between the remote car scene and workstation.

At the start, the live car occupies the viewport. Match the car render on the monitor to that exact composition and perform the scene substitution while the screen still covers the entire viewport. Then pull the camera away to expose the bezel and surrounding workstation. Update `carPreviewPose` and render-target framing for the outgoing direction so no crop, title, aspect-ratio, color, or scale jump appears. Keep the current car title and plain label presentation.

The existing entrance uses `SCREEN_FILL`, `SCREEN_SWAP`, `screenZoom`, and `carPreviewPose` in `web/src/camera.ts`. Reuse their geometry and matching rules, with explicit outgoing progress, rather than assuming the incoming scene-visibility branch will work unchanged in reverse.

### 3. Travel to the separate Projects desk

Add a `projects-desk-travel` phase from the end of the FSAE pullback to a Projects desk arrival pose. Begin at the exact outgoing workstation camera pose, move through clear space between the existing desks, and settle toward the ultrawide. Use measured scene bounds to avoid clipping the monitor housings or desk edges. Keep both station groups available wherever either can enter the view; do not move the furniture to fit the route.

At arrival, frame the ultrawide and **PERSONAL PROJECTS** together. On portrait screens, increase camera framing width/distance as appropriate to keep the whole phrase legible rather than cropping or rearranging the physical text. The two original monitors retain their existing content; the ultrawide retains the existing Projects first-frame preview.

Add a `projects-monitor-entry` phase that starts at this same arrival pose and moves into the existing ultrawide screen. During the opening part of the zoom, keep the desk title readable; then allow it to pass below the frame naturally as the screen fills the viewport. Reuse the current preview painting and screen-fill calculations to hand off to the unchanged live Projects reel. Do not add a full-screen title or another stop between the desk and reel.

Preserve the existing reel-to-Resume handoff. Its underlying hidden scene camera can still use its existing pose while the full-screen reel covers it. The added text must belong to the Projects station so it cannot leak into the later printer or Contact scene.

### 4. Loading, visibility, and cleanup

- Preload the workstation and existing Projects desk, including its title, keyboard, and mouse, before their return reveal. Keep the car available for its live screen preview during the pullback.
- Keep both desks rendered during the inter-desk camera travel wherever visible, then retire the departed station only when out of view. Preserve earlier workstation cameras and visibility behavior.
- Preserve the current laptop lifecycle. Do not introduce another laptop flight or reappearance as part of this change.
- Remove the obsolete `pi-monitor-entry` camera branch and its Pi blackout overlay once the new path is wired. Remove only helpers, tests, and fields that have no remaining consumer; retain unrelated transition rendering.
- Update phase consumers, hashes, progress calculations, posters, reduced-motion and failed-download paths to reflect the new sequence. Use existing fallback conventions and preserve all current content; include the new desk title in the Projects fallback still and provide its accessible text equivalent without a duplicate visible heading.

## Suggested pacing

Starting values for implementation review, in the current journey's approximate viewport-height units:

| New phase | Initial budget | End state |
| --- | ---: | --- |
| `data-return` | 1.1 | Existing full-car composition restored |
| `car-monitor-return` | 1.2 | FSAE screen visible within workstation |
| `projects-desk-travel` | 1.2 | Separate Projects desk, ultrawide, and 3D title framed together |
| `projects-monitor-entry` | 1.0 | Existing full-screen Projects reel |

These replace the current 1.5-unit `pi-monitor-entry`. Tune only these new phases after visual review. Preserve the current 1.8-unit Data logging hold, Projects reel duration, and all other existing durations.

## Expected files

| Files | Limited responsibility |
| --- | --- |
| `blender/portfolio-station-reorder.blend`, `blender/station_reorder.py` or a dedicated idempotent layout script | Add the two-line desk title, 60% keyboard, and mouse; preserve both desk layouts and export the new approach camera anchors. |
| `exports/station-reorder/layout.json`, affected GLBs/posters, `web/scripts/prepare-station-reorder.mjs`, `web/public/assets/journey.json` | Distribute the Projects title and peripheral assets/poster and camera metadata without changing monitor transforms or unrelated assets. |
| `web/src/journey.ts`, `web/src/types.ts` | Define the replacement phases and any necessary metadata. |
| `web/src/fsae-focus.ts`, `web/src/camera.ts` | Behind-seat return, reverse screen transfer, inter-desk travel and monitor entry. |
| `web/src/scene.ts` | Inter-desk visibility, title lifecycle, live car preview, loading and removal of obsolete Pi blackout behavior. |
| `web/src/pi-monitor-transition.ts` | Retire or replace the old transition; preserve shared calculations only where still needed. |
| `web/src/reel.ts` and phase-dependent UI/fallback consumers | Retarget the incoming Projects handoff without changing content or reel behavior. |
| Focused transition tests and review scripts | Verify new phase joins, geometry, forward/reverse behavior and preserved downstream behavior. |

## Implementation order

1. Record current monitor contents, existing camera endpoints, relevant asset transforms, and screenshots of unaffected sections. Back up affected source and exports.
2. Measure the existing Projects desk and add the two-line 3D title at the rear-left, the 60% mechanical keyboard in front of the monitor, and the mouse to its right. Verify clearance, tabletop contact, realistic scale, and title readability without moving existing props.
3. Export the title, keyboard, mouse, approach camera metadata, and updated Projects poster. Verify both existing desk layouts and monitor screen transforms remain unchanged.
4. Implement the Data logging return and matched FSAE screen pullback.
5. Implement travel between the desks, frame the title during arrival and early zoom, and reconnect to the current Projects screen-entry/reel handoff.
6. Remove the superseded Pi zoom/blackout route and update only affected fallback and phase consumers.
7. Run the checks below and record results. Keep unrelated changes outside the implementation diff.

## Acceptance checks

- Scrolling after Data logging shows the Pi receding to the behind-seat logger location, then the complete Formula car, then that car inside the FSAE monitor as the camera backs out.
- No Pi push-in, blackout interlude, screen-on-Pi effect, or direct jump from Pi to ultrawide remains in the normal route.
- The workstation retains its two original monitors. The ultrawide remains on its existing separate desk with the same shape, scale, position, and orientation. No existing furniture or props move.
- The exact phrase **PERSONAL PROJECTS** appears once as physical 3D lettering at the top-left/rear-left of the Projects tabletop, split into two left-aligned lines: **PERSONAL** above **PROJECTS**. Both lines are readable on desktop and phone during arrival and the start of the zoom. It has visible depth, does not intersect the stand or other props, exits the frame naturally, and does not appear in the Projects reel or later scenes.
- A recognizable 60% mechanical keyboard sits in front of the ultrawide, with a mouse to its right. There is no numpad, dedicated function row, or separate navigation cluster. Both props rest on the desk without overlap, remain static, and introduce no controls or effects.
- Ultra Maritime, FSAE, and Projects display exactly their existing content. The Projects reel, Resume, Contact, printer, and links behave as before.
- Both screen transfers preserve image registration on desktop, wide desktop, and portrait mobile. No borders inside the artwork, flashing frames, remote-scene flight, or abrupt camera changes.
- Forward, reverse, direct seeking, section hashes, refresh, and resize produce the same state at the same scroll position.
- Reduced motion and failed model downloads preserve access to the same information and downstream sections.
- Test phase ordering and boundary poses, outgoing car-preview alignment, unchanged monitor screen bounds, title and peripheral clearance, title visibility, and added geometry budgets, and the unchanged Projects-to-Resume handoff. Run the production build and existing relevant regressions.
- Review captures at five points of each new transition and a continuous forward/reverse recording at 1200×900, 390×844, and 2040×1134. Compare unaffected sections against their recorded baselines.

Delivery consists of the return route, camera travel to the existing separate Projects desk, and its new two-line 3D title, 60% mechanical keyboard, and mouse only, plus a short validation record. This document authorizes no broader visual or content redesign.


## Implementation record — 3 October 2026

- Replaced the Pi push-in/blackout route with `data-return` (1.1), `car-monitor-return` (1.2), `projects-desk-travel` (1.2), and `projects-monitor-entry` (1.0). The complete journey is now 26.0 scroll units. Existing reading and downstream phase durations are preserved.
- The outgoing car screen transfer reverses the existing entrance. The workstation remains rendered while its edge is still visible during the Projects approach. Both desks and monitor screen transforms remain in their original locations.
- Added editable Blender title source and exported two-line text at the rear-left, a 61-key mechanical keyboard, and a mouse. Generated by `blender/projects_desk_props.py`; the original source and affected assets are backed up under `backups/fsae-desk-return`.
- Added geometry: 4,548 title triangles, 6,804 keyboard triangles, 2,160 key legend triangles, and 852 mouse triangles (14,364 total). The updated Projects GLB is about 2.49 MB. Existing screen artwork and curved screen UVs are preserved.
- Camera arrival frames the title and peripherals; the title leaves the left edge naturally as the camera centers on the screen. The desk additions are also included in the updated fallback poster and accessible scene description.
- Archived the superseded Pi transition module and its tests with the backup. Added camera-join, reversed-route, geometry-budget, tabletop-placement, and preserved-monitor-layout tests.

Validation: production build and all 67 unit/asset tests passed. Route review and forward/reverse recording are in `web/test-results/desk-return/`. Final browser regression results are recorded in the accompanying validation document.


## Desk separation correction — 3 October 2026

Per the follow-up request, the Projects desk now occupies a distinct location rather than sitting alongside the workstation. Its complete assembly moved from runtime origin `[6, 0, 0]` to `[9, 0, -2.5]`; the title, keyboard, mouse, monitor, and camera/screen anchors move together. The original workstation remains unchanged. The camera widens over the gap and settles into the same Projects arrival composition. Lighting follows the travel continuously. This supersedes the earlier requirement to preserve the Projects desk world position; internal prop placement and screen content remain unchanged.

Source generator and exported/runtime metadata agree. Production build and 17 targeted camera/route/reel tests passed. Desktop and phone captures in `web/test-results/desk-separation` show the physical gap and isolated Projects arrival, with no browser runtime errors.
