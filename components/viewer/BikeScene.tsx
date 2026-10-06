"use client";

import {
  AdaptiveDpr,
  ContactShadows,
  Environment,
  Lightformer,
  OrbitControls,
} from "@react-three/drei";
import { PrototypeBike } from "./PrototypeBike";
import { CameraRig } from "./CameraRig";
import { CAMERA_LIMITS, CAMERA_TARGET } from "@/engine/camera/presets";
import { enableBvhRaycasting } from "@/engine/raycast/setup-bvh";
import type {
  ViewerInteractionHandlers,
  ViewerInteractionState,
} from "@/engine/interaction/types";

enableBvhRaycasting();

type BikeSceneProps = ViewerInteractionState & ViewerInteractionHandlers;

export function BikeScene(props: BikeSceneProps) {
  return (
    <>
      <color attach="background" args={["#07090c"]} />
      <fog attach="fog" args={["#07090c", 4.5, 9]} />

      <ambientLight intensity={0.2} />
      <directionalLight
        castShadow
        color="#eef5ff"
        intensity={2.2}
        position={[2.5, 4.2, 1.8]}
        shadow-mapSize-width={1024}
        shadow-mapSize-height={1024}
        shadow-bias={-0.00012}
      />
      <spotLight
        color="#d9ff67"
        intensity={18}
        angle={0.42}
        penumbra={0.9}
        position={[-2.6, 2.8, -1.8]}
      />

      <Environment resolution={256}>
        <Lightformer form="rect" intensity={3.2} color="#f5f8ff" position={[0, 4, -3]} rotation={[Math.PI / 2, 0, 0]} scale={[6, 6, 1]} />
        <Lightformer form="rect" intensity={2.2} color="#b9c9ff" position={[3, 1.4, 1]} rotation={[0, -Math.PI / 2, 0]} scale={[3, 2, 1]} />
        <Lightformer form="rect" intensity={1.5} color="#d9ff67" position={[-3, 1.1, -1]} rotation={[0, Math.PI / 2, 0]} scale={[2, 3, 1]} />
      </Environment>

      <PrototypeBike {...props} />

      <mesh receiveShadow rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.004, 0]}>
        <planeGeometry args={[12, 12]} />
        <meshStandardMaterial color="#090c10" metalness={0.18} roughness={0.38} />
      </mesh>

      <ContactShadows position={[0, 0.006, 0]} opacity={0.52} scale={5} blur={2.6} far={2.1} />

      <OrbitControls
        makeDefault
        target={CAMERA_TARGET}
        minDistance={CAMERA_LIMITS.minDistance}
        maxDistance={CAMERA_LIMITS.maxDistance}
        minPolarAngle={CAMERA_LIMITS.minPolarAngle}
        maxPolarAngle={CAMERA_LIMITS.maxPolarAngle}
        enablePan={false}
        enableDamping
        dampingFactor={0.055}
      />
      <CameraRig selectedId={props.selectedId} />

      <AdaptiveDpr />
    </>
  );
}
