import { useEffect, useRef, useState } from 'react';
import './model-analysis.css';
import { getModelAnalysis, type ModelAnalysisBundle } from './model-analysis.api';
import ModelAnalysisHeader from './components/ModelAnalysisHeader';
import PipelineArchitecture from './components/PipelineArchitecture';
import ModelConfiguration from './components/ModelConfiguration';
import PerformanceMetrics from './components/PerformanceMetrics';
import VerificationStrip from './components/VerificationStrip';
import TrackErrorChart from './components/TrackErrorChart';
import BaselineComparison from './components/BaselineComparison';

export default function ModelAnalysis() {
  const [bundle, setBundle] = useState<ModelAnalysisBundle | null>(null);
  const [hasError, setHasError] = useState(false);
  const [selectedModelId, setSelectedModelId] = useState<string | null>(null);
  const [selectedStageOrder, setSelectedStageOrder] = useState<number | null>(null);
  const bundleRef = useRef<ModelAnalysisBundle | null>(null);

  useEffect(() => {
    let ignore = false;
    getModelAnalysis()
      .then((result) => {
        if (ignore) return;
        setBundle(result);
        bundleRef.current = result;
        setSelectedModelId(result.models.defaultModelId);
        setHasError(false);
      })
      .catch(() => {
        if (!ignore) setHasError(true);
      });
    return () => {
      ignore = true;
    };
  }, []);

  const handleDownloadReport = () => {
    const current = bundleRef.current;
    if (!current) return;
    const lines = [
      `Model Analysis & Verification Report`,
      `Generated: ${current.overview.analysisTimestamp}`,
      `Model Run: ${current.overview.modelRunId} (${current.overview.cycle})`,
      `Event: ${current.overview.eventId}`,
      ``,
      `-- Performance Verification Metrics --`,
      `Track Error (T+${current.overview.forecastLeadHour}h): ${current.metrics.trackError.value} ${current.metrics.trackError.unit} (${current.metrics.trackError.trend.label})`,
      `Spatial Localization (IoU): ${current.metrics.spatialLocalization.value} ${current.metrics.spatialLocalization.unit}`,
      `Peak Intensity Recovery: ${current.metrics.peakIntensityRecovery.value}${current.metrics.peakIntensityRecovery.valueSuffix ?? ''} ${current.metrics.peakIntensityRecovery.unit}`,
      `Inference Latency: ${current.metrics.inferenceLatency.value} ${current.metrics.inferenceLatency.unit}`,
      ``,
      `-- Quantitative Baseline Comparison (N=${current.baselineComparison.sampleSize.count}) --`,
      ...current.baselineComparison.rows.map(
        (row) => `${row.metric}: ${row.baseline.value} -> ${row.proposed.value} (${row.improvement.value} ${row.improvement.label}) [${row.status.label}]`,
      ),
      ``,
      current.baselineComparison.footerNote,
      `Station ID: ${current.baselineComparison.stationId} | Validation Suite ${current.baselineComparison.validationSuiteVersion}`,
    ];
    const blob = new Blob([lines.join('\n')], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = `${current.overview.modelRunId}-verification-report.txt`;
    anchor.click();
    URL.revokeObjectURL(url);
  };

  if (hasError) {
    return (
      <div className="max-w-[1440px] mx-auto px-7 py-6">
        <div className="p-6 rounded-xl border border-red-200 bg-red-50 text-[#B91C1C] text-body-md">
          Unable to load Model Analysis data. Please try refreshing the page.
        </div>
      </div>
    );
  }

  if (!bundle) {
    return <ModelAnalysisSkeleton />;
  }

  const { overview, models, pipeline, configuration, metrics, verification, trackErrorChart, baselineComparison } =
    bundle;

  return (
    <main className="relative min-h-screen bg-[#F8FAFC]">
      <div className="max-w-[1440px] mx-auto px-7 py-6">
        <div className="flex flex-col w-full gap-6">
          <ModelAnalysisHeader
            overview={overview}
            models={models}
            selectedModelId={selectedModelId ?? models.defaultModelId}
            onSelectModel={setSelectedModelId}
            onDownloadReport={handleDownloadReport}
          />

          <PipelineArchitecture
            pipeline={pipeline}
            selectedStageOrder={selectedStageOrder}
            onSelectStage={(order) => setSelectedStageOrder((prev) => (prev === order ? null : order))}
          />

          <ModelConfiguration configuration={configuration} />

          <PerformanceMetrics metrics={metrics} />

          <div className="grid grid-cols-1 xl:grid-cols-12 gap-5">
            <VerificationStrip verification={verification} />
            <TrackErrorChart chart={trackErrorChart} />
          </div>

          <BaselineComparison comparison={baselineComparison} />

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 bg-white rounded-xl font-mono text-[11px] text-[#475569]">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-[16px] text-[#475569]">info</span>
              <span>{baselineComparison.footerNote}</span>
            </div>
            <div className="flex items-center gap-4 text-[#475569] shrink-0">
              <span>Station ID: {baselineComparison.stationId}</span>
              <span>•</span>
              <span>Validation Suite {baselineComparison.validationSuiteVersion}</span>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}

function ModelAnalysisSkeleton() {
  return (
    <main className="relative min-h-screen bg-[#F8FAFC]">
      <div className="max-w-[1440px] mx-auto px-7 py-6 animate-pulse flex flex-col gap-6">
        <div className="flex flex-col gap-3">
          <div className="h-4 w-64 bg-[#E2E8F0] rounded" />
          <div className="h-8 w-96 bg-[#E2E8F0] rounded" />
        </div>
        <div className="h-64 bg-white border border-[#E2E8F0] rounded-xl" />
        <div className="h-40 bg-white border border-[#E2E8F0] rounded-xl" />
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-[164px] bg-white border border-[#E2E8F0] rounded-xl" />
          ))}
        </div>
        <div className="grid grid-cols-1 xl:grid-cols-12 gap-5">
          <div className="xl:col-span-7 h-80 bg-white border border-[#E2E8F0] rounded-xl" />
          <div className="xl:col-span-5 h-80 bg-white border border-[#E2E8F0] rounded-xl" />
        </div>
        <div className="h-72 bg-white border border-[#E2E8F0] rounded-xl" />
      </div>
    </main>
  );
}
