Build the missing Figma components in Blender

You're working in my portfolio project. Read this whole brief before you change anything.

0. Context
Project: "Dax Manuel — MacBook Scroll Portfolio". It's an Oryzo-style scroll site: one MacBook travels between seven desk "stations" (01 Intro, 02 Hack Atlantic, 03 Formula SAE, 04 Ultra Maritime, 05 Projects, 06 Resume, 07 Contact). Scrolling scrubs the MacBook's pose. The 3D scene lives in Blender.
Design source: Figma file AAoP4nNd3n9QzR9C2Cjarm, https://www.figma.com/design/AAoP4nNd3n9QzR9C2Cjarm/ , page 0:1 "01 — Landing & scroll checkpoints". It has 32 component nodes. They're 2D vector drawings of 3D objects (mostly orthographic projections), and their 3D dimensions have been recovered for you below. You don't need Figma access. If a Figma MCP server happens to be connected, you can use it to double-check a node ID, but don't depend on it.
Reference pack: ./figma_refs/ sits next to this file. §7 lists what's inside. Before modelling each component, look at its reference images with your image-viewing tool.
Some assets already exist in Blender. The station images in Figma were rendered from Blender (see figma_refs/existing_blender_renders/):
a realistic MacBook (open and closed, with a logo)
the Hack Atlantic booth: roll-up banner, long white table and two sign holders
the Formula SAE race car
the Ultra Maritime desk: white desk, two monitors and a "UM" sign
a personal wooden desk with a curved monitor
These station assets are not on the build list. Never rebuild or edit them.
Tie-breaker: for dimensions, the numbers in this brief win. For appearance, the reference images win.
1. Goal

Go through every item in the checklist (§3):

If it already exists in my .blend, leave it alone and report it.
If it's missing, build it to the spec in §5.

Deliver a re-runnable build script, the updated .blend, preview renders and a report.

2. Ground rules (non-negotiable)
Don't modify existing data. Never rename, move, re-parent, re-material or delete anything that already exists in the .blend. The one allowed change is adding the custom property figma_node_id to an existing object you matched in the audit.
Back up first. Before the first write, copy the .blend to <name>.pre-figma-<YYYYMMDD-HHMM>.blend in the same folder.
Isolation. Build everything in a new scene called Figma Components, inside a collection FIGMA_Components with one child collection per item (FC_MacBook, FC_Desk_Station, FC_Prop_LandingDesk, FC_Prop_Printer, FC_Prop_RotaryTelephone, FC_Notebook_Open, FC_Resume_Page, FC_Reference_Cameras). Copy the unit settings of my main scene into the new scene. Don't link anything into my existing scenes.
Tag everything you create. Every created object, collection, material, image and camera gets two custom properties: created_by = "figma_components.py" and figma_node_id = "<id>" (comma-separated if there are several).
Idempotent. Re-running build must create nothing new when everything is already there. Detect existing items by the tags first, then by the matching rules in §4. A --rebuild <item> flag may delete and rebuild only objects tagged created_by = "figma_components.py".
Units and axes. Build at real-world size. Every dimension in this brief is in millimetres. Convert with BU = mm * 0.001 / scene.unit_settings.scale_length. Z is up. Each component's front faces −Y, so Blender's Front view looks straight at it. Width runs along +X.
Colours are sRGB hex. Convert them to linear before writing them to shader inputs:
python
   def srgb_to_lin(c): return c / 12.92 if c <= 0.04045 else ((c + 0.055) / 1.055) ** 2.4
   def hex_to_lin(h, a=1.0):
       h = h.lstrip('#')
       return tuple(srgb_to_lin(int(h[i:i+2], 16) / 255) for i in (0, 2, 4)) + (a,)

Figma used gradients to fake lighting. Use the listed solid base colour and let real lighting do the shading. 8. Headless-safe bpy. Use the data API and bmesh. Avoid operators that need a 3D-viewport context. Check bpy.app.version and use the matching names:

Principled BSDF sockets in 4.x+: Emission Color, Emission Strength, Coat Weight, …
EEVEE engine ID: read the render-engine enum (BLENDER_EEVEE_NEXT on 4.2–4.5, BLENDER_EEVEE on 5.x). If EEVEE fails headless, fall back to Workbench or Cycles at low samples.

