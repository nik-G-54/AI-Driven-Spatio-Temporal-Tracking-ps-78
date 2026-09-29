# Real historical case — research and data plan (Phase 4A)

> **Status: research and architecture only.** Nothing was downloaded, no API was called from the app, no credentials were created,
> no dataset was ingested, and Case 01 (the synthetic prototype) is untouched. There is **no trained ML model**; the AI output for any
> historical case will remain **simulated** until a real model exists. This document does not claim that any AI predicted anything.

## How to read the verification tags

Every factual claim carries a tag saying how well it was checked during Phase 4A:

| Tag | Meaning |
|---|---|
| **[V]** | Read on the authoritative page/PDF during this phase |
| **[S]** | Appears only in a web-search result snippet (authoritative domain), the page itself could not be fetched |
| **[N]** | Media / secondary source — used to locate facts, **not** sufficient as a data source |
| **[U]** | **UNKNOWN — requires confirmation** before implementation |

Fetch failures in this phase (so these were **not** read directly): the NCMRWF data portal (`ncmrwf.gov.in/data`, connection refused), the IMD
Pune gridded-data pages (connection refused / 404), the MOSDAC *Open Data* page (403), and all IMD press-release PDFs cited under "Candidate
events" (404 to our fetcher).

Vocabulary used throughout (it matters scientifically):

- **Forecast model output** — a model run started at time *t0* predicting later times (has a *lead time*).
- **Reanalysis** — a model + data-assimilation reconstruction of the *past* (no lead time; e.g. ERA5, IMDAA). **Not** a forecast.
- **Observation** — measured (rain gauge, radar, satellite radiance). **Retrievals** (e.g. satellite rainfall estimates) are derived from
  observations by an algorithm and have their own error.

---

## 1. Candidate events

Five events, chosen so that the type and variable coverage matches the PS (precipitation, cyclone, heat) and so that the *data era* is
covered by real forecast archives (Section 2). They are listed factually, not ranked.

### 1.1 Kerala extreme rainfall — August 2018 (extreme precipitation)
- **Region / extent**: Kerala and the southern Western Ghats; state-scale (order of 1° × 4°) [S/V: region from IMD Chennai report].
- **Timing / duration**: IMD's regional report names *2nd–3rd weeks of August 2018* for the unprecedented flooding; the three major rainfall
  weeks of the season were 7–13 Jun, 12–18 Jul and **9–15 Aug**; Kerala came under "excess" continuously from the week ending 15 Aug **[V]**
  (IMD Chennai, *Regional Report on Southwest Monsoon 2018*, `mausam.imd.gov.in/chennai/mcdata/sw_monsoon_2018.pdf`).
- **Documented facts** [V]: Idukki recorded 379 cm (+67 %) in Jun–Sep 2018; Kerala had 6 days of isolated *extremely heavy* rainfall in the season; the
  report states rainfall was the main factor but terrain, dam management and drainage also mattered.
- **PS relevance**: orographic, multi-day extreme rainfall over a coastal mountain range — the kind of localized extreme that coarse NWP smooths.
- **Observations/satellite named by IMD for 2018** [V]: INSAT-3D imagery and GPM satellite+gauge merged 24-h rainfall are used in the same report.

### 1.2 Konkan–Maharashtra extreme rainfall — 21–23 July 2021 (extreme precipitation)
- **Region / extent**: Konkan (Raigad, Ratnagiri) and the adjoining Western Ghats (Satara / Mahabaleshwar); domain of order 2°–3° [N + S].
- **Timing / duration**: heaviest rain around 21–23 July 2021 **[N]**; IMD warned of *isolated extremely heavy falls over Konkan & Goa and adjoining ghat areas of Madhya
  Maharashtra on 22 July 2021* and, earlier, of extremely heavy falls over Konkan & Goa on 15 July **[S]** (IMD press-release titles/snippets; PDFs not fetchable).
- **Media-reported values (not for use as data)** **[N]**: Mahabaleshwar 483 mm in ~17 h (0830 IST 22 Jul – 0100 IST 23 Jul) after 461 mm in the preceding 24 h; Chiplun > 300 mm; flooding in Ratnagiri/Raigad.
  These must be replaced by IMD station data (chargeable, Section 3.4) before any use.
- **Synoptic cause** **[S]**: offshore trough, cyclonic vortices over the north Konkan coast, an east–west shear zone, and a Bay of Bengal low (IMD extended-range text).
- **PS relevance**: ghat-scale orographic extreme, directly analogous to Case 01's Konkan frame; strong localization contrast with coarse NWP.

