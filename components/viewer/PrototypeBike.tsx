"use client";

import { useMemo } from "react";
import { DoubleSide, Quaternion, Vector3, type ColorRepresentation } from "three";

type Point = [number, number, number];

type TubeProps = {
  from: Point;
  to: Point;
  radius: number;
  color: ColorRepresentation;
  metalness?: number;
  roughness?: number;
};

function Tube({ from, to, radius, color, metalness = 0.55, roughness = 0.24 }: TubeProps) {
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
      <cylinderGeometry args={[radius, radius, transform.length, 20]} />
      <meshStandardMaterial color={color} metalness={metalness} roughness={roughness} />
    </mesh>
  );
}

function Wheel({ center }: { center: Point }) {
  const radius = 0.35;
  const spokes = Array.from({ length: 16 }, (_, index) => {
    const angle = (index / 16) * Math.PI * 2;
    return [
      center,
      [center[0], center[1] + Math.sin(angle) * (radius - 0.025), center[2] + Math.cos(angle) * (radius - 0.025)] as Point,
    ] as const;
  });

  return (
    <group>
      <mesh castShadow receiveShadow position={center} rotation={[0, Math.PI / 2, 0]}>
        <torusGeometry args={[radius, 0.026, 16, 96]} />
        <meshStandardMaterial color="#12171d" metalness={0.05} roughness={0.72} />
      </mesh>
      <mesh position={center} rotation={[0, 0, Math.PI / 2]} castShadow>
        <cylinderGeometry args={[0.026, 0.026, 0.12, 24]} />
        <meshStandardMaterial color="#aeb7c1" metalness={0.88} roughness={0.2} />
      </mesh>
      {spokes.map(([from, to], index) => (
        <Tube key={index} from={from} to={to} radius={0.0017} color="#9099a3" metalness={0.9} roughness={0.2} />
      ))}
    </group>
  );
}

export function PrototypeBike() {
  const rear: Point = [0, 0.36, -0.58];
  const front: Point = [0, 0.36, 0.58];
  const crank: Point = [0, 0.39, -0.1];
  const seatTop: Point = [0, 0.79, -0.22];
  const headTop: Point = [0, 0.76, 0.34];
  const headBottom: Point = [0, 0.59, 0.39];
  const frameColor = "#b6e64f";
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
      <Wheel center={rear} />
      <Wheel center={front} />

      {frameTubes.map(([from, to, radius], index) => (
        <Tube key={index} from={from} to={to} radius={radius} color={frameColor} metalness={0.46} roughness={0.22} />
      ))}

      <Tube from={[-0.038, 0.59, 0.39]} to={[-0.048, 0.36, 0.58]} radius={0.013} color={frameColor} />
      <Tube from={[0.038, 0.59, 0.39]} to={[0.048, 0.36, 0.58]} radius={0.013} color={frameColor} />
      <Tube from={[0, 0.76, 0.34]} to={[0, 0.89, 0.39]} radius={0.014} color="#abb4be" metalness={0.88} />
      <Tube from={[-0.23, 0.9, 0.405]} to={[0.23, 0.9, 0.405]} radius={0.011} color="#20262d" metalness={0.2} roughness={0.5} />

      <mesh castShadow position={[0, 0.855, -0.24]} rotation={[0.03, 0, 0]}>
        <boxGeometry args={[0.115, 0.035, 0.25]} />
        <meshStandardMaterial color="#151a20" roughness={0.58} />
      </mesh>

      <mesh castShadow position={crank} rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.09, 0.09, 0.022, 40]} />
        <meshStandardMaterial color="#20262d" metalness={0.9} roughness={0.2} />
      </mesh>

      <Tube from={[-0.115, 0.39, -0.1]} to={[0.115, 0.39, -0.1]} radius={0.009} color="#77818b" metalness={0.92} />

      <mesh position={[-0.122, 0.39, -0.1]} rotation={[0, 0, Math.PI / 2]}>
        <boxGeometry args={[0.035, 0.012, 0.1]} />
        <meshStandardMaterial color="#151a20" roughness={0.58} />
      </mesh>
      <mesh position={[0.122, 0.39, -0.1]} rotation={[0, 0, Math.PI / 2]}>
        <boxGeometry args={[0.035, 0.012, 0.1]} />
        <meshStandardMaterial color="#151a20" roughness={0.58} />
      </mesh>

      <mesh position={[0, 0.39, -0.1]} rotation={[0, Math.PI / 2, 0]}>
        <torusGeometry args={[0.102, 0.005, 8, 48]} />
        <meshStandardMaterial color="#aeb8c1" metalness={0.92} roughness={0.16} />
      </mesh>

      {[front, rear].map((position, index) => (
        <mesh key={index} position={position} rotation={[0, Math.PI / 2, 0]}>
          <circleGeometry args={[0.105, 48]} />
          <meshStandardMaterial color="#939da6" metalness={0.92} roughness={0.2} side={DoubleSide} />
        </mesh>
      ))}
    </group>
  );
}
