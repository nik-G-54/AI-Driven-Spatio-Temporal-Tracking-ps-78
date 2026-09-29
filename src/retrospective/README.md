# Retrospective AI Validation — developer note

Route: `/retrospective` (empty state) and `/retrospective/:caseId`.
Purpose: compare **Forecast (NWP)**, **AI output** and **Reference** for a historical case. This is separate from
Historical Replay (`/historical-replay`), which is track/event-evolution oriented.

> **All Phase 2 retrospective values are simulated prototype data and are not evidence of real model performance.**
> No real NWP data, no ML model and no real observation is used anywhere. The "AI output" is a deterministic,
> hand-constructed field, not the output of a trained model.

| What | Where |
|---|---|
| Data contract (TypeScript) | `src/retrospective/retrospective.types.ts` |
| Adapter (the only data entry point) | `src/retrospective/retrospective.api.ts` |
| Rich mock dataset (case 01) | `src/mockData/retrospective/case-01-extreme-precipitation/*.json` |
| Simplified mock cases (02, 03) | `src/mockData/retrospective/cases.json` |
| Dataset generator / validator | `scripts/generate-retrospective-case-01.mjs`, `scripts/validate-retrospective-case-01.mjs` |
| Satellite context (Phase 3D, simulated) | `src/retrospective/satellite/` (contract, adapter, alignment, **research + architecture in its README**), `components/ObservationalContext.tsx`, `components/SatelliteContextMap.tsx`, `mockData/.../case-01-extreme-precipitation/satellite.json` |
| Real historical case research (Phase 4A, docs only) | `src/retrospective/historical/README.md` |
| Page | `src/retrospective/Retrospective.tsx` |
| Components / helpers | `src/retrospective/components/`, `src/retrospective/retrospective.utils.ts` |
| **Weather analysis workbench (Phase 4 demo)** | `analysis/` (contract, adapter over the mock API adapters, deterministic field synthesis, simulated radar/satellite), `components/WeatherAnalysisWorkspace.tsx` (orchestrator) — see "Weather analysis workbench" below |
| Map building blocks (Phase 3) | `components/FieldMap.tsx`, `WeatherMapPanel.tsx`, `ComparativeWeatherMaps.tsx`, `DifferenceMap.tsx`, `ValidationStrip.tsx`, `LegendBar.tsx`, `MapLegend.tsx`, `src/retrospective/map/*` |
| Route / nav | `src/App.tsx`, `src/shared/Sidebar.tsx` |

## Data flow

```
case-01-extreme-precipitation/*.json   (cases.json + historicalReplay/mapLayers.json for cases 02/03)
   ↓  retrospective.api.ts  (snake_case JSON → camelCase contract, grid → GridPoint[])
RetrospectiveCase  (contract)
   ↓  getRetrospectiveCase(caseId)
Retrospective.tsx  (React state)
   ↓
components  (never import JSON directly)
```

## Case 01 — Extreme Precipitation (prototype)

A **fictional** slow-moving band of extreme precipitation near a coast (domain 17.5–19.5°N, 72.5–74.5°E, labelled
"Konkan–Maharashtra coast (prototype domain)"). The region only sets a geographic frame; there is no real event.
Time steps are synthetic (T0 … T+24h, 6-hourly, year 2099) so they cannot be mistaken for a real date.
Variable `precipitation_mm`, unit `mm/6h`.

```
case-01-extreme-precipitation/
  metadata.json     case_id, event_type, event_name, region, country, start_time, end_time, description,
                    prototype_status, source_type ("prototype"), source_name, data_status ("simulated")
  nwp.json          NWP-like field, 0.125° (~14 km) grid — broad, smooth, lower peak, lags the reference by 6 h
  ai_forecast.json  simulated "AI-refined" field, 0.05° (~5.5 km) grid — narrower, sharper, in step with the reference
                    (model_status "simulated", placeholder confidence)
  reference.json    simulated "actual" event, 0.05° grid — narrow band with an embedded convective core
                    (source_type "reference_simulation")
  anomaly.json      prototype-threshold exceedance + event footprint, derived from the three fields
  trajectory.json   evolution of the system over the time steps (evolving-footprint centroid)
  metrics.json      prototype calculations on the simulated fields (some "not_computed")
```