### 1.3 Cyclone Tauktae — 14–19 May 2021 (cyclone)
- **Track / extent**: formed over Lakshadweep/SE Arabian Sea (night of 14 May), Severe (15 May), Very Severe (16 May), Extremely Severe (early 17 May) with max intensity 180–190 km/h
  gusting to 210 km/h; crossed the Saurashtra coast near 20.8°N 71.1°E (~20 km NE of Diu) during 1430–1730 UTC on 17 May; weakened over Saurashtra/Gujarat by 18 May **[S]** (IMD reports/press releases;
  the 10 MB IMD preliminary report could not be fetched). Basin/regional scale (~10° of latitude along the west coast).
- **PS relevance**: cyclone with wind/pressure structure and a long lead-time forecast problem; the current UI is precipitation-centric, so this needs different variables and layers.

### 1.4 Cyclone Biparjoy — June 2023 (cyclone)
- **Landfall** **[S]**: crossed the Saurashtra & Kutch coasts between Mandvi and Karachi, near Jakhau Port (~23.28°N 68.56°E), between 2230 and 2330 IST on 15 June 2023; max sustained wind 115–125 km/h gusting to 140 km/h on approach (IMD press release / bulletin).
- **PS relevance**: long-lived Arabian Sea cyclone; a MAUSAM paper on the June 2023 heat-wave/Biparjoy interplay exists **[S]**.

### 1.5 North / central India heatwave — March–May 2022 (heatwave)
- **Documented** **[S]**: March 2022 highest average maximum temperature in 122 years (1901–2022) and April third highest; 10–20 heat-wave days over major parts of NW and central India in April vs normal 1–5; ~70 % of India affected by 29 April (IMD/press snippets).
  IMD authors' MAUSAM paper *Unprecedented hot weather diagnosis in India during March–April 2022* **[V]** (abstract read): attributes it to Arctic warming effects on the westerly jet, fewer western disturbances and a mid-tropospheric anticyclone over Pakistan.
- **Extent**: subcontinent-scale, weeks-long. **PS relevance**: extreme temperature; but a slowly varying, very large-scale field where "localization of a peak" is a different problem from rainfall.

---

## 2. NWP sources (historical model output)

| Source | Forecast / reanalysis / obs | History | Resolution | Variables | Access | Licence |
|---|---|---|---|---|---|---|
| **TIGGE archive** (ECMWF portal/MARS) — includes **NCMRWF** (joined **Aug 2017**) and **IMD** (joined **Jul 2020**) **[V]** (TIGGE partner list, licence page) | **Forecast** (ensemble) | From Oct 2006; NCMRWF from 1 Aug 2017 [V/S]; IMD from Jul 2020 [V] | Provider-chosen; TIGGE range 0.12°–0.94° **[V]**; NCMRWF's ensemble (NEPS-G) is 12 km native **[S]**; its TIGGE grid **[U]** | Precipitation and pressure-level data available **[V]**; levels 1000/925/850/700/500/300/250/200/50 hPa **[V]**; exact NCMRWF/IMD parameter list and step interval **[U]** | ECDS/CDS web forms (login) or MARS TIGGE catalogue **[V]**; retrieval script: **[U]** | **CC BY-NC 4.0 (non-commercial)** for IMD, NCMRWF, BoM, CMA, CPTEC, JMA, MF; CC BY 4.0 for ECMWF, NCEP, UKMO, DWD, ECCC, KMA **[V]**; real-time users have a 48 h delay **[V]** |
| **NOAA GFS 0.25° historical archive** (NCAR RDA d084001; NCEI) | **Forecast** (deterministic) + analysis | **15 Jan 2015** onward **[V]** | 0.25° **[V]** | 37+ variables incl. temperature, precipitation, winds; steps every 3 h to 240 h and 12 h to 384 h; cycles 00/06/12/18 UTC **[V]**; level list **[U]** | GRIB2 **[V]**; THREDDS/AWS copy mentioned **[V]**; RDA login requirement **[U]**; AWS bucket `noaa-gfs-bdp-pds` keeps only a trailing window **[S]** | CC BY 4.0 **[V]** |
| **ECMWF Open Data** (IFS, AIFS) | **Forecast** | **Only the most recent ~12 runs (≈2–3 days) are retained** **[V]**; history needs a Service Agreement | 0.25° GRIB2 **[V]** | Surface and pressure-level parameters **[V]** | AWS/Azure/GCP, `ecmwf-opendata` client **[V]** | CC BY 4.0 **[V]** |
| **NCMRWF operational NCUM-G / NEPS-G** (direct) | **Forecast** | Archive access **[U]** — portal unreachable; the portal advertises IMDAA and NGFS reanalysis datasets with registration **[S]** | 12 km global NCUM-G **[S]** | GRIB2/NetCDF4 produced by UMRider for distribution **[S]** | **[U]** | **[U]** |
| **IMDAA** (NCMRWF/IMD/UKMO) | **Reanalysis** (not a forecast) | 1979–2018, extended to 2020 **[S]** | ~12 km (0.12°), hourly **[S]** | 57+ variables, 63 pressure levels **[S]** | NCMRWF Reanalysis Data Service (login) **[V: portal exists]**; detail **[U]** | **[U]** |
| **ERA5** (ECMWF/C3S) | **Reanalysis** (not a forecast) | 1940–present, ~5-day latency **[V]** | 0.25°, hourly **[V]** | Total precipitation, 2 m temperature, 10 m wind, mean sea-level pressure and more **[V]**; **precipitation is a model forecast field, not an observation** **[V]** | CDS account + CDS API **[V]** | CC BY **[V]** |

