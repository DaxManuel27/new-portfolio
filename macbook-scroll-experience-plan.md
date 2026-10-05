# Travelling MacBook portfolio — interaction and production plan

Historical plan. Superseded for browser implementation by `scroll-implementation-plan.md` (2026-10-02). In particular, screen stories, persistent navigation and the earlier generic choreography below are not current requirements; screens remain blank and the completed Blender/Figma motion handoff is authoritative.

Date: September 30, 2026  
Status: proposed implementation plan; animation and website are not yet built.

Model preparation is now implemented in `blender/macbook-hero.blend` and `exports/macbook-hero.glb`, using the supplied MacBook Pro M5, its native textures, independent travel/spin/lid pivots, and a validated opening/closing clip. See `exports/macbook-hero-README.md`. The browser scroll journey remains to be built.

The supplied replacement has 163,918 triangles and a 110° hinge offset. These supersede the earlier simplified-model budget and hinge assumptions below; browser optimization remains pending.

## Experience

One MacBook travels through separate station compositions as the visitor scrolls, following the Oryzo-inspired continuous-object style. The confirmed order is **Intro → Experience (Hack Atlantic → Formula SAE → Ultra Maritime) → Projects → Resume → Contact**. The intro presents the laptop independently; each subsequent station enters as its own composition. A shared furnished room is not required.

At each station the laptop slows down, turns its screen toward the visitor, and smoothly opens to present that station's story. Further scrolling closes it and carries it to the next composition. Keep the station assets separately loadable and independently positioned; lighting and backgrounds connect the visual style without requiring physical room construction.

The MacBook leads the movement, with coordinated camera framing, station entrances/exits, and text. Treat “talk about it” as written content and project media on the screen; narration is an optional later feature. Contact links can appear within the final Contact composition, without adding a travel station.

## Reference: what to carry over from Oryzo