Grid files store one grid definition plus per-time-step 2-D arrays (`precipitation_mm[frame][row][col]` ↔
`latitudes[row]`, `longitudes[col]`; rows run north → south). The adapter expands this to
`{latitude, longitude, value}` points. NWP, AI and reference are deliberately different but physically related
(same band, drifting south-west → north-east; peaks ≈ 68 / 118 / 130 mm/6h).

- **Anomaly** (`anomaly.json`): for each dataset and time step, cells with `precipitation_mm ≥ prototype_threshold`
  (60 mm/6h — *not* an official IMD threshold) are exceedance cells; the largest 4-connected region is the event
  footprint, stored as cells (value, anomaly = value − prototype baseline 5 mm/6h), intensity peak, centroid,
  bounding region and area. Some time steps have no footprint (`footprint: null`), e.g. the NWP field stays below
  the threshold until T+18h.
- **Trajectory** (`trajectory.json`): a precipitation band is not a cyclone-like point track, so this is
  `representation: "evolving_footprint_centroid"` — per dataset and time step, the intensity-weighted centroid of
  cells ≥ 50 % of the field maximum, its intensity and its exceedance-footprint area.
- **Metrics** (`metrics.json`): peak intensity (+ error), mean absolute error, spatial overlap (IoU), centroid
  distance, affected area (+ difference) and timing difference are *calculated from the simulated fields*
  (`status: "simulated"`, `scope` says over which frame/grid). Event detection score and confidence calibration are
  `not_computed` with `null` values. Because the fields were constructed to illustrate refinement, these numbers say
  nothing about real model skill.
- **Provenance**: every dataset carries `source`, `source_type`, `data_status: "simulated"`, `variable`, `unit`,
  `resolution_deg/km` and `valid_times`; the contract mirrors this in `Provenance`. The UI shows "Simulated" badges
  and a page-level banner while `provenance.isMock` is true.

Cases 02 (heatwave) and 03 (cyclone) stay simplified: one time step, no anomaly/trajectory.

## Weather analysis workbench (Phase 4 demo)

One reusable workspace (`WeatherAnalysisWorkspace`) serves every event type. It consumes a single contract,
`WeatherAnalysis` (`analysis/analysis.types.ts`), so the UI never knows where the numbers came from.

```
existing mock API adapters (event-monitor, dashboard, event-detail, historical-replay)  ─┐
retrospective.api.ts (case 01)                                                            ├─→ analysis/analysis.adapter.ts
deterministic frontend simulation (analysis/fieldSynth.ts, only where the mock has no grid) ┘        ↓ WeatherAnalysis
                                                                                            WeatherAnalysisWorkspace
```

There is **no HTTP backend** in this repository: the "mock backend API" is the existing `*.api.ts` adapters over
`src/mockData`. `analysis.adapter.ts` is the only file that reads them; a real backend replaces its inputs, not the UI.
The header comment there lists every backend field → UI mapping, and the page shows it under "Backend data → UI mapping"
(each row tagged Backend mock / Derived / Prototype constant).

Scenarios (Weather event selector → Scenario): Extreme Precipitation (backend AS-01, NE-04; retrospective case 01),
Heatwave (backend heatwave replay mock), Cyclone (backend BOB-02). Old ids `case-b-heatwave` / `case-c-cyclone` redirect.

