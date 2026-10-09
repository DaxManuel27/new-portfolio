# Interactive workspace implementation plan

Date: 2026-10-08
Status: implementation plan; design, asset production, and integration have not started.

## Intended experience

Replace the default linear scroll journey with one complete 3D desk where visitors choose what to explore. Preserve the existing warm, realistic materials, silver devices, dark environment, ivory paper, and red phone. Treat the generated mockup as a composition reference, with the destination changes below taking precedence.

The ultrawide monitor represents **personal projects**. A closed **Ultra Maritime notebook**, using the existing logo on its cover, represents work experience. Clicking the notebook moves the camera closer while its cover opens to reveal the experience spread. Returning to the desk closes it and restores the overview.

The initial composition uses an elevated front view with enough desktop visible to distinguish every destination. Omit the foreground chair from the primary composition. Keep ornamentation secondary to navigation.

| Object | Destination | Selection behavior |
|---|---|---|
| MacBook | Hack Atlantic | Camera approaches the screen; Hack Atlantic content becomes readable. |
| Ultrawide monitor | Personal projects | Camera centers on the screen; visitors choose project cards and open details. |
| Ultra Maritime notebook | Work experience | Camera approaches as the cover opens; an interior spread presents the existing role and contributions. |
| Formula SAE model car | Formula SAE | Camera focuses on the car; project overview and selectable details appear. |
| Raspberry Pi | Data logging | Focus on the board and show the existing Rust/CAN data-logger story; link back to Formula SAE. |
| Printer and résumé | Résumé | Existing print interaction feeds the sheet; offer view/download only when a real current résumé is available. |
| Red rotary telephone | Contact | Receiver lifts and accessible contact links appear. |

About remains available through the persistent navigation; it does not require an additional desk prop. Provide direct navigation for Projects, Experience, About, Résumé, and Contact, plus a visible Back to desk control in focused views. Preserve the old tour as an optional separate route if its maintenance cost remains reasonable.

## Starting assets and constraints

- Reuse the existing MacBook, ultrawide, car, Raspberry Pi, printer, phone, pen, materials, and current content where suitable.
- Inspect `blender/portfolio-shared-desk.blend`, `blender/portfolio-completed.blend`, existing exports, and generation scripts before selecting canonical source objects. Filename or modification time alone is not proof of the latest approved asset.
- Logo sources already exist at `assets/textures/ultra-maritime-logo.png` and `assets/textures/ultra-maritime-logo-white.png`, with runtime copies in `web/public/assets/`.
- Use `web/src/ultra-maritime.json` for the existing Ultra Maritime role, dates, and contributions. Preserve factual content when laying it out.
- Existing notebook exports are references; audit whether their geometry supports a closed cover and opening animation before reuse.
- The website already uses Vite, TypeScript, Three.js, and GSAP. Extend this stack and reuse compression, loading, contact, and print functionality.
- Work in new scene/export directories and an isolated implementation branch. Preserve original Blender sources and the current site until the replacement is validated.

## Phase 1 — Figma design and texture handoff

### 1.1 Establish the design and surface contracts

Create a dedicated Figma workspace-design file or clearly separated pages in a verified existing project file. Organize it into Overview, Surfaces, Interaction states, Mobile, and Export handoff.

Design desktop and portrait compositions, object labels, selected states, focus panels, Back to desk, loading, and reduced-motion views. Confirm that the new monitor/notebook mapping is used throughout.

Before final texture artwork, inspect existing screen and paper dimensions and define the new notebook dimensions. Record aspect ratios, UV orientation, spine/gutter width, and safe areas. This is a measurement handoff, not the Blender production phase; it avoids designing artwork for the wrong surface.

### 1.2 Produce the graphic surfaces

