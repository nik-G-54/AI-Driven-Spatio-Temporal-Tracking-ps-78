// Weather-analysis adapter.
//
//   backend mock API  ──┐   (the existing *.api.ts adapters: event monitor, dashboard,
//                       │    event detail, historical replay — there is no HTTP backend
//                       │    in this repo; these adapters ARE the mock API layer)
//   retrospective case ─┼─→  toWeatherAnalysis()  ─→  WeatherAnalysis  ─→  workspace UI
//                       │
//   deterministic       ┘   (fieldSynth.ts: only where the backend has no gridded field)
//   simulation
//
// Replacing the mock with a real backend means reimplementing THIS file's inputs; the UI
// consumes `WeatherAnalysis` only. The AI output is always a simulation.
//
// Backend field → UI mapping (also exposed as `WeatherAnalysis.backendFields`):
//   event.type / severity / classification   → event selector, severity indicator
//   event.trackConfidence, dashboard ensembleAgreement → "prototype confidence"
//   event.currentPosition, landfall, mapMetadata      → map focus / event centroid
//   trajectory.hazardFootprint.{radii,rotation,threshold} → field shape and prototype threshold
//   trajectory.downscaling.bounds                     → affected-region overlay
//   trajectory.forecast[] / historical[]              → track / footprint motion (PathLayer-style path)
//   trajectory.uncertaintyCone                        → cone polygon (cyclone)
//   event.intensity.{peakRainfall,maxWind}, centralPressure → AI peak amplitudes per variable
//   telemetry.windCoreRadius                          → vortex radius of maximum wind
//   dashboard forecastTimeline.downscaledRiskCells    → intensity evolution over time
//   event-detail map nwpField/aiField peaks           → NWP/AI peak ratio (precipitation)
//   historical-replay track / timeline / metrics      → heatwave track, evolution, NWP/AI peak amplitudes

import { getEventMonitor, type EventMonitorBundle } from '../../event-monitor/event-monitor.api';
import { getForecastTimeline } from '../../dashboard/dashboard.api';
import { getEventMap } from '../../event-details/event-details.api';
import { getHistoricalReplay } from '../../historical-replay/historical-replay.api';
import { getRetrospectiveCase } from '../retrospective.api';
import type { GeoBounds, GeoPoint, Provenance, RetrospectiveCase, SpatialField } from '../retrospective.types';
import type {
  AnalysisStep,
  BackendFieldUse,
  EvolutionPoint,
  RegionOverlay,
  VariableAnalysis,
  VariableId,
  VariableMeta,
  WeatherAnalysis,
  WeatherEventType,
  WeatherScenarioOption,
} from './analysis.types';
import { VARIABLE_LABEL } from './analysis.types';
import { addHours, interpolateSeries, interpolateTrack, parseBackendTime, synthesizeVariable, type ShapeSpec, type StepCenter } from './fieldSynth';

export type { WeatherAnalysis, WeatherScenarioOption } from './analysis.types';

const CASE_01_ID = 'case-01-extreme-precipitation';
const STEP_HOURS = 6;
const PRESSURE_BASELINE_HPA = 1010;

interface ScenarioConfig {
  scenarioId: string;
  eventType: WeatherEventType;
  label: string;
  source: WeatherScenarioOption['source'];
  // Event-monitor id, or 'heatwave-2022' for the historical-replay heatwave.
  backendId: string | null;
}

const SCENARIOS: ScenarioConfig[] = [
  { scenarioId: 'event-as-01', eventType: 'precipitation', label: 'Monsoon depression AS-01 · Andhra coast', source: 'backend-mock-api', backendId: 'AS-01' },
  { scenarioId: 'event-ne-04', eventType: 'precipitation', label: 'Deep convective plume NE-04 · Sundarbans', source: 'backend-mock-api', backendId: 'NE-04' },
  { scenarioId: CASE_01_ID, eventType: 'precipitation', label: 'Case 01 · Konkan–Maharashtra (retrospective prototype)', source: 'retrospective-prototype', backendId: null },
  { scenarioId: 'event-heatwave-2022', eventType: 'heatwave', label: 'North India heatwave · Delhi NCR', source: 'backend-mock-api', backendId: 'heatwave-2022' },
  { scenarioId: 'event-bob-02', eventType: 'cyclone', label: 'Cyclonic anomaly BOB-02 · Bay of Bengal → Odisha', source: 'backend-mock-api', backendId: 'BOB-02' },
];

