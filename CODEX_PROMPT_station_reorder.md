# Codex prompt — Station reorder: Workstation (Ultra Maritime + Formula SAE) → FSAE car → Ultrawide → Projects

You are working on Dax Manuel's scroll-driven 3D portfolio. Use the **Figma MCP** and the **Blender MCP** for design and 3D work, and edit the website code directly. Work in this order: **plan → Figma storyboard → Blender → website → verification**. Do not skip ahead.

## 0. Project facts (read before touching anything)

- Project root: `/Users/daxmanuel/Documents/ChatGPT/portfolio-site-blender`
- Website: `web/` (Vite + TypeScript + three.js 0.186 + GSAP ScrollTrigger). Key files:
  - `web/src/journey.ts`: phase timeline (`intro / travel / approach / hold / exit / dive / reel / handoff`), `totalUnits`, `evaluate()`, `stationProgress()`, `IDS`, `NAMES`.
  - `web/src/camera.ts`: `evaluateCamera()` blends baked travel samples with station `close` / `wide` poses.
  - `web/src/scene.ts`: loads GLBs, samples the hero MacBook rig, docks it, fades stations, and has `screenFrame()` + `applyDive()`, which currently dive the camera into the **MacBook** screen (`Journey_MacBook_Screen`). It also contains recent lighting work (HDR `studio-small-09.hdr`, RectAreaLight softbox/fillbox). **Keep that lighting work.**
  - `web/src/reel.ts`, `web/src/projects.ts`, and the `#reel` markup in `index.html` / `style.css`: the Projects reel (DOM cards) and the card → live desk hand-off. **Do not change the Projects reel itself.** Only change what leads into it.
  - `web/public/assets/journey.json`: manifest (stations with `origin`, `asset`, `poster`, `dock`, `wide`, `close`, plus baked `travel` samples at 30 fps, 721 frames).
  - `web/public/assets/*.glb`: `macbook-journey.glb`, `station-hack-atlantic.glb`, `station-formula-sae.glb`, `station-ultra-maritime.glb` (desk with two monitors), `station-projects.glb` (desk with the ultrawide monitor; currently unused by the site), `station-resume.glb` (shared Resume/Contact desk), `printer-paper-feed.glb`.
  - `web/scripts/prepare-assets.mjs` builds the assets; the tests are in `web/tests/` (`npm test` runs unit tests; `tests/browser.mjs` is the browser regression).
- Blender: `portfolio-shared-desk.blend` and the station `.blend` files in the project folder; `blender/` holds the scripts. Journey scene runs frames 1–721 at 30 fps. Hero rig is `Journey_TravelFeet` → `Journey_MacBook_TravelRoot` → `Journey_MacBook_SpinPivot` → `Journey_MacBook_LidPivot`. glTF axis conversion: Blender (x, y, z) → glTF (x, z, −y).
- Figma file: `AAoP4nNd3n9QzR9C2Cjarm` (page `0:1`). The motion board is `48:5573` ("Scroll transitions — Blender reference"; keyframes at 10/30/50/70/90 %). The current reel storyboard section is `138:12987`. The screen components include `Screen / Ultra Maritime`, `Screen XL / Ultra Maritime`, `Screen / Formula SAE`, `Screen XL / Projects`, and `Screen / Blank`.
- Plans live as markdown in the project root (e.g. `projects-reel-plan.md`, `close-before-travel-plan.md`, `ultrawide-monitor-clearance-plan.md`). Write your plan in the same style.
- Before editing, copy every file you will change into `backups/pre-station-reorder/`. Other tools may edit these files while you work, so re-read each file right before changing it, and never overwrite edits you did not make.

## 1. The new journey (one continuous scroll, no clicks or choices)

