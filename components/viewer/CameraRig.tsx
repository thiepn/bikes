"use client";

import { useEffect, useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import { PerspectiveCamera, Vector3 } from "three";
import { getComponentFocus } from "@/engine/camera/component-focus";

type OrbitControlsLike = {
  target: Vector3;
  update: () => void;
  enabled: boolean;
};

const DURATION_SECONDS = 0.72;

function easeInOutCubic(value: number) {
  return value < 0.5
    ? 4 * value * value * value
    : 1 - Math.pow(-2 * value + 2, 3) / 2;
}

export function CameraRig({ selectedId }: { selectedId: string | null }) {
  const camera = useThree((state) => state.camera);
  const controls = useThree((state) => state.controls) as OrbitControlsLike | null;

  const elapsed = useRef(DURATION_SECONDS);
  const startPosition = useRef(new Vector3());
  const startTarget = useRef(new Vector3());
  const startFov = useRef(34);

  useEffect(() => {
    startPosition.current.copy(camera.position);
    startTarget.current.copy(controls?.target ?? new Vector3(0, 0.48, 0));
    startFov.current = camera instanceof PerspectiveCamera ? camera.fov : 34;
    elapsed.current = 0;

    if (controls) controls.enabled = false;

    return () => {
      if (controls) controls.enabled = true;
    };
  }, [camera, controls, selectedId]);

  useFrame((_, delta) => {
    if (elapsed.current >= DURATION_SECONDS) {
      if (controls && !controls.enabled) controls.enabled = true;
      return;
    }

    elapsed.current = Math.min(
      DURATION_SECONDS,
      elapsed.current + delta,
    );

    const progress = easeInOutCubic(elapsed.current / DURATION_SECONDS);
    const focus = getComponentFocus(selectedId);

    camera.position.lerpVectors(
      startPosition.current,
      new Vector3(...focus.position),
      progress,
    );

    if (camera instanceof PerspectiveCamera) {
      camera.fov = startFov.current + (focus.fov - startFov.current) * progress;
      camera.updateProjectionMatrix();
    }

    const target = new Vector3().lerpVectors(
      startTarget.current,
      new Vector3(...focus.target),
      progress,
    );

    if (controls) {
      controls.target.copy(target);
      controls.update();
    } else {
      camera.lookAt(target);
    }

    if (elapsed.current >= DURATION_SECONDS && controls) {
      controls.enabled = true;
    }
  });

  return null;
}