// Old case ids still resolve (they were simplified single-frame placeholders).
const ALIASES: Record<string, string> = { 'case-b-heatwave': 'event-heatwave-2022', 'case-c-cyclone': 'event-bob-02' };

export async function listWeatherScenarios(): Promise<WeatherScenarioOption[]> {
  return SCENARIOS.map(({ scenarioId, eventType, label, source }) => ({ scenarioId, eventType, label, source }));
}

export function resolveScenarioId(id: string): string {
  return ALIASES[id] ?? id;
}

export async function getWeatherAnalysis(requestedId: string): Promise<WeatherAnalysis> {
  const scenarioId = resolveScenarioId(requestedId);
  const config = SCENARIOS.find((s) => s.scenarioId === scenarioId);
  if (!config) throw new Error(`Unknown weather scenario: ${requestedId}`);
  if (scenarioId === CASE_01_ID) return fromRetrospectiveCase(await getRetrospectiveCase(CASE_01_ID), config);
  if (config.backendId === 'heatwave-2022') return heatwaveFromBackend(config);
  return eventFromBackend(config);
}

// ---- Shared pieces -----------------------------------------------------------

const PROVENANCE: Provenance = {
  kind: 'mock',
  isMock: true,
  dataStatus: 'simulated',
  sourceType: 'prototype_simulation',
  sourceName: 'Deterministic frontend simulation derived from backend mock values',
  note: 'SIMULATED prototype data. Not an observation, not real NWP output and not the output of a trained ML model.',
};

const clamp = (x: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, x));
const fmtNum = (x: number, d = 1) => String(Number(x.toFixed(d)));

function stepLeads(horizon: number): number[] {
  return Array.from({ length: Math.floor(horizon / STEP_HOURS) + 1 }, (_, i) => i * STEP_HOURS);
}

// Analysis window around the moving centre, sized from the backend footprint radius.
function windowFor(centers: GeoPoint[], marginDeg: number): GeoBounds {
  return {
    north: Math.max(...centers.map((c) => c.latitude)) + marginDeg,
    south: Math.min(...centers.map((c) => c.latitude)) - marginDeg,
    east: Math.max(...centers.map((c) => c.longitude)) + marginDeg,
    west: Math.min(...centers.map((c) => c.longitude)) - marginDeg,
  };
}

// AI grid spacing keeps ≈ 9k cells per frame; the NWP grid is ≈ 2.5× coarser.
function spacingFor(bounds: GeoBounds): { ai: number; nwp: number } {
  const area = (bounds.north - bounds.south) * (bounds.east - bounds.west);
  const ai = Math.max(0.05, Math.ceil(Math.sqrt(area / 9000) * 100) / 100);
  return { ai, nwp: Math.max(0.125, Math.round(ai * 2.5 * 100) / 100) };
}

function ringFromBounds(b: GeoBounds): Array<[number, number]> {
  return [
    [b.west, b.north],
    [b.east, b.north],
    [b.east, b.south],
    [b.west, b.south],
  ];
}

// ---- Backend events (cyclone / precipitation) --------------------------------

