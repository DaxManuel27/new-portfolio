from pathlib import Path
p=Path(__file__).with_name('rebake.py')
s=p.read_text().replace("jobs=json.loads((out/'lightmaps.json').read_text());", "jobs=[e for e in json.loads((out/'lightmaps.json').read_text()) if e['object']=='Desk_Top.001'];")
s=s.replace(';bpy.ops.render.render(write_still=True)','')
exec(compile(s,str(p),'exec'))
