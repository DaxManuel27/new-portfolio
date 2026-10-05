# Red phone material maps

Downloaded from Figma MCP on 2026-10-01. These are the original image fills, not exports of the rounded thumbnails on the material sheet. All three files are 512 × 512 pixels.

Source file: https://www.figma.com/design/AAoP4nNd3n9QzR9C2Cjarm

| File | Node | Interpretation |
| --- | --- | --- |
| albedo.png | 99:11028 | sRGB color |
| roughness.png | 99:11030 | Linear data, green channel |
| normal.png | 99:11032 | Linear data, tangent-space OpenGL +Y |

Material sheet: 99:11025. Phone views: 11:385 and 44:5864.

Body, handset and cord: MeshPhysicalMaterial, color #A3101A multiplied by albedo, roughness 0.22 multiplied by roughness map, metalness 0, clearcoat 1, clearcoatRoughness 0.05, ior 1.5, normalScale (0.15, 0.15). All maps repeat in both axes.

Number ring: #F4F1EA, roughness 0.6. Acrylic finger wheel: transmission 1, roughness 0.05. Chrome finger stop and centre ring: metalness 1, roughness 0.15.

Runtime factory: `../../../exports/figma-sync/phone-materials.mjs`. These maps are now applied to the Blender phone: albedo directly, roughness calibrated to mean 0.22, and acrylic IOR 1.49. See the Blender sync report in exports/figma-sync/README.md. No website exists yet.
