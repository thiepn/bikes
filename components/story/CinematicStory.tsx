"use client";

import { useEffect, useRef } from "react";

type CinematicStoryProps = {
  progress: number;
  onProgress: (progress: number) => void;
  onEnterExplore: () => void;
};

const STORY = [
  {
    index: "01",
    eyebrow: "Bike Atlas",
    title: "Understand the machine.",
    body: "A bicycle looks simple from a distance. Up close, it is a tightly connected system of structure, leverage, bearings, friction, gearing and control.",
    align: "left",
  },
  {
    index: "02",
    eyebrow: "Structure",
    title: "Every line carries a load.",
    body: "Frame geometry is not decoration. Tube placement, wheelbase and steering geometry determine how the machine carries forces and responds to the rider.",
    align: "right",
  },
  {
    index: "03",
    eyebrow: "Systems",
    title: "One bike. Many systems.",
    body: "Wheels, braking, steering, drivetrain and contact points work independently—and only make sense when you see how they connect.",
    align: "left",
  },
  {
    index: "04",
    eyebrow: "Inside",
    title: "Look past the surface.",
    body: "Fade the structure away and the mechanisms become legible: hubs, rotors, transmission and the parts that normally disappear inside the finished machine.",
    align: "right",
  },
  {
    index: "05",
    eyebrow: "Assembly",
    title: "Take it apart without losing the whole.",
    body: "Exploded inspection keeps every component in context. Follow how the machine separates, then move from overview to a single part.",
    align: "left",
  },
];

export function CinematicStory({
  progress,
  onProgress,
  onEnterExplore,
}: CinematicStoryProps) {
  const scrollerRef = useRef<HTMLDivElement>(null);
  const frameRef = useRef<number | null>(null);

  useEffect(() => {
    const element = scrollerRef.current;
    if (!element) return;

    function update() {
      if (!element) return;
      const max = Math.max(1, element.scrollHeight - element.clientHeight);
      onProgress(element.scrollTop / max);
      frameRef.current = null;
    }

    function handleScroll() {
      if (frameRef.current !== null) return;
      frameRef.current = window.requestAnimationFrame(update);
    }

    element.addEventListener("scroll", handleScroll, { passive: true });
    update();

    return () => {
      element.removeEventListener("scroll", handleScroll);
      if (frameRef.current !== null) {
        window.cancelAnimationFrame(frameRef.current);
      }
    };
  }, [onProgress]);

  return (
    <div className="story-layer">
      <div className="story-progress" aria-hidden="true">
        <i style={{ transform: `scaleX(${progress})` }} />
      </div>

      <button
        className="story-skip"
        type="button"
        onClick={onEnterExplore}
      >
        Skip to explore
        <span aria-hidden="true">↗</span>
      </button>

      <div
        ref={scrollerRef}
        className="story-scroll"
        aria-label="Bike Atlas introduction"
      >
        {STORY.map((section, sectionIndex) => (
          <section
            className={`story-section story-section--${section.align}`}
            key={section.index}
          >
            <div className="story-copy">
              <div className="story-copy__meta">
                <span>{section.index}</span>
                <span>{section.eyebrow}</span>
              </div>
              <h1>{section.title}</h1>
              <p>{section.body}</p>

              {sectionIndex === 0 && (
                <div className="story-scroll-cue" aria-hidden="true">
                  <span>Scroll to inspect</span>
                  <i />
                </div>
              )}
            </div>
          </section>
        ))}

        <section className="story-section story-section--final">
          <div className="story-final">
            <p className="story-final__eyebrow">The machine is yours.</p>
            <h2>Explore every part.</h2>
            <p>
              Leave the guided sequence and take control of the same 3D bike.
              Select components, isolate systems, use X-Ray, or scrub the
              exploded view yourself.
            </p>
            <button
              className="story-enter"
              type="button"
              onClick={onEnterExplore}
            >
              Enter Bike Atlas
              <span aria-hidden="true">→</span>
            </button>
          </div>
        </section>
      </div>
    </div>
  );
}
