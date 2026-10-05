> Screen-title presentation is superseded by `reel-title-and-seamless-screen-plan.md`: one persistent reel heading, one preview texture, and no title-card blend.

> Implemented 2026-10-03. The car-to-desk route, monitor title blend, Blender source/export, updated poster, reduced-motion crossfade, and review hooks are complete. See `fsae-car-desk-model-validation.md` for results.
>
> Integration note: newer Pi-section work in the shared workspace uses `data-dive → data-isolate → data-reveal → data-hold`. Those changes are preserved; timeline positions are derived from the phase list. The Formula heading already stays hidden on the return in that revision. The desk and monitor portions below remain the implemented design.

# Plan: Formula SAE → Personal Projects transition ("car becomes the desk model")

## Goal

Replace the current exit from the Formula SAE chapter (the pull-back through the FSAE monitor followed by a long sideways pan through empty space to the wooden desk) with one continuous move:

1. The camera stays on the full Formula SAE car after the Raspberry Pi detail.
2. The car shrinks to scale-model size. The camera stays locked to it, so the car keeps the same size on screen.
3. The wooden projects desk appears underneath the car.
4. The camera pulls back to show the car as a model on the desk beside the ultrawide, then pushes into the monitor and the reel.

Also in scope:

- Delete the floating 3D "PERSONAL PROJECTS" text on the projects desk.
- Move that chapter title onto the ultrawide screen as a title card, styled like the "UNB FORMULA RACING" title card on the FSAE monitor.

## Current state (from reviewing the running site)

Phase sequence in `src/journey.ts`, station 3 → 4:

| Phase | Station | Length (units) | What happens |
|---|---|---|---|
| `data-focus` | 3 | 1.1 | Camera moves into the Pi 5 detail |
| `data-hold` | 3 | 1.8 | Pi 5 detail panel |
| `data-return` | 3 | 1.1 | Back out to the full car |
| `car-monitor-return` | 3 | 1.2 | Pull out through the FSAE monitor to the grey workstation desk |
| `projects-desk-travel` | 4 | 1.2 | Sideways pan through empty space to the wooden desk |
| `projects-monitor-entry` | 4 | 1.0 | Push into the ultrawide |
| `reel` | 4 | `REEL_UNITS` | Projects reel |

Relevant code locations (line numbers are from the dev build and may drift):

- `src/journey.ts`: the `add(...)` phase list (around lines 36–63). `evaluate()` assigns `cameraMode`, `cameraMix` and `dock` per phase kind; the `car-monitor-return` and `projects-*` kinds share the `"station"` branch.
- `src/scene.ts`:
  - Around lines 794–811: `fsaeFocus(state)`, `entry`, `deskTravel`, and `carProgress` (which checks for `car-monitor-return`). This is where the detail groups and the car's opacity are driven.
  - Around lines 586–605: setup of the screen materials (`Screen_Ultrawide_Projects`, `Screen_Workstation_UM`). The comment there says the FSAE monitor shows the car through a live portal/render target.
  - Around lines 1227–1245: `paintReelPreview()` / `needsReelPreview()`, which paint the reel's first frame onto the ultrawide glass.
- `src/fsae-focus.ts`: logic for focusing on the car and its details.
- `src/reduced-stills.ts`: stills used for reduced motion, including `still-ultrawide` ("Ultrawide → Projects").
- The scene manifest (`this.manifest.reorder...`): car anchors and ultrawide screen geometry.

## New phase sequence

```ts
add("data-focus", 3, 1.1);
add("data-hold", 3, 1.8);
add("data-return", 3, 1.1);
add("car-shrink", 3, 1.3);        // NEW: camera locked to car, car scales to model size
add("projects-reveal", 4, 0.8);   // NEW: pull back off the model to frame desk + ultrawide
add("projects-monitor-entry", 4, 1);
add("reel", 4, REEL_UNITS);
```

