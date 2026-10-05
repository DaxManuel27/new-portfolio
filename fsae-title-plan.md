# Formula SAE title — "UNB Formula Racing" plan

Status: **implemented 2026-10-03**, with your decisions (see Decisions and Results at the end).

## Goal

Put **UNB Formula Racing** in big type on the left of the Formula SAE car, styled like the intro's DAX / MANUEL, on both screens where the car appears:

1. **On the FSAE monitor** at the Workstation: the live car preview inside the right-hand monitor (`pan` → `monitor-hold`, then the `screen-zoom` into it).
2. **Full screen**, after the zoom: the car overview (`hold`, station 3), with the *Data logging* and *Accelerator pedal sensor* callouts.

The two must line up exactly. Because the zoom ends on the full-screen view, the title on the monitor has to be the same title at the same place, so the hand-off doesn't jump. The same requirement drove the ultrawide fix.

## Typography (matches the intro name)

| | Intro name (today) | FSAE title (proposed) |
|---|---|---|
| Line 1 | `DAX`, weight 800, uppercase, `min(21vw, 42vh)`, `#ece4d6` | `UNB`, same style and colour |
| Line 2 | `MANUEL`, smaller, `#b9ae9c`, sized so the L tucks under the laptop | `FORMULA RACING`, smaller, `#b9ae9c`, sized so its end tucks slightly under the car's front-left wheel |
| Position | `left: 3.2vw; top: 11vh`, under the 3D canvas | Same left and top, under the car (the car overlaps the text, the text never overlaps the car) |

Line 2's size is fitted to the space left of the car rather than guessed. The car's projected left edge at the overview camera is measured once per viewport, then `FORMULA RACING` is sized to end about 2 % of the viewport width past it, the same trick as the MANUEL `clamp()` formula. That keeps the tuck right on every screen shape. A fallback `clamp()` is used until the measurement is ready.

Phone (≤ 700 px): stacked top-left like the intro's phone layout (`UNB` ≈ 30vw, `FORMULA RACING` ≈ 11vw), above the car.

## Why the title is drawn in 3D rather than as page text

- **Full screen:** the car scene is drawn on a **solid black** WebGL background (`scene.background = black` at station 3), so page text placed under the canvas, as the intro name is, would be hidden.
- **On the monitor:** the car isn't page content at all. It's rendered into an off-screen texture (`carTarget`) that is mapped onto the monitor glass, so page text can't appear inside it.

**Proposed approach: a "title card" in the car scene.**

- One flat, transparent plane holds the title, painted from a real (visually hidden) heading by the same DOM painter that now paints the Projects reel onto the ultrawide (`reel-preview.ts`).
- The plane sits **behind the car**, facing the car camera, and is sized to exactly the viewport's footprint at the overview camera. The camera is orthographic, so at the full-screen hold the plane maps 1:1 onto the window and every letter lands where the CSS layout put it.
- It belongs to the car's scene group, so the monitor preview renders it automatically. Inside the monitor it shows at the same place relative to the car, and the zoom ends on exactly the full-screen picture. The hand-off is seamless by construction, with no second copy to keep in sync.
- Being behind the car, the car naturally overlaps it, which gives the "under the laptop" layering of the intro name.
- The canvas is painted at the renderer's pixel ratio (capped at 1.5, like the scene), so at the hold one texture pixel equals one screen pixel and the type stays sharp.

**Alternative considered: page text plus a separate monitor texture.** Make the car background transparent, put a page heading under the canvas, and paint a second copy into the monitor texture. Rejected because there would be two copies to keep aligned, plus a background-colour swap at the zoom.

## When it shows (all driven by scroll, fully reversible)

| Phase | Title |
|---|---|
| Workstation `hold` / `pan` | Fades in on the FSAE monitor as the camera pans to it. |
| `monitor-hold`, FSAE `screen-zoom` | Fully visible, inside the monitor, growing with the zoom. |
| Car `hold` | Fully visible, full screen. |
| `data-focus` | Fades out over the first 20 %, before the camera starts its move toward the Raspberry Pi. |
| Later details, `exit`, `transfer` | Hidden. Scrolling back up reverses everything. |

