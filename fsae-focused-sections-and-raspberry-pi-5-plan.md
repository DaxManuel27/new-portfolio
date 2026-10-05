# FSAE focused project sections and Raspberry Pi 5 model

Status: implementation plan only. Prepared October 2, 2026.

## Intended experience

After entering the Formula SAE car from the Workstation monitor, scrolling should take the visitor through two project stories in order: **Data logging**, with a Raspberry Pi 5 as the main visual, then **Accelerator pedal sensor**, with the sensor/pedal assembly as the main visual. Each story gets a deliberate camera approach and enough stationary reading time. Scrolling backward reverses the sequence exactly. After both stories, return to the car overview and continue to the existing ultrawide/Projects transition.

The Raspberry Pi is the subject of the data-logging project, rather than a small decorative component inside the car. Show its relationship to the car briefly, then give the board its own uncluttered close-up against the existing black background.

## Current implementation and constraints

- `web/src/journey.ts` currently gives station 3 a `screen-zoom` (1.2 units), a car `hold` (0.8), and an `exit` (0.65). There are no focused project phases yet.
- `web/src/camera.ts` has car close/wide poses and an existing screen-to-car substitution. Keep the monitor filling its screen edge to edge and preserve the substitution boundary before starting the new sequence.
- `web/src/scene.ts` uses the same car asset for the live monitor preview and the full-screen section. A new Pi or isolated sensor must not accidentally appear in the Workstation monitor preview.
- The travelling MacBook is hidden from station 3 onward. Keep that behavior.
- `blender/completion_pipeline.py`, in `callouts()`, explicitly states that the current car lacks verified logger/sensor positions. The source car is representative, not an exact replica of the team's vehicle. Treat existing leader-line endpoints as narrative locations, not engineering evidence.
- Existing station IDs, historic hashes and the order Workstation → FSAE → ultrawide → Projects remain stable. New phases belong within station 3; do not add new numeric station indices.
- Preserve the recently corrected Hack Atlantic clearance, Workstation rotation, lid behavior, monitor fill and downstream Projects/Resume/Contact behavior.
- Re-read the live sources at implementation time: this workspace has recently had concurrent edits from another chat. Back up the affected files and Blender source, and avoid rebuilding unrelated scenes.

## Proposed scroll sequence

A unit is the current app's scroll unit, approximately one viewport height. These are starting values to tune in the browser after real copy is available, not fixed pixel distances.

| Phase | Units | Visual and content behavior |
| --- | ---: | --- |
| Existing monitor entry | 1.2 | Preserve the screen-filling transition into the live car. |
| Car overview | 0.8 | Show the complete car and the two existing project labels. Introduce the FSAE work briefly. |
| `data-focus` | 0.8 | Move toward the data-logging anchor; fade the pedal label; introduce the Pi at the anchor and carry it into an isolated presentation. |
| `data-hold` | 1.8 | Pi dominates the visual area. Show the project explanation in two readable beats; camera remains mostly still. |
| `data-return` | 0.6 | Withdraw the Pi presentation, restore car context and end at the exact overview pose. |
| `pedal-focus` | 0.8 | Move toward the pedal/sensor region. Fade the data label; reveal an unobstructed view of the project hardware. |
| `pedal-hold` | 1.6 | Hold on the sensor/pedal assembly while explaining the user's contribution and evidence. |
| `pedal-return` | 0.6 | Return to the exact car overview and restore overview labels. |
| Existing FSAE exit | 0.65 | Preserve the current widening move into the next station transfer. |

The six inserted phases add **6.2 scroll units**. Derive the new total from the phase list; update expectations that currently assume a fixed total. Do not stretch the entire pre-existing animation to accommodate the new sections. Keep travel sampling tied to authored time, independent of the larger page length.

At every phase join, position, orientation, scale and opacity must agree on both sides. Test exact joins as well as samples just before and after them.

## Data logging: approach, Pi presentation and copy

### Visual direction

1. Begin with the car at its existing overview pose and the Data logging label active.
2. Approach the conceptual logger area with a smooth camera move. Do not zoom through opaque bodywork or imply an exact physical mounting location that has not been verified.
3. Blend from the anchor view to an isolated Pi presentation over the latter part of `data-focus`. The car fades into black while the Pi becomes the dominant object. This is a deliberate editorial reveal, not an explosion of parts from an unverified installation.
4. Present the board at a shallow three-quarter top angle so the PCB, large components, GPIO header and connector housings read clearly. Keep green solder mask, silver ports and black components distinct under restrained studio lighting.
5. Settle the camera before showing longer copy. At most add a small scroll-driven orientation change between the two information beats. Do not auto-spin while someone is reading.
6. Reverse these values through `data-return`, re-establishing the car before the pedal approach.

