# Portfolio scroll implementation plan

Date: 2026-10-02. Status: local browser implementation completed in `web/`; browser verification and viewing instructions are in `README.md`. Cross-browser and physical-device release testing remains outstanding.

The table-stop camera route in this document is superseded by `scroll-camera-fix-plan.md`: stops now approach the focus view directly and exit directly to travel, preserving total timing. This is the original browser implementation plan. It supersedes the screen-content, navigation, generic spin and timing proposals in `macbook-scroll-experience-plan.md`. The completed Blender assets and latest Figma motion handoff remain authoritative.

Opening revision implemented on 2026-10-02: `scroll-floating-intro-plan.md` replaces the table-based Intro below with the supplied floating closed-laptop reference, matching loading and reduced-motion stills. Station camera behavior has already been updated to the single approach → hold → exit sequence described in `scroll-camera-fix-plan.md`; the older overview detours below are historical.

Desk/printing revision implemented on 2026-10-02: the laptop aligns over the shared desk's empty left side, then descends vertically without crossing the phone. Resume paper remains hidden until **Print Resume** is clicked; its four-second feed is independent of scrolling and stays printed until reload. Reduced motion shows the result immediately after clicking. The placeholder sheet is retained at the user's request. These decisions supersede the automatic scroll-driven paper feed and reverse retraction described below.

## Outcome and fixed decisions

Build a continuous, scroll-controlled journey through **Intro → Hack Atlantic → Formula SAE → Ultra Maritime → Projects → Resume → Contact**. One physical-scale MacBook travels between separately staged compositions. The visitor controls progress with ordinary document scrolling; stopping or reversing scroll stops or reverses the same sequence.

- During travel, center the visible laptop at 50% / 50%, with the approved maximum projected width of 56% and height of 64%. Formula SAE may move to X=28% for its station composition, returning to center by lift. Change camera framing for responsive layouts; never animate model scale to enlarge the laptop.
- Preserve the authored six motions, lid angles and full turns. Keep screens blank black glass with no emission. Do not bring back the older plan's screen stories, titles, navigation or invented portfolio copy.
- Show the full station after landing, then its close view where one exists. Hack Atlantic, Ultra Maritime and Projects finish straight-on. Resume and Contact finish overhead.
- Keep the existing phone materials and paper artwork. Resume paper feed is driven by station progress, including reverse playback.
- This phase produces a local browser implementation. Hosting, publication, new project copy and a new visual design are separate work.

## Existing inputs and integration gaps

Use `blender/portfolio-completed.blend`, `exports/completion/macbook-journey.glb`, `motion-runtime.json`, `station-cameras.json`, `printer-paper-feed.glb`, the seven station GLBs and the endpoint renders. The Figma source specification is `figma_refs/completion/motion-manifest.json`.

The main hero GLB contains a merged 24-second animation; the six separate four-second files are review alternatives. Load the hero once rather than loading six copies of its geometry. The camera manifest has 721 frames at 30 fps; frame 1 corresponds to GLB time 0. Convert with `time = (frame - 1) / 30`.

The seven review station GLBs currently each contain a detailed laptop copy. Measured files range from approximately 11.1 to 21.4 MB; the complete hero is another 11.1 MB. Runtime assets must remove those duplicate hierarchies before compression. Hiding them only after download would leave their transfer and decoding cost.

Travel uses world-spaced stations; station review scenes use local coordinates. There are also actual dock differences: for example, Hack Atlantic travel lands at station-local Y=0 with about −17.3° yaw, whereas its review laptop is at Y=0.04 with zero yaw. Ultra Maritime and Projects have their own position/yaw differences. Their close-up camera clips cannot be concatenated directly with travel without a visible change.

Blender camera data is Z-up; exported glTF is Y-up. Vector conversion is `(x, y, z) → (x, z, −y)`. Apply one tested basis conversion to Blender-authored camera/placement data. The loaded GLB is already converted: do not rotate it a second time. Verify camera orientation separately using an asymmetric scene and the Blender reference image.

## Browser structure

