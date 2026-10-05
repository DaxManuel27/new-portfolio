# Completed portfolio Blender assets

Delivered 2026-10-01 from the approved [Figma handoff](https://www.figma.com/design/AAoP4nNd3n9QzR9C2Cjarm?node-id=111-11081) and [centered motion board](https://www.figma.com/design/AAoP4nNd3n9QzR9C2Cjarm?node-id=48-5573).

Open **`../../blender/portfolio-completed.blend`**. The working master, `../../blender/portfolio-elements.blend`, contains the same completed work. Earlier scenes are retained.

## Review in Blender

- **Completion — Portfolio Journey:** one travelling MacBook, six transitions, frames 1–721 at 30 fps. The visible laptop stays centered; the Formula SAE landing moves left. Mesh scale stays 1. Station materials fade in and out.
- **Completion — Intro / Hack Atlantic / Formula SAE / Ultra Maritime / Projects / Resume / Contact:** isolated station assemblies with wide cameras. Hack Atlantic, Ultra Maritime and Projects have straight-on close cameras. Resume and Contact have birdseye cameras, plus optional wider context cameras.
- The five animated station cameras run over frames 1–121. These are separate review clips; the full journey preview shows the six travel transitions. Static review scenes include their own laptop; the journey includes only one travelling laptop.
- Resume frames 1–121 also show reversible paper feed, with held states at the first and last 10%. The printed sheet bends over the actual elevated output tray, keeping its header visible.

## Implemented assets

- A separate 140 mm pen with the approved black, warm metal and nib materials.
- Registered 0–9 dial artwork beneath the acrylic finger wheel; original red-phone maps and fine 25 mm tiling retained.
- New notebook and résumé artwork, with existing text preserved.
- Separate Formula SAE label planes, connector curves and named anchors.
- Complete Resume and Contact arrangements; Hack Atlantic laptop between its two standees.
- Silver MacBook, dark keys and blank, non-emissive black glass screens.

## Exports

Twenty self-contained GLBs have embedded images: seven stations; pen, rotary phone, notebook, résumé page and printer; animated printer paper; six individual MacBook transitions; and the full MacBook journey.

Each `transition-*.glb` contains one merged animation from 0–4 seconds. `macbook-journey.glb` covers 0–24 seconds. `printer-paper-feed.glb` covers 0–4 seconds with morph targets. Files use metre scale and glTF's Y-up convention.

`motion-runtime.json` supplies the travelling camera, transition ranges and station opacity. `station-cameras.json` supplies static and animated station cameras. Camera width and station opacity are separate from reusable GLB mesh clips. The future website must apply this presentation data and switch from travel to its chosen station view; no website or browser scroll behavior is included here. Use static landed stations and the printed page for reduced motion.

## Preview and validation

- `../../blender/previews/completion/portfolio-journey.mp4`: full 24-second travel preview, 720×480 at 10 fps. Blender animation is authored at 30 fps.
- `../../blender/previews/completion/`: wide and close endpoint PNGs, phone detail, context views, and a journey review sheet.
- `blender-validation.json`: all 721 frames checked against actual mesh geometry. Maximum centering error under 0.002 pixels at 1440 px; projected limits 56% width / 64% height; minimum laptop height 0.7401 m; deterministic reverse playback. Visible station geometry ranges from about 165k to 223k triangles.
- `glb-validation.json` and `roundtrip-validation.json`: embedded textures, animation ranges, finite geometry and successful Blender re-import of every GLB. Phone clearcoat, transmission, IOR, roughness factor and normal strength 0.15 survive export.
- `paper-feed-roundtrip.json`: forward/reverse checks on the exported morph animation.

## Documented differences

The representative FSAE car has no verified logger or pedal-sensor components. Its callout anchors are explicitly marked as conceptual. The existing detailed MacBook geometry was preserved at approximately 311.7 × 224.1 × 17.9 mm closed. Tight notebook/page crops follow the authored numeric camera specification; wider context cameras are supplied separately. Renders match the requested composition and material intent, rather than claiming pixel-identical Figma perspective.

## Backups

`../../blender/backups/before-completion-20261001-230934/` contains both the original disk master and the unsaved live session captured before changes, with a manifest. Other historical `.blend` files were not modified. Texture originals and the Figma source manifests remain in `../../figma_refs/completion/`.
