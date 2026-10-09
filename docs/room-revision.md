> Historical Round 1 record. Superseded by [Round 2](room-round2.md), including restored content, typography, labels, lighting and the floor–wall fix.

# Portfolio room revision — 9 October 2026

The active plain Three.js workspace now includes a deep green room, 14 cm walnut floor planks, baseboard, warm desk lamp, physical wall lettering, a linen Hack Atlantic scroll frame, an About laptop screen, and shared labels. The original desk GLB and its notebook, car, contact and résumé controllers remain the source of the existing interactions.

## Behavior and content

- The wall name uses the site's actual bundled Cormorant font on a depth-tested plane attached to the wall. Plant leaves sit in front of the lettering. Phone layouts use the HTML name and a compact navigation grid.
- The frame has slotted stiles, rollers, caps, attachment grooves, linen wraps, wing nuts, wire and nail. Wheel, drag, arrow/page keys, Home/End and on-screen controls wind the fabric; both rollers rotate by physical fabric travel divided by their radius. Input is clamped and eased, with immediate updates under reduced motion.
- Clicking the frame focuses it front-on. Escape, Back to desk and clicking outside return. “Read as text” provides the same recap and a source link in accessible HTML.
- `web/src/hack-recap.json` contains the recap, actual winners, judges and sponsors recovered from the existing Hack Atlantic website. Existing personal project and contact links remain available.
- `web/src/portfolio-copy.ts` contains the editable tagline, role, draft bio, current focus and verified existing GitHub, LinkedIn and email links. The draft bio/current-focus copy is the content to personalize.
- The Ultra Maritime accessible label is exactly “Software Engineer Intern - Ultra Maritime”. Its pill wraps; phone navigation shows the role and company on separate lines.
- Labels share one component/configuration, actual mesh-surface anchors, 45° leaders, dimmed defaults and synchronized object hover/keyboard focus. Collision handling avoids visible lettering, plants, chair, lamp, props and other pills. The solver prefers 42–70 px leaders but uses longer leaders when needed, especially for Ultra Maritime; this is a deliberate exception to the suggested narrow length range.
- One lamp spotlight casts shadows. Cool fill, rim and warm spill do not. Shadow maps are reused while the scene is static and refreshed for book/fabric movement. Ground contact occlusion supplements the light's shadows.

## Verification

- Production build and TypeScript checks pass. The existing Vite large-chunk advisory remains.
- Full suite: **123 of 125 tests pass**. The two failures were reproduced from an untouched `HEAD` checkout: the legacy monitor-layout snapshot in `desk-return.test.ts`, and the existing desk GLB exceeding the old 8 MB limit in `desk-six-fixes.test.ts`. This revision does not modify either tested asset. Three new physical-scroll/collision tests pass; all 12 focused room and scroll-navigation checks pass.
- Chrome checks at **1440×960, 1024×768, and 390×844** exercise all six destinations, notebook opening, contact links, résumé PDF availability, clamping, wheel/drag/keyboard fabric input, readable transcript, return behavior, label bounds and non-overlap. Reduced-motion transitions, a single shadow light, and unclaimed wheel events outside the frame pass. No browser exceptions were reported.
- Blender measurements place the four desk-leg bottoms, five caster bottoms and floor top at exactly **0 m**.
- Added geometry: **11,902 triangles**, including the instanced plank floor. All new textures are **2048 px or smaller**; downloaded room maps total about **420 KB**. Local headless Chrome measured approximately **16.7 ms median frame time**. This is a local measurement, not a guarantee for every mid-range device. Physical iOS/Android, Safari and Firefox were not tested.
- The optional shelf and lamp on/off easter egg were omitted. Mobile uses navigation buttons instead of dense floating leaders. Canvas lettering adapts the requested text approach to the existing plain Three.js stack without adding React/drei or another text dependency.

## Outputs and files

- **Runtime integration:** `web/src/workspace.ts`, `workspace-scene.ts`, `workspace.css`, `scroll-back.ts`.
- **New scene components:** `web/src/room.ts`, `scroll-frame.ts`, `laptop-screen.ts`, `workspace-labels.ts`.
- **Editable data:** `web/src/portfolio-copy.ts`, `web/src/hack-recap.json`.
- **Runtime textures and licenses:** `web/public/assets/room/` — walnut color/normal/roughness WebP, linen normal PNG and `sources.json`.
- **Preparation/review:** `web/scripts/prepare-room-textures.mjs`, `export-room.mjs`, `check-room.mjs`, `verify-room.mjs`, `room-final-smoke.mjs`; `web/tests/room-interactions.test.ts`.
- **Blender:** `blender/build_room_review.py`, `blender/portfolio-room.blend` (packed source review; the original `scene-realism.blend` is preserved).
- **Source handoff:** `exports/room/room-additions.glb`, `about.png`, `blender-review.png`, `README.md`, plus validation reports.
- **Figma:** editable About and linen artwork added beside the existing masters, with checked previews and links in `design/room/README.md`.
- **Documentation:** `room-implementation-plan.md` and this report.

Browser captures/reports are in `web/test-results/room/`. Blender and browser use different renderers; the live browser is the delivery reference. Figma artwork remains editable but is not fetched live: content edits should be synchronized with the local data files.