async function eventFromBackend(config: ScenarioConfig): Promise<WeatherAnalysis> {
  const id = config.backendId as string;
  const [bundle, timeline] = await Promise.all([getEventMonitor(id), getForecastTimeline()]);
  const { event, trajectory, telemetry } = bundle;
  const isCyclone = config.eventType === 'cyclone';

  // Only BOB-02 has the extra event-detail NWP/AI peaks; others reuse its ratio (derived).
  let precipRatio = 142 / 214;
  let ratioOrigin: BackendFieldUse['origin'] = 'derived';
  let ratioValue = 'ratio 142/214 taken from BOB-02 event-detail (applied to this event)';
  if (id === 'BOB-02') {
    const map = await getEventMap('bob-02');
    precipRatio = map.nwpField.fieldPeak.value / map.aiField.truePeak.value;
    ratioOrigin = 'backend';
    ratioValue = `${map.nwpField.fieldPeak.value} / ${map.aiField.truePeak.value} mm/day`;
  }

  const forecastPoints = trajectory.forecast;
  const t0 = parseBackendTime(forecastPoints[0]?.timestamp);
  const landfallLead = forecastPoints.find((p) => p.status === 'landfall')?.leadHour ?? event.forecast.leadHours;
  const horizon = Math.min(48, Math.max(...forecastPoints.map((p) => p.leadHour), 0));
  const track = forecastPoints.map((p) => ({ lead: p.leadHour, latitude: p.latitude, longitude: p.longitude }));

  // Intensity evolution: BOB-02 from the dashboard forecast timeline (backend); others a bump at landfall (derived).
  const riskCells = timeline.steps.map((s) => ({ x: s.leadHour, y: s.window.downscaledRiskCells }));
  const agreement = timeline.steps.map((s) => ({ x: s.leadHour, y: s.window.ensembleAgreement / 100 }));
  const maxCells = Math.max(...riskCells.map((p) => p.y));
  const envelope = (lead: number) =>
    id === 'BOB-02'
      ? 0.3 + 0.7 * (interpolateSeries(riskCells, lead) / maxCells)
      : 0.35 + 0.65 * Math.exp(-(((lead - landfallLead) / (0.55 * Math.max(horizon, 12))) ** 2));

  const baseConfidence = event.trackConfidence / 100;
  const leads = stepLeads(horizon);
  const steps: StepCenter[] = leads.map((lead) => ({
    leadTimeHours: lead,
    timestamp: addHours(t0, lead),
    center: interpolateTrack(track, lead),
    intensity: envelope(lead),
  }));

  const hf = trajectory.hazardFootprint;
  const marginDeg = clamp((1.6 * hf.windRadiusKm) / 111.32, 0.9, 2.0);
  const bounds = windowFor(steps.map((s) => s.center), marginDeg);
  const spacing = spacingFor(bounds);
  const confidence = (i: number) =>
    id === 'BOB-02' ? interpolateSeries(agreement, leads[i]) : clamp(baseConfidence * (0.88 + 0.12 * steps[i].intensity), 0, 1);

  const coreSigma = hf.rainfallCoreRadiusKm * 0.8;
  const meta = (variableId: VariableId, unit: string, description: string, thresholdLabel: string): VariableMeta => ({
    id: variableId,
    label: VARIABLE_LABEL[variableId],
    unit,
    description,
    thresholdLabel,
  });
  const labels = {
    nwpSource: `NWP-style input — ${event.model.name} ${event.model.resolution} (backend mock, simulated field)`,
    aiModel: 'AI REFINED — SIMULATED (analytic construction, no ML model was run)',
    nwpResolutionKm: 12,
    aiResolutionKm: 5,
  };
  const trajectoryInfo = isCyclone
    ? {
        representation: 'system_track',
        basis: 'backend_forecast_track',
        note: 'Backend forecast track of the system (positions interpolated to 6-hourly steps). NWP path is the half-maximum centroid of the simulated coarse field.',
        useBackendCenter: true,
      }
    : {
        representation: 'evolving_footprint_centroid',
        basis: 'half_maximum_centroid',
        note: 'Movement of the precipitation footprint (intensity-weighted centroid of the field above half its maximum). This is not a cyclone-style track.',
        useBackendCenter: false,
      };

  const common = (spec: Omit<Parameters<typeof synthesizeVariable>[0], 'steps' | 'bounds' | 'spacing' | 'provenance' | 'labels' | 'confidence' | 'trajectory'>, withTrajectory: boolean): VariableAnalysis =>
    synthesizeVariable({ ...spec, steps, bounds, spacing, provenance: PROVENANCE, labels, confidence, trajectory: withTrajectory ? trajectoryInfo : null });

  const shape = (kind: ShapeSpec['kind'], baseline: number, peak: number, along: number, across: number, envAmp: number, envSigma: number, core?: ShapeSpec['core']): ShapeSpec => ({
    kind,
    baseline,
    peak,
    sigmaAlongKm: along,
    sigmaAcrossKm: across,
    angleDeg: hf.rotationDeg,
    envelope: { amp: envAmp, sigmaKm: envSigma },
    core,
  });

  const precipPeak = event.intensity.peakRainfall;
  const windPeak = event.intensity.maxWind;
  const pressureDeficit = PRESSURE_BASELINE_HPA - event.centralPressure.value;
  const nwpFor = (peakRatio: number) => ({ peakRatio, broaden: 1.8, offsetKm: { east: 8, north: -6 }, lagSteps: 1 });

  const precipitation = common(
    {
      meta: meta('precipitation', 'mm/day', 'Daily-equivalent rainfall rate', `≥ ${hf.rainfallThresholdMmDay} mm/day (backend hazard threshold)`),
      ai: shape('blob', 3, precipPeak, coreSigma, coreSigma * 0.55, 0.12, hf.windRadiusKm * 1.2, { amp: 0.25, sigmaKm: coreSigma * 0.4, shiftKm: coreSigma * 0.3 }),
      nwp: nwpFor(precipRatio),
      threshold: hf.rainfallThresholdMmDay,
    },
    true,
  );
  const wind = common(
    {
      meta: meta('wind', 'km/h', 'Near-surface wind speed', `≥ ${Math.round(windPeak * 0.7)} km/h (0.7 × backend peak; prototype)`),
      ai: shape('vortex', 10, windPeak, isCyclone ? telemetry.windCoreRadius.value : Math.max(hf.windRadiusKm * 0.6, 20), 1, 0.08, hf.windRadiusKm * 1.5),
      nwp: nwpFor(0.8),
      threshold: Math.round(windPeak * 0.7),
    },
    true,
  );
  const pressure = common(
    {
      meta: meta('pressure', 'hPa', `Pressure deficit below ${PRESSURE_BASELINE_HPA} hPa`, `≥ ${fmtNum(pressureDeficit * 0.5)} hPa deficit (0.5 × backend deficit; prototype)`),
      ai: shape('radial', 0, pressureDeficit, hf.windRadiusKm * 0.9, 1, 0.05, hf.windRadiusKm * 2.5),
      nwp: nwpFor(0.7),
      threshold: Number((pressureDeficit * 0.5).toFixed(1)),
    },
    true,
  );

  const variables = isCyclone ? [wind, precipitation, pressure] : [precipitation, wind, pressure];

  const cone: RegionOverlay[] = isCyclone
    ? [{ kind: 'cone', label: `Backend uncertainty cone (${trajectory.uncertaintyCone.confidence}%)`, ring: trajectory.uncertaintyCone.points.map((p) => [p.longitude, p.latitude]) }]
    : [];
  const regions: RegionOverlay[] = [
    ...cone,
    { kind: 'affected', label: `Backend affected region (${trajectory.downscaling.resolutionKm} km downscaling bounds)`, ring: ringFromBounds(trajectory.downscaling.bounds) },
  ];

  const lastStep = steps[steps.length - 1];
  return {
    event: {
      scenarioId: config.scenarioId,
      backendId: id,
      type: config.eventType,
      name: event.displayName,
      classification: event.classification,
      severity: event.severity,
      status: `T+${horizon}h horizon · prototype data`,
      region: `${event.landfall.sector} · ${event.mapMetadata.domainLabel}`,
      centroid: event.currentPosition,
      boundingBox: trajectory.downscaling.bounds,
      detectedAt: t0,
      forecastStart: t0,
      forecastEnd: lastStep.timestamp,
      confidence: baseConfidence,
      modelLabel: `${event.model.name} ${event.model.resolution} → AI REFINED (simulated)`,
      source: config.source,
      provenanceNote: 'Backend mock values; gridded fields are a deterministic frontend simulation.',
    },
    steps: steps.map((s): AnalysisStep => ({ leadTimeHours: s.leadTimeHours, timestamp: s.timestamp })),
    variables,
    defaultVariable: variables[0].meta.id,
    regions,
    contextVariable: 'precipitation',
    facts: backendFacts(bundle),
    backendFields: [
      { field: 'event.type / classification', value: `${event.type} · ${event.classification}`, usedFor: 'Event type and description', origin: 'backend' },
      { field: 'event.severity', value: event.severity, usedFor: 'Severity indicator', origin: 'backend' },
      { field: 'event.trackConfidence' + (id === 'BOB-02' ? ' + dashboard ensembleAgreement' : ''), value: `${event.trackConfidence}%`, usedFor: 'Prototype confidence (per step for BOB-02)', origin: 'backend' },
      { field: 'event.currentPosition / landfall / mapMetadata.domain', value: `${event.currentPosition.latitude}°N ${event.currentPosition.longitude}°E · ${event.landfall.sector}`, usedFor: 'Event centroid, place context, header region', origin: 'backend' },
      { field: 'trajectory.forecast[] / historical[]', value: `${forecastPoints.length} forecast points → ${leads.length} steps (6-hourly, linear interpolation)`, usedFor: isCyclone ? 'Cyclone track (path layer)' : 'Motion of the precipitation footprint', origin: 'derived' },
      { field: 'trajectory.uncertaintyCone', value: `${trajectory.uncertaintyCone.points.length} points`, usedFor: isCyclone ? 'Uncertainty cone polygon' : 'not drawn for precipitation', origin: 'backend' },
      { field: 'trajectory.downscaling.bounds', value: `${trajectory.downscaling.bounds.south}–${trajectory.downscaling.bounds.north}°N`, usedFor: 'Affected-region overlay', origin: 'backend' },
      { field: 'trajectory.hazardFootprint (windRadiusKm, rainfallCoreRadiusKm, rotationDeg)', value: `${hf.windRadiusKm} km / ${hf.rainfallCoreRadiusKm} km / ${hf.rotationDeg}°`, usedFor: 'Field size and orientation', origin: 'backend' },
      { field: 'trajectory.hazardFootprint.rainfallThresholdMmDay', value: `${hf.rainfallThresholdMmDay} mm/day`, usedFor: 'Precipitation prototype threshold', origin: 'backend' },
      { field: 'event.intensity.peakRainfall / maxWind, centralPressure', value: `${precipPeak} mm/day · ${windPeak} km/h · ${event.centralPressure.value} hPa`, usedFor: 'AI peak amplitude of precipitation / wind / pressure deficit', origin: 'backend' },
      { field: 'telemetry.windCoreRadius', value: `${telemetry.windCoreRadius.value} km`, usedFor: isCyclone ? 'Radius of maximum wind of the vortex' : 'not used (not a cyclone)', origin: 'backend' },
      { field: 'dashboard forecastTimeline.downscaledRiskCells', value: id === 'BOB-02' ? `${riskCells.map((p) => p.y).join(', ')}` : 'not applicable to this event', usedFor: 'Intensity evolution over time', origin: id === 'BOB-02' ? 'backend' : 'prototype' },
      { field: 'event-detail map: nwpField.fieldPeak / aiField.truePeak', value: ratioValue, usedFor: 'NWP-to-AI peak ratio (precipitation)', origin: ratioOrigin },
      { field: 'NWP wind/pressure peak ratios, offsets, 1-step lag', value: '0.8 / 0.7 / 8 km east, 6 km south', usedFor: 'Prototype constants for the simulated coarse input', origin: 'prototype' },
    ],
  };
}

