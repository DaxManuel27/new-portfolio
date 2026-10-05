"""Convert the official MIT-licensed Pi 5 CAD; run with cadquery-ocp installed."""
from pathlib import Path
from OCP.STEPCAFControl import STEPCAFControl_Reader
from OCP.TDocStd import TDocStd_Document
from OCP.TCollection import TCollection_ExtendedString,TCollection_AsciiString
from OCP.XCAFDoc import XCAFDoc_DocumentTool
from OCP.collections import Sequence_TDF_Label as TDF_LabelSequence
from OCP.BRepMesh import BRepMesh_IncrementalMesh
from OCP.RWGltf import RWGltf_CafWriter
from OCP.Message import Message_ProgressRange
from OCP.collections import IndexedDataMap_TCollection_AsciiString_TCollection_AsciiString
ROOT=Path(__file__).resolve().parents[1]
doc=TDocStd_Document(TCollection_ExtendedString('Pi5'))
reader=STEPCAFControl_Reader();reader.SetColorMode(True);reader.SetNameMode(True)
assert int(reader.ReadFile(str(ROOT/'assets/models/raspberry-pi-5/source/rpi-5b_no_graphics.step')))==1
assert reader.Transfer(doc)
shapes=XCAFDoc_DocumentTool.ShapeTool_s(doc.Main());labels=TDF_LabelSequence();shapes.GetFreeShapes(labels)
for i in range(1,labels.Length()+1):
 shape=shapes.GetShape_s(labels.Value(i));BRepMesh_IncrementalMesh(shape,.15,False,.35,True).Perform()
writer=RWGltf_CafWriter(TCollection_AsciiString(str(ROOT/'assets/models/raspberry-pi-5/converted.glb')),True)
assert writer.Perform(doc,IndexedDataMap_TCollection_AsciiString_TCollection_AsciiString(),Message_ProgressRange())
print('Converted official STEP to GLB')
