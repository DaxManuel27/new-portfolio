# Chair armrest fix plan

Status: implemented on 9 October 2026. Both editable Blender scenes, the source export, and the served website asset are updated.

## Intended result

Both chrome armrests extend forward alongside the seat, connect visibly to the side frame, and clear the upholstered backrest. Preserve the chair's current black leather, chrome finish, proportions, placement, and camera framing.

## Reference analysis and likely cause

The supplied screenshot shows straight chrome armrests emerging beside the backrest and projecting toward the viewer. Their junctions appear buried in the backrest instead of reading as deliberate frame connections.

In `blender/scene-realism/rebuild.py`, the seat extends toward local positive Y (center Y = 0.14), but each 0.33-unit arm is centered at Y = -0.09, spanning -0.255 to +0.075. Most of its length therefore extends behind the backrest. The arms are centered at X = ±0.26 with width 0.026, giving inner edges at ±0.247; the backrest core reaches ±0.255. This produces approximately 0.008 units of lateral overlap before bevels. Confirm these dimensions against the active Blender scene and browser export before changing anything; downstream adjustments may differ.

## Implementation

1. Identify the Blender scene and export currently loaded by the website. Record both armrest transforms, chair-local bounds, and baseline screenshots from the supplied angle plus side and top views. Save a recoverable copy before editing.
2. Reposition `Chair_Chrome_Arm` and `Chair_Chrome_Arm.001` symmetrically toward local positive Y, alongside the seat. Use the backrest frame as the rear endpoint and the seat's front edge as the forward limit. A starting center Y near +0.165 retains the existing 0.33 length with endpoints near 0 and +0.33; finalize against the actual scene.
3. Move the arms outward enough to clear the upholstery along their full length. A starting X near ±0.28 gives about 0.012 units of clearance to the current backrest core. Verify actual beveled geometry, rather than relying only on object origins.
4. Connect each rear endpoint to its chrome side rail with a short, intentional bracket if required by the outward offset. Keep any connection overlap inside the metal joint, with no metal passing through leather. Preserve existing materials, bevel style, parenting, and object names; reuse geometry and textures where possible.
5. Update the chair construction in `rebuild.py` as well as the active scene so regeneration preserves the correction. Export through the existing website pipeline. Refresh affected baked lighting and fallback imagery if they contain the old armrests or their shadows.

## Validation

- Inspect front, rear, side, and top views: no armrest penetrates the leather or extends behind the rear frame, apart from its deliberate mounting joint.
- Check both arms for symmetry, visible frame attachment, and appropriate reach beside the seat.
- Compare the website against the supplied screenshot at the same framing. Check the normal overview and camera transitions at desktop and narrow widths.
- Confirm that the new export is actually loaded, materials and lighting remain consistent, and nearby desk geometry is clear.
- Capture before/after images from the supplied angle and a side view. Run the existing website build after updating served assets.

Deliverable: corrected editable chair, matching browser asset and affected lighting/images, plus comparison screenshots. No redesign or new texture set is required.


## Implementation results

- Arms now sit at local X = ±0.28 and Y = 0.165, extending from Y = 0 to 0.33 toward the seat.
- Two chrome mounts join the arms to the side rails. Imported browser geometry confirms 0.0120014 m clearance from the backrest on both sides and no intersection.
- Updated `blender/scene-realism.blend` and `blender/portfolio-room.blend`; regeneration runs `blender/scene-realism/fix-chair-arms.py`.
- Updated all three existing desk GLBs with `blender/scene-realism/sync-chair-assets.py`, preserving their compressed binary geometry and textures. Removed obsolete arm lightmap references so the moved chrome uses live scene lighting.
- Website production build passed. Browser checks passed with no page errors at desktop and mobile sizes. Rear, side, and top screenshots were inspected.
- Evidence: `exports/chair-fix/verification.json`, `before.png`, `after.png`, `rear-close.png`, `side.png`, `top.png`, and `mobile.png`. Recoverable originals are in `exports/chair-fix/backup/`.