function backendFacts(bundle: EventMonitorBundle): Array<{ label: string; value: string }> {
  const { event, telemetry, diagnostics, downstreamRiskAlerts } = bundle;
  return [
    { label: 'Model input', value: `${event.model.name} ${event.model.cycle} · ${event.model.resolution}` },
    { label: 'Landfall', value: `${event.landfall.sector} · ${event.landfall.eta}` },
    { label: 'Central pressure', value: `${event.centralPressure.value} ${event.centralPressure.unit}` },
    { label: 'Peak rainfall / wind (backend)', value: `${event.intensity.peakRainfall} ${event.intensity.rainfallUnit} · ${event.intensity.maxWind} ${event.intensity.windUnit}` },
    { label: 'Translation', value: `${telemetry.translationSpeed.value} ${telemetry.translationSpeed.unit} ${telemetry.translationSpeed.direction}` },
    { label: 'Affected 5 km cells (backend)', value: `${diagnostics.affected5kmCells.value} (${diagnostics.affected5kmCells.extremeZoneCount} extreme)` },
    ...downstreamRiskAlerts.slice(0, 3).map((a) => ({ label: 'Downstream risk', value: `${a.location} — ${a.hazard}` })),
  ];
}

// ---- Heatwave (historical-replay mock) ---------------------------------------

