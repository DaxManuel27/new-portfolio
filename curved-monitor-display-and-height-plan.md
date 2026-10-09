# Curved monitor display and height fix

Status: implemented. See implementation results below.

## Desired result

The Personal Projects content follows the curved monitor’s physical screen, including its angled edges. Raise the monitor panel until the laptop screen no longer overlaps it, with a small visible gap in the desk overview and Projects close-up.

## Reference and current findings

The supplied screenshot shows a dark rectangular content area with straight edges inside a curved black bezel. The laptop occupies the same vertical screen space as the monitor’s lower edge. Preserve the existing dark palette, cream typography, monitor proportions, laptop placement, lighting, and recent name placement.

The active application is `web/src/workspace.ts`, not the older scroll-based portfolio. In this application:

- `blender/scene-realism/approved-six-fixes.py` already builds `Monitor_CurvedHousing` and `Screen_Ultrawide_Projects_Curved` with a shared curve function and 64 horizontal segments. Its radius parameter is 1.4 metres in model space. Inspect the shipped mesh before assuming that its export matches the source.
- `WorkspaceScene.surfaceRect()` reduces the projected screen vertices to an axis-aligned rectangle. `workspace.ts` then positions the live `.desk-content` inside that rectangle. This discards the screen’s curvature and explains the flat Projects layer in the screenshot.
- `surfacePose()` in `web/src/surface-focus.ts` frames the physical screen. Its target must follow the raised screen and account for its entire curved outline.
- The older ultrawide plans describe another application path. Their texture-mapping approach can inform this fix, but their implementation status does not prove that the current workspace is fixed.

## 1. Establish the baseline

Save the current source and asset state before implementation. Identify the current authoritative Blender file and export sequence, including any scripts applied after `approved-six-fixes.py`.

Capture the desk overview and direct `#projects` view at desktop, wide desktop, and mobile sizes. Inspect the actual shipped GLB’s screen vertices, UVs, bezel geometry, monitor stand, and laptop lid. Record the current projected overlap and panel height.

## 2. Render Projects on the curved screen

Use the existing curved screen mesh as the visible display surface. Paint the current Projects content—“Personal projects” and “More to come.”—into a canvas texture and apply it to that mesh with an unlit material. Derive text, fonts, colours, and spacing from the same content source as the accessible HTML. Wait for the fonts before painting.

Remove the visible rectangular HTML layer for Projects only. Keep an accessible semantic equivalent and the existing Back to desk and Escape controls. Do not change the laptop or notebook content rendering as part of this fix. There are no project links in the current placeholder; any future interactive screen content will need an explicit input/accessibility mapping rather than an invisible clickable rectangle.

Verify that the display mesh follows the housing at the centre and both edges, stays inside the bezel, and has a small consistent surface offset without flicker. Repair the mesh or UVs only where measurement shows a mismatch. Keep the existing subdivision count unless close-up inspection reveals faceting.

Use a texture sized for the panel’s aspect ratio, targeting up to 4096 pixels wide within device limits. Refresh after content/font changes and relevant layout changes, not every animation frame. Keep a curved baked fallback if painting fails. The exported geometry and runtime screen texture must both preserve the curve.

## 3. Raise the monitor panel and support it properly

Measure the projected laptop lid top and monitor bottom along the area where their horizontal extents overlap. Raise the screen, bezel, and rear housing together by the smallest amount that removes the overlap across the agreed views. Target an approximately 16–24 pixel gap at the reference desktop size, with positive clearance at smaller sizes; determine the world-space lift from measurement rather than guessing a fixed distance.

Keep the monitor foot on the tabletop. Extend or reposition the stand’s vertical support and attachment to meet the raised panel, preserving a believable construction. Record the lift as one authored parameter so export/rebuild operations reproduce it. Blender uses Z-up; the web scene uses Y-up, so apply the conversion once.

Keep the laptop’s size, lid angle, and desk position unchanged. Check that the raised monitor still fits below the top of the overview and does not collide visually with navigation or labels. Adjust the Projects focus target to the new screen position; change camera framing only if needed to preserve the full monitor and its visible gap.

## 4. Export and integrate

Update the authoritative Blender source/script, then regenerate the affected desk asset and manifest through the existing scene-realism export/compression pipeline. Update affected baked lighting if the moved panel or extended stand invalidates its shadows.

Retain the screen material identity and `Root_monitor` destination mapping. Verify that mesh joining/compression preserves curvature, UVs, material identification, and the raised assembly. Recompute Projects label placement and focus framing from the updated geometry.

Likely files:

- `blender/scene-realism/approved-six-fixes.py`, or a dedicated reproducible follow-up script and the active `.blend` file.
- `blender/scene-realism/export-preview.py` and `web/scripts/encode-reference-desk.mjs` only if export changes are necessary.
- `web/src/workspace-scene.ts`, `workspace.ts`, `workspace.css`, and `surface-focus.ts`.
- A small Projects texture painter and focused regression tests.
- Generated scene-realism GLB, manifest, and affected textures/lightmaps.

## 5. Acceptance checks

- The entire Projects picture follows the curved bezel in overview, close-up, and intermediate camera angles. No flat rectangle appears when the content arrives.
- The laptop screen and monitor display/bezel do not overlap in the overview or Projects view, including mobile and wide desktop. Check intermediate transition frames too, and adjust the camera path if they introduce overlap.
- The stand remains seated on the desk and connected to the panel; the raised monitor is fully framed.
- Fonts remain readable and screen colours stay consistent before and after focus.
- Direct `#projects` loading, Back to desk, Escape, browser history, resize, keyboard focus, and reduced motion work.
- Add focused checks for exported screen curvature/UV integrity and projected monitor–laptop clearance. Run the production build and relevant existing surface-focus/navigation tests.
- Deliver before/after overview and Projects screenshots, an angled screen-edge close-up, and the measured panel lift and minimum visible gap.

Completion means both fixes are present in the shipped preview and survive asset regeneration.

## Implementation results

- Removed the visible flat Projects overlay. Shared Projects copy is painted onto the existing 64-segment curved mesh, with accessible HTML retained and larger type on mobile.
- Raised the panel/housing 120 mm in world space and extended the stand while retaining its grounded base. The idempotent `blender/scene-realism/raise-monitor.py` records the authored lift in the Blender file.
- Re-exported the source and compressed GLBs. Geometry-only export reuses unchanged KTX2 textures through `DAX_REUSE_TEXTURES`; the normal texture encoding path remains available.
- Projects labels now attach lower on the panel to clear the navigation. Focus targets follow the updated mesh.
- Build and all 7 surface-focus tests passed. `web/tests/monitor-display.mjs` validates source/export fidelity, actual shipped curvature, grounded stand, and 61 transition positions at each of four viewport sizes. Minimum gaps: 18.6 px at 1469×785; 23.7 px at 1440×1000; 25.6 px at 1920×1080; 6.9 px at 390×844.
- Browser checks: direct Projects loading, overview, desktop/mobile close-up, resize, Back to desk, Escape, and no browser errors. Reduced-motion handling uses the existing instant camera path; no OS preference change was made to test it live.
- Backups are in `backups/monitor-display-height/`.