Use a minimal TypeScript application with Vite, Three.js and GSAP ScrollTrigger. Keep the renderer and journey evaluator independent of the page framework so the same implementation can later sit inside a larger site. Start without an additional smooth-scrolling library.

Use one sticky viewport canvas with ordinary document scroll space. ScrollTrigger controls one normalized progress value. A single evaluator owns the hero, camera, station opacity, paper progress and interaction state. Do not create competing timelines or launch animations from enter/leave callbacks.

The evaluator should return the same pose for a given progress whether reached by scrolling, reversing, dragging the scrollbar, resizing or restoring a URL. Seek the baked animation to an absolute time. Do not advance the hero from elapsed wall-clock time. Keep intentional full rotations in the baked tracks; interpolating only start/end orientations would erase them.

Start with direct scrubbing for correctness. Add at most about 0.15–0.25 seconds of progress smoothing after the first milestone if it improves the feel. Apply it once to the shared progress. Deep links, reload restoration and reduced-motion changes resolve directly rather than playing a backlog.

Suggested modules:

- `journey/config.ts`: chapter order, phase lengths, station anchors and assets.
- `journey/evaluate.ts`: pure progress-to-state calculation, independent of rendering.
- `journey/coordinates.ts`: tested Blender/glTF coordinate conversion.
- `scene/hero.ts`: one hero hierarchy and absolute animation sampling.
- `scene/stations.ts`: asset loading, placement, visibility and shared-resource ownership.
- `scene/camera.ts`: travel, station bridge, wide, close and responsive fitting.
- `scene/paper.ts`: one paper mesh, controlled by morph weights.
- `scroll/controller.ts`: native scroll range, refresh, restoration and input synchronization.
- `accessibility/`: reduced-motion and model-load/context-loss fallbacks.

## Station sequence and joins

Each intermediate stop follows this sequence:

**Travel arrival → reveal the station → move into the close view → hold → return to the exact departure pose → next travel.**

Define three explicit poses per station:

- **B:** the shared incoming/outgoing travel boundary, including hero hierarchy, camera and station opacity.
- **O:** the approved station overview, including its local dock pose.
- **C:** the approved close view, if available.

Author a continuous B→O bridge from the actual arrival. Where the review dock differs, make the settling translation/rotation explicit and check tabletop contact and surrounding clearances. Preserve the approved overview/close composition rather than snapping the hero or silently rotating the whole station. Then use the authored O→C camera move. Reverse those paths on departure: C→O→B. Resume and Contact already largely agree with the travel dock; their bridge mainly changes camera framing.

At every join, positions, orientation, lid angle, camera width and opacity must agree. Motion should settle to zero at holds. Arrival and exit use the same boundary data, preventing accumulated drift. Formula SAE uses B→O for the car/callout view and O→B for departure; do not invent an unapproved laptop close-up there. Contact ends in its birdseye view without an outgoing phase.

The travel clip already includes 10% start/end holds. Preserve them as short arrival/departure cushions. Separate station holds provide time for looking and interacting; they do not play new animation.

Resume paper feeds from hidden to printed during the inward station move and remains printed throughout the hold and forward departure. Reversing through the inward move retracts the same sheet. Returning the camera to its departure pose must not automatically retract paper while the visitor is still scrolling forward. Derive this from chapter/phase progress so a direct seek gives the same result without remembered playback state.

### Initial scroll allocation

These are tunable starting values, not fixed percentages of the whole document. One viewport means the stable measured layout viewport height. Avoid rebuilding the scroll range whenever a mobile browser toolbar changes size.

| Phase | Desktop scroll distance | Behavior |
| --- | ---: | --- |
| Intro hold | 60vh | Closed laptop on its initial platform |
| Each of six travel segments | 150vh | Scrub one four-second Blender segment, including its holds |
| Arrival / station reveal B→O | 35vh | Reveal context and settle into the station dock |
| Close move O→C | 55vh | Straight-on push-in or birdseye move |
| Settled hold | 60vh | Camera stays still; relevant links may be active |
| Return C→O→B | 70vh | Restore the exact pose for the next travel segment |
| Formula SAE hold | 80vh | Car and callouts; no additional close move |
| Final Contact hold | At least 100vh | Keep notebook/contact targets available at the end |

