# Plan: Persistent "Personal Projects" title + seamless ultrawide → reel handoff

## Problems

1. **The project name appears twice.** The reel's large top-left title (`#reel-title`, for example "Hack Atlantic ATS") repeats the name already shown on the active card. It also changes on every card, which makes the reel feel like a series of separate pages instead of one section.
2. **The ultrawide screen shows two images on top of each other.** During `projects-monitor-entry`, the screen shows a separate "PERSONAL PROJECTS" title card that cross-fades into the painted reel preview. Midway, the giant title sits on top of the cards and the old "Hack Atlantic ATS" heading. It looks like two screens rather than one.

## Fix in one sentence

Make "Personal Projects" the reel's fixed title, so the reel layout itself is the title card. The ultrawide then shows exactly the same image from the moment it appears until the HTML reel takes over, with no cross-fade.

## Target design

- **Top-left of the reel:** "PERSONAL PROJECTS" replaces `#reel-title`. It stays fixed while the cards move; it never changes per card.
- **Typography:** match "UNB FORMULA RACING" (`#fsae-title`): same family, weight, uppercase and two-tone colouring (first word cream, second word taupe), so the two chapters visibly match.
- **Size:** keep it on one line in the top band above the cards (the cards start at roughly 21% of the viewport height). Start around `font-size: clamp(3rem, 7vw, 8rem)` and adjust by eye so it never overlaps the active card at common widths (1280, 1440, 1920, 2560, and mobile).
- **Per-project names:** shown only on the cards, as now.
- **Ultrawide screen:** shows this same layout (title plus first-card state) whenever it's visible: during `desk-fade`, `projects-reveal` and `projects-monitor-entry`.

## Work breakdown

### 1. Replace `#reel-title` with the fixed section title

Likely files: `index.html`, `src/reel.ts`, reel CSS.

1. Replace the `#reel-title` element with a fixed heading:
   ```html
   <h2 id="reel-heading" class="section-title">
     <span class="first">Personal</span> <span class="last">Projects</span>
   </h2>
   ```
   Reuse the `.first` / `.last` classes from `#fsae-title` if they carry the two-tone colours, so both titles share one style.
2. In `reel.ts`, delete the code that sets the title's text per active card, plus any per-card title transition (fade or slide between names).
3. Keep the screen-reader announcement planned in `remove-filler-text-plan.md`: a visually hidden `aria-live="polite"` element announcing "{project name}, N of 4". The project name no longer appears in a heading, so this is now the only per-card announcement.
4. Optional: make the active card's name slightly larger or brighter, since it's now the only visible project name.
5. Remove CSS that only existed for the per-card title (for example size transitions or text-swap animation).

### 2. Remove the separate ultrawide title card

Undo step 2 of `fsae-to-projects-transition-plan.md`, if it's implemented:

1. Delete the second canvas texture used for the "PERSONAL PROJECTS" title card and the cross-fade between it and the reel preview.
2. The ultrawide screen uses one texture: the reel preview painted by `paintReelPreview()`.
3. Remove the phase logic that switched textures or blended between them during `projects-reveal` / `projects-monitor-entry`.

### 3. Make the painted preview match the HTML reel exactly

`paintReelPreview(root, stage, key)` already paints the reel's laid-out first frame onto the curved glass, so once step 1 is done the painted frame includes the new title automatically. To keep it a perfect match:

1. **Paint before the screen is visible.** Trigger the paint when station 3 begins, or at the latest before `desk-fade`. If the preview isn't ready, the screen must not show a placeholder and then swap.
2. **Wait for fonts.** Await `document.fonts.ready` (or the specific `FontFace.load()`) before painting. Otherwise the first paint can use a fallback font and visibly change when it repaints.
3. **Paint the first-card state.** First card active, cards at their starting positions, title fully visible. Decide whether "Scroll to continue" appears in the painted frame; whatever you choose, make the HTML reel match on its first frame.
4. **Repaint on change.** Include viewport size, device pixel ratio and font readiness in the preview `key`, so a window resize repaints the texture before it's next seen.
5. **Colour match.** The screen material is `MeshBasicMaterial` with `toneMapped: false`, which is correct. Also make sure the canvas texture uses `texture.colorSpace = THREE.SRGBColorSpace`, so the title and card colours on the glass match the HTML.

### 4. Make the swap from screen to HTML reel invisible

At the end of `projects-monitor-entry`, the camera has pushed in until the screen fills the viewport, and the HTML reel takes over.

1. Confirm that the last frame of `projects-monitor-entry` lines the screen's content up with the viewport, so the painted title sits exactly where the HTML title will be. Compare a screenshot of that frame with the HTML reel's first frame by overlaying them at 50% opacity.
2. If they line up, swap instantly (HTML on, canvas hidden) in a single frame. If the curved glass leaves a small mismatch, use a very short cross-fade (0.05 units or less). Both images then show nearly identical content, so it won't read as a fade.
3. Scrolling back up must swap the other way at the same point.

### 5. Static, reduced-motion and fallback paths

1. Reduced-motion stills: update `still-ultrawide` and `still-projects` to show "PERSONAL PROJECTS" as the title instead of the first project's name.
2. Update `#stills` / `#fallback` markup so the projects section heading is "Personal projects".
3. Re-render any poster image showing the old per-project title or the separate title card.

### 6. Update the other plans

- `fsae-to-projects-transition-plan.md`: step 2 (the title card on the ultrawide) is replaced by this plan.
- `remove-filler-text-plan.md`: step 1.6 ("move `#reel-title` up") now applies to `#reel-heading`. Once the `PROJECT 0N` eyebrow is gone, align the heading to the top margin.

## Acceptance checklist

- [ ] The reel's top-left shows "PERSONAL PROJECTS" and it doesn't change as you scroll through the cards.
- [ ] The project name appears only once (on the card).
- [ ] The title matches "UNB FORMULA RACING" in font, weight, case and two-tone colouring.
- [ ] The title never overlaps the active card at 1280, 1440, 1920 or 2560 wide, or on mobile.
- [ ] The ultrawide shows the reel layout with the new title from the first frame it's visible; there's never a separate title card.
- [ ] No cross-fade or double image on the ultrawide at any point during `desk-fade`, `projects-reveal` or `projects-monitor-entry`.
- [ ] The painted preview uses the correct font on first paint (no visible font change).
- [ ] The swap from screen to HTML reel is invisible at normal scroll speed, in both directions.
- [ ] Screen readers announce "{project}, N of 4" when the active card changes.
- [ ] Reduced-motion stills and fallback text show "Personal projects" as the section title.

## Open questions

1. One line or two lines for "PERSONAL PROJECTS"? Two lines matches "UNB FORMULA RACING" more closely but pushes into the card area. One line is the default here.
2. Should "Scroll to continue" appear in the painted screen frame, or only after the HTML reel takes over?
3. Should the active card's name get more emphasis now that it's the only visible project name?