- **Variables** per event (Precipitation / Temperature / Wind / Pressure); pressure is shown as a deficit below 1010 hPa.
  Amplitudes come from backend values (peak rainfall, max wind, central pressure, Tmax peaks); shapes, sizes and
  orientations from `trajectory.hazardFootprint` / `telemetry`; motion from the backend track; evolution from the dashboard
  forecast timeline (BOB-02) or a derived bump. Thresholds are **prototype** thresholds (backend hazard threshold for
  precipitation; 0.7 × backend peak or a stated constant otherwise) — never official.
- **Data views** (one primary visualization at a time): NWP · AI REFINED · (REFERENCE, case 01 only) · DIFFERENCE (AI − NWP,
  diverging) · ANOMALY (exceedance above the prototype threshold, with a heatmap of the strongest cells) · SATELLITE · RADAR.
  **Comparison** layout: INPUT | AI REFINED | REFERENCE-or-CONTEXT (synchronized maps) + difference map.
- **Context layers** (`analysis/contextSynth.ts`) are SIMULATED: radar = Marshall–Palmer reflectivity from the AI
  precipitation field with deterministic texture inside a 220 km range circle; satellite = brightness-temperature style raster
  from the same field (clear-sky hot surface for the heatwave). No real IMD radar / INSAT image is used. Opacity control included.
- **Overlays** (`FieldMap`): backend uncertainty cone and affected-region polygons, centroid/track path (system track for the
  cyclone, evolving footprint centroid for precipitation, heat-core movement for the heatwave), footprint outlines.
  MapLibre-native heatmap/line/fill layers are used; **deck.gl is not installed** (nothing here needs GPU-scale rendering).
- **Panels**: AI REFINEMENT (simulated numbers of the step; "Prototype confidence", "Simulated AI output — not a measured
  model result"), ANOMALY SUMMARY (peak, affected area, confidence, duration, magnitude), FORECAST EVOLUTION (intensity /
  area / confidence vs lead; clicking a chart sets the shared step).
- The page's `TimeStepSelector` is the only time control (Play advances the same state and stops at the last step).

## Geospatial map building blocks (Phase 3A / 3B)

`useFieldData` (`map/useFieldData.ts`) builds grids, samplers, footprint outlines and centroid paths once per selected
variable. `FieldMap` is the only MapLibre lifecycle; `MapSyncGroup` (`map/mapSync.ts`) keeps comparison maps on one camera.
For retrospective case 01 the workspace also shows `ValidationStrip` (existing simulated metrics) and the simulated
satellite-alignment panel (`ObservationalContext`).

- **Default camera (Phase 3C)**: derived from the case data, not hardcoded. `useFieldData` computes `focus`: the bounding box
  of every exceedance footprint (all datasets, all time steps, `anomaly.*.footprint.boundingRegion`) plus a 40 % margin
  (min 0.15°), clamped to the grid `extent`; with no footprints it falls back to the full grid extent. `FieldMap` fits the
  camera to `focus` on load and refits whenever its container is resized, until the user pans or zooms
  (`MapSyncGroup.pristine`). Padding is capped to half of each dimension so a small container can never produce a
  world-scale view. The user can still zoom out and pan freely; all maps in the group move together.
- **Reference places**: `map/places.ts` is a small gazetteer of real Indian cities; those inside the extent are drawn as
  light labels (the local basemap has no text layer). They are geographic context only — not case data.
- **Props only**: components receive `FieldData` / contract data from `Retrospective.tsx`; nothing reads JSON.
- **Legend**: variable and unit come from the data (`Precipitation`, `mm / 6h`; differences e.g. `AI refined − NWP`). The
  prototype threshold is shown only when the contract exposes it, labelled "Not an official IMD threshold."
- **Layers** in `FieldMap` (bottom → top): base geography · field raster · graticule · coast · centroid path · footprint
  outlines · footprint centroids.

### Technology decision

MapLibre GL JS. The data is regular lat/lon grids at two resolutions (NWP 0.125°, AI/reference 0.05°) plus footprints,
and the demo must run offline and deterministically.

