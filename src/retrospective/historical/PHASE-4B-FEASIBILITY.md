# Phase 4B — feasibility evidence (INTERIM: interrupted before the write-up was finished)

> Phase 4B was interrupted to build the final demo. This file records only what was **actually probed or read** from this
> environment, with how. It is **not** the finished feasibility matrix and makes **no claim that a real case has been built**.
> Nothing was downloaded: only HTTP HEAD requests, directory/object **listings**, public catalogue JSON, and documents.
> No credentials were used or created. Case 01 and all code were untouched by this research.
> Tags: **[PROBED]** requested from the live endpoint · **[DOC]** read on an official page/PDF · **[UNKNOWN]** not established.

## Gate 1 — NWP / forecast data (event: Konkan–Maharashtra, 21–23 Jul 2021)

**NOAA GFS 0.25° forecasts on AWS Open Data (`noaa-gfs-bdp-pds`, anonymous)** — **[PROBED]**
- Object listings exist for every cycle (00/06/12/18 UTC) of **16–23 Jul 2021**: 209 `pgrb2.0p25` step files per cycle
  (hourly f000–f120, then 3-hourly to f384), each with a `.idx` index. A file is ~530–550 MB (global), `Accept-Ranges: bytes`,
  so a real pipeline would fetch only the needed GRIB messages by byte range using the `.idx`.
- A read of one 41 KB text index (`gfs.20210719/00`, f072) shows: **APCP** `surface, 66-72 hour acc` (6-h bucket) and
  `0-3 day acc` (cumulative from the run start); f003/f027/f051/f075/f099 each carry both a `N-3 hour acc` bucket and a
  cumulative `0-N hour acc`. Therefore **an exact 24 h window ending 03 UTC is obtainable by differencing cumulative APCP**
  (e.g. `0-75 h` − `0-51 h` = 21 Jul 03Z → 22 Jul 03Z from the 19 Jul 00Z run).
- Also present: PRATE, TMP/UGRD/VGRD/RH 2 m/10 m, PRMSL, CAPE, PWAT; 33 pressure levels for TMP, HGT, RH, UGRD, VGRD, SPFH,
  VVEL, ABSV, including all 13 levels used by Pangu-Weather (1000…50 hPa).
- Bucket start: first `pgrb2.0p25` file found on **2021-03-23** (2021-03-10 absent). **Kerala Aug 2018 is NOT on this bucket.**
- NCAR RDA d084001 (GFS 0.25°, 2015-01-15 →, CC BY 4.0) **[DOC]**: dataset page readable; the file host `data.rda.ucar.edu`
  returned **HTTP 403** to a listing request and failed TLS verification from this environment → **retrieval [UNKNOWN]**.

