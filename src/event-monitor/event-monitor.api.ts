// Data adapter for the Event Monitor page.
//
// Components must go through these functions instead of importing JSON or
// fetching data directly, so the underlying source (mock JSON now, a real
// backend later) can be swapped without touching any UI code.

import eventData from '../mockData/eventMonitor/event.json';
import eventOptionsData from '../mockData/eventMonitor/eventOptions.json';
import trajectoryData from '../mockData/eventMonitor/trajectory.json';
import timelineData from '../mockData/eventMonitor/timeline.json';
import telemetryData from '../mockData/eventMonitor/telemetry.json';
import diagnosticsData from '../mockData/eventMonitor/diagnostics.json';
import intensityDistributionData from '../mockData/eventMonitor/intensityDistribution.json';
import downstreamRiskAlertsData from '../mockData/eventMonitor/downstreamRiskAlerts.json';

export interface GeoPoint {
  latitude: number;
  longitude: number;
}

export interface EventOption {
  id: string;
  label: string;
  severity: string;
}

export interface MonitoredEvent {
  id: string;
  trackId: string;
  name: string;
  displayName: string;
  type: string;
  classification: string;
  severity: string;
  currentPosition: GeoPoint;
  centralPressure: { value: number; unit: string };
  intensity: { peakRainfall: number; rainfallUnit: string; maxWind: number; windUnit: string };
  forecast: { leadHours: number; landfallEta: string };
  trackConfidence: number;
  model: { name: string; cycle: string; resolution: string };
  landfall: { latitude: number; longitude: number; sector: string; eta: string; peakWind: number; maxRain: number };
  mapMetadata: {
    domain: { minLat: number; maxLat: number; minLon: number; maxLon: number };
    domainLabel: string;
    projection: string;
    resolution: string;
  };
}

export interface TrajectoryPoint extends GeoPoint {
  leadHour: number;
  timestamp: string;
  status?: string;
}

export interface EventMonitorTrajectory {
  historical: TrajectoryPoint[];
  forecast: TrajectoryPoint[];
  uncertaintyCone: { confidence: number; points: GeoPoint[] };
  hazardFootprint: {
    center: GeoPoint;
    windRadiusKm: number;
    rainfallCoreRadiusKm: number;
    rainfallThresholdMmDay: number;
    rotationDeg: number;
  };
  downscaling: {
    resolutionKm: number;
    affectedCells: number;
    extremeCells: number;
    bounds: { north: number; south: number; east: number; west: number };
  };
}

export interface TimelineStep {
  leadHour: number;
  label: string;
  validTime: string;
  progress: number;
}

export interface EventTimeline {
  selectedIndex: number;
  stepLabel: string;
  ensembleMembers: number;
  cacheLoadedPercent: number;
  steps: TimelineStep[];
}

export interface EventTelemetry {
  windCoreRadius: { value: number; unit: string; label: string; classification: string };
  precipitableWater: { value: number; unit: string; percentile: string };
  translationSpeed: { value: number; unit: string; direction: string; steeringLevel: string };
}

export interface EventDiagnostics {
  affected5kmCells: { value: number; extremeZoneCount: number };
  maxGustForecast: { value: number; unit: string };
  nwpModelInput: { model: string; cycle: string; resolution: string };
  spatioTemporalGnn: { node: string; inferenceTimeMs: number };
  oceanThermalEnergy: { value: number; unit: string; comparator: string };
  simulationNote: string;
}

export interface IntensityDistribution {
  ensembleMembers: number;
  distribution: Array<{ label: string; percentage: number; isModal?: boolean }>;
}

export interface DownstreamRiskAlert {
  location: string;
  hazard: string;
  severity: string;
}

export interface EventMonitorBundle {
  event: MonitoredEvent;
  trajectory: EventMonitorTrajectory;
  timeline: EventTimeline;
  telemetry: EventTelemetry;
  diagnostics: EventDiagnostics;
  intensityDistribution: IntensityDistribution;
  downstreamRiskAlerts: DownstreamRiskAlert[];
}

const EVENTS = eventData as Record<string, MonitoredEvent>;
const TRAJECTORIES = trajectoryData as Record<string, EventMonitorTrajectory>;
const TIMELINES = timelineData as Record<string, EventTimeline>;
const TELEMETRY = telemetryData as Record<string, EventTelemetry>;
const DIAGNOSTICS = diagnosticsData as Record<string, EventDiagnostics>;
const INTENSITY_DISTRIBUTIONS = intensityDistributionData as Record<string, IntensityDistribution>;
const DOWNSTREAM_ALERTS = downstreamRiskAlertsData as Record<string, DownstreamRiskAlert[]>;

export async function getEventOptions(): Promise<EventOption[]> {
  return eventOptionsData;
}

export async function getEvent(eventId: string): Promise<MonitoredEvent> {
  const event = EVENTS[eventId];
  if (!event) throw new Error(`Unknown event id: ${eventId}`);
  return event;
}

export async function getTrajectory(eventId: string): Promise<EventMonitorTrajectory> {
  const trajectory = TRAJECTORIES[eventId];
  if (!trajectory) throw new Error(`Unknown event id: ${eventId}`);
  return trajectory;
}

export async function getTimeline(eventId: string): Promise<EventTimeline> {
  const timeline = TIMELINES[eventId];
  if (!timeline) throw new Error(`Unknown event id: ${eventId}`);
  return timeline;
}

export async function getTelemetry(eventId: string): Promise<EventTelemetry> {
  const telemetry = TELEMETRY[eventId];
  if (!telemetry) throw new Error(`Unknown event id: ${eventId}`);
  return telemetry;
}

export async function getDiagnostics(eventId: string): Promise<EventDiagnostics> {
  const diagnostics = DIAGNOSTICS[eventId];
  if (!diagnostics) throw new Error(`Unknown event id: ${eventId}`);
  return diagnostics;
}

export async function getIntensityDistribution(eventId: string): Promise<IntensityDistribution> {
  const distribution = INTENSITY_DISTRIBUTIONS[eventId];
  if (!distribution) throw new Error(`Unknown event id: ${eventId}`);
  return distribution;
}

export async function getDownstreamRiskAlerts(eventId: string): Promise<DownstreamRiskAlert[]> {
  const alerts = DOWNSTREAM_ALERTS[eventId];
  if (!alerts) throw new Error(`Unknown event id: ${eventId}`);
  return alerts;
}

// Combined resource for a given event — the shape a real "GET /events/:id"
// backend endpoint would plausibly return. Components fetch through this
// rather than assembling the 7 resources themselves.
export async function getEventMonitor(eventId: string): Promise<EventMonitorBundle> {
  const [event, trajectory, timeline, telemetry, diagnostics, intensityDistribution, downstreamRiskAlerts] =
    await Promise.all([
      getEvent(eventId),
      getTrajectory(eventId),
      getTimeline(eventId),
      getTelemetry(eventId),
      getDiagnostics(eventId),
      getIntensityDistribution(eventId),
      getDownstreamRiskAlerts(eventId),
    ]);
  return { event, trajectory, timeline, telemetry, diagnostics, intensityDistribution, downstreamRiskAlerts };
}