async function heatwaveFromBackend(config: ScenarioConfig): Promise<WeatherAnalysis> {
  const bundle = await getHistoricalReplay('heatwave-2022');
  const { selectedEvent, timeline, track, mapLayers, metrics } = bundle;
  const frames = timeline.frames;
  const t0 = parseBackendTime(frames[0].displayLabel);
  const leads = frames.map((_, i) => i * 24);
  const deficits = frames.map((f) => PRESSURE_BASELINE_HPA - f.pressureHpa);
  const maxDeficit = Math.max(...deficits);
  const centers = track.groundTruth.map((p) => ({ latitude: p.latitude, longitude: p.longitude }));

  const steps: StepCenter[] = frames.map((f, i) => ({
    leadTimeHours: leads[i],
    timestamp: parseBackendTime(f.displayLabel),
    center: centers[i],
    intensity: 0.35 + 0.65 * (deficits[i] / maxDeficit),
  }));
  const bounds = windowFor(centers, 2.4);
  const spacing = spacingFor(bounds);
  const aiPeakT = metrics.validation.aiDownscaledPeak.value;
  const nwpPeakT = metrics.validation.rawNwpPeak.value;
  const baselineT = 36;
  const ratio = (nwpPeakT - baselineT) / (aiPeakT - baselineT);
  const confidence = () => 0.8;

  const labels = {
    nwpSource: 'NWP-style input — simulated coarse field (backend heat-track mock)',
    aiModel: 'AI REFINED — SIMULATED (analytic construction, no ML model was run)',
    nwpResolutionKm: 12,
    aiResolutionKm: 5,
  };
  const trajectoryInfo = {
    representation: 'heat_core_movement',
    basis: 'backend_track_of_heat_core',
    note: 'Movement of the affected region (backend heat-core track: Bikaner → Delhi NCR → Lucknow). NWP path is the half-maximum centroid of the simulated coarse field.',
    useBackendCenter: true,
  };
  const make = (variableId: VariableId, unit: string, description: string, thresholdLabel: string, ai: ShapeSpec, peakRatio: number, threshold: number, withTrajectory: boolean) =>
    synthesizeVariable({
      meta: { id: variableId, label: VARIABLE_LABEL[variableId], unit, description, thresholdLabel },
      steps,
      bounds,
      spacing,
      ai,
      nwp: { peakRatio, broaden: 1.6, offsetKm: { east: 12, north: -8 }, lagSteps: 1 },
      threshold,
      provenance: PROVENANCE,
      labels,
      confidence,
      trajectory: withTrajectory ? trajectoryInfo : null,
    });

  const temperature = make(
    'temperature',
    '°C',
    'Daily maximum temperature (Tmax)',
    '≥ 45 °C (prototype threshold, not an IMD criterion)',
    { kind: 'blob', baseline: baselineT, peak: aiPeakT, sigmaAlongKm: 260, sigmaAcrossKm: 170, angleDeg: 5, envelope: { amp: 0.15, sigmaKm: 520 }, core: { amp: 0.25, sigmaKm: 40, shiftKm: 0 } },
    ratio,
    45,
    true,
  );
  const pressure = make(
    'pressure',
    'hPa',
    `Heat-low pressure deficit below ${PRESSURE_BASELINE_HPA} hPa`,
    `≥ ${fmtNum(maxDeficit * 0.5)} hPa deficit (prototype)`,
    { kind: 'radial', baseline: 0, peak: maxDeficit, sigmaAlongKm: 380, sigmaAcrossKm: 380, angleDeg: 0, envelope: { amp: 0.05, sigmaKm: 800 } },
    0.7,
    Number((maxDeficit * 0.5).toFixed(1)),
    true,
  );
  const gust = selectedEvent.metaPill.gusts.value;
  const wind = make(
    'wind',
    'km/h',
    'Near-surface wind speed (dry north-westerlies)',
    `≥ ${Math.round(gust * 0.7)} km/h (0.7 × backend gust; prototype)`,
    { kind: 'blob', baseline: 8, peak: gust, sigmaAlongKm: 300, sigmaAcrossKm: 200, angleDeg: 20, envelope: { amp: 0.1, sigmaKm: 600 } },
    0.8,
    Math.round(gust * 0.7),
    true,
  );
  const variables = [temperature, pressure, wind];

  const affected = temperature.anomaly.frames.ai
    .map((f) => f.footprint?.boundingRegion)
    .filter((b): b is GeoBounds => Boolean(b));
  const affectedBounds: GeoBounds | null = affected.length
    ? {
        north: Math.max(...affected.map((b) => b.north)),
        south: Math.min(...affected.map((b) => b.south)),
        east: Math.max(...affected.map((b) => b.east)),
        west: Math.min(...affected.map((b) => b.west)),
      }
    : null;

  return {
    event: {
      scenarioId: config.scenarioId,
      backendId: 'heatwave-2022',
      type: 'heatwave',
      name: selectedEvent.mapTitle,
      classification: 'Heatwave / ridge (backend heat-core track)',
      severity: selectedEvent.severityTag.split('/')[0].trim(),
      status: 'Replay mock · prototype data',
      region: `${selectedEvent.metaPill.landfall} · ${mapLayers.locationTag}`,
      centroid: track.landfallCallout,
      boundingBox: mapLayers.domain.bounds,
      detectedAt: t0,
      forecastStart: t0,
      forecastEnd: steps[steps.length - 1].timestamp,
      confidence: 0.8,
      modelLabel: 'Backend heat-core track → AI REFINED (simulated)',
      source: config.source,
      provenanceNote: 'Backend replay mock values (timestamps as provided); gridded fields are a deterministic frontend simulation.',
    },
    steps: steps.map((s): AnalysisStep => ({ leadTimeHours: s.leadTimeHours, timestamp: s.timestamp })),
    variables,
    defaultVariable: 'temperature',
    regions: affectedBounds ? [{ kind: 'affected', label: 'Affected region (AI footprint extent over all steps)', ring: ringFromBounds(affectedBounds) }] : [],
    contextVariable: 'temperature',
    facts: [
      { label: 'Backend severity tag', value: selectedEvent.severityTag },
      { label: 'Peak-heat location', value: track.landfallCallout.label },
      { label: 'Track (backend)', value: track.groundTruth.map((p) => p.nodeLabel ?? '').filter(Boolean).join(' → ') },
      { label: 'Heat-low pressure (backend)', value: `${Math.min(...frames.map((f) => f.pressureHpa))} hPa at peak` },
    ],
    backendFields: [
      { field: 'selectedEvent.mapTitle / severityTag', value: `${selectedEvent.mapTitle} · ${selectedEvent.severityTag}`, usedFor: 'Event name and severity indicator', origin: 'backend' },
      { field: 'track.groundTruth[] (node lat/lon)', value: `${centers.length} daily points`, usedFor: 'Heat-core track: centre of the affected region per step (used as motion only, not as truth)', origin: 'backend' },
      { field: 'timeline.frames[].displayLabel', value: `${frames[0].displayLabel} → ${frames[frames.length - 1].displayLabel}`, usedFor: 'Time steps (daily, as provided)', origin: 'backend' },
      { field: 'timeline.frames[].pressureHpa', value: frames.map((f) => f.pressureHpa).join(', ') + ' hPa', usedFor: 'Evolution of intensity and the pressure variable', origin: 'backend' },
      { field: 'metrics.validation.aiDownscaledPeak / rawNwpPeak', value: `${aiPeakT} / ${nwpPeakT} °C`, usedFor: 'AI / NWP peak Tmax amplitudes of the simulation (their "observed" label is not used or shown)', origin: 'backend' },
      { field: 'selectedEvent.metaPill.gusts', value: `${gust} km/h`, usedFor: 'AI peak wind amplitude', origin: 'backend' },
      { field: 'mapLayers.domain.bounds', value: `${mapLayers.domain.bounds.south}–${mapLayers.domain.bounds.north}°N`, usedFor: 'Event bounding box', origin: 'backend' },
      { field: 'Confidence', value: '80 %', usedFor: 'Prototype placeholder — the heatwave backend mock has no confidence field', origin: 'prototype' },
      { field: 'Field size, threshold 45 °C, baseline 36 °C', value: 'σ 260×170 km', usedFor: 'Prototype constants for the simulated field', origin: 'prototype' },
    ],
  };
}

