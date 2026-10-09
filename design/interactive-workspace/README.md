# Interactive workspace — Figma texture delivery

Created October 8, 2026. This delivers the graphic texture artwork and notebook interaction design. Blender asset assembly and website integration are subsequent phases.

- [Surface review in the existing portfolio file](https://www.figma.com/design/AAoP4nNd3n9QzR9C2Cjarm?node-id=170-13160)
- [Editable texture masters](https://www.figma.com/design/AAoP4nNd3n9QzR9C2Cjarm?node-id=169-13164)
- [Notebook opening storyboard](https://www.figma.com/design/AAoP4nNd3n9QzR9C2Cjarm?node-id=170-13298)
- [Mobile reading view](https://www.figma.com/design/AAoP4nNd3n9QzR9C2Cjarm?node-id=170-13407)
- [Blender handoff notes](https://www.figma.com/design/AAoP4nNd3n9QzR9C2Cjarm?node-id=170-13446)

The original portfolio page was preserved. All new work is on `02 — Interactive workspace textures`.

## Delivered artwork

| Surface | File | Status |
|---|---|---|
| Ultra Maritime front cover | `textures/um-cover-front.png` | Existing transparent blue logo on an ivory cover |
| Back cover | `textures/um-cover-back.png` | Matching ivory artwork |
| Spine | `textures/um-spine.png` | Dark spine with restrained lettering |
| Experience left page | `textures/um-page-left.png` | Role, dates, location, technical focus |
| Experience right page | `textures/um-page-right.png` | Four contributions from the existing JSON |
| MacBook screen | `textures/hack-atlantic-screen.png` | Editable serif title over a separate coastal image |
| Personal-projects monitor | `textures/personal-projects-screen.png` | Recap, Codex for CAD, ML Library; illustrative diagrams |
| Mug lettering | `textures/mug-lettering.png` | Transparent decal: BETTER THINGS AHEAD |
| Phone center | `textures/phone-center.png` | DAX / CONTACT medallion |
| Phone dial | `textures/phone-dial-digits.png` | Preserved existing digit layout |
| Résumé | `textures/resume-placeholder.png` | Existing placeholder reference only; not production-ready résumé content |

Notebook art exports at 2048 px height. The ultrawide is 2048 × 877, corresponding to the existing 0.82 × 0.351 m screen. Exact dimensions, byte counts, SHA-256 hashes, node IDs, and destinations are in `texture-manifest.json`.

## Visual decisions

Match the concept's cream paper, charcoal surroundings, restrained blue-gray technical screen, fine rules, generous spacing, and serif display lettering. Cormorant Garamond Medium approximates the reference's editorial serif; Geist supplies readable body text, and IBM Plex Mono supplies small labels. These are intentional additions for the new concept; the old Manrope-based styles were not changed.

The monitor now represents personal projects, and the notebook represents Ultra Maritime, as requested. The generated image does not contain those revised surfaces; these are new designs in the same visual direction. The blue logo's shape and proportions are preserved from `assets/textures/ultra-maritime-logo.png`.

The coastline and type are close visual interpretations, not a pixel-identical reconstruction of the generated image. The matching 3D lighting, surface finish, camera, and geometry still need to be produced in Blender.

## Blender contract

- Read all graphic artwork as sRGB color. Physical roughness/normal maps are separate and must be treated as non-color data.
- Do not bake Figma interface labels, review headings, or handoff notes into meshes; export only the texture masters listed in the manifest.
- Nominal notebook cover is 148 × 210 mm, spine 18.5 mm. Refine the page UVs to the exported image aspect ratio; don't stretch the artwork to compensate for arbitrary mesh dimensions.
- Front cover hinge is on the left. Preserve 90–125 px safe margins on page masters, especially near the gutter. Confirm readable, non-mirrored text after GLB export.
- Closed cover → hover/focus → camera approaches while cover opens → stable spread → close and return. The storyboard is a timing/design reference, not the final physical animation.
- The résumé export includes old presentation effects and is marked reference-only. Replace it with a real flat résumé page when final content is available; do not enable a fabricated download.
- Phone center artwork is separate from the retained dial digits. Keep the dial's existing UV convention.
- Mug lettering has a transparent background and should be layered over ivory ceramic.
- The monitor's diagrams represent the projects conceptually. They are not screenshots or claims about their current capabilities. Names come from the existing content workbook; the live runtime currently has blank title entries.
- All experience content must also be available as selectable HTML, especially for mobile and reduced motion. The Figma mobile frame illustrates the first reading viewport; remaining contributions continue below.

## Validation performed

Reviewed the texture composition, notebook storyboard, and mobile reading layout. Corrected an initial opacity-binding issue so the photographic background and subtle screen grid render correctly. Figma structural checks found no text extending past its immediate parent in the inspected compositions. Verified the three intended font families and confirmed editable text/vector layers rather than a flattened UI screenshot.

Downloaded and checked all 11 PNG signatures and dimensions; total texture payload is 3,943,022 bytes before browser-specific compression. The reference résumé dimensions include its old effects; it remains excluded from ready-for-Blender-lookdev status. No Blender files or website runtime files were changed in this phase.

`previews/texture-review.png` is the saved Figma review. `validation.json` records verification scope. `figma-state.json` records the initial created nodes; the manifest holds the final export IDs. The two build scripts describe the construction steps and are executed through Figma MCP, not Node.js; existing-master guards intentionally prevent duplicate builds.

## Generated background provenance

The background was generated with the built-in image generation tool, using `sources/desk-concept.png` as the reference. It is saved at `sources/hack-atlantic-coast.png`; Figma overlays editable typography. It is a fictional illustrative coast, not documentary event photography.

Generation prompt:

> Create the flat digital wallpaper shown INSIDE THE LAPTOP SCREEN of this reference image, reconstructed as a clean straight-on landscape image. Only the sunset coastline photography, with no text, no laptop, no desk, no screen bezel, no UI. Match the reference screen very closely: muted dusty peach sunset sky above deep blue-gray Atlantic sea, low orange sun near right horizon, layered rocky coastal headlands entering from lower right, sparse coastal plants at bottom, distant headlands. Quiet premium photographic mood, softly darkened lower corners. A 3:2 composition usable as a laptop screen background with clear sky/sea negative space at upper left for editable typography that will be added separately in Figma. Do not create any words or logos. This is an extraction/reconstruction of the laptop wallpaper, not the whole scene.
