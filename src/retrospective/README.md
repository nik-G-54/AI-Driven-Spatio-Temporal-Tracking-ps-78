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
| Page | `src/retrospective/Retrospective.tsx` |
| Components / helpers | `src/retrospective/components/`, `src/retrospective/retrospective.utils.ts` |
| Geospatial validation view (Phase 3A/3B) | `components/PrecipitationWorkspace.tsx` (orchestrator), `FieldMap.tsx`, `ComparativeWeatherMaps.tsx`, `DifferenceMap.tsx`, `AnalyticalWeatherMap.tsx`, `TemporalEvolution.tsx`, `ValidationStrip.tsx`, `LegendBar.tsx`, `MapLegend.tsx`, `src/retrospective/map/*` |
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

## Geospatial validation view (Phase 3A / 3B)

Shown for the precipitation case only (`eventType === 'extreme_rainfall'`); other cases show a notice and the
placeholder panels. Everything is still simulated.

`PrecipitationWorkspace` builds `FieldData` once (`map/useFieldData.ts`: grids, samplers, footprint outlines, centroid
paths) and lays out, top to bottom:

1. **Comparison** (default view): **NWP | AI REFINED | REFERENCE** at the same time step. The three maps
   (`ComparativeWeatherMaps`) share one geographic extent, one colour scale and one viewport (`map/mapSync.ts` moves
   the others when any map is panned or zoomed). Each shows its own exceedance-footprint outline and the centroid path of
   the evolving footprint (current step highlighted), with peak / footprint stats underneath, and one shared legend.
2. **Difference map** (`DifferenceMap`, same size and viewport as the three maps): default *AI refined − NWP*, with
   *AI refined − Reference* and *NWP − Reference* as secondary options. Diverging scale; solid/dashed outlines show the
   footprints of the two operands.
3. **Footprint evolution** (`TemporalEvolution`): footprint area and peak per dataset per time step (bars), from `anomaly`;
   the centroid coordinates come from `trajectory` (`evolving_footprint_centroid`, *not* a cyclone-style track). Clicking a
   column sets the shared time step.
4. **Simulated prototype metrics** (`ValidationStrip`): existing simulated metrics only (peak, MAE, spatial overlap,
   centroid distance, affected area, peak timing). The detailed table with scope/notes is under a disclosure.

The **Single field** view (`AnalyticalWeatherMap`, the Phase 3A map: NWP / AI REFINED / REFERENCE / DIFFERENCE with a
legend overlay) is available from the View switch. The page's `TimeStepSelector` is the only time control; its optional
Play button advances the same state and stops at the last step. Manual selection always works and pauses playback.

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

## Regenerating / validating the case-01 data

```bash
node scripts/generate-retrospective-case-01.mjs   # deterministic; rewrites the JSON files
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
