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
        <div className="phase-label">P2 asset foundation</div>
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

      <div className="status-panel" aria-label="Road R1 asset status">
        <div className="status-heading">
          <strong>Road R1</strong>
          <span className="status-chip">Source locked</span>
        </div>
        <dl className="status-grid">
          <dt>Source</dt><dd>CC BY 4.0</dd>
          <dt>Semantic parts</dt><dd>35</dd>
          <dt>Runtime target</dt><dd>GLB · LOD0–3</dd>
          <dt>Viewer</dt><dd>Calibration rig</dd>
        </dl>
      </div>

      <div className="hero-copy">
        <p className="eyebrow">Road R1 · asset preparation</p>
        <h1>Build the machine correctly.</h1>
        <p>
          The first production bike now has a pinned source, provenance and a
          35-part semantic target. The calibration rig remains visible until the
          cleaned Road R1 GLB passes the asset contract.
        </p>
      </div>

      <div className="viewer-hint" aria-hidden="true">
        <span>Drag</span> rotate · <span>Scroll</span> zoom
      </div>
    </section>
  );
}
