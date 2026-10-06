"use client";

import { useMemo } from "react";
import {
  DoubleSide,
  Quaternion,
  Vector3,
  type ColorRepresentation,
} from "three";
import { SemanticPart } from "./SemanticPart";
import { getPartAppearance } from "@/engine/interaction/appearance";
import { getExplosionOffset } from "@/engine/inspection/config";
import type {
  ViewerInteractionHandlers,
  ViewerInteractionState,
} from "@/engine/interaction/types";

type Point = [number, number, number];

type Props = ViewerInteractionState & ViewerInteractionHandlers;

function Tube({
  from,
  to,
  radius,
  color,
  part,
  state,
  metalness = 0.55,
  roughness = 0.28,
}: {
  from: Point;
  to: Point;
  radius: number;
  color: ColorRepresentation;
  part: string;
  state: ViewerInteractionState;
  metalness?: number;
  roughness?: number;
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

  return (
    <mesh
      castShadow
      receiveShadow
      position={transform.position}
      quaternion={transform.quaternion}
    >
      <cylinderGeometry args={[radius, radius, transform.length, 20]} />
      <meshStandardMaterial
        {...getPartAppearance(color, part, state)}
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
  const radius = 0.38;
  const prefix = `bike.mtb.m1.${side}`;
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
        center[1] + Math.sin(angle) * (radius - 0.055),
        center[2] + Math.cos(angle) * (radius - 0.055),
      ] as Point,
    ] as const;
  });

  return (
    <group>
      <SemanticPart {...semanticProps(tireId, state, handlers)}>
        <mesh position={center} rotation={[0, Math.PI / 2, 0]} castShadow>
          <torusGeometry args={[radius, 0.041, 18, 96]} />
          <meshStandardMaterial
            {...getPartAppearance("#12171b", tireId, state, [wheelId])}
            metalness={0.04}
            roughness={0.78}
          />
        </mesh>
      </SemanticPart>

      <SemanticPart {...semanticProps(rimId, state, handlers)}>
        <mesh position={center} rotation={[0, Math.PI / 2, 0]} castShadow>
          <torusGeometry args={[radius - 0.052, 0.011, 12, 96]} />
          <meshStandardMaterial
            {...getPartAppearance("#4e5962", rimId, state, [wheelId])}
            metalness={0.68}
            roughness={0.28}
          />
        </mesh>
      </SemanticPart>

      <SemanticPart {...semanticProps(hubId, state, handlers)}>
        <mesh position={center} rotation={[0, 0, Math.PI / 2]} castShadow>
          <cylinderGeometry args={[0.032, 0.032, 0.15, 24]} />
          <meshStandardMaterial
            {...getPartAppearance("#9aa5ae", hubId, state, [wheelId])}
            metalness={0.9}
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
              radius={0.0018}
              color="#858f98"
              part={wheelId}
              state={state}
              metalness={0.9}
              roughness={0.2}
            />
          ))}
        </group>
      </SemanticPart>
    </group>
  );
}

