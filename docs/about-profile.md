# Laptop About profile

The laptop screen displays a large centered About heading, comma-separated role subtitles fitted to exactly two lines, and the smaller internship introduction fitted to one line below them. The former circular portrait is now the first square gallery item. Seven photos and a muted looping video move continuously from right to left in equal square frames. Each photo has an individual crop focus. The strip repeats using modulo positioning, without a reset gap.

The screen remains part of the 3D laptop. Static profile artwork is cached; only the gallery is repainted while About is active, at up to 30 updates per second. Video and scrolling pause when leaving About, hiding the tab, choosing Pause, or enabling reduced motion. Previous/next controls allow manual browsing, including with reduced motion. Profile copy and gallery descriptions are available to screen readers.

Assets: `web/public/assets/about/` contains a cropped portrait, six WebP photos (including converted HEICs), and a browser-compatible MP4 converted from the supplied MOV. Original files are untouched. Photos total approximately 600 KB; video is approximately 5.5 MB. The video is muted at playback.

Implementation: `web/src/laptop-screen.ts`, `web/src/workspace-scene.ts`, `web/src/workspace.ts`, and `web/src/workspace.css`.

Validation: production build/TypeScript pass. `web/scripts/verify-about.mjs` checks 1440, 1024, and 390 pixel layouts, scrolling, pause, decoded video, reduced motion, and video pause on exit. Screenshots and browser results are in `web/test-results/about/`. `web/tests/about-gallery.test.ts` checks seamless positive/negative loop wrapping.
