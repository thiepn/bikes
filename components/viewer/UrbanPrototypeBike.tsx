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
  metalness = 0.6,
  roughness = 0.3,
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
      <cylinderGeometry args={[radius, radius, transform.length, 18]} />
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
  const radius = 0.36;
  const prefix = `bike.urban.u1.${side}`;
  const wheelId = `${prefix}-wheel`;
  const tireId = `${prefix}-tire`;
  const rimId = `${prefix}-rim`;
  const hubId =
    side === "front"
      ? "bike.urban.u1.front-hub"
      : "bike.urban.u1.rear-hub";

  const spokes = Array.from({ length: 18 }, (_, index) => {
    const angle = (index / 18) * Math.PI * 2;
    return [
      center,
      [
        center[0],
        center[1] + Math.sin(angle) * (radius - 0.05),
        center[2] + Math.cos(angle) * (radius - 0.05),
      ] as Point,
    ] as const;
  });

  return (
    <group>
      <SemanticPart {...semanticProps(tireId, state, handlers)}>
        <mesh position={center} rotation={[0, Math.PI / 2, 0]} castShadow>
          <torusGeometry args={[radius, 0.029, 16, 88]} />
          <meshStandardMaterial
            {...getPartAppearance("#20262a", tireId, state, [wheelId])}
            metalness={0.03}
            roughness={0.74}
          />
        </mesh>
      </SemanticPart>

      <SemanticPart {...semanticProps(rimId, state, handlers)}>
        <mesh position={center} rotation={[0, Math.PI / 2, 0]} castShadow>
          <torusGeometry args={[radius - 0.041, 0.009, 10, 88]} />
          <meshStandardMaterial
            {...getPartAppearance("#b2bac0", rimId, state, [wheelId])}
            metalness={0.86}
            roughness={0.19}
          />
        </mesh>
      </SemanticPart>

      <SemanticPart {...semanticProps(hubId, state, handlers)}>
        <mesh position={center} rotation={[0, 0, Math.PI / 2]} castShadow>
          <cylinderGeometry
            args={[
              side === "rear" ? 0.052 : 0.025,
              side === "rear" ? 0.052 : 0.025,
              side === "rear" ? 0.14 : 0.11,
              24,
            ]}
          />
          <meshStandardMaterial
            {...getPartAppearance("#8d979f", hubId, state, [wheelId])}
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
              radius={0.0016}
              color="#929aa0"
              part={wheelId}
              state={state}
              metalness={0.92}
              roughness={0.18}
            />
          ))}
        </group>
      </SemanticPart>
    </group>
  );
}

