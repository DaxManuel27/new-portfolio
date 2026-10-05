# Portfolio scroll preview

The browser application is in `web/`. This repository contains only this portfolio project, including the runtime assets in `web/public/assets/`, supporting scripts, and project documentation. Large Blender working files and local backups remain outside version control; they are not needed to run or build the website.

## View it

1. In Finder, open this project folder and double-click **Start Portfolio Preview.command**.
2. Your browser opens **http://127.0.0.1:5173/**. Keep the Terminal window open while viewing.
3. Scroll down with the trackpad, mouse wheel, arrow keys or Page Down. Scroll upward to reverse. Pausing the scroll holds the camera and laptop. At the printer, click **Print Resume** to feed the paper without scrolling.
4. To stop the preview, press **Control-C** in its Terminal window.

The server is local to this Mac. The localhost link works while the preview server is running; it is not a published website. Open the launcher again whenever you want to return.

For review, use **http://127.0.0.1:5173/?review=1**. The scene menu jumps to any station, and the slider scrubs the full journey. Those controls are hidden in the normal experience.

**Reduce motion** switches to still scenes and accessible contact links. **Enable animation** returns to the journey. The operating system's reduced-motion preference is respected until you explicitly choose a mode.

If the launcher does not open, use Terminal:

```sh
cd web
npm ci
npm run dev
```

Then open http://127.0.0.1:5173/ in Chrome or another WebGL-capable browser. Do not open `index.html` directly; the 3D assets need the local server.

## What is implemented

- One MacBook travels through Intro, Hack Atlantic, Formula SAE, Ultra Maritime, Projects, Resume and Contact.
- Intro holds the floating closed-laptop pose from the supplied reference and eases forward into the first flight. Its loading and reduced-motion stills match, with no Intro table or props.
- Authored Blender motions scrub forward and backward, with a floating Intro and a corrected final descent onto the shared desk.
- Travel framing keeps the laptop centered and enlarged. The Formula SAE composition has its approved side placement.
- Each station uses one continuous approach to its focus view, a stable hold and one exit to the next travel segment. Formula SAE retains its car overview; the other stations go directly to their close-ups.
- Hack Atlantic, Ultra Maritime and Projects close straight-on. Resume and Contact close overhead.
- Projects uses a clear route in front of the ultrawide: arrive aligned, descend vertically, stay parked during the camera pullback, then slide forward before lifting and turning toward Resume. The camera follows the corrected laptop center in both directions.
- Resume and Contact share one table with the printer, phone and open phone book. A short overhead zoom out and zoom in switches between them; the laptop stays docked.
- The laptop aligns over the clear space left of the phone, then lowers vertically onto the desk. It finishes rotating before touchdown.
- Resume starts with an empty output tray. Press **Print Resume** on the printer's own recessed key: it depresses, the status light pulses, and the sheet feeds above the tray and raised rim before bending toward the desk. The four-second feed stays printed through forward and reverse scrolling until reload. The physical key supports touch and keyboard input; reduced motion reveals the printed still immediately. The approved placeholder is used until the final résumé is supplied.
- Contact offers accessible email, GitHub, LinkedIn, X and phone links. The phonebook includes `x.com/bydaxmanuel` in matching Caveat lettering. No résumé download is fabricated.
- Adjacent scenes preload, distant scenes are released, and loading/error states use still previews.

Runtime assets are derived copies in `exports/web/` and `web/public/assets/`. The nine GLB files total about **10.9 MB**; the original detailed GLBs totalled about 107 MB for this set. Materials retain the phone's clearcoat/transmission and texture detail. Browser lighting is adapted for clear black screens.

## Development

Requires Node.js 24 or later. Dependencies are pinned in `web/package-lock.json`.

```sh
cd web
npm ci
npm test
npm run build
npm run preview
```

Stop any existing preview on port 5173 before `npm run preview`. This last command serves the production build.

`npm run prepare:assets` regenerates compressed assets from the preserved completion exports, `exports/shared-desk/`, and `exports/web/blender-stations.json`; it does not modify Blender files. Meshopt compression and lossless WebP color textures preserve the originals separately.

