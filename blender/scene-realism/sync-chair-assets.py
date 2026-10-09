"""Patch chair nodes only, preserving existing compressed geometry and textures."""
from pathlib import Path
import copy, json, struct, shutil
ROOT = Path(__file__).resolve().parents[2]
BACKUP = ROOT / 'exports/chair-fix/backup'
BACKUP.mkdir(parents=True, exist_ok=True)
for relative in ('exports/scene-realism/desk-source.glb', 'exports/scene-realism/desk.glb', 'web/public/assets/scene-realism/desk.glb'):
    path = ROOT / relative
    original = path.read_bytes()
    size, kind = struct.unpack_from('<II', original, 12)
    assert kind == 0x4E4F534A
    doc = json.loads(original[20:20 + size])
    nodes = doc['nodes']
    chair = next(n for n in nodes if n.get('name') == 'Root_chair')
    for name in ('Chair_Chrome_Arm', 'Chair_Chrome_Arm.001'):
        arm = next(n for n in nodes if n.get('name') == name)
        side = -1 if arm['translation'][0] < 0 else 1
        arm['translation'] = [side * .28, arm['translation'][1], -.165]
        arm.get('extras', {}).pop('lightmap', None)
        bracket_name = name.replace('Arm', 'ArmMount')
        bracket = next((n for n in nodes if n.get('name') == bracket_name), None)
        if bracket is None:
            bracket = copy.deepcopy(arm)
            nodes.append(bracket)
            chair['children'].append(len(nodes) - 1)
        bracket['name'] = bracket_name
        bracket['translation'] = [side * .274, arm['translation'][1], -.009]
        scale = arm.get('scale', [1, 1, 1])
        bracket['scale'] = [scale[0] * .036 / .026, scale[1], scale[2] * .018 / .33]
        bracket.get('extras', {}).pop('lightmap', None)
    encoded = json.dumps(doc, separators=(',', ':')).encode()
    encoded += b' ' * (-len(encoded) % 4)
    tail = original[20 + size:]
    patched = struct.pack('<III', 0x46546C67, 2, 20 + len(encoded) + len(tail)) + struct.pack('<II', len(encoded), kind) + encoded + tail
    backup = BACKUP / relative.replace('/', '_')
    if not backup.exists():
        shutil.copy2(path, backup)
    path.write_bytes(patched)
    assert patched[20 + len(encoded):] == tail
    print(f'Updated {relative}; compressed binary payload preserved')
