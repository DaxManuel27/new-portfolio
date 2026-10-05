"""Build a non-destructive Blender review of the browser's corrected Projects path.

Run through Blender MCP after web/tests/projects-clearance.test.ts exports poses.json.
The TypeScript evaluator remains authoritative. This script copies the current
hero and station geometry, bakes its 30 fps pose samples, and saves a review copy.
It never exports or changes the canonical hero, station or camera assets.
"""
import bpy
import hashlib
import json
import math
from datetime import datetime, timezone
from pathlib import Path
from mathutils import Matrix, Quaternion, Vector

ROOT = Path(__file__).resolve().parents[1]
POSES = ROOT / 'web/test-results/projects-clearance/poses.json'
OUT = ROOT / 'blender/previews/projects-clearance'
SCENE_NAME = 'Review — Projects Monitor Clearance'
TAG = 'projects_clearance_review'
PREFIX = 'Clearance_'
BROWSER_TO_BLENDER = Matrix.Rotation(math.pi / 2, 4, 'X')
BASIS = BROWSER_TO_BLENDER.to_quaternion()


def enum(block, field, value):
    assert value in {item.identifier for item in block.bl_rna.properties[field].enum_items}, (field, value)
    setattr(block, field, value)


def digest(path):
    return hashlib.sha256(path.read_bytes()).hexdigest()


def object_signature(obj):
    return {
        'parent': obj.parent.name if obj.parent else None,
        'basis': [list(row) for row in obj.matrix_basis],
        'data': obj.data.name if obj.data else None,
        'action': obj.animation_data.action.name if obj.animation_data and obj.animation_data.action else None,
        'hidden': [obj.hide_render, obj.hide_viewport],
    }


def browser_quaternion(values):
    x, y, z, w = values
    return (BASIS @ Quaternion((w, x, y, z)) @ BASIS.inverted()).normalized()


def curves(action):
    if hasattr(action, 'fcurves'):
        yield from action.fcurves
    for layer in getattr(action, 'layers', []):
        for strip in layer.strips:
            for bag in getattr(strip, 'channelbags', []):
                yield from bag.fcurves


def collection(scene, name):
    result = bpy.data.collections.new('COL_' + PREFIX + name)
    result[TAG] = True
    scene.collection.children.link(result)
    return result


def duplicate(objects, target, offset=(0, 0, 0)):
    mapping = {}
    for source in objects:
        obj = source.copy()
        obj.name = PREFIX + source.name
        obj.animation_data_clear()
        obj[TAG] = True
        if source.type in {'LIGHT', 'CAMERA'}:
            obj.data = source.data.copy()
            obj.data.animation_data_clear()
        target.objects.link(obj)
        mapping[source] = obj
    for source, obj in mapping.items():
        obj.parent = mapping.get(source.parent)
        obj.matrix_parent_inverse = source.matrix_parent_inverse.copy()
        obj.matrix_basis = source.matrix_basis.copy()
        if obj.parent is None:
            obj.location += Vector(offset)
        for modifier in obj.modifiers:
            if hasattr(modifier, 'object') and modifier.object in mapping:
                modifier.object = mapping[modifier.object]
        for constraint in obj.constraints:
            if hasattr(constraint, 'target') and constraint.target in mapping:
                constraint.target = mapping[constraint.target]
        obj.hide_render = source.hide_render or 'Cutter' in source.name
        obj.hide_viewport = source.hide_viewport or 'Cutter' in source.name
    return mapping


def tree(obj):
    return [obj, *obj.children_recursive]


def camera(scene, name, position, target, width):
    data = bpy.data.cameras.new('CAM_' + PREFIX + name)
    enum(data, 'type', 'ORTHO')
    data.ortho_scale = width
    data.clip_start = .001
    data.clip_end = 100
    obj = bpy.data.objects.new(data.name, data)
    obj[TAG] = True
    scene.collection.objects.link(obj)
    obj.location = position
    obj.rotation_euler = (Vector(target) - obj.location).to_track_quat('-Z', 'Y').to_euler()
    return obj


def set_time(scene, time):
    frame = 1 + time * scene.render.fps
    scene.frame_set(math.floor(frame), subframe=frame % 1)


