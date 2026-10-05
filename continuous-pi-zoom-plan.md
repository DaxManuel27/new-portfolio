# Plan: Continuous zoom into the data logger (one Raspberry Pi, no swap)

## Goal

Replace the current "zoom in → fade out → fade in a separate Pi scene" with one continuous shot of the same Raspberry Pi 5 that sits behind the driver's seat:

1. The camera dives from the full car to the Pi behind the seat.
2. The rest of the car fades away around it. The Pi stays exactly where it is and keeps being rendered the whole time.
3. Against black, the camera settles into the hero framing, with the Pi on the right half of the screen.
4. The text panel appears ("Data logging", then "Raspberry Pi 5", then body copy; licence credit lives in contact).
5. On the way out, the same steps run in reverse.

No cut, no swap to a second copy of the Pi, and no fade of the whole frame to black.

## Current state (from reviewing the running site)

What a viewer sees now in `data-focus` → `data-hold` → `data-return`:

- The camera pushes in from above, through the roll hoop, toward the small green Pi on the floor behind the seat.
- At a threshold the frame fades out, and a different framing of the Pi fades in on black with the text panel.

What the code does (`src/scene.ts`, around lines 794–811; line numbers are from the dev build and may drift):

```ts
const inCar = active && focus.amount < .86;
const anchor = this.manifest.reorder.car.anchors?.[id];
group.position.fromArray(inCar && anchor ? anchor : DETAIL_ORIGIN);
group.scale.setScalar(inCar ? .25 : 1);
group.rotation.set(0, inCar ? -Math.PI / 10 : 0, 0);
const opacity = inCar ? ease((focus.amount - .12) / .18) * focus.carOpacity : focus.de…
```

The same detail group exists in two places. Below `focus.amount = .86` it sits at the car anchor (scale 0.25, yaw −π/10). Above that it jumps to `DETAIL_ORIGIN` (scale 1, no yaw). The fade hides that jump, and the jump is the "new screen" the viewer notices.

Relevant files:

- `src/journey.ts`: phases `data-focus` (1.1), `data-hold` (1.8), `data-return` (1.1) at station 3.
- `src/fsae-focus.ts`: `fsaeFocus(state)`, which returns `amount`, `carOpacity`, the detail opacity and the active project.
- `src/scene.ts`: detail-group placement and opacity, camera code for station 3, and `loadDetails()`.
- `index.html` / `main.ts`: the `#fsae-detail` text panel and its show/hide logic.
- `src/reduced-stills.ts`: `accessible-fsae` and `static-fsae-data-logging`.

## Core idea

Keep the Pi fixed where it sits in the car and move the camera and the car instead.

- The detail group stays at the car anchor for the whole sequence. Delete the `inCar` / `DETAIL_ORIGIN` branch for this project.
- The "detail view" becomes a camera pose near that anchor, not a separate place in the scene.
- Once the car has faded away, the Pi is the only thing on screen against black, so the camera can orbit freely to the hero angle.

## New phase sequence

```ts
add("data-dive", 3, 0.9);      // camera moves from full car to the Pi; car still fully visible
add("data-isolate", 3, 0.7);   // car fades to black around the Pi; camera orbits to hero framing
add("data-reveal", 3, 0.4);    // text panel appears in stages
add("data-hold", 3, 1.2);      // reading time (was 1.8; the reveal now takes part of that)
add("data-return", 3, 1.1);    // text out → car fades back in → camera pulls back to full car
```

- Total for this stretch: about 4.3 units, up from 4.0. Shorten `data-hold` if you want to keep the old length.
- `#fsae-data-logging` should land in the middle of `data-hold`. Check how the hash anchor maps to scroll position.
- `data-return` must end on exactly the full-car framing, because the next phase (`car-shrink` in the projects transition plan) starts from it.
- Remove `data-focus`. Update `fsaeFocus`, the review panel's labels and phase boundaries, and any tests.

## Work breakdown

### 1. Keep the Pi at its anchor

1. For the data-logging project, always place the detail group at `manifest.reorder.car.anchors["data-logging"]` (or whatever the ID is), at its in-car scale and yaw. Remove the `.86` threshold swap.
2. Make sure the detail model is loaded before `data-dive` starts. `loadDetails()` already runs for stations 2 and 3; confirm it has finished by the time the camera arrives at the car, otherwise a low-detail placeholder will show during the dive.
3. If the in-car Pi is currently a lower-detail stand-in, replace it with the full-detail Pi 5 model at 0.25 scale so it's the same mesh the whole time.

### 2. Camera move (`data-dive`)

- **Start:** the current full-car framing at the end of `hold` (station 3).
- **End:** a close framing of the Pi from above and behind the seat, looking through the gap in the roll hoop. The current push-in already finds a clear line of sight; reuse it.
- Interpolate position with an eased spline (Catmull-Rom with one intermediate point above the roll hoop), not a straight lerp, so the camera clears the tubes.
- The "Data logging" callout and its leader line fade out over the first ~25% of the dive.
- **Near plane:** at the 0.25 anchor scale the camera ends up close to the board. Lower `camera.near` (for example to 0.005) from mid-dive through `data-return`, call `updateProjectionMatrix()`, and restore it afterwards.

### 3. Fading out the car (`data-isolate`)

Fading a car with many meshes using plain alpha transparency causes sorting problems: the far side shows through the near side and interior faces flash. Use this approach instead:

