# Screen and notebook zoom implementation plan

Status: Implemented and verified.

## Scope
Change only Hack Atlantic, Ultra Maritime, and Personal Projects. Preserve the other desk destinations and the existing content.

## Behavior
1. Selecting Hack Atlantic moves the camera straight toward the laptop display until the screen fills the view. The landing-page preview then becomes a full-page, scrollable Hack Atlantic experience using the existing design and content.
2. Selecting Ultra Maritime opens the notebook and moves into its accomplishment page. The page becomes a readable, full-page paper presentation of the existing experience content.
3. Selecting Personal Projects moves into the curved monitor and presents the existing placeholder across the view.
4. None of these three destinations opens the side popup. A visible Back to desk control and Escape return to the overview; the notebook closes on return.
5. Keep direct links, browser history, tour controls, keyboard navigation, mobile layouts, and reduced-motion behavior working.

## Implementation
- Derive camera targets and orientation from the actual textured display/page geometry, instead of the entire prop's bounding box.
- Fit the camera to fill the viewport with the selected surface, without the side-panel offset.
- Reveal the full-page content only when the camera arrives; cancel pending reveals when navigating away.
- Reuse the existing content components and assets. Do not change Blender geometry, textures, or unrelated interactions.

## Verification
- Check all three arrivals and returns on desktop and mobile.
- Check direct links, switching destinations, tour navigation, Escape, and browser Back.
- Check that Formula SAE, data logging, résumé, and contact retain their existing side-panel behavior.
- Run the production build and focused tests for surface fitting and transition cancellation.
- Save preview screenshots and record results here.

## Results

- All three destinations use screen/page-aligned camera arrivals and full-page content. No side panel is shown for these destinations.
- The notebook opens during the approach; Back to desk closes it during the return. Reduced-motion mode skips camera and cover interpolation.
- Existing content and assets are reused; no Blender geometry or textures were changed.
- Production build passed. All 10 focused surface-framing and asset tests passed.
- Browser verification passed for all three desktop destinations, all three mobile destinations at 390 × 844 CSS pixels without horizontal content overflow, direct notebook links, browser Back, Escape, canceling a transition, and advancing the tour during a transition.
- Formula SAE, data logging, résumé, and contact were verified to retain their side-panel mode.
- Browser console contained no errors during verification.
- Desktop screenshots: `reference/compare/immersive-zoom/hack-atlantic.jpg`, `ultra-maritime.jpg`, and `personal-projects.jpg`.

Changed files: `web/src/workspace-scene.ts`, `web/src/workspace.ts`, `web/src/workspace.css`, `web/src/surface-focus.ts`, and `web/tests/surface-focus.test.ts`.

## Framing revision

The user's follow-up supersedes the full-page takeover above:

- Stop at a centered focus view with at least roughly 10% clearance around the screen or open notebook. Preserve aspect ratio rather than cropping the object to force identical margins.
- Frame both notebook pages; keep accomplishment content on the right-hand page.
- Position the scrollable content within the projected screen/page bounds so the physical device and surrounding desk remain visible.
- Keep Back to desk, Escape, tour, and existing routes unchanged.
- Updated camera-fit tests pass for desktop and portrait aspect ratios; production build passes.
- New screenshots: `hack-atlantic-margin.jpg`, `notebook-margin.jpg`, and `projects-margin.jpg` in `reference/compare/immersive-zoom/`.
