# Figma production handoff

Completed 2026-10-01. This is the Figma design and texture phase; no Blender files were edited in this phase.

- [Production review board](https://www.figma.com/design/AAoP4nNd3n9QzR9C2Cjarm?node-id=111-11081)
- [Updated original motion storyboard](https://www.figma.com/design/AAoP4nNd3n9QzR9C2Cjarm?node-id=48-5573)
- [Export masters](https://www.figma.com/design/AAoP4nNd3n9QzR9C2Cjarm?node-id=111-11085)
- [Reference prototype](https://www.figma.com/proto/AAoP4nNd3n9QzR9C2Cjarm?node-id=4-600)

## Delivered

- Editable pen top and side views, material values and Contact placement.
- Flat 1024² phone number plate, aligned to the existing ten-hole Blender dial. Separate PNG and SVG.
- Two FSAE label masters, transparent PNGs at 1024 px width and SVGs. Connectors remain separate.
- Flat notebook pages at 2048 × 1467 and US Letter résumé at 1583 × 2048. Export frames use integer pixel boundaries and opaque backgrounds. Existing content preserved.
- Original 512² phone albedo, roughness and OpenGL normal maps, copied unchanged into the handoff.
- Resume/Contact wide and bird’s-eye references, metric layout notes, printer-feed states, straight-on push-in endpoints, mobile and reduced-motion references.
- Six motion storyboards with 30 authored poses, continuous unwrapped angles, explicit holds, metric position/camera seeds and a machine-readable motion manifest.
- Twelve linked reference-prototype checkpoints. Click the canvas in Present mode; pre-existing drag interactions remain.
- Active MacBook screen-content overrides and screen-light overlays hidden to match the blank, non-emissive screen requirement.

## Latest framing decision

The travelling MacBook stays centered at (50%, 50%) and is larger throughout all transition poses. Fit its projected bounds within 56% frame width / 64% frame height. Formula SAE is the deliberate exception: settle at X 28%, and return to center by the lift pose on departure. The original storyboard has 28 centered poses and two FSAE boundary poses at X 28%.

FROM/TO images are full-station composition references. Blend to the wider station camera after landing where needed; do not shrink the travelling hero or move it sideways during the transit. Use camera framing, keep physical mesh scale at 1, and smooth fitted camera distance to avoid size pumping.

## Files

`textures/` preserves Figma exports and original phone images. Working PNG copies are in `assets/textures/figma-completion/` at the project root.

- `texture-manifest.json`: source node IDs, dimensions, physical coverage, color spaces, alpha policies, material slots, version/date, SHA-256 checksums, dial registration.
- `texture-validation.json`: image sizes and alpha checks for all eight PNGs.
- `motion-manifest.json`: version 1.1, centered framing, seven boundary/hold records per transition, camera seeds, push-ins, bird’s-eye views and paper feed.
- `figma-state-final.json`: created/mutated node ledger. Packed node IDs are reconstructed by concatenating each prefix with its suffix.
- `figma-validation.json`: structural audit and pose-center checks.
- `figma-final-adjustments.json`: final camera-note, printer emergence, registration-guide and static printed-reference changes.

## Validation and Blender follow-through

All eight PNGs exist and decode successfully. Solid textures have fully opaque alpha; callout textures have clean transparent padding. Three SVG masters are included. The final review audit returned 3,052 descendants, including 951 text nodes and 54 component instances; existing station renders and source maps are retained as image assets. No in-progress placeholders remain. Dial construction guides are isolated from the exported texture; the reduced Resume reference shows a static printed page.

FSAE mechanical anchor positions are not verified by the available references. The existing screen-space anchors are documented and must be checked against the car model before attaching 3D connectors. Camera numbers are concrete starting design values; final camera fit must match the linked Figma pixel landmarks in Blender. The résumé source contains only a name, contact line and rule; no résumé claims were invented. Reduced-motion implementation should use static landed/printed endpoints, with no spins or paper travel.

The prototype is a review walkthrough, not a scroll-driven website or a rendered Blender animation. Back up each `.blend` before the next implementation phase.