1. **Darken to black first.** The background is black, so blend the car's material colours (and emissive, if any) toward black over the first ~70% of the phase. It reads as a fade with no transparency sorting. A shared uniform, `uCarFade`, injected with `onBeforeCompile`, keeps this to a single value per frame.
2. **Then stop it occluding the Pi.** Once the car is fully dark, set `car.visible = false` so its tubes and seat can't block the Pi while the camera orbits.
3. **Fallback:** if pure darkening looks flat, use `material.alphaHash = true` (dithered transparency, three r15x+) for the last 30%. It avoids sorting and blends well with TAA/MSAA.
4. Also fade the other detail anchors in the car (for example the grey module beside the seat) and their contact shadows.
5. **Lighting:** cross-fade from the car lighting to the detail lighting during this phase, so the Pi ends up lit the way the current hero shot is. Don't switch light rigs instantly.

### 4. Settling on the hero framing (during `data-isolate`)

- With the car gone, orbit the camera around the Pi's centre from the top-down "behind the seat" angle to the current three-quarter hero angle. This replaces the old −π/10 yaw correction: rotate the camera, not the Pi.
- **Framing for the text panel:** the Pi should sit in the right half of the screen with the text on the left. Use `camera.setViewOffset(...)` (or offset the look-at target) as the phase progresses, so the Pi drifts right as the text space opens up.
- Optional: a very slow idle rotation of the camera around the Pi during `data-hold`, driven by scroll position so scrubbing still matches.

### 5. Text panel (`data-reveal`)

- Drive it from scroll position (`state.local`), not a CSS timer, so scrolling backward reverses it exactly.
- Staggered order, each item fading in (opacity 0 → 1) and moving up 12 px:
  1. Eyebrow `FORMULA SAE / 01`
  2. Title `Data logging`
  3. Subtitle `Raspberry Pi 5`
  4. Lead sentence, then divider, then body copy
  5. Licence credit, last and quietest
- Each item takes about 40% of the phase and starts about 15% after the previous one.
- Respect `prefers-reduced-motion` and the site's "Reduce motion" toggle: opacity only, no movement.
- Keep `#fsae-detail` in the accessibility tree the whole time; hide it visually only, so screen-reader order is unaffected.

### 6. Return (`data-return`)

Exact reverse of the above:

1. Text items fade out in reverse order (first ~25%).
2. The camera orbits back to the behind-the-seat angle while the car un-hides and fades back up from black.
3. The camera pulls back to the full-car framing. The callout and the "UNB FORMULA RACING" title can come back if the projects transition plan isn't implemented yet; if it is, leave them hidden, since `car-shrink` follows.

### 7. Reduced motion and fallback

- **Reduced motion:** replace the dive with a cross-fade from the full car to the Pi hero still, with the text appearing by opacity only.
- Re-render `static-fsae-data-logging` and any related poster from the new hero framing, so the still matches the live shot.

### 8. Review tooling

- Add the new phase kinds to the review panel.
- Add review hooks for: end of `data-dive`, middle of `data-isolate` (car half-dark), end of `data-isolate` (Pi alone), and middle of `data-hold`.

## Acceptance checklist

- [ ] The Pi on screen is the same object from the full-car shot to the hero shot; no position, scale or model swap at any point.
- [ ] No fade of the whole frame to black between the car and the detail view.
- [ ] The camera never clips through the roll hoop, seat or bodywork during the dive.
- [ ] The car fades out without transparency sorting artefacts (no far side showing through, no flicker).
- [ ] The Pi is never hidden behind the darkened car; the car is removed from rendering once fully dark.
- [ ] Lighting moves smoothly from the car look to the detail look.
- [ ] The Pi ends up on the right half with the text panel on the left, matching the current layout.
- [ ] The text appears in stages and reverses exactly when scrolling back up.
- [ ] The "Data logging" callout is gone before the camera reaches the Pi.
- [ ] `data-return` ends exactly on the full-car framing (needed for `car-shrink`).
- [ ] `#fsae-data-logging` deep link lands in `data-hold`.
- [ ] Reduced-motion path works; still images match the new framing.
- [ ] No clipping or z-fighting on the Pi at close range.
- [ ] Frame rate holds on a mid-range laptop and mobile during the fade.

## Open questions

1. Is the in-car Pi already the full-detail model at 0.25 scale, or a separate low-detail stand-in?
2. Is the grey module beside the seat its own detail project, and will it get the same treatment later?
3. Darken-to-black versus `alphaHash`: decide after a quick test on the actual car materials.
4. Should the hold include a slow camera orbit around the Pi, or stay perfectly still?

## Implementation decisions — 3 October 2026

Use the existing official Pi 5 GLB at the fixed data anchor, scale 0.25 and yaw −π/10. Keep the reading camera still. Add the five requested phases (4.3 units total) and preserve the concurrently implemented car-shrink → projects-reveal → projects-monitor-entry route after the exact full-car return. Darken the rendered car after lighting and tone mapping using a shared uniform, then remove its depth occlusion at full darkness. Preserve car material colours and all existing lighting elsewhere. Text reveals remain pure scroll functions, with normal accessible document flow in reduced mode. Validate camera geometry, fixed Pi transforms, phase joins, reverse/direct seeks, loading failures and existing journey regression.


## Implementation findings

The original logger anchor was under a closed rear-body panel. A fixed 46 × 46 mm access bay was opened in that panel, without moving the Pi. The new camera route uses an elevated waypoint and a behind-seat close view; 1,000 samples prove no camera/car intersection and an unobstructed final approach. The Pi remains at scale 0.25, yaw −π/10 and the same anchor throughout the full data sequence.

Concurrent content cleanup removed the eyebrow, lead and visible credit; those edits were preserved. The reveal stages the current title, subtitle and body. MIT attribution remains distributed with the model. Reduced motion retains normal document flow and adds a local opacity-only car-to-Pi still crossfade. Final evidence is in `continuous-pi-zoom-validation.md`.
