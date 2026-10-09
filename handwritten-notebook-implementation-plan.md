# Handwritten experience notebook

Status: implemented.

## Intended appearance

Turn the Ultra Maritime spread into a personal engineering notebook: warm ivory paper, faint ruled lines, dark blue-black handwriting, a visible centre fold, and restrained pen marks. Both pages should feel written in the same notebook rather than like two résumé panels.

The screenshot currently combines a typeset left-page texture with a flat HTML résumé on the right. The fonts, lighting, and layout differ between the pages. Address both surfaces together while preserving the existing experience facts and notebook opening animation.

## 1. Design the spread

**Left page — introduction and context**

- Small handwritten “Work notes / 01” at the top.
- “Ultra Maritime” as a larger handwritten title, with one slightly imperfect underline.
- Role, dates, and location beneath it, retaining the current information.
- A short tools section: Python, REST APIs, ZeroMQ, Linux, and automated testing.
- Keep generous blank space. Add a small pen sketch of connected boxes near the tools section, without implying extra work or achievements.
- Small “Dax Manuel” signature-style text near the bottom, using a font rather than inventing an authentic signature.

**Right page — contribution notes**

- A handwritten “What I worked on” heading, avoiding a duplicate large company title.
- Preserve all four contributions from `web/src/ultra-maritime.json`, in the same order and with their exact factual claims.
- Use short dash bullets and comfortable line spacing. Wrap the existing text; do not truncate it to fit.
- Underline or lightly highlight “over 50%” and “30+ functions” instead of using heavy résumé-style bold text.
- Leave an inner margin at the fold and enough bottom margin for the last contribution.

## 2. Typography and paper

Choose a legible handwritten print font with a compatible redistribution licence. Bundle its font files and licence locally; do not depend on an external font service. Test the actual contribution paragraphs before selecting it. Avoid ornate cursive, random letter rotation, or simulated spelling errors.

Use one handwriting family throughout, with size and ink weight creating hierarchy. Add only subtle, deterministic variation to rules and hand-drawn annotations, so resize and reload never make the text jump.

Use matching paper colour, fine grain, faint blue-grey ruling, and a quiet margin line across both pages. Let the existing scene lighting supply depth. Avoid strong baked shadows that would conflict with the notebook opening animation.

## 3. Put the writing on the physical pages

The current source already has `UM_Notebook_LeftPage`, `UM_Notebook_RightPage`, `UM_Notebook_CoverHinge`, and distinct page materials. Retain these objects and their destination mapping.

Create a notebook layout/painter module that generates both page textures from shared content and typography settings. Read role, dates, location, and contributions from the existing JSON; keep additional labels in one notebook copy configuration.

- Paint after the handwriting font loads, wrapping text by measured width.
- Select texture resolution from projected page size and device limits, with a 4096-pixel maximum dimension. Update on relevant layout/content changes, not every frame.
- Apply the artwork to the physical page materials so text follows perspective, occlusion, and the opening cover. Preserve paper roughness and scene lighting; writing should look like ink, not a glowing screen.
- Remove the visible rectangular Ultra Maritime HTML overlay once the page artwork is ready. Keep its semantic text available to assistive technology and provide a readable HTML fallback if the 3D scene or texture generation fails.
- Generate matching fallback page images from the same layout so the overview, opening motion, and focused spread never switch between different designs.

## 4. Refine the notebook shape only where needed

Inspect the existing page block and cover in the focused view first. Keep the notebook’s desk placement, dimensions, cover hinge, and opening timing.

If needed, add a shallow page curl near the gutter, subtle paper-stack edges, and a soft crease. Preserve adequate separation between the pages and underlying geometry to avoid flicker. Extend the cover/page UV handling to the new shape without stretching the handwriting.

Save a backup and make any Blender adjustment reproducible in a dedicated script. Re-export only when geometry/material changes require it. The existing monitor lift and curved display must remain intact.

