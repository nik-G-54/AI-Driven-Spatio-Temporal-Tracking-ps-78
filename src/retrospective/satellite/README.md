# Satellite observational context — research and architecture (Phase 3D)

> Status: **research + architecture + a clearly labelled SIMULATED context.** No real satellite data is downloaded,
> displayed or referenced by values anywhere in this repository. Nothing here validates the AI output.

Satellite data is **observational context** for the NWP → AI refinement → Reference workflow. It is not a basemap, not a
model input, and not a validation score.

## 1. Official sources investigated

Retrieved during Phase 3D (pages that were unreachable are listed under "Not verified").

| Source | What it gave us |
|---|---|
| MOSDAC, *User Manual for MOSDAC Data Download API* — https://www.mosdac.gov.in/downloadapi-manual | Search vs download authentication, config parameters (`datasetId`, `startTime`/`endTime`, `boundingBox`, `count`, `gId`), quota, lockout |
| MOSDAC, *Satellite Data Download API* one-pager — https://www.mosdac.gov.in/sites/default/files/docs/MOSDAC_Satellite_Data_Download_API.pdf | "OpenAPI based search", SSO authentication, archive **and** near-real-time download, Python 3 + `requests` client (`mdapi.zip`) |
| SAC-ISRO MMDRPS, *INSAT-3DS Operational Data Products Types and Processing Levels* (MOPD/PMPG/SIPA/T01/SEP-2024, V1 Feb 2025) — https://mosdac.gov.in/docs/INSAT-3DS_Operational_Products_V1.pdf | Authoritative product list: codes, levels, formats, grids; nomenclature of HDF files and JPG chips |
| MOSDAC, INSAT-3D Payloads — https://www.mosdac.gov.in/insat-3d-payloads | Imager channels, wavelengths, nadir resolution, frame time |
| MOSDAC, INSAT-3D Data Products — https://www.mosdac.gov.in/insat-3d-data-products | Imager/sounder derived product lists; processing levels |
| MOSDAC, INSAT-3DS Introduction — https://mosdac.gov.in/insat-3s-introduction | Launch (17 Feb 2024, GSLV-F14), payloads, minimum mission life 7 years |
| IMD, Satellite Meteorology Services — https://mausam.imd.gov.in/responsive/servicesSatMet.php | INSAT-3D/3DR operations, product families, 48 passes/day/satellite in staggered mode ("a new set … after every fifteen minutes"), public dissemination since 1996 |
| MOSDAC home / registration / open-data search results | Free, open access to derived products for non-commercial use; MOSDAC single sign-on used to download |
| IMD *MAUSAM* journal (search results only) | Hydro-Estimator and IMSRA rainfall are retrievals that IMD evaluates against gauge-based rainfall |

**Not verified** (say so rather than assume): the MOSDAC *Open Data* page returned HTTP 403 to our fetch; the FAQ page for
"download without a username" returned 404; the actual HTTP search endpoint URLs and response schema of the Download API are
not documented in the pages we could read (only the client and its config); the timestamp granularity of `startTime`/`endTime`
(the manual shows `YYYY-MM-DD` dates); whether MOSDAC offers browse tiles / WMS. **UNKNOWN — requires confirmation with
MOSDAC documentation or the client source (`mdapi.zip`) before implementation.**

## 2. Available products (documented characteristics)

INSAT-3D and INSAT-3DR (2013 / 2016) and INSAT-3DS (Feb 2024) are geostationary meteorological satellites carrying a 6-channel
Imager and an 18-channel Sounder. Imager channels (INSAT-3D): VIS 0.52–0.72 µm and SWIR 1.55–1.70 µm at 1 km; MIR 3.80–4.00 µm,
TIR-1 10.2–11.2 µm and TIR-2 11.5–12.5 µm at 4 km; WV 6.5–7.0 µm at 8 km (4 km on INSAT-3DS). Frame time ≈ 25 min (normal mode).
Files are **HDF5 (`.h5`)**; JPG "chips" are generated per band; Fire/Smoke are KML.

Internal comparison (documented characteristics only; this is not a ranking):

