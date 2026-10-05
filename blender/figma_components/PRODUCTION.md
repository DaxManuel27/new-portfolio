# Production brief and reference analysis

Target: reusable portfolio props in the editable Blender master. Style: the supplied warm, dark Figma objects, using real geometry and solid sRGB colours with studio lighting. Authoritative dimensions: BRIEF.md. Appearance: project-local figma_refs (copied from the supplied handoff).

Preserve all existing objects and station scenes. C1 is the accepted realistic M5 model with a rotating lid and distinct display; build no replacement. C2 materials remain unassigned to it. C3–C8 are isolated props in Figma Components/FIGMA_Components. Five C9 orthographic rotations will be added if unmatched.

Model budget: approximately 2,000–8,000 triangles per standard prop, up to 20,000 for the telephone's true finger holes and coiled cord. Texture budget: the supplied 1296–1768 px PNGs, unpacked and relative. No website, station placement, animation, exports or commits. Script runs offline in Blender 5.2.2 LTS with data API/bmesh; scene loading/saving/rendering use context-independent wm/render operations.

Reference findings: station desk is a shallow asymmetric-legged black platform; landing desk is a wider thin platform. Printer silhouette is a rounded front body, raised rear support, scanner panel, front slot and flared tray. Phone has a tapered rounded body, arched receiver, cream dial plate and brass rings, with the cord on the right per top view. Notebook is a broad flat spread with a gentle gutter dip; texture supplies the handwriting and bookmark. Resume is a single US Letter sheet, with the texture supplying all print.

Validation: numerical world bounds (specified parts within 0.5 mm), station desk exact orthographic overlay, front/top reference pairs, throwaway resume station scale preview, existing-datablock fingerprints before/after, and a second build that creates zero datablocks. Reference comparisons prioritize silhouette and part positions, allowing the difference between painted gradients and physical light.
