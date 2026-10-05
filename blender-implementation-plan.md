# Blender implementation plan: station assets

## Implementation status

The first asset pass is complete in `blender/portfolio-elements.blend`, scene `Portfolio Elements`. The ultrawide has a curved screen and housing with a 1.5 m curvature radius. Separate station GLBs are in `exports/`; their geometry checks and Blender round-trip scale checks passed. See `exports/README.md` and `exports/validation.json` for delivery details. The original default scene is preserved. The supplied MacBook Pro M5 has replaced the hero and desk laptop. Figma interface and browser scroll integration remain pending.

## Scope

Create four standalone assets for the portfolio:

1. Personal desk with an open MacBook Pro and an ultrawide monitor.
2. Ultra Maritime desk with two separate 27-inch monitors.
3. Hack Atlantic check-in table with one large standing banner and two small tabletop banners.
4. A Formula SAE car for the FSAE station.

Keep these assets separate for the Oryzo-inspired journey: Intro → Experience (Hack Atlantic → Formula SAE → Ultra Maritime) → Projects → Resume → Contact. No shared room construction is required. The next milestone is the browser motion prototype; use its accepted reading frame for Figma layouts, then complete Three.js integration. Use temporary studio lighting to evaluate the assets consistently.

## Shared asset setup

- Read the current Blender scene and add-on status before making changes. Preserve existing work and keep new assets in clearly named collections.
- Use metric scale, with one Blender unit representing one meter.
- Give each station a root empty at floor level for independent placement in the browser compositions.
- Name collections `Station_Personal`, `Station_UltraMaritime`, `Station_HackAtlantic`, and `Station_FSAE`.
- Keep temporary ground, lights, and review cameras in `Preview_Rig`, outside the asset collections.
- Model for the expected medium and close views: recognizable silhouettes, modest bevels, and restrained surface detail.
- Prefer suitable licensed models for the MacBook, monitors, and car. Check asset availability and integration status before importing. Model simple desk and banner structures directly when appropriate.
- Inspect imported bounds, scale, orientation, materials, and licensing. Retain attribution when required.
- Use export-friendly materials and image textures. Keep screen surfaces separate so their content can change later.

Initial desk sizes and device choices are working estimates, not measured replicas. Use references to refine them; the MacBook size/generation and ultrawide size have not been specified.

## Asset 1: personal desk

### Parts

- Rectangular desktop with a subtle edge bevel.
- Simple dark legs or frame.
- Open MacBook Pro: aluminum body, screen housing, black bezel, keyboard, and trackpad.
- One ultrawide monitor: screen, thin bezel, rear housing, and stand.

### Arrangement and materials

- Start with a desk approximately 1.6 m wide, 0.75 m deep, and 0.74 m high; adjust to accommodate the selected devices.
- Center the ultrawide at the back of the desk, with the MacBook forward and slightly to one side so both screens remain visible.
- Use a restrained desktop finish, dark monitor housing, and metallic laptop body that read clearly under warm light.
- Keep display content neutral during modeling; project interfaces will be designed later.
- Create separate screen objects named `Personal_Ultrawide_Screen` and `Personal_MacBook_Screen`.

### Completion criteria

- The laptop reads as a MacBook Pro and the external display reads as an ultrawide.
- Both devices sit correctly on the desktop without intersections.
- Bezel, hinge, keyboard, and stand details hold up at the intended approach distance.
- Screen surfaces are ready for later textures.

## Asset 2: Ultra Maritime desk

### Parts

- Separate rectangular desk and support frame.
- Two matching 27-inch monitors, each with its own housing and stand.
- A surface for the Ultra Maritime logo, such as a small desk plaque.

### Arrangement and materials

- Start with a desk approximately 1.6–1.8 m wide and 0.75 m deep.
- Use two 16:9 displays, each approximately 0.598 m wide by 0.336 m high for the active screen area; add bezels around that area.
- Place the monitors side by side, with a slight inward angle if useful for the camera view.
- Duplicate the first finished monitor so proportions and materials match.
- Name screen objects `Ultra_Monitor_Left_Screen` and `Ultra_Monitor_Right_Screen`.
- Use the same overall material language as the personal desk, with a distinct device arrangement.
- Apply a verified Ultra Maritime logo asset when available. Keep its mounting surface separate; do not invent or approximate the logo.
- Use warm preview lighting, consistent with the rest of the portfolio.

### Completion criteria

- The station is a separate desk with exactly two matching 27-inch monitors.
- Both monitors have believable proportions and desk contact.
- Logo placement is readable from the intended approach angle once the logo asset is supplied or sourced.
- Screen surfaces can receive internship-related content later.

## Asset 3: Hack Atlantic check-in station