| Surface | Artwork to design | Export intent |
|---|---|---|
| Ultra Maritime notebook front | Existing logo, restrained dark cover, subtle optional title/date treatment | Cover color artwork and optional separate logo mask; preserve logo proportions. |
| Notebook spine/back | Matching minimal treatment | Separate islands or documented cover atlas. |
| Notebook left page | Company, role, dates, short experience introduction | Individual page image with gutter-safe margins. |
| Notebook right page | Existing contributions arranged into concise sections | Individual page image; full accessible text also comes from site content. |
| Personal-projects monitor | Project index, thumbnails, selected-project design | Idle screen texture plus UI specification for functional browser content. |
| Hack Atlantic laptop | Adapt existing branded screen artwork | Screen texture matched to the actual screen proportions. |
| Résumé sheet | Actual résumé artwork, or clearly tracked existing placeholder | Paper texture; downloadable file is a separate content dependency. |
| Phone number plate / small labels | Reuse or refine existing artwork only where needed | Small decals, not baked navigation controls. |

Use Figma for graphic artwork and interface design. Create leather/cloth grain, paper roughness, metal normals, and other physical surface maps in the Blender/material workflow. Do not bake lighting or reflections into the artwork.

### 1.3 Design the notebook sequence

Prepare five storyboard frames: closed on desk, hover/keyboard focus, approaching with cover partly open, fully open reading view, and returning/closing. Keep the logo visible at the starting camera. Reserve physical space to the notebook's left for the opening front cover; it must not intersect the laptop, résumé, or desk props.

The first version opens to one designed spread. Additional page turns are optional later work, not a dependency for launching the experience. The open spread should communicate the role at a glance; readable HTML supplies longer text and links, especially on phones.

### 1.4 Export and record the handoff

- Export color artwork in sRGB, with transparent PNG for decals where needed; retain vector logo originals if available.
- Target 2K resolution on the longest edge for hero covers, pages, and screens; 512–1K for small decals. Preserve actual surface aspect ratios. Increase to 4K only if close-up browser review demonstrates a need.
- Record Figma file/node IDs, export filenames, dimensions, revision, destination material/object, UV orientation, and source attribution in a texture manifest.
- Proposed output: `design/interactive-workspace/`, including `textures/`, storyboards, and `texture-manifest.json`.

**Completion checkpoint:** finished Figma layouts and exported textures; monitor clearly presents personal projects; notebook cover uses the existing Ultra Maritime logo; all artwork has a documented target surface. Review the designs before detailed modeling, without treating this checkpoint as an extra permission requirement.

## Phase 2 — Blender workspace and animated assets

### 2.1 Audit, preserve, and block out

Use Blender MCP to inspect sources and preserve any unsaved live scene before opening project files. Create `blender/interactive-workspace.blend` as the new production source, with `COL_Workspace`, `COL_Interactables`, `COL_Cameras`, and `COL_Lighting` collections.

Use metre scale. Reuse real device dimensions and explicitly treat the car as a tabletop model. Arrange the MacBook front-center, monitor at the back, car/Pi to the left, notebook on the right with opening clearance, and printer/phone toward the right edge. Refine positions using desktop and portrait camera checks rather than locking the mockup's exact coordinates.

Establish overview and focus cameras before adding detail. Ensure the laptop does not obscure the projects screen and the notebook remains recognizable while closed.

### 2.2 Build the Ultra Maritime notebook

- Model or adapt a hardcover notebook with separate front cover, back cover, spine, page block, and visible left/right page surfaces.
- Place the cover pivot on the spine hinge and the asset root at its desk-contact reference.
- Map the Figma cover and individual page artwork without stretching the logo or mirroring text.
- Add restrained cover grain, edge bevels, page thickness, paper roughness, and a natural gutter.
- Keep the back cover grounded; make the front cover open outward with believable hinge clearance. Use a lightweight deforming page surface only if needed for the opening spread.
- Author an exportable `Notebook_Open` clip, with exact closed/open endpoints; support a tested reverse playback for closing or a separate closing clip if needed.
- Use baked transform, skeletal, or morph animation supported by GLB. Avoid depending on Blender-only constraints or live cloth simulation in the browser.

