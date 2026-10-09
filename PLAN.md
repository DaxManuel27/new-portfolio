# Desk realism and reference-match implementation

Status: user explicitly confirmed following the pasted brief exactly. Earlier content choices are superseded. Phase 1 baseline underway.

## Inputs and decisions

- Requested task: attached `Pasted text.txt`, titled “Rebuild the 3D desk scene to match the reference render 1:1”.
- Available concept: `design/interactive-workspace/sources/desk-concept.png`. No newly attached reference render/current screenshot accompanies the pasted instructions; `reference/target.png` and `reference/current.png` do not exist yet.
- Pending: apply the new realism/UI targets while retaining the current content choices, or follow the pasted brief literally (plant/mug return; monitor becomes Ultra Maritime; UM notebook becomes sketchbook; laptop becomes sunset illustration; résumé moves off the tray).
- No receiver or printer animation is requested by the new brief; these remain static either way.
- No existing asset files will be deleted. Replaced production assets will be retained under `assets/_legacy/`; existing Blender source remains backed up.
- Pixel alignment and performance targets will be measured, not asserted without evidence.

## Repository audit

This is Vite + TypeScript + plain Three.js 0.186.1 + GSAP, not React Three Fiber.

Production entry: `web/src/main.ts`; scene: `web/src/scene.ts`; styles: `web/src/style.css`. Existing routes/anchors and project content live in `journey.ts`, `projects.ts`, `fsae-projects.ts`, `hack-atlantic.ts`, and `ultra-screen.ts`. Production remains the scroll-driven portfolio; the new desk is a standalone asset-review page.

Current desk source: `blender/interactive-workspace.blend`, scene `Interactive Workspace`. Runtime preview: `exports/interactive-workspace/viewer.html`. Runtime mapping: `exports/interactive-workspace/manifest.json`. Compression: `web/scripts/prepare-interactive-workspace.mjs`.

Current combined asset: 4,472,068 bytes, 162,206 exported triangles, 87 material primitives. Only animation: `Notebook_Open`, 1.2s. Export uses Meshopt geometry and WebP textures; KTX2 tooling must be checked before promising Basis delivery.

| Root | Source / construction | Current appearance |
|---|---|---|
| Desk | Procedural beveled boxes | Pale ivory top, thin dark legs; no cabinet |
| Root_monitor | Existing station GLB | Curved screen, personal-projects artwork |
| Root_macbook | Existing detailed MacBook GLB | Silver, original Hack Atlantic landing-page screenshot |
| Root_car | Existing FSAE GLB | Simplified red body, exposed frame |
| Root_pi | Existing Pi GLB | Green PCB, metal ports, black chips |
| Root_notebook | New procedural hinged covers and page block | Ivory UM-branded cover, two factual inside pages |
| Root_pen | Existing pen GLB | Black and metallic |
| Root_printer | Updated shared-desk Blender source | Dark printer; permanent static résumé on output tray |
| Root_phone | Existing rotary-phone GLB plus connector/label | Oxblood; static receiver and cord |
| Stage | Procedural floor | Dark surface; no wall or chair |

Plant and mug were explicitly removed in the previous revision. Source assets remain available.

Production renderer: sRGB output; AgX tone mapping; exposure .85; DPR capped at 1.5; room/HDR environment .45 intensity; warm directional key with 2048 shadow map; area key/fill and dim hemisphere fill. Existing `PCFSoftShadowMap` usage requires migration for the installed Three.js version.

Desk preview renderer: ACES, DPR cap 2, PCF shadow map, hemisphere fill and three directional lights. No HDR reflections, baked lightmap, editorial overlay, outline selection, or postprocessing. Cameras/object bounds are recorded in the manifest; the scene uses Z-up metres in Blender and Y-up metres in GLB.

## Phases and files to touch

### 1. Audit and reference baseline
- Resolve content direction and establish the actual target image.
- Save reference/current captures under `reference/`; capture running site at 1440×1000.
- Export full scene/material/light/camera inventory to `reference/audit.json`.
- Record routes and interaction behavior that must be preserved.
- Create side-by-side baseline in `reference/compare/`; update Diff log; commit only this phase's files.

