# Portfolio completion: Figma first, Blender second

Status: Figma and Blender implementation delivered 2026-10-01. See `figma_refs/completion/README.md` and `exports/completion/README.md` for the finished assets, motion, previews, validation and documented differences.

This plan supersedes conflicting implementation order, screen-content and page-UI proposals in the earlier plans. The current Figma file and the user's latest material instructions are the source of truth.

Figma: https://www.figma.com/design/AAoP4nNd3n9QzR9C2Cjarm

## Scope and fixed decisions

- Preserve the existing MacBook, station desks, Hack Atlantic branding, FSAE car, monitors, printer, notebook, résumé page and red phone. Complete missing details and arrangements rather than rebuilding them.
- Keep MacBook screens blank black glass, without emission. Keep the current silver aluminium and red phone materials.
- Keep the experience object-led. Do not restore page titles, navigation, filler copy, or screen stories from older plans. The two existing FSAE callouts remain part of the current design.
- Sequence: Intro → Hack Atlantic → Formula SAE → Ultra Maritime → Projects → Resume → Contact.
- Complete Figma designs, textures, dimensions and motion specifications before Blender implementation starts. Reuse existing finished artwork where it remains correct.
- Back up every .blend before its next edit. Preserve original models and source artwork; isolate new props and rigs in named collections.
- Website construction and browser scroll integration are a later phase. This delivery supplies assets, scene layouts, cameras, animation and a documented handoff.

## 1. Complete the Figma production designs

Add a clearly named production handoff section in the existing file. Keep final artwork, dimensions and material notes separate from the actual portfolio frames. Link every handoff item to its source checkpoint/component.

| Item | Figma work | Blender result |
| --- | --- | --- |
| Pen | Finish the pen shown in Contact bird's-eye (44:6050). Provide top and side views, length/diameter, tip and clip details, material swatches and placement relative to the notebook. | Separate pen with sensible pivot and tabletop contact. |
| Phone numbers | Finish a flat, unlit 0–9 number-ring layout from 44:5864, with dial centre, radii and finger-hole guides. Export artwork without perspective, lighting or the acrylic wheel. | Numbers placed on the ivory plate beneath the clear finger wheel. |
| FSAE callouts | Finalize “Data logging” and “Accelerator pedal sensor” from 40:3463: type, backing, connector line, anchor point, and wide/close framing. Verify anchors against the actual car; flag any unverified component location. | Separate camera-facing labels and independently controllable connector curves; do not bake labels into the car's paint. |
| Resume composition | Finish wide and bird's-eye arrangements of desk, MacBook, printer and printed page. Specify paper orientation, scale, clearances, feed path and final resting position. Reference 55:7271 and the printing/printed states. | Assembled Resume station with paper-feed rig. |
| Contact composition | Finish wide and bird's-eye arrangements of desk, MacBook, notebook, pen and phone. Check links, phone cord, object spacing and page readability. Reference 13:2882 and 44:5817. | Assembled Contact station with matching camera views. |
| Close-up cameras | Finalize Hack Atlantic 54:6828, Ultra Maritime 54:6950 and Projects 54:7071. Include the starting view and final view, frame dimensions and object landmarks. | Straight-on camera endpoints and push-ins. |

### Texture package

These are proposed export sizes. Verify legibility in the final close-up before freezing them.

| Asset | Proposed export | Requirements |
| --- | --- | --- |
| Phone number ring | 1024 × 1024 PNG; keep editable vector master | Flat sRGB artwork; ivory background and dark digits. Centre/radius registration documented; guides excluded from export. |
| FSAE callouts | One transparent PNG per label, up to 1024 px wide; retain SVG masters | sRGB, adequate transparent padding, no baked scene shadow. Preserve aspect ratio. Connector lines stay separate geometry. |
| Notebook pages | Reuse existing spread; refresh at 2048 px wide if current lettering fails the close-up | Flat page artwork, current contact details, no desk, pen, lighting or perspective baked in. |
| Résumé page | Reuse existing page; refresh at 2048 px on the long edge if necessary | Preserve US Letter ratio and current content. No invented résumé claims. |
| Pen finish | Material sheet; optional 512² surface maps only if the design needs grain or engraving | Solid finishes use Principled values. Do not manufacture texture maps merely to fill a checklist. |
| Existing phone plastic | Reuse the three original 512² maps from 99:11028 / 99:11030 / 99:11032 | Albedo sRGB; roughness and OpenGL normal Non-Color. Keep 25 mm tiling, mean roughness 0.22 and normal strength 0.15. |

Export actual flat artwork or original image fills, never screenshots of presentation sheets. Do not bake reflections into albedo or interpret Figma gradients as roughness/normal data. Use a consistent padding policy for alpha textures and inspect edges against light and dark backgrounds.

Save the next handoff in `figma_refs/completion/` and working textures in `assets/textures/figma-completion/`. Include a manifest with asset name, file key, source node ID, export dimensions, physical dimensions, color space, alpha policy, material slot, version/date and checksum. Preserve the original exports alongside any Blender-specific channel packing.

### Figma design milestone

Before moving to Blender, assemble a review board showing the finished pen, dial artwork, callouts, Resume/Contact layouts, close-up camera endpoints, and texture sheets. All required exports must exist, contain the expected pixels/alpha, and be readable at their intended framing. Resolve missing design decisions here so they are not improvised while modeling.

## 2. Finish the motion specification in Figma

Use the existing “Scroll transitions — Blender reference” board (48:5573). Refine its authored choreography rather than replacing it with the older generic motion proposal.