Keep the Pi at physical scale in its asset. Enlarge its on-screen presence through the dedicated camera/framing. Use an isolated presentation coordinate system so a close-up does not require making a giant board intersect the car. The board can fade between the anchor representation and the presentation instance, but avoid two visible copies once the hold begins.

### Content structure

Use selectable, accessible HTML text, not text baked into the PCB model or screen texture.

| Beat | Content to prepare | Visual support |
| --- | --- | --- |
| Purpose and responsibility | What the logger needed to do; what the user personally designed or implemented; why Pi 5 was used. | Full board with a short project heading and summary. |
| Implementation and evidence | Confirmed signal inputs, software/data flow, storage or telemetry method, one specific design challenge, validation and outcome. | Up to three relevant board hotspots, plus a real log/chart or architecture diagram if supplied. |

Describe the user's project rather than filling the story with generic Pi specifications. Do not invent sample rates, CAN hardware, languages, measured performance, competition results or a relationship between the pedal signal and the Pi. Show a signal-flow diagram only after its actual interfaces are confirmed. Clearly label any demonstration dataset.

Default copy budget: a short introduction, 3–4 concise implementation points, and one evidence/result block. If the real story needs more space, lengthen its reading phase rather than shrinking the text.

## Accelerator pedal sensor section

- Return through the car overview, then approach the second anchor. Use the full label **Accelerator pedal sensor** consistently.
- Focus on the actual sensor and its mechanical relationship to the pedal, not on the front wheel currently near the conceptual leader endpoint.
- Preferred visual: a verified pedal/sensor assembly supplied by the user or reconstructed from their references. If those references are absent, use a clearly representative cutaway or isolated mechanism and document its limits; do not present a generic mechanism as the team's exact design.
- Fade or selectively hide occluding bodywork for the focus view. Restore it deterministically on reverse scroll and when leaving the phase. An isolated display is preferable if removing bodywork produces a confusing view.
- Explain the problem, personal contribution, confirmed sensing method, calibration/validation, and outcome. Include evidence such as actual calibration data or an annotated image when available.
- Optional pedal motion should be a small scroll-driven illustration based on verified geometry. Do not imply a measured operating range or a safety/compliance claim without supporting evidence.
- No custom detailed sensor model is required to start the camera/layout prototype; final hardware detail depends on the actual sensor reference.

## Raspberry Pi 5 sourcing decision

### Preferred source: official CAD