The current printer revision is rebuilt with `blender/rebuild_printer_interaction.py` in the shared-desk Blender file. It writes the named key/label/LED and paper anchor, replaces the closed output-slot plates with open rings, and exports a printer-local, 30 fps paper morph along a fixed arclength guide. Run this focused rebuild after any older scene-generation script, then prepare assets; it preserves the current browser layout metadata. A pre-change source/export backup is in `blender/backups/printer-2026-10-02/`. The clearance regression in `web/tests/printer-clearance.test.ts` checks actual exported tray/rim/desk triangles at quarter-frame intervals before and after compression. `node scripts/capture-printer-motion.mjs` captures overhead and side poses plus continuous video into `web/test-results/printer-motion/`.

The additional X phonebook entry is maintained by `blender/add_phonebook_x.py`. It follows the page surface as thin ink geometry and uses the bundled Caveat font from Google Fonts, licensed under `assets/fonts/Caveat-OFL.txt`. Rerun it after recreating the shared desk, before preparing assets.

The deterministic journey is defined in `web/src/journey.ts`; `camera.ts` evaluates the continuous camera path, `hero.ts` restores absolute baked transforms before docking, `scene.ts` renders the assets, and `main.ts` handles scrolling and accessible presentation.

Browser regression checks are in `web/tests/browser.mjs`. They use Chrome and a Playwright module supplied through `PLAYWRIGHT_MODULE` (or this Mac's bundled Codex runtime). `PREVIEW_URL` can point them at another local port. Captures and the resulting report are saved in `web/test-results/`.

The floating opening is configured in `web/src/intro-config.json`. With the development preview running, `node scripts/capture-intro.mjs` from `web/` regenerates its transparent source render and matching poster. Asset preparation reuses `exports/web/intro-floating.png`. Opening-specific browser checks run with `node tests/floating-intro.mjs`; their report and captures are in `web/test-results/floating-intro/`.

The safe desk descent is in `web/src/desk-arrival.ts`, with clearance tests against the actual shipped geometry. `web/src/print-job.ts` controls the user-triggered feed independently of scrolling. `exports/shared-desk/layout.json` sets the printer focus and minimum vertical span so both the printer and output sheet fit on desktop and portrait screens. With the development preview running, `node scripts/capture-desk-posters.mjs` regenerates empty and printed stills for loading and reduced motion; asset preparation reuses these sources.

The ultrawide route is defined in `web/src/projects-motion.ts` and applied after sampling the preserved animation. It joins the existing safe desk descent at 18 seconds; re-exporting the original clip does not remove the correction. `web/tests/projects-clearance.test.ts` checks the shipped laptop and all four monitor components with swept envelopes. `node tests/projects-motion.mjs` checks desktop and portrait framing, the parked exit, reverse/direct seeking and camera joins. `node scripts/capture-projects-motion.mjs` records normal, overhead and side views into `web/test-results/projects-motion-review/`. Run `blender/preview_projects_clearance.py` after the geometry tests to create a separate Blender review from their exact 30 fps pose export.

## Verification scope

Latest ultrawide revision on 2026-10-02: all **45 automated tests** and the production build pass. The swept geometry check covers 9,604 intervals through both flights and guarantees at least **39.18 mm** separation from the monitor's enclosing component bounds. Chrome checks pass 180 desktop/portrait forward samples plus reverse/direct seeks, camera joins and unchanged visibility timing. Full-journey, printing, shared-desk and safe-landing browser regressions pass. A matching Blender review is saved in `blender/projects-clearance-review.blend`; original animation exports are preserved. See `ultrawide-monitor-clearance-plan.md` for the implementation and `web/test-results/projects-clearance/report.json` for the geometry method and measurements.

Verified on 2026-10-02: production build succeeds and all nine automated timeline/asset tests pass. Chrome 154.0.8037.93 passes 42 forward travel samples within 2 CSS pixels of the authored center, 42 matching reverse seeks, all phase joins, refresh/resize restoration, seven portrait station captures, native scrolling, chapter links, contact links, reduced motion, context loss, failed-station retry and hero-load failure fallback. Captures use 1440×960 desktop and 390×844 portrait dimensions. The report is saved in `exports/web/browser-validation.json`. Physical iOS/Android devices, Safari and Firefox still need device testing before publication. CPU render timings do not establish a GPU frame-rate guarantee.

Formula SAE callout positions remain conceptual, as documented in the Blender handoff. The résumé artwork is the supplied page; a final downloadable résumé and new screen content are separate content work.

The repeated-zoom fix is documented in `scroll-camera-fix-plan.md`. It uses one station approach and exit, restores absolute laptop poses before docking, and preserves rounded scroll positions and refresh state. The current 26-test suite and desktop/portrait Chrome camera regression pass; the detailed report is `exports/web/camera-fix-browser-validation.json`.

Shared-table verification on 2026-10-02: production build and all 28 unit checks pass. The focused Chrome check verifies 31 forward and matching reverse samples at both desktop and phone sizes, with one table visible throughout. Captures and the report are in `web/test-results/shared-desk/`. Run it with `node tests/shared-desk.mjs` from `web/`. The shared Blender scene includes the overhead camera switch at frames 16–37.

Latest desk/print revision on 2026-10-02: all 36 automated tests pass, including 801 arrival samples that clear the phone, notebook, pen and printer, with tabletop contact and more than 8 cm clearance from the phone at rest. Chrome checks at 1440×960 and 390×844 verify descent, empty arrival, keyboard printing, repeat-click protection, reverse/return persistence, reload, loading posters and reduced motion. The printer, output sheet and controls remain visible. Run `node tests/desk-arrival.mjs` and `node tests/print-resume.mjs`; reports and captures are in the corresponding `web/test-results/` directories. Original Blender animation exports are preserved; these corrections are applied in the browser.

The updated full-journey and shared-desk browser suites also pass for this revision, including 35 travel samples with reverse seeks, all station camera moves, 124 shared-desk switch samples, restoration, navigation and failure fallbacks. Reports: `web/test-results/camera-fix-browser-report.json` and `web/test-results/shared-desk/report.json`. Shared-desk regression runs preserve the generated posters unless `CAPTURE_POSTERS=1` is explicitly set; use `capture-desk-posters.mjs` for the current empty/printed pair.

## Photographic materials

The 2026-10-02 visual revision adds studio HDR reflections, broad area lighting, metric surface detail for aluminum, walnut, plastic and paper, a separate trackpad finish, and cleaner monitor surfaces. The source remains `blender/portfolio-shared-desk.blend`; photographic and neutral review scenes are included. See `photorealism-validation.md` for before/after captures, reproduction, backup paths, size measurements and browser limitations. All 47 unit tests, the production build, full browser journey, printing, Projects, shared desk and landing checks pass.

`web/scripts/prepare-realism-textures.mjs` creates the export-compatible maps. Run `blender/apply_photorealism.py` through Blender MCP, then `npm run prepare:assets` from `web/`. Surface maps use lossless WebP inside GLB; `node scripts/verify-realism-textures.mjs` checks decoded normal and roughness pixels against source exports. Poly Haven CC0 texture/environment provenance is in `assets/textures/photoreal/sources.json`. The runtime environment file is `web/public/assets/studio-small-09.hdr`, with a generated-room fallback on download failure.

## Vercel deployment

This project uses **Vite**, not Next.js. Keep the Vercel Root Directory at the repository root (`.`); the root `vercel.json` installs dependencies in `web`, runs its production build, and serves `web/dist`. The root package selects Node.js 24 and includes a compatibility `vercel-build` script.

If the Vercel project already uses `web` as its Root Directory, `web/vercel.json` supplies the equivalent configuration relative to that folder. Use Node.js 24 in the project's settings. The checked-in configurations override stale Next.js framework/build/output settings. Deploy the latest `main` commit rather than rerunning an older deployment.