If a Blender MCP server is connected, you may use it to inspect or preview my open Blender session. The deliverable is still the headless script. 9. Out of scope: station layouts, the scroll animation and keyframes, the website code, and git commits. Leave all changes uncommitted for my review.

3. Component checklist

The 32 Figma component nodes map to 8 build items plus reference cameras. Several Figma components are just other camera views of the same object. Those become cameras (C9), not extra models.

#	Build item (Blender name)	Figma components (node IDs)	Notes
C1	MacBook: rigged laptop, lid angle 0 / 72 / 106°	MacBook / 3-4 view, set 29:843 (State=Closed 29:840, Opening 29:841, Open 29:842). The same model is also drawn as: MacBook / 3-4 view (desk renders) 43:6648 (43:6641, 43:6642, 43:6643); MacBook / 3-4 view (Hack Atlantic camera) 53:7003 (53:7000, 53:7001, 53:7002); MacBook / front view (open) 60:8570; MacBook / top view (open) 55:7160	one model, many views
C2	7 screen materials M_Screen_*	Screen / Blank 31:656, Screen / Hack Atlantic 52:6712, Screen / Formula SAE 31:666, Screen / Ultra Maritime 31:697, Screen / Projects 31:728, Screen / Resume 31:772, Screen / Contact 31:813; Screen XL / Hack Atlantic 52:6667, Screen XL / Ultra Maritime 52:6676, Screen XL / Projects 52:6685	textures supplied
C3	Desk_Station	Desk / 3-4 view 29:851	dark, low desk used by stations 03, 06 and 07
C4	Prop_LandingDesk	Prop / Landing desk 11:391	legacy: hidden on desktop, still used on mobile
C5	Prop_Printer	Prop / Printer 11:360 + Prop / Printer (top view) 55:7252	one model, two views
C6	Prop_RotaryTelephone	Prop / Rotary telephone 11:385 + Prop / Rotary telephone (top view) 44:5864	one model, two views
C7	Notebook_Open	Notebook / open (top view) 44:5817	
C8	Resume_Page	Resume / page (top view) 55:7265	
C9	5 reference cameras CAM_Figma_*	camera angles stated in the MacBook component descriptions	create only if no equivalent camera exists
4. Step 1: find the .blend and audit it (no writes)
Locate Blender. Try which blender, otherwise use /Applications/Blender.app/Contents/MacOS/Blender. Print the version.
Find the .blend. Run find . -name "*.blend" -not -path "*/node_modules/*" and ignore *.blend1 files and backups.
One file: use it.
Several: inspect each one and pick the main scene file (the one with the MacBook and station assets). Say which file you picked and why.
None: create blender/portfolio_components.blend. Every item is then MISSING.
Dump the scene. Implement the audit subcommand and run <blender> -b <file> --python blender/figma_components/figma_components.py -- audit. It writes blender/figma_components/audit_before.json containing:
scenes and their unit settings
collections
objects: name, type, parent, collections, world-space bounding-box size in mm, materials, modifiers, custom props
cameras: type, ortho scale or lens, rotation in degrees
images: path, size, packed or not
materials
Classify each checklist item:
EXISTS: tagged with its figma_node_id, or a clear match (name hint + size within about 10% + visual check).
PARTIAL: a matching asset exists but lacks something the spec needs, for example a one-piece MacBook whose lid can't open or that has no separate display surface. Don't touch it and don't build a duplicate. List it under "Needs your decision" in the report, with the exact gap.
MISSING: build it.
Name hints and discriminators:
Item	Name hints (case-insensitive)	Must also match
C1	macbook, laptop, mbp	about a 312 × 221 mm footprint. To count as EXISTS: a separate lid object or a hinge that can rotate, plus a separate display surface or material
C2	screen, display, station names	an image or material per station screen
C3	desk, table, station, plinth	dark, about 720 × 396 mm, under 100 mm tall. The white Ultra Maritime desk, the wooden personal desk and the Hack Atlantic table are full-height desks, so they are not C3
C4	landing	low dark platform, about 740 mm wide
C5	printer	
C6	phone, telephone, rotary	
C7	notebook, journal	flat, open, about 306 × 219 mm ("notebook" can also mean the laptop)
C8	resume, cv, page, paper, sheet	a single sheet of about 216 × 279 mm
C9	any camera	ORTHO, with rotation within ±0.5° of the C9 table
When you're unsure, render the candidate (Workbench is fine) and compare it with the matching figma_refs/components/*.png. If an existing MacBook isn't roughly 312 mm wide in real units, note the ratio in the report. Don't rescale anything.
Report the audit. Print the audit table, save it, then carry on with the MISSING items only.
5. Step 2: build spec

