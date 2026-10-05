> Implemented 2026-10-03. See `contact-card-validation.md`. Chosen label: Resume & contact; scroll-only animated entry; direct live canvas window; wide desk framing shared with the start of the printer approach.

# Plan: Last reel slot previews the contact desk (phone + printer)

## Problem

When the last project (ML Library) is active, the slot to its right shows an empty dark card with a faint glow. It's a placeholder that hints something comes next but doesn't show what. After it, the handoff cuts to the contact desk (rotary phone, notebook with links, printer) as a separate scene.

## Goal

The card after the last project becomes a window onto the contact desk. When ML Library is active, that next card already shows the desk, live and lit the same way. Scrolling on, the card slides to the centre and grows until it fills the screen, and you're on the contact desk without a cut, because you were looking at it the whole time.

## Approach: an opening in the reel, not a picture of the desk

The reel is HTML drawn over the WebGL canvas. Rather than painting a picture of the desk into the card, cut a window in the reel at the card's position and let the canvas behind it show through.

- During the reel, the canvas renders the contact desk from the camera position where the handoff ends (the start of station 5's `approach`).
- The card is a transparent window (`clip-path` / mask) in an otherwise opaque reel, so you see the live desk through it.
- `camera.setViewOffset(...)` is set every frame from the card's on-screen rectangle, so the desk sits centred inside the card instead of showing whatever part of a full-screen frame happens to be behind it.
- During the handoff, the card's rectangle grows to fill the viewport. The clip and the view offset are both calculated from that same rectangle each frame, so the desk image stays aligned while the window opens.

**Why this approach:** it's the same render, lighting and models the viewer lands on, so the preview can't mismatch the destination. There's no texture swap or cross-fade at the end.

**Fallback approach** (if the overlay structure makes a window impractical): render the desk into a `WebGLRenderTarget` from the same camera, draw that into the card, then swap to the live canvas when the card fills the screen. It's simpler, but the swap is a possible visible seam; use the same alignment check as `reel-title-and-seamless-screen-plan.md` §4.

## Current state (to confirm in code)

- `src/journey.ts`: `reel` (station 4, `REEL_UNITS = PROJECTS.length * .9 + .3`), then `handoff` (station 4, 0.9), then `approach` / `hold` (station 5).
- `src/reel.ts`: builds `#reel-track` and probably adds the trailing placeholder card (the dark card with the glow).
- `src/scene.ts`: the station 5 camera poses; the `print-job.ts` animation for the printer.
- `src/reduced-stills.ts`: `still-resume`, `still-contact`.

## Work breakdown

### 1. Turn the placeholder into the contact card

1. In `reel.ts`, replace the placeholder with a real card element, `.reel-card--next`:
   - Label at the bottom, matching the other cards: **"Resume & contact"** (or just "Contact"; see open questions). This is a real destination name, not filler.
   - No striped background and no glow. The inside of the card is the window.
   - Same size, corner radius and spacing rules as the project cards, so it moves with the track like the others.
2. It must not be counted as a project: exclude it from the "{project}, N of 4" announcement, and make sure scroll steps through the four projects are unchanged.
3. Accessibility: give it `aria-label="Next: resume and contact"`. Optionally make it a button that scrolls to station 5.

### 2. Cut the window

1. The card's inner area becomes transparent. Pick one:
   - **Clip-path on the reel's background layer:** keep the reel's backdrop as its own element and remove the card's rectangle from it (an SVG mask, or `clip-path: path(...)` with an even-odd rule, updated per frame).
   - **Simpler alternative:** if the reel's background is a single full-screen element, give it a CSS `mask-image` made of a full-screen black rectangle minus a rounded rectangle at the card's position.
2. The card's border and label sit on top, outside the window, so they stay crisp.
3. Expose the card's live rectangle each frame (`getBoundingClientRect()` on the card) to `scene.ts` via the shared state object, not by reading layout in the render loop more than once per frame.

### 3. Render the desk behind the reel

1. **Preload:** load the contact desk assets (phone, notebook, printer and desk) when the reel starts, so they're ready before the card comes into view.
2. **When to render:** only while the contact card is at least partly on screen (in practice, while card 4 is active and during the handoff). Otherwise skip the desk render.
3. **Camera:** exactly the pose that ends the current `handoff` / starts station 5's `approach`. It's fixed while the card is in its side slot; the motion comes from the card sliding, not the camera.
4. **Framing:** set `camera.setViewOffset(fullW, fullH, offX, offY, cardW, cardH)` from the card's rectangle so the desk is framed inside the card. Clear it with `clearViewOffset()` when the card fills the viewport.
5. **Cost:** use `renderer.setScissorTest(true)` with the scissor set to the card's rectangle, so only those pixels are drawn while the card is small.
6. **Idle state:** the printer and phone stay still in the preview; `print-job.ts` animation only starts once station 5 is reached.
7. **Projects desk:** while the reel covers the screen, the ultrawide desk doesn't need to be drawn. Pause it while card 4 is active and resume it when scrolling back to card 1.

### 4. Handoff: the card slides to the centre and fills the screen

Replace `handoff` (0.9) with two phases:

```ts
add("reel", 4, REEL_UNITS);
add("contact-card-center", 4, 0.4);   // contact card slides into the active slot; other cards slide away left
add("contact-card-expand", 4, 0.7);   // window grows to fill the viewport
add("approach", 5, 0.9);              // starts from exactly the expanded framing
```

- **`contact-card-center`:**
  - The track moves one step further, so the contact card becomes the active card (dashed focus outline).
  - The "PERSONAL PROJECTS" heading and the earlier cards fade and slide left.
  - "Scroll to continue" (if still shown) fades.
- **`contact-card-expand`:**
  - Ease the card's rectangle from its active-slot size to the full viewport with zero corner radius.
  - The window clip, the view offset and the scissor all follow that rectangle every frame.
  - The dashed outline and the label fade over the first 30%.
  - At the end, the reel overlay is hidden, the view offset is cleared, and the canvas is drawing the full desk.
- **`approach` (station 5):** must start from exactly the expanded framing. Its first frame equals the last frame of `contact-card-expand`.
- Scrolling backward runs these phases in reverse: the window shrinks back into the card and the reel overlay returns.

### 5. Reduced motion and fallback

- **Reduced motion:** the contact card shows a still image (cropped from `still-resume` / `still-contact` at the same framing) instead of a live window. The handoff is a short cross-fade to the contact still.
- **No WebGL** (`#fallback`): add a "Resume & contact" entry after the project list that links to `#accessible-contact`.

### 6. Review tooling

- Add the new phase kinds to the review panel.
- Add review hooks for: card 4 active with the preview visible, middle of `contact-card-center`, middle of `contact-card-expand`, and first frame of station 5's `approach`.

## Acceptance checklist

- [ ] With ML Library active, the next card shows the contact desk live (phone, notebook, printer), not an empty glow.
- [ ] The desk is framed in the card's centre, not cropped from the side of a full-screen frame.
- [ ] The card is labelled "Resume & contact" and isn't counted or announced as a project.
- [ ] Scrolling on, the card becomes the active card, then grows to fill the screen with no cut, swap or cross-fade.
- [ ] The desk image stays aligned to the window as it grows (no jumping or sliding inside the frame).
- [ ] The first frame of station 5 matches the last frame of the expansion exactly.
- [ ] Scrolling backward reverses everything exactly.
- [ ] Contact assets are loaded before card 4 becomes active; no pop-in inside the card.
- [ ] The printer and phone stay still in the preview; their animations start only at station 5.
- [ ] Frame rate holds during the reel and the expansion (the scissor limits rendering while the card is small).
- [ ] Reduced-motion and no-WebGL paths show the contact entry.
- [ ] Works at 1280, 1440, 1920 and 2560 wide, and on mobile, where the card positions differ.

## Open questions

1. Card label: "Resume & contact", "Contact", or "Get in touch"?
2. Should the card be clickable to jump straight to the contact desk?
3. Does the reel's backdrop allow cutting a window in it (step 2), or should this use the render-target fallback?
4. Should the preview be the station 5 framing (the full desk) or a closer crop on the phone and notebook, opening up to the full desk during the expansion?