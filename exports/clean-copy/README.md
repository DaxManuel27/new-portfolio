# Portfolio copy cleanup

Removed numbered reel labels and visible counters, repeated data-logging copy, the duplicate print hint, and the Personal Projects eyebrow. The Ultra Maritime monitor now contains its title only. Data logging keeps the Raspberry Pi 5 subtitle and the factual body paragraph.

The reel announces the active title and position through a visually hidden polite live region. Preview painting cannot change that announcement. The scroll hint fades during the first card transition and returns on reverse scroll.

The full Raspberry Pi MIT notice remains in public/assets/raspberry-pi-5-LICENSE.txt. Its bundled terms specify preservation of the notice and do not specify adjacent placement. Live and fallback contact sections link to that notice.

Validation: production build passed; 69 existing tests passed; browser assertions passed at 1440×960 and 390×844, including reverse scrolling, live-region text, static copy, contact credits and absence of removed DOM elements. Screenshots in this directory show the final layouts. Vite retains its existing large-bundle warning.

The requested fsae-to-projects-transition-plan.md and fsae-data-logging-zoom-plan.md were absent. Equivalent text was updated in fsae-car-desk-model-plan.md and continuous-pi-zoom-plan.md.

## Asset maintenance

From web/, run `node scripts/clean-monitor-artwork.mjs` after a Blender re-export to replace packed historical screen artwork in the source and distributed GLBs. This also writes the title-only source PNGs. With the preview server running, `node scripts/review-clean-copy.mjs` validates the changes and captures clean workstation/ultrawide posters and the live reel preview. The Blender files themselves retain their prior packed images; the final GLBs and external source images have been updated. The full source-to-web preparation pipeline reads the updated source GLBs.