### 2. Figma textures and overlay
- Read the Figma creation/design skills; create the requested “Dax Portfolio – Scene Textures” file.
- Build shared variables, editable texture frames, and 1440×1000 overlay.
- Use the confirmed content direction for monitor, laptop, notebook and résumé artwork.
- Preserve existing approved originals; add new exports under `design/scene-realism/`.
- Implement CSS tokens only after reading design context/variables from the finished Figma frames.
- Capture/compare at 1440×1000, record differences and commit.

### 3. Blender geometry and materials
- Preserve current .blend; create revised source and repeatable authoring scripts under `blender/scene-realism/`.
- Match camera and desk footprint before details; cabinet, rounded laminate top, flat monitor, anodized laptop, black/carbon FSAE body and original generic decals, pale printer, left-running coiled phone cord.
- Add/retain notebook, résumé, foliage, mug, and chair according to confirmed direction.
- UV and surface review; 2K hero textures, 1K small props, metre scale; retain semantic destination roots.
- Capture/compare, record residual silhouette/material differences and commit.

### 4. Lighting and bake
- Cycles lighting look development with warm large key, weak cool fill, warm wall pool and dark ambient.
- Bake static light/AO/contact shadows to dedicated UV channel; verify colour-space handling.
- Retain low-contrast HDR reflections for real-time props; avoid baking directional specular into albedo.
- Compare Blender and browser at the same camera; record differences and commit.

### 5. Runtime integration
- Add dedicated workspace controller/modules in `web/src/`, integrate via `main.ts` and existing accessible content/routes.
- Real projected callout buttons, headline/nav/CTA, keyboard/touch focus, reduced-motion support, single warm hover/selected outline; laptop highlighted initially.
- Add dev-only `?overlay=1` reference alignment; keep debug assets out of production bundle.
- Screen materials crisp and correctly oriented; load validated lightmaps/HDR; lazy load, DPR cap, responsive framing and collision-free labels.
- Export `desk.glb` or semantic per-object assets; evaluate KTX2/Basis availability; target <=10 MB total initial 3D download including necessary texture/lightmap/HDR assets.
- Capture/compare and regression-check existing destinations; commit.

### 6. Verification and handoff
- Capture at 1440×1000 and 1280×800 plus mobile; side-by-sides in `reference/compare/`.
- Measure reference landmarks; report whether each falls within 2% of frame dimensions.
- Run build, relevant route/interaction tests, browser visual checks, desktop Lighthouse (target >=80), and measured frame-time test. Report hardware/test conditions and any unmet target.
- Write `docs/assets.md` with Blender/Figma sources, export/bake instructions, licensing/provenance, and remaining diffs.
- Commit completed phase; do not publish/deploy merely to verify locally.

## Risks

- Literal image replication conflicts with recent user-approved content; resolve before replacing those choices.
- Only the original concept image is currently available; a different intended target would change camera/layout work.
- Existing car is simplified; black material alone cannot create the detailed reference silhouette.
- Bakes depend on final geometry and camera-independent UVs; rebaking after layout changes is expected.
- Current résumé artwork is a placeholder, not a complete CV; do not invent personal credentials.
- KTX2 encoder/Lighthouse availability and measured device performance are not yet verified.
- Current workspace files are untracked and some binary assets ignored by Git; phase commits must explicitly include intended deliverables without sweeping unrelated work into a commit.

## Diff log

### Initial repository inspection (not a completed visual phase)
Current desk lacks cabinet/chair/wall and editorial overlay. Monitor is curved. Car is red and visibly simplified. Printer is dark. Lighting in the browser lacks the reference's soft reflection/contact-shadow treatment. Recent choices intentionally differ in screen content, UM notebook, résumé placement, and removal of plant/mug. No new fixed-size baseline or 2% alignment measurements have been recorded yet.

## Final checklist

