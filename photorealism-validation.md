# Photographic material revision — validation

Implemented 2026-10-02 through Blender MCP, using Blender 5.2.2 LTS. Canonical source: `blender/portfolio-shared-desk.blend`.

## Delivered appearance

- Fine aluminum grain and varied roughness on the laptop, separate satin trackpad, controlled dark glass reflections.
- Photographed walnut veneer color, matching relief and roughness at a consistent physical scale. The desk represents veneer; no artificial end grain was added.
- Fine molded-plastic finishes on the printer housing, lid and tray; restrained paper fiber detail on notebook pages, résumé and paper stack; distinct pen finish.
- Refined red phone clearcoat and acrylic dial; clean monitor housing and stand finishes replacing visibly speckled original maps.
- Studio HDR reflections, broad warm key and cool fill, restrained ambient fill, AgX exposure and tuned shadows in the website. An existing generated room environment remains available if the HDR download fails.
- Updated compressed hero, station and morphing-paper assets, and loading/reduced-motion posters including empty and printed printer states.

The material pass verifies unchanged positions, polygon counts, transforms, assigned actions and shape-key counts for 1,920 source mesh objects. Triangle delta: zero. Existing UVs for printed artwork remain separate from metric surface UVs. No bevel, spine or page-path geometry additions were needed for this pass: the existing construction reads better with surface and lighting improvements, and the tested collision corridors remain intact.

## Review and camera decisions

`Review — Realism Neutral` and `Review — Realism Photograph` are separate Blender review scenes with their own camera collections. The photographic review uses an 85 mm perspective camera. Browser cameras remain orthographic to preserve framing, interactive alignment and scroll continuity. Depth of field was not added: the live notebook, printer button and résumé need to remain sharp, and an extra browser render pass would add cost without improving those interactions.

Comparison artifacts:

- `blender/previews/photorealism/browser-comparison.png`: matched desktop framing for laptop/desk, printer and notebook, before and after.
- `web/test-results/realism/before/` and `after/`: all seven stations at 1440×960 and 390×844, with diagnostic JSON.
- `blender/previews/realism-before-projects.png` and `blender/previews/photorealism/projects-after.png`: matching Blender camera/frame comparison.
- `blender/previews/photorealism/projects-perspective.png`: optional long-lens photographic review.

The combined comparison intentionally includes the new lighting and exposure. The first automated baseline Intro capture caught the opening loader, so it is excluded from the comparison image. The final Intro was recaptured successfully.

## Validation

- All **47 unit/asset tests pass**, including source/optimized printer clearance, ultrawide clearance, desk landing, deterministic seeking, one travelling laptop, physical phone materials, paper morph animation and surface-map UV integrity.
- Full Chrome journey regression passes, including desktop/portrait framing, reverse/direct seeking, refresh/resize restoration, native scrolling, Contact links, reduced motion, context loss, station retry and hero failure fallback.
- Projects browser checks pass 180 forward desktop/portrait samples, reverse/direct seeks and camera joins.
- Shared-desk and safe desk-arrival browser checks pass at both viewport sizes.
- Printer browser regression passes 11 checks covering pointer, touch, keyboard, physical key press, drag/scroll rejection, print persistence, reload and reduced motion.
- Missing-HDR check passes: the fallback room environment keeps the animated view usable.
- Lossless compression check verifies **eight decoded normal/roughness maps pixel-for-pixel** against their source exports. Receipt: `web/test-results/realism/texture-validation.json`.
- Production TypeScript/Vite build passes. The existing large-bundle warning remains; the new area-light support contributes to the bundle size.

Browser validation exposed two existing interaction issues: the opening overlay could cover the retry UI or report readiness before relinquishing input, and the projected printer button sat behind the canvas. The failure path now dismisses the opening overlay, readiness waits for it to finish, and the button has an explicit layer above the canvas.

## Size and performance

| Measurement | Before | After |
| --- | ---: | ---: |
| All exported runtime GLBs | 10.71 MB | 12.01 MB |
| GLBs, posters and HDR combined | 10.83 MB | about 13.93 MB |
| Studio HDR alone | — | 1.62 MB |
| Desktop observed CPU render median | 1.1–1.4 ms | 1.2–1.5 ms |

Lossless surface compression reduced the first revision from 15.88 MB to 12.01 MB of GLBs. Normal and roughness maps remain data textures. The combined total includes the Contact alias asset; adjacent station loading and shared-desk reuse mean it is not all downloaded at startup. Archive source textures and backups are outside the website payload.

Desktop diagnostic triangle counts and draw calls are unchanged at every stop. For example, Intro reports 327,836 triangles / 88 calls and Projects reports 334,808 / 113. More texture memory is used. CPU medians are observations from local headless Chrome, not GPU frame-rate guarantees; startup shader compilation can produce much larger outliers. Phone hardware and Safari still require device testing before publication.

The browser approximates photographic lighting with real-time materials, image-based reflections and a shadow map. It does not reproduce Cycles ray-traced transmission, reflection, global illumination or contact shadows exactly. This is a material and lighting improvement, not a guarantee that every view is indistinguishable from a photograph. The résumé remains the approved placeholder until the final document is supplied.

## Reproduction and rollback

Original source, exports, assets and scene configuration are preserved under `blender/backups/photorealism-2026-10-02/`.

1. From `web/`, run `node scripts/prepare-realism-textures.mjs`.
2. Through Blender MCP, import `blender/apply_photorealism.py`, then call `apply()` and `export()`. Use an import with the actual file path so `__file__` resolves correctly.
3. Run `npm run prepare:assets`, `npm test` and `node scripts/verify-realism-textures.mjs` from `web/`.
4. With the local preview running, run `node scripts/capture-realism.mjs`, `node scripts/capture-intro.mjs`, `node scripts/capture-desk-posters.mjs` and `node scripts/realism-comparison.mjs`.
5. Run browser regressions and `npm run build`. The asset-preparation step reuses saved poster sources; recapture posters after any lighting change.

Texture provenance and verified checksums: `assets/textures/photoreal/sources.json`. Studio Small 09 and Walnut Veneer 02 are CC0 assets from [Poly Haven](https://polyhaven.com). Existing device maps are reused; small synthetic surface maps are generated deterministically.
