# Ultra Maritime screen refresh

## Goal

Make Ultra Maritime crisp, correctly proportioned, and visually consistent with the UNB Formula Racing monitor. Keep the black screen, existing contribution copy, and blue logo on a rounded white square to the left of the heading. Preserve the desks, monitor geometry, cameras, and scroll transitions.

## What is causing the current look

- `web/scripts/clean-monitor-artwork.mjs` renders a fixed 1412 × 932 image (1.515:1), while the display measures approximately 0.598 × 0.336 (1.780:1). Mapping the whole image onto that screen widens everything by approximately 17.5%, including the square logo.
- Fixed-resolution raster text loses definition when the screen occupies many physical display pixels, especially on Retina displays.
- The title uses Helvetica/Arial at weight 700, while Formula Racing uses the site's system sans at weight 800 with tighter tracking and warm neutral colors.
- Text wraps by character count, rather than measured line width. The compact title/role/date stack and long bullets give the composition a document-like appearance.

## Recommended design

1. **A stronger header.** Keep the rounded white logo tile on the left, perfectly square. Place a larger, weight-800 `ULTRA MARITIME` heading beside it, using the same font family and cream `#ece4d6` as Formula Racing. Use slightly tight tracking, starting at −0.03em.
2. **Clear supporting hierarchy.** Put `Software Engineer Intern` below the heading in warm taupe `#b9ae9c`. Put dates and location beneath it in a smaller neutral tone. Align this header text to the title, leaving a deliberate gap below the logo/header group.
3. **Four readable contribution rows.** Preserve the exact copy and order. Use a consistent hanging bullet indent, comfortable line height (about 1.45), and generous space between rows. Wrap by measured available width. Keep the text area broad enough to avoid excessive wrapping, with approximately 6% screen margins.
4. **Restrained emphasis.** Bold the existing outcomes such as “over 50%” and “30+ functions,” without adding new claims. Avoid cards, gradients, shadows, and decorative outlines inside the screen.

Starting dimensions in a 1780 × 1000 logical layout: logo 100 × 100 with 16px corners; title 74–80px; role 34–36px; metadata 25–27px; body 30–32px. These are starting values to tune against the actual camera framing, not fixed acceptance criteria. Do not copy Formula Racing's very large title scale at the expense of reading the contribution text.

## Rendering implementation

- Build one DOM layout for Ultra Maritime from `web/src/ultra-maritime.json`. Use that same layout for the monitor, accessible still view, and Read experience dialog, avoiding divergent typography.
- Measure the actual `Screen_Workstation_UM` display aspect ratio and lay out the source at that ratio. Never independently stretch horizontal and vertical coordinates.
- Paint the measured layout to a canvas texture using the existing `paintTree` approach in `web/src/reel-preview.ts`, similar to the display-aware Formula Racing title path. The source must be laid out but visually hidden, not `display:none`.
- Set texture resolution from the projected screen size × device pixel ratio. Use resolution tiers and a maximum texture dimension of 4096 (also capped by GPU limits); preserve the screen ratio at every tier.
- Use sRGB and an unlit, non-tone-mapped material. Retain mipmaps/linear filtering for distant views and appropriate anisotropy for angled views. Verify orientation and UV mapping before evaluating typography.
- Repaint only after content changes, fonts/logo finish loading, resize, or a resolution-tier change. Do not rebuild the texture on every scroll frame. Dispose replaced textures and clean up on scene disposal.
- Update `clean-monitor-artwork.mjs` to produce a correctly proportioned high-resolution fallback from the same design. Keep a usable baked texture until the live version is ready. Regenerate the still preview so it no longer shows the stretched artwork.

## Work sequence

1. Correct the aspect ratio and logo geometry first; compare before/after at the same camera position.
2. Build the shared header and contribution layout, applying Formula Racing's typography and palette.
3. Add adaptive-resolution painting and loading/cleanup behavior.
4. Update baked fallback artwork and still preview.
5. Verify the normal workstation view, close view, and reverse scroll without changing camera paths.

## Acceptance checks

- Logo tile is square in a straight-on view; rounded corners and blue mark remain clean.
- Text proportions match the DOM source and no longer appear widened.
- Heading/body edges stay sharp at normal viewing size on standard and Retina displays.
- All four original bullets are visible, readable, and unclipped at the intended reading pose.
- Black, cream, taupe, font family, and heading weight match the Formula Racing visual language.
- Check desktop, ultrawide, and phone viewports; retain the readable dialog/static fallback on small screens rather than squeezing desktop copy into tiny text.
- No flashes of blank content, upside-down artwork, scroll stutter, repeated texture allocations, or growing GPU memory after revisiting the section.
- Production build passes. Add focused checks for aspect/resolution calculation if introducing that helper; use browser screenshots for layout and sharpness verification.

## Scope

Planning only. No visual or rendering changes are applied by this document. No Blender remodel is needed; this is a screen content and rendering change.
