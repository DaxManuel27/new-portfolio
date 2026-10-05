# Monitor and silver MacBook material textures

[Figma — Device PBR textures](https://www.figma.com/design/GHhsIXL0aNThNEEc8sIjjC?node-id=7-2)

Five seamless material designs, each exported as four 1024 × 1024 PNGs: BaseColor, Roughness, Metallic, and Height. These extend the earlier flat swatches with subtle isotropic micrograin. They are original material approximations, not measured Apple or monitor-manufacturer scans. Screen-content textures remain in `../figma/`.

| Set | Surface | Roughness | Metallic | Tile size | Bump distance |
| --- | --- | --- | --- | --- | --- |
| MacBookPro_Silver | Silver aluminum base and display housing | 0.28 | 1 | 20 mm | 0.012 mm |
| MacBookPro_Trackpad | Satin grey glass trackpad | 0.43 | 0 | 20 mm | 0.004 mm |
| Monitor_Housing | Matte graphite enclosure | 0.46 | 0 | 30 mm | 0.025 mm |
| Device_BlackBezel | Smooth black bezel/notch | 0.31 | 0 | 20 mm | 0.008 mm |
| Monitor_Stand | Charcoal coated stand | 0.39 | 0 | 30 mm | 0.020 mm |

The table gives center roughness values; roughness maps contain slight local variation. Stand metallic is zero because the visible surface is an opaque coating. The trackpad uses a dielectric material separate from the aluminum body.

## Blender connections

- BaseColor: sRGB → Principled BSDF Base Color.
- Roughness: Non-Color → Roughness.
- Metallic: Non-Color → Metallic. Uniform maps can be replaced by the table's scalar values.
- Height: Non-Color → Bump Height; Bump Normal → Principled Normal. Start at Strength 0.2 and the distance in the table. Height is a microdetail map, not a tangent normal map or geometry displacement map.
- Use the same coordinates for all four maps. Image extension: Repeat. Set UV density so one tile covers the physical tile size above; map units consistently across body/lid/stands. Periodic edge-wrapped dots avoid geometric discontinuities at tile boundaries. Filtering and final UV seams still need review.
- Preserve mesh bevels and use broad light sources to create silver highlights. Reflections are produced by lighting; no highlights or shadows are painted into BaseColor.

Create reusable `MAT_` materials for these five sets. The manifest lists the modeled target objects. Separate the trackpad from the shared aluminum material. Do not replace the global `Device | graphite` or `Frame | charcoal powder coat` materials wholesale: those are shared with keyboard, car and furniture parts.

## Status

All 20 exports have verified PNG signatures and 1024 × 1024 dimensions. Silver and monitor base-color masters were visually inspected in Figma. The body grain is intentionally almost invisible in a flat preview and should become apparent through close-up shading. Materials have not been applied to Blender or verified in final lighting. Most housing/body meshes still require UVs. This package does not add logos, keyboard legends, ports, speaker holes, or change geometry.
