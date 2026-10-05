# Persistent Personal Projects heading and ultrawide handoff

The reel now uses one fixed, single-line PERSONAL PROJECTS heading. It shares the FSAE title’s system font, weight 800, uppercase treatment, cream first word and taupe second word. The heading stays fully visible throughout the four project cards, then fades only during the contact-card transition. Project names remain on their cards; the polite live region still announces each active project and its position.

Removed the separate chapter canvas, texture, blend shader and phase-dependent title blend. The ultrawide uses the painted first reel frame throughout the desk reveal and entry. Initial scene startup waits for fonts, and preview caching includes viewport size, device pixel ratio and font readiness. Preview layout includes the first-card scroll hint.

At the existing full-screen camera position (94% of monitor entry), the HTML reel replaces the canvas in one frame; reverse scrolling uses the same threshold. The contact-card transition is retained.

The saved screen artwork, source/distributed project GLBs and ultrawide fallback poster were refreshed. The Blender generation script now references the reel artwork. Existing packed Blender files are not rewritten; rerunning the generator uses the updated source image.

## Verification

- Compared the painted screen and HTML frame, including 50% overlays, at 1280×800, 1440×960, 1920×1080, 2560×1440 and 390×844.
- The heading fits on one line and clears the cards at all five sizes.
- Mean image differences across the handoff range from 0.56 to 1.36 per channel on a 0–255 scale. Minor texture filtering/text rasterization differences remain; the heading and cards retain their positions.
- Browser checks cover the fixed heading across all four cards and the reverse handoff.
- The fallback projects section has an explicit Personal projects heading and refreshed ultrawide image.

Screenshots, overlays and measurements: `web/test-results/projects-heading/`.

The requested `fsae-to-projects-transition-plan.md` and `remove-filler-text-plan.md` are absent. Updated the corresponding current guidance in `fsae-car-desk-model-plan.md` and `ultrawide-curved-screen-plan.md`.

Final checks: all 75 automated tests and the production build pass. Reduced-motion and disabled-WebGL browser checks both confirm the Personal projects heading and successfully decoded updated poster.
