/**
 * Figma 99:11025. Pass the website's existing Three.js namespace and a URL
 * pointing at the directory containing the three downloaded PNGs.
 * The caller owns disposal after removing all meshes using these materials.
 */
export async function createPhoneMaterials(THREE, textureBaseURL, { flipY = false } = {}) {
  const loader = new THREE.TextureLoader();
  const textures = [];
  try {
    for (const name of ['albedo', 'roughness', 'normal']) {
      const texture = await loader.loadAsync(new URL(`${name}.png`, textureBaseURL).href);
      textures.push(texture);
      texture.name = `RedPhone_${name}`;
      texture.colorSpace = name === 'albedo' ? THREE.SRGBColorSpace : THREE.NoColorSpace;
      texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
      // GLTFLoader uses unflipped UVs. Set true when using native Three geometry.
      texture.flipY = flipY;
      texture.needsUpdate = true;
    }
  } catch (error) {
    textures.forEach(texture => texture.dispose());
    throw error;
  }
  const [map, roughnessMap, normalMap] = textures;
  const materials = {
    plastic: new THREE.MeshPhysicalMaterial({
      name: 'RedPhone_Plastic', color: '#A3101A', map,
      roughness: 0.22, roughnessMap, metalness: 0,
      clearcoat: 1, clearcoatRoughness: 0.05, ior: 1.5,
      normalMap, normalScale: new THREE.Vector2(0.15, 0.15),
    }),
    numberRing: new THREE.MeshPhysicalMaterial({
      name: 'RedPhone_NumberRing', color: '#F4F1EA', roughness: 0.6, metalness: 0,
    }),
    acrylic: new THREE.MeshPhysicalMaterial({
      name: 'RedPhone_Acrylic', color: '#FFFFFF', transmission: 1,
      roughness: 0.05, metalness: 0, ior: 1.5,
    }),
    chrome: new THREE.MeshPhysicalMaterial({
      name: 'RedPhone_Chrome', color: '#D7D8DC', metalness: 1, roughness: 0.15,
    }),
  };
  return {
    ...materials,
    dispose() {
      Object.values(materials).forEach(material => material.dispose());
      textures.forEach(texture => texture.dispose());
    },
  };
}