## 5. Camera and mobile reading

Desktop should frame the whole open spread, including page edges and a little surrounding desk, with Back to desk outside the paper.

On a narrow screen, framing the entire spread would make four detailed notes too small. Use a page-focused view with accessible Previous page / Next page controls outside the paper. Focus the introduction first, then the contribution page; paginate contributions further only if necessary to maintain approximately 16 px apparent body text. Preserve reading order and show all content without horizontal scrolling.

Reduced motion switches between these poses immediately. Resizing should retain the current reading position. Back to desk and Escape keep their existing behaviour.

## 6. Verification and completion

- Compare desktop overview, opening transition, and focused spread: one consistent handwriting and paper treatment throughout.
- Confirm every role/date/location/detail and both numerical achievements match the existing JSON exactly.
- Check line wrapping, page margins, and clipping with fonts loaded and font-loading failure simulated.
- Verify readable mobile text, complete contribution coverage, page controls, keyboard operation, semantic reading order, direct `#ultra-maritime` loading, browser history, and reduced motion.
- Check text remains attached to both physical pages during opening, camera motion, resize, and closing. No flat rectangle, doubled text, upside-down UVs, or page flicker.
- Run the production build, relevant surface-focus tests, and focused tests for line wrapping/pagination and content preservation. Re-run monitor clearance checks if the desk asset is regenerated.
- Deliver before/after desktop and mobile captures plus an opening-animation view.

## Expected files

- `web/src/ultra-screen.ts` and `ultra-maritime.json` (content source; factual copy preserved).
- New notebook content/layout/texture module.
- `web/src/workspace.ts`, `workspace-scene.ts`, `workspace.css`, and `surface-focus.ts`.
- `web/public/fonts/` with the selected handwriting font and its licence.
- `design/desk-fixes/um-page-left.png` and `um-page-right.png` regenerated from the shared layout.
- Active Blender file and a dedicated notebook refinement script only if geometry changes are needed.
- Focused layout/navigation tests and review screenshots.

Completion means the experience reads as handwritten notes on the actual notebook, with all information accessible and readable on desktop and mobile.

## Implementation results

- Both pages now use locally bundled Kalam handwriting, warm ruled paper, consistent ink, hand-drawn underlines, highlighted achievements, and a small tools sketch. Font and OFL licence are in `web/public/fonts/`.
- `notebook-layout.ts` uses the existing experience JSON without rewriting its factual copy. `notebook-display.ts` paints both real 3D page surfaces. Material roughness and scene lighting are retained; the visible HTML rectangle is replaced by semantic text for assistive technology.
- Mobile uses three camera-focused reading pages: introduction, contributions 1–2, and contributions 3–4. Previous/Next controls have accessible names, page announcements, bounds, and keyboard focus handling. Desktop retains the full spread. Resizing retains the reading index. The existing reduced-motion path applies to page focus.
- Existing notebook geometry, cover hinge, and opening animation were retained after visual inspection; no geometry refinement was needed.
- Matching PNG fallbacks were exported through `web/notebook-artwork.html`, which uses the same painter and exposes downloadable page art and measured layout JSON. `blender/scene-realism/refresh-notebook-artwork.py` reloads these into the saved scene and exports it.
- Geometry encoding retained unrelated compressed textures and refreshed only the two notebook pages as PNG via `DAX_PNG_TEXTURES=um-page-left,um-page-right`. Backups are in `backups/handwritten-notebook/`.
- Production build passed. Eleven focused tests passed, including exact content preservation, achievement wrapping, measured margins, font failure/timeout, and surface camera framing. The 244-pose monitor clearance/export checks still pass.
- Browser review covered the desktop spread, mobile introduction and both contribution pages, navigation, accessible content, resize, and direct destination loading. Captures and the measured layout report are in `reference/compare/handwritten-notebook/`. Reduced motion uses the existing path and was not toggled at the OS level during review.