Do not require clicking to continue. Do not snap the scroll position by default. Tune distances only after the first complete station works with mouse wheel, trackpad and touch. Projects gets the same single hold for now; a project carousel or extra reading panels would require a separate content/design decision.

## Runtime asset preparation

1. Export station-only assets from the preserved Blender master into a new `exports/web/` directory. Remove each station's MacBook hierarchy, while keeping the single travelling hero. Retain original review GLBs unchanged.
2. Remove the static printed page from the runtime Resume station and use the animated paper once. Its initial state is hidden in the printer; its final state matches the printed reference. Avoid overlapping page meshes.
3. Keep Formula SAE callouts independent from the car. Preserve the label artwork and connector anchors. Their component associations remain conceptual until verified; that does not block the scroll prototype.
4. Record stable node IDs, station origins, B/O/C poses, motion ranges, camera basis and asset versions in a browser manifest. Compile JSON camera samples into compact typed arrays if profiling justifies it.
5. Keep one shared hero mesh and one material/texture set per reusable asset. Compress derived geometry/textures only after an uncompressed reference renders correctly. Compare normal maps, small text, dial numbers and transparent materials after compression.

## Cameras and materials

Begin with the authored orthographic camera. The JSON supplies full horizontal width; compute the vertical span from the current aspect ratio and update the projection matrix on meaningful resize. Preserve the approved 3:2 composition on desktop, then fit the laptop to the same maximum width/height fractions on narrower screens. Use the visible geometry for centering; rotated local bounding boxes previously caused false offsets in Blender.

For the first milestone, use a precomputed subject-fit track or compact geometry hulls rather than scanning the full 164k-triangle hero every browser frame. Camera fitting must not remove the Formula SAE exception. Freeze framing during a settled hold to avoid visible camera breathing.

Import the existing PBR materials rather than replacing them with generic materials. Establish the browser's lighting, exposure and tone mapping against a small set of Blender reference frames before polishing the full journey. Preserve clearcoat/transmission/IOR, black non-emissive screens, texture color spaces and normal strength.

Station fades must affect every relevant material without changing shared materials on the hero or neighboring stations. Preserve pre-existing texture alpha and transmission. Start with an opacity multiplier on cloned station materials, validate depth/shadow sorting, and switch fully transparent stations off. Test the phone and label planes specifically. If ordinary transparency introduces artifacts, use a screened fade implementation while keeping the same manifest opacity curve.

## Interactions and accessibility

During travel, the canvas does not capture normal scrolling and station controls are inactive. Enable only approved controls once their station is settled. Any notebook links and résumé download should have accessible HTML counterparts with accurate labels and focus behavior; no interaction should depend solely on a tiny textured word.

Verify the actual résumé download asset before wiring a download. The current page artwork is not evidence that a final résumé document exists. Do not invent a destination or fill the blank résumé with fabricated content. Contact destinations come from the existing approved artwork and should be validated before enabling them.

Support keyboard scrolling and a skip link to useful content. Hidden controls leave the focus order. Reduced motion uses static landed station views and the printed paper, with normal document flow; it does not scrub flips or feed animation. Model-load failure or WebGL context failure uses poster images and the same essential links. Do not leave the visitor on an empty loading canvas.

On mobile, first preserve the same station order, centered hero and authored assets. Shorten travel distance and refit cameras without changing the hero's physical scale. Determine any further simplification from device testing. Stable framing, readable/tappable contact controls and a usable reduced-motion path take priority over retaining every desktop rotation on a small screen.

## Loading and performance

Load a poster immediately, then the hero and Intro. Prefetch the next station; keep current, previous and next decoded when memory allows. Retain reusable decoded resources for reverse scrolling, with a bounded cache and explicit disposal on teardown. Deduplicate shared textures/materials rather than disposing them while another station still references them.