- Remove `car-monitor-return` (1.2) and `projects-desk-travel` (1.2).
- The net change is −0.3 units, so `totalUnits` goes from about 26.0 to about 25.7. Check that the scroll-space height and any hash anchors (for example `#fsae-data-logging`) are calculated from `phases`, not hardcoded scroll positions.
- Update every reference to the removed kinds: the `evaluate()` camera branch, `carProgress`/`deskTravel` in `scene.ts`, `fsaeFocus`, the review panel's chapter boundaries, and any tests.

## Work breakdown

### 1. Remove the 3D "PERSONAL PROJECTS" text

1. Find the mesh. It is probably inside the projects desk GLB, under a name like `Text_PersonalProjects`. To find it, log `group.traverse(o => console.log(o.name))` when the projects desk loads.
2. **Preferred fix:** delete the text object in the Blender source and re-export the GLB, so its geometry never ships.
3. **Quick fix while waiting on the re-export:** in the same `traverse` that sets up the screen materials, call `o.removeFromParent()` and dispose the mesh's geometry and material when its name matches.
4. Check for anything that used the text as a layout reference, such as camera targets, light targets or manifest anchors. The car model will sit in roughly the same spot, left of the keyboard, so that position can become the car's desk anchor (see step 3).
5. Regenerate or update the `still-ultrawide` reduced-motion still and the poster image if they show the text.

### 2. Show the complete reel layout on the ultrawide

Use the painted first frame of the reel throughout the desk reveal and monitor entry. Its fixed one-line PERSONAL PROJECTS heading uses the FSAE title family, weight, uppercase and two-tone colours. Do not create a separate chapter canvas or blend it over the reel. See `reel-title-and-seamless-screen-plan.md`.

### 3. Car shrink (`car-shrink`)

**Poses**

- `carStart`: the car's current world transform at the end of `data-return` (position, quaternion, scale).
- `carEnd`: the car resting on the wooden desk the way a display model would sit. Add it to the manifest as something like `manifest.reorder.projects.carModel`.
  - **Placement:** the back-left area of the desk, where the 3D text used to be, clear of the keyboard and slightly behind its line.
  - **Resting pose:** all four tyres flat on the desk, with no roll or pitch. Wheels straight; optionally steer the fronts a few degrees for character.
  - **Angle:** turned 30–45° off the desk edge, nose toward the viewer, so the reveal camera sees it in three-quarter front view. Match the car's orientation to the camera in the "UNB FORMULA RACING" title card, so the shrink needs little rotation and the reveal looks like the same shot.
  - **Scale:** about 1:12–1:18 (a 2.9 m car becomes 16–24 cm), a bit shorter than the keyboard.
  - **Optional:** a thin display base (dark or clear acrylic, a few millimetres tall) so it reads as a collectible model rather than a toy left on the desk. If you use one, fade it in with the desk.
  - **Grounding:** a soft contact shadow under each tyre (or the base), so it doesn't look like it's floating.

**Interpolation (with `t = ease(state.local)`)**

```ts
const s = s0 * Math.pow(s1 / s0, t);          // exponential scale: shrinking looks steady
position.lerpVectors(p0, p1, t);
quaternion.slerpQuaternions(q0, q1, t);
carMatrix.compose(position, quaternion, scaleVec.setScalar(s));
```

Use exponential scale on purpose. With a linear lerp, most of the visible shrinking happens in the last few frames.

**Camera stays locked to the car**

- Record the camera's offset in the car's local space at the start of the phase:
  `localOffset = cameraPos.applyMatrix4(carStartMatrix.clone().invert())`.
- Each frame:
  `camera.position.copy(localOffset).applyMatrix4(carMatrix)` and `camera.lookAt(carCenterWorld)`.
- Because the offset scales with the car, the framing stays the same. Add a slight orbit by slerping in a small yaw so the frame has some visible motion.
- Add a new `cameraMode` (for example `"car-anchored"`) in `evaluate()` for this phase so it skips the existing station/travel camera code.

**Portal versus real geometry**