**TIGGE (ECMWF ECDS catalogue, public JSON)** — **[PROBED]**
- The collection's `constraints` file (14.8 MB) lists, for origin **`ncmrwf`** and **`imd`**, `total_precipitation`
  (single level) for **every day 16–23 Jul 2021**, times **00:00 and 12:00** only, `control_forecast` and `perturbed_forecast`,
  lead times **0–240 h every 6 h** (includes 72/96/120/144). NCMRWF also has Aug 2018 (all days, 00/12Z, to 240 h); IMD has
  no 2018 entries (its first `total_precipitation` month is 2020-07; NCMRWF's is 2017-08).
- Pressure levels in TIGGE: 1000, 925, 850, 700, 500, 300, 250, 200, 50 hPa **[PROBED: ECDS form]** (not the full Pangu set).
- Archived grids **[DOC]** (ECMWF TIGGE "Models" page): NCMRWF **0.18° × 0.12°** (2000 × 1501), 11+1 members, 0–10 d, 0/12 UTC;
  IMD **0.12° × 0.12°** (3000 × 1501), 20+1 members, 0–10 d, 0/12 UTC. `total_precipitation` is "accumulated from the
  beginning of the forecast", kg m⁻² **[DOC]**.
- Access **[DOC]**: ECDS login + licence; **CC BY-NC 4.0** for IMD/NCMRWF; 48 h delay only for real-time users.
- **Catalogue presence is proven; actual retrieval was NOT tested** (needs a user account) → retrieval **[UNKNOWN]**.
- Consequence: 6-hourly steps at 00/06/12/18 UTC cannot form a 03→03 UTC window (3 h out of phase with a day ending 0300 UTC).

**ECMWF Open Data** — **[DOC]**: only the latest ~12 runs (≈2–3 days) are kept; history needs a Service Agreement → **not usable for 2021**.
**NCMRWF operational NCUM archive** — portal `ncmrwf.gov.in` unreachable from here (`connect` timeout / ECONNREFUSED);
`rds.ncmrwf.gov.in` answers but the content read was empty → **[UNKNOWN]**.

## Gate 2 — independent reference (IMD 0.25° gridded rainfall)

- The IMD Pune page **[PROBED/DOC]** documents `ind<YEAR>_rfp25.grd`: 0.25° × 0.25°, **135 × 129** points from 6.5°N/66.5°E to
  38.5°N/100.0°E, mm, **daily** records (365/366 per file, south→north), years **1901–2024** listed (2021 included), also NetCDF.
- **[PROBED]** `POST RF25.php` with `RF25=2021` and `RF25=2018` returned **HTTP 200** with
  `Content-Disposition: attachment; filename=RF25/ind2021_rfp25.nc` (2018 likewise) and **no authentication**. The body was cut
  off after 1 byte by a size cap; **file contents, size and the day convention were not verified** (expected ≈ 25 MB from the
  documented layout: 365 × 135 × 129 × 4 bytes).
- Day boundary **[UNKNOWN]** for this file. **[DOC]** (IMD Tauktae report) for the *IMD-NCMRWF GPM merged* product:
  "24 hr cumulative rainfall ending at 0830 IST of date" (= 0300 UTC). The gauge-only file's convention is not stated on its page.
- **IMD-NCMRWF merged GPM+gauge 0.25° (real-time page)**: `POST rain.php` returned an **empty attachment (Content-Length 0)** for
  every date/format tried (including 2021, 2023, 2025 and yesterday) → **not verified as retrievable** [UNKNOWN].
- Terminology: call it an **independent reference** (gauge-based analysis; interpolation from ~6,955 gauges, Shepard) — not "ground truth".
- Other references: **GPM IMERG Final daily v07B** GES DISC listing for Jul 2021 and Aug 2018 exists [PROBED]; a `HEAD` on
  the 22 Jul 2021 file returned 200 with 33.3 MB [PROBED]; download requires an Earthdata login **[DOC]**. IMD station data:
  registration + fee **[DOC/S]**. ERA5: CDS account; precipitation is a model field, not an observation **[DOC]**.

## Gate 3/4 — temporal & spatial compatibility (what the evidence implies)

| Item | Finding |
|---|---|
| GFS APCP | cumulative from run start + 3/6-hour buckets; a 24 h window ending 03 UTC is **exactly** derivable [PROBED] |
| TIGGE tp | cumulative, kg m⁻², 6-hourly at 00/12Z runs → windows end 00/06/12/18 UTC, **3 h from 03 UTC** [PROBED/DOC] |
| Reference | daily; day-end convention **unverified** for the gauge file; 0830 IST for the merged product [DOC] |
| Grids | GFS 0.25°; TIGGE NCMRWF 0.18×0.12°, IMD 0.12°; reference 0.25°; IMERG 0.1° |
| Limitation | the reference (0.25°) is **not finer** than the forecasts; a 5 km "refined" field **cannot be validated as 5 km truth**. Validation would be at the reference grid, optionally point checks with (paid) station data |
| Units | GFS APCP kg m⁻² ≡ mm; window accumulation must be labelled (`mm/24h`), not the demo's `mm/6h` |

## Gate 5 — event confirmation (Konkan Jul 2021)

- **Not verified from a primary IMD source.** IMD press-release PDFs returned **HTTP 404** on IMD's own server (also for
  the fetch tool). The IMD **Annual Report 2021** was read: it states Konkan & Goa had parts >3000 mm seasonal rainfall and
  that special bulletins were issued 22–24 Jul 2021 for a Bay of Bengal low, but it does **not** document the 21–23 Jul Konkan
  event (dates, values) in the text searched → event dates/values **[UNKNOWN]** (media-reported values exist **[N]** only).
