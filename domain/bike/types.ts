export type BikeSystemId =
  | "frame"
  | "fork-suspension"
  | "steering"
  | "cockpit"
  | "front-wheel"
  | "rear-wheel"
  | "tires"
  | "drivetrain"
  | "transmission"
  | "braking"
  | "saddle-seatpost"
  | "pedals"
  | "electrical"
  | "lighting"
  | "cargo-utility"
  | "accessories";

export type MechanicalInterfaceType =
  | "axle"
  | "bottom-bracket"
  | "brake-mount"
  | "headset"
  | "seatpost"
  | "freehub"
  | "tire"
  | "chain"
  | "pedal"
  | "rotor"
  | "drivetrain";

export interface MechanicalInterface {
  type: MechanicalInterfaceType;
  standard: string;
  dimensions?: Record<string, number | string>;
}

export interface BikeComponent {
  id: string;
  slug: string;
  name: string;
  systemId: BikeSystemId;
  parentId?: string;
  modelNode: string;
  materialIds: string[];
  massKg?: number;
  interfaces: MechanicalInterface[];
  learningConceptIds: string[];
  procedureIds: string[];
  failureModeIds: string[];
  tags: string[];
}