| Product (3DS code) | Purpose | Useful for Case 01? | Temporal | Spatial | Future integration difficulty | Recommended role |
|---|---|---|---|---|---|---|
| **IR1/TIR-1 brightness temperature** (`3SIMG_L1B_STD`, `L1C_SGP`, `L1C_ASIA_MER`) | Cloud-top temperature; cold tops indicate deep convection | Yes — visual context for where deep convection is | Each acquisition; day and night | 4 km at nadir | Medium: HDF5 → clipped grid; JPG chips lack georeferencing on their own | **Observational context panel** (implemented as a *simulated* analogue) |
| VIS / SWIR imagery | Cloud texture, thickness, microphysics | Partly — daytime only (reflected sunlight) | Daytime | 1 km | Medium (same as above) | Optional context, daytime |
| **WV** (water vapour) imagery | Upper-level moisture and flow patterns | Partly — synoptic setting | Day and night | 8 km (3D/3DR), 4 km (3DS) | Medium | Context |
| **HEM** — rainfall using Hydro Estimator (`L2B_HEM`, daily `L3B_HEM`) | Satellite rainfall **estimate**, per pixel | Yes — an independent rainfall estimate on the same variable | Each acquisition (+ daily) | Per pixel (~4 km) | Medium–high: retrieval product, needs bias awareness | **Separate "satellite estimate" comparison**, never labelled truth/reference |
| **IMC** (IMSRA corrected, `L2B_IMC`) / **IMR** (IMSRA gridded, `L2G_IMR`) / **GPI**, `L2G_GPI` (QPE family) | Multispectral rainfall estimates; IMR 0.25°, GPI 0.5° | Yes for regional totals; coarse for a 2° domain | Each acquisition (+ daily) | Per pixel / 0.25° / 0.5° | Medium–high | Estimate panel (coarse) |
| **OLR** (`L2B_OLR`, daily `L3B_OLR`) | Outgoing longwave radiation, convection proxy | Marginal at this scale | Each acquisition (+ daily) | Per pixel | Medium | Regional/synoptic context |
| **Cloud products**: mask `L2B_CMK`, top properties `L2B_CTP` (9×9 box), day microphysics `L2C_CMP` | Cloud classification / top height, phase | Supports convective interpretation | Each acquisition | Per pixel / 9×9 box | Medium | Supplementary context |
| **CMV / WVW / AMV winds** (3DS: merged `L2P_AMV`; wind-derived `L2G_WDP` 0.5°) | Atmospheric motion vectors | Not for Case 01 rainfall; relevant to flow (planned wind phase) | Each acquisition | Point data / 0.5° | Medium–high | Later, wind-context phase |
| **TPW / UTH** (`L2B_TPW`, `L2B_UTH`) | Precipitable water, upper-tropospheric humidity | Environment/moisture context | Each acquisition | Per pixel | Medium | Supplementary |
| Daily L3 binned products | Daily aggregates | Not for 6-hourly steps | Daily | — | Low–medium | Not aligned to the analytic steps |

Important: rainfall from HEM/IMC/IMR/GPI is a **retrieval** with its own error, not an observation of rain on the ground. It can be
compared with, but must never replace, the **Reference** (e.g. reanalysis / gauge-based data) of the retrospective experiment.

## 3. Data access (MOSDAC Data Download API)

- **Search**: does not require authentication. It needs a `datasetId` (product code such as `3SIMG_L1B_STD`; found via MOSDAC's
  catalog) and accepts optional `startTime`/`endTime` (`YYYY-MM-DD`), `boundingBox` (`minLon,minLat,maxLon,maxLat`), `count`
  (max 100 per request) and `gId` (granule).
- **Download**: requires **MOSDAC single sign-on credentials** (`username`, `password`). Three consecutive failed logins lock the
  account for one hour. Quota: **5,000 files per day per user**.
- **Formats**: HDF5 products, JPG chips, KML for fire/smoke. The Download API's own response format is UNKNOWN (not in the pages we
  could read). MOSDAC states derived products are free and open for non-commercial use.
- **Historical and near-real-time** are both supported by the API according to MOSDAC.
- **A frontend must never call this API with credentials.** The client is a Python script (`mdapi.py`, requires Python 3 +
  `requests`) driven by a config file. Eventual architecture:

```
Frontend  →  our backend (holds MOSDAC credentials, quota, caching)  →  MOSDAC  →  HDF5 / JPG
                    ↓ converts, clips to the case bbox, records provenance
             SatelliteContext (this contract)  →  Frontend
```

## 4. Case compatibility

Case 01 is a **synthetic prototype** (synthetic 2099 timestamps, synthetic domain event, simulated NWP / AI / reference). Real
satellite imagery — current or archived — cannot honestly be placed behind it: there is no real event, so any real image would be
from a different time and a different weather situation, and would look like observational agreement that does not exist.
Therefore `CaseKind` is part of the contract:

| `caseKind` | Satellite context |
|---|---|
| `synthetic_prototype` (all current cases) | Real satellite **disabled**. A clearly labelled *simulated* context may exist to demonstrate the interface (case 01 only); other cases: unavailable. |
| `historical_real` | Real context possible, aligned to the case's real timestamps and domain (not implemented). |
| `realtime` | Real context possible when the source has data (not implemented). |

## 5. Contract and adapter

- `satellite.types.ts` — `SatelliteContext` (availability `simulated | real | unavailable`, observations, per-step alignment,
  tolerance), `SatelliteObservation` (satellite, sensor, product + product code, variable, unit, `validTime`, `bbox`,
  resolution, raster as clipped **grid** or geo-referenced **image**, coverage, provenance incl. `datasetId`, `retrievedAt`,
  `dataStatus: simulated | real`).
- `satellite.utils.ts` — `alignObservations`: **MATCHED** (exact time), **NEARBY** (within `toleranceMinutes`; shown as
  "Nearest available observation" with its own timestamp and signed offset), **MISSING** (nothing in tolerance; **no frame is
  shown** and the nearest time is only listed). A frame from another time is never silently substituted.
- `satellite.api.ts` — `getSatelliteContext({ caseId, caseKind, steps })`. Today: simulated context for case 01, unavailable
  otherwise. **This function is the replacement point** for a backend-backed real source; the UI does not know which source it
  gets.
- Spatial rule: observations carry `bbox` and either a regular grid or an image with its exact bounds, so they can be clipped to the
  case domain and drawn without stretching.

## 6. What is simulated

`src/mockData/retrospective/case-01-extreme-precipitation/satellite.json` (generated by
`scripts/generate-retrospective-satellite-mock.mjs`): a synthetic "IR brightness temperature" grid (K, 0.04°) built
from the **simulated reference precipitation field** (colder where the simulated rain is, with a wider cloud shield). It carries **no
independent information**, satellite = "None (prototype)", product code null, `dataStatus: simulated`. Four frames — T0 (exact),
T+6h + 15 min (NEARBY), T+12h (exact), T+24h (exact) — and **no T+18h frame** (MISSING), to exercise the alignment logic.

## 7. UI options and decision

- **Option A — layer toggle on the four analytical maps** (☐ Satellite context): overlays satellite on NWP / AI / Reference / Difference.
  *Trade-offs*: a spatial overlay is natural for a footprint check; but it puts a fifth semantic layer on four synchronized maps,
  competes with the precipitation colours, makes one observation look like part of each model's field, and hides temporal
  mismatches (a single frame under several timestamps).
- **Option B — dedicated observational panel** (analytical field ↕ satellite observation): a separate, synchronized panel.
  *Trade-offs*: less direct pixel overlay; but the observation's own timestamp, alignment status and provenance are always shown
  next to it, the analytical maps stay clean, and it can be collapsed so the core comparison remains the page.

Decision for now: **Option B**, collapsed by default and secondary ("Observational context · Satellite context: Prototype ·
SIMULATED"), sharing the time step and camera, with the reference footprint outlined for spatial reference. An optional
layer toggle (Option A) can be added later only for a real, aligned case.

## 8. Requirements the eventual real implementation must keep

- Always show the satellite timestamp and alignment status; never hide temporal provenance.
- Show product name/code and `datasetId`; distinguish observation (imagery, brightness temperature) from retrieval (rainfall estimates).
- Never label satellite data as validation of the AI output unless an actual, documented comparison is computed.
- Real data only for `historical_real` / `realtime` cases; never behind a synthetic case.

## 9. PS alignment check

- *Does satellite context help extend meteorological model output?* Indirectly: it lets a forecaster see whether an AI-refined
  extreme-precipitation footprint sits where deep convective cloud exists. It is context, not a model improvement.
- *Does it support validation/context?* Context: yes. Validation: only if a real comparison (e.g. HEM vs the AI field with defined
  metrics) is computed later; it is not claimed now.
- *Does it help forecasters inspect dangerous events?* Yes, as a secondary panel on the same map, time step and camera.
- *Does it remain secondary to the ML refinement pipeline?* Yes: collapsed, a separate panel, no effect on any analytical number,
  no new page, no live feed. Proposals that turn the page into a generic satellite/weather dashboard (live imagery, satellite
  basemap, product browser) are intentionally not implemented.
