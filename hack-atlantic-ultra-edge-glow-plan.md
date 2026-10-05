# Plan: Hack Atlantic → Ultra Maritime edge glow

Status: removed at user request. The previous transition is restored; the proposal below is retained only as history.

## Effect being proposed

Add a soft, luminous multicolour frame around the viewport during the MacBook flight from Hack Atlantic to the Ultra Maritime workstation.

The visual reference is the **coloured perimeter glow** in the supplied Oryzo screenshot: yellow/lime at the upper left, cool cyan/blue at the upper right, orange at the lower left, and pink/violet at the lower right. The centre stays dark so the main object remains clear. This plan interprets “this effect” as that glow, not a new laptop animation or a particle effect.

Reference: [Oryzo](https://oryzo.ai/). The supplied screenshot is the visual specification. The live page was checked for context, but its text response does not establish the original effect's animation timing or rendering technique. The implementation below is our own proposed approach.

## Intended sequence

| Journey moment | Treatment |
| --- | --- |
| Hack Atlantic website and recap | No glow; content remains easy to read. |
| Laptop closes and leaves the Hack Atlantic desk | A faint coloured halo begins at the viewport edges after departure is underway. |
| Laptop rotates through the open space | Glow reaches its strongest point; the laptop remains the visual focus. |
| Workstation starts appearing | Glow retreats toward the edges and fades. |
| Camera approaches Ultra Maritime | Glow is completely gone early in the approach, before reading the monitor. |

The effect follows scroll position in both directions. Stopping scrolling stops its evolution after the existing short smoothing response settles.

## Visual specification

- Retain the current dark background and existing 3D scene.
- Use four broad, overlapping radial gradients rather than a hard rainbow outline.
- Add a narrower, softly rounded inner edge for the brighter rim visible in the reference.
- Suggested starting colours: lime `#DBF64C`, cyan `#74DCE8`, blue `#788AFF`, orange `#F19A4C`, pink `#DF65C8`. These are approximations from the screenshot, not sampled brand tokens.
- Keep the first version more restrained than the reference: peak outer-rim opacity around 0.55, with the broad halo around 0.20. Tune visually against the silver laptop.
- Concentrate saturation at the corners and perimeter. The central 65–70% should receive negligible colour wash.
- Initial desktop halo spread: roughly 60–110 CSS pixels. Narrower screens use roughly 30–55 pixels so the effect does not cover the laptop.
- Use a 28–40px visual corner radius on desktop and 18–24px on narrow screens for the glow itself. Do not round or crop the entire scene.
- During flight, allow a small scroll-driven shift in the gradients and a gentle expansion of the halo. No continuous hue cycling, flicker, strobe, or autonomous looping.

## Integration with the current journey

Existing phases already provide the timing:

- Hack Atlantic departure: `station === 1`, `kind === 'exit'`.
- Flight to the workstation: `station === 2`, `kind === 'travel'`.
- Workstation approach: `station === 2`, `kind === 'approach'`.

Add a pure `transitionGlow(state)` helper in `web/src/transition-glow.ts`. Return opacity, spread, and subtle gradient-offset values from the evaluated journey state.

Suggested initial envelope:

1. **Exit 0–35%:** off.
2. **Exit 35–100%:** ease from zero to 0.15 intensity.
3. **Travel 0–35%:** ease from 0.15 to full intensity.
4. **Travel 35–65%:** broad peak with only subtle movement.
5. **Travel 65–100%:** ease down to 0.10 intensity.
6. **Approach 0–25%:** ease from 0.10 to zero.
7. **Everything else:** explicitly zero.

Use matching values and zero-slope easing at phase joins so there are no visible flashes. Derive values from phase/local progress, not hardcoded overall page percentages. Changing the journey's scroll length must not move the effect into the wrong section.

Call the helper from `draw()` using the **existing smoothed rendered state**. Do not use raw scroll velocity or `targetProgress`: the glow must stay attached to the visible laptop motion. Do not add a second smoothing loop or alter the current 1.15× scrolling distance.

## Rendering approach

Use CSS layers inside the fixed `#stage`; a new WebGL post-processing pipeline is unnecessary for the first version.

1. **Ambient halo:** placed above the stage's existing background but behind the transparent Three.js canvas. This gives the dark flight background colour without tinting the laptop.
2. **Perimeter rim:** placed above the canvas, with a mask that restricts it to the outer edge. Keep the centre transparent so the laptop and monitor content remain sharp.

Implementation details:

- Add one decorative `#transition-glow` element, with an additional halo element or pseudo-element as needed for the two stacking levels.
- Explicitly place the rim below loading/error UI, navigation, accessibility controls, and dialogs. Audit stacking contexts rather than assigning an arbitrary very high z-index.
- Set `aria-hidden="true"` and `pointer-events: none`; no tab stops or interactions.
- Start hidden. Set CSS custom properties for intensity and gradient offset once per frame, without reading layout in the update function.
- Prefer gradients with built-in soft falloff; avoid large animated full-screen blur filters or `backdrop-filter`.
- Restrict the brighter layer with a CSS mask; provide an edge-gradient-only fallback if the mask technique is unsupported.
- Use normal transparency first. Avoid a blend mode that unpredictably recolours screen artwork.
- Turn off both layers when intensity is zero. The effect must not keep the render loop running on its own.

No Blender changes, model exports, third-party assets, new dependency, or copied Oryzo source code are needed.

## Accessibility, loading, and performance

- Hide the effect entirely in reduced motion and static fallback modes.
- Hide it while a loading or error poster replaces the scene; recompute from the current state when the 3D scene becomes ready.
- Explicit navigation directly to Ultra Maritime produces no residual glow.
- Refresh-to-top, reverse scrolling, rapid scroll jumps, resize, tab switching, and retry must not leave the frame visible outside the transition.
- No added scroll distance or waiting period.
- Compare frame times with the effect enabled/disabled on the same route. Target less than 2ms additional median frame cost on the test desktop; treat this as a budget to measure, not a guarantee.
- If compositing causes dropped frames, remove gradient drift first, reduce halo spread next, then fall back to one opacity-animated gradient layer.

## Files to change

- `web/src/transition-glow.ts`: deterministic effect envelope and presentation values.
- `web/src/main.ts`: create/update decorative layers from the shared rendered state; hide on static mode and loading/failure.
- `web/src/style.css`: gradients, perimeter mask, responsive sizing, and stacking.
- `web/tests/transition-glow.test.ts`: phase boundaries, off-state coverage, forward/reverse determinism, and finite/clamped outputs.

No changes to `journey.ts` durations, camera paths, laptop rotation, lid timing, desk placement, monitor stands, or section content are included.

## Implementation and review steps

1. Build the pure envelope and test its boundary values.
2. Add a static peak-state glow and review its colour/spread around the laptop before wiring animation.
3. Drive it from the existing rendered journey state.
4. Review departure, flight start, peak rotation, workstation arrival, and the Ultra Maritime close-up at desktop and portrait sizes.
5. Test reverse scrolling and direct seeks; confirm reduced motion, loading, and other sections never show the effect.
6. Profile the same transition before/after, run the build and relevant transition/camera checks, and capture a short motion comparison plus key stills.

## Acceptance criteria

- The reference's soft multicolour edge treatment is recognisable during the flight.
- The laptop stays crisp and neutral, with no bright colour wash across its centre.
- The effect appears only between Hack Atlantic departure and early workstation approach.
- It enters and leaves smoothly and reverses predictably with scrolling.
- Ultra Maritime is clean and readable once its close-up begins.
- The existing flight, monitor arrangement, and newly smoothed scroll behaviour are preserved.
