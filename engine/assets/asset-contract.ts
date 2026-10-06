export const BIKE_ASSET_CONTRACT = {
  format: "glb",
  coordinateSystem: { up: "+Y", forward: "+Z", right: "+X" },
  unit: "meter",
  origin: "bottom-bracket-center",
  rootNode: "ROOT_BIKE",
  prefixes: {
    system: "SYS__",
    component: "COMP__",
    subcomponent: "SUB__",
    helper: "HELPER__",
  },
  lods: ["LOD0", "LOD1", "LOD2", "LOD3"],
} as const;

export function isProductionNodeName(name: string) {
  return Object.values(BIKE_ASSET_CONTRACT.prefixes).some((prefix) =>
    name.startsWith(prefix),
  );
}
