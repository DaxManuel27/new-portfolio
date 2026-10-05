# Raspberry Pi 5 asset provenance

Source: Raspberry Pi Ltd official no-graphics STEP archive, https://pip.raspberrypi.com/documents/RP-010083-CA
Retrieved: October 2, 2026 (America/Moncton).
Archive: official-step.zip. Original STEP and included MIT license: source/.
Copyright (c) 2026 Raspberry Pi Ltd. The source archive explicitly permits reuse of incorporated third-party geometry without additional conditions; retain its full LICENSE.txt with distributions.

Conversion: Open CASCADE via cadquery-ocp 8.0.1, STEP/XCAF → tessellated GLB, preserving source color grouping. Blender: axis correction, metre scale, centering, seven presentation materials, welded coincident vertices, planar dissolve and mesh reduction to 64,607 triangles. No silkscreen graphics added. Browser export uses meshopt and contains seven materials; ~1.07 MB. Source CAD is appearance guidance, not production engineering data.

Reproduce: run blender/convert_pi_step.py with cadquery-ocp; run blender/build_fsae_details.py through Blender MCP; render/update fallback posters; run web/scripts/prepare-fsae-details.mjs. Dedicated editable source: blender/raspberry-pi-5.blend.

The pedal-sensor asset is original representative geometry authored for this portfolio. It is not CAD of the user's real assembly.
