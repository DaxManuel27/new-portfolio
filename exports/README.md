# Portfolio station asset delivery

The separate travelling MacBook is now available as `macbook-hero.glb`. See [MacBook hero handoff](macbook-hero-README.md) for its pivots, textures, opening clip, and validation. The personal desk now uses the supplied MacBook Pro M5; the other three station exports remain unchanged.

Editable master: `../blender/portfolio-elements.blend`, scene `Portfolio Elements`.

| Asset | File | Evaluated triangles |
|---|---|---:|
| Supplied MacBook Pro M5 and curved ultrawide desk | personal-desk.glb | 168,350 |
| Two 27-inch monitors and official Ultra Maritime logo plaque | ultra-maritime-desk.glb | 3,602 |
| Check-in table, standing banner, two tabletop banners | hack-atlantic-check-in.glb | 4,086 |
| Representative Formula SAE car | fsae-car.glb | 14,816 |

## Import conventions

- One Blender unit is one meter.
- Each exported station root is at the origin, with a floor-level pivot.
- GLBs use +Y up. Blender's -Y-facing desk/banner fronts become +Z-facing in glTF.
- The car's nose likewise faces +Z in glTF.
- Preview ground, lights, camera, and original default scene are excluded from exports.
- Exported geometry includes evaluated bevels and normals. Editable modifiers remain in the Blender master.
- Screen meshes remain separate for later project and internship content.
- Images are embedded in the GLBs and packed into the Blender master.

## Validation

The original assets passed finite-coordinate, non-degenerate-face, unit-scale, and 30,000-triangle-per-station checks. The updated personal desk passes geometry checks under a 180,000-triangle working budget; optimization for browser use remains pending. Each GLB was re-imported into a temporary Blender scene and its dimensions matched the source within 2 mm. The exported node lists contain only their respective station objects. Banner and logo images are embedded.

See `validation.json` for measured dimensions, triangle counts, file sizes, and round-trip results. Banner and screen graphics intentionally use single-sided surface geometry; they are not closed solids.

These are first-pass assets. Three.js rendering and browser performance have not yet been tested. The Hack Atlantic GLB retains full-resolution supplied artwork and is approximately 10.4 MB; texture compression/resizing and draw-call consolidation remain integration tasks once camera distances are known.

## Sources and limitations

- Hack Atlantic artwork and arrangement photo: supplied by Dax Manuel; originals are preserved in Downloads, with project copies in `assets/`.
- Ultra Maritime logo: https://umaritime.com/wp-content/uploads/2026/02/Ultra-Maritime-site-Logo.png, obtained from the official https://umaritime.com/ homepage.
- Desks, monitors, and car: original simplified Blender geometry created for this project. The current MacBook uses the user-supplied MacBook Pro M5 model and its native materials.
- The FSAE car is representative and does not reproduce an actual UNB team vehicle or carry unverified team branding.

## Reproduction

In a fresh Blender file, execute `blender/build_elements.py`, then `blender/build_fsae.py`, then `blender/curve_ultrawide.py`, then `blender/export_elements.py`. The creation scripts refuse to overwrite existing station scenes/collections. Scripts currently use this workspace's absolute asset path.

The current MacBook replacement uses `blender/replace_macbook_m5.py` and `blender/export_macbook_m5.py` as a one-time migration from the archived original master. See the MacBook handoff for preparation steps.
