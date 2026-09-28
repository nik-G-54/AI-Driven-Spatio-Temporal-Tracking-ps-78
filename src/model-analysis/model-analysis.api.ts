// Data adapter for the Model Analysis page.
//
// Components must go through these functions instead of importing JSON or
// fetching data directly, so the underlying source (mock JSON now, a real
// ML/backend API later) can be swapped without touching any UI code.

import overviewData from '../mockData/modelAnalysis/overview.json';
import modelsData from '../mockData/modelAnalysis/models.json';
import pipelineData from '../mockData/modelAnalysis/pipeline.json';
import configurationData from '../mockData/modelAnalysis/configuration.json';
import metricsData from '../mockData/modelAnalysis/metrics.json';
import verificationData from '../mockData/modelAnalysis/verification.json';
import trackErrorChartData from '../mockData/modelAnalysis/trackErrorChart.json';
import baselineComparisonData from '../mockData/modelAnalysis/baselineComparison.json';

export interface ModelAnalysisOverview {
  eventId: string;
  modelRunId: string;
  cycle: string;
  inputResolutionKm: number;
  outputResolutionKm: number;
  forecastLeadHour: number;
  ensembleMembers: number;
  analysisTimestamp: string;
  validationLabel: string;
  stageLabel: string;
  title: string;
  description: string;
  benchmarkDatasetLabel: string;
}

export interface ModelOption {
  id: string;
  name: string;
}

export interface AvailableModels {
  defaultModelId: string;
  options: ModelOption[];
}

export interface PipelineStage {
  order: number;
  name: string;
  model: string;
  badge: string;
  badgeVariant: string;
  description: string;
  footerLeft: string;
  icon: string;
  status: string;
}

export interface ConnectivityStep {
  icon: string;
  label: string;
}

export interface PipelineArchitectureData {
  description: string;
  activeStagesCount: number;
  cycleSyncLabel: string;
  stages: PipelineStage[];
  connectivity: ConnectivityStep[];
}

export interface ConfigSpec {
  label: string;
  value: string;
  detail: string;
  detailVariant?: string;
}

export interface ModelConfigurationData {
  runtimeId: string;
  specs: ConfigSpec[];
}

export interface MetricCard {
  category: string;
  title: string;
  value: number;
  unit: string;
  valueSuffix?: string;
  trend: { direction: string; label: string; variant: string };
  description: string;
}

export interface ModelMetricsData {
  trackError: MetricCard;
  spatialLocalization: MetricCard;
  peakIntensityRecovery: MetricCard;
  inferenceLatency: MetricCard;
}

export interface VerificationImage {
  id: string;
  label: string;
  badgeVariant: string;
  peakValue: number;
  peakUnit: string;
  caption: string;
  highlighted: boolean;
  imageUrl: string;
  altText: string;
}

export interface VerificationStripData {
  eventContext: string;
  images: VerificationImage[];
  meanAbsoluteError: { nwp12kmMm: number; ai5kmMm: number; percentChange: number };
}

export interface ChartSeriesPoint {
  leadHour: number;
  errorKm: number;
}

export interface ChartSeries {
  id: string;
  label: string;
  variant: string;
  points: ChartSeriesPoint[];
}

export interface TrackErrorChartData {
  xAxis: { min: number; max: number; unit: string };
  yAxis: { min: number; max: number; unit: string; gridLines: number[] };
  highlightLeadHour: number;
  series: ChartSeries[];
  moistureMassLossResidual: {
    value: number;
    unit: string;
    thresholdOperator: string;
    threshold: number;
    status: string;
    statusLabel: string;
  };
}

export interface ComparisonCell {
  value: string;
  note?: string;
  noteVariant?: string;
}

export interface ComparisonRow {
  metric: string;
  baseline: ComparisonCell;
  proposed: ComparisonCell;
  improvement: { value: string; label: string; variant: string };
  status: { label: string; variant: string };
}

export interface BaselineComparisonData {
  sampleSize: { count: number; label: string };
  rows: ComparisonRow[];
  footerNote: string;
  stationId: string;
  validationSuiteVersion: string;
}

export interface ModelAnalysisBundle {
  overview: ModelAnalysisOverview;
  models: AvailableModels;
  pipeline: PipelineArchitectureData;
  configuration: ModelConfigurationData;
  metrics: ModelMetricsData;
  verification: VerificationStripData;
  trackErrorChart: TrackErrorChartData;
  baselineComparison: BaselineComparisonData;
}

export async function getModelAnalysisOverview(): Promise<ModelAnalysisOverview> {
  return overviewData;
}

export async function getAvailableModels(): Promise<AvailableModels> {
  return modelsData;
}

export async function getPipelineArchitecture(): Promise<PipelineArchitectureData> {
  return pipelineData;
}

export async function getModelConfiguration(): Promise<ModelConfigurationData> {
  return configurationData as ModelConfigurationData;
}

export async function getModelMetrics(): Promise<ModelMetricsData> {
  return metricsData as ModelMetricsData;
}

export async function getVerificationStrip(): Promise<VerificationStripData> {
  return verificationData as VerificationStripData;
}

export async function getTrackErrorChart(): Promise<TrackErrorChartData> {
  return trackErrorChartData as TrackErrorChartData;
}

export async function getBaselineComparison(): Promise<BaselineComparisonData> {
  return baselineComparisonData as BaselineComparisonData;
}

// Combined resource — the shape a real "GET /model-analysis/:eventId" backend
// endpoint would plausibly return. `modelId` is accepted for forward
// compatibility (a real backend would scope metrics to the selected model
// run); the current mock dataset represents the default production pipeline.
export async function getModelAnalysis(_eventId?: string, _modelId?: string): Promise<ModelAnalysisBundle> {
  void _eventId;
  void _modelId;
  const [overview, models, pipeline, configuration, metrics, verification, trackErrorChart, baselineComparison] =
    await Promise.all([
      getModelAnalysisOverview(),
      getAvailableModels(),
      getPipelineArchitecture(),
      getModelConfiguration(),
      getModelMetrics(),
      getVerificationStrip(),
      getTrackErrorChart(),
      getBaselineComparison(),
    ]);
  return { overview, models, pipeline, configuration, metrics, verification, trackErrorChart, baselineComparison };
}
