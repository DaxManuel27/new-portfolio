import {NodeIO} from '@gltf-transform/core';import {ALL_EXTENSIONS} from '@gltf-transform/extensions';import {dequantize} from '@gltf-transform/functions';import {MeshoptDecoder} from 'meshoptimizer';
import {AnimationClip,BufferGeometry,Float32BufferAttribute,Group,Mesh,QuaternionKeyframeTrack,VectorKeyframeTrack} from 'three';
export async function loadGeometry(filename: string) {
  await MeshoptDecoder.ready;
  const io = new NodeIO().registerExtensions(ALL_EXTENSIONS).registerDependencies({ 'meshopt.decoder': MeshoptDecoder });
  const doc = await io.read(filename);
  await doc.transform(dequantize());
  const nodes = new Map(doc.getRoot().listNodes().map(node => {
    const object = new Group(); object.name = node.getName();
    object.position.fromArray(node.getTranslation()); object.quaternion.fromArray(node.getRotation()); object.scale.fromArray(node.getScale());
    for (const primitive of node.getMesh()?.listPrimitives() ?? []) {
      const geometry = new BufferGeometry();
      geometry.setAttribute('position', new Float32BufferAttribute(primitive.getAttribute('POSITION')!.getArray()!, 3));
      const indices=primitive.getIndices();
      if(indices)geometry.setIndex(Array.from(indices.getArray()!));
      geometry.computeBoundingBox(); object.add(new Mesh(geometry));
    }
    return [node, object] as const;
  }));
  for (const [node, object] of nodes) for (const child of node.listChildren()) object.add(nodes.get(child)!);
  const root = new Group();
  for (const child of doc.getRoot().listScenes()[0].listChildren()) root.add(nodes.get(child)!);
  const tracks = doc.getRoot().listAnimations().flatMap(animation => animation.listChannels().map(channel => {
    const sampler = channel.getSampler()!, node = channel.getTargetNode()!;
    const type = channel.getTargetPath() === 'rotation' ? QuaternionKeyframeTrack : VectorKeyframeTrack;
    const property = channel.getTargetPath() === 'rotation' ? 'quaternion' : 'position';
    return new type(`${node.getName()}.${property}`, sampler.getInput()!.getArray()!, sampler.getOutput()!.getArray()!);
  }));
  return { root, clip: new AnimationClip('Journey', -1, tracks) };
}
