import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
function asset(name: string) {
  const data = fs.readFileSync(`public/assets/${name}.glb`);
  return JSON.parse(data.subarray(20, 20 + data.readUInt32LE(12)).toString());
}
function surface(doc: any, name: string, normal = true) {
  const index = doc.materials.findIndex((m: any) => m.name === name);
  assert.ok(index >= 0, name);
  const material = doc.materials[index];
  for (const info of [material.pbrMetallicRoughness.metallicRoughnessTexture, ...(normal ? [material.normalTexture] : [])]) {
    assert.ok(info, `${name} must retain its surface map after compression`);
    const texture = doc.textures[info.index];
    const source = texture.extensions?.EXT_texture_webp?.source ?? texture.source;
    assert.ok(doc.images[source].bufferView !== undefined, 'embedded image');
    for (const mesh of doc.meshes) for (const primitive of mesh.primitives) if (primitive.material === index) {
      assert.ok(primitive.attributes[`TEXCOORD_${info.texCoord ?? 0}`] !== undefined, `${name} UV set`);
    }
  }
  return material;
}
test('photographic surface maps and their UV sets survive optimized export', () => {
  const hero = asset('macbook-journey');
  surface(hero, 'MAT_MacBook_Silver');
  assert.equal(surface(hero, 'MAT_MacBook_Trackpad_Satin', false).pbrMetallicRoughness.metallicFactor, 0);
  surface(asset('station-projects'), 'MAT_Figma_Desktop_smoked walnut');
  surface(asset('station-resume'), 'M_Printer_Body');
  const paper = surface(asset('printer-paper-feed'), 'MAT_Completion_Resume_Page.Sheet');
  assert.equal(paper.normalTexture.texCoord, 1, 'paper fiber UVs remain separate from printed artwork');
  assert.equal(paper.pbrMetallicRoughness.baseColorTexture.texCoord ?? 0, 0);
});
test('photographic environment is a valid Radiance file', () => {
  assert.ok(fs.readFileSync('public/assets/studio-small-09.hdr').subarray(0, 80).toString().includes('#?RADIANCE'));
});