- Fields are rasterized to a canvas **per pixel in Web-Mercator space** (`map/rasterize.ts`) and draped over the map as an
  image source. Each grid is sampled at its native cell size (nearest), so the coarser NWP cells stay visibly coarser than
  the AI/reference cells. Differences sample both grids at the same pixel (bilinear), which works across resolutions
  without regridding.
- The footprint outline is derived from the footprint cells by dropping shared edges (`map/footprintGeo.ts`).
- **Basemap**: Natural Earth land polygons (public domain, from the `world-atlas` package, 50 m) rendered locally — no tile
  server, no network requests, works offline. Replace `map/basemap.ts` to use a tile basemap later. If India-wide maps
  are added, review how national boundaries are drawn before adding a country/border layer.
- **Not chosen**: deck.gl (GPU layers for very large grids; the planned overlay if real grids get large), Leaflet (weak
  for custom raster/scientific rendering), OpenLayers (heavier and more than a regional prototype needs), Cesium (3D globe,
  out of scope), H3 (resamples a regular grid into hexagons, destroying the NWP/AI cell relationship), D3/SVG (would need
  hand-built zoom, projections and scaling to India-wide grids).

### Performance / loading

`Retrospective` is lazy-loaded from `App.tsx`, and the map components (MapLibre, ~1 MB / 282 kB gzip) and the land
polygons (`land-50m`, ~546 kB / 179 kB gzip) are separate lazy chunks, so none of them is in the main bundle. MapLibre's
worker is bundled by Vite and registered with `setWorkerUrl` (`?worker&url`), because MapLibre otherwise looks for its
worker next to its own file, which breaks under Vite pre-bundling and chunking.

## Satellite observational context (Phase 3D)

A collapsed, secondary "Observational context" panel below the metrics. For this synthetic case it shows a clearly labelled
**SIMULATED** context (a synthetic brightness-temperature field built from the simulated reference — not INSAT/MOSDAC data and not
validation). Each analytic step is aligned to the satellite time as MATCHED / NEARBY / MISSING; MISSING shows no frame. Real
satellite imagery is deliberately not used with synthetic cases (`CaseInfo.caseKind`). Research, product comparison, MOSDAC access and
the eventual backend architecture: see `satellite/README.md`.

## Regenerating / validating the case-01 data

```bash
node scripts/generate-retrospective-case-01.mjs   # deterministic; rewrites the JSON files
node scripts/generate-retrospective-satellite-mock.mjs   # simulated satellite context (run after the above)
node scripts/validate-retrospective-case-01.mjs   # structure, coordinates, timestamps, units, spacing, NaN,
                                                  # NWP≠AI≠Reference, footprint re-derived from the fields
```

The generator uses analytic Gaussian bands only — no randomness — so output is identical on every run.

## Replacing the simulated data with real data

The replacement point is `retrospective.api.ts`. Keep the two exported functions and their return types:

- `getRetrospectiveCases(): Promise<RetrospectiveCaseOption[]>`
- `getRetrospectiveCase(caseId): Promise<RetrospectiveCase>`

1. **NWP** → real historical NWP/reforecast fields (label the actual source; never claim NCMRWF/IMD unless true).
2. **AI output** → real model inference (e.g. a pretrained weather model) produced *without* access to the reference.
3. **Reference** → a real reanalysis/observation dataset.
4. Recompute `anomaly` / `trajectory` / `metrics` from the real fields (the derivation in `anomaly.json` is the recipe;
   use a documented threshold, not the prototype one).
5. Set `provenance.isMock = false`, `dataStatus: 'real'` and a real `kind`; set a metric's `status` to `'computed'`
   only if it comes from a documented experiment. Delete the mock-only code and JSON.

Components import only the types file and the adapter, so they should not need changes.

## Rules

- Never present simulated values as real results. Use the labels "Forecast (NWP)", "AI output" and "Reference".
- Metrics with `status: 'pending'` have `null` values; do not fill them with invented numbers.
- Do not describe simulated thresholds as official thresholds.
