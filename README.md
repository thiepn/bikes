# Bike Atlas

Bike Atlas is an interactive 3D bicycle knowledge platform for exploring bicycle archetypes, components, engineering, learning, maintenance, history and use-case fit.

## Current phase

**P18 — Bicycle History, Evolution Timeline & Engineering Lineage**

Bike Atlas now contains a global sourced History workspace connecting historical bicycle development directly to the four modern interactive archetypes.

Current History foundation:

```text
12 historical milestones
6 eras
8 engineering/history categories
40 modern-component lineage links
18 source references
```

The timeline currently spans:

```text
1817  steerable draisine
1863  pedal velocipede
1871  wire-spoked high-wheel Ordinary
1880s safety-bicycle convergence
1888  practical pneumatic bicycle tire
1890s bicycle transport boom
1902  internal-gear hub
1937  derailleur Tour adoption
1970s mountain-bike emergence
1976  Repack
1990–1996 global MTB institutionalization
Today modern specialization
```

P18 deliberately preserves historical uncertainty instead of inventing clean origin stories:

- pedal attribution in the Michaux workshop is treated as disputed;
- Dunlop's practical 1888 pneumatic tire is shown alongside Thomson's earlier pneumatic-tire work;
- 1937 is treated as derailleur adoption in the Tour, not derailleur invention;
- mountain biking is treated as an evolving movement rather than the creation of one person.

### Trace it into Bike Atlas

Every milestone links into current semantic 3D components.

For example:

```text
1888 pneumatic tire
├─ Road R1 tire
├─ MTB M1 tire
├─ Urban U1 tire
└─ Gravel G1 tire
```

Selecting a lineage target exits History directly into that bike/component in the normal 3D Explore viewer.

### History deep links

```text
/?history=1817-draisine-steering
/?history=1888-pneumatic-tire
/?history=1902-internal-gear-hub
/?history=1976-repack-race
/?history=today-specialized-branches
```

History is global and mutually exclusive with Finder, Compare, Learn, Workshop and Encyclopedia.

### Source families

Milestone evidence currently comes from:

```text
Smithsonian Institution
National Museums Scotland
Sturmey-Archer
Conservatoire national des arts et métiers
Marin Museum of Bicycling / Mountain Bike Hall of Fame
Union Cycliste Internationale
```

Each milestone stores its own source links.

Run all domain checks with:

```bash
npm run validate:domain
```

See `docs/P1.md` through `docs/P18.md`.