A fast scroll may outrun asset loading. Resolve the target chapter directly and show its poster/loading state until ready. Never replay missed travel, freeze page scrolling or expose unloaded geometry. Preserve chapter plus local progress across resize and refresh.

Initial targets to measure, not promises: about 60 fps on the chosen desktop test machine and at least 30 fps on the chosen mid-range phone. Record first-use transfer bytes, decode time, peak GPU memory where measurable, frame-time distribution and draw calls. Cap pixel ratio, limit dynamic shadows, pause rendering in hidden tabs and stop rendering static holds once state settles. Establish the production download budget from the station-only exports and first device measurements.

## Implementation milestones

| Milestone | Deliverable | Acceptance gate |
| --- | --- | --- |
| 1. Runtime preparation and joins | Station-only exports, one hero, camera conversion, B/O/C bridge data | No duplicate laptop/page; source world units and cameras reproduce the references; phase boundaries match |
| 2. One complete station | Intro → Hack Atlantic → station reveal → straight-on close → hold → return → start of Formula SAE travel | No jump at any join; standees crop both edges; forward, reverse and direct seek agree; stopping scroll stops movement |
| 3. Full journey | Remaining stations, Formula SAE callouts, Resume feed and Contact birdseye | One evaluator controls all motion; approved travel framing and station compositions remain intact |
| 4. Responsive and accessible behavior | Mobile camera fits, reduced motion, keyboard/link access, posters and failure paths | No clipping or scroll trap; useful content remains accessible without 3D |
| 5. Optimization and release checks | Derived compressed assets, browser/device measurements, regression captures | Visual comparisons pass; documented loading/performance targets pass on named devices; no remaining continuity defect |

Milestones 1–4 are implemented locally, including all seven stations. Milestone 5 has compressed assets and Chrome regression checks; physical-device performance and the full cross-browser release matrix remain to be measured before publication.

## Tests that determine completion

- Unit-test phase lookup, frame/time conversion, coordinate conversion, shared boundary states and scroll restoration. Use exact endpoints and fractional progress, not only whole rendered frames.
- Sample every transition at 0%, 10%, 30%, 50%, 70%, 90% and 100%; compare hero/camera/opacity state when approached forward, backward and by direct seek.
- Test near every join on both sides, including returning from a close view to travel. Require no visible position/orientation/scale jump and no queued animation after a rapid scroll.
- Capture the seven overviews, three straight-on endpoints, two overhead endpoints, paper states and representative mid-spin poses at desktop and portrait aspect ratios. Compare with the delivered Blender/Figma references.
- Confirm the hero stays centered within a proposed 2 CSS-pixel tolerance during desktop travel, except the authored Formula SAE shift; no viewport clipping and no animated physical scale.
- Check initial load, slow network, next-station failure, direct chapter load, scrollbar jumps, browser back/forward, refresh restoration, orientation change, tab visibility and context loss.
- Verify all screens remain blank/non-emissive, dial digits and notebook text survive asset processing, paper has no duplicate mesh, and inactive controls cannot take focus.
- Test current Safari, Chrome and Firefox on desktop, plus iOS Safari and Android Chrome on identified devices. Record actual results before calling the site ready to publish.

## Technical references checked for this plan

- [Three.js AnimationMixer](https://threejs.org/docs/pages/AnimationMixer.html): absolute animation-time seeking.
- [Three.js GLTFLoader](https://threejs.org/docs/pages/GLTFLoader.html): support for the material extensions used here, plus compressed asset loading.
- [Three.js OrthographicCamera](https://threejs.org/docs/pages/OrthographicCamera.html): orthographic framing and projection updates.
- [GSAP ScrollTrigger](https://gsap.com/docs/v3/Plugins/ScrollTrigger/): scroll scrubbing and layout refresh.
- [Vite guide](https://vite.dev/guide/): minimal local application setup.
- [MDN prefers-reduced-motion](https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/At-rules/@media/prefers-reduced-motion): honoring the visitor's motion preference.
