# MacBook hero asset

Implemented September 30, 2026. Standalone asset for the planned scroll journey.

## Files

- `../blender/macbook-hero.blend`: editable standalone scene, studio camera/lights, and lid animation.
- `macbook-hero.glb`: only the laptop hierarchy, embedded textures, and opening/closing clip.
- `macbook-hero-validation.json`: geometry checks, hinge sweep, and round-trip measurements.
- `../blender/previews/macbook-open.png`, `macbook-closed.png`, `macbook-underside.png`: review renders.

The existing desks, banners, monitors, and car remain in `../blender/portfolio-elements.blend`. A combined snapshot is saved as `../blender/portfolio-elements-with-macbook.blend`, with separate `Portfolio Elements` and `MacBook Hero` scenes. The original master and original station GLBs were not overwritten.

## Controls

One Blender unit is one meter. glTF is Y-up; the front of the keyboard faces +Z after export. Travel and spin roots are centered on the base body. There are 10 nodes, six mesh primitives, five materials, and 10,570 evaluated triangles. The closed footprint is approximately 355.6 × 248.5 mm, with a 19.9 mm total closed height including feet. This remains a simplified MacBook-style model rather than an exact generation-specific replica; key legends and branded lid artwork are not included. Side ports are surface inset details.

- `MacBook_TravelRoot`: translation along the portfolio path.
- `MacBook_SpinPivot`: independent travel rotation/full turns.
- `MacBook_BaseGroup`: fixed body, keyboard, trackpad, feet, and ports.
- `MacBook_LidPivot`: mechanical lid opening; all display parts are children.
- `MacBook_Screen`: separate screen mesh with full 0–1 UVs, active area 0.332 × 0.202 m; content can be replaced.

Lid rotation X is `radians(90 - openingDegrees)` in Blender and in this GLB: set `lid.rotation.x = (90 - openingDegrees) * Math.PI / 180` when controlling the imported pivot directly. The exported closed quaternion is approximately `[0.707107, 0, 0, 0.707107]`; the closed rest rotation is +90° around X, and the 108° open pose is −18° around X. Verify rendering in the eventual Three.js scene before authoring the travel timeline. Use either direct control or the animation mixer for the lid, so two systems do not write the same transform.

`MacBook_Lid_OpenClose` is a 3-second clip at 30 fps: closed at 0 seconds, open to 108° at 1 second, hold to 2 seconds, close by 3 seconds. The .blend is saved at frame 31 for an open review pose. The GLB contains the clip and a closed default/rest pose. No travel animation is embedded; its roots are ready for scroll control.

## Textures

Applied the completed [Figma Device PBR textures](https://www.figma.com/design/GHhsIXL0aNThNEEc8sIjjC?node-id=7-2): silver aluminum, separate trackpad material, and black bezel. Screen content uses the earlier Figma `Personal_MacBook_Screen.png`. Base color uses sRGB; roughness and normals use Non-Color. Metallic values are scalars from the texture manifest. Derived tangent-space normal maps preserve the micrograin in glTF. Original Figma exports are preserved. Seamless surface UVs deliberately repeat at 20 mm intervals; screen UVs do not repeat.

## Validation and limits

Passed finite-coordinate, zero degenerate-face, unit-scale, and 15,000-triangle budget checks. Closed solid meshes have no nonmanifold edges; the screen is intentionally a single-sided plane. Tested lid/body intersections at 3° increments through 108°, excluding intentional mechanical contact within 12 mm of the hinge. Round-trip import preserved all 10 nodes, the clip, and open dimensions within 2 mm. Open, closed, and underside compositions were visually reviewed in Blender.

Browser rendering, performance, HTML screen alignment, and the scroll journey remain untested and unimplemented. Warm studio reflections shown in the previews must be recreated by the website's lighting.

## Reproduction

With the original portfolio master loaded and no `MacBook Hero` scene present, execute `../blender/build_macbook_hero.py` through Blender MCP, then `../blender/export_macbook_hero.py`. Build guards prevent overwriting an existing hero scene. The scripts resolve this workspace from their own filesystem location.
