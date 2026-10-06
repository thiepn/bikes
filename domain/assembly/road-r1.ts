import graphJson from "@/content/assembly/road-r1.json";
import type {
  AssemblyGraph,
  AssemblyOperation,
} from "@/engine/assembly/types";

export const ROAD_R1_ASSEMBLY_GRAPH = graphJson as AssemblyGraph;

const OPERATIONS = new Map(
  ROAD_R1_ASSEMBLY_GRAPH.operations.map((operation) => [
    operation.id,
    operation,
  ]),
);

export function getAssemblyOperation(id: string) {
  return OPERATIONS.get(id) ?? null;
}

export function getConnectedComponentIds(componentId: string) {
  return ROAD_R1_ASSEMBLY_GRAPH.connections.flatMap((connection) => {
    if (connection.from === componentId) return [connection.to];
    if (connection.to === componentId) return [connection.from];
    return [];
  });
}

export function getOperationPrerequisiteClosure(operationId: string) {
  const resolved = new Set<string>();

  function visit(id: string) {
    const operation = OPERATIONS.get(id);
    if (!operation) return;

    for (const prerequisite of operation.prerequisites) {
      if (resolved.has(prerequisite)) continue;
      visit(prerequisite);
      resolved.add(prerequisite);
    }
  }

  visit(operationId);
  return [...resolved];
}

export function canPerformOperation(
  operation: AssemblyOperation,
  completedOperationIds: ReadonlySet<string>,
) {
  return operation.prerequisites.every((id) =>
    completedOperationIds.has(id),
  );
}