- For contrast, **Cyclone Tauktae (May 2021)** is documented by an IMD **primary report** [DOC] (65 pp): genesis 14 May,
  landfall near 20.8°N 71.1°E about 20 km NE of Diu, 2000–2300 IST 17 May, sustained 160–170 km/h; operational track errors 73 km
  (24 h) and 113 km (48 h); the report uses INSAT-3D and Doppler radar imagery and IMD-NCMRWF GPM merged rainfall. GFS 0.25° files
  for 13–17 May 2021 exist on AWS [PROBED]; TIGGE NCMRWF/IMD May 2021 present [PROBED].
- **Kerala Aug 2018**: IMD Chennai regional report [DOC] documents dates/rainfall, but **no verified GFS route** (not on AWS; RDA
  unverified); TIGGE NCMRWF present [PROBED]; IMD 2018 gridded file served [PROBED headers].

## Gate 6 — satellite (MOSDAC)

- MOSDAC is reachable; `catalog-app` is an Angular SPA. The search API endpoint/response schema could **not** be
  discovered without downloading the `mdapi.zip` client (not done) → **[UNKNOWN]**. Search is documented as open, download needs
  MOSDAC SSO **[DOC]**. INSAT-3D (2013) / 3DR (2016) product codes (`3RIMG_*`) and per-date holdings **[UNKNOWN]**.
- Satellite rainfall estimates (HEM/IMC/IMR/GPI) must not become the reference (same conclusion as Phase 4A).

## What is still open

1. TIGGE retrieval test (needs a user ECDS account), IMD file **contents/day convention** (needs a small download with permission).
2. Primary IMD documentation for 21–23 Jul 2021 (or choose Tauktae / Kerala where primary documents exist).
3. MOSDAC search endpoint and per-date holdings.
4. Legal reading for a student prototype: GFS CC BY 4.0 [DOC]; TIGGE IMD/NCMRWF CC BY-NC 4.0 [DOC] (non-commercial use); IMD gridded terms **[UNKNOWN]**;
   IMERG/MOSDAC free with accounts [DOC/S]. This is not legal advice.

## Feasibility (evidence so far — not a ranking)

| Gate | Konkan Jul 2021 | Kerala Aug 2018 | Tauktae May 2021 |
|---|---|---|---|
| NWP available | **PASS** (GFS listing + APCP verified); TIGGE catalogue ✓ retrieval unknown | CONDITIONAL (TIGGE NCMRWF catalogue ✓; GFS route unverified) | **PASS** (GFS listing; TIGGE catalogue ✓) |
| Independent reference | CONDITIONAL (IMD file served; contents/day unknown) | CONDITIONAL (same) | rainfall as left; cyclone track/wind reference **UNKNOWN** |
| Temporal | CONDITIONAL (GFS exact 03Z; TIGGE 3 h off; day convention unknown) | CONDITIONAL | CONDITIONAL |
| Spatial | CONDITIONAL (reference 0.25° not finer than forecasts) | CONDITIONAL (narrow domain) | CONDITIONAL (basin scale; UI is rainfall-centric) |
| Event verification | **UNKNOWN** (no primary IMD text found) | PASS-ish (IMD regional report [DOC]) | **PASS** (IMD report [DOC]) |
| Satellite context | UNKNOWN (MOSDAC holdings) | UNKNOWN | UNKNOWN (report uses INSAT-3D imagery) |
| Download feasibility | GFS ✓ anonymous range requests; IMD file ✓ open POST; TIGGE/IMERG/MOSDAC need accounts | as left, GFS only via RDA (unverified) | as Konkan |
| Licensing | GFS CC BY 4.0; TIGGE CC BY-NC (non-commercial) | same | same |

Viable / conditionally viable / blocked: **no candidate is blocked by data existence**; the July 2021 case is *conditionally viable* pending
an event-evidence source and the two account/permission-dependent probes above.
