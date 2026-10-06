"use client";

import { useMemo } from "react";
import {
  DoubleSide,
  Quaternion,
  Vector3,
  type ColorRepresentation,
} from "three";
import { SemanticPart } from "./SemanticPart";
import { DrivetrainMotion } from "./DrivetrainMotion";
import { getPartAppearance } from "@/engine/interaction/appearance";
import type { DrivetrainDemoState } from "@/engine/learning/types";
import {
  getExplosionOffset,
  getSystemColor,
  isXrayShell,
} from "@/engine/inspection/config";
import type {
  ViewerInteractionHandlers,
  ViewerInteractionState,
} from "@/engine/interaction/types";

type Point = [number, number, number];
type PrototypeBikeProps = ViewerInteractionState &
  ViewerInteractionHandlers & {
    drivetrainDemo: DrivetrainDemoState;
  };

function Tube({
  from,
  to,
  radius,
  color,
  metalness = 0.55,
  roughness = 0.24,
  part,
  state,
}: {
  from: Point;
  to: Point;
  radius: number;
  color: ColorRepresentation;
  metalness?: number;
  roughness?: number;
  part: string;
  state: ViewerInteractionState;
}) {
  const transform = useMemo(() => {
    const start = new Vector3(...from);
    const end = new Vector3(...to);
    const direction = end.clone().sub(start);

    return {
      position: start.clone().add(end).multiplyScalar(0.5),
      quaternion: new Quaternion().setFromUnitVectors(
        new Vector3(0, 1, 0),
        direction.clone().normalize(),
      ),
      length: direction.length(),
    };
  }, [from, to]);

  const material = getPartAppearance(color, part, state);

  return (
    <mesh
      castShadow
      receiveShadow
      position={transform.position}
      quaternion={transform.quaternion}
    >
      <cylinderGeometry args={[radius, radius, transform.length, 20]} />
      <meshStandardMaterial
        {...material}
        metalness={metalness}
        roughness={roughness}
      />
    </mesh>
  );
}

function semanticProps(
  componentId: string,
  state: ViewerInteractionState,
  handlers: ViewerInteractionHandlers,
) {
  return {
    componentId,
    ...state,
    ...handlers,
    position: getExplosionOffset(
      componentId,
      state.mode === "exploded" ? state.explosionAmount : 0,
    ),
  };
}

function Wheel({
  side,
  center,
  state,
  handlers,
}: {
  side: "front" | "rear";
  center: Point;
  state: ViewerInteractionState;
  handlers: ViewerInteractionHandlers;
}) {
  const radius = 0.35;
  const prefix = `bike.road.r1.${side}`;
  const wheelId = `${prefix}-wheel`;
  const tireId = `${prefix}-tire`;
  const rimId = `${prefix}-rim`;
  const hubId = `${prefix}-hub`;

  const spokes = Array.from({ length: 16 }, (_, index) => {
    const angle = (index / 16) * Math.PI * 2;
    return [
      center,
      [
        center[0],
        center[1] + Math.sin(angle) * (radius - 0.045),
        center[2] + Math.cos(angle) * (radius - 0.045),
      ] as Point,
    ] as const;
  });

  const tireMaterial = getPartAppearance("#12171d", tireId, state, [wheelId]);
  const rimMaterial = getPartAppearance("#59636e", rimId, state, [wheelId]);
  const hubMaterial = getPartAppearance("#aeb7c1", hubId, state, [wheelId]);

  return (
    <group>
      <SemanticPart {...semanticProps(tireId, state, handlers)}>
        <mesh
          castShadow
          receiveShadow
          position={center}
          rotation={[0, Math.PI / 2, 0]}
        >
          <torusGeometry args={[radius, 0.026, 16, 96]} />
          <meshStandardMaterial
            {...tireMaterial}
            metalness={0.05}
            roughness={0.72}
          />
        </mesh>
      </SemanticPart>

      <SemanticPart {...semanticProps(rimId, state, handlers)}>
        <mesh
          castShadow
          receiveShadow
          position={center}
          rotation={[0, Math.PI / 2, 0]}
        >
          <torusGeometry args={[radius - 0.036, 0.009, 12, 96]} />
          <meshStandardMaterial
            {...rimMaterial}
            metalness={0.62}
            roughness={0.24}
          />
        </mesh>
      </SemanticPart>

      <SemanticPart {...semanticProps(hubId, state, handlers)}>
        <mesh position={center} rotation={[0, 0, Math.PI / 2]} castShadow>
          <cylinderGeometry args={[0.026, 0.026, 0.12, 24]} />
          <meshStandardMaterial
            {...hubMaterial}
            metalness={0.88}
            roughness={0.2}
          />
        </mesh>
      </SemanticPart>

      <SemanticPart {...semanticProps(wheelId, state, handlers)}>
        <group>
          {spokes.map(([from, to], index) => (
            <Tube
              key={index}
              from={from}
              to={to}
              radius={0.0017}
              color="#9099a3"
              metalness={0.9}
              roughness={0.2}
              part={wheelId}
              state={state}
            />
          ))}
        </group>
      </SemanticPart>
    </group>
  );
}

