# Extreme Weather AI Intelligence Platform — Refined Project Goal

## 1. Project Vision

Build an AI-driven extreme-weather intelligence prototype that demonstrates how medium-range numerical weather prediction (NWP) data can be transformed into a more useful, localized, interpretable and actionable representation of extreme-weather events.

The project is **not** a generic weather dashboard, weather app, radar viewer, or chatbot.

The core story is:

```text
NWP / Meteorological Forecast Data
                ↓
        AI / ML Processing
                ↓
 Spatial Refinement + Anomaly Detection
                ↓
      Event Identification / Tracking
                ↓
 Forecast Evolution + Confidence
                ↓
      Human-readable Alert/Insight
```

The final production vision is to consume relevant meteorological data from sources such as IMD/NCMRWF and apply an ML pipeline to identify and refine extreme-weather signals such as:

- extreme rainfall
- cyclones / severe storms
- heatwaves / extreme temperature
- cold waves
- strong winds
- other relevant extreme-weather anomalies

The prototype must stay focused on this problem rather than becoming a collection of unrelated weather visualizations.

---

## 2. Problem We Are Solving

Forecasters and decision-makers may need to inspect large, multi-variable NWP outputs to identify localized dangerous events several days ahead.

The system should help answer:

1. **Where is an extreme event developing?**
2. **What type of event is it?**
3. **How intense is it?**
4. **How large is the affected region?**
5. **How is it moving/evolving?**
6. **How confident is the system?**
7. **How does the AI-derived result compare with the original forecast/reference data?**

A key technical objective is to preserve/localize extreme signals during AI-based refinement rather than simply producing a visually smooth weather field.

---

## 3. Critical PS Alignment

Everything built in this project must remain connected to:

> AI-assisted analysis/refinement of meteorological/NWP information for earlier, more localized and interpretable detection/tracking of extreme weather.

Do NOT turn the project into:

- a normal weather app
- a generic map dashboard
- a generic radar-image gallery
- a generic AI chatbot
- a generic LLM weather assistant
- a collection of unrelated graphs
- a fake claim that a general-purpose AI API is a meteorological ML model

The UI may contain many visual components, but every major component must answer a weather-intelligence question.

---

# 4. Refined Prototype Strategy

Because the real operational NCMRWF/IMD data pipeline and final project ML model will take time, the prototype will use a **retrospective case-study approach**.

Instead of fabricating a current ML result, we demonstrate the pipeline on a historical event for which a reference/actual outcome is available.

The prototype concept is:

```text
Historical NWP / Forecast
          ↓
Pretrained Weather ML Model
          ↓
AI Forecast / Refined Representation
          ↓
Extreme-event extraction
          ↓
Anomaly / trajectory / affected-area representation
          ↓
Historical reference / observation / reanalysis
          ↓
Validation and comparison
```

This gives the project a real experimental story instead of only static mock data.

---

# 5. Prototype Case Study

The first prototype should focus on:

- **one extreme-weather event**
- **one geographic region**
- **one primary weather variable**
- **one pretrained weather ML model**
- **one forecast/reference comparison**

Do not attempt all of India and all weather phenomena initially.

The candidate case is an Indian extreme-rainfall event in the Konkan/Maharashtra region, subject to final data availability and reproducibility.

The prototype must clearly label whether a dataset is:

- real meteorological data
- pretrained-model output
- reference/reanalysis data
- generated mock data

Never present fabricated metrics as measured model performance.

---

# 6. Model Strategy

For the prototype, prefer a genuine pretrained weather model over a generic AI/LLM API.

Candidate models include:

- Pangu-Weather
- GraphCast / GraphCast Small
- other openly available pretrained weather models if their input/output requirements fit the experiment

The model is a **prototype/benchmark component**, not the identity of the final product.

The final project vision is:

```text
IMD / NCMRWF / other validated meteorological source
                    ↓
              Project ML pipeline
                    ↓
       Spatial refinement / downscaling
                    ↓
          Extreme anomaly detection
                    ↓
           Tracking + confidence
                    ↓
                Alerts
```

Do not claim that Pangu/GraphCast is our own model.