Model-side input notes (for a *future* ML step, not decided here): Pangu-Weather takes 5 upper-air variables (Z, Q, T, U, V) on 13 levels plus 4 surface variables (2 m T, 10 m U/V, MSLP) at 0.25°, trained on ERA5 **[S]**; GraphCast is trained on ERA5 at 0.25°, treats precipitation as an auxiliary field because ERA5 precipitation is biased **[S]**.
TIGGE's pressure levels (9 levels listed) do **not** cover all 13 Pangu levels (missing e.g. 400, 600, 150, 100 hPa) **[V/S]**, GFS 0.25° and ERA5 need level checks **[U]**.

## 3. Reference / observation sources

"Reference" means the dataset the forecast and AI output are compared with. Its relationship to the NWP input must be stated: **a reference derived from the
same model, or from the same synthetic field, is not independent validation.**

| Source | What it measures | Resolution | Uncertainty / caveats | Suitable as reference? | Independent of NWP input? |
|---|---|---|---|---|---|
| **IMD 0.25° daily gridded rainfall** (IMD Pune; Pai et al., MAUSAM 2014) | Gauge-based analysis: daily rainfall from **6,955 gauges** interpolated with the Shepard method **[S]**; the download page lists 1901–2024 **[S]**; binary (135 × 129 grid, 6.5°N/66.5°E → 38.5°N/100.0°E, mm) **[S]** and NetCDF **[S]** | 0.25°, **daily** | Interpolation smooths point extremes; gauge density limited in the ghats **[U]**; day definition (expected 0830 IST) **[U]**; a *real-time* GPM+gauge merged 0.25° version also exists on the IMD site **[V: download page listing]** | **Yes, for rainfall** — the natural Indian reference | Yes (gauge-based; not a forecast product) — **to be stated, not assumed**: whether NWP assimilated the same gauges **[U]** |
| **IMD station data** (Data Supply Portal) | Point rain-gauge data (hourly/daily) | Stations | Registration with ID + undertaking, form, **chargeable, 18 % GST** **[S]** | Yes (highest fidelity), but purchase-dependent | Yes |
| **GPM IMERG** (NASA) | Satellite **retrieval** of precipitation | ~0.1°, half-hourly **[V]** | Early ~4 h, Late ~12–14 h, Final ~3.5 months latency; Final is gauge-adjusted monthly (GPCC); less certain in mountainous terrain **[V]** | Useful as a *sub-daily* comparison, with stated error | Independent of NWP; **not independent of "satellite context"** conceptually (both satellite-based) |
| **INSAT HEM / IMC / IMR / GPI** (MOSDAC) | Satellite rainfall **estimates** | Per pixel / 0.25° / 0.5° **[V]** | IMD studies evaluate HE/IMSRA against gauge rainfall (they are estimates that themselves need validating) **[S]** | Estimate panel, **never** labelled truth | Independent of NWP; same satellite as the context layer |
| **ERA5 / IMDAA** | Reanalysis fields | 0.25° / 0.12° | Precipitation is model-produced | **Not** an observation reference for rainfall; usable as a consistent *analysis* of state variables | **Not independent** of model physics |
| **IMD radar** (Radar Data Supply Portal exists **[S]**) | Radar reflectivity/QPE | **[U]** | **[U]** | **[U]** | **[U]** |