export function MtbPrototypeBike(props: Props) {
  const state: ViewerInteractionState = {
    selectedId: props.selectedId,
    hoveredId: props.hoveredId,
    isolated: props.isolated,
    mode: props.mode,
    explosionAmount: props.explosionAmount,
    highlightedIds: props.highlightedIds,
    removedIds: props.removedIds,
  };
  const handlers: ViewerInteractionHandlers = {
    onSelect: props.onSelect,
    onHover: props.onHover,
    onIsolate: props.onIsolate,
  };

  const rear: Point = [0, 0.39, -0.64];
  const front: Point = [0, 0.39, 0.64];
  const crank: Point = [0, 0.42, -0.12];
  const seatTop: Point = [0, 0.77, -0.25];
  const headTop: Point = [0, 0.76, 0.39];
  const headBottom: Point = [0, 0.58, 0.45];
  const pivot: Point = [0, 0.59, -0.35];
  const frameId = "bike.mtb.m1.frame";
  const frameColor = "#c2f05e";

  return (
    <group rotation={[0, -0.08, 0]}>
      <Wheel side="rear" center={rear} state={state} handlers={handlers} />
      <Wheel side="front" center={front} state={state} handlers={handlers} />

      <SemanticPart {...semanticProps(frameId, state, handlers)}>
        <group>
          <Tube from={crank} to={seatTop} radius={0.032} color={frameColor} part={frameId} state={state} />
          <Tube from={seatTop} to={headTop} radius={0.03} color={frameColor} part={frameId} state={state} />
          <Tube from={crank} to={headBottom} radius={0.036} color={frameColor} part={frameId} state={state} />
          <Tube from={headTop} to={headBottom} radius={0.034} color={frameColor} part={frameId} state={state} />
          <Tube from={rear} to={crank} radius={0.024} color={frameColor} part={frameId} state={state} />
        </group>
      </SemanticPart>

      <SemanticPart {...semanticProps("bike.mtb.m1.suspension-linkage", state, handlers)}>
        <group>
          <Tube from={rear} to={pivot} radius={0.021} color="#83923f" part="bike.mtb.m1.suspension-linkage" state={state} />
          <Tube from={pivot} to={seatTop} radius={0.018} color="#9fb24b" part="bike.mtb.m1.suspension-linkage" state={state} />
          <mesh position={pivot} rotation={[0, 0, Math.PI / 2]}>
            <cylinderGeometry args={[0.038, 0.038, 0.08, 24]} />
            <meshStandardMaterial
              {...getPartAppearance("#909aa3", "bike.mtb.m1.suspension-linkage", state)}
              metalness={0.88}
              roughness={0.2}
            />
          </mesh>
        </group>
      </SemanticPart>

      <SemanticPart {...semanticProps("bike.mtb.m1.rear-shock", state, handlers)}>
        <group>
          <Tube from={[0, 0.68, -0.17]} to={[0, 0.53, -0.34]} radius={0.024} color="#252b31" part="bike.mtb.m1.rear-shock" state={state} metalness={0.75} roughness={0.2} />
          <Tube from={[0, 0.63, -0.23]} to={[0, 0.56, -0.31]} radius={0.014} color="#c6d0d8" part="bike.mtb.m1.rear-shock" state={state} metalness={0.92} roughness={0.12} />
        </group>
      </SemanticPart>

      <SemanticPart {...semanticProps("bike.mtb.m1.fork", state, handlers)}>
        <group>
          <Tube from={[-0.048, 0.6, 0.43]} to={[-0.055, 0.39, 0.64]} radius={0.021} color="#252b31" part="bike.mtb.m1.fork" state={state} />
          <Tube from={[0.048, 0.6, 0.43]} to={[0.055, 0.39, 0.64]} radius={0.021} color="#252b31" part="bike.mtb.m1.fork" state={state} />
          <Tube from={[-0.048, 0.74, 0.4]} to={[-0.048, 0.6, 0.43]} radius={0.014} color="#b9c2c9" part="bike.mtb.m1.fork" state={state} metalness={0.9} roughness={0.13} />
          <Tube from={[0.048, 0.74, 0.4]} to={[0.048, 0.6, 0.43]} radius={0.014} color="#b9c2c9" part="bike.mtb.m1.fork" state={state} metalness={0.9} roughness={0.13} />
        </group>
      </SemanticPart>

      <SemanticPart {...semanticProps("bike.mtb.m1.headset", state, handlers)}>
        <mesh position={[0, 0.68, 0.42]} rotation={[Math.PI / 2, 0, 0]}>
          <torusGeometry args={[0.038, 0.008, 12, 40]} />
          <meshStandardMaterial {...getPartAppearance("#89949d", "bike.mtb.m1.headset", state)} metalness={0.85} roughness={0.2} />
        </mesh>
      </SemanticPart>

      <SemanticPart {...semanticProps("bike.mtb.m1.stem", state, handlers)}>
        <Tube from={headTop} to={[0, 0.87, 0.42]} radius={0.016} color="#9ca6ae" part="bike.mtb.m1.stem" state={state} metalness={0.86} />
      </SemanticPart>

      <SemanticPart {...semanticProps("bike.mtb.m1.handlebar", state, handlers)}>
        <Tube from={[-0.36, 0.88, 0.43]} to={[0.36, 0.88, 0.43]} radius={0.012} color="#22282e" part="bike.mtb.m1.handlebar" state={state} metalness={0.42} roughness={0.35} />
      </SemanticPart>

      <SemanticPart {...semanticProps("bike.mtb.m1.dropper-post", state, handlers)}>
        <Tube from={seatTop} to={[0, 0.89, -0.28]} radius={0.016} color="#303840" part="bike.mtb.m1.dropper-post" state={state} metalness={0.78} />
      </SemanticPart>

      <SemanticPart {...semanticProps("bike.mtb.m1.saddle", state, handlers)}>
        <mesh castShadow position={[0, 0.905, -0.29]}>
          <boxGeometry args={[0.13, 0.038, 0.25]} />
          <meshStandardMaterial {...getPartAppearance("#171c21", "bike.mtb.m1.saddle", state)} roughness={0.6} />
        </mesh>
      </SemanticPart>

      <SemanticPart {...semanticProps("bike.mtb.m1.crankset", state, handlers)}>
        <mesh position={crank} rotation={[0, 0, Math.PI / 2]}>
          <cylinderGeometry args={[0.085, 0.085, 0.024, 40]} />
          <meshStandardMaterial {...getPartAppearance("#252b31", "bike.mtb.m1.crankset", state)} metalness={0.88} roughness={0.2} />
        </mesh>
      </SemanticPart>

      <SemanticPart {...semanticProps("bike.mtb.m1.chainring", state, handlers)}>
        <mesh position={[0.025, crank[1], crank[2]]} rotation={[0, Math.PI / 2, 0]}>
          <torusGeometry args={[0.087, 0.005, 8, 44]} />
          <meshStandardMaterial {...getPartAppearance("#a9b3bb", "bike.mtb.m1.chainring", state)} metalness={0.92} roughness={0.18} />
        </mesh>
      </SemanticPart>

      <SemanticPart {...semanticProps("bike.mtb.m1.chain", state, handlers)}>
        <group>
          <Tube from={[0.045, 0.49, -0.12]} to={[0.045, 0.48, -0.64]} radius={0.0035} color="#8d969f" part="bike.mtb.m1.chain" state={state} metalness={0.85} />
          <Tube from={[0.045, 0.34, -0.64]} to={[0.045, 0.34, -0.12]} radius={0.0035} color="#8d969f" part="bike.mtb.m1.chain" state={state} metalness={0.85} />
        </group>
      </SemanticPart>

      <SemanticPart {...semanticProps("bike.mtb.m1.cassette", state, handlers)}>
        <group position={[0.05, rear[1], rear[2]]} rotation={[0, Math.PI / 2, 0]}>
          {[0.038,0.048,0.059,0.071,0.084,0.098].map((radius,index) => (
            <mesh key={radius} position={[0,0,index * 0.006 - 0.015]}>
              <torusGeometry args={[radius,0.004,8,36]} />
              <meshStandardMaterial {...getPartAppearance("#9fa9b1", "bike.mtb.m1.cassette", state)} metalness={0.94} roughness={0.18} />
            </mesh>
          ))}
        </group>
      </SemanticPart>

      <SemanticPart {...semanticProps("bike.mtb.m1.rear-derailleur", state, handlers)}>
        <group position={[0.078, 0.27, -0.59]}>
          <mesh rotation={[0.22,0,0.15]} castShadow>
            <boxGeometry args={[0.06,0.13,0.04]} />
            <meshStandardMaterial {...getPartAppearance("#293038", "bike.mtb.m1.rear-derailleur", state)} metalness={0.72} roughness={0.28} />
          </mesh>
          <mesh position={[0,-0.09,0]} rotation={[Math.PI / 2,0,0]}>
            <torusGeometry args={[0.03,0.006,10,32]} />
            <meshStandardMaterial {...getPartAppearance("#86919a", "bike.mtb.m1.rear-derailleur", state)} metalness={0.9} roughness={0.2} />
          </mesh>
        </group>
      </SemanticPart>

      {(["left","right"] as const).map((side) => {
        const id = `bike.mtb.m1.${side}-pedal`;
        return (
          <SemanticPart key={id} {...semanticProps(id, state, handlers)}>
            <mesh position={[side === "left" ? -0.16 : 0.16, crank[1], crank[2]]}>
              <boxGeometry args={[0.08,0.018,0.11]} />
              <meshStandardMaterial {...getPartAppearance("#171c21", id, state)} metalness={0.52} roughness={0.42} />
            </mesh>
          </SemanticPart>
        );
      })}

      {(["front","rear"] as const).map((side) => {
        const center = side === "front" ? front : rear;
        const rotorId = `bike.mtb.m1.${side}-rotor`;
        const caliperId = `bike.mtb.m1.${side}-caliper`;
        const axleId = `bike.mtb.m1.${side}-thru-axle`;
        return (
          <group key={side}>
            <SemanticPart {...semanticProps(rotorId, state, handlers)}>
              <mesh position={[0.075,center[1],center[2]]} rotation={[0,Math.PI/2,0]}>
                <circleGeometry args={[side === "front" ? 0.125 : 0.112,48]} />
                <meshStandardMaterial {...getPartAppearance("#929ca5", rotorId, state)} metalness={0.93} roughness={0.2} side={DoubleSide} />
              </mesh>
            </SemanticPart>
            <SemanticPart {...semanticProps(caliperId, state, handlers)}>
              <mesh position={[0.095,0.49,side === "front" ? 0.59 : -0.59]} rotation={[0.1,0,0.12]}>
                <boxGeometry args={[0.06,0.085,0.045]} />
                <meshStandardMaterial {...getPartAppearance("#303840", caliperId, state)} metalness={0.74} roughness={0.26} />
              </mesh>
            </SemanticPart>
            <SemanticPart {...semanticProps(axleId, state, handlers)}>
              <mesh position={center} rotation={[0,0,Math.PI/2]}>
                <cylinderGeometry args={[0.01,0.01,0.21,20]} />
                <meshStandardMaterial {...getPartAppearance("#7e8992", axleId, state)} metalness={0.9} roughness={0.18} />
              </mesh>
            </SemanticPart>
          </group>
        );
      })}
    </group>
  );
}