- [ ] Confirm target image and content/layout direction.
- [ ] Warm matte rounded desk, cabinet and confirmed foreground objects.
- [ ] Flat monitor and confirmed screen artwork.
- [ ] Silver laptop, confirmed screen artwork, warm selection glow.
- [ ] Detailed black/carbon FSAE car with original 01 / E-01 decals.
- [ ] Correct supporting props, static phone/printer/résumé.
- [ ] Lighting, contact shadows, reflections, vignette.
- [ ] Accessible editorial overlay and projected labels.
- [ ] No unintended logos/watermark; artwork provenance documented.
- [ ] Fixed-size comparison screenshots and quantified landmark alignment.
- [ ] Desktop Lighthouse >=80 and initial assets <=10 MB, measured.
- [ ] Existing routes/content preserved; rebuild steps documented.

## Confirmed direction
Follow the pasted prompt exactly (user confirmation). Restore plant/mug, UM monitor, sunset laptop, open engineering sketchbook, separate resume, cabinet and chair. Reference target copied from the original generated desk concept.

### Phase 1 — fixed-size baseline
Captured running desk preview at 1440×1000 in `reference/current.png`; target/current side-by-side: `reference/compare/phase-1-audit.png`. Full source graph, materials, maps, camera and lights recorded in `reference/audit.json`. Target uses much larger laptop/car relative to desk, lower desk front edge around 73%, flatter and lower monitor, smaller background printer, foreground chair, warm directional reflections and soft contact shadows. Baseline has hard shadows, too much empty top area, no headline/callouts, and different prop materials. Phase 1 audit complete.

### Provisional geometry/bake checkpoint — Figma dependency pending
User confirmed literal pasted brief. Figma whoami returned two teams; file-creation skill explicitly requires choosing a plan when multiple are present. Async choice requested: dax.manuel's team (Full/admin) or yousef.khirallah's team (View). No answer received yet, so no new Figma file created.

Independent geometry work staged in `blender/scene-realism.blend`: flat monitor, enlarged laptop, black car with layered aero/generic race text, cabinet, leather/chrome chair, pale printer, open untextured sketchbook, separate resume, restored foliage/mug. Cycles lighting pass completed and 30 static diffuse-irradiance maps baked onto separate UV channels. Original .blend preserved under assets/_legacy.

Browser checkpoint at 1440×1000: `reference/compare/geometry-provisional.jpg`; target comparison `reference/compare/geometry-side-by-side.png`. Export's UV1 was initially pruned, then retained using keepAttributes. Browser leaf sheen initially exported white; corrected source tint. No browser errors in checkpoint.

Current provisional export: 6,598,568 bytes, 195,845 triangles, 96 material primitives, no animation. Compressed lightmaps add 595,356 bytes; HDR and final Figma textures still need final budget accounting. These are WebP + Meshopt, not yet KTX2.

Remaining differences: monitor still has old personal-projects artwork pending Figma; blank sketchbook and incomplete resume artwork; missing editorial headline/nav/projected pills/CTA; car silhouette/livery still less detailed than target; foreground chair and prop spacing need final alignment; browser wall/light contrast differs from Cycles. Do not mark the rebuild complete or claim 2% alignment, 60fps, KTX2 delivery, or Lighthouse score. Production integration not started; current route behavior remains intact.

### Phase 3 — Figma texture checkpoint
- Created **Dax Portfolio – Scene Textures** in the user-selected dax.manuel’s team: https://www.figma.com/design/KGA8JvG2RZ333CXIHkh1OS.
- Eight editable frames, 13 color variables + four spacing/radius variables; reusable callout component with five instances. Overlay contains 13 text nodes and no raster UI. Original ship/globe/car vectors; coast is the existing generated source.
- Exported seven 2× PNG textures and applied them to the Blender scene. Overlay design context and variable definitions saved for the upcoming integration.
- Screenshot: `reference/compare/phase-3-textures.jpg`; comparison: `reference/compare/phase-3-side-by-side.png`.
- **Diff log:** monitor content now matches the required subject, but line art is simpler than the target. Laptop text and coast are present. Paper art is too faint in the current render. Overall light remains too flat/dark on props, contact shadows too weak, wall too black. Car detail/decals, phone dial, plant realism, chair curvature and framing remain materially different. Runtime overlay, KTX2, responsive interactions and performance verification are still pending. This is not a 1:1 completion claim.