For the cyclone and heatwave candidates the official reference would be IMD's own products (best-track, station/gridded temperature); their
availability, formats and licence were **not verified** in this phase **[U]**.

## 4. Satellite sources (MOSDAC, from Phase 3D research plus this phase)

- Product families and codes (INSAT-3DS operational products document, SAC-ISRO) **[V]**: L1B/L1C imagery (`3SIMG_L1B_STD`, `L1C_SGP`, `L1C_ASIA_MER`),
  L2B `HEM` (rainfall via Hydro Estimator), `IMC` (IMSRA corrected), `OLR`, `CMK`, `CTP`, `TPW`, `UTH`; L2G `IMR` (0.25°), `GPI` (0.5°); L2P winds; HDF5 files and JPG chips.
- **Which satellites cover the candidate dates**: INSAT-3D launched 26 Jul 2013 **[V]**; INSAT-3DR launched 8 Sep 2016 **[V]**; INSAT-3DS launched 17 Feb 2024 **[V]** — so
  **all five candidate events pre-date INSAT-3DS**; historical context would come from INSAT-3D/3DR (`3RIMG_*` product codes appear in the MOSDAC/SAC documentation for INSAT-3D/3DR **[V/S]**, e.g. `3RIMG_L1B_STD`; verify the exact codes and per-date holdings in the MOSDAC catalogue **[U]**).
  IMD's 2018 regional report itself uses INSAT-3D imagery **[V]**.
- **Archive period per product and whether specific dates are populated**: **[U]** (MOSDAC pages do not state it).
- **Access**: search needs no login but needs a `datasetId`; download needs MOSDAC SSO credentials; 5,000 files/day/user; `boundingBox`, `startTime`/`endTime` (date granularity in the manual) and `count ≤ 100` **[V]**. Endpoint URLs/response schema **[U]**. **Credentials never go in the frontend.**
- **To a map raster**: L1C/L2 products are HDF5 with map-projected sectors or per-pixel lat/lon **[V]**; converting to a clipped grid (the contract in `satellite/`) is a backend job; JPG chips alone are not reliably georeferenced **[V/S]**.
- The `L2P AMV` winds and daily L3 products are not aligned to sub-daily analytic steps.

Satellite remains **context** (observational background, and an *estimate* when it is a rainfall product); it is not the ML input and not the reference.

## 5. Temporal alignment

Candidate timeline, using the selected event as the example (event window ≈ 21–23 Jul 2021; **all times UTC**; nothing below is a measured value):

```
EVENT (≈ 22 Jul 2021)
│
├── NWP/model time      forecast cycles 00/06/12/18 UTC; e.g. run 19 Jul 00Z (lead 72 h), 20 Jul 00Z (48 h), 21 Jul 00Z (24 h), 22 Jul 00Z (0–24 h)
│                       GFS 0.25°: steps every 3 h [V]  → valid times land on 00/03/06/… UTC
│                       TIGGE NCMRWF/IMD: step interval [U] (commonly 6-hourly in TIGGE — NOT verified for these providers)
├── AI input time       = the model run time t0 (analysis/initial fields at t0) — never a later time (no leakage)
├── reference time      IMD gridded rainfall: DAILY; standard IMD rainfall day ends 0830 IST = 0300 UTC (expected; verify in dataset doc) [U]
│                       IMERG: 30 min [V]
└── satellite time      INSAT imaging: repeat/frame times are minutes-scale (IMD: a new image every 15 min combining INSAT-3D/3DR [V]; INSAT-3D frame ≈ 25 min [V]); granule times [U]
```

Consequences (decisions that must be made explicitly in Phase 4B, not silently):

