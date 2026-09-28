// Data adapter for the Event Detail page.
//
// Components must go through these functions instead of importing JSON or
// fetching data directly, so the underlying source (mock JSON now, a real
// backend later) can be swapped without touching any UI code.

import eventsData from '../mockData/eventDetail/events.json';
import selectedEventData from '../mockData/eventDetail/selectedEvent.json';
import overviewData from '../mockData/eventDetail/overview.json';
import mapData from '../mockData/eventDetail/map.json';
import metricsData from '../mockData/eventDetail/metrics.json';
import hazardData from '../mockData/eventDetail/hazard.json';
import alertsData from '../mockData/eventDetail/alerts.json';

export const DEFAULT_EVENT_ID = 'bob-02';

export interface EventListItem {
  id: string;
  eventCode: string;
  name: string;
}

export interface SelectedEvent {
  id: string;
  eventCode: string;
  title: string;
  description: string;
}

export interface ScaleBand {
  label: string;
  variant: string;
}

export interface EventOverview {
  targetDomain: string;
  projection: string;
  validLeadTimeHours: number;
  validTimestampLabel: string;
  precipitationScale: ScaleBand[];
}

export interface MapBounds {
  north: number;
  south: number;
  east: number;
  west: number;
}

export interface GeoPoint {
  latitude: number;
  longitude: number;
}

export interface MetricWithUnit {
  value: number;
  unit: string;
}

export interface NwpFieldData {
  resolutionKm: number;
  gridMeshLabel: string;
  fieldPeak: MetricWithUnit;
  blurAreaKm: number;
  resolutionLabel: string;
  centroid: GeoPoint;
}

export interface GridCell {
  col: number;
  row: number;
  tier: string;
  isEpicenter?: boolean;
}

export interface AiFieldEpicenter extends GeoPoint {
  cellId: string;
  peak: MetricWithUnit;
  peakChangePercent: number;
}

export interface AiFieldData {
  resolutionKm: number;
  gridMeshLabel: string;
  truePeak: MetricWithUnit;
  peakRecoveryPercent: number;
  highRiskCells: number;
  epicenter: AiFieldEpicenter;
  cells: GridCell[];
}

export interface EventMapData {
  domain: { name: string; bounds: MapBounds };
  nwpField: NwpFieldData;
  aiField: AiFieldData;
}

export interface ChartPoint {
  x: number;
  density: number;
}

export interface DensityChart {
  leadTimeLabel: string;
  thresholdMmDay: number;
  xAxis: { min: number; max: number };
  nwp: { modeValue: number; points: ChartPoint[] };
  ai: { tailValue: number; points: ChartPoint[] };
}

export interface EnsembleDistributionBand {
  id: string;
  label: string;
  count: number;
  percent: number;
  description: string;
}

export interface EventMetrics {
  densityChart: DensityChart;
  physicsNote: { conservationPercent: number };
  ensemble: {
    memberCount: number;
    distribution: EnsembleDistributionBand[];
    spatialVariance: MetricWithUnit & { note: string };
    trackDispersal: { value: string; note: string };
    ensembleMean: MetricWithUnit;
    controlShift: MetricWithUnit & { note: string };
  };
}

export interface HazardCellInspector {
  cellId: string;
  sector: string;
  riskLevel: string;
  centroid: GeoPoint;
  hazardClassification: string;
  aiPredictedIntensity: MetricWithUnit;
  nwpComparisonIntensity: MetricWithUnit & { label: string };
  exceedanceProbability: { value: number; unit: string; thresholdMmDay: number };
  ensembleConsensus: { inTier: number; total: number; tier: string };
  vulnerabilityExposure: string;
  terrainElevation: MetricWithUnit;
  saturatedSoil: MetricWithUnit;
}

export interface CapAlertPayload {
  event_id: string;
  hazard: string;
  severity: string;
  lead_time_hours: number;
  valid_utc: string;
  centroid: { lat: number; lon: number };
  peak_intensity_mm_day: number;
  impact_radius_km: number;
  high_risk_cells_5km: number;
  downscaling_model: string;
  status: string;
}

export interface EventAlerts {
  status: string;
  payload: CapAlertPayload;
  modelRunId: string;
  cycleLabel: string;
}

export interface EventDetailBundle {
  selectedEvent: SelectedEvent;
  overview: EventOverview;
  map: EventMapData;
  metrics: EventMetrics;
  hazard: HazardCellInspector;
  alerts: EventAlerts;
}

export async function getEvents(): Promise<EventListItem[]> {
  return eventsData;
}

export async function getEvent(eventId: string): Promise<SelectedEvent> {
  if (eventId !== selectedEventData.id) {
    throw new Error(`Unknown event id: ${eventId}`);
  }
  return selectedEventData;
}

export async function getEventOverview(eventId: string): Promise<EventOverview> {
  void eventId;
  return overviewData;
}

export async function getEventMap(eventId: string): Promise<EventMapData> {
  void eventId;
  return mapData as EventMapData;
}

export async function getEventMetrics(eventId: string): Promise<EventMetrics> {
  void eventId;
  return metricsData as EventMetrics;
}

export async function getEventHazard(eventId: string): Promise<HazardCellInspector> {
  void eventId;
  return hazardData as HazardCellInspector;
}

export async function getEventAlerts(eventId: string): Promise<EventAlerts> {
  void eventId;
  return alertsData as EventAlerts;
}

// Combined resource — the shape a real "GET /events/:eventId" backend
// endpoint would plausibly return.
export async function getEventDetail(eventId: string): Promise<EventDetailBundle> {
  const [selectedEvent, overview, map, metrics, hazard, alerts] = await Promise.all([
    getEvent(eventId),
    getEventOverview(eventId),
    getEventMap(eventId),
    getEventMetrics(eventId),
    getEventHazard(eventId),
    getEventAlerts(eventId),
  ]);
  return { selectedEvent, overview, map, metrics, hazard, alerts };
}