---

# 7. Historical Validation Principle

The AI model must not be given the future reference value while producing its prediction.

Correct:

```text
Historical forecast at T0
        ↓
AI inference
        ↓
AI prediction
        ↓
Historical reference at T+X
        ↓
Compare
```

Incorrect:

```text
Actual future value
        ↓
AI
        ↓
same/near-identical value
```

The latter would create leakage and must not be presented as validation.

---

# 8. What We Want to Demonstrate

The prototype should demonstrate measurable or clearly-labelled mock versions of:

### Detection
Did the system identify the extreme event?

### Localization
Did the predicted/anomalous region overlap the reference event?

### Intensity
How close was the predicted extreme intensity to the reference?

### Timing
How early did the system identify the event and when did the peak occur?

### Spatial footprint
How closely did the predicted affected region resemble the reference?

### Evolution
How did the event develop over the forecast timeline?

### Confidence
How certain is the model/system about the event?

These dimensions are more important than simply showing a visually attractive map.

---

# 9. Three-State Hero Visualization

The main retrospective page should eventually make the following comparison obvious:

```text
┌──────────────────┬──────────────────┬──────────────────┐
│ NWP / FORECAST   │ AI RESULT        │ REFERENCE        │
│                  │                  │                  │
│ Original field   │ Refined/AI field │ Historical truth │
│                  │                  │                  │
│ Coarse signal    │ Localized signal │ Actual/reference │
└──────────────────┴──────────────────┴──────────────────┘
```

This is the central visual explanation of the project.

The user should be able to move through:

```text
72h → 48h → 24h → Event
```

or the available forecast lead times.

---

# 10. Visualization Philosophy

Do not use ordinary dashboard charts/maps simply because they are familiar.

Prefer purpose-built geospatial visualizations that communicate the phenomenon.

Potential technologies:

### MapLibre GL
Base map and high-performance geographic rendering.

### deck.gl
Advanced geospatial layers.

Potential layers:

- H3/grid cells for anomaly intensity
- ContourLayer for extreme boundaries
- Heatmap only when scientifically appropriate
- HexagonLayer where aggregation is meaningful
- ScatterplotLayer for event points
- PathLayer for trajectories
- TripsLayer for time-evolving movement
- ArcLayer where movement/flow is meaningful
- Particle/flow visualization for wind direction
- custom canvas/WebGL layers when necessary

Do not add every layer. Select only what supports the story.

---

# 11. Radar / Satellite / Imagery Philosophy

Radar and satellite imagery are **supporting evidence**, not the core ML result.

If authentic current/historical imagery is available and legally/technically usable:

```text
Meteorological observation / radar
          ↓
contextual layer
```

while:

```text
NWP → AI → anomaly/refinement
```

remains the core pipeline.

Do not make the project a radar-image viewer.

If real imagery is unavailable for the prototype, use clearly-labelled mock/sample imagery rather than pretending it is live.

---

# 12. Weather Phenomenon Selector

The UI can eventually support:

```text
Extreme Rainfall
Cyclone / Storm
Heatwave
Cold Wave
Strong Wind
```

But only **one phenomenon should be actively compared at a time** in the main analytical view.

For example:

```text
Phenomenon: Extreme Rainfall
```

then the map, metrics, layers and charts all adapt to rainfall.

This prevents the UI from becoming a generic overloaded dashboard.

---

# 13. Existing Backend API Contract

The current backend already exposes a useful mock API structure.

Preserve this contract unless there is a strong technical reason to change it.

Existing conceptual endpoints:

```text
GET /api/dashboard/summary
GET /api/alerts
GET /api/alerts/{alert_id}
GET /api/alerts/{alert_id}/trajectory
GET /api/alerts/{alert_id}/forecast
GET /api/map/anomalies
```

These endpoints can continue feeding the operational/current-data UI.

The retrospective experiment should be added without breaking this existing contract.

---

# 14. Recommended Separation

Do NOT immediately split the whole application into many microservices.

For the prototype, use a modular monolith/frontend structure.

Recommended conceptual separation:

```text
Existing Application
│
├── Existing dashboard/current-data experience
│
├── Retrospective AI Validation page
│
├── Weather Visualization components
│
├── Mock/retrospective data adapter
│
└── Existing backend API
```

A separate backend microservice is unnecessary for the first prototype unless model inference becomes computationally isolated.

If model inference later becomes expensive:

```text
Main API
   │
   ├── operational services
   │
   └── ML inference service
```

can be introduced later.

---

# 15. Frontend Data Strategy

Until the real ML pipeline is connected, use a dedicated mock-data directory.

Recommended structure:

```text
mockData/
├── current/
│   ├── alerts.json
│   ├── anomalies.json
│   └── forecast.json
│
├── retrospective/
│   └── case-01/
│       ├── metadata.json
│       ├── nwp.json
│       ├── ai_forecast.json
│       ├── reference.json
│       ├── anomaly.json
│       ├── trajectory.json
│       └── metrics.json
│
└── model/
    └── diagnostics.json
```

Every retrospective file should identify whether its values are:

```text
real
mock
derived
model-output
reference
```

This makes replacement with real data straightforward.

---

# 16. Retrospective Metadata Contract

Example:

```json
{
  "case_id": "india-extreme-rainfall-case-01",
  "event_type": "extreme_rainfall",
  "region": "Konkan-Maharashtra",
  "status": "retrospective",
  "input_source": "historical_nwp",
  "ai_model": "Pangu-Weather",
  "reference_source": "ERA5_or_IMD",
  "is_mock": true
}
```

`is_mock` must become `false` only when the underlying values are genuinely produced by the relevant pipeline.

---

# 17. Metrics Contract

The frontend should eventually consume metrics such as:

```text
detection_score
spatial_error
peak_intensity_error
timing_error
affected_area_error
forecast_lead_time
```

Do not invent scientific performance numbers.

For the video prototype, if metrics are mocked, visibly label them as:

```text
Prototype / simulated result
```

Once the real experiment is completed, replace them with computed values.

---

# 18. Final Product Story

The project should communicate this progression:

```text
TODAY / PROTOTYPE

Historical NWP
      ↓
Pretrained AI
      ↓
Extreme-event intelligence
      ↓
Historical validation
```

then:

```text
FINAL SYSTEM

IMD / NCMRWF
      ↓
Operational NWP
      ↓
Project ML model
      ↓
Spatial refinement
      ↓
Extreme anomaly detection
      ↓
GNN / tracking
      ↓
Confidence
      ↓
Early warning / decision support
```

The retrospective experiment is therefore a **proof-of-concept**, not a replacement for the final operational pipeline.

---

# 19. Non-Negotiable Rules

1. Do not fabricate real-time meteorological data.
2. Do not call generic LLM output a weather ML prediction.
3. Do not claim a model improves accuracy unless the comparison is actually calculated.
4. Do not use future reference data as input to prediction.
5. Do not claim NCMRWF/IMD input if the prototype is actually using another NWP source.
6. Clearly distinguish real data, model output, derived data and mock data.
7. Keep the central story connected to extreme-weather detection/refinement.
8. Do not add visualizations merely for decoration.
9. One phenomenon at a time in the analytical comparison.
10. Keep the architecture modular but avoid unnecessary microservices.
11. Existing APIs should remain compatible.
12. The frontend must be designed so real ML outputs can replace mock JSON without redesign.
13. Current/live dashboard and retrospective validation are separate concepts.
14. Radar/satellite imagery is contextual evidence, not the core ML output.
15. Every new library must have a specific purpose documented in the phase where it is introduced.

---

# 20. Definition of Done for the Prototype

The prototype is successful when a reviewer can understand the following without explanation:

```text
1. Here is the original weather/NWP information.
2. Here is what the AI system produces from it.
3. Here is where an extreme event is detected.
4. Here is how the event evolves.
5. Here is the historical reference/actual outcome.
6. Here is how the AI result compares with that reference.
7. Here is how this becomes an operational NCMRWF/IMD pipeline later.
```

The project should feel like an **extreme-weather intelligence system**, not a weather visualization collection.
