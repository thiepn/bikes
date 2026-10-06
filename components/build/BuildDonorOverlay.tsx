"use client";

import { useMemo } from "react";
import {
  DoubleSide,
  Quaternion,
  Vector3,
} from "three";
import { getCompatibilityPart } from "@/domain/compatibility/catalog";
import {
  getBuildVisualHost,
  getDonorVisualProfile,
} from "@/domain/compatibility/visual";
import type { BuildVisualAttachment } from "@/engine/compatibility/visual-types";

type Point = [number, number, number];

type Props = {
  bikeId: string;
  selections: Readonly<Record<string, string>>;
};

function Tube({
  from,
  to,
  radius,
  color,
}: {
  from: Point;
  to: Point;
  radius: number;
  color: string;
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
      <cylinderGeometry
        args={[radius, radius, transform.length, 18]}
      />
      <meshStandardMaterial
        color={color}
        emissive={color}
        emissiveIntensity={0.08}
        metalness={0.7}
        roughness={0.25}
      />
    </mesh>
  );
}

function WheelProxy({
  attachment,
  sourceBikeId,
}: {
  attachment: BuildVisualAttachment;
  sourceBikeId: string;
}) {
  const donor = getDonorVisualProfile(sourceBikeId);
  const center = attachment.position;
  const radius = attachment.radius;
  if (!donor || !center || !radius) return null;

  const spokeRadius = radius - Math.max(0.04, donor.rimThickness * 4);
  const spokes = Array.from(
    { length: donor.wheelSpokes },
    (_, index) => {
      const angle = (index / donor.wheelSpokes) * Math.PI * 2;
      return [
        [0, 0, 0] as Point,
        [
          0,
          Math.sin(angle) * spokeRadius,
          Math.cos(angle) * spokeRadius,
        ] as Point,
      ] as const;
    },
  );

  return (
    <group position={center}>
      <mesh rotation={[0, Math.PI / 2, 0]} castShadow receiveShadow>
        <torusGeometry
          args={[radius - 0.04, donor.rimThickness, 12, 96]}
        />
        <meshStandardMaterial
          color={donor.accent}
          emissive={donor.accent}
          emissiveIntensity={0.08}
          metalness={0.8}
          roughness={0.22}
        />
      </mesh>

      <mesh rotation={[0, 0, Math.PI / 2]} castShadow>
        <cylinderGeometry
          args={[
            donor.hubRadius,
            donor.hubRadius,
            donor.hubWidth,
            24,
          ]}
        />
        <meshStandardMaterial
          color={donor.accent}
          emissive={donor.accent}
          emissiveIntensity={0.06}
          metalness={0.9}
          roughness={0.18}
        />
      </mesh>

      {spokes.map(([from, to], index) => (
        <Tube
          key={index}
          from={from}
          to={to}
          radius={0.0018}
          color="#a3adb3"
        />
      ))}
    </group>
  );
}

function TireProxy({
  attachment,
  sourceBikeId,
}: {
  attachment: BuildVisualAttachment;
  sourceBikeId: string;
}) {
  const donor = getDonorVisualProfile(sourceBikeId);
  if (!donor || !attachment.position || !attachment.radius) {
    return null;
  }

  return (
    <mesh
      position={attachment.position}
      rotation={[0, Math.PI / 2, 0]}
      castShadow
      receiveShadow
    >
      <torusGeometry
        args={[attachment.radius, donor.tireThickness, 18, 96]}
      />
      <meshStandardMaterial
        color="#171c20"
        roughness={0.78}
        metalness={0.03}
      />
    </mesh>
  );
}