| # | Scene | What happens |
|---|---|---|
| 0 | **Intro** | Unchanged (big DAX / MANUEL name, laptop hero, 0→100 loader). |
| 1 | **Hack Atlantic** | Unchanged. |
| 2 | **Workstation: Ultra Maritime + Formula SAE desk** | The MacBook flies from Hack Atlantic to the **two-monitor desk** (today's Ultra Maritime desk) and is **set down** on it. Left monitor = **Ultra Maritime**: shows info about what Dax worked on there. Right monitor = **Formula SAE**: shows a **preview of the FSAE car model**. The camera first holds on the Ultra Maritime monitor, then moves to the FSAE monitor. |
| 3 | **Formula SAE car** | The camera **zooms smoothly into the FSAE monitor**. Its preview becomes the real 3D car model with the existing diagrams/callouts (today's Formula SAE station content). |
| 4 | **Ultrawide → Projects** | After FSAE: a **normal zoom out, then zoom in** onto the **ultrawide monitor**. The ultrawide desk now stands **where the two-monitor desk stands today** (the old Ultra Maritime location). Its screen shows a **preview of the Projects reel** (the scrolling cards animation). The camera zooms smoothly into the ultrawide screen until it fills the viewport, then the existing DOM Projects reel takes over seamlessly. |
| 5–6 | **Resume → Contact** | Unchanged: the last reel card opens onto the live shared desk, then Resume (printer) and Contact (notebook links). |

### MacBook rule (hard requirement)
After the MacBook is put down on the Workstation desk (scene 2), it must **not be visible anywhere else on the site**: not in the FSAE car scene, not on the ultrawide desk, not in Projects, Resume or Contact. Hide it (`visible = false`) from the moment the camera leaves the Workstation for the FSAE zoom onward. When scrolling backward, it must reappear exactly where it was docked. Remove the current "dive into the MacBook screen" (`applyDive` targeting `Journey_MacBook_Screen`); the dive target becomes the **ultrawide monitor screen**.

### Global constraints
- Everything is a pure function of scroll progress: reverse scrolling replays every move backward, and direct seeks (chapter links, `#hash`, refresh restore) land in the identical state.
- **Smooth, continuous camera.** No cuts except where a monitor fills the viewport and its screen content is swapped for the destination at the same framing, which must read as seamless.
- Zooming into a monitor must not blur readable text. The FSAE monitor shows a car image (fine). The ultrawide preview must match the first frame of the DOM reel at the end of the zoom (same layout, colours and card positions), so the hand-off has no visible jump.
- The Ultra Maritime monitor content is **text Dax provides**. Do not invent facts about his work. Use the existing Figma `Screen / Ultra Maritime` / `Screen XL / Ultra Maritime` content if it has real copy; otherwise use clearly marked placeholders and list them in your final report.
- **No changes to the Projects reel** (cards, titles, layout, scroll length per card, hand-off to the desk).
- Keep the Hack Atlantic, Resume and Contact behaviour, the notebook hotspot links, the print button, the loader, and the intro name exactly as they are.
- Phone (≤ 700 px) and reduced-motion / static mode must have sensible variants. Reduced motion uses crossfades instead of zooms; static mode shows stills in the new order and keeps the project card list.

## 2. Step 1 — Plan (write `station-reorder-plan.md` in the project root)
Cover: the new station order and indexes, and how `IDS` / `NAMES` / hash anchors map to it (keep `#ultra-maritime`, `#formula-sae` and `#projects` working). Then cover world placement of each desk, and each transition with scroll budget in units. For each transition, give 10/30/50/70/90 % keyframes, the camera poses, MacBook visibility, and which screen textures are needed. Close with the risks and the test changes. Recommended placement, which you should verify for clearance:
- Two-monitor Workstation desk at a new slot after Hack Atlantic (e.g. the current FSAE slot ≈ x 3.75), with a laptop dock pose on the desk.
- FSAE car scene does not need to sit on the travel line, because it is reached by the monitor zoom. Place it where it cannot be seen from other stations.
- Ultrawide desk at the current Ultra Maritime origin (≈ x 6.0). Reuse the ultrawide geometry from `station-projects.glb` / its `.blend` and `ultrawide-monitor-clearance-plan.md` where helpful.
- Shared Resume/Contact desk stays where it is.

## 3. Step 2 — Figma storyboard (Figma MCP)
- Inspect the file first and match the existing motion-board style: dark frames `#0B0C0D`, cream text, Geist Mono labels, 10/30/50/70/90 % keyframe rows.
- Add a new section below the existing boards with one row per transition:
  1. Hack Atlantic → Workstation, ending with the laptop set down.
  2. Ultra Maritime monitor hold → pan to the FSAE monitor.
  3. Zoom into the FSAE monitor, then the car with its diagrams (MacBook hidden from here on).
  4. FSAE → zoom out → zoom in to the ultrawide monitor with the Projects preview.
  5. Ultrawide screen → DOM reel hand-off, showing the matching first frame.
- Create or update the screen components: `Screen XL / Ultra Maritime` (Workstation left monitor), a new `Screen / FSAE car preview` (right monitor), and a new `Screen XL / Projects reel preview` for the ultrawide. The reel preview must match the reel's first frame: headline `PROJECT 01` / `Hack Atlantic ATS`, centred portrait card with dashed frame, next cards on the right, counter `01 / 04`, `SCROLL TO CONTINUE`.
- Mark the old frames (old "05 / Projects" ultrawide route, old Ultra Maritime → Projects exit, the MacBook-screen dive row in `138:12987`) as superseded, but do not delete them.
- Return node IDs and take one screenshot per new row to verify there is no clipped or overlapping text.

## 4. Step 3 — Blender (Blender MCP)
- Build or move the scenes per the plan:
  - Two-monitor Workstation desk at its new origin, with the laptop dock pose and real monitor screen meshes that have UVs for the two screen textures.
  - FSAE car scene with its existing diagrams/callouts.
  - Ultrawide desk at the old Ultra Maritime origin, with a screen mesh that has UVs.
- Re-author the journey animation (hero rig + travel camera): Intro → Hack Atlantic → Workstation landing. Remove the old laptop flights to FSAE, Ultra Maritime and Projects. Keep the Intro and Hack Atlantic moves identical.
- Author camera poses for: the Workstation wide shot, the UM monitor close, the FSAE monitor close, the FSAE car wide/close, the ultrawide wide, and the ultrawide screen-filling end pose. The FSAE→ultrawide move is "zoom out, then zoom in" (no flip or roll).
- Render the screen textures (UM info, FSAE car preview from the real car model, Projects reel preview), and the posters and stills for every new station. Then export via the existing pipeline (`web/scripts/prepare-assets.mjs`, meshopt GLBs, `journey.json`).
- Verify headlessly (Workbench or EEVEE renders at each keyframe) that no geometry clips the camera, nothing from another station is visible, and the MacBook is absent after the FSAE zoom begins.

## 5. Step 4 — Website (`web/`)
- `journey.ts`: rebuild the phases for the new order. Generalize the monitor dive into a reusable "screen zoom" phase so it can be used twice: FSAE monitor → car, and ultrawide → reel. Keep the reel and hand-off phases exactly as they are now.
- `scene.ts`:
  - Generalize `screenFrame()` / `applyDive()` to take any named screen mesh.
  - Swap screen materials to the right textures; crossfade the monitor preview into the destination scene when the screen fills the viewport.
  - Hide the hero after the Workstation (rule above).
  - Load only the needed GLBs and prefetch the next one.
  - Remove the dive into the MacBook screen.
- `reel.ts`: only change which phase triggers the reel fade-in (the ultrawide zoom instead of the MacBook dive). The reel's cards and behaviour stay the same.
- `camera.ts` / `journey.json`: new station poses. Keep the responsive width logic.
- Static mode: update the stills order, the posters and the chapter list.
- Update the tests:
  - `journey.test.ts`, `camera.test.ts`, `reel.test.ts`, `tests/browser.mjs` (phase list, total units, joins).
  - Add tests: MacBook hidden after the Workstation and back on reverse; every screen-zoom hand-off has no camera jump at its visible joins; `#ultra-maritime`, `#formula-sae` and `#projects` land in the right scenes.
  - Remove or retire tests that only covered the deleted laptop routes (`projects-motion`, the old desk arrival), with a note in the plan.

## 6. Step 5 — Verification (required before you report done)
- Run `npx tsc --noEmit`, `npm test` and `node tests/browser.mjs` (browser regression, desktop 1440×960 and phone 390×844). All must pass.
- Capture screenshots at 10/30/50/70/90 % of every new transition (desktop and phone). Compare them to the Figma storyboard and list any differences.
- Scrub the whole journey forward and backward and confirm:
  - The MacBook is never visible after the Workstation.
  - The ultrawide → reel hand-off is seamless.
  - The FSAE monitor → car transition is seamless.
  - The Projects reel, Resume and Contact behave exactly as before.
- Final report: what changed (files, Figma node IDs, Blender files), every placeholder still needing Dax's content (the Ultra Maritime monitor copy in particular), and any open questions.