- **Precipitation is an accumulation over a window.** A forecast 24-h total must be built from the model's accumulated precipitation by differencing steps. To match the IMD day (0300 → 0300 UTC) exactly, the forecast needs valid times at 03 UTC — possible with **3-hourly GFS** steps, but a **6-hourly** step grid on 00/06/12/18 UTC would be **3 h out of phase** (document, do not hide).
- The current UI/data use `mm/6h`. A real case with a daily reference will use **`mm/24h`** (or compare 6-h forecast accumulations only with a sub-daily reference such as IMERG).
- **Forecast lead time ≠ observation time.** Lead structure for the event: initial times **T−3 d, T−2 d, T−1 d and event day** are available *if* the chosen archive holds those 00Z/12Z runs (GFS: yes by design [V]; TIGGE: expected [U]; to be confirmed per date). These are real lead times of the *source model*, not of our AI.
- **Satellite frames rarely match a model valid time exactly**; keep the MATCHED / NEARBY / MISSING logic from Phase 3D and show the actual timestamp.

## 6. Spatial alignment

- Working domain proposal for the selected case: **~17.0–20.0°N, 72.5–75.0°E** (contains Mumbai, Raigad, Ratnagiri/Chiplun edge, Mahad, Mahabaleshwar) — **a proposal only**; confirm against the real rain footprint in Phase 4B **[U]**. (Case 01 used 17.5–19.5°N, 72.5–74.5°E.)
- Coordinates: geographic WGS84 lat/lon for GFS, TIGGE, ERA5 and IMD grids **[V/S]**; MOSDAC map-projected sectors (e.g. `ASIA_MERCATOR`) or per-pixel lat/lon **[V]** need reprojection.
- Grids to reconcile (no resampling is implemented in this phase): GFS 0.25°; NCMRWF ensemble 12 km native (TIGGE grid **[U]**); IMD reference 0.25° (`135 × 129` national grid, subset needed); IMERG 0.1°; INSAT IR ~4 km; ERA5 0.25°.
- **Important**: the IMD reference (0.25°) is *coarser* than a 5 km "refined" target. Comparing a 5 km AI field with a 0.25° reference requires aggregating the AI field to the reference grid (or accepting the reference cannot resolve the peaks the AI claims). This bounds what "better localization" can be *demonstrated* with IMD gridded data alone; station data or IMERG (0.1°) can complement it.
- Conceptually: NWP grid → AI refinement → common high-resolution grid; reference → common grid; satellite → clipped context grid. Resampling method, land/ocean masking and the treatment of the half-cell edges are Phase 4B/ML decisions.

## 7. Access constraints (summary)

| Source | Account | Cost | Programmatic | Restriction |
|---|---|---|---|---|
| TIGGE (NCMRWF/IMD) | ECDS/CDS login + licence acceptance **[V]** | Free | Web forms; MARS/API **[U]** | **Non-commercial (CC BY-NC 4.0)** for NCMRWF/IMD **[V]** |
| GFS 0.25° archive | RDA/NCEI **[U]** | Free | THREDDS/HTTP/AWS **[S]** | CC BY 4.0 **[V]** |
| ERA5 | CDS account **[V]** | Free | CDS API **[V]** | CC BY; ~5-day latency **[V]** |
| IMD 0.25° gridded rainfall | None stated **[V: page listing]** | Free **[U]** | Direct file download **[V]** | Terms **[U]** |
| IMD station data | Registration (ID + undertaking) **[S]** | **Chargeable**, +18 % GST **[S]** | Portal request **[S]** | — |
| MOSDAC satellite | SSO to download; search open **[V]** | Free, non-commercial **[S]** | Python `mdapi.py`, config-driven **[V]** | 5,000 files/day; lockout after 3 failed logins **[V]** |
| IMERG | NASA Earthdata login **[V]** | Free | HDF5/NetCDF/GeoTIFF **[V]** | — |
| NCMRWF portal / IMDAA | Registration **[S]** | **[U]** | **[U]** | Portal unreachable during research |

The project is a hackathon/PS prototype: **non-commercial licences are acceptable for prototyping** but must be respected and stated in provenance; the plan should not assume commercial reuse of NCMRWF/IMD TIGGE data.

## 8. Data formats

GRIB2 (GFS, TIGGE, ECMWF), NetCDF/GRIB (ERA5), binary and NetCDF (IMD gridded) **[S]**, HDF5 + JPG chips + KML (INSAT/MOSDAC) **[V]**, HDF5/NetCDF/GeoTIFF (IMERG) **[V]**. None of these can be consumed by the browser directly; all need backend conversion to the contract grids (JSON/typed arrays/tiles).

## 9. Candidate suitability (factual, unranked)

Legend: ✓ documented available · ~ available with a stated limitation · ? unknown / not verified.

