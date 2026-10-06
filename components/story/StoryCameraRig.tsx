"use client";

import { useFrame, useThree } from "@react-three/fiber";
import { PerspectiveCamera, Vector3 } from "three";
import { STORY_CAMERA_KEYFRAMES } from "@/engine/story/config";

type OrbitControlsLike = {
  target: Vector3;
  update: () => void;
};

function smoothstep(value: number) {
  const x = Math.min(1, Math.max(0, value));
  return x * x * (3 - 2 * x);
}

export function StoryCameraRig({ progress }: { progress: number }) {
  const camera = useThree((state) => state.camera);
  const controls = useThree((state) => state.controls) as OrbitControlsLike | null;

  useFrame((_, delta) => {
    const value = Math.min(1, Math.max(0, progress));
    let endIndex = STORY_CAMERA_KEYFRAMES.findIndex(
      (keyframe) => keyframe.at >= value,
    );

    if (endIndex <= 0) endIndex = 1;
    if (endIndex === -1) endIndex = STORY_CAMERA_KEYFRAMES.length - 1;

    const start = STORY_CAMERA_KEYFRAMES[endIndex - 1];
    const end = STORY_CAMERA_KEYFRAMES[endIndex];
    const segmentLength = Math.max(0.0001, end.at - start.at);
    const localProgress = smoothstep((value - start.at) / segmentLength);

    const desiredPosition = new Vector3(...start.position).lerp(
      new Vector3(...end.position),
      localProgress,
    );
    const desiredTarget = new Vector3(...start.target).lerp(
      new Vector3(...end.target),
      localProgress,
    );
    const desiredFov = start.fov + (end.fov - start.fov) * localProgress;
    const damping = 1 - Math.exp(-8 * delta);

    camera.position.lerp(desiredPosition, damping);

    if (camera instanceof PerspectiveCamera) {
      camera.fov += (desiredFov - camera.fov) * damping;
      camera.updateProjectionMatrix();
    }

    if (controls) {
      controls.target.lerp(desiredTarget, damping);
      controls.update();
    } else {
      camera.lookAt(desiredTarget);
    }
  });

  return null;
}
