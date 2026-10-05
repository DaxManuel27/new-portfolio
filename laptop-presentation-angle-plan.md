# Natural laptop presentation angle

Status: planned, 2026-10-02. No model, animation or camera changes applied yet.

## Intended result

As the view approaches an open laptop, its keyboard extends toward the viewer and the display leans away naturally. The base remains flat on the desk. The settled composition should resemble looking at a laptop from a normal seated position, with visible keyboard and trackpad depth.

## Current findings

The Hack Atlantic, Ultra Maritime and Projects close-up cameras all look downward by approximately 12 degrees. They share the same docked lid quaternion, equivalent to a 4-degree local hinge rotation. That local rotation is relative to the imported model and is not the physical screen opening angle; measure the actual screen/base planes before selecting a correction.

The live view uses an orthographic camera, which removes perspective taper and makes the nearly frontal keyboard look shallow. The approach currently blends the camera and docking pose together, with extra framing coordination for these three stops. Projects also has a subsequent display dive and reel that must join the corrected hold cleanly.

## Implementation

1. **Capture and measure.** Save the present camera/dock configuration and desktop/portrait captures at the start, middle and end of each affected approach. Measure the display plane relative to the keyboard plane and identify which hinge direction tilts the screen away from the viewer. Use these measurements rather than guessing the sign of the imported hinge rotation.

2. **Set a natural open pose.** Test a physical opening of approximately 105–110 degrees between the display and keyboard. Keep the feet, base position and whole-laptop orientation fixed on the tabletop. Change the hinge pose only. Apply a consistent presentation pose at Hack Atlantic, Ultra Maritime and Projects; preserve the intentionally closed Formula SAE overview and the floating closed Intro.

3. **Raise the viewing angle.** Test a downward camera angle of approximately 20–25 degrees, aimed at the combined screen/keyboard silhouette. Adjust camera height, target and framing together so the complete base, trackpad and lid stay visible, with comfortable margins on desktop and portrait. Retain orthographic projection for this correction initially; a global perspective conversion would also change station framing and projected interactions. Judge the result from captures, and only expand that scope if the corrected angle still looks unnatural.

4. **Coordinate the approach.** Blend from the existing travel-boundary camera into the corrected close-up in one uninterrupted eased move. The laptop should settle onto its feet before reaching the final presentation pose. Avoid any whole-body pitch that lifts the front or rear feet, late lid snap, extra camera stop, or overshoot. On departure, retrace the compatible transition continuously. Keep absolute-time sampling so forward, reverse and direct seeks produce identical poses.

5. **Preserve the Projects screen transition.** Derive the display dive from the corrected live screen plane. Verify its first frame matches the new hold camera and lid exactly, and its endpoint still aligns the project reel without stretching, a jump or a sudden angle change.

6. **Save through the canonical pipeline.** Record the chosen open angle and camera poses in the Blender source/export configuration, regenerate affected manifest/export data and posters, and retain backups. Update browser pose/framing logic only where needed. Keep any existing close-before-transfer behavior compatible with the new open pose; implementing the separate pending transfer plan is outside this angle correction.

## Validation

- Compare matched start/middle/end captures at all three affected stops, on desktop and portrait. The display leans away, keyboard depth is visible, silhouette is uncropped, and every foot remains on the desk.
- Sample intermediate approach/exit frames, phase boundaries and forward/reverse/direct seeks. Camera position, rotation, width and hinge pose must remain continuous.
- Re-run geometry clearance checks using the new lid envelope, especially around the ultrawide monitor. A farther-open lid may extend toward the monitor, so the previous clearance result cannot simply be reused. If necessary, shift the dock slightly toward the viewer while preserving desk support and revalidate both travel joins.
- Check the Projects hold → dive → reel transition, including responsive display coverage and pointer alignment.
- Run relevant camera, hero, Projects, desk and printer tests; full browser journey checks; and the production build. Regenerate affected loading/reduced-motion posters after final visual review.

## Main files

- `blender/completion_pipeline.py` and the saved Blender source: canonical station camera and hinge configuration.
- `web/scripts/prepare-assets.mjs`, `web/public/assets/journey.json`: exported station poses and framing.
- `web/src/camera.ts`, `web/src/journey.ts`, `web/src/scene.ts`: approach interpolation, docking and Projects display dive.
- `web/tests/camera.test.ts`, `web/tests/projects-clearance.test.ts`, `web/tests/projects-motion.mjs`: framing, continuity and clearance verification.

Acceptance: the approaching laptop reads as a real supported object with a naturally reclined screen and a keyboard extending toward the viewer, while its existing interactions and safe routes continue to work.
