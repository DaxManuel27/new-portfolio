# Blender material sync — 2026-10-01

Updated five active Blender files: portfolio-elements.blend, macbook-hero.blend, portfolio-elements-with-macbook.blend, hack-atlantic-docked.blend, and hack-atlantic-docked-reviewed.blend.

Pre-edit copies of all five are in ../../blender/backups/before-material-sync-20261001-213437/. Earlier archives are unchanged.

## Materials

- Red phone: original Figma albedo in sRGB directly into Base Color; Non-Color roughness map scaled by 0.953867 to average 0.22; Non-Color OpenGL normal through Normal Map at strength 0.15. Metallic 0, coat 1, coat roughness 0.05, IOR 1.5. Physical UV repetition every 25 mm. Phone curves converted to meshes for reliable UV/GLB export; original editable curves remain in the backup.
- Number ring: #F4F1EA, roughness 0.6. Acrylic: transmission 1, roughness 0.05, IOR 1.49. Chrome stop and centre ring: #D7D8DC, metallic 1, roughness 0.15.
- MacBook aluminium: #C9CBCE, metallic 1, roughness 0.38. Keys: #1F1F23, roughness 0.55. Display and surrounding glass: black, roughness 0.05, no image or emission. Native mesh detail and opening animation retained. No dimensional remodel in this material pass.

## Placement and capture

Hack Atlantic laptop is centered at X=0.075 m, between standees at X=-0.265 and 0.415 m. Standees moved closer to match Figma 16:1198. Laptop feet: Z=0.7401 m; tabletop: Z=0.7400 m. Lid opening 108°. The reviewed scene is also appended to the master.

Capture: ../../design/figma-assets/hack-docked/open-108.png. Previews: ../../blender/previews/red-phone.png and ../../blender/previews/macbook-silver-blank.png.

## GLB delivery and verification

Exports in the parent folder: rotary-phone.glb, macbook-hero.glb, personal-desk.glb, and hack-atlantic-docked.glb. Meter scale, Y up, textures embedded. The last file includes the docked laptop; the older hack-atlantic-check-in.glb remains the separate station-only export.

Evaluated triangles: phone 54,528; MacBook 163,918; personal desk 168,350; docked Hack Atlantic 168,004. All below the 250,000-per-export preservation budget. Browser performance is not assessed in this asset-only pass.

GLB structure and finite float data passed validation. The phone contains KHR_materials_clearcoat, KHR_materials_transmission and KHR_materials_ior. Re-import confirmed coat 1, transmission 1, IOR 1.49 and normal strength 0.15. MacBook export retains its animation and a blank non-emissive display. See glb-validation.json, roundtrip.json and per-file reports.

The earlier phone-materials.mjs is a separate optional website factory using the earlier Three.js specification; it is not used by these Blender assets.