### Supplied references

- Event photo: `/Users/daxmanuel/Downloads/IMG_1396.HEIC`.
- Large standing banner artwork: `/Users/daxmanuel/Downloads/Hack Atlantic (1).png`.
- Small tabletop banner artwork: `/Users/daxmanuel/Downloads/hackatlantic.ca.png`.

### Parts and arrangement

- A long check-in table with a light grey top and dark legs, following the photo's overall proportions.
- One tall freestanding banner to the left of the table, with a slim support and base.
- Two smaller upright banners on the tabletop, spaced apart as in the photo.
- Use a simple stand or backing for each small banner.
- Keep all other tabletop items for a later pass, as requested.

### Artwork implementation

- Copy the supplied artwork into the project's asset directory without changing the source files.
- Map the tall artwork onto the large banner and the shorter artwork onto both tabletop banners.
- Preserve each image's aspect ratio; fit the banner geometry to the artwork rather than stretching or cropping the artwork.
- Keep the front graphics correctly oriented and readable, with separate backing materials where needed.
- Use image textures for all lettering and branding.
- Name banner faces `HackAtlantic_Banner_Large`, `HackAtlantic_Banner_Table_Left`, and `HackAtlantic_Banner_Table_Right`.

### Completion criteria

- The asset contains the table and exactly three banners.
- The large banner stands on the left; the two small banners stand on the tabletop.
- The supplied artwork is visible, correctly proportioned, and correctly oriented.
- Supports and bases make contact with the table or floor.
- The station remains recognizable under warm preview lighting.

## Asset 4: Formula SAE car

### Reference and acquisition

- Use a Formula SAE / Formula Student reference or a suitable licensed model, with small open-wheel racecar proportions.
- Prefer an actual UNB team reference when provided. Until then, treat the model as a representative FSAE car, not an exact replica of the team's vehicle.
- Choose an asset with usable topology, separable parts, and compatible materials. Record its source and any required credit.

### Essential parts

- Four exposed wheels and tires.
- Compact chassis and body panels.
- Open cockpit, seat, steering wheel, and roll hoop.
- Visible suspension arms with believable wheel connections.
- Front and rear aero elements only when supported by the selected reference.

### Preparation

- Set scale from the chosen model/reference, then place all four tires on the ground.
- Keep wheels, chassis, bodywork, cockpit, and aero parts grouped separately for possible future close-ups.
- Use restrained bodywork colors, rubber tires, and metal/composite surfaces that read well under warm lighting.
- Add UNB branding only from verified supplied or sourced artwork.
- Defer detailed firmware/electronics displays and component animations until the asset and story focus are agreed.

### Completion criteria

- The silhouette reads as a Formula SAE car from front three-quarter and side views.
- Wheel, cockpit, suspension, and roll-hoop proportions are coherent.
- No floating wheels, disconnected major parts, or obvious intersections are visible.
- The model is practical for later browser use and does not claim unverified team-specific detail.

## Build order and review

1. Prepare collections, scale conventions, and the temporary warm preview rig.
2. Build the personal desk and place the MacBook Pro and ultrawide.
3. Reuse suitable desk construction for the Ultra Maritime station; build one 27-inch monitor and duplicate it.
4. Build the Hack Atlantic table and banner stands, then apply the supplied artwork.
5. Source and prepare the FSAE car.
6. Review each asset independently from its likely camera approach angle and one alternate angle.
7. After each asset pass, confirm the object list and inspect a Blender viewport screenshot. Fix scale, placement, and visual defects before moving on.

## Files and later export

Planned project structure:

- `assets/references/`: supplied photo and artwork copies, plus model references.
- `assets/textures/`: banner textures and later logo/display textures.
- `blender/portfolio-elements.blend`: editable master containing the four station collections.
- `exports/personal-desk.glb`.
- `exports/ultra-maritime-desk.glb`.
- `exports/hack-atlantic-check-in.glb`.
- `exports/fsae-car.glb`.

Save the editable master during asset creation. Before final export, apply appropriate transforms, inspect normals and UVs, remove unused imported data, and verify textures are included. Exclude the temporary preview rig from station exports. Check a round-trip import of the GLBs for material, scale, and hierarchy issues.

Final mesh and texture budgets will follow the actual camera distances and browser performance checks. Do not sacrifice banner readability or monitor silhouettes for premature optimization.

## Remaining references

- Preferred MacBook Pro size/generation and ultrawide appearance, if an exact match is desired.
- Ultra Maritime logo artwork.
- UNB Formula SAE car photo/model and team branding, if an exact team replica is desired.

These references refine the relevant assets. They do not prevent beginning the simple desk and banner structures.