// ---- Case 01 (existing retrospective mock adapter) ---------------------------

function halfMaxAreaOf(field: SpatialField, baseline: number): number {
  const spacing = (field.resolutionKm ?? 5) / 111.32;
  const peak = Math.max(...field.points.map((p) => p.value));
  const cut = baseline + 0.5 * (peak - baseline);
  return Math.round(
    field.points.reduce((s, p) => (p.value >= cut ? s + spacing * 111.32 * spacing * 111.32 * Math.cos((p.latitude * Math.PI) / 180) : s), 0),
  );
}

function fromRetrospectiveCase(c: RetrospectiveCase, config: ScenarioConfig): WeatherAnalysis {
  const anomaly = c.anomaly;
  if (!anomaly) throw new Error('Case 01 needs anomaly data');
  const steps = c.reference.frames.map((f): AnalysisStep => ({ leadTimeHours: f.leadTimeHours, timestamp: f.timestamp }));
  const baseline = anomaly.baseline.value;
  const evolution: EvolutionPoint[] = steps.map((s, i) => ({
    leadTimeHours: s.leadTimeHours,
    nwpPeak: anomaly.frames.nwp[i].peak,
    aiPeak: anomaly.frames.ai[i].peak,
    nwpFootprintAreaKm2: anomaly.frames.nwp[i].footprint?.areaKm2 ?? 0,
    aiFootprintAreaKm2: anomaly.frames.ai[i].footprint?.areaKm2 ?? 0,
    nwpHalfMaxAreaKm2: halfMaxAreaOf(c.nwp.frames[i].field, baseline),
    aiHalfMaxAreaKm2: halfMaxAreaOf(c.ai.frames[i].field, baseline),
    confidence: c.ai.confidence,
  }));
  const values = [...c.nwp.frames, ...c.ai.frames, ...c.reference.frames].flatMap((f) => f.field.points.map((p) => p.value));
  let min = Infinity;
  let max = -Infinity;
  for (const v of values) {
    if (v < min) min = v;
    if (v > max) max = v;
  }
  const refFootprint = anomaly.frames.reference.find((f) => f.footprint)?.footprint;
  const variable: VariableAnalysis = {
    meta: { id: 'precipitation', label: 'Precipitation', unit: 'mm/6h', description: '6-hour accumulated precipitation', thresholdLabel: `≥ ${anomaly.threshold.value} mm/6h (prototype threshold)` },
    nwp: c.nwp,
    ai: c.ai,
    reference: c.reference,
    anomaly,
    trajectory: c.trajectory,
    validation: c.validation,
    evolution,
    range: { min, max },
    threshold: anomaly.threshold.value,
    baseline,
  };
  return {
    event: {
      scenarioId: config.scenarioId,
      backendId: null,
      type: 'precipitation',
      name: c.info.eventName,
      classification: 'Synthetic retrospective prototype case',
      severity: c.detection.severity.toUpperCase(),
      status: 'PROTOTYPE CASE · synthetic timestamps',
      region: `${c.info.region}, ${c.info.country}`,
      centroid: refFootprint?.centroid ?? { latitude: (c.nwp.frames[0].field.bounds.north + c.nwp.frames[0].field.bounds.south) / 2, longitude: (c.nwp.frames[0].field.bounds.east + c.nwp.frames[0].field.bounds.west) / 2 },
      boundingBox: c.nwp.frames[0].field.bounds,
      detectedAt: c.info.dateRange.start,
      forecastStart: c.info.dateRange.start,
      forecastEnd: c.info.dateRange.end,
      confidence: c.ai.confidence,
      modelLabel: 'Simulated NWP → AI REFINED (simulated) → simulated reference',
      source: config.source,
      provenanceNote: 'Retrospective prototype (synthetic case). All values simulated; includes a simulated reference field.',
    },
    steps,
    variables: [variable],
    defaultVariable: 'precipitation',
    regions: [{ kind: 'affected', label: 'Affected region (simulated detection)', ring: ringFromBounds(c.detection.affectedRegion) }],
    contextVariable: 'precipitation',
    facts: [
      { label: 'Case', value: c.info.caseId },
      { label: 'Time range', value: c.info.dateRange.label },
      { label: 'Reference', value: `${c.reference.source}` },
    ],
    backendFields: [
      { field: 'retrospective.api getRetrospectiveCase() → nwp / ai / reference frames', value: `${steps.length} steps, 0.125° / 0.05° grids`, usedFor: 'NWP, AI REFINED and REFERENCE fields (all simulated)', origin: 'backend' },
      { field: 'anomaly (prototype threshold 60 mm/6h)', value: 'footprints, centroids, areas', usedFor: 'Footprint / anomaly layer, evolution charts', origin: 'backend' },
      { field: 'trajectory (evolving_footprint_centroid)', value: 'half-maximum centroid per step', usedFor: 'Footprint path (not a cyclone track)', origin: 'backend' },
      { field: 'validation[]', value: 'simulated prototype metrics', usedFor: 'Metrics strip (never a real accuracy)', origin: 'backend' },
    ],
  };
}