### 2.3 Adapt the remaining props

Apply the personal-projects screen design to the ultrawide and the Hack Atlantic design to the MacBook. Keep screen artwork replaceable independently of the geometry. Reuse the printer/paper mechanism after inspecting its existing browser-dependent behavior.

Separate the phone receiver for a short lift animation. Keep car/Pi inspection motion bounded and optional. Author highlight/picking proxies and named content anchors without adding visible collision geometry.

### 2.4 Materials, lighting, cameras, and motion

Apply textures after UV validation. Use export-compatible PBR materials and the existing photographic maps where appropriate. Establish broad warm lighting and reflections that retain the silhouette of dark objects without obscuring screen text.

Author overview, monitor, MacBook, notebook, car, Pi, résumé, and contact camera targets. Provide portrait alternatives and safe framing areas for text panels. Export camera positions/targets and surface anchors as metadata; the website controls camera travel and interruption handling, while Blender provides the prop animation clips.

Initial notebook timing target: approximately 0.8–1.2 seconds for approach, with opening beginning during travel and reaching a stable spread by arrival. Tune in-browser. Returning closes the notebook while pulling back. Reduced motion goes directly to the stable reading state.

### 2.5 Optimize, export, and validate

Provisional runtime budgets, to be measured after reuse audit:

- Full overview: aim for no more than 250,000 visible triangles and 100 draw calls.
- New notebook: target 10,000–20,000 triangles; larger hero props approximately 15,000–50,000 each, with lower-detail overview versions where required.
- Initial compressed workspace transfer: target 8 MB or less for models/textures/environment, excluding lazy-loaded detail content. This is a target, not an established measurement.
- Share materials, limit transparent layers and shadow-casting lights, and load higher-resolution surfaces only when needed.

Export reusable GLBs with metre scale and glTF axis conversion, named roots/anchors, embedded or explicitly managed textures, and verified animation clips. Export a workspace manifest with object IDs, transforms, cameras, picking targets, bounds, and clip names. Keep textures and animations addressable per destination.

Proposed output: `exports/interactive-workspace/` containing source-quality exports, runtime candidates, manifest, review renders, and an animation validation report. Use the existing asset-preparation tooling where compatible; do not overwrite old tour exports.

**Completion checkpoint:** round-trip the GLBs into a clean scene and inspect them in a browser viewer. Verify cover/page orientation, grounded objects, notebook opening clearance, receiver motion, paper feed, and all focus camera crops. Compare Blender and browser materials. Deliver overview and notebook closed/mid-open/open captures.

## Phase 3 — Website assembly and interaction

### 3.1 Build the workspace alongside the current experience

Add a separate development route or feature flag for the new desk. Reuse the renderer and asset preparation where practical, but give the workspace its own interaction controller instead of driving it through the old scroll timeline.

Create a destination registry connecting stable IDs to object roots, content, camera targets, animation clips, labels, and URLs. Load the overview first and defer detailed project media.

### 3.2 Implement navigation and state

Represent overview, approaching, focused, and returning states explicitly, with one selected destination. Clicking a mesh, its visible label, or its accessible menu entry must activate the same destination.

Hover/focus highlights only the relevant object. On touch, show visible destination labels; do not require hover or a hidden double-tap. Distinguish a swipe from a tap. Escape and Back to desk restore the overview. Browser Back, direct links, refresh, resizing, and rapid changes of destination must settle into consistent states.

When a visitor selects another object mid-transition, cancel or retarget the camera safely and resolve the old object's animation state. Do not let two controllers animate the same transform. Prevent content panels from passing clicks through to objects behind them.

### 3.3 Assemble each destination

