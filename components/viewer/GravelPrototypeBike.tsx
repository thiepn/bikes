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
    <mesh castShadow receiveShadow position={transform.position} quaternion={transform.quaternion}>
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
  const radius = 0.355;
  const prefix = `bike.gravel.g1.${side}`;
  const wheelId = `${prefix}-wheel`;
  const tireId = `${prefix}-tire`;
  const rimId = `${prefix}-rim`;
  const hubId = `${prefix}-hub`;

  const spokes = Array.from({ length: 18 }, (_, index) => {
    const angle = (index / 18) * Math.PI * 2;
    return [
      center,
      [
        center[0],
        center[1] + Math.sin(angle) * (radius - 0.052),
        center[2] + Math.cos(angle) * (radius - 0.052),
      ] as Point,
    ] as const;
  });

  return (
    <group>
      <SemanticPart {...semanticProps(tireId, state, handlers)}>
        <mesh position={center} rotation={[0, Math.PI / 2, 0]} castShadow>
          <torusGeometry args={[radius, 0.036, 16, 96]} />
          <meshStandardMaterial
            {...getPartAppearance("#22272b", tireId, state, [wheelId])}
            metalness={0.03}
            roughness={0.78}
          />
        </mesh>
      </SemanticPart>

      <SemanticPart {...semanticProps(rimId, state, handlers)}>
        <mesh position={center} rotation={[0, Math.PI / 2, 0]} castShadow>
          <torusGeometry args={[radius - 0.048, 0.01, 10, 96]} />
          <meshStandardMaterial
            {...getPartAppearance("#69737a", rimId, state, [wheelId])}
            metalness={0.75}
            roughness={0.23}
          />
        </mesh>
      </SemanticPart>

      <SemanticPart {...semanticProps(hubId, state, handlers)}>
        <mesh position={center} rotation={[0, 0, Math.PI / 2]} castShadow>
          <cylinderGeometry args={[0.028, 0.028, side === "rear" ? 0.145 : 0.12, 24]} />
          <meshStandardMaterial
            {...getPartAppearance("#a1abb1", hubId, state, [wheelId])}
            metalness={0.9}
            roughness={0.18}
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
              color="#8f989e"
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

export function GravelPrototypeBike(props: Props) {
  const state: ViewerInteractionState = {
    selectedId: props.selectedId,
    hoveredId: props.hoveredId,
    isolated: props.isolated,
    mode: props.mode,
    explosionAmount: props.explosionAmount,
    highlightedIds: props.highlightedIds,
    removedIds: props.removedIds,
    hiddenIds: props.hiddenIds,
    ghost: props.ghost,
  };
  const handlers: ViewerInteractionHandlers = {
    onSelect: props.onSelect,
    onHover: props.onHover,
    onIsolate: props.onIsolate,
  };

  const rear: Point = [0, 0.365, -0.615];
  const front: Point = [0, 0.365, 0.615];
  const crank: Point = [0, 0.39, -0.08];
  const seatTop: Point = [0, 0.79, -0.22];
  const headTop: Point = [0, 0.76, 0.36];
  const headBottom: Point = [0, 0.57, 0.43];
  const frameId = "bike.gravel.g1.frame";
  const frameColor = "#ad8f69";

  return (
    <group rotation={[0, -0.08, 0]}>
      <Wheel side="rear" center={rear} state={state} handlers={handlers} />
      <Wheel side="front" center={front} state={state} handlers={handlers} />

      <SemanticPart {...semanticProps(frameId, state, handlers)}>
        <group>
          <Tube from={rear} to={crank} radius={0.022} color={frameColor} part={frameId} state={state} />
          <Tube from={rear} to={seatTop} radius={0.019} color={frameColor} part={frameId} state={state} />
          <Tube from={crank} to={seatTop} radius={0.026} color={frameColor} part={frameId} state={state} />
          <Tube from={seatTop} to={headTop} radius={0.026} color={frameColor} part={frameId} state={state} />
          <Tube from={crank} to={headBottom} radius={0.032} color={frameColor} part={frameId} state={state} />
          <Tube from={headTop} to={headBottom} radius={0.031} color={frameColor} part={frameId} state={state} />
        </group>
      </SemanticPart>

      <SemanticPart {...semanticProps("bike.gravel.g1.fork", state, handlers)}>
        <group>
          <Tube from={[-0.04,0.58,0.42]} to={[-0.05,0.365,0.615]} radius={0.014} color={frameColor} part="bike.gravel.g1.fork" state={state} />
          <Tube from={[0.04,0.58,0.42]} to={[0.05,0.365,0.615]} radius={0.014} color={frameColor} part="bike.gravel.g1.fork" state={state} />
        </group>
      </SemanticPart>

      <SemanticPart {...semanticProps("bike.gravel.g1.headset", state, handlers)}>
        <mesh position={[0,0.665,0.395]} rotation={[Math.PI/2,0,0]}>
          <torusGeometry args={[0.036,0.007,10,36]} />
          <meshStandardMaterial {...getPartAppearance("#8f999f","bike.gravel.g1.headset",state)} metalness={0.88} roughness={0.2} />
        </mesh>
      </SemanticPart>

      <SemanticPart {...semanticProps("bike.gravel.g1.stem", state, handlers)}>
        <Tube from={headTop} to={[0,0.875,0.43]} radius={0.014} color="#8f999f" part="bike.gravel.g1.stem" state={state} metalness={0.88} />
      </SemanticPart>

      <SemanticPart {...semanticProps("bike.gravel.g1.handlebar", state, handlers)}>
        <group>
          <Tube from={[-0.23,0.885,0.44]} to={[0.23,0.885,0.44]} radius={0.011} color="#282d31" part="bike.gravel.g1.handlebar" state={state} />
          <Tube from={[-0.23,0.885,0.44]} to={[-0.285,0.80,0.46]} radius={0.011} color="#282d31" part="bike.gravel.g1.handlebar" state={state} />
          <Tube from={[0.23,0.885,0.44]} to={[0.285,0.80,0.46]} radius={0.011} color="#282d31" part="bike.gravel.g1.handlebar" state={state} />
          <Tube from={[-0.285,0.80,0.46]} to={[-0.32,0.72,0.43]} radius={0.011} color="#282d31" part="bike.gravel.g1.handlebar" state={state} />
          <Tube from={[0.285,0.80,0.46]} to={[0.32,0.72,0.43]} radius={0.011} color="#282d31" part="bike.gravel.g1.handlebar" state={state} />
        </group>
      </SemanticPart>

      {([
        ["left-shifter",[-0.25,0.85,0.45]],
        ["right-shifter",[0.25,0.85,0.45]],
      ] as const).map(([slug,position]) => {
        const id=`bike.gravel.g1.${slug}`;
        return (
          <SemanticPart key={id} {...semanticProps(id,state,handlers)}>
            <mesh position={position as Point} rotation={[0.15,0,0]}>
              <boxGeometry args={[0.055,0.11,0.045]} />
              <meshStandardMaterial {...getPartAppearance("#30363a",id,state)} metalness={0.35} roughness={0.42} />
            </mesh>
          </SemanticPart>
        );
      })}

      <SemanticPart {...semanticProps("bike.gravel.g1.seatpost", state, handlers)}>
        <Tube from={seatTop} to={[0,0.86,-0.24]} radius={0.013} color="#343a3e" part="bike.gravel.g1.seatpost" state={state} metalness={0.38} />
      </SemanticPart>

      <SemanticPart {...semanticProps("bike.gravel.g1.saddle", state, handlers)}>
        <mesh position={[0,0.875,-0.255]} rotation={[0.02,0,0]} castShadow>
          <boxGeometry args={[0.12,0.035,0.25]} />
          <meshStandardMaterial {...getPartAppearance("#181c20","bike.gravel.g1.saddle",state)} roughness={0.62} />
        </mesh>
      </SemanticPart>

      <SemanticPart {...semanticProps("bike.gravel.g1.bottom-bracket", state, handlers)}>
        <mesh position={crank} rotation={[0,0,Math.PI/2]} castShadow>
          <cylinderGeometry args={[0.045,0.045,0.12,24]} />
          <meshStandardMaterial {...getPartAppearance("#777f84","bike.gravel.g1.bottom-bracket",state)} metalness={0.9} roughness={0.2} />
        </mesh>
      </SemanticPart>

      <SemanticPart {...semanticProps("bike.gravel.g1.crankset", state, handlers)}>
        <mesh position={crank} rotation={[0,0,Math.PI/2]} castShadow>
          <cylinderGeometry args={[0.088,0.088,0.024,36]} />
          <meshStandardMaterial {...getPartAppearance("#32383c","bike.gravel.g1.crankset",state)} metalness={0.88} roughness={0.22} />
        </mesh>
      </SemanticPart>

      <SemanticPart {...semanticProps("bike.gravel.g1.chainring", state, handlers)}>
        <mesh position={[0.022,crank[1],crank[2]]} rotation={[0,Math.PI/2,0]}>
          <torusGeometry args={[0.092,0.005,8,44]} />
          <meshStandardMaterial {...getPartAppearance("#9da6ac","bike.gravel.g1.chainring",state)} metalness={0.92} roughness={0.18} />
        </mesh>
      </SemanticPart>

      <SemanticPart {...semanticProps("bike.gravel.g1.chain", state, handlers)}>
        <group>
          <Tube from={[0.042,0.475,-0.08]} to={[0.042,0.425,-0.615]} radius={0.003} color="#747d83" part="bike.gravel.g1.chain" state={state} />
          <Tube from={[0.042,0.33,-0.615]} to={[0.042,0.31,-0.08]} radius={0.003} color="#747d83" part="bike.gravel.g1.chain" state={state} />
        </group>
      </SemanticPart>

      <SemanticPart {...semanticProps("bike.gravel.g1.cassette", state, handlers)}>
        <group position={[0.052,rear[1],rear[2]]} rotation={[0,Math.PI/2,0]}>
          {[0.038,0.047,0.057,0.068,0.08].map((radius,index)=>(
            <mesh key={radius} position={[0,0,index*0.006-0.012]}>
              <torusGeometry args={[radius,0.004,8,34]} />
              <meshStandardMaterial {...getPartAppearance("#a1a9ae","bike.gravel.g1.cassette",state)} metalness={0.94} roughness={0.18} />
            </mesh>
          ))}
        </group>
      </SemanticPart>

      <SemanticPart {...semanticProps("bike.gravel.g1.rear-derailleur", state, handlers)}>
        <group position={[0.078,0.265,-0.56]}>
          <mesh rotation={[0.18,0,0.12]} castShadow>
            <boxGeometry args={[0.058,0.125,0.038]} />
            <meshStandardMaterial {...getPartAppearance("#30363a","bike.gravel.g1.rear-derailleur",state)} metalness={0.72} roughness={0.28} />
          </mesh>
          <mesh position={[0,-0.085,0]} rotation={[Math.PI/2,0,0]}>
            <torusGeometry args={[0.028,0.006,10,30]} />
            <meshStandardMaterial {...getPartAppearance("#848e94","bike.gravel.g1.rear-derailleur",state)} metalness={0.9} roughness={0.2} />
          </mesh>
        </group>
      </SemanticPart>

      {(["left-pedal","right-pedal"] as const).map((slug)=>{
        const id=`bike.gravel.g1.${slug}`;
        const x=slug==="left-pedal"?-0.155:0.155;
        return (
          <SemanticPart key={id} {...semanticProps(id,state,handlers)}>
            <mesh position={[x,crank[1],crank[2]]}>
              <boxGeometry args={[0.075,0.018,0.1]} />
              <meshStandardMaterial {...getPartAppearance("#2b3034",id,state)} metalness={0.5} roughness={0.42} />
            </mesh>
          </SemanticPart>
        );
      })}

      {(["front","rear"] as const).map((side)=>{
        const center=side==="front"?front:rear;
        const rotorId=`bike.gravel.g1.${side}-rotor`;
        const caliperId=`bike.gravel.g1.${side}-caliper`;
        const axleId=`bike.gravel.g1.${side}-thru-axle`;
        return (
          <group key={side}>
            <SemanticPart {...semanticProps(rotorId,state,handlers)}>
              <mesh position={[0.067,center[1],center[2]]} rotation={[0,Math.PI/2,0]}>
                <circleGeometry args={[0.10,44]} />
                <meshStandardMaterial {...getPartAppearance("#989fa4",rotorId,state)} metalness={0.93} roughness={0.18} side={DoubleSide} />
              </mesh>
            </SemanticPart>
            <SemanticPart {...semanticProps(caliperId,state,handlers)}>
              <mesh position={[0.085,0.455,side==="front"?0.565:-0.565]}>
                <boxGeometry args={[0.055,0.073,0.04]} />
                <meshStandardMaterial {...getPartAppearance("#31373b",caliperId,state)} metalness={0.74} roughness={0.27} />
              </mesh>
            </SemanticPart>
            <SemanticPart {...semanticProps(axleId,state,handlers)}>
              <mesh position={center} rotation={[0,0,Math.PI/2]}>
                <cylinderGeometry args={[0.0085,0.0085,0.18,18]} />
                <meshStandardMaterial {...getPartAppearance("#838c91",axleId,state)} metalness={0.9} roughness={0.18} />
              </mesh>
            </SemanticPart>
          </group>
        );
      })}

      <SemanticPart {...semanticProps("bike.gravel.g1.frame-mounts", state, handlers)}>
        <group>
          {[[-0.03,0.56,0.02],[0.03,0.56,0.02],[-0.03,0.5,0.11],[0.03,0.5,0.11]].map((p,index)=>(
            <mesh key={index} position={p as Point} rotation={[0,0,Math.PI/2]}>
              <cylinderGeometry args={[0.009,0.009,0.006,12]} />
              <meshStandardMaterial {...getPartAppearance("#6b7378","bike.gravel.g1.frame-mounts",state)} metalness={0.88} roughness={0.2} />
            </mesh>
          ))}
        </group>
      </SemanticPart>

      <SemanticPart {...semanticProps("bike.gravel.g1.fork-mounts", state, handlers)}>
        <group>
          {[[-0.052,0.49,0.515],[0.052,0.49,0.515],[-0.054,0.43,0.57],[0.054,0.43,0.57]].map((p,index)=>(
            <mesh key={index} position={p as Point}>
              <sphereGeometry args={[0.011,12,10]} />
              <meshStandardMaterial {...getPartAppearance("#6b7378","bike.gravel.g1.fork-mounts",state)} metalness={0.86} roughness={0.2} />
            </mesh>
          ))}
        </group>
      </SemanticPart>

      <SemanticPart {...semanticProps("bike.gravel.g1.downtube-protector", state, handlers)}>
        <mesh position={[0,0.43,0.18]} rotation={[-0.34,0,0]} castShadow>
          <boxGeometry args={[0.075,0.012,0.34]} />
          <meshStandardMaterial {...getPartAppearance("#2a2f31","bike.gravel.g1.downtube-protector",state)} metalness={0.05} roughness={0.82} />
        </mesh>
      </SemanticPart>
    </group>
  );
}
