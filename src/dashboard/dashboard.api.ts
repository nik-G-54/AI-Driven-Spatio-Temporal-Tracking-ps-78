// Data adapter for the Dashboard page.
//
// Components must go through these functions instead of importing JSON or
// fetching data directly, so the underlying source (mock JSON now, a real
// backend later) can be swapped without touching any UI code.

import overviewData from '../mockData/dashboard/overview.json';
import kpisData from '../mockData/dashboard/kpis.json';
import anomalyOverviewData from '../mockData/dashboard/anomalyOverview.json';
import activeAnomaliesData from '../mockData/dashboard/activeAnomalies.json';
import forecastTimelineData from '../mockData/dashboard/forecastTimeline.json';
import processingPipelineData from '../mockData/dashboard/processingPipeline.json';

export interface DashboardOverview {
  cycle: { label: string };
  epsNode: string;
  runStatus: string;
}

interface MetricWithUnit {
  value: number;
  unit: string;
}

export interface DashboardKpis {
  activeAnomalies: { value: number; breakdown: string; description: string };
  severeEvents: { value: number; context: string; description: string };
  highRiskCells: { value: number; delta: string; description: string };
  forecastHorizon: { value: number; unit: string; leadLabel: string; description: string };
}

export interface GeoDomain {
  label: string;
  latRange: [number, number];
  lonRange: [number, number];
}

export interface MapLayer {
  id: string;
  label: string;
  defaultActive: boolean;
}

export interface GeoPoint {
  latitude: number;
  longitude: number;
}

export interface SelectedTarget {
  eventId: string;
  alertId: string;
  severity: string;
  center: GeoPoint;
  peakPrecipitation: MetricWithUnit;
  windRadius: MetricWithUnit;
  leadTime: string;
}

export interface SecondaryAnomaly {
  id: string;
  label: string;
  center: GeoPoint;
  extentDeg: number;
}

export interface TrajectoryPoint extends GeoPoint {
  leadHour: number;
}

export interface RiskCell extends GeoPoint {
  severity: string;
}

export interface AnomalyOverview {
  domain: GeoDomain;
  layers: MapLayer[];
  selectedTarget: SelectedTarget;
  secondaryAnomaly: SecondaryAnomaly;
  trajectory: TrajectoryPoint[];
  riskCells: RiskCell[];
  legend: { projection: string; scale: string };
}

export interface ActiveAnomaly {
  id: string;
  name: string;
  type: string;
  region: string;
  coordinates: GeoPoint;
  destination: string | null;
  severity: string;
  peakRainfall: MetricWithUnit;
  maxWind: MetricWithUnit | null;
  leadTime: string;
  landfallEta: string | null;
  status: string | null;
  zIndex?: number;
}

export interface ForecastTimelineStep {
  day: number;
  leadHour: number;
  label: string;
  leadLabel: string;
  window: {
    description: string;
    downscaledRiskCells: number;
    ensembleAgreement: number;
  };
}

export interface ForecastTimeline {
  steps: ForecastTimelineStep[];
  selectedStepIndex: number;
}

export interface PipelineStage {
  stage: number;
  title: string;
  description: string;
  status: string;
  statusLabel: string;
}

export interface ProcessingPipeline {
  badge: string;
  stages: PipelineStage[];
  execution: {
    latency: MetricWithUnit;
    tile: string;
    inferenceNode: string;
  };
}

export async function getDashboardOverview(): Promise<DashboardOverview> {
  return overviewData;
}

export async function getDashboardKpis(): Promise<DashboardKpis> {
  return kpisData;
}

export async function getAnomalyOverview(): Promise<AnomalyOverview> {
  return anomalyOverviewData as AnomalyOverview;
}

export async function getActiveAnomalies(): Promise<ActiveAnomaly[]> {
  return activeAnomaliesData as ActiveAnomaly[];
}

export async function getForecastTimeline(): Promise<ForecastTimeline> {
  return forecastTimelineData;
}

export async function getProcessingPipeline(): Promise<ProcessingPipeline> {
  return processingPipelineData as ProcessingPipeline;
}