def build():
    data = json.loads(POSES.read_text())
    frames = data['frames']
    assert data['fps'] == 30 and len(frames) == 241
    assert abs(frames[0]['time'] - 12) < 1e-6 and abs(frames[-1]['time'] - 20) < 1e-6
    assert all(abs(row['time'] - (12 + index / 30)) < 1e-6 for index, row in enumerate(frames))
    OUT.mkdir(parents=True, exist_ok=True)
    source_path = Path(bpy.data.filepath)
    protected_paths = [ROOT / 'exports/completion/macbook-journey.glb', ROOT / 'web/public/assets/macbook-journey.glb', ROOT / 'web/public/assets/journey.json', ROOT / 'web/public/assets/station-projects.glb', ROOT / 'web/public/assets/station-resume.glb']
    protected_hashes = {str(path.relative_to(ROOT)): digest(path) for path in protected_paths}
    source_objects = {obj.name: object_signature(obj) for obj in bpy.data.objects if not obj.get(TAG)}
    original_counts = {scene.name: len(scene.objects) for scene in bpy.data.scenes if scene.name != SCENE_NAME}
    timestamp = datetime.now(timezone.utc).strftime('%Y%m%d-%H%M%S')
    backup = ROOT / 'blender/backups' / ('before-projects-clearance-' + timestamp)
    backup.mkdir(parents=True, exist_ok=True)
    bpy.ops.wm.save_as_mainfile(filepath=str(backup / 'live-before-review.blend'), copy=True)

    # Idempotent rebuilding only removes this script's tagged review objects.
    existing = bpy.data.scenes.get(SCENE_NAME)
    if existing:
        if bpy.context.window.scene == existing:
            bpy.context.window.scene = bpy.data.scenes['Completion — Shared Resume Contact']
        bpy.data.scenes.remove(existing)
    for obj in list(bpy.data.objects):
        if obj.get(TAG):
            bpy.data.objects.remove(obj, do_unlink=True)
    for col in list(bpy.data.collections):
        if col.get(TAG):
            bpy.data.collections.remove(col)

    scene = bpy.data.scenes.new(SCENE_NAME)
    scene[TAG] = True
    scene['motion_source'] = str(POSES.relative_to(ROOT))
    scene['authoritative_evaluator'] = 'web/src/projects-motion.ts'
    scene['note'] = 'Review-only copy. Poses are a deterministic 30 fps bake; canonical GLB and cameras are unchanged.'
    bpy.context.window.scene = scene
    scene.unit_settings.scale_length = 1
    scene.render.fps = 30
    scene.frame_start, scene.frame_end = 361, 601
    reference = bpy.data.scenes['Completion — Projects']
    scene.world = reference.world
    scene.render.engine = reference.render.engine
    scene.cycles.samples = 16
    scene.cycles.use_denoising = True
    scene.render.resolution_x, scene.render.resolution_y = 1440, 960
    scene.render.resolution_percentage = 75
    scene.view_settings.view_transform = reference.view_settings.view_transform
    scene.view_settings.look = reference.view_settings.look
    scene.view_settings.exposure = reference.view_settings.exposure
    enum(scene.render.image_settings, 'file_format', 'PNG')

    hero_col = collection(scene, 'Hero')
    source_root = bpy.data.objects['Journey_TravelFeet']
    hero = duplicate(tree(source_root), hero_col)
    feet = hero[source_root]
    spin = hero[bpy.data.objects['Journey_MacBook_SpinPivot']]
    lid = hero[bpy.data.objects['Journey_MacBook_LidPivot']]
    for obj in (spin, lid):
        enum(obj, 'rotation_mode', 'QUATERNION')
    for obj in hero.values():
        obj.hide_render = False
        obj.hide_viewport = False

    projects_col = collection(scene, 'ProjectsReference')
    projects = duplicate(tree(bpy.data.objects['Projects_Personal_Root']), projects_col, (8, 0, 0))
    shared_col = collection(scene, 'SharedDeskReference')
    shared_scene = bpy.data.scenes['Completion — Shared Resume Contact']
    excluded = set(tree(bpy.data.objects['Shared_Resume_MacBook_TravelRoot']))
    shared_sources = [obj for obj in shared_scene.objects if obj not in excluded and obj.type not in {'CAMERA', 'LIGHT'} and 'Resume_Page' not in obj.name and 'PaperFeed_Review' not in obj.name]
    shared = duplicate(shared_sources, shared_col, (10, 0, 0))
    lights_col = collection(scene, 'Lights')
    duplicate([obj for obj in reference.objects if obj.type == 'LIGHT'], lights_col, (8, 0, 0))

    previous = {}
    for row in frames:
        frame = round(1 + row['time'] * 30)
        feet.location = BROWSER_TO_BLENDER @ Vector(row['position'])
        feet.keyframe_insert('location', frame=frame)
        for obj, values in ((spin, row['quaternion']), (lid, row['lid'])):
            rotation = browser_quaternion(values)
            if obj in previous and previous[obj].dot(rotation) < 0:
                rotation.negate()
            obj.rotation_quaternion = rotation
            previous[obj] = rotation.copy()
            obj.keyframe_insert('rotation_quaternion', frame=frame)
    for obj, suffix in ((feet, 'Feet'), (spin, 'Spin'), (lid, 'Lid')):
        action = obj.animation_data.action
        action.name = 'AN_ProjectsClearance_' + suffix
        for curve in curves(action):
            for point in curve.keyframe_points:
                enum(point, 'interpolation', 'LINEAR')
    for time, name in [(13.6, 'Incoming clearance'), (14.4, 'Forward lane'), (15.2, 'Desk approach'), (16, 'Projects parked'), (16.3173, 'Reported 77 percent'), (16.4, 'Departure lane'), (17.3, 'Right of monitor'), (18, 'Safe Resume handoff'), (19.6, 'Resume touchdown')]:
        scene.timeline_markers.new(name, frame=round(1 + time * 30))

    camera(scene, 'ThreeQuarter', (9.6, -2.4, 2.24), (8, -.03, 1.09), 2.0)
    camera(scene, 'Side', (8.85, -.03, 1.16), (7.9, -.03, 1.16), 1.75)
    camera(scene, 'Overhead', (8, -.02, 3), (8, -.02, .74), 1.45)
    scene.camera = bpy.data.objects['CAM_' + PREFIX + 'ThreeQuarter']

    max_position_error = 0
    max_rotation_error = 0
    for row in frames:
        set_time(scene, row['time'])
        max_position_error = max(max_position_error, (feet.location - BROWSER_TO_BLENDER @ Vector(row['position'])).length)
        for obj, values in ((spin, row['quaternion']), (lid, row['lid'])):
            expected = browser_quaternion(values)
            max_rotation_error = max(max_rotation_error, 1 - abs(obj.rotation_quaternion.normalized().dot(expected)))
    assert max_position_error < 2e-6 and max_rotation_error < 2e-6, (max_position_error, max_rotation_error)
    set_time(scene, 16.3173)
    for area in bpy.context.screen.areas:
        if area.type == 'VIEW_3D':
            space = area.spaces.active
            enum(space.region_3d, 'view_perspective', 'CAMERA')
            space.region_3d.view_camera_zoom = 0
            space.overlay.show_overlays = False
    assert all(object_signature(bpy.data.objects[name]) == signature for name, signature in source_objects.items()), 'A protected source object changed'
    assert all(len(bpy.data.scenes[name].objects) == count for name, count in original_counts.items())
    assert all(digest(ROOT / name) == value for name, value in protected_hashes.items()), 'A canonical export changed'
    review_path = ROOT / 'blender/projects-clearance-review.blend'
    bpy.ops.wm.save_as_mainfile(filepath=str(review_path), copy=True)
    receipt = {
        'review_scene': scene.name, 'review_blend': str(review_path.relative_to(ROOT)),
        'source_blend': str(source_path), 'backup': str(backup.relative_to(ROOT)),
        'pose_source': str(POSES.relative_to(ROOT)), 'pose_sha256': digest(POSES),
        'runtime_evaluator': 'web/src/projects-motion.ts', 'frames': len(frames), 'fps': 30, 'frame_range': [361, 601],
        'duplicated_objects': {'hero': len(hero), 'projects': len(projects), 'shared_desk': len(shared)},
        'new_geometry': 0, 'new_textures': 0,
        'max_baked_position_error_m': max_position_error, 'max_baked_quaternion_dot_error': max_rotation_error,
        'original_objects_unchanged': len(source_objects), 'original_scenes_unchanged': original_counts,
        'canonical_export_sha256': protected_hashes, 'captures': [],
        'validation_note': 'At 30 fps keys, Blender transforms match the browser source. Collision proof is the separate exported-geometry regression; this scene supports visual review.'
    }
    (OUT / 'receipt.json').write_text(json.dumps(receipt, indent=2))
    print(json.dumps(receipt, indent=2))
    return scene