function HandlebarProxy({
  attachment,
  sourceBikeId,
}: {
  attachment: BuildVisualAttachment;
  sourceBikeId: string;
}) {
  const donor = getDonorVisualProfile(sourceBikeId);
  const p = attachment.position;
  if (!donor || !p) return null;

  const w = donor.handlebarWidth;
  const local = (x: number, y: number, z: number): Point => [
    p[0] + x,
    p[1] + y,
    p[2] + z,
  ];

  if (donor.handlebarStyle === "flat") {
    return (
      <Tube
        from={local(-w / 2, 0, 0)}
        to={local(w / 2, 0, 0)}
        radius={0.012}
        color={donor.accent}
      />
    );
  }

  if (donor.handlebarStyle === "swept") {
    return (
      <group>
        <Tube from={local(0,0,0)} to={local(-w*0.34,0.03,-0.06)} radius={0.011} color={donor.accent} />
        <Tube from={local(0,0,0)} to={local(w*0.34,0.03,-0.06)} radius={0.011} color={donor.accent} />
        <Tube from={local(-w*0.34,0.03,-0.06)} to={local(-w/2,0.03,-0.12)} radius={0.011} color={donor.accent} />
        <Tube from={local(w*0.34,0.03,-0.06)} to={local(w/2,0.03,-0.12)} radius={0.011} color={donor.accent} />
      </group>
    );
  }

  const flare = donor.handlebarStyle === "gravel-flare" ? 0.08 : 0.035;
  const shoulder = w * 0.36;
  const drop = w / 2;

  return (
    <group>
      <Tube from={local(-shoulder,0,0)} to={local(shoulder,0,0)} radius={0.011} color={donor.accent} />
      <Tube from={local(-shoulder,0,0)} to={local(-drop,-0.085,flare)} radius={0.011} color={donor.accent} />
      <Tube from={local(shoulder,0,0)} to={local(drop,-0.085,flare)} radius={0.011} color={donor.accent} />
      <Tube from={local(-drop,-0.085,flare)} to={local(-drop*1.05,-0.17,flare-0.025)} radius={0.011} color={donor.accent} />
      <Tube from={local(drop,-0.085,flare)} to={local(drop*1.05,-0.17,flare-0.025)} radius={0.011} color={donor.accent} />
    </group>
  );
}

function SimpleProxy({
  attachment,
  sourceBikeId,
  partId,
}: {
  attachment: BuildVisualAttachment;
  sourceBikeId: string;
  partId: string;
}) {
  const donor = getDonorVisualProfile(sourceBikeId);
  const part = getCompatibilityPart(partId);
  if (!donor || !part) return null;

  if (attachment.kind === "tube" && attachment.from && attachment.to) {
    const radius =
      attachment.slotId === "stem"
        ? donor.stemRadius
        : donor.seatpostRadius;
    return (
      <Tube
        from={attachment.from}
        to={attachment.to}
        radius={radius}
        color={donor.accent}
      />
    );
  }

  if (attachment.kind === "saddle" && attachment.position) {
    return (
      <mesh position={attachment.position} castShadow>
        <boxGeometry args={donor.saddleSize} />
        <meshStandardMaterial
          color={donor.accent}
          emissive={donor.accent}
          emissiveIntensity={0.04}
          roughness={0.55}
        />
      </mesh>
    );
  }

  if (attachment.kind === "pedal" && attachment.position) {
    return (
      <mesh position={attachment.position} castShadow>
        <boxGeometry args={donor.pedalSize} />
        <meshStandardMaterial
          color={donor.accent}
          emissive={donor.accent}
          emissiveIntensity={0.05}
          metalness={0.5}
          roughness={0.38}
        />
      </mesh>
    );
  }

  if (attachment.kind === "rotor" && attachment.position) {
    const diameter = part.interfaces.rotorDiameter;
    if (typeof diameter !== "number") return null;
    const visualRadius = (diameter / 2000) * 1.25;

    return (
      <mesh
        position={attachment.position}
        rotation={[0, Math.PI / 2, 0]}
      >
        <ringGeometry
          args={[
            visualRadius * 0.72,
            visualRadius,
            48,
          ]}
        />
        <meshStandardMaterial
          color="#aab4ba"
          emissive={donor.accent}
          emissiveIntensity={0.08}
          metalness={0.94}
          roughness={0.18}
          side={DoubleSide}
        />
      </mesh>
    );
  }

  return null;
}

export function BuildDonorOverlay({ bikeId, selections }: Props) {
  const host = getBuildVisualHost(bikeId);
  if (!host) return null;

  return (
    <group rotation={[0, host.yawRad, 0]}>
      {Object.entries(selections).map(([slotId, partId]) => {
        const attachment = host.attachments.find(
          (item) => item.slotId === slotId,
        );
        const part = getCompatibilityPart(partId);
        if (!attachment || !part) return null;

        if (attachment.kind === "wheel") {
          return (
            <WheelProxy
              key={slotId}
              attachment={attachment}
              sourceBikeId={part.sourceBikeId}
            />
          );
        }

        if (attachment.kind === "tire") {
          return (
            <TireProxy
              key={slotId}
              attachment={attachment}
              sourceBikeId={part.sourceBikeId}
            />
          );
        }

        if (attachment.kind === "handlebar") {
          return (
            <HandlebarProxy
              key={slotId}
              attachment={attachment}
              sourceBikeId={part.sourceBikeId}
            />
          );
        }

        return (
          <SimpleProxy
            key={slotId}
            attachment={attachment}
            sourceBikeId={part.sourceBikeId}
            partId={part.id}
          />
        );
      })}
    </group>
  );
}
