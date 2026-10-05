# Hack Atlantic founder chapter

Implemented in the main scroll journey, between the existing Hack Atlantic laptop hold and its departure to the workstation. Revised per feedback: the animated journey keeps the original 3D background and displays the website/recap only on the real MacBook screen. The DOM panel is clipped and mapped to the display's projected plane; the standalone CSS laptop remains only in the accessible reduced-motion view.

- Existing 3D laptop display with a high-resolution capture of the official landing page.
- Peach hero, 120px peach-to-mint transition, founder contributions, six statistics, and verified website/Instagram/LinkedIn links.
- Shared Ultra Maritime contribution typography and spacing; self-hosted League Spartan headings with accompanying OFL license.
- Optional stack and judging claims omitted pending confirmation.
- Full content also appears in the reduced-motion document view.

## Validation

- Full suite: 77 tests passed. Following the chapter-link adjustment, seven targeted journey/Hack Atlantic tests passed again.
- Production build passed; existing large-bundle advisory remains.
- Browser checks: desktop three-column stats, 800px tablet two-column stats, 390px phone one-column stats without horizontal overflow.
- Verified normal scrolling from the laptop to contributions and all six statistics/social links, and onward to the original 3D exit.
- Reduced-motion view contains the complete chapter without transforms or animations; restored normal motion after checking.
- Screenshots: `exports/hack-founder/hero.jpg` and `exports/hack-founder/recap.jpg`.

Preview: http://127.0.0.1:5173/#hack-atlantic
