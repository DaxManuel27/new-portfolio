# Projects Reel Plan

Status: plan only. Next: Figma storyboard, then Blender, then `web/`.

## Goals

1. Clean hand-off from **Ultra Maritime** into **Projects** with no readable text zoomed through.
2. A clean way to **retire the MacBook** for good once Projects starts.
3. An Oryzo-style reel: big centred portrait card with dashed frame, next cards queued on the right, past cards dimmed on the left, two-line headline on the left, "SCROLL TO CONTINUE".
4. The last card hands off into the shared Resume/Contact desk.
5. One continuous scroll, no clicks or choices, fully reversible.

## Station order

Intro, Hack Atlantic, Formula SAE, Ultra Maritime, **Projects reel**, Resume, Contact.
The reel replaces the old 3D Projects station (ultrawide monitor clearance route). Station index 4 stays; its content changes.

## Beat 1 (revised): Ultra Maritime dives into the MacBook screen, which becomes the reel

Decision: the exit is a screen dive, not a lid-close and slide-away. The MacBook is retired by the camera going into its screen.

| Scroll slice | What happens |
|---|---|
| 0-15% | Ultra Maritime hold ends. Camera starts pushing toward the open MacBook. |
| 15-40% | While the camera is still far enough that the screen is small, the screen content crossfades from the Ultra Maritime page to the Projects screen (reel preview: headline + card strip). No readable text is zoomed through. |
| 40-85% | Dive: camera eases into the screen until the screen rectangle fills the viewport; desk, monitors and laptop body slide off the edges. |
| 85-100% | The live 3D layer is swapped for the DOM reel (pixel-matched to the screen content at that framing); MacBook and station are hidden (`visible=false`). |

Why this works: the screen swap happens at a distance, so the reader never sees the old text blur while zooming. The reel is the screen, so there is no cut.

Implementation notes:
- The Projects screen texture already exists in Figma (`Screen XL / Projects`); the laptop screen material swaps texture mid-dive.
- The final frame of the dive and the first reel frame must match: the DOM reel is laid out to the same rectangle as the screen at the end framing (aspect handled by letterboxing the backdrop).
- Pure function of scroll; reverse reverses the dive and re-shows the 3D scene.
- Reduced motion / phone: crossfade from the Ultra Maritime poster to the reel, no dive.
- MacBook is hidden for the rest of the journey and never appears at Resume or Contact.

## Beat 2: The reel (Projects)

DOM overlay on top of an empty canvas (no 3D needed), driven by the same scroll progress.

- Cards: 4 now (Hack Atlantic ATS, Recap - iOS app, Codex for CAD, ML Library), plus a couple more later. Layout is data-driven so adding a card is one entry: `{ title, media }`.
- Slots: past (dim, left, small), active (centre, large portrait, dashed frame), next 1-2 (right, medium), rest (right, small, partly off-screen).
- Headline (left): small uppercase label (`PROJECT 02`) plus the big project title. Cross-fades with a short vertical slide per card.
- Counter (e.g. `02 / 06`) and "SCROLL TO CONTINUE" at the bottom, hidden on the last card.
- Scroll budget: about 1 viewport-height of scroll per card, plus a short hold at each card centre so the active card feels settled (ease in/out, scrubbed, no snapping).
- Card contents: title only, plus a media placeholder (neutral portrait panel with the project title and a subtle pattern) until real media arrives. Swapping in an image or video later is a one-line change per card.

## Beat 3: Last card to Resume/Contact desk

1. On the final card the centre portrait card scales up until its dashed frame meets the viewport edge.
2. The card face is a still of the shared desk, rendered from the desk arrival camera (poster already exists for static mode).
3. Crossfade (about 15% of the slice) from the still to the live 3D desk at the same camera pose, so there is no jump.
4. Reel DOM fades out, desk arrival animation continues as it does today (desk-arrival.ts), then Resume to Contact as before.
5. Reverse: the live desk fades back to the still, the still shrinks back into the card slot, queue returns.

The last project card is therefore always followed by an extra "desk" card in the data (no text, just the still), so the logic stays uniform.

## Implementation outline (`web/`)

- `journey.ts`: station 4 phases become `exit` (laptop leaves), `reel` (n cards), `handoff`; `totalUnits` recomputed from card count.
- New `reel.ts`: pure `reelState(progress, cards)` returning slot transforms/opacity; `main.ts` applies them to DOM nodes.
- `hero.ts`: add `exit` pose and visibility; keep the `close before travel` hooks.
- `scene.ts`: drop the Projects GLB and ultrawide clearance route from the load list (saves download weight; loader progress math adjusts automatically); keep the desk GLB preload so the handoff is instant.
- `projects-motion.ts`: retire (move to `legacy/` rather than delete until tests are updated).
- Tests: update `tests/browser.mjs` station list; add checks for MacBook hidden after exit, reversibility, and no layout shift at handoff.
- Accessibility: reel content also exists in `#accessible-contact`-style fallback list; static/reduced-motion mode shows cards as a plain vertical list.

