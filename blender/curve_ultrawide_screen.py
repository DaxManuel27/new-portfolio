"""Seamless curved ultrawide display.

The station reorder replaced the curved display with a flat quad. This rebuilds
`Screen_Ultrawide_Projects` as an arc concentric with the housing's front face,
0.75 mm in front of the black bezel, with chord-uniform UVs: u is linear in the
straight-across x position, so the artwork projects exactly like a flat screen
when seen straight on (the end of the screen zoom) and wraps the curve otherwise.

Run inside Blender with portfolio-station-reorder.blend open: apply().
"""
import bpy, bmesh, math, json
from pathlib import Path
from mathutils import Vector

ROOT = Path('/Users/daxmanuel/Documents/ChatGPT/portfolio-site-blender')
SCENE = 'Reorder — Ultrawide'
SCREEN = 'Screen_Ultrawide_Projects'
HOUSING = 'Reorder_Projects_Personal_Ultrawide_Housing'
BEZEL_MAT = 'MAT_Figma_Device_BlackBezel'
GAP = .00075          # glass sits this far in front of the bezel surface (m)
WIDTH, HEIGHT = .82, .351
SEGMENTS = 96         # twice the housing's 48 facets

def world(o):
    return (world(o.parent) @ o.matrix_parent_inverse @ o.matrix_basis) if o.parent else o.matrix_basis.copy()

def bezel_circle(scene):
    """Fit the circle (in Blender XY) of the bezel's front face; returns cx, cy, r, z range."""
    o = scene.objects[HOUSING]; m = world(o); me = o.data
    pts = []
    for p in me.polygons:
        if not me.materials[p.material_index].name.startswith(BEZEL_MAT): continue
        if (m.to_3x3() @ p.normal).y > -.5: continue
        pts += [m @ me.vertices[i].co for i in p.vertices]
    # Algebraic circle fit x² + y² + Dx + Ey + F = 0 (least squares, 3×3 normal equations).
    S = [[0.0] * 3 for _ in range(3)]; b = [0.0] * 3
    for p in pts:
        row = (p.x, p.y, 1.0); rhs = -(p.x * p.x + p.y * p.y)
        for i in range(3):
            b[i] += row[i] * rhs
            for j in range(3): S[i][j] += row[i] * row[j]
    D, E, F = solve3(S, b)
    cx, cy = -D / 2, -E / 2
    r = math.sqrt(cx * cx + cy * cy - F)
    residual = max(abs(math.hypot(p.x - cx, p.y - cy) - r) for p in pts)
    zs = [p.z for p in pts]
    return cx, cy, r, residual, min(zs), max(zs)

def solve3(A, b):
    M = [A[i][:] + [b[i]] for i in range(3)]
    for c in range(3):
        k = max(range(c, 3), key=lambda r: abs(M[r][c])); M[c], M[k] = M[k], M[c]
        for r in range(3):
            if r != c:
                f = M[r][c] / M[c][c]
                M[r] = [x - f * y for x, y in zip(M[r], M[c])]
    return [M[i][3] / M[i][i] for i in range(3)]

def build(scene=None):
    scene = scene or bpy.data.scenes[SCENE]
    cx, cy, r, residual, zlo, zhi = bezel_circle(scene)
    assert residual < 1e-5, f'bezel is not a circular arc (residual {residual})'
    screen = scene.objects[SCREEN]; inv = world(screen).inverted()
    radius = r - GAP; zc = (zlo + zhi) / 2
    # The bezel arc is concave toward the viewer (−Y): its centre lies in front of the monitor.
    sign = -1 if cy < 0 else 1
    def y_at(x): return cy - sign * math.sqrt(radius * radius - (x - cx) ** 2)
    bm = bmesh.new(); uv = bm.loops.layers.uv.new('ArtworkUV'); n = SEGMENTS + 1
    verts = []
    for row, z in enumerate((zc - HEIGHT / 2, zc + HEIGHT / 2)):
        for i in range(n):
            x = cx - WIDTH / 2 + WIDTH * i / SEGMENTS
            verts.append(bm.verts.new(inv @ Vector((x, y_at(x), z))))
    for i in range(SEGMENTS):
        a, b_, c, d = verts[i], verts[i + 1], verts[n + i + 1], verts[n + i]
        f = bm.faces.new((a, b_, c, d)); f.smooth = True
        for loop in f.loops:
            k = verts.index(loop.vert); loop[uv].uv = ((k % n) / SEGMENTS, k // n)
    bm.normal_update()
    me = screen.data
    for layer in list(me.uv_layers): me.uv_layers.remove(layer)
    bm.to_mesh(me); bm.free()
    me.uv_layers.active = me.uv_layers['ArtworkUV']
    # Face the viewer (−Y in Blender) everywhere.
    m3 = world(screen).to_3x3()
    if (m3 @ me.polygons[SEGMENTS // 2].normal).y > 0:
        for p in me.polygons: p.flip()
    me.update()
    edge_y = y_at(cx - WIDTH / 2)
    info = {'radius': radius, 'segments': SEGMENTS, 'chordWidth': WIDTH, 'height': HEIGHT,
            'sagitta': y_at(cx) - edge_y, 'gap': GAP, 'uv': 'chord-uniform', 'bezelRadius': r}
    for k, v in info.items(): screen['curvature_' + k] = v
    return info, (cx, zc, -edge_y)

def update_layout(info, center_blender_gltf, offset=(6, 0, 0)):
    path = ROOT / 'exports/station-reorder/layout.json'
    layout = json.loads(path.read_text()); scr = layout['ultrawide']['screen']
    x, y, z = center_blender_gltf
    scr['center'] = [x + offset[0], y + offset[1], z + offset[2]]
    scr['width'], scr['height'] = info['chordWidth'], info['height']
    scr['curvature'] = {k: info[k] for k in ('radius', 'segments', 'chordWidth', 'sagitta', 'gap', 'uv')}
    path.write_text(json.dumps(layout, indent=2))
    return scr

def apply(save=True):
    info, center = build()
    scr = update_layout(info, center)
    if save: bpy.ops.wm.save_mainfile()
    print('Curved ultrawide display:', json.dumps(scr))
    return scr
