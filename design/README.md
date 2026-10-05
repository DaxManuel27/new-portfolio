# Figma portfolio prototype

Created October 1, 2026 in dax.manuel's team.

[Editable design](https://www.figma.com/design/AAoP4nNd3n9QzR9C2Cjarm?node-id=5-468)

[Click-through prototype](https://www.figma.com/proto/AAoP4nNd3n9QzR9C2Cjarm?node-id=4-600)

## Included

- Full desktop landing page, 1440 × 6720, node `2:35`.
- Seven 1440 × 960 checkpoints: Intro (`4:600`), Hack Atlantic (`4:635`), Formula SAE (`4:670`), Ultra Maritime (`4:705`), Projects (`4:740`), Resume (`4:775`), Contact (`4:810`).
- Review board with all checkpoints, node `5:468`.
- Object-only desktop, mobile, interaction, and reduced-motion layouts. All page headings, filler copy, screen copy, navigation, buttons, and dividers have been removed throughout the file, including review copies.
- The MacBook and station objects remain against black/charcoal backgrounds with warm ambient lighting. Notebook contact destinations remain handwritten inside the physical notebook.
- Click the MacBook or drag a checkpoint to advance. Click the printer to print, the notebook to open it, or the rotary telephone to call. Experience contains the three stations in the confirmed order.
- Native Figma motion previews show arrival, opening, closing, departure, and printing. Separate static reduced-motion checkpoints are included.

The isolated Blender objects are raster renders; printer, telephone, notebook, pen, and desks are editable vector elements. This is a Figma prototype, not the website runtime.

## Remaining

A persistent 3D MacBook driven by browser scroll, mobile performance, a measured 60 fps target, automatic prefers-reduced-motion handling, and an actual resume PDF remain website implementation work. Contact links are connected to GitHub, LinkedIn, mail@daxmanuel.com, and +1 506-897-2218.

## Assets

`figma-assets/` contains transparent object renders from the saved Blender models. `render_checkpoints.py` regenerates them without saving or changing the original Blender files. `figma-checkpoints.png` is the reviewed Figma board screenshot.

Hack Atlantic now uses a shared Blender camera composition: the supplied M5 MacBook sits on the branded tabletop between its banners, with a 108° open lid. The separate generic landing desk and oversized laptop have been removed from every Hack Atlantic desktop/mobile checkpoint and review copy. Matching Blender poses provide the Figma arrival, opening, closing, and departure preview; they are image-based previews, not a browser 3D animation.

The reviewed scene is `../blender/hack-atlantic-docked-reviewed.blend`; captures are in `figma-assets/hack-docked/`. All 44 MacBook meshes were compared against `../blender/macbook-hero.blend`: vertex coordinates and polygon indices match exactly. Placement, hinge pose, and the blank display material are the only model presentation changes. The desk surface is at 0.7400 m and the lowest base vertices at 0.7401 m.