Shared conventions

Dimensions are in mm.
In the tables, x runs left → right and y runs back → front (so Blender Y = −y). z is up.
Bevel hard edges by 0.5–2 mm so they catch the light.
Each item states its own origin.
Lay the built items out in a row along +X with gaps of about 150 mm, all standing on Z = 0.
Mark each component collection as an asset (asset_mark()) if the API is available.
C1 · MacBook (14-inch MacBook Pro proportions, warm silver)

This spec has been checked: projecting it through the C9 cameras reproduces every Figma corner of all MacBook variants to within 0.03 px.

Hierarchy: MacBook (Empty, root) → MacBook.Base, MacBook.Keys, MacBook.Hinge (Empty) → MacBook.Lid → MacBook.Display.
Root origin: the back-left corner of the base at desk level. Figma calls this "Laptop origin (back-left, desk level)".

Base: 312.0 × 221.0 × 7.0, plan corner radius 8.0.

Top-deck features (x from the left edge, y from the back/hinge edge):

Part	Size	Position (x, y)	Corner r	Colour	Build
Keyboard well	264.0 × 106.0	24.0, 14.0	5.0	
#24211E	1.0 recess (floor at z 6.0)
Keys ×78 (MacBook.Keys, one mesh)	rows below	inside the well	2.0	
#121110	0.7 tall, so tops sit at z 6.7 and the closed lid clears them
Trackpad	120.0 × 76.0	96.0, 132.0	6.0	
#B9B1A6	flush, with a 0.3 groove outline (
#8E867B)
Speaker grille L / R	14.0 × 104.0	5.0, 16.0 / 293.0, 16.0	3.0	
#9A9287	0.3 recess
Front lip notch	36.0 × 3.0	138.0, 218.0	1.0	
#857D72	thumb scoop in the front top edge

Key rows. y is measured from the well's back edge. Space the keys evenly to fill well-x 3.0 → 261.0 (gaps of about 2.2):

Row	y	Key h	Count × key w
0 (function)	3.0	8.0	14 × 16.4
1	13.2	15.0	14 × 16.4
2	30.4	15.0	14 × 16.4
3	47.6	15.0	13 × 17.8
4	64.8	15.0	12 × 19.5
5	82.0	15.0	11 × 21.5

The keyboard is stylised and has no space bar. Match the Figma drawing.

Hinge: MacBook.Hinge sits at x 0, y 0, z 7.0, the back edge of the deck's top surface. It rotates about +X.

Lid: 312.0 × 219.0 × 5.0, plan corner radius 9.0. Model it closed, as a child of the hinge:

the inner (screen) face is at z 7.0, facing down, spanning y 0 → 219.0
that leaves it 2 mm short of the base front, so the lip notch shows
the outer face is at z 12.0, so the closed height is 12.0

Lid angle:

Add a custom float property lid_angle (degrees, 0–120) to MacBook.
Drive MacBook.Hinge rotation X = −lid_angle·π/180. Use the plain expression -var*0.0174533 so Python auto-run isn't needed.
The presets come from the Figma variants: Closed 0, Opening 72, Open 106. Open is 16° past vertical.
Also store lid_presets = "Closed=0, Opening=72, Open=106". Default the angle to 0.

Lid inner face. Positions are measured from the lid's free edge (the top of the screen when open) and from the left:

Part	Size	Position	r	Colour
Lid rim	full face	—	9.0	
#0A0A0B
Black glass field	309.6 × 216.6	1.2, 1.2	8.0	
#111113
Display (MacBook.Display, a separate plane 0.05 proud)	300.0 × 200.0	6.0, 7.0	~2	M_Screen_Blank
Camera notch	34.0 × 5.0	139.0, 6.5	2.5	
#0A0A0B, overlapping the display's top edge
Chin strip	296.0 × 9.0	8.0, 208.0	2.0	
#0D0D0E

