# Portfolio plan

> September 30, 2026: the updated interaction direction is documented in [Travelling MacBook portfolio](macbook-scroll-experience-plan.md). The MacBook now travels between stations and opens to present their stories. That plan supersedes the camera-only scroll choreography below while retaining the room and four station assets.

## Goal and current stage

Build a new portfolio for Dax Manuel, using https://daxmanuel.com/ as the source for existing projects, experience, bio, and contact details.

The animation reference is https://oryzo.ai/. Carry over its sense of a continuous scroll-driven visual story: persistent 3D elements, changes in camera framing, and text appearing at deliberate moments. Develop an original room and objects around Dax's work.

The standalone Blender elements and hero lid animation are implemented. Next, prototype separate compositions and the Intro → Hack Atlantic motion loop in the browser, then use its accepted reading frame for Figma interface layouts and extend the journey. The asset implementation plan is in `blender-implementation-plan.md`.

## Core concept and confirmed order

Use the Oryzo-inspired continuous-object scroll style: one MacBook travels between separate station compositions, spinning during transitions and opening to present each story. A shared room is not required. Preserve the standalone station assets and stage them independently in the browser.

Confirmed journey: **Intro → Experience (Hack Atlantic → Formula SAE → Ultra Maritime) → Projects → Resume → Contact**. Intro is an isolated laptop composition. Resume and Contact have their own final checkpoints. The numbered asset sections below are inventory labels, not the journey order.

Use coordinated camera framing, backgrounds, and lighting to connect the compositions. Keep the laptop clear of station geometry and make every reading pose stable and legible.

## Station 1: personal desk and projects

Required elements:

- Personal desk.
- MacBook Pro.
- Ultrawide monitor.
- Warm lamp lighting above the station.

Proposed story and framing:

- Begin with a wider room view and a short introduction.
- Move toward the personal desk, then closer to the laptop and ultrawide monitor.
- Use this station to introduce projects. Project previews could appear on a screen, with readable descriptions beside the scene; the presentation will be resolved in Figma.

Projects listed on the existing portfolio:

- Rust Physics Engine: a physics engine written in Rust.
- ML Framework in C: machine learning from scratch in C.
- Cursor for CAD: prompts to 3D CAD models; McHacks 13 submission.
- Vehicle Perception Model: 3D vehicle detection from LiDAR data.
- 4 Bit CPU: a CPU and arithmetic logic unit built from scratch.
- spotify-cli: browsing music and controlling Spotify from the terminal.

Project selection, ordering, and final copy remain to be decided.

## Station 2: Ultra Maritime internship

Required elements:

- A separate desk from the personal workstation.
- Two separate 27-inch monitors.
- An Ultra Maritime logo on or near the workstation.
- Warm lamp lighting above the station.

Use this stop to describe the software engineering internship. The exact logo placement, desk details, screen content, and internship copy remain to be decided. A desk plaque or wall panel is a possible logo placement.

## Station 3: Hack Atlantic check-in desk

Recreate the essential arrangement in the supplied event photo:

- One large, tall standing banner to the left of the table.
- A long check-in table with a light grey top and dark legs, matching the photo.
- Two smaller upright banners on the tabletop, spaced apart.
- Warm lamp lighting above the station, covering the artwork sufficiently for it to remain readable.

Use the supplied banner artwork directly:

- Large standing banner: `/Users/daxmanuel/Downloads/Hack Atlantic (1).png`.
- Two smaller tabletop banners: `/Users/daxmanuel/Downloads/hackatlantic.ca.png`.
- Arrangement reference: `/Users/daxmanuel/Downloads/IMG_1396.HEIC`.

The initial model includes only the big banner, table, and two smaller banners. Additional tabletop elements that communicate the check-in activity will be chosen later.

Use this station to tell the story of founding Hack Atlantic. The camera should settle into a view that shows the table and banner arrangement clearly.

## Station 4: UNB Formula Racing

Required elements:

- A racecar in the same room.
- Warm lighting above the car, with coverage that makes its silhouette readable.

Use this stop to describe Dax's Formula Racing firmware work. Begin with a view of the car; a closer view of electronics or a relevant component is a possible storytelling detail to resolve later.

The car reference, model detail, team branding, and highlighted components remain to be provided or decided.

## Scroll choreography

1. Intro: isolated travelling MacBook and introductory text.
2. Experience: Hack Atlantic → Formula SAE → Ultra Maritime, each with its own composition and open-laptop story.
3. Projects: the personal desk and ultrawide, with selected project panels inside the MacBook.
4. Resume: experience summary and resume link.
5. Contact: final laptop composition with contact and social links.

Persistent side contents lets visitors skip to any main section or experience substation and highlights the current stop. Use black/charcoal backgrounds, warm amber ambient light, off-white text, and amber accents.

Coordinate laptop travel/spin, camera, station entrances/exits, lid opening, and content on one scroll timeline. Hold stable reading poses between transitions. Keep each station separate; the runtime personal desk must omit its static laptop to avoid duplicating the travelling hero. Provide readable HTML, responsive compositions, and reduced-motion access to all content.

## Production workflow

### 1. Concepts and references

- Use the confirmed separate-station order and review each composition before creating new designs.
- Gather references for the personal desk, Ultra Maritime workstation/logo, and Formula racecar.
- Keep the supplied Hack Atlantic photo and banner artwork as that station's references.

### 2. Blender

- Build the four standalone station assets first, following `blender-implementation-plan.md`.
- Review their proportions, materials, and recognizable details.
- Keep station exports separate and frame each composition with coordinated lighting and camera poses.
- Add Hack Atlantic tabletop props later.
- Prepare the final assets for use in Three.js.

The first standalone asset pass is implemented in `blender/portfolio-elements.blend`: personal desk with MacBook Pro and curved ultrawide, Ultra Maritime desk with two 27-inch monitors and official logo plaque, Hack Atlantic table with the three supplied banners, and a representative Formula SAE car. The original Blender scene is preserved separately. Temporary warm preview lighting is included.

### 3. Figma

- Design the typography, project and experience presentation, navigation, and contact treatment around the Blender scene framing.
- Plan text placement and responsive compositions for each camera stop.
- Establish the scroll storyboard and timing relationships between scene movement and text.

### 4. Three.js

- Assemble the Blender assets and Figma-designed interface into the portfolio.
- Implement the MacBook-led scroll timeline in the confirmed order, coordinating camera and station transitions.
- Add readable project and experience content, working links, and contact details.
- Verify desktop and mobile behavior, loading performance, and reduced-motion support.

## Decisions still open

- Framing and transition poses for the separate station compositions.
- Desk materials, lamp fixture styles, and background details.
- Personal laptop and ultrawide monitor appearance.
- Ultra Maritime logo asset and placement.
- Formula racecar reference and which component, if any, receives a close-up.
- Hack Atlantic tabletop props for a later pass.
- Final project selection, experience copy, and interface design.
- Final camera path, scroll pacing, and closing composition.

The four standalone assets and supplied hero MacBook are built and exported. The next step is a browser composition and motion prototype for Intro → Hack Atlantic, followed by Figma layouts and the remaining stations.