The official Raspberry Pi hardware documentation lists a Pi 5 mechanical drawing and STEP downloads both with and without silkscreen graphics. Use these as the first acquisition candidates. [Official hardware documentation](https://www.raspberrypi.com/documentation/computers/raspberry-pi.html#schematics-and-mechanical-drawings)

| Candidate | Role in this project | Verification still needed |
| --- | --- | --- |
| [Official STEP without graphics](https://pip.raspberrypi.com/documents/RP-010083-CA) | Preferred starting geometry for a lightweight browser model. | Download and inspect topology, component coverage, scale and accompanying reuse terms. |
| [Official STEP with graphics](https://pip.raspberrypi.com/documents/RP-010082-CA) | Detail reference for close-ups and silkscreen baking. | Inspect whether graphics are geometry or useful source data; assess conversion cost. |
| [Official mechanical drawing](https://pip.raspberrypi.com/documents/RP-008347-DS) | Check footprint, mounting holes and connector locations. | Its dimensions are reference values; component coverage is incomplete. |
| [Official product page](https://www.raspberrypi.com/products/raspberry-pi-5/) | Appearance and connector-layout reference. | Match the chosen board revision and any real accessories. |

Research status: the official documentation and drawing were opened. The STEP links resolve to downloadable ZIP archives, but the archives have not been downloaded, converted, inspected or licensed for this deliverable. A linked download is not evidence that the source is web-ready or unrestricted for redistribution.

Record author, source URL, revision, retrieval date, file hash, accompanying terms and required attribution in an asset provenance file. Verify that the intended derivative/browser distribution is permitted before shipping the GLB. A downloadable website asset can be retrieved by visitors, so rendered-image permission alone is insufficient.

### Fallback

If official CAD conversion or reuse terms are unsuitable, evaluate a downloadable third-party Pi 5 model with explicit terms covering modification and website distribution. Check that it is a **Raspberry Pi 5 board**, not a Pi 4, Compute Module 5 or a case alone. No third-party model is selected or its license approved by this plan.

If no suitable reusable model is available, author a simplified board from the official mechanical references and product imagery, retaining only the details visible at the intended camera distance. Do not download an arbitrary attractive model and treat it as production-ready.

## Blender production plan

### Import and source preservation

1. Save a separate `blender/raspberry-pi-5.blend` and retain the untouched downloaded CAD under an asset-source directory with its provenance.
2. Use a STEP-capable CAD converter, such as FreeCAD, to tessellate into a format Blender can import. Check the installed tools before choosing the conversion route; do not assume Blender directly imports STEP. Preserve component separation and source colors where possible.
3. Inspect the converted board against the mechanical drawing and product photographs. Verify the nominal 85 × 56 mm board footprint, mounting pattern, connector placement and underside. Resolve millimetres/metres explicitly: one Blender unit equals one metre.
4. Keep a hidden untouched source collection and create a separate optimized export collection. Use a board-centre presentation root and named connector/component groups.

### Visible detail and materials

Prioritize the PCB silhouette and thickness, mounting holes, USB/Ethernet housings, USB-C and HDMI connectors, GPIO pins, prominent chips, ribbon connectors, power button and recognisable silkscreen. Validate these against the selected source rather than guessing tiny components. Avoid modelling internal contacts or lettering as dense geometry when they can be baked.

Use PBR materials for solder mask, metal housings, black packages and pin contacts. Bake fine traces, package labels and silkscreen into textures. Inspect grazing angles, normals, mirrored UVs, connector cavities and the board underside. Match the site's existing realistic material treatment without adding visual noise.

Default to a bare Pi 5 so the board remains recognisable. Add a cooler, HAT, enclosure, cables or storage device only if it belongs to the actual project and improves the explanation.

### Proposed browser budgets

These are initial targets to validate at the actual close-up size, not claims about the downloaded CAD.

| Item | Target |
| --- | --- |
| Main Pi model | 25k–60k triangles; retain silhouette and major connectors. |
| Small/in-car representation | 5k–12k triangles or a simplified instance. |
| Materials/draw calls | Prefer 4–8 materials and fewer than 20 draw calls. |
| Textures | One 2K atlas where possible; 1K alternative for constrained devices. |
| Compressed hero download | Target ≤3 MB; investigate anything above 5 MB before shipping. |
| Asset format | GLB using the existing project's supported compression pipeline. |

Keep shading quality at the planned viewing distance as the deciding factor. Do not apply indiscriminate decimation to ports or GPIO pins. Export selected objects only, with metre scale, correct glTF axis conversion and no source cameras/lights embedded accidentally.

Suggested object names: `RPI5_PresentationRoot`, `RPI5_PCB`, `RPI5_Connectors`, `RPI5_GPIO`, `RPI5_Chips`. Suggested outputs: `raspberry-pi-5.glb`, optional `raspberry-pi-5-low.glb`, and desktop/mobile fallback posters.

## Website integration

### State, assets and cameras

- Add the six project phase kinds to `journey.ts`; keep the existing FSAE overview `hold` so the chapter link still enters the overview.
- Add a pure `fsae-focus.ts` evaluator that derives active project, focus progress, camera pose, model visibility, car opacity, callout visibility and content beat from absolute scroll state. No direction-dependent tweens or accumulated rotations.
- Extend the manifest/type definitions with measured car-space anchors, overview/focus/return poses, isolated Pi presentation poses, asset URLs and desktop/mobile framing constraints. Store world-space conversion in one place; avoid mixing Blender Z-up and glTF Y-up coordinates.
- Author anchor empties and reference cameras in a separate Blender detail scene, then export measured transforms. Define the anchor positions as conceptual until verified references replace them.
- Update `camera.ts` to evaluate these new station-3 phases explicitly. Use continuous position interpolation, quaternion interpolation and smoothly eased orthographic width changes. Fit the model into the visual area left after reserving space for copy, rather than fitting it to the entire viewport.
- Load/cache the Pi separately from the existing car GLB. Begin prefetching while the Workstation monitor is in view. Do not add the model to the critical Intro download.
- Keep the Pi presentation and detailed sensor assets in separate groups. The monitor preview render must explicitly exclude them and use the overview car, irrespective of the active main-view focus phase.
- Replace the current unconditional `label.visible = true` behavior with state-controlled callouts. Avoid duplicate 3D labels and HTML section headings during close-ups.
- Preserve black backgrounds and the edge-to-edge FSAE monitor portal. Return to the existing car overview before its current exit/transfer so the ultrawide handoff has the same starting pose.

### Copy, navigation and accessibility

Create structured project content in `fsae-projects.ts` and render it as semantic sections in `main.ts`/`style.css`. Desktop: model beside copy. Portrait: model above copy, with room for readable text and links. Do not cover the component with the text panel or shrink the whole board to fit long paragraphs.

Keep `#formula-sae` landing on the overview. Add explicit links such as `#fsae-data-logging` and `#fsae-pedal-sensor` to the corresponding reading holds, using phase lookup rather than hard-coded percentages. Existing callouts may offer optional keyboard-accessible jump controls, but scrolling alone must reveal every section. Provide visible focus styles and normal text selection.

Reduced motion uses static Pi/sensor posters with the same complete content in normal document flow. Keyboard navigation must reach all content without a precision scroll gesture. If an asset fails to load, show its poster and text; do not strand the visitor behind a loading screen or block scrolling.

### Implementation files and deliverables

| Area | Expected files |
| --- | --- |
| Plan | This document. |
| Asset source | `assets/models/raspberry-pi-5/` with provenance and untouched source. |
| Blender authoring | `blender/raspberry-pi-5.blend`, a reproducible import/cleanup/export script, and a separate FSAE detail/camera script. |
| Export metadata | Dedicated detail manifest merged into `exports/web/journey.json` and `web/public/assets/journey.json`. |
| Runtime | `journey.ts`, `camera.ts`, `scene.ts`, `types.ts`, new `fsae-focus.ts`, new `fsae-projects.ts`. |
| Presentation | `main.ts`, `style.css`, reduced-motion/poster integration. |
| Validation | Focus-state tests, actual-asset/framing checks, browser captures and a short validation report. |

## Delivery order

1. Snapshot the current passing website and Blender source. Confirm the actual content/hardware references below; proceed with clearly labelled placeholders where facts are missing.
2. Build a rough Pi proxy and sensor proxy, the six scroll phases and DOM copy layout. Verify forward/reverse pacing and the return to Projects before detailed asset work.
3. Acquire and inspect the official Pi CAD; document terms and conversion. Clean, texture, optimize and export the Pi asset.
4. Replace the Pi proxy, author the final close-up framing, and implement the sensor detail from confirmed references.
5. Add real project copy, evidence and links. Tune the hold lengths around its reading needs.
6. Verify the optimized assets in the browser, update fallback posters, and record acceptance results. Keep the existing live source compatible with future asset exports so a rebuild does not remove these phases.

## Acceptance checks

- The visitor encounters car overview → Data logging/Pi 5 → Accelerator pedal sensor → car overview → Projects in that order without clicking.
- Pi 5 is the dominant visual during its reading hold; labels and important connectors remain legible at desktop and phone sizes.
- Both projects include actual project information. No unverified metrics, physical installation claims or invented hardware details are presented as fact.
- Forward, reverse, direct hash jumps, rapid scroll and resize produce the same pose for the same phase progress. Boundaries do not snap, leave duplicate models or retain hidden bodywork.
- The FSAE monitor preview remains a clean car overview with no inner borders and no Pi/sensor presentation leaking into it. The full-screen entry has no visual size jump.
- The returned overview matches the existing exit pose exactly. Intro, banner clearance, Workstation spin, Projects reel, printing and contact links retain their existing behavior.
- Test aspect ratios including 390×844, 1200×900, 2040×1134 and an ultrawide screen. Inspect all joins, mid-transition poses and reading holds for clipping, occlusion and text overlap.
- Compare source and compressed Pi renders; check scale, normals, UVs, material response and retained details. Measure file size, GPU resource use and frame time on an actual target device; aim for smooth 60 fps desktop and at least 30 fps on the agreed mobile baseline.
- Unit tests cover focus evaluation, hash mapping and reversible state; geometry/framing checks use real exported bounds. Browser checks cover loading failures, reduced motion, keyboard access, both content sections and all return transitions.
- Run the relevant existing tests and production build; preserve source/provenance, final GLB, posters and review captures.

## Information needed before final content and detailed sensor modelling

These do not block the interaction prototype or Pi-source evaluation:

1. Data logging: personal contribution, actual Pi configuration/accessories, languages, input interfaces, storage/telemetry flow, engineering challenge, and real validation/results.
2. Pedal sensor: part number or reference photos/CAD, placement, confirmed sensing/calibration approach, personal contribution and test evidence.
3. Whether the logger actually receives the pedal signal; do not imply that connection by default.
4. Which screenshots, diagrams, code/repository links and measured results may be shown publicly.
5. Exact hardware placement if the car close-ups should represent the real vehicle rather than the current conceptual overview.

Default until confirmed: bare Pi 5 hero, conceptual car anchors, no claimed accessory configuration, no performance figures and no exact replica claim for the pedal assembly.