I inspected the live [Oryzo website](https://oryzo.ai/) through its opening and early scroll sequences. The coaster remains the visual focus as its apparent scale, orientation, and context change: an opening tabletop composition, an isolated object on a dark background, a hand-held presentation, and a framed wearable sequence. Large text and scene changes accompany these poses.

Apply this continuity and deliberate staging to the MacBook. Use rotation to connect compositions, then settle into a readable presentation. This is a visual reference, not a claim about Oryzo's internal implementation or exact animation curves. The MacBook choreography below is an original proposal.

## Scroll storyboard

The percentages are an initial allocation of total journey progress, not fixed timing. Reading sections should grow to fit the final content. Scrolling controls the pace, and stopping the scroll holds the current pose after a short smoothing interval.

| Progress | Chapter | MacBook action | Screen and surrounding scene |
|---|---|---|---|
| 0–10% | Intro | Isolated laptop turns toward the first station | Name, introduction, and side contents |
| 10–15% | Travel to Hack Atlantic | Approach, settle, and open | Check-in table and banners enter |
| 15–27% | Experience / Hack Atlantic | Open reading hold | Founder story |
| 27–32% | Travel to Formula SAE | Close, turn, and travel | Car composition enters |
| 32–44% | Experience / Formula SAE | Open reading hold | Firmware work |
| 44–49% | Travel to Ultra Maritime | Close and travel | Dual-monitor workstation enters |
| 49–61% | Experience / Ultra Maritime | Open reading hold | Software engineering internship |
| 61–66% | Travel to My desk | Close and travel | Personal desk composition enters |
| 66–84% | Projects | Open reading hold; advance project panels | Selected projects |
| 84–92% | Resume | Settle into resume composition | Summary and resume link |
| 92–100% | Contact | Final open laptop composition | Contact and social links |

The project shortlist and all claims remain provisional. The existing plan lists Rust Physics Engine, ML Framework in C, Cursor for CAD, Vehicle Perception Model, 4 Bit CPU, and spotify-cli. Choose three for the main journey after reviewing their available visuals and final copy. Do not invent outcomes, metrics, or internship details.

## Repeatable stop choreography

Each station uses the same recognizable sequence, with a different approach direction and background composition.

| Local chapter progress | Action | Design rule |
|---|---|---|
| 0–20% | Approach | Laptop translates toward its station; camera eases into the reading composition |
| 20–35% | Settle and open | Rotation slows to zero; lid opens from 0° to about 108° measured from closed |
| 35–40% | Reveal content | Screen brightness rises and the station content fades in once the display faces the viewer |
| 40–85% | Read | Hold laptop, hinge, and camera steady while the visitor reads or advances screen panels |
| 85–92% | Dismiss | Fade the screen content before closing; remove hidden screen controls from keyboard focus |
| 92–100% | Close and depart | Close the lid, begin the next travel pose, and blend into the following chapter |

The final Contact chapter has no close-and-depart phase. These local ranges subdivide each chapter's assigned global range; author shared boundary poses so adjacent chapters meet continuously.

“Arriving at an element” means reaching an authored station position on the timeline. It does not require collision detection or physically hitting the desk, banner, or car. Make the arrival clear through proximity, a camera settle, and a subtle increase in the station's light.

### Rotation and travel

- Author curved transitions between separate station compositions. Keep the laptop clear of each visible asset; no shared room layout is required.
- Give the first departure one deliberate full turn to establish the spinning motif. Use smaller 90–180° turns on subsequent trips, with restrained banking. Tune these after the blockout; never spin while visitors are reading.
- Close the laptop before large rotations. Preserve hinge contact and the visible thickness of the body throughout the turn.
- Keep the laptop inside the viewport during travel. Station objects can enter and leave the frame around it.
- Use continuous position curves with matching tangents at joins. Ease motion into and out of reading poses.
- Author intentional full turns on a dedicated spin pivot with an unwrapped angle. Quaternion interpolation between identical start/end orientations would otherwise erase a 360° turn. Use quaternion interpolation for the remaining orientation changes.
- Reverse scrolling must reverse the same sequence smoothly. Do not launch independent opening animations on each threshold crossing.
- A rapid scroll or navigation jump should resolve directly to the correct current pose and content, without playing a backlog of missed transitions.

## Screen presentation and readability

Each screen panel contains a short title, one strong visual, a concise explanation, and one primary link. Start with 35–60 words of body copy per panel. Additional detail belongs in a case-study page or expanded accessible section.

Use one content data source for the screen presentation and the regular page content. At reading stops, render real HTML aligned with the laptop's display, clipped inside its bezel. Match the display plane's perspective and hide the HTML while the lid is closed, back-facing, or in transit. Use a simple screen texture or glow during movement. Prototype the HTML-to-display alignment before designing all screen layouts.

At desktop reading stops, frame the laptop large enough that body text renders at roughly 16–18 CSS pixels or larger. Keep the screen close to face-on and reduce glare over text. If the panel does not fit, enlarge the reading composition or divide the content into panels; do not shrink it into illegibility.

The canvas should not intercept ordinary scrolling. Screen links become interactive only in a settled reading pose. Retain persistent side contents: Intro; Experience with Hack Atlantic, Formula SAE, and Ultra Maritime subitems; Projects; Resume; Contact. Highlight the active item. Every item jumps to its readable hold and synchronizes laptop pose and content; on mobile use a compact contents control. Retain a “Skip to content” link. Long descriptions and all essential links must remain available without relying on 3D interaction. Avoid duplicate screen-reader announcements from mirrored screen content.

On mobile, keep the laptop's opening gesture and a visual/title inside its screen, but place full copy and links in a normal card beneath it. Shorten travel and reduce rotation. For reduced motion, show static open-laptop compositions with normal document flow. A missing WebGL context or failed model download should produce the same usable content fallback.

## Existing assets and required Blender work

The four station GLBs remain separate. The supplied MacBook Pro M5 is exported independently with validated travel/spin/lid controls and an opening clip. See `exports/macbook-hero-README.md` for the current hierarchy, dimensions, native textures, and hinge formula. Remove the stationary desk laptop from the runtime personal-desk composition so only the travelling hero appears.

### Production brief

| Item | Plan |
|---|---|
| Asset | Animated hero laptop for a browser portfolio |
| Art direction | Restrained realistic aluminum, dark bezel, warm reflections |
| Scale | Preserve metric scale; supplied model is approximately 0.312 m wide |
| Geometry target | Current source is 163,918 triangles; optimize after measuring browser performance |
| Textures | Up to 2K for laptop detail; 1K mobile variants where sufficient; real HTML for reading text |
| Export | Separate `exports/macbook-hero.glb`, meter scale, glTF Y-up |
| Pivots | Travel root at laptop center; separate spin pivot; lid pivot on the physical hinge axis |
| Animation | Rigid transforms for body and lid; no skeletal deformation required |

Proposed hierarchy:

```text
MacBook_TravelRoot
└── MacBook_SpinPivot
    ├── MacBook_BaseGroup
    │   └── body, keyboard, trackpad, speakers
    └── MacBook_LidPivot
        └── housing, bezel, screen, camera notch
```

Create this as a separate export collection and preserve the current station master. Remove or hide the stationary laptop in the runtime personal-desk scene so only one MacBook is visible. Do not assume its existing hinge angle is a closed-pose value: calibrate closed and open poses in Blender, export, and verify them again in Three.js after axis conversion. Check for keyboard/lid intersections across the entire range.

## Browser implementation approach

Propose Three.js for the scene and a single scroll-driven timeline for laptop transforms, camera, hinge angle, lighting emphasis, and content visibility. No web application or package manifest was found in the inspected workspace; framework selection remains an implementation decision.

[GSAP ScrollTrigger](https://gsap.com/docs/v3/Plugins/ScrollTrigger/) supports scrubbing a timeline with scroll progress, pinning, and refresh of trigger positions. Use native document scroll and a persistent viewport canvas. Start with about 0.3 seconds of scrub smoothing and tune by feel. This is a proposed stack, not an identification of Oryzo's stack. Three.js reference: [official documentation](https://threejs.org/docs/).

Store chapter definitions in data: section ID, scroll range, laptop path, orientation keys, hinge keys, camera position/target, light emphasis, and content ID. Derive every visible state from the same evaluated progress. Maintain one owner for each animated transform so the render loop and timeline cannot fight each other.

Recalculate section boundaries after fonts and layout settle, on resize, and after orientation changes. Preserve the active chapter during responsive changes. Anchor navigation should land inside a chapter's readable hold, including on initial deep links and browser history restoration.

Load the hero laptop first and prefetch the next station. Keep a lightweight poster and readable introduction visible during loading. The existing export notes identify the Hack Atlantic GLB as approximately 10.4 MB; resize/compress its artwork for the actual viewing distance before using it in the first production download. Keep nearby stations loaded, avoid repeated decoding during reverse scroll, and dispose resources when the experience unmounts.

Initial performance targets, to be measured rather than assumed: roughly 60 fps on a representative laptop and a stable 30 fps or better on a mid-range phone. Cap pixel ratio, limit real-time shadows, and lower visual quality when needed. Stop rendering unchanged poses once smoothing has settled; pause background rendering when the tab is hidden.

## Build sequence and review gates

1. **Separate composition and motion blockout.** Use the validated hero and separate station GLBs. Frame Intro, Experience (Hack Atlantic, Formula SAE, Ultra Maritime), Projects, Resume, and Contact in that order. Produce closed, travelling, and open reading poses. Gate: the laptop remains recognizable, clears the environment, and can fill the frame without hiding the station's identity.
2. **One complete station prototype.** Build the Intro → Hack Atlantic approach, opening, readable screen, closing, and next departure in a minimal browser scene. Gate: forward and reverse scrolling work; screen alignment and link interaction are reliable.
3. **Figma screen layouts.** Design the accepted reading frame, three project panels, experience panels, mobile cards, and contact. Reuse existing `assets/textures/figma/` visuals where suitable; review text for close-up readability before reuse.
4. **Complete the journey.** Add the remaining stations and chapter navigation, coordinating lighting and camera framing with the MacBook path. Gate: every station has a clear arrival, sufficient reading space, and a smooth departure.
5. **Optimize and validate.** Compress assets, test representative devices, implement reduced motion and loading failures, and adjust scroll distances to the final copy.

### Acceptance checklist

- One continuous MacBook travels between all four stations; no duplicate desk laptop is visible.
- The lid opens smoothly on arrival, the correct station story appears inside its display, and it closes before the next major spin.
- Stop scrolling at any point: the scene settles predictably, with no ongoing tumble during reading.
- Scroll backward, fling forward, jump by chapter, reload a deep link, and resize: pose and content stay synchronized.
- No hinge separation, mesh intersections, clipping, HTML outside the bezel, or backwards screen content.
- Screen copy and links are readable and keyboard-accessible; inactive panels cannot steal focus.
- Mobile, reduced-motion, model-load failure, and WebGL failure paths preserve the complete portfolio content.
- Test Safari, Chrome, and Firefox on desktop, plus iOS Safari and Android Chrome on representative hardware.
- Report measured loading and frame-rate results before calling the experience production-ready.

The first implementation milestone is one convincing loop: **travel → settle → open → present → close → depart**. That loop establishes the motion, screen readability, and technical approach before extending the journey to every station.

## Figma checkpoint prototype

The editable landing-page and checkpoint prototype is at https://www.figma.com/design/AAoP4nNd3n9QzR9C2Cjarm. Confirmed visual theme: black and charcoal with warm amber ambient light, warm off-white typography, and amber navigation accents. Exact scroll choreography remains a later implementation step.
