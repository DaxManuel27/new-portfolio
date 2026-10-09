from pathlib import Path
p=Path('/Users/daxmanuel/Documents/ChatGPT/portfolio-site-blender/blender/scene-realism/rebake.py')
s=p.read_text().replace("jobs=json.loads((out/'lightmaps.json').read_text());", "jobs=[e for e in json.loads((out/'lightmaps.json').read_text()) if e['object'] in ['Desk_Top.001','Wall']];")
exec(compile(s,str(p),'exec'))