| Transition | Design intent to preserve |
| --- | --- |
| Intro → Hack Atlantic | Forward flip, landing on the branded table. |
| Hack Atlantic → Formula SAE | Lift and turntable spin. |
| Formula SAE → Ultra Maritime | Barrel roll; opening coordinated with landing. |
| Ultra Maritime → Projects | Close, rise and reveal the underside. |
| Projects → Resume | Half-open turntable movement, with the lid angle readable in profile. |
| Resume → Contact | Remain open, slow yaw and slide, followed by the Contact top-down move. |

For every transition, provide storyboard poses at departure, lift, midpoint rotation, approach and landing, plus explicit start/end holds. Record normalized progress, laptop position, pitch/yaw/roll, lid angle, camera pose/target, framing and station visibility. Include screen-space composition guides and metric placement notes; Figma perspective drawings alone cannot uniquely determine a 3D camera.

Specify full rotations as unwrapped angles so a 360° turn cannot collapse to no rotation. Use consistent boundary poses and smooth acceleration. Design reverse playback from the same progress values. Keep the existing 10% landed-pose hold guidance, with its exact interval made explicit for each transition.

Also specify:

- Hack Atlantic push-in: centered laptop, no camera yaw/roll relative to it at the endpoint, standee cropped at both outer edges.
- Ultra Maritime and Projects push-ins: centered front-facing endpoints, with the keyboard still visible from a slight elevation.
- Resume and Contact: transition from their wide views into the composed bird's-eye views.
- Printer feed: sheet hidden inside the printer initially, visibly emerging through the slot, then stopping at the designed printed pose. Show clearance and the leading-edge path.
- Mobile and reduced-motion reference frames: simple static/shortened alternatives for the eventual website, without adding a second incompatible asset set.

The motion handoff is a pose specification and Figma prototype, not a claim that scroll-driven browser behavior has been implemented.

## 3. Implement the Blender assets and compositions

Start only after the Figma design and texture package is complete.

1. Create timestamped backups and record the active master, library copies and exports that will change. Audit the scene, addon version, existing transforms and material links.
2. Model the pen to the Figma dimensions. Set a useful local origin and use the designed material values. Add UVs only where artwork or surface maps need them.
3. Apply the number-ring artwork to the existing phone plate. Register it under the finger holes, checking top and three-quarter views. Keep the acrylic material and phone plastic unchanged.
4. Build separate FSAE callouts and connector curves. Match the authored view and verify label legibility and anchor positions. Keep labels separable for future browser overlays.
5. Assemble `Station_Resume` and `Station_Contact` from existing assets. Reuse the notebook/résumé textures, replacing only explicitly revised artwork. Place the pen, route the phone cord and check tabletop contact and collisions.
6. Add named wide, front close-up and bird's-eye cameras. Match static endpoint renders to Figma before adding movement. Keep Hack Atlantic's updated laptop/standee placement.

Use a single travelling MacBook hierarchy in the animation scene: travel root → spin pivot → base and lid pivot. Reuse the current supplied model, hinge offset and animation controls. Existing station laptop copies can remain in isolated asset-review scenes, but must be hidden from the assembled journey wherever the hero is present.

## 4. Animate in Blender

1. Prove the complete Intro → Hack Atlantic sequence first: travel, landing, opening, hold and straight-on push-in.
2. Implement the remaining five transitions from the Figma pose tables. Separate travel, spin, hinge and camera channels so each transform has one owner.
3. Add Resume/Contact bird's-eye moves and the paper-feed animation. Use deterministic keyframes; avoid simulation for these controlled interactions.
4. Preserve the source hinge convention: `rotation.x = radians(110 - openingDegrees)`. Validate every pose across the opening range.
5. Define frame ranges, markers and normalized progress ranges in a machine-readable motion manifest. Record station visibility and camera settings separately from mesh clips; a GLB does not preserve every Blender/Figma presentation effect.
6. Scrub forward and backward, including transition boundaries and mid-spin poses. Check clipping, lid collisions, desk contact, framing and continuity. Render a full journey preview plus station endpoint stills.

## 5. Validate and export

- Compare each Blender endpoint with its matching Figma frame at the same aspect ratio. Check silhouette, placement, crop, typography and material response. Document any remaining differences instead of calling them an exact match.
- Confirm dial digits remain visible beneath the acrylic, label alpha edges are clean, notebook/résumé text is readable, and the MacBook display remains blank and non-emissive.
- Check missing textures, UV orientation, finite geometry, evaluated triangle counts and material assignments. Preserve existing hero detail for the first pass; optimize after measuring export size and close-up quality.
- Pack images into the .blend files while retaining project-relative external copies. Export separate props/stations, the travelling MacBook and animation clips as appropriate. Keep cameras/lights outside reusable prop exports; deliver camera motion/settings separately or in an explicitly named scene export.
- Re-import GLBs to verify dimensions, hierarchy, animation ranges and texture registration. Confirm clearcoat, transmission, IOR and normal strength still survive export.
- Deliver updated .blend files, GLBs, Figma-linked texture manifest, motion manifest, comparison stills, journey preview, backup locations and a concise validation report. Do not claim browser performance or scroll behavior until a site exists and is tested.

## Execution order

1. Figma pen, dial artwork and FSAE callouts.
2. Figma Resume/Contact layouts and camera endpoints.
3. Figma motion storyboard and all required texture exports.
4. Blender static models, artwork and assembled compositions.
5. Blender camera moves, travelling MacBook and printer animation.
6. Visual comparison, GLB round-trip validation and delivery.

Figma items 1–3 and Blender items 4–6 are delivered. FSAE anchors remain explicitly conceptual because the existing representative car does not contain verified sensor components. All Blender files changed in this pass were backed up first.

Latest framing instruction: keep the travelling MacBook larger and centered throughout transit. Move it sideways only where the station composition requires it, currently Formula SAE. The original Figma storyboard and motion manifest version 1.1 reflect this rule.