- **Personal projects / monitor:** selectable project index, project detail views, real outbound links, and a return-to-projects action. Reuse existing project content and media.
- **Ultra Maritime / notebook:** synchronize camera approach with the opening clip. Reveal the readable experience panel once the spread is open. Source browser text from the existing JSON; keep Figma page artwork aligned with the same copy. Close on departure and reset deterministically.
- **Hack Atlantic / MacBook:** preserve the existing founder story, application/check-in systems, media, and links.
- **Formula SAE / car and Pi:** expose overview and data-logger detail as related destinations; distinguish conceptual callouts from verified model components.
- **Résumé / printer:** reuse the existing deliberate print action and repeated-click protection. Show a real download only when the file is available.
- **Contact / phone:** receiver movement reveals actual contact options; selecting the phone itself must not initiate a call or send a message.

Keep long text, project cards, buttons, and links as accessible HTML rather than making essential content readable only inside a 3D texture. Align short screen content visually with its surface where appropriate; use a comfortable panel layout for longer reading.

### 3.4 Mobile, accessibility, and loading

Provide an overview that fits portrait screens, plus optional swipe navigation between object focus views and the same direct menu. Use at least 44 CSS-pixel touch targets. Constrain camera movement so users cannot lose the desk.

Support keyboard activation, visible focus, focus restoration, readable contrast, and reduced motion. Do not depend on canvas picking for navigation. If WebGL fails, show a workspace still with the same content links and functional HTML destination views.

Show a useful poster while loading, retry failed asset loads, and retain readable content if a 3D detail asset fails. Track transferred bytes and rendering performance; cap pixel ratio and lower shadows/detail on constrained devices.

### 3.5 Verification and rollout

Test the production build and meaningful state/asset regressions. Browser checks must cover all destinations, opening/closing the notebook, transitions interrupted by another selection, returning repeatedly, printer interactions, direct links, Back/Forward, refresh, keyboard, touch, portrait/landscape resize, reduced motion, failed loads, and WebGL loss.

Capture desktop and mobile walkthroughs and compare the delivered surfaces against the Figma handoff. Measure frame times on representative hardware; target smooth desktop rendering around 60 fps and at least 30 fps on supported mobile hardware, adjusting budgets based on actual measurements rather than desktop assumptions. Record untested devices explicitly.

Promote the validated workspace to the homepage after review. Keep the previous experience recoverable; if retained as Take the tour, isolate its assets and load it only when requested. Deployment is a later execution step, not part of completing this planning task.

**Completion checkpoint:** visitors can choose any destination in any order, read all essential content without animation, open and close the Ultra Maritime notebook reliably, and explore personal projects on the monitor on desktop and mobile.

## Implementation order and deliverables

1. Verify reusable source assets, factual content, screen dimensions, notebook dimensions, and logo source quality.
2. Complete Figma layouts, notebook storyboard, graphic textures, and export manifest.
3. Build the Blender desk blockout and notebook; validate one complete notebook GLB export before polishing other props.
4. Finish materials, prop clips, camera metadata, optimization, and browser export review.
5. Integrate a thin end-to-end path first: overview → Ultra Maritime notebook opens → readable experience → close and return.
6. Apply the proven interaction pattern to monitor projects, Hack Atlantic, car/Pi, résumé, and contact.
7. Complete mobile, accessibility, loading/fallbacks, performance checks, and production walkthrough.

Final deliverables: editable Figma designs and texture exports; a new preserved Blender source; validated GLBs and manifests; an integrated workspace preview; desktop/mobile captures; a validation report and rollout instructions.

## Content dependencies and scope boundaries

Use the existing logo and published project/experience content first. Verify whether a current downloadable résumé exists before enabling download. Missing résumé content does not block the desk or notebook implementation. Any added project screenshots or refreshed copy can be supplied independently through the same content registry.

Additional notebook page turns, free camera orbit, sound effects, decorative props, and a guided tour redesign are optional follow-ups. Prioritize reliable selection, readable content, the opening notebook, and fast mobile loading for the first release.
