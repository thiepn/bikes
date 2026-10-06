"use client";

import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import {
  CatmullRomCurve3,
  Group,
  Mesh,
  Vector3,
} from "three";
import { SemanticPart } from "./SemanticPart";
import { getPartAppearance } from "@/engine/interaction/appearance";
import { getExplosionOffset } from "@/engine/inspection/config";
import {
  ROAD_R1_DEMO_SPROCKET_TEETH,
  getDrivetrainKinematics,
} from "@/engine/learning/drivetrain-math";
import type { DrivetrainDemoState } from "@/engine/learning/types";
import type {
  ViewerInteractionHandlers,
  ViewerInteractionState,
} from "@/engine/interaction/types";

type DrivetrainMotionProps = {
  state: ViewerInteractionState;
  handlers: ViewerInteractionHandlers;
  demo: DrivetrainDemoState;
};

const CHAIN_ID = "bike.road.r1.chain";
const CRANKSET_ID = "bike.road.r1.crankset";
const CASSETTE_ID = "bike.road.r1.cassette";
const DERAILLEUR_ID = "bike.road.r1.rear-derailleur";
const CASSETTE_RADII = [0.035, 0.044, 0.053, 0.062, 0.071];

export function DrivetrainMotion({
  state,
  handlers,
  demo,
}: DrivetrainMotionProps) {
  const phase = useRef(0);
  const crankMarker = useRef<Group>(null);
  const cassetteMarker = useRef<Group>(null);
  const chainDots = useRef<Array<Mesh | null>>([]);

  const stats = getDrivetrainKinematics(
    demo.gearIndex,
    demo.cadenceRpm,
  );
  const chainX = 0.052 + stats.gearIndex * 0.0045;

  const chainCurve = useMemo(
    () =>
      new CatmullRomCurve3(
        [
          new Vector3(chainX, 0.485, -0.1),
          new Vector3(chainX, 0.415, -0.58),
          new Vector3(chainX, 0.30, -0.58),
          new Vector3(chainX, 0.285, -0.1),
        ],
        true,
        "centripetal",
        0.55,
      ),
    [chainX],
  );

  useFrame((_, delta) => {
    if (demo.running) {
      phase.current =
        (phase.current + delta * (demo.cadenceRpm / 60) * 0.23) % 1;

      if (crankMarker.current) {
        crankMarker.current.rotation.x +=
          delta * (demo.cadenceRpm / 60) * Math.PI * 2;
      }

      if (cassetteMarker.current) {
        cassetteMarker.current.rotation.x +=
          delta * (stats.wheelRpm / 60) * Math.PI * 2;
      }
    }

    chainDots.current.forEach((dot, index) => {
      if (!dot) return;
      const t =
        (phase.current + index / chainDots.current.length) % 1;
      dot.position.copy(chainCurve.getPointAt(t));
    });
  });

  const chainMaterial = getPartAppearance(
    "#8d969f",
    CHAIN_ID,
    state,
  );
  const accentVisible =
    demo.running ||
    state.highlightedIds.some((id) =>
      [CRANKSET_ID, CHAIN_ID, CASSETTE_ID, DERAILLEUR_ID].includes(id),
    );
  const selectedRadius =
    CASSETTE_RADII[stats.gearIndex] ??
    CASSETTE_RADII[CASSETTE_RADII.length - 1];

  return (
    <>
      <SemanticPart
        componentId={CHAIN_ID}
        {...state}
        {...handlers}
        position={getExplosionOffset(
          CHAIN_ID,
          state.mode === "exploded" ? state.explosionAmount : 0,
        )}
      >
        <mesh>
          <tubeGeometry
            args={[chainCurve, 96, 0.0032, 6, true]}
          />
          <meshStandardMaterial
            {...chainMaterial}
            metalness={0.78}
            roughness={0.3}
          />
        </mesh>

        {accentVisible &&
          Array.from({ length: 18 }, (_, index) => (
            <mesh
              key={index}
              ref={(mesh) => {
                chainDots.current[index] = mesh;
              }}
            >
              <sphereGeometry args={[0.007, 10, 10]} />
              <meshStandardMaterial
                color="#d9ff67"
                emissive="#26370b"
                emissiveIntensity={1.2}
                roughness={0.28}
              />
            </mesh>
          ))}
      </SemanticPart>

      {accentVisible && (
        <>
          <group
            ref={crankMarker}
            position={[0.052, 0.39, -0.1]}
          >
            <mesh position={[0, 0.055, 0]}>
              <boxGeometry args={[0.011, 0.11, 0.014]} />
              <meshStandardMaterial
                color="#d9ff67"
                emissive="#26370b"
                emissiveIntensity={1.35}
              />
            </mesh>
            <mesh position={[0, -0.055, 0]}>
              <boxGeometry args={[0.011, 0.11, 0.014]} />
              <meshStandardMaterial
                color="#d9ff67"
                emissive="#26370b"
                emissiveIntensity={1.35}
              />
            </mesh>
          </group>

          <group
            ref={cassetteMarker}
            position={[0.072, 0.36, -0.58]}
          >
            <mesh position={[0, selectedRadius, 0]}>
              <boxGeometry args={[0.012, 0.018, 0.009]} />
              <meshStandardMaterial
                color="#d9ff67"
                emissive="#26370b"
                emissiveIntensity={1.35}
              />
            </mesh>
          </group>

          <mesh
            position={[
              0.092,
              0.25 + stats.gearIndex * 0.009,
              -0.515 - stats.gearIndex * 0.006,
            ]}
          >
            <sphereGeometry args={[0.012, 14, 14]} />
            <meshStandardMaterial
              color="#d9ff67"
              emissive="#26370b"
              emissiveIntensity={1.35}
            />
          </mesh>

          <mesh
            position={[
              0.073,
              0.36,
              -0.58,
            ]}
            rotation={[0, Math.PI / 2, 0]}
          >
            <torusGeometry
              args={[selectedRadius, 0.0022, 8, 40]}
            />
            <meshStandardMaterial
              color="#d9ff67"
              emissive="#26370b"
              emissiveIntensity={1.1}
            />
          </mesh>
        </>
      )}
    </>
  );
}
