export type AssemblyAction =
  | "loosen"
  | "tighten"
  | "disconnect"
  | "connect"
  | "remove"
  | "install";

export type ConnectionType =
  | "bolted"
  | "threaded"
  | "clamped"
  | "pressed"
  | "bearing"
  | "chain"
  | "freehub"
  | "axle";

export interface AssemblyConnection {
  from: string;
  to: string;
  type: ConnectionType;
}

export interface AssemblyOperation {
  id: string;
  targetId: string;
  action: AssemblyAction;
  prerequisites: string[];
  tools: string[];
  note?: string;
}

export interface AssemblyGraph {
  bikeId: string;
  connections: AssemblyConnection[];
  operations: AssemblyOperation[];
}