- The FSAE monitor shows the car through a render target. During `car-shrink`, the car has to render directly in the main scene.
- Option A (cleaner): reparent or move the same car object and stop the portal render for this phase.
- Option B (safer): at the first frame of `car-shrink`, while the car fills the frame against black, hide the portal car and show a clone at an identical transform. Either way, check that this first frame matches the last frame of `data-return` exactly.

**Clipping and depth**

- At model scale the camera ends up a few centimetres from the car. Lower `camera.near` (for example to 0.005) for `car-shrink` and `projects-reveal`, call `updateProjectionMatrix()`, and restore the original value afterwards.
- Check for z-fighting on the desk surface and the car's floor pan at the smallest scale. If it appears, lift the car's desk anchor slightly.

**Hiding the old scenery**

- Fade out the "UNB FORMULA RACING" title and the "Data logging" callout (including its leader line) in the first ~30% of `car-shrink`.
- Hide the FSAE monitor, the grey workstation desk and the mug for the whole phase. The background should stay pure black until the desk fades in.

### 4. Desk appears (last third of `car-shrink`)

- Fade the wooden desk, keyboard, mouse and ultrawide in from black. Use material opacity, or set lighting intensity from 0 to 1 if the materials can't be made transparent cleanly.
- Fade in a contact-shadow decal (or turn on shadow casting) under the car together with the desk light. A shadow that switches on at once will reveal the trick.
- The ultrawide is behind the camera's focus here. It should already show the reel layout from step 2, even though it's still out of focus or out of frame.

### 5. Reveal (`projects-reveal`)

- Ease the camera from the car-anchored framing to a wider framing showing the model car in the foreground left, the keyboard, and the ultrawide with its reel layout.
- Hold briefly at the end so the viewer can take in the scene before `projects-monitor-entry` starts.
- Leave `projects-monitor-entry` mostly unchanged. Adjust its start pose so it begins from the new reveal framing instead of the end of the old desk-travel pan.

### 6. Model stays on the desk afterwards

- The car stays on the desk at `carEnd` through the reel, the handoff and the later stations that share this desk.
- Optional follow-up: make the model a button that jumps back to the Formula SAE chapter, using the existing chapter/scrub logic.

### 7. Reduced motion and fallback

- Reduced motion: replace the shrink with a cross-fade between the existing Formula SAE still and a new still of the desk with the car model and the ultrawide reel layout.
- Update the `#fallback` / `#stills` content and the `still-ultrawide` figure caption.
- Check that the accessible text still reads in order: Formula SAE → Data logging → Personal projects.

### 8. Review tooling

- Update the review panel's chapter boundaries and phase labels for the new kinds.
- Add review hooks so the three key frames can be checked directly: last frame of `data-return`, middle of `car-shrink`, and end of `projects-reveal`.

## Acceptance checklist

- [ ] No 3D "PERSONAL PROJECTS" text anywhere in the scene, poster or stills.
- [ ] No visible jump between `data-return` and `car-shrink`; the car framing is identical across the boundary.
- [ ] The car stays about the same size on screen throughout `car-shrink`.
- [ ] No clipping or z-fighting at the smallest scale.
- [ ] The title, the callout and the old workstation are fully gone before the desk fades in.
- [ ] The contact shadow fades in with the desk light rather than appearing all at once.
- [ ] The ultrawide shows the "PERSONAL PROJECTS" title card in the same style as the FSAE title card, then cross-fades to the reel.
- [ ] Scrubbing backward through the transition is smooth, with no leftover state from forward-only setup.
- [ ] Deep links (`#fsae-data-logging`, chapter select) land on the right frames after the change in `totalUnits`.
- [ ] Reduced-motion and fallback paths show the new desk-with-model still.
- [ ] Frame rate holds through the transition on a mid-range laptop and on mobile.

## Open questions

1. The name and source of the 3D text mesh: is it in the projects desk GLB or generated at runtime?
2. Can the car be rendered in the main scene directly (option A), or does the portal setup require the clone swap (option B)?
3. What should the model's scale on the desk be? Start at keyboard length and adjust by eye.
4. Title card wording is `PERSONAL PROJECTS`, without an eyebrow.