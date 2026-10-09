# Desk fixes implementation plan

Status: Approved by the user and implemented. See verification notes below.

Scope: Only the six fixes below. All other scene content, styling, and behavior remain unchanged.

## 1. Formula SAE and data logging

- Move the Raspberry Pi behind the Formula SAE driver's seat, keeping it identifiable.
- Point the Data Logging label and connector directly to the Pi.
- Keep data logging within Formula SAE, using the existing content and diagram.
- Use a modest camera zoom that shows the Pi in context with the car, rather than moving deep behind the seat.

Acceptance: The Pi sits behind the seat; its label points to it; selecting data logging opens the existing Formula SAE data logging content with contextual camera framing.

## 2. Hack Atlantic laptop screen

- Recover and restore the previous Hack Atlantic landing-page preview from the existing design assets.
- Replace the current sunset/title screen with that preview.
- Preserve the laptop's Hack Atlantic destination and existing content.

Acceptance: The laptop shows the previous landing-page design, correctly fitted to the screen without stretching.

## 3. Ultra Maritime notebook and personal-projects monitor

- Replace the open sketchbook with a closed Ultra Maritime notebook.
- Apply the existing Ultra Maritime logo to its cover.
- Move the Experience / Ultra Maritime label and interaction to the notebook.
- On selection, animate the cover opening and move the camera toward the inside page, which presents the existing Ultra Maritime accomplishments.
- Close the notebook when returning to the desk.
- Reserve the ultrawide monitor for Personal Projects with a simple placeholder until the user provides the projects. Do not invent project content.

Acceptance: The notebook starts closed with the correct logo, opens on selection, presents the existing accomplishments, and closes on return. The monitor is assigned to Personal Projects.

## 4. Printer tray and résumé

- Remodel the output tray with believable depth, thickness, paper supports, and connection to the printer.
- Move the résumé from the desk into the output tray, visibly resting on it.
- Update the résumé label, click target, and camera framing to its new position.
- Keep the paper stationary. Do not add printing or print-preview animation.

Acceptance: The tray supports the résumé without floating or intersecting surfaces; the résumé interaction targets its new position.

## 5. Formula SAE lettering

- Remove E-01, 01, and Engineering Lab from the car, including separate lettering geometry or decals.
- Preserve the car's shape, carbon-fibre finish, and other materials.

Acceptance: None of the specified lettering appears on the car from the overview or focused views.

## 6. Curved ultrawide monitor

- Give the screen and surrounding housing a consistent, realistic horizontal curve.
- Adjust screen mapping so the Personal Projects display follows the curve without stretching.
- Preserve current desk placement unless a small adjustment is necessary to prevent clipping.

Acceptance: Both screen and housing are visibly curved and aligned; screen content remains correctly proportioned.

## Implementation order

1. Recover the existing Hack Atlantic preview and Ultra Maritime logo.
2. Update Blender geometry, placements, and materials for the six fixes.
3. Apply the screen and notebook textures.
4. Update labels, click targets, camera framing, and the notebook interaction.
5. Refresh affected lighting and exports.
6. Check desktop and mobile views, then provide an updated interactive preview and before/after screenshots.

## Verification

- Check all six acceptance criteria in the running preview.
- Verify notebook opening, closing, and return-to-desk behavior, including reduced-motion handling.
- Verify labels follow their objects and remain usable on desktop and mobile.
- Confirm existing Hack Atlantic, Formula SAE, data logging, Ultra Maritime, and résumé content remains accessible.
- Confirm the printer and résumé remain stationary and unrelated scene elements remain unchanged.

## Completion notes

- All six approved fixes implemented in `blender/scene-realism.blend` and the local web preview.
- Existing Hack Atlantic landing-page asset restored from `web/public/assets/hack-atlantic-hero.png`.
- Existing Ultra Maritime cover and both inside-page textures reused. Notebook hinge animates in the browser; reduced-motion preference applies the final pose immediately.
- Pi mounted behind the Formula SAE seat, with its own non-overlapping callout and a contextual camera view.
- Résumé rests on the fixed output tray. No phone or printer animations added.
- Car lettering removed, including the additional Student Motorsport lettering, consistent with removing writing from the car.
- Curved monitor uses a 1.4 m model-space radius, with a matching curved housing and Personal Projects placeholder.
- Pen moved beside the notebook to clear the opening cover. Desk and wall shadows refreshed after object relocation.

### Verification

- Production TypeScript/Vite build passed.
- Existing legacy suite still reports the previously observed `desk-return.test.ts` layout-fixture failure; its source and fixture were not changed by this implementation.
- Three export regression checks passed: interactive hierarchy survives optimization; race lettering and mechanical animation excluded; KTX2/Meshopt compression retained within an 8 MB model budget.
- Browser checks: Data Logging route and car context; Ultra Maritime cover opening and page content; Escape and return to desk; Personal Projects placeholder; résumé destination; mobile touch navigation at 390 × 844.
- No browser console errors during verification.
- Screenshots: `reference/compare/six-fixes/desktop.jpg`, `notebook-open.jpg`, `mobile.jpg`, and `printer-resume.jpg`.
- Existing résumé artwork remains a layout preview; résumé content was outside these six fixes.

### Working files and regeneration

- Backup before this change: `backups/desk-six-fixes/before.blend` and `before.glb`.
- Texture preparation: `node web/scripts/prepare-desk-fixes.mjs`.
- One-time geometry changes: `blender/scene-realism/approved-six-fixes.py`. Do not rerun on the already updated scene; it intentionally guards against duplicate application.
- Affected shadow refresh: `blender/scene-realism/rebake-six-fixes.py`.
- Printer opening finish: `blender/scene-realism/finish-printer-slot.py`.
- Export: run `blender/scene-realism/export-preview.py` in the saved Reference Desk scene, then `node web/scripts/encode-reference-desk.mjs`. Set `DAX_TOKTX` to an installed Khronos `toktx` executable if the temporary encoder path is unavailable.
- Runtime changes: `web/src/workspace-scene.ts`, `workspace.ts`, and `workspace.css`.

