# Room source handoff

`room-additions.glb` is a source-review export of the exact runtime room, lamp, frame, and painted wall name. It is not downloaded by the website. The website builds these small primitives directly and reuses the original compressed desk GLB.

Rebuild:
1. Start the local preview.
2. From `web/`, run `node scripts/export-room.mjs`.
3. Through Blender MCP, execute `blender/build_room_review.py`.

This writes `blender/portfolio-room.blend`, preserving `blender/scene-realism.blend`. All image assets are packed in the review file. Browser lighting is the delivery reference; Blender uses its own renderer and has slightly different exposure and fill.

`about.png` is the generated laptop image. `blender-review.png` is the saved Blender render. CC0 walnut provenance is in `web/public/assets/room/sources.json`. The linen normal is original procedural artwork.
