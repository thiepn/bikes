import * as THREE from "three";
import { acceleratedRaycast, computeBoundsTree, disposeBoundsTree } from "three-mesh-bvh";

let enabled = false;

export function enableBvhRaycasting() {
  if (enabled) return;

  THREE.Mesh.prototype.raycast = acceleratedRaycast;
  Object.assign(THREE.BufferGeometry.prototype, {
    computeBoundsTree,
    disposeBoundsTree,
  });

  enabled = true;
}