## Accessibility and fallbacks

- The heading stays in the page as a visually hidden `<h2>UNB Formula Racing</h2>` inside the stage, so screen readers get it. The painted copy is `aria-hidden`.
- Reduced motion / static mode: the Formula SAE still and section heading show *UNB Formula Racing* as text.
- If the painter can't run (no canvas 2D), the scene simply has no title card; nothing else changes.

## Implementation steps

1. **Markup and CSS:** add `#fsae-title` (`<span class="first">UNB</span><span class="last">Formula Racing</span>`), reusing the `#intro-name` rules through a shared class, plus the fitted line-2 size via a CSS variable.
2. **Painter:** generalise `reel-preview.ts`'s `paintReel` into `paintElement(canvas, root, { background: 'transparent' })`, so it paints only the title text at viewport size. The ultrawide keeps the current behaviour.
3. **Scene** (`scene.ts`, new `fsae-title.ts`):
   - create the title plane in the car's group, oriented to the overview camera and placed behind the car's bounding box;
   - size it to the overview camera's viewport footprint;
   - repaint it on resize and when fonts load;
   - set its opacity from the phase table above.
4. **Fit:** project the car's bounding box at the overview camera to get its left edge, then set the line-2 size.
5. **Blender** (optional, for stills): add the same title to the FSAE poster and preview renders, so the posters match.
6. **Tests:**
   - unit test for the visibility timeline and the fit formula;
   - browser test comparing the last monitor-only frame with the first full-screen frame (same check as the ultrawide);
   - screenshots at 10/30/50/70/90 % of pan, zoom and hold on desktop and phone.

## Questions for you

1. **Line split:** `UNB` big on line 1 and `FORMULA RACING` on line 2, like DAX / MANUEL? Or `UNB FORMULA` / `RACING`?
2. **Data logging and pedal sensor views:** should the title come back when the camera returns to the overview between them, or stay hidden after the first focus (proposed)?
3. **Pill buttons:** in your full-screen screenshot, the *Data logging* / *Accelerator pedal sensor* pill buttons overlap the *Accelerator pedal sensor* callout. Should I move the pills as part of this, or leave them?

## Decisions (from review)

- Line split: **UNB FORMULA** on top, **RACING** below, left-aligned. Both lines use one fitted size: the intro name's two sizes would make the much longer top line run into the car.
- Visibility: only on the FSAE monitor and the car overview, before the zoom into the components. It fades out in the first 10 % of `data-focus` and never returns further on. Scrolling back up still reverses it.
- The pill buttons were removed separately by the FSAE detail work, so nothing was needed here.

## Results

- `src/fsae-title.ts` holds the visibility timeline and the size fit. `scene.ts` paints a card behind the car (full screen) plus an overlay on the FSAE monitor glass. `reel-preview.ts` gained a reusable `paintTree` / `paintOverlay`. The layout source `#fsae-title` lives in `index.html` / `style.css`.
- **Change from the plan:** the live car preview on the monitor is tone-mapped by the monitor's material, which turned the title grey (max `#bdbab4` instead of `#ece4d6`). So the monitor gets the same painted title as an exact-colour overlay, sized each frame to the part of the preview that becomes the full-screen view and clipped to the glass. The fit keeps a 2.5 %-of-width gap between the title and the car and its callouts, so the title never needs to sit under the car.
- **Hand-off, desktop 1440×900:** the title region of the last monitor frame and the first full-screen frame match exactly (mean error 0.0 %, whole frame 0.2 %).
- **Phone:** the full-screen frame is taller than the monitor, so at rest the title sits above the visible part of the glass. It slides in from the top edge during the zoom and lands in place.
- **Size:** desktop 1440×900 gives about 68 px, limited by the *Data logging* callout; wider screens get larger type, up to `min(9vw, 20vh)`. Phone uses 88 % of the width.
- **Tests:** `tests/fsae-title.test.ts` (2 tests) passes. The rest of the suite is unchanged: the same 6 failures exist without this work.
