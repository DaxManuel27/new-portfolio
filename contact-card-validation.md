# Live contact card — verified implementation

The current implementation satisfies the supplied plan. The final reel entry is labelled **Resume & contact** and shows the live shared desk, with the rotary phone, notebook and printer. It does not count as a fifth project.

The card slides to the centre over 0.4 scroll units and expands over 0.7 units. Its measured rectangle drives the canvas clip, camera view offset and render scissor. The destination approach uses the same desk camera, without a texture substitution. Reverse scrolling restores the same camera and window rectangles.

Decisions: use the full-desk framing, retain scroll-driven navigation, and use the existing clipped live canvas rather than a render-target fallback. The static entry links to accessible contact details.

## Validation

- All 75 automated tests pass.
- Production build passes; Vite still reports its large JavaScript bundle advisory.
- Browser checks pass at 1280×800, 1440×960, 1920×1080, 2560×1440 and 390×844.
- All viewports pass 14 reverse-scroll sample comparisons and report no page errors.
- Mean per-channel difference across the expansion/approach boundary is below 0.009 on a 0–255 scale at every tested size.
- Assets are ready with ML Library active; the preview renders only the contact station and the printer remains idle.
- Reduced-motion and disabled-WebGL checks both show the preview and working contact entry.
- The 1440-wide warm sweep records a two-frame median of 33.3 ms and 95th percentile of 34 ms; measured CPU render 95th percentile is 3.3 ms. These are local browser measurements, not a guarantee across hardware.
- Refreshed the shared-desk fallback preview in public assets and exports.

Run the browser verification from `web/` with the local preview running:

```sh
node scripts/verify-contact-card.mjs
```

Screenshots and the measurement report are in `web/test-results/contact-card-verified/`.
