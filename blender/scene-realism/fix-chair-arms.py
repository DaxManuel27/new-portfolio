"""Idempotent chair correction; execute in either editable desk or room scene."""
import bpy

def fix_chair_arms():
    for name in ('Chair_Chrome_Arm', 'Chair_Chrome_Arm.001'):
        arm = bpy.data.objects[name]
        side = -1 if arm.location.x < 0 else 1
        arm.location.x = side * .28
        arm.location.y = .165
        # Chrome now uses the scene's live lighting instead of the old rear-arm bake.
        if 'lightmap' in arm:
            del arm['lightmap']
        bracket_name = name.replace('Arm', 'ArmMount')
        bracket = bpy.data.objects.get(bracket_name)
        if bracket is None:
            bracket = arm.copy()
            bracket.name = bracket_name
            arm.users_collection[0].objects.link(bracket)
        bracket.parent = arm.parent
        bracket.location = (side * .274, .009, arm.location.z)
        bracket.scale = arm.scale.copy()
        bracket.scale.x *= .036 / .026
        bracket.scale.y *= .018 / .33
        if 'lightmap' in bracket:
            del bracket['lightmap']
    bpy.context.view_layer.update()

fix_chair_arms()
