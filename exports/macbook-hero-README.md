# MacBook Pro M5 replacement

Updated September 30, 2026. The user-supplied model replaces both the travelling MacBook and the personal desk laptop. The other three portfolio stations are unchanged.

## Delivery

- `../blender/macbook-hero.blend`: editable standalone model, studio setup, and lid animation.
- `macbook-hero.glb`: laptop hierarchy, embedded native textures, and opening clip.
- `macbook-hero-validation.json`: geometry checks, hinge sweep, and round-trip measurements.
- `../blender/portfolio-elements.blend`: full portfolio with the updated personal desk.
- `../blender/portfolio-elements-with-macbook.blend`: combined portfolio and hero scenes.
- `../blender/previews/macbook-m5-open.png`, `macbook-m5-closed.png`, and `macbook-m5-roundtrip.png`: reviewed renders.

Original deliveries are preserved in `../blender/archive/macbook-original/` and `archive/macbook-original/`. The supplied Downloads files remain untouched; a project source copy is at `../assets/models/macbook-pro-14-inch-m5/source.glb`.

## Model and controls

Native geometry, UVs, keyboard legends, ports, logo, wallpaper, and materials are retained. Earlier Figma textures are not applied to this replacement. One Blender unit is one meter; GLB is Y-up. The model has 44 meshes, 28 materials, 163,918 triangles, and 48 exported nodes. The GLB embeds 11 images and is 12,651,936 bytes. Closed dimensions are approximately 311.7 × 224.1 × 17.9 mm.

- `MacBook_TravelRoot`: translation along the portfolio path.
- `MacBook_SpinPivot`: independent rotation during travel.
- `MacBook_BaseGroup`: the 30 fixed body meshes.
- `MacBook_LidPivot`: the 14 moving display meshes.
- `MacBook_Screen`: separate display with native wallpaper and UVs; visible area approximately 301 × 196 mm.

The replacement changes the hinge offset. In Blender and the exported GLB, use `lid.rotation.x = (110 - openingDegrees) * Math.PI / 180`. Closed is +110° around X; open to 108° is +2°. Use direct control or an animation mixer, so only one system writes the lid transform.

`MacBook_Lid_OpenClose_M5` is a three-second clip at 30 fps: closed at frame 1, open to 108° at frame 31, hold to frame 61, and closed at frame 91. No travel animation is embedded. The personal desk copy is statically open to 108°; its lowest base point is at 0.7401 m above the scene floor, just above the 0.74 m desktop.

## Validation and remaining integration

Passed finite-coordinate, unit-scale, UV-presence, and zero-degenerate-triangle checks. The lid sweep passed at 3° increments from closed through 108°, excluding intentional mechanical contact within 15 mm of the hinge. GLB round-trip preserved 48 nodes, the animation clip, and open dimensions. Open, closed, and re-imported renders were visually reviewed. The updated personal desk also passed export round-trip checks.

The working triangle budget is 180,000 to preserve the supplied model's detail. Browser optimization remains pending: the hero is approximately 12.7 MB and retains the source's layered geometry and material count. Browser rendering, HTML screen alignment, and the scroll journey are not yet implemented. Studio lighting in the previews must be recreated in the website.

## Reproduction

The replacement scripts are a one-time migration from the archived original master. Import the supplied source into a scene named `MacBook M5 Inspection`, rotate its imported root by −90° around X and update the dependency graph, then run `../blender/replace_macbook_m5.py` followed by `../blender/export_macbook_m5.py`. The earlier simplified hero build script is superseded by this replacement.