export function UrbanPrototypeBike(props: Props) {
  const state: ViewerInteractionState = {
    selectedId: props.selectedId,
    hoveredId: props.hoveredId,
    isolated: props.isolated,
    mode: props.mode,
    explosionAmount: props.explosionAmount,
    highlightedIds: props.highlightedIds,
    removedIds: props.removedIds,
    ghost: props.ghost,
  };
  const handlers: ViewerInteractionHandlers = {
    onSelect: props.onSelect,
    onHover: props.onHover,
    onIsolate: props.onIsolate,
  };

  const rear: Point = [0, 0.37, -0.62];
  const front: Point = [0, 0.37, 0.62];
  const crank: Point = [0, 0.4, -0.1];
  const seatTop: Point = [0, 0.72, -0.27];
  const headTop: Point = [0, 0.75, 0.38];
  const headBottom: Point = [0, 0.57, 0.43];
  const frameId = "bike.urban.u1.frame";
  const frameColor = "#4f7773";

  return (
    <group rotation={[0, -0.07, 0]}>
      <Wheel side="rear" center={rear} state={state} handlers={handlers} />
      <Wheel side="front" center={front} state={state} handlers={handlers} />

      <SemanticPart {...semanticProps(frameId, state, handlers)}>
        <group>
          <Tube from={crank} to={seatTop} radius={0.03} color={frameColor} part={frameId} state={state} />
          <Tube from={rear} to={crank} radius={0.022} color={frameColor} part={frameId} state={state} />
          <Tube from={rear} to={seatTop} radius={0.018} color={frameColor} part={frameId} state={state} />
          <Tube from={crank} to={headBottom} radius={0.035} color={frameColor} part={frameId} state={state} />
          <Tube from={[0,0.54,-0.2]} to={headTop} radius={0.025} color={frameColor} part={frameId} state={state} />
          <Tube from={headTop} to={headBottom} radius={0.032} color={frameColor} part={frameId} state={state} />
        </group>
      </SemanticPart>

      <SemanticPart {...semanticProps("bike.urban.u1.fork", state, handlers)}>
        <group>
          <Tube from={[-0.037,0.59,0.42]} to={[-0.045,0.37,0.62]} radius={0.015} color={frameColor} part="bike.urban.u1.fork" state={state} />
          <Tube from={[0.037,0.59,0.42]} to={[0.045,0.37,0.62]} radius={0.015} color={frameColor} part="bike.urban.u1.fork" state={state} />
        </group>
      </SemanticPart>

      <SemanticPart {...semanticProps("bike.urban.u1.headset", state, handlers)}>
        <mesh position={[0,0.67,0.4]} rotation={[Math.PI/2,0,0]}>
          <torusGeometry args={[0.036,0.007,10,36]} />
          <meshStandardMaterial {...getPartAppearance("#858f96","bike.urban.u1.headset",state)} metalness={0.88} roughness={0.2} />
        </mesh>
      </SemanticPart>

      <SemanticPart {...semanticProps("bike.urban.u1.stem", state, handlers)}>
        <Tube from={headTop} to={[0,0.96,0.37]} radius={0.015} color="#a7afb5" part="bike.urban.u1.stem" state={state} metalness={0.88} />
      </SemanticPart>

      <SemanticPart {...semanticProps("bike.urban.u1.handlebar", state, handlers)}>
        <group>
          <Tube from={[0,0.96,0.37]} to={[-0.22,0.99,0.31]} radius={0.011} color="#30373c" part="bike.urban.u1.handlebar" state={state} />
          <Tube from={[0,0.96,0.37]} to={[0.22,0.99,0.31]} radius={0.011} color="#30373c" part="bike.urban.u1.handlebar" state={state} />
          <Tube from={[-0.22,0.99,0.31]} to={[-0.32,0.99,0.25]} radius={0.011} color="#30373c" part="bike.urban.u1.handlebar" state={state} />
          <Tube from={[0.22,0.99,0.31]} to={[0.32,0.99,0.25]} radius={0.011} color="#30373c" part="bike.urban.u1.handlebar" state={state} />
        </group>
      </SemanticPart>

      {([
        ["left-grip",[-0.34,0.99,0.24]],
        ["right-grip",[0.34,0.99,0.24]],
      ] as const).map(([slug,position]) => {
        const id=`bike.urban.u1.${slug}`;
        return (
          <SemanticPart key={id} {...semanticProps(id,state,handlers)}>
            <mesh position={position as Point} rotation={[0,0,Math.PI/2]}>
              <cylinderGeometry args={[0.017,0.017,0.12,16]} />
              <meshStandardMaterial {...getPartAppearance("#383f43",id,state)} roughness={0.72} />
            </mesh>
          </SemanticPart>
        );
      })}

      <SemanticPart {...semanticProps("bike.urban.u1.saddle", state, handlers)}>
        <mesh position={[0,0.9,-0.29]} castShadow>
          <boxGeometry args={[0.16,0.045,0.27]} />
          <meshStandardMaterial {...getPartAppearance("#342b25","bike.urban.u1.saddle",state)} roughness={0.62} />
        </mesh>
      </SemanticPart>

      <SemanticPart {...semanticProps("bike.urban.u1.seatpost", state, handlers)}>
        <Tube from={seatTop} to={[0,0.88,-0.285]} radius={0.014} color="#8e989f" part="bike.urban.u1.seatpost" state={state} metalness={0.86} />
      </SemanticPart>

      <SemanticPart {...semanticProps("bike.urban.u1.crankset", state, handlers)}>
        <mesh position={crank} rotation={[0,0,Math.PI/2]}>
          <cylinderGeometry args={[0.075,0.075,0.028,36]} />
          <meshStandardMaterial {...getPartAppearance("#30373c","bike.urban.u1.crankset",state)} metalness={0.82} roughness={0.25} />
        </mesh>
      </SemanticPart>

      <SemanticPart {...semanticProps("bike.urban.u1.chainring", state, handlers)}>
        <mesh position={[0.025,crank[1],crank[2]]} rotation={[0,Math.PI/2,0]}>
          <torusGeometry args={[0.079,0.005,8,40]} />
          <meshStandardMaterial {...getPartAppearance("#8d969c","bike.urban.u1.chainring",state)} metalness={0.9} roughness={0.2} />
        </mesh>
      </SemanticPart>

      <SemanticPart {...semanticProps("bike.urban.u1.chain", state, handlers)}>
        <group>
          <Tube from={[0.04,0.47,-0.1]} to={[0.04,0.42,-0.62]} radius={0.0032} color="#777f85" part="bike.urban.u1.chain" state={state} />
          <Tube from={[0.04,0.34,-0.62]} to={[0.04,0.33,-0.1]} radius={0.0032} color="#777f85" part="bike.urban.u1.chain" state={state} />
        </group>
      </SemanticPart>

      <SemanticPart {...semanticProps("bike.urban.u1.rear-sprocket", state, handlers)}>
        <mesh position={[0.055,rear[1],rear[2]]} rotation={[0,Math.PI/2,0]}>
          <torusGeometry args={[0.055,0.005,8,34]} />
          <meshStandardMaterial {...getPartAppearance("#8b949a","bike.urban.u1.rear-sprocket",state)} metalness={0.92} roughness={0.19} />
        </mesh>
      </SemanticPart>

      <SemanticPart {...semanticProps("bike.urban.u1.chain-guard", state, handlers)}>
        <group>
          <mesh position={[0.078,0.4,-0.33]} castShadow>
            <boxGeometry args={[0.03,0.13,0.57]} />
            <meshStandardMaterial {...getPartAppearance("#263133","bike.urban.u1.chain-guard",state)} metalness={0.32} roughness={0.45} />
          </mesh>
          <mesh position={[0.078,0.4,-0.1]} rotation={[0,Math.PI/2,0]}>
            <torusGeometry args={[0.105,0.025,12,48]} />
            <meshStandardMaterial {...getPartAppearance("#263133","bike.urban.u1.chain-guard",state)} metalness={0.32} roughness={0.45} />
          </mesh>
        </group>
      </SemanticPart>

      <SemanticPart {...semanticProps("bike.urban.u1.rear-rack", state, handlers)}>
        <group>
          <mesh position={[0,0.79,-0.62]}>
            <boxGeometry args={[0.32,0.025,0.5]} />
            <meshStandardMaterial {...getPartAppearance("#4f595e","bike.urban.u1.rear-rack",state)} metalness={0.78} roughness={0.28} />
          </mesh>
          <Tube from={[-0.11,0.78,-0.45]} to={[-0.06,0.43,-0.62]} radius={0.006} color="#697279" part="bike.urban.u1.rear-rack" state={state} />
          <Tube from={[0.11,0.78,-0.45]} to={[0.06,0.43,-0.62]} radius={0.006} color="#697279" part="bike.urban.u1.rear-rack" state={state} />
        </group>
      </SemanticPart>

      {([
        ["front-fender",front,0],
        ["rear-fender",rear,0],
      ] as const).map(([slug,center]) => {
        const id=`bike.urban.u1.${slug}`;
        return (
          <SemanticPart key={id} {...semanticProps(id,state,handlers)}>
            <mesh
              position={center as Point}
              rotation={[0,Math.PI/2,Math.PI*0.22]}
            >
              <torusGeometry args={[0.395,0.009,10,64,Math.PI*1.08]} />
              <meshStandardMaterial {...getPartAppearance("#727c82",id,state)} metalness={0.78} roughness={0.26} />
            </mesh>
          </SemanticPart>
        );
      })}

      <SemanticPart {...semanticProps("bike.urban.u1.front-light", state, handlers)}>
        <mesh position={[0,0.72,0.52]} castShadow>
          <boxGeometry args={[0.09,0.07,0.07]} />
          <meshStandardMaterial {...getPartAppearance("#e8e0b0","bike.urban.u1.front-light",state)} emissive="#d8c778" emissiveIntensity={0.35} roughness={0.3} />
        </mesh>
      </SemanticPart>

      <SemanticPart {...semanticProps("bike.urban.u1.rear-light", state, handlers)}>
        <mesh position={[0,0.79,-0.91]} castShadow>
          <boxGeometry args={[0.12,0.045,0.04]} />
          <meshStandardMaterial {...getPartAppearance("#bd4e45","bike.urban.u1.rear-light",state)} emissive="#7e1818" emissiveIntensity={0.4} roughness={0.32} />
        </mesh>
      </SemanticPart>

      <SemanticPart {...semanticProps("bike.urban.u1.kickstand", state, handlers)}>
        <Tube from={[-0.055,0.38,-0.25]} to={[-0.19,0.06,-0.42]} radius={0.008} color="#555e63" part="bike.urban.u1.kickstand" state={state} metalness={0.84} />
      </SemanticPart>

      <SemanticPart {...semanticProps("bike.urban.u1.frame-lock", state, handlers)}>
        <mesh position={[0,0.55,-0.54]} rotation={[0,Math.PI/2,0]}>
          <torusGeometry args={[0.09,0.018,12,42,Math.PI*1.55]} />
          <meshStandardMaterial {...getPartAppearance("#30363a","bike.urban.u1.frame-lock",state)} metalness={0.7} roughness={0.35} />
        </mesh>
      </SemanticPart>

      <SemanticPart {...semanticProps("bike.urban.u1.bell", state, handlers)}>
        <mesh position={[-0.2,1.02,0.28]}>
          <sphereGeometry args={[0.025,16,12,0,Math.PI*2,0,Math.PI/2]} />
          <meshStandardMaterial {...getPartAppearance("#aeb8be","bike.urban.u1.bell",state)} metalness={0.9} roughness={0.18} side={DoubleSide} />
        </mesh>
      </SemanticPart>

      {(["left-pedal","right-pedal"] as const).map((slug) => {
        const id=`bike.urban.u1.${slug}`;
        const x=slug==="left-pedal"?-0.16:0.16;
        return (
          <SemanticPart key={id} {...semanticProps(id,state,handlers)}>
            <mesh position={[x,crank[1],crank[2]]}>
              <boxGeometry args={[0.075,0.02,0.095]} />
              <meshStandardMaterial {...getPartAppearance("#343b3f",id,state)} metalness={0.3} roughness={0.5} />
            </mesh>
          </SemanticPart>
        );
      })}

      {(["front","rear"] as const).map((side) => {
        const center=side==="front"?front:rear;
        const rotorId=`bike.urban.u1.${side}-rotor`;
        const caliperId=`bike.urban.u1.${side}-caliper`;
        const axleId=`bike.urban.u1.${side}-axle`;
        return (
          <group key={side}>
            <SemanticPart {...semanticProps(rotorId,state,handlers)}>
              <mesh position={[0.07,center[1],center[2]]} rotation={[0,Math.PI/2,0]}>
                <circleGeometry args={[0.09,40]} />
                <meshStandardMaterial {...getPartAppearance("#9aa3a9",rotorId,state)} metalness={0.93} roughness={0.19} side={DoubleSide} />
              </mesh>
            </SemanticPart>
            <SemanticPart {...semanticProps(caliperId,state,handlers)}>
              <mesh position={[0.09,0.47,side==="front"?0.59:-0.59]}>
                <boxGeometry args={[0.05,0.07,0.04]} />
                <meshStandardMaterial {...getPartAppearance("#30373c",caliperId,state)} metalness={0.72} roughness={0.27} />
              </mesh>
            </SemanticPart>
            <SemanticPart {...semanticProps(axleId,state,handlers)}>
              <mesh position={center} rotation={[0,0,Math.PI/2]}>
                <cylinderGeometry args={[0.008,0.008,0.17,18]} />
                <meshStandardMaterial {...getPartAppearance("#7f898f",axleId,state)} metalness={0.9} roughness={0.18} />
              </mesh>
            </SemanticPart>
          </group>
        );
      })}
    </group>
  );
}
