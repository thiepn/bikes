import { ROAD_R1_ASSEMBLY_GRAPH } from "./road-r1";
import mtbGraphJson from "@/content/assembly/mtb-m1.json";
import type {
  AssemblyGraph,
  AssemblyOperation,
} from "@/engine/assembly/types";

export const MTB_M1_ASSEMBLY_GRAPH =
  mtbGraphJson as AssemblyGraph;

const GRAPHS = new Map<string, AssemblyGraph>([
  [ROAD_R1_ASSEMBLY_GRAPH.bikeId, ROAD_R1_ASSEMBLY_GRAPH],
  [MTB_M1_ASSEMBLY_GRAPH.bikeId, MTB_M1_ASSEMBLY_GRAPH],
]);

export function getAssemblyGraphForBike(bikeId: string) {
  return GRAPHS.get(bikeId) ?? null;
}

export function getAssemblyNeighborsForComponent(
  bikeId: string,
  componentId: string,
) {
  const graph = getAssemblyGraphForBike(bikeId);
  if (!graph) return [];

  return graph.connections.flatMap((connection) => {
    if (connection.from === componentId) return [connection.to];
    if (connection.to === componentId) return [connection.from];
    return [];
  });
}


export function getAssemblyOperationForBike(
  bikeId: string,
  operationId: string,
) {
  const graph = getAssemblyGraphForBike(bikeId);
  return (
    graph?.operations.find((operation) => operation.id === operationId) ??
    null
  );
}

export function canPerformAssemblyOperation(
  operation: AssemblyOperation,
  completedOperationIds: ReadonlySet<string>,
) {
  return operation.prerequisites.every((id) =>
    completedOperationIds.has(id),
  );
}
