"""Retire the mug behind the lamp, retaining editable geometry for recovery."""
import bpy

mug = bpy.data.objects.get('Root_mug')
if mug:
    mug['websiteHidden'] = True
    for obj in [mug, *mug.children_recursive]:
        obj.hide_render = True
        obj.hide_set(True)