export function PrototypeBike(props: PrototypeBikeProps) {
  const state: ViewerInteractionState = {
    selectedId: props.selectedId,
    hoveredId: props.hoveredId,
    isolated: props.isolated,
    mode: props.mode,
    explosionAmount: props.explosionAmount,
    highlightedIds: props.highlightedIds,
  };
  const handlers: ViewerInteractionHandlers = {
    onSelect: props.onSelect,
    onHover: props.onHover,
    onIsolate: props.onIsolate,
  };

  const rear: Point = [0, 0.36, -0.58];
  const front: Point = [0, 0.36, 0.58];
  const crank: Point = [0, 0.39, -0.1];
  const seatTop: Point = [0, 0.79, -0.22];
  const headTop: Point = [0, 0.76, 0.34];
  const headBottom: Point = [0, 0.59, 0.39];
  const frameColor = "#b6e64f";
  const frameId = "bike.road.r1.frame";
  const forkId = "bike.road.r1.fork";
  const frameTubes: Array<[Point, Point, number]> = [
    [rear, crank, 0.022],
    [rear, seatTop, 0.019],
    [crank, seatTop, 0.026],
    [seatTop, headTop, 0.025],
    [crank, headBottom, 0.031],
    [headTop, headBottom, 0.031],
  ];

  return (
    <group rotation={[0, -0.09, 0]}>
      <Wheel side="rear" center={rear} state={state} handlers={handlers} />
      <Wheel side="front" center={front} state={state} handlers={handlers} />

      <SemanticPart {...semanticProps(frameId, state, handlers)}>
        <group>
          {frameTubes.map(([from, to, radius], index) => (
            <Tube
              key={index}
              from={from}
              to={to}
              radius={radius}
              color={frameColor}
              metalness={0.46}
              roughness={0.22}
              part={frameId}
              state={state}
            />
          ))}
        </group>
      </SemanticPart>

      <SemanticPart {...semanticProps(forkId, state, handlers)}>
        <group>
          <Tube
            from={[-0.038, 0.59, 0.39]}
            to={[-0.048, 0.36, 0.58]}
            radius={0.013}
            color={frameColor}
            part={forkId}
            state={state}
          />
          <Tube
            from={[0.038, 0.59, 0.39]}
            to={[0.048, 0.36, 0.58]}
            radius={0.013}
            color={frameColor}
            part={forkId}
            state={state}
          />
        </group>
      </SemanticPart>

      <SemanticPart
        {...semanticProps("bike.road.r1.seatpost", state, handlers)}
      >
        <Tube
          from={[0, 0.79, -0.22]}
          to={[0, 0.86, -0.235]}
          radius={0.013}
          color="#313943"
          metalness={0.42}
          roughness={0.3}
          part="bike.road.r1.seatpost"
          state={state}
        />
      </SemanticPart>

      <SemanticPart {...semanticProps("bike.road.r1.stem", state, handlers)}>
        <Tube
          from={[0, 0.76, 0.34]}
          to={[0, 0.89, 0.39]}
          radius={0.014}
          color="#abb4be"
          metalness={0.88}
          part="bike.road.r1.stem"
          state={state}
        />
      </SemanticPart>

      <SemanticPart
        {...semanticProps("bike.road.r1.handlebar", state, handlers)}
      >
        <Tube
          from={[-0.23, 0.9, 0.405]}
          to={[0.23, 0.9, 0.405]}
          radius={0.011}
          color="#20262d"
          metalness={0.2}
          roughness={0.5}
          part="bike.road.r1.handlebar"
          state={state}
        />
      </SemanticPart>

      <SemanticPart {...semanticProps("bike.road.r1.saddle", state, handlers)}>
        <mesh castShadow position={[0, 0.875, -0.25]} rotation={[0.03, 0, 0]}>
          <boxGeometry args={[0.115, 0.035, 0.25]} />
          <meshStandardMaterial
            {...getPartAppearance("#151a20", "bike.road.r1.saddle", state)}
            roughness={0.58}
          />
        </mesh>
      </SemanticPart>

      <SemanticPart
        {...semanticProps("bike.road.r1.crankset", state, handlers)}
      >
        <mesh castShadow position={crank} rotation={[0, 0, Math.PI / 2]}>
          <cylinderGeometry args={[0.09, 0.09, 0.022, 40]} />
          <meshStandardMaterial
            {...getPartAppearance("#20262d", "bike.road.r1.crankset", state)}
            metalness={0.9}
            roughness={0.2}
          />
        </mesh>
      </SemanticPart>

      <SemanticPart
        {...semanticProps("bike.road.r1.left-pedal", state, handlers)}
      >
        <mesh position={[-0.15, 0.39, -0.1]}>
          <boxGeometry args={[0.07, 0.018, 0.105]} />
          <meshStandardMaterial
            {...getPartAppearance("#151a20", "bike.road.r1.left-pedal", state)}
            roughness={0.58}
          />
        </mesh>
      </SemanticPart>

      <SemanticPart
        {...semanticProps("bike.road.r1.right-pedal", state, handlers)}
      >
        <mesh position={[0.15, 0.39, -0.1]}>
          <boxGeometry args={[0.07, 0.018, 0.105]} />
          <meshStandardMaterial
            {...getPartAppearance("#151a20", "bike.road.r1.right-pedal", state)}
            roughness={0.58}
          />
        </mesh>
      </SemanticPart>

      <SemanticPart
        {...semanticProps("bike.road.r1.large-chainring", state, handlers)}
      >
        <mesh position={[0.02, 0.39, -0.1]} rotation={[0, Math.PI / 2, 0]}>
          <torusGeometry args={[0.102, 0.005, 8, 48]} />
          <meshStandardMaterial
            {...getPartAppearance("#aeb8c1", "bike.road.r1.large-chainring", state)}
            metalness={0.92}
            roughness={0.16}
          />
        </mesh>
      </SemanticPart>

      <SemanticPart
        {...semanticProps("bike.road.r1.cassette", state, handlers)}
      >
        <group
          position={[0.045, 0.36, -0.58]}
          rotation={[0, Math.PI / 2, 0]}
        >
          {[0.035, 0.044, 0.053, 0.062, 0.071].map((radius, index) => (
            <mesh key={radius} position={[0, 0, index * 0.006 - 0.012]}>
              <torusGeometry args={[radius, 0.004, 8, 36]} />
              <meshStandardMaterial
                {...getPartAppearance("#a7b0b9", "bike.road.r1.cassette", state)}
                metalness={0.94}
                roughness={0.18}
              />
            </mesh>
          ))}
        </group>
      </SemanticPart>

      <SemanticPart
        {...semanticProps("bike.road.r1.rear-derailleur", state, handlers)}
      >
        <group position={[0.075, 0.27, -0.53]}>
          <mesh rotation={[0.2, 0, 0.15]} castShadow>
            <boxGeometry args={[0.055, 0.12, 0.035]} />
            <meshStandardMaterial
              {...getPartAppearance(
                "#2a3138",
                "bike.road.r1.rear-derailleur",
                state,
              )}
              metalness={0.7}
              roughness={0.28}
            />
          </mesh>
          <mesh
            position={[0, -0.085, 0]}
            rotation={[Math.PI / 2, 0, 0]}
          >
            <torusGeometry args={[0.027, 0.006, 10, 32]} />
            <meshStandardMaterial
              {...getPartAppearance(
                "#88929c",
                "bike.road.r1.rear-derailleur",
                state,
              )}
              metalness={0.9}
              roughness={0.2}
            />
          </mesh>
        </group>
      </SemanticPart>

      <DrivetrainMotion
        state={state}
        handlers={handlers}
        demo={props.drivetrainDemo}
      />

      {(["front", "rear"] as const).map((side) => {
        const position = side === "front" ? front : rear;
        const id = `bike.road.r1.${side}-rotor`;

        return (
          <SemanticPart key={id} {...semanticProps(id, state, handlers)}>
            <mesh
              position={[0.065, position[1], position[2]]}
              rotation={[0, Math.PI / 2, 0]}
            >
              <circleGeometry args={[0.105, 48]} />
              <meshStandardMaterial
                {...getPartAppearance("#939da6", id, state)}
                metalness={0.92}
                roughness={0.2}
                side={DoubleSide}
              />
            </mesh>
          </SemanticPart>
        );
      })}
    </group>
  );
}
