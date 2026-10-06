"use client";

import { Canvas } from "@react-three/fiber";
import { ACESFilmicToneMapping, SRGBColorSpace } from "three";
import { BikeScene } from "./BikeScene";

export function BikeViewer() {
  return (
    <section className="viewer" aria-label="Interactive Bike Atlas 3D viewer">
      <div className="topbar">
        <div className="brand">
          <strong>BIKE ATLAS</strong>
          <span>Interactive bicycle laboratory</span>
        </div>
        <div className="phase-label">P1 engine</div>
      </div>

      <Canvas
        className="viewer-canvas"
        dpr={[1, 1.8]}
        shadows
        camera={{ position: [1.85, 1.15, 2.2], fov: 34, near: 0.05, far: 60 }}
        gl={{ antialias: true, alpha: false, powerPreference: "high-performance" }}
        onCreated={({ gl }) => {
          gl.outputColorSpace = SRGBColorSpace;
          gl.toneMapping = ACESFilmicToneMapping;
          gl.toneMappingExposure = 1.05;
        }}
      >
        <BikeScene />
      </Canvas>

      <div className="status-panel" aria-label="Rendering status">
        <div className="status-heading">
          <strong>Calibration bike</strong>
          <span className="status-chip">Live 3D</span>
        </div>
        <dl className="status-grid">
          <dt>Coordinate system</dt><dd>+Y up / +Z forward</dd>
          <dt>Origin</dt><dd>Bottom bracket</dd>
          <dt>Renderer</dt><dd>PBR / ACES</dd>
          <dt>Asset target</dt><dd>glTF / GLB</dd>
        </dl>
      </div>

      <div className="hero-copy">
        <p className="eyebrow">3D engine calibration</p>
        <h1>Understand the machine.</h1>
        <p>
          This procedural rig validates camera, lighting, materials, scale and
          interaction before the production Road R1 asset enters the pipeline.
        </p>
      </div>

      <div className="viewer-hint" aria-hidden="true">
        <span>Drag</span> rotate · <span>Scroll</span> zoom
      </div>
    </section>
  );
}
