# Ultra Maritime screen refresh — implemented

- Shared DOM content in `web/src/ultra-screen.ts` feeds the monitor texture, accessible still content, and Read experience dialog.
- Artwork follows the actual monitor aspect ratio, eliminating the previous horizontal stretch. Rounded white logo tile remains on the left.
- Uses Formula Racing's system sans, weight-800 heading, cream and taupe palette, and black background. Preserves all contribution wording with selective outcome emphasis.
- Texture resolution uses projected display width and device pixel ratio, upgrading from 2048 to 4096 while retaining aspect ratio. Repaint occurs on tier/font/image changes, not every scroll frame; owned textures are retained across station eviction and disposed with the scene.
- Browser verified 4096 × 2301 output at a 3840px viewport. All bullets fit within the screen. Checked 390px Read experience dialog and fixed the close button's interference with the header.
- Exported the same reviewed DOM artwork into all three workstation GLB copies; updated the still preview. Build and six targeted resolution/journey tests pass. Existing large-bundle advisory remains.

## Updating baked artwork later

Open `?review#ultra-maritime`, allow the monitor to load, then use **Prepare UM artwork** and **Download UM artwork**. Save the PNG as `assets/textures/station-reorder/ultra-maritime.png`, then run `node web/scripts/clean-monitor-artwork.mjs --ultra-only`. The script checks the physical aspect ratio before embedding. **Prepare scene still** exports the renderer without review controls for refreshing the still preview.

Live preview: http://127.0.0.1:5173/#ultra-maritime

## Title-first revision

Removed the logo. The monitor opens on ULTRA / MARITIME with Software Engineer Intern beneath. A two-unit `ultra-story` phase scrolls the display down to the original four bullets before the existing pan to Formula Racing. The renderer paints a two-page texture once and adjusts its UV offset while scrolling, avoiding per-frame text rasterization. Both pages retain the display aspect ratio and are capped by the GPU texture limit. Updated the baked title fallback and still preview. Build and seven targeted checks pass; both title and résumé views verified in the browser.