Lid outer face: plain aluminium, no logo.

Materials:

M_MacBook_Aluminium: 
#B1A99E, metallic about 0.8, roughness about 0.35. In Figma the deck is 
#A59D92→
#BDB5AA and the lid back 
#B3ABA0→
#9A9287.
The darker Figma edge colours (
#6D655C, 
#8B8378→
#5A534B, 
#6A6259, 
#80786E) are only shading. One aluminium material covers every edge.
Ignore Figma's "Contact shadow" layer.
C2 · Screen materials

Copy the PNGs from figma_refs/screens/ to <blend dir>/textures/figma/ and reference them with relative paths (//textures/figma/…). Don't pack them. Make one material per station:

Material	Image	Figma
M_Screen_Blank (default on MacBook.Display)	screen_blank.png (1768×1268)	Screen / Blank 31:656
M_Screen_HackAtlantic	screen_xl_hack_atlantic.png (1765×1165)	Screen XL / Hack Atlantic 52:6667 (nested in Screen / Hack Atlantic 52:6712)
M_Screen_FormulaSAE	screen_formula_sae.png (1768×1268)	Screen / Formula SAE 31:666
M_Screen_UltraMaritime	screen_xl_ultra_maritime.png (1765×1165)	Screen XL / Ultra Maritime 52:6676 (nested in 31:697)
M_Screen_Projects	screen_xl_projects.png (1765×1165)	Screen XL / Projects 52:6685 (nested in 31:728)
M_Screen_Resume	screen_resume.png (1768×1268)	Screen / Resume 31:772
M_Screen_Contact	screen_contact.png (1768×1268)	Screen / Contact 31:813
Shader: glossy black glass (base 
#000000, roughness about 0.05) plus emission from the image (strength about 1, image in sRGB).
UVs: the whole image fills the 300 × 200 display, with the image top at the lid's free edge. It must not look mirrored from the front.
The 1768×1268 images end up stretched about 7.6% horizontally. That's intended: it's how Figma maps them onto the lid.
To switch stations, assign a different M_Screen_* material to MacBook.Display.
If C1 already EXISTS, still create these materials (unless they already exist), but don't assign them to my existing MacBook. In the report, say which material slot they'd go on.
C3 · Desk_Station

Build it at in-scene size. Every Figma frame places this desk at exactly 1.2× the MacBook's scale. (The component itself is a 600 × 330 top, 16 thick, with 16 mm legs 40 tall.)

Top: 720.0 × 396.0 × 19.2, plan corner radius about 5, with a bevel of about 2 mm on the top edges (Figma's "Front highlight" 
#3A3632).
Legs: four legs, 19.2 × 19.2 and 48.0 tall, under the top.
x: 21.6–40.8 and 679.2–698.4
y: 7.2–26.4 (back pair) and 350.4–369.6 (front pair)
The back pair is asymmetric in Figma. Keep it that way so the overlay lines up.
Height and origin: 67.2 overall. The origin is the back-left corner of the top surface (Figma: "Desk origin (back-left of top)"), so the legs reach z −67.2. Place the object at Z +67.2 in the layout row.
Materials:
M_Desk_Top: 
#24211E, matte, roughness about 0.55. In Figma the top is 
#1C1A18→
#2B2825, the front edge 
#1E1C1A→
#0E0D0C and the side 
#141210.
M_Desk_Legs: 
#0B0A09, satin black metal (metallic about 0.5, roughness about 0.45).
C4 · Prop_LandingDesk (legacy)

Figma only has a front elevation, drawn at 1 px = 1 mm.

Top: 740 wide × 14 thick. The depth is 300; it isn't in Figma, so assume it.
Legs: four legs, 20 × 20 and 60 tall, inset 30 from the top's left/right ends and from the front/back edges. Overall height 74.
Colours:
top surface 
#34312D
front band 
#1B1916, with a 1 mm grey-green edge line 
#68766D
a fine amber line on the top-front edge, 
#D8AF79 at 40%
a faint warm highlight along the back edge, 
#DB9E5D at 30%
legs 
#1B1916
Do the thin lines as narrow material strips on bevel faces, or skip them if they fight the geometry.
Origin: bottom-centre.
C5 · Prop_Printer

Plan dimensions come from the top view (3 px/mm, the same scale as the MacBook top view). Heights come from the front view, where the 293 px body width equals 300 mm.

Body: 300 W × 210 D × 120 H. It's a soft box:

plan corner radius 16
in front elevation, the lower corners are rounded at r ≈ 18 and the upper edges at r ≈ 6
M_Printer_Body: 
#201E1D (Figma 
#2C2927→
#151413), satin plastic, roughness about 0.45. A fine edge highlight in 
#3B3733 is optional.

Top surface (x from the body's left, y from its back):

Part	Size	Position	r	Colour / build
Scanner lid panel	272 × 138	14, 12	10	
#221F1D (
#262321→
#1D1B19), raised 1.5, outline groove 
#35322E
Lid grip	80 × 4	110, 146	2	
#0F0E0D, 1.5 recess
Control strip	86 × 36	14, 160	8	
#1A1918, 1.0 recess, outline 
#34312D
Status LED	Ø 6.4	centre 32, 178	—	
#34D27B, emission about 3
Power button	Ø 14	centre 80, 178	—	
#232120, 1.5 proud, ring 
#4A4540

Rear paper support:

a plate 200 wide (x 50–250) × about 64 long × 3 thick, 
#262321
hinged at the back top edge and leaning back, so it rises about 47 above the top and overhangs about 44 behind the body
two paper sheets rest in it, 176 wide (x 62–238): top sheet 
#F1EBDF, stack 
#E6DFD2

Front face (x from the body's left, z down from the front face's top edge):

Part	Size	Position	Colour
Trim stripe	63 × 3	x 22, z 18	
#A49B8F
Indicator light	Ø 8	x 213, z 18	
#DB9E5D, faint emission
Mini display	38 × 13	x 227, z 15	
#143D32
Paper output slot	226 × 18 opening	centred, z 47	
#0B0C0D, thin 
#68766D rim

Output tray: a 3 mm plate protruding about 50 from the front face just below the slot, sloping slightly down. It flares from 196 wide at the root to about 240 at the tip. 
#1D1B19 with a 
#A49B8F edge.

Feet: four rubber feet, 41 × 30 × 5 (
#0B0C0D). The front pair sits at x 25–66 and 237–278.

Origin: bottom-centre of the body footprint.

C6 · Prop_RotaryTelephone (Western Electric 500 style)

The plan comes from the top view. It's drawn at 2.362 px/mm because it's placed at 1.27× inside the 3 px/mm bird's-eye frame. The silhouette comes from the front view.

Body:

footprint 220 W × 210 D, plan corner radius 46 (a squircle)
the sides taper inward towards the top, to about 165 wide
the back part is a flat cradle deck about 115 high
the front face slopes down towards the front at about 30° from horizontal and carries the dial
round all edges by about 8–10
M_Phone_Bakelite: 
#1A1816 (
#26221E→
#0F0E0D), glossy: roughness about 0.18, with a light coat

Handset: sits in the cradle, across the back.

Two cups, Ø 64 and about 30 deep, centred at x 42, y 32 and x 178, y 32 from the body's back-left corner.
A capsule handle, 140 long × 30 thick, joins them. It arches so the top of the handset sits about 60 above the cradle deck.
A brass stripe, 116 × 2.2, runs along the top of the handle (
#C99A5B at 80%).
On each cup's top: a 3 × 3 grid of Ø 3.2 holes at 8 mm pitch.

Cradle prongs: two posts, 26 × 12, at x 30, y 58 and x 164, y 58. They rise about 15 above the deck. 
#3A342D, with brass front faces (
#D8AF79).

Dial: on the sloped face, centred in plan at x 110, y 130.

Part	Spec	Colour
Bezel ring	Ø 128, about 3 proud	M_Brass 
#C99A5B, metallic 1, roughness about 0.3
Number plate	Ø 122	
#E4DAC8 (
#EFE7D8→
#D8CDB9)
Finger wheel	Ø 112, about 4 thick, about 2 above the plate	
#141210, glossy
Finger holes ×10	Ø 17 through the wheel, on a 42 radius, at 57°, 84°, 111°, 138°, 165°, 192°, 219°, 246°, 273° and 300° (counter-clockwise from 3 o'clock, looking at the dial face; the gap sits on the right)	the cream plate shows through
Centre card	Ø 38, with a brass ring	
#EFE7D8
Centre pin	Ø 6	
#1C1916
Finger stop	16 × 4 brass tab at about 4 o'clock (−40°), 55 from the centre	
#C99A5B

Also:

Trim line: a thin brass line across the lower front face (
#DB9E5D at 50%).
Feet: four round feet, Ø 31 and 6 tall (
#0B0C0D), about 30 in from the corners.
Coiled cord: a Ø 3.8 tube (
#2A2521) coiled at about Ø 12. It leaves the right side about 120 from the back and trails about 110 to the right and about 85 forward, as in the top view. The front view draws it on the left; follow the top view.
Origin: bottom-centre of the footprint.
C7 · Notebook_Open

An open A5 notebook lying flat. The top view is drawn at 2.362 px/mm.

Cover: 306 × 219 × 2. M_Notebook_Cover: dark brown leather, 
#2F251E (
#3A2E26→
#241C17), roughness about 0.6.
Page blocks: two blocks of 148 × 210, each about 6 thick, dipping gently (about 3) into the centre gutter. Page-edge colour 
#D6CDBF.
Texture: figma_refs/textures/notebook_pages_spread.png (1396 × 1001 px) covers the 296 × 212 page area: the two pages plus a 2 mm page-edge strip along the bottom. It already holds:
the ruled lines, copper margins and gutter shading
the ribbon bookmark
the handwritten links: github.com/daxmanuel27, linkedin.com/in/nikolasdaxmanuel, mail@daxmanuel.com, 506-897-2218
Paper roughness about 0.85.
Origin: bottom-centre.
C8 · Resume_Page
Sheet: US Letter, 215.9 × 279.4 × 0.1 (use Solidify). An optional, very slight curl.
Texture: figma_refs/textures/resume_page_letter.png (1296 × 1674 px, 6 px/mm), mapped 1:1. "Dax Manuel", the contact line and the copper rule (
#B5652A) are already on it.
Paper: 
#F6F2EA, roughness about 0.85.
Origin: centre of the sheet, with the bottom at z 0.
C9 · Reference cameras (orthographic)

Create each camera only if no ORTHO camera with the same rotation (±0.5°) already exists. The first two very likely already exist, because Figma says those angles match my Blender renders. Put new cameras in FC_Reference_Cameras.

Camera	rotation_euler XYZ (deg)	Figma source
CAM_Figma_34	(68, 0, −25)	MacBook / Desk "3-4 view": yaw 25°, pitch 22°, 1.6 px/mm
CAM_Figma_DeskRenders	(66, 0, 25.5)	"matches the Blender desk renders": yaw −25.5°, pitch 24°
CAM_Figma_HackAtlantic	(63.3, 0, 17.3)	"matches the Hack Atlantic Blender capture": yaw −17.3°, pitch 26.7°
CAM_Figma_Front	(74, 0, 0)	front view: looks down 16°, so a 106° lid faces it squarely
CAM_Figma_Top	(0, 0, 0)	bird's-eye top views (3 px/mm)

These rotations assume the object's front faces −Y.

6. Step 3: verify
1. Dimensions

For every created object, print the world-space bounding box in mm against the spec (±0.5 mm). Set lid_angle to 0, 72 and 106, and check the hinge's world rotation each time.

2. Pixel overlays

Do these for the MacBook and desk whenever C1 or C3 was created. figma_refs/overlay/ holds transparent PNGs at an exact scale. For each one:

Render the same view with an orthographic camera and a transparent film.
Alpha-over the Figma image at 50%.
Save the result as previews/overlay_<name>.png.

Camera setup:

Set the resolution to the image size, at 100%.
Set ortho_scale = width_px / px_per_mm mm, converted to BU. Every overlay is wider than it is tall, so the AUTO sensor fit uses the width.
Move the camera so the anchor world point lands on the anchor pixel. Take the camera's right, up and back axes from its rotation, and let s = px per mm (convert the mm results to BU): C = anchor − right·(ax − W/2)/s − up·(H/2 − ay)/s + back·2 m
Overlay file	Camera rotation	px/mm	Anchor world point → pixel (x, y from top-left)	Lid	Screen
macbook_34_closed_2x.png (1464×1250)	(68, 0, −25)	3.2	MacBook origin → (148.1, 930.1)	0	—
macbook_34_opening_2x.png (1464×1250)	(68, 0, −25)	3.2	MacBook origin → (148.1, 930.1)	72	Blank
macbook_34_open_2x.png (1464×1250)	(68, 0, −25)	3.2	MacBook origin → (148.1, 930.1)	106	Blank
macbook_deskrenders_open_2x.png (1468×1284)	(66, 0, 25.5)	3.2	MacBook origin → (415.6, 768.4)	106	Blank
macbook_hackatlantic_open_2x.png (1434×1326)	(63.3, 0, 17.3)	3.2	MacBook origin → (338.4, 787.4)	106	Blank
macbook_front_open_2x.png (1248×1090)	(74, 0, 0)	3.2	MacBook origin → (124.8, 802.3)	106	HackAtlantic
desk_34_1.6x.png (1751×637)	(68, 0, −25)	2.1333	Desk origin (top back-left) → (0, 243.2)	—	—

Target: silhouettes and part edges within about 3 px. Ignore Figma's blurred contact shadow and its painted gradients. If you're off, fix the model, not the camera.

3. Visual side-by-sides

For every created item:

Render it with neutral studio lighting (dark world of about 
#0B0C0D, plus key, fill and rim lights) through the matching camera.
Save previews/compare_<item>.png as [Figma reference | your render].

The references in figma_refs/components/ sit on a 
#C4C4C4 grey, so composite your transparent render on the same grey.

Views to use:

printer and phone: front (camera pitched about 10° down) and CAM_Figma_Top
notebook and resume: CAM_Figma_Top
landing desk: front

Look at each pair and iterate until the proportions, part placement and colours read the same.

4. Relative-scale check

In a throwaway scene called FIGMA_Preview, set up:

Desk_Station
the MacBook, open, with M_Screen_Resume, its origin at the desk origin + (70, −70, 0) mm
the printer standing to the right of the laptop

Render it through CAM_Figma_34 and compare it with the "06 / Resume" tile in figma_refs/scene_reference/all_seven_checkpoints.png. Delete FIGMA_Preview before the final save.

5. Untouched-data check

Re-run the audit into audit_after.json and diff it against audit_before.json. The only allowed differences are the new scene, the new datablocks and any figma_node_id tags you added.

6. Idempotency

Run build a second time. It must report 0 created.

7. Reference pack (./figma_refs/)
Path	Contents
components_overview.png	Every component on one labelled sheet. Start here.
components/	Each Figma component at 1.4–4×, on 
#C4C4C4 grey. The MacBook sets keep Figma's dark backdrop.
overlay/	Transparent, exact-scale PNGs for §6.2.
screens/	The seven screen textures (C2).
textures/	notebook_pages_spread.png (C7) and resume_page_letter.png (C8).
existing_blender_renders/	Renders of assets that should already be in my .blend. Don't rebuild them.
scene_reference/	All seven checkpoints, the zoom and bird's-eye states, and the scroll-transition storyboard. Context only.
8. Deliverables
blender/figma_components/figma_components.py: one script with the subcommands audit, build [--rebuild <item>] and verify. Run it with <blender> -b <file.blend> --python blender/figma_components/figma_components.py -- <subcommand>. It must be re-runnable and use no network.
The .blend: the updated file, saved, plus the backup copy.
Textures: <blend dir>/textures/figma/ with the copied textures.
Previews: blender/figma_components/previews/, with the overlays and side-by-sides.
blender/figma_components/REPORT.md, containing:
the audit table (item, Figma nodes, status, Blender objects, evidence)
what was created
the dimension results
overlay notes
a "Needs your decision" section: PARTIAL items, ambiguities, and any assumption you made
the exact commands to re-run everything
9. Definition of done
The audit table is produced.
Every MISSING item exists in the Figma Components scene, with tags and materials.
Nothing pre-existing changed (proved by the audit diff).
Dimensions are within ±0.5 mm.
When the MacBook or desk was built, its overlays line up within about 3 px.
The side-by-sides are saved.
A second build creates nothing.
The .blend is saved, with a backup.
REPORT.md is written.

Finish with a short summary of what you created and what you skipped.