## Figma storyboard (done)

Section `Reel flow / Ultra Maritime → Projects → Contact` at the bottom of the motion board (below `Scroll transitions — Blender reference`). Row A has the 10/30/50/70/90% exit keyframes; row B has the reel states and the card-to-desk handoff. The desk stills are placeholders from the bare `Desk / 3-4 view` component; the real still comes from the desk arrival camera in Blender.

## Figma storyboard (original scope)

Frames to add to the motion board: Ultra Maritime closing, laptop leaving, reel card states (first / middle / last), card to desk handoff, mobile reel. Same 10/30/50/70/90% keyframe convention.

## Open questions

1. **Screen dive**: still undecided. Intro to Hack Atlantic is the only candidate where the screen has no text.
2. **Card media** (when it arrives): static images, short looping video, or mock-ups.

## Implementation plan (phased, each phase shippable and testable)

Scope: Ultra Maritime → Projects reel → Resume/Contact only. Intro, Hack Atlantic and Formula SAE stay untouched.

### Phase 0: Safety net
- Run `npm test` and `tests/browser.mjs` now to record a baseline (the loader, intro name and notebook hotspot changes have not been re-tested).
- Commit or copy the current state so the old Projects station can be restored.

### Phase 1: Screen dive (Blender + hero rig)
- Blender: camera dive keyframes into the MacBook screen at Ultra Maritime; screen material texture swap (Ultra Maritime to Projects) during the push-in; export the dive samples in `journey.json`.
- `journey.json`: replace the old Projects camera pose and travel samples with the exit leg; Projects camera becomes a neutral empty-backdrop pose.
- `hero.ts` / `scene.ts`: screen texture crossfade driven by scroll; hide hero and station at the end of the dive, restore on reverse.
- Check: scrub forward and back across the dive; the swap and the hand-off to the DOM reel are seamless, no pops.

### Phase 2: Remove the old 3D Projects station
- `scene.ts`: stop loading the Projects GLB and the ultrawide route; keep the shared desk GLB preloaded.
- Retire `projects-motion.ts` (move to `legacy/`), drop its references from `journey.ts` and `desk-arrival.ts`.
- Check: loader progress still reaches 100 and total download shrinks.

### Phase 3: Reel UI (DOM)
- `index.html`: `#reel` container (headline label + title, card track, counter, "SCROLL TO CONTINUE"), hidden outside the Projects range.
- New `reel.ts`: `reelState(progress, cards)` pure function returning per-card slot (past / active / next / far), transform and opacity; `main.ts` applies it each frame.
- `style.css`: portrait cards with dashed frame on the active one, dim past cards, media placeholder panel, mobile layout.
- Card data: `{ title, media }` list with Hack Atlantic ATS, Recap - iOS app, Codex for CAD, ML Library, plus two TBD slots.
- Check: card centred at each hold, smooth between, headline cross-fade, counter correct.

### Phase 4: Scroll budget
- `journey.ts`: station 4 phases become exit, reel (one slice per card plus hold), handoff; `totalUnits` derived from card count so adding a project needs no manual retuning.
- Check: total scroll length, no dead zones, `ScrollTrigger` ranges for later stations shift correctly.

### Phase 5: Reel to desk handoff
- Render the desk still from the desk arrival camera (Blender), use it as the extra last card and as the static-mode poster.
- Handoff slice: card scales to the viewport, crossfade to live 3D at the same camera pose, reel hidden afterwards.
- Resume and Contact stay as they are; confirm no MacBook appears on the shared desk.
- Check: pixel comparison of the still against the first live frame; reverse scroll.

### Phase 6: Accessibility, reduced motion, mobile
- Reduced motion / static mode: skip the exit animation, reel becomes a plain vertical list, desk poster shown.
- Mobile: single active card, next card peeking, headline above the card.
- Keep the hidden accessible fallback list in sync with the card data.

### Phase 7: Verification
- Update `tests/browser.mjs` station list and add tests: MacBook hidden after Projects and visible again on reverse, active card at each hold, handoff has no layout shift, no console errors.
- Playwright screenshots at 10/30/50/70/90% of the exit and at each card hold, compared against the Figma storyboard.
- Manual pass on the real preview (127.0.0.1:5173) at desktop and phone sizes, forward and reverse.

### Order and risk
Phases 1 and 2 are the riskiest (journey timing and desk arrival depend on the old Projects route), so they go first; Phases 3 and 4 can then be built and tuned without touching 3D. Phase 5 needs the Blender desk render. Media can be dropped in at any time after Phase 3.
