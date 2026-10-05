# Blender texture handoff

Figma source: https://www.figma.com/design/GHhsIXL0aNThNEEc8sIjjC

Created from `plan.m`, `blender-implementation-plan.md`, and read-only measurements of the live Portfolio Elements scene on September 30, 2026. The scene has not been modified in this texture-design pass.

## Contents

- 10 screen PNGs: ultrawide overview, six project slides, MacBook introduction, and two Ultra Maritime internship screens.
- 13 surface base-color PNGs: all used station surface materials, including walnut grain and a stylized composite weave. Flat finishes intentionally remain uniform; retain their scalar shaders where a texture provides no benefit.
- 3 original graphics preserved in Figma and already present locally: tall Hack Atlantic banner, shared tabletop banner, and Ultra Maritime logo. Use the original local PNGs to avoid resampling and preserve alpha.
- `texture-manifest.json`: exact Figma node IDs, file paths, dimensions, existing Blender object/material names, and roughness/metallic values.

## Application

1. Load screen/base-color images as sRGB. Match the objects in the manifest. Screens and banner faces already have UVMap layers.
2. Use the full image over the existing 0–1 UV rectangle. Do not crop to conventional device ratios: the modeled MacBook is 0.332 × 0.202 m; Ultra screens are 0.598 × 0.336 m. The curved ultrawide UVs follow its 0.820 × 0.351 m chord dimensions. Its existing horizontal UV spacing causes slight curvature distortion; camera and UV review is still required.
3. Give each screen its own material. Use the image for base color and low-strength emission, adjusting against the final lighting. Do not share one image material across all four displays. Select the overview or one of the six ultrawide project variants.
4. Preserve metallic and roughness scalars from the manifest. These PNGs are base-color art, not baked lighting, normal maps, or roughness maps. Most physical meshes lack UVs; unwrap the walnut desktop and composite parts before applying their patterned maps. Check grain direction and weave size; do not stretch a single map across differently sized parts.
5. Keep banner art in base color with roughness about 0.65, and preserve the logo's alpha. Both small banners use the same source.
6. Review the final camera render for filtering, legibility, emission, color management, UV orientation and seams. Matching image dimensions alone cannot guarantee a pixel-perfect lit 3D render.

## Design assumptions

Screen content is an original portfolio treatment based on the project names/descriptions in the plan. Project diagrams are labeled concept visuals, not screenshots of actual applications. Ultra Maritime displays are explicitly illustrative, not operational interfaces or internship evidence. No unverified UNB logos, sponsors, racing numbers or team livery were invented. The car uses its existing oxblood/composite/metal/rubber palette. Laptop key legends are not fabricated without a specific model reference.

## Verification

All 23 new PNGs were downloaded from Figma and checked for PNG signatures and exact dimensions. Figma contains 26 export masters including the three original graphics. Screen compositions and representative surface/artwork masters were visually inspected, and frame bounds checked. Import/application and final Blender render matching remain the next production step.

## Device material extension

Dedicated silver MacBook and monitor PBR texture sets are now in [devices/README.md](devices/README.md), with 20 exported maps and object-specific settings. Use these in place of the earlier flat silver/graphite swatches on the listed device objects. The original 26 masters remain available.

## Applied to Blender — September 30, 2026

Non-MacBook textures are now assigned in `blender/portfolio-elements.blend`: 234 objects, 35 packed images, and six retained alternate ultrawide project materials. The overview is active. Monitor housing, stand and bezel PBR maps are applied; superseded generic device swatches remain as spare materials. MacBook and archived MacBook objects are untouched. A before-change backup is saved as `blender/portfolio-elements-before-figma-textures.blend`. See `blender/figma-texture-application-report.json` for assignments and checks. Viewport QA passed; final lighting/render polish and GLB export are separate steps.

## Monitor cleanup

At user request, all three monitor displays now use a clean dark material, with no placeholder text or diagrams. Previous screen artwork is retained as unused assets and disabled in the manifest. The MacBook is unchanged.
