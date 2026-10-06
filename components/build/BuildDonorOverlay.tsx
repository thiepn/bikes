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

  if (attachment.kind === "fork" && attachment.segments) {
    return (
      <group>
        {attachment.segments.map((segment, index) => (
          <Tube
            key={index}
            from={segment.from}
            to={segment.to}
            radius={donor.forkRadius}
            color={donor.accent}
          />
        ))}
      </group>
    );
  }

  if (attachment.kind === "caliper" && attachment.position) {
    return (
      <mesh position={attachment.position} castShadow>
        <boxGeometry args={donor.caliperSize} />
        <meshStandardMaterial
          color={donor.accent}
          emissive={donor.accent}
          emissiveIntensity={0.05}
          metalness={0.72}
          roughness={0.27}
        />
      </mesh>
    );
  }

  if (attachment.kind === "crankset" && attachment.position) {
    const ringCount =
      typeof part.interfaces.ringCount === "number"
        ? part.interfaces.ringCount
        : 1;
    const frontSmall =
      typeof part.interfaces.frontSmallTeeth === "number"
        ? part.interfaces.frontSmallTeeth
        : 32;
    const frontLarge =
      typeof part.interfaces.frontLargeTeeth === "number"
        ? part.interfaces.frontLargeTeeth
        : frontSmall;
    const radiusFor = (teeth: number) =>
      Math.min(0.105, Math.max(0.06, teeth / 520));

    return (
      <group position={attachment.position}>
        <mesh rotation={[0, 0, Math.PI / 2]} castShadow>
          <cylinderGeometry args={[0.075, 0.075, 0.025, 36]} />
          <meshStandardMaterial
            color={donor.accent}
            emissive={donor.accent}
            emissiveIntensity={0.05}
            metalness={0.85}
            roughness={0.22}
          />
        </mesh>
        <mesh position={[0.025, 0, 0]} rotation={[0, Math.PI / 2, 0]}>
          <torusGeometry args={[radiusFor(frontLarge), 0.005, 8, 44]} />
          <meshStandardMaterial
            color="#a8b0b6"
            metalness={0.93}
            roughness={0.18}
          />
        </mesh>
        {ringCount > 1 && (
          <mesh position={[0.016, 0, 0]} rotation={[0, Math.PI / 2, 0]}>
            <torusGeometry args={[radiusFor(frontSmall), 0.0045, 8, 40]} />
            <meshStandardMaterial
              color="#8f989f"
              metalness={0.92}
              roughness={0.19}
            />
          </mesh>
        )}
      </group>
    );
  }

  if (
    attachment.kind === "rear-transmission" &&
    attachment.position
  ) {
    const architecture = part.interfaces.transmissionArchitecture;
    const rearLarge =
      typeof part.interfaces.rearLargeTeeth === "number"
        ? part.interfaces.rearLargeTeeth
        : 34;

    if (architecture === "internal-gear") {
      return (
        <mesh position={attachment.position} rotation={[0, Math.PI / 2, 0]}>
          <torusGeometry args={[0.052, 0.006, 8, 36]} />
          <meshStandardMaterial
            color={donor.accent}
            emissive={donor.accent}
            emissiveIntensity={0.05}
            metalness={0.88}
            roughness={0.2}
          />
        </mesh>
      );
    }

    const maxRadius = Math.min(0.105, Math.max(0.065, rearLarge / 500));
    const radii = Array.from({ length: 6 }, (_, index) => {
      const t = index / 5;
      return 0.034 + (maxRadius - 0.034) * t;
    });

    return (
      <group
        position={attachment.position}
        rotation={[0, Math.PI / 2, 0]}
      >
        {radii.map((radius, index) => (
          <mesh key={radius} position={[0, 0, index * 0.006 - 0.015]}>
            <torusGeometry args={[radius, 0.004, 8, 36]} />
            <meshStandardMaterial
              color={index === radii.length - 1 ? donor.accent : "#a1abb1"}
              emissive={donor.accent}
              emissiveIntensity={index === radii.length - 1 ? 0.05 : 0}
              metalness={0.94}
              roughness={0.18}
            />
          </mesh>
        ))}
      </group>
    );
  }

  if (
    attachment.kind === "rear-derailleur" &&
    attachment.position &&
    donor.derailleurSize
  ) {
    return (
      <group position={attachment.position}>
        <mesh rotation={[0.2, 0, 0.15]} castShadow>
          <boxGeometry args={donor.derailleurSize} />
          <meshStandardMaterial
            color={donor.accent}
            emissive={donor.accent}
            emissiveIntensity={0.05}
            metalness={0.7}
            roughness={0.28}
          />
        </mesh>
        <mesh
          position={[0, -0.088, 0]}
          rotation={[Math.PI / 2, 0, 0]}
        >
          <torusGeometry args={[0.029, 0.006, 10, 32]} />
          <meshStandardMaterial
            color="#8f999f"
            metalness={0.9}
            roughness={0.2}
          />
        </mesh>
      </group>
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