| Candidate | NWP availability | Reference availability | Satellite availability | Temporal alignment | Spatial alignment | Access complexity | Main limitation |
|---|---|---|---|---|---|---|---|
| **Kerala Aug 2018** | ✓ GFS 0.25° (2015+); ✓ TIGGE NCMRWF (Aug 2017+); IMD ensemble ✗ (joined 2020) | ✓ IMD 0.25° daily rainfall; ✓ IMERG; station data chargeable | ~ INSAT-3D used by IMD in 2018 report [V]; catalogue coverage ? | Daily reference vs 3 h/6 h model | Kerala is narrow (≈1° wide); 0.25° reference has few cells across it | Medium | No IMD-ensemble forecast for this date; narrow domain for a 0.25° reference |
| **Konkan–Maharashtra Jul 2021** | ✓ GFS 0.25°; ✓ TIGGE NCMRWF **and** IMD ensembles (IMD from Jul 2020) | ✓ IMD 0.25° daily rainfall; ✓ IMERG; station data chargeable | ~ INSAT-3D/3DR era; catalogue coverage ? | Daily reference vs 3 h (GFS) / 6 h? (TIGGE) — 03 UTC alignment issue | Domain ≈ Case 01's frame; ghat features finer than 0.25° reference | Medium | Primary IMD event documents were not retrievable; station peaks so far only media-reported [N] |
| **Cyclone Tauktae May 2021** | ✓ GFS; ✓ TIGGE (both Indian centres) | ? IMD best-track/warnings; ✓ IMERG for rain; wind reference ? | ~ INSAT-3D/3DR | Multi-day track; 3–6 h model steps | Basin scale; UI is rainfall-centric | High (new variables/layers) | Reference for wind/pressure structure not verified; big UI change |
| **Cyclone Biparjoy Jun 2023** | ✓ GFS; ✓ TIGGE | ? as above | ~ INSAT-3D/3DR (3DS not yet) | Multi-day track | Basin scale | High | Same as Tauktae; more offshore than land observation |
| **Heatwave Mar–May 2022** | ✓ GFS; ✓ TIGGE NCMRWF (IMD ensemble from Jul 2020) | ? IMD gridded/station temperature | ~ LST/IR products ? | Weeks-long, daily Tmax | Subcontinent scale | Medium | Slowly varying large-scale field; peak-localization story is weaker |

## 10. Selected historical case

**Selected for the next implementation phase: Konkan–Maharashtra extreme rainfall, 21–23 July 2021** (a feasibility candidate — it is *not* yet proven; see gates below).

Why, from the documented data characteristics (not visual appeal):

