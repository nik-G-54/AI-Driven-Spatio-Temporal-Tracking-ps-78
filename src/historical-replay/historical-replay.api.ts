// Data adapter for the Historical Replay page.
//
// Components must go through these functions instead of importing JSON or
// fetching data directly, so the underlying source (mock JSON now, a real
// historical-event backend later) can be swapped without touching any UI
// code.

import eventsData from '../mockData/historicalReplay/events.json';
import comparisonModesData from '../mockData/historicalReplay/comparisonModes.json';
import selectedEventData from '../mockData/historicalReplay/selectedEvent.json';
import timelineData from '../mockData/historicalReplay/timeline.json';
import trackData from '../mockData/historicalReplay/track.json';
import hazardEnvelopeData from '../mockData/historicalReplay/hazardEnvelope.json';
import mapLayersData from '../mockData/historicalReplay/mapLayers.json';
import metricsData from '../mockData/historicalReplay/metrics.json';

export interface HistoricalEventOption {
  id: string;
  name: string;
  dropdownLabel: string;
  chipLabel: string;
  dateLabel: string;
}

export interface ComparisonMode {
  id: string;
  label: string;
}

export interface MetaFigure {
  value: number;
  unit: string;
}

export interface SelectedEvent {
  id: string;
  name: string;
  mapTitle: string;
  severityTag: string;
  metaPill: {
    gusts: MetaFigure;
    rainfall: MetaFigure;
    landfall: string;
    trackDurationHours: number;
  };
  synopticAssessment: string;
}

export interface TimelineFrame {
  index: number;
  leadLabel: string;
  dateLabel: string;
  displayLabel: string;
  isLandfall: boolean;
  pressureHpa: number;
  rainfallMmDay: number;
}

export interface ReplayTimeline {
  defaultFrameIndex: number;
  frames: TimelineFrame[];
}

export interface TrackPoint {
  frameIndex: number;
  latitude: number;
  longitude: number;
  nodeLabel?: string;
}

export interface LandfallCallout {
  label: string;
  timeLabel: string;
  latitude: number;
  longitude: number;
  trackErrorKm: number;
  aiFloodGridCapturePercent: number;
}

export interface LeadTimeBenchmark {
  trackDivergenceKm: number;
  trackDivergenceAtHour: number;
  earlierSurgeLocalizationHours: number;
}

export interface ReplayTrack {
  groundTruth: TrackPoint[];
  aiTrack: TrackPoint[];
  landfallCallout: LandfallCallout;
  leadTimeBenchmark: LeadTimeBenchmark;
}

export interface HazardCell {
  col: number;
  row: number;
  intensity: number;
}

export interface HazardFrame {
  frameIndex: number;
  center: { latitude: number; longitude: number };
  surgePeak: { value: number; unit: string };
  cells: HazardCell[];
}

export interface HazardEnvelope {
  frames: HazardFrame[];
}

export interface MapBounds {
  north: number;
  south: number;
  east: number;
  west: number;
}

export interface MapLegendItem {
  id: string;
  label: string;
  color: string;
  type: string;
}

export interface MapLayers {
  domain: { name: string; domainLabel: string; bounds: MapBounds };
  locationTag: string;
  legend: MapLegendItem[];
}

export interface ValidationMetric {
  value: number;
  unit: string;
}

export interface ReplayValidationMetrics {
  observedPeakRainfall: ValidationMetric & { source: string };
  aiDownscaledPeak: ValidationMetric & { capturePercent: number; deviationPercent: number };
  rawNwpPeak: ValidationMetric & { dilutedPercent: number; note: string };
  landfallTrackError: ValidationMetric & { evaluatedAtHour: number };
}

export interface PressureSeriesPoint {
  t: number;
  baselineHpa: number;
  groundTruthHpa: number;
  aiHpa: number;
}

export interface ReplayMosaic {
  pressureDrop: {
    minHpa: number;
    footer: Array<{ label: string; value: number; highlight?: boolean }>;
    series: PressureSeriesPoint[];
  };
  topography: {
    badge: string;
    nwpCellLabel: string;
    nwpCellAreaKm2: number;
    resolvingGainMultiplier: number;
    resolvingGainPercent: number;
    caption: string;
    footerText: string;
  };
  compute: {
    badge: string;
    rows: Array<{ label: string; value: string }>;
    seed: string;
    reproducible: boolean;
  };
}

export interface ReplayMetricsBundle {
  validation: ReplayValidationMetrics;
  mosaic: ReplayMosaic;
}

export interface HistoricalReplayBundle {
  selectedEvent: SelectedEvent;
  timeline: ReplayTimeline;
  track: ReplayTrack;
  hazardEnvelope: HazardEnvelope;
  mapLayers: MapLayers;
  metrics: ReplayMetricsBundle;
}

const SELECTED_EVENTS = selectedEventData as Record<string, SelectedEvent>;
const TIMELINES = timelineData as Record<string, ReplayTimeline>;
const TRACKS = trackData as Record<string, ReplayTrack>;
const HAZARD_ENVELOPES = hazardEnvelopeData as Record<string, HazardEnvelope>;
const MAP_LAYERS = mapLayersData as Record<string, MapLayers>;
const METRICS = metricsData as Record<string, ReplayMetricsBundle>;

export async function getHistoricalEvents(): Promise<HistoricalEventOption[]> {
  return eventsData;
}

export async function getComparisonModes(): Promise<ComparisonMode[]> {
  return comparisonModesData;
}

export async function getHistoricalEvent(eventId: string): Promise<SelectedEvent> {
  const event = SELECTED_EVENTS[eventId];
  if (!event) throw new Error(`Unknown historical event id: ${eventId}`);
  return event;
}

export async function getReplayTimeline(eventId: string): Promise<ReplayTimeline> {
  const timeline = TIMELINES[eventId];
  if (!timeline) throw new Error(`Unknown historical event id: ${eventId}`);
  return timeline;
}

export async function getTrackData(eventId: string): Promise<ReplayTrack> {
  const track = TRACKS[eventId];
  if (!track) throw new Error(`Unknown historical event id: ${eventId}`);
  return track;
}

export async function getHazardEnvelope(eventId: string): Promise<HazardEnvelope> {
  const hazard = HAZARD_ENVELOPES[eventId];
  if (!hazard) throw new Error(`Unknown historical event id: ${eventId}`);
  return hazard;
}

export async function getMapLayers(eventId: string): Promise<MapLayers> {
  const layers = MAP_LAYERS[eventId];
  if (!layers) throw new Error(`Unknown historical event id: ${eventId}`);
  return layers;
}

export async function getReplayMetrics(eventId: string): Promise<ReplayMetricsBundle> {
  const metrics = METRICS[eventId];
  if (!metrics) throw new Error(`Unknown historical event id: ${eventId}`);
  return metrics;
}

// Combined resource — the shape a real "GET /historical-events/:id" backend
// endpoint would plausibly return.
export async function getHistoricalReplay(eventId: string): Promise<HistoricalReplayBundle> {
  const [selectedEvent, timeline, track, hazardEnvelope, mapLayers, metrics] = await Promise.all([
    getHistoricalEvent(eventId),
    getReplayTimeline(eventId),
    getTrackData(eventId),
    getHazardEnvelope(eventId),
    getMapLayers(eventId),
    getReplayMetrics(eventId),
  ]);
  return { selectedEvent, timeline, track, hazardEnvelope, mapLayers, metrics };
}
