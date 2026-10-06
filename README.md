# Bike Atlas

Bike Atlas is an interactive 3D bicycle knowledge platform for exploring bicycle archetypes, components, engineering, learning, maintenance and use-case fit.

## Current phase

**P13 — Bike Finder, Use-Case Profiles & Explainable Recommendation Engine**

Bike Atlas now has an interactive **Find my bike** workflow.

The Finder asks about:

- riding surface;
- speed vs control priority;
- normal ride distance;
- climbing;
- cargo;
- maintenance tolerance;
- weather.

Those answers are converted into explicit demands across ten capability traits and compared with the current Bike Atlas archetypes.

Current profiles:

- **Road R1** — paved/distance efficiency, direct handling and lower suspension-service burden.
- **MTB M1** — technical terrain, suspension, rough-surface control and mixed-surface capability.

The result includes:

- 0–100 fit score;
- Strong / Good / Closest current match language;
- reasons the bike fits;
- unmet needs;
- always-visible platform trade-offs;
- the second-ranked alternative;
- direct **Explore** and **Compare** actions.

The engine does not penalize a bike merely for having extra capability. Only weighted shortfalls against requested needs reduce its score.

If the current catalog cannot satisfy an important requirement, Bike Atlas says so instead of inventing a recommendation.

For example, the **Daily utility** preset currently triggers a catalog-gap warning because neither Road R1 nor MTB M1 has meaningful cargo utility.

Current use-case presets:

```text
Fast road
Mixed exploration
Trail riding
Technical trail
Daily utility
```

Complete Finder results can be shared with a versioned URL:

```text
/?finder=v1:paved:speed:long:rolling:none:normal:fair
```

P13 is designed so future city, gravel, trekking, cargo, touring, folding and electric-bike archetypes can enter the recommendation system by adding a capability profile rather than rewriting the questionnaire.

Run all domain checks with:

```bash
npm run validate:domain
```

See `docs/P1.md` through `docs/P13.md`.