1. **Real forecast model output from Indian centres exists for that date**: TIGGE holds NCMRWF (since Aug 2017) and IMD (since Jul 2020) ensemble forecasts **[V]**, plus NOAA GFS 0.25° with 3-hourly steps **[V]** as a second, independent forecast source — so the "NWP" panel can be *real forecast output* and the source can be named honestly (never as NCMRWF unless it is).
2. **An independent, gauge-based reference exists** for rainfall (IMD 0.25° daily gridded, 6,955 gauges **[S]**), plus IMERG **[V]** and chargeable IMD station data **[S]** for point peaks.
3. **The variable and domain match what the UI already does** (precipitation, a Konkan/Ghats frame like Case 01), so the front end needs a data swap, not a redesign.
4. **INSAT-3D/3DR were operating in 2021** **[V]**, so satellite context (and HEM as an *estimate*) can be sought for the same dates through MOSDAC.
5. **Forecast-lead structure is meaningful** for a multi-day heavy-rain event (IMD's own extended-range/press text flagged extremely heavy rainfall days ahead **[S]**), subject to run availability per date.

What this selection does **not** claim: that the data is already accessible, that our AI "predicted" anything, or that this is the only feasible event. Kerala 2018 has the strongest *primary IMD documentation retrieved so far* **[V]**; Konkan 2021 has the stronger *data-era coverage* (both Indian ensembles) and the closest fit to the current UI.

**Feasibility gates for Phase 4B (each is a yes/no check before building anything):**
1. A TIGGE retrieval (NCMRWF or IMD) for 19–22 Jul 2021 returns total precipitation and pressure-level fields; the step interval and grid are known. *(needs a user-created ECDS account — not done here)*
2. The IMD 0.25° daily rainfall for 2021 can be downloaded and shows the event over the domain; its day definition is documented.
3. GFS 0.25° GRIB2 for the same runs can be retrieved from RDA/NCEI without restrictions that block prototyping.
4. MOSDAC search (no login) returns `3RIMG_*` granules for 21–23 Jul 2021 for the chosen `datasetId`s; download needs a user's SSO (backend only).
5. IMD primary event evidence (press releases/station table) is obtained and recorded, replacing media-reported values.

## 11. Real vs simulated architecture

```
CURRENT                             FUTURE (same UI)
mock JSON                           external sources
   ↓                                   ↓
retrospective.api.ts                backend ingestion (GRIB2/NetCDF/HDF5)
   ↓                                   ↓
UI                                  normalization (units, accumulation windows, UTC, common grid, provenance)
                                       ↓
                                    storage/cache (chunked arrays)
                                       ↓
                                    ML pipeline (later; not decided)  →  AI output (simulated until a real model exists)
                                       ↓
                                    retrospective API  →  retrospective.api.ts  →  same UI
Satellite: Frontend → our backend → MOSDAC → HDF5 → clipped grid → satellite.api.ts   (never credentials in the browser)
```

- Case 01 stays as the controlled **synthetic prototype**. The historical case would be a *second* case with `caseKind: 'historical_real'`; the existing `RetrospectiveCase` contract already carries `nwp`, `ai`, `reference`, `anomaly`, `trajectory`, `validation` and satellite context.
- Proposed (not created) layout once research is confirmed: `src/mockData/retrospective/case-01-extreme-precipitation/` (synthetic, unchanged) and a `historical/<event>/` set of *derived, compact* files produced by the backend — real fields, plus a clearly `simulated` AI file.
- Contract gaps to close in Phase 4B: unit `mm/24h` and window definition; `sourceUrl`, `datasetId`, `licence`, `processing` (list of steps) in provenance; forecast **init time** and **lead time** separate from **valid time**; ensemble handling (member / mean); a `real | simulated | reference | observational | derived` status per dataset (the current `dataStatus` supports `simulated | real` only).

## 12. ML refinement story — can the inputs be assembled?

- **Surface and pressure-level state** (T, Z/geopotential, Q/humidity, U, V; 2 m T; 10 m wind; MSLP; precipitation): available from GFS 0.25° (37+ variables **[V]**, level list **[U]**) and ERA5 (all levels; reanalysis, so *training/analysis* data rather than a forecast); TIGGE has 9 pressure levels **[V]** (subset).
- A model expecting Pangu-Weather/GraphCast-style inputs (13/37 levels at 0.25°) is assemblable from **ERA5 or GFS**, not from TIGGE alone **[S/V]**. Those models require their own weights and licence; **no model was downloaded or run**.
- For a *refinement/downscaling* step, the plausible pairing is **coarse NWP field → higher-resolution target**. The only documented high-resolution rainfall targets here are 0.25° (IMD), 0.1° (IMERG) and 12 km (IMDAA/NCUM); a **5 km truth does not exist in the sources found** **[U]**. This is a real limit on what "localization" can be *validated*.
- Not decided: architecture (U-Net/GNN/diffusion), training set, loss (the PS's concern about smoothing extremes). Not started.

## 13. Forecast horizon

The selected data can *in principle* support initial times **T−3 d, T−2 d, T−1 d** and the event day for the 2021 case using the source model's own runs (GFS steps up to 240 h [V]; TIGGE 10–15 day forecasts [V]). What is **not** verified: that each of those specific runs is present and complete in each archive, and the TIGGE step interval. No lead time is manufactured here; the AI output, when it exists, will have lead times inherited from its (real) input run.

## 14. Frontend impact (no redesign)

`NWP | AI REFINED | REFERENCE → Difference → Temporal evolution → Validation → Observational context` all remain. Data-driven changes only: accumulation unit/window labels, `real` vs `simulated` badges per dataset (the AI panel stays "SIMULATED"), real timestamps instead of synthetic ones, coarser reference grid annotation, and satellite alignment against real valid times.

## 15. Backend impact (future, not started)

A modular backend (not a microservice fleet): source connectors (TIGGE/ECDS, RDA/NCEI, ERA5/CDS, IMD gridded, IMERG, MOSDAC) → normalization → cache → (later) ML → retrospective API. MOSDAC/Earthdata/CDS credentials live only there. Quotas (MOSDAC 5,000 files/day) and licences (CC BY-NC) are enforced/recorded there.

## 16. Provenance required for every real dataset

`source`, `sourceUrl`, `datasetId/productCode`, `variable`, `unit` (incl. accumulation window), `validTime`, `initTime`/`leadTime` (forecasts), `spatialResolution`, `temporalResolution`, `licence/access`, `dataStatus` (`real | simulated`), `role` (`forecast | reanalysis | reference | observation | derived`), `processing` (ordered steps, e.g. "subset", "aggregate 3h→24h", "regrid bilinear 0.25°→…"), `retrievedAt`. The UI must be able to show: REAL, SIMULATED, REFERENCE, OBSERVATIONAL, DERIVED.

## 17. What is still missing

1. Every **[U]** above — most importantly: TIGGE NCMRWF/IMD parameter list, step interval and grid; RDA access terms; IMD gridded day definition and 2021 file availability; MOSDAC per-date holdings and API endpoint details.
2. **Primary IMD documentation** for the July 2021 event (press releases were not retrievable; station values are media-reported).
3. Any **5 km-scale truth** for demonstrating improved localization.
4. A **trained model** (none exists) and its licence/inputs.
5. **User-side accounts** (ECDS/CDS, MOSDAC SSO, Earthdata, possibly IMD DSP) — they must be created by the user and used from a backend; no credentials belong in this repo or the frontend.

## 18. Future data pipeline (staged, each stage gated)

1. **Feasibility probe** (user accounts, tiny samples): confirm gates 1–5 above; record real file names, sizes, steps and licences.
2. **Backend ingestion + normalization** for one event: subset to the domain, UTC, accumulate to the reference window, common grid, provenance.
3. **Contract + adapter** for a `historical_real` case: real NWP + real reference + simulated AI; satellite via backend.
4. **Metrics on real data** — only then may real numbers replace the simulated ones, labelled as computed on real data **and** as involving a simulated AI output.
5. **Real ML** later, with a documented experiment and no leakage of the reference into inputs.

## Sources

- MOSDAC Data Download API manual — https://www.mosdac.gov.in/downloadapi-manual **[V]**; API one-pager PDF **[V]**
- SAC-ISRO INSAT-3DS Operational Data Products (V1, Feb 2025) — https://mosdac.gov.in/docs/INSAT-3DS_Operational_Products_V1.pdf **[V]**
- MOSDAC INSAT-3D / 3DR / 3DS introduction pages **[V]**
- IMD Chennai, Regional Report on Southwest Monsoon 2018 — https://mausam.imd.gov.in/chennai/mcdata/sw_monsoon_2018.pdf **[V]**
- IMD, Unprecedented hot weather diagnosis in India during March–April 2022 (MAUSAM) — https://mausamjournal.imd.gov.in/index.php/MAUSAM/article/download/6196/5720/28698 **[V: abstract]**
- IMD Satellite Meteorology Services — https://mausam.imd.gov.in/responsive/servicesSatMet.php **[V]**; IMD Pune download page (`rcc.imdpune.gov.in/download.php`) **[V]**
- ECMWF TIGGE — https://www.ecmwf.int/en/research/projects/tigge **[V]**; TIGGE licence — https://ecds.ecmwf.int/licences/tigge-licence **[V]**; TIGGE partners — https://confluence.ecmwf.int/display/TIGGE/Project **[V]**; TIGGE dataset page — https://ecds.ecmwf.int/datasets/tigge-forecasts **[V]**
- ECMWF Open Data — https://www.ecmwf.int/en/forecasts/datasets/open-data **[V]**
- NCAR RDA d084001 (NCEP GFS 0.25° historical archive) — https://gdex.ucar.edu/datasets/d084001/ **[V]**; AWS registry `noaa-gfs-bdp-pds` **[V]**
- ERA5 hourly single levels — https://cds.climate.copernicus.eu/datasets/reanalysis-era5-single-levels **[V]**
- NASA GPM IMERG — https://gpm.nasa.gov/data/imerg **[V]**
- IMD Data Supply Portal (`dsp.imdpune.gov.in`) and data-procedure PDFs **[S]**; IMD press releases for Tauktae, Biparjoy, the July 2021 warnings and the 2022 heat **[S]**; Pai et al. 2014 (MAUSAM 65, 1–18) **[S]**
- Pangu-Weather (Nature 2023) and GraphCast (Science 2023) input descriptions **[S]**
- Media reports for Mahabaleshwar/Chiplun rainfall (India TV, National Herald, Republic World, Deccan Herald) **[N]**, used only to locate the event
