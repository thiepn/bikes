"use client";

import { useFrame, useThree } from "@react-three/fiber";
import { PerspectiveCamera, Vector3 } from "three";
import { getComponentFocus } from "@/engine/camera/component-focus";

type OrbitControlsLike = {
  target: Vector3;
  update: () => void;
};

export function CameraRig({ selectedId }: { selectedId: string | null }) {
  const camera = useThree((state) => state.camera);
  const controls = useThree((state) => state.controls) as OrbitControlsLike | null;

  useFrame((_, delta) => {
    const focus = getComponentFocus(selectedId);
    const desiredPosition = new Vector3(...focus.position);
    const desiredTarget = new Vector3(...focus.target);
    const alpha = 1 - Math.exp(-5.8 * delta);

    camera.position.lerp(desiredPosition, alpha);

    if (camera instanceof PerspectiveCamera) {
      camera.fov += (focus.fov - camera.fov) * alpha;
      camera.updateProjectionMatrix();
    }

    if (controls) {
      controls.target.lerp(desiredTarget, alpha);
      controls.update();
    } else {
      camera.lookAt(desiredTarget);
    }
  });

  return null;
}
