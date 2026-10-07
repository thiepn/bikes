import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";

export default defineConfig([
  ...nextVitals,
  {
    files: [
      "components/learning/useLearningProgress.ts",
      "components/workshop/useWorkshopProgress.ts",
      "components/optimizer/BuildOptimizerPanel.tsx",
      "components/viewer/BikeViewer.tsx",
    ],
    rules: {
      // These effects intentionally hydrate or restore React state from
      // browser-owned external state (localStorage / URL state).
      "react-hooks/set-state-in-effect": "off",
    },
  },
  {
    files: [
      "components/story/StoryCameraRig.tsx",
      "components/viewer/CameraRig.tsx",
    ],
    rules: {
      // Three.js cameras and OrbitControls are imperative mutable objects.
      // Frame callbacks must mutate them to animate the scene.
      "react-hooks/immutability": "off",
    },
  },
  globalIgnores([".next/**", "out/**", "build/**", "next-env.d.ts"]),
]);