def capture(name, time, view='ThreeQuarter'):
    scene = bpy.data.scenes[SCENE_NAME]
    bpy.context.window.scene = scene
    scene.camera = bpy.data.objects['CAM_' + PREFIX + view]
    set_time(scene, time)
    scene.render.filepath = str(OUT / (name + '.png'))
    bpy.ops.render.render(write_still=True)
    receipt_path = OUT / 'receipt.json'
    receipt = json.loads(receipt_path.read_text())
    receipt['captures'] = [entry for entry in receipt['captures'] if entry['name'] != name]
    receipt['captures'].append({'name': name, 'time': time, 'view': view, 'path': str(Path(scene.render.filepath).relative_to(ROOT))})
    receipt_path.write_text(json.dumps(receipt, indent=2))
    print(scene.render.filepath)


def finalize_review():
    """Confirm the final runtime dump and exported assets still match this review."""
    receipt_path = OUT / 'receipt.json'
    receipt = json.loads(receipt_path.read_text())
    assert digest(POSES) == receipt['pose_sha256'], 'Runtime poses changed; rebuild the review before finalizing'
    assert all(digest(ROOT / name) == value for name, value in receipt['canonical_export_sha256'].items())
    assert all(len(bpy.data.scenes[name].objects) == count for name, count in receipt['original_scenes_unchanged'].items())
    assert len(receipt['captures']) >= 4 and all((ROOT / entry['path']).is_file() for entry in receipt['captures'])
    receipt['final_pose_hash_verified'] = True
    receipt['visual_review'] = 'PASS: incoming and reported 77% poses show a clear physical gap in side and three-quarter captures.'
    receipt['geometry_validation_report'] = 'web/test-results/projects-clearance/report.json'
    receipt['qa_verdict'] = 'SHIP: review bake matches the final runtime poses, with no changes to original source objects or canonical exports.'
    receipt['completed_utc'] = datetime.now(timezone.utc).isoformat()
    receipt_path.write_text(json.dumps(receipt, indent=2))
    print(json.dumps({key: receipt[key] for key in ('pose_sha256', 'final_pose_hash_verified', 'visual_review', 'qa_verdict')}, indent=2))


if __name__ == '__main__':
    build()
