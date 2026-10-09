# Portfolio room — Round 2

Completed 9 October 2026. The live browser is the delivery reference.

## Recovered history

- **6aacadb7dd78aa3013cd3641f151cbe2f631cda7**: `web/src/hack-atlantic.ts` supplies the unchanged six statistics and three Why paragraphs; `web/src/style.css` supplies League Spartan headings and the peach/mint/ink palette; `web/public/assets/hack-atlantic-hero.png` supplies the original sunset hero, title and tagline. The embedded original image includes its original navigation and Weekend Recap link; no extra recap, winners, judges or sponsor sections are generated.
- **6aacadb7dd78aa3013cd3641f151cbe2f631cda7**: `web/src/workspace-scene.ts` mapped the laptop to the immersive Hack Atlantic destination. `web/src/surface-focus.ts` calculated its front-on camera from the screen UV corners. That same framing now serves About, with no HTML content panel.
- **8afeabe85ae928bf8b0086be51e551f8374cd47e**: `web/src/style.css` defines the original opening name at weight 800 with `-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif`. There was no loader font file. Round 2 preserves that exact stack and weight for the loader and wall; it does not substitute League Spartan for the name. The font discrepancy was reported before editing.

## Delivered

- Huge uppercase DAX / MANUEL, each line fitted to the same width. The desktop ink spans approximately 45% of the viewport from the left margin. It is a wall-attached, depth-tested texture on desktop and phone, so physical objects occlude it.
- Original Hero → By the numbers → The Why printed at **2048 × 4096**, with sRGB, mipmaps, renderer-maximum anisotropy and aspect-correct scrolling. Roller movement, drag, wheel, keyboard controls and synchronized accessible HTML remain available. Fetched recap data and invented About copy were removed.
- Text-only Plex Mono labels: no backgrounds, borders, padding or pill shadows; visible focus rings and hover underlines. All leaders remain at 45°, with lengths **42–98 px**. About anchors to the upper-right screen corner. Ultra Maritime retains its exact accessible name and sits close to its book.
- Under-desk plant removed from the loaded scene and Blender source, including raycasting and shadows. Desktop plant retained.
- Brighter warm-neutral fill and wall wash, low HDRI reflections, warmer tabletop, a brass picture-light fixture and non-shadow spotlight. Only the desk lamp casts shadows. No extra post-processing.
- No engineering tagline or draft bio. `web/src/laptop-screen.ts` is the single editable blank screen. Laptop, About label and top nav all zoom front-on; Escape, Back and outside click return. Reduced motion remains supported.
- **Floor–wall correction:** removed the tall black strip that read as a gap. Wall geometry extends to −0.5 m, below the floor at 0 m; floorboards extend behind the wall. A matching 24 mm skirting sits flush at floor level. Verified in browser captures and Blender bounds.

## Validation

- Production build and TypeScript: pass. Existing Vite bundle-size advisory remains.
- No lint script or lint configuration exists in this project.
- Full suite: **123/125 pass**. Two pre-existing failures remain: `desk-return.test.ts` (legacy monitor snapshot) and `desk-six-fixes.test.ts` (existing desk GLB exceeds old 8 MB budget). The same failures were previously reproduced from untouched HEAD; neither underlying asset changed here.
- Browser checks at **1440×960, 1024×768, 390×844** pass for all six destinations, label bounds/collisions, two-way hover/focus, contact links, résumé PDF, notebook motion, fabric wheel/drag/keyboard/clamping, accessible text and return controls.
- Additional Round 2 audit verifies the continuous floor–wall join, removed/retained plants, single shadow light, texture resolution/filtering/color space, text-only labels, maximum leader length, direct laptop and nav clicks, outside return and reduced-motion laptop transitions.
- Room additions: **12,018 triangles**. All added textures are ≤2K except the explicitly allowed 2048×4096 fabric. Local headless Chrome measured approximately 16.7 ms median frame time; physical mobile devices and Safari/Firefox were not tested.

## Files changed in Round 2

Runtime:
- `web/src/room.ts`
- `web/src/scroll-frame.ts`
- `web/src/laptop-screen.ts`
- `web/src/workspace-labels.ts`
- `web/src/workspace-scene.ts`
- `web/src/workspace.ts`
- `web/src/workspace.css`
- `web/src/surface-focus.ts`
- Removed the Round 1-only `web/src/hack-recap.json` and `web/src/portfolio-copy.ts`.

Verification/source handoff:
- `web/tests/surface-focus.test.ts`
- `web/scripts/check-room.mjs`, `verify-room.mjs`, `verify-round2.mjs`, `inspect-round2.mjs`
- `blender/build_room_review.py`, packed `blender/portfolio-room.blend`
- `exports/room/room-additions.glb`, `about.png`, `blender-review.png`, verification reports
- `design/room/README.md`, `design/room/figma-scroll-round2.png`
- `README.md`, `docs/room-revision.md`, this report

Existing Figma masters updated in place: [blank laptop](https://www.figma.com/design/AAoP4nNd3n9QzR9C2Cjarm?node-id=173-13386), [restored scroll](https://www.figma.com/design/AAoP4nNd3n9QzR9C2Cjarm?node-id=173-13393). Statistics and Why are editable layers. The hero is the unchanged repository image. Figma uses League Spartan body text because the platform system font is unavailable there; the runtime retains the historical system body font. Figma is a source handoff, not fetched by the site.

Browser reports/screenshots: `web/test-results/room/`. Copied reports: `exports/room/`. Blender uses its own renderer, with a slightly different lighting response.
