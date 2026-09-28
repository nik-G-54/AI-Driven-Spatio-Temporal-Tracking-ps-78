import { useEffect, useState } from 'react';
import './dashboard.css';
import {
  getActiveAnomalies,
  getAnomalyOverview,
  getDashboardKpis,
  getDashboardOverview,
  getForecastTimeline,
  getProcessingPipeline,
  type ActiveAnomaly,
  type AnomalyOverview,
  type DashboardKpis as DashboardKpisData,
  type DashboardOverview as DashboardOverviewData,
  type ForecastTimeline,
  type ProcessingPipeline as ProcessingPipelineData,
} from './dashboard.api';
import DashboardHeader from './components/DashboardHeader';
import DashboardKpis from './components/DashboardKpis';
import GlobalAnomalyOverview from './components/GlobalAnomalyOverview';
import ActiveTrackedAnomalies from './components/ActiveTrackedAnomalies';
import EnsembleForecastTimeline from './components/EnsembleForecastTimeline';
import ProcessingPipeline from './components/ProcessingPipeline';

interface DashboardData {
  overview: DashboardOverviewData;
  kpis: DashboardKpisData;
  anomalyOverview: AnomalyOverview;
  activeAnomalies: ActiveAnomaly[];
  forecastTimeline: ForecastTimeline;
  processingPipeline: ProcessingPipelineData;
}

type LoadState = 'loading' | 'success' | 'error';

async function fetchAllDashboardData(): Promise<DashboardData> {
  const [overview, kpis, anomalyOverview, activeAnomalies, forecastTimeline, processingPipeline] =
    await Promise.all([
      getDashboardOverview(),
      getDashboardKpis(),
      getAnomalyOverview(),
      getActiveAnomalies(),
      getForecastTimeline(),
      getProcessingPipeline(),
    ]);
  return { overview, kpis, anomalyOverview, activeAnomalies, forecastTimeline, processingPipeline };
}

export default function Dashboard() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loadState, setLoadState] = useState<LoadState>('loading');
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [selectedAnomalyId, setSelectedAnomalyId] = useState<string | null>(null);

  useEffect(() => {
    let ignore = false;

    fetchAllDashboardData()
      .then((result) => {
        if (ignore) return;
        setData(result);
        setSelectedAnomalyId((prev) => prev ?? result.anomalyOverview.selectedTarget.eventId);
        setLoadState('success');
      })
      .catch(() => {
        if (!ignore) setLoadState('error');
      });

    return () => {
      ignore = true;
    };
  }, []);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      const result = await fetchAllDashboardData();
      setData(result);
      setLoadState('success');
    } catch {
      setLoadState('error');
    } finally {
      setIsRefreshing(false);
    }
  };

  if (loadState === 'loading') {
    return <DashboardSkeleton />;
  }

  if (loadState === 'error' || !data) {
    return (
      <div className="max-w-[1440px] mx-auto px-7 py-6">
        <div className="p-6 rounded-xl border border-red-200 bg-red-50 text-[#B91C1C] text-body-md">
          Unable to load Dashboard telemetry. Please try refreshing the page.
        </div>
      </div>
    );
  }

  const activeAnomalies = data.activeAnomalies;
  const selectedId = selectedAnomalyId ?? activeAnomalies[0]?.id ?? '';

  return (
    <main className="relative min-h-screen bg-[#F8FAFC]">
      <div className="max-w-[1440px] mx-auto px-7 py-6">
        <div className="flex flex-col w-full">
          <DashboardHeader overview={data.overview} onRefresh={handleRefresh} isRefreshing={isRefreshing} />
          <DashboardKpis kpis={data.kpis} />

          <section className="grid grid-cols-1 lg:grid-cols-12 gap-5 mt-6 items-start">
            <GlobalAnomalyOverview data={data.anomalyOverview} />
            <ActiveTrackedAnomalies
              anomalies={activeAnomalies}
              selectedId={selectedId}
              onSelect={setSelectedAnomalyId}
            />
          </section>

          <section className="grid grid-cols-1 lg:grid-cols-2 gap-5 mt-6">
            <EnsembleForecastTimeline timeline={data.forecastTimeline} />
            <ProcessingPipeline pipeline={data.processingPipeline} />
          </section>
        </div>
      </div>
    </main>
  );
}

function DashboardSkeleton() {
  return (
    <main className="relative min-h-screen bg-[#F8FAFC]">
      <div className="max-w-[1440px] mx-auto px-7 py-6 animate-pulse">
        <div className="h-24 border-b border-[#E2E8F0] pb-6 flex flex-col gap-3">
          <div className="h-4 w-64 bg-[#E2E8F0] rounded" />
          <div className="h-8 w-96 bg-[#E2E8F0] rounded" />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-6">
          {Array.from({ length: 4 }).map((_, index) => (
            <div key={index} className="h-28 bg-white border border-[#E2E8F0] rounded-xl" />
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 mt-6">
          <div className="lg:col-span-8 min-h-[580px] bg-white border border-[#E2E8F0] rounded-xl" />
          <div className="lg:col-span-4 min-h-[580px] bg-white border border-[#E2E8F0] rounded-xl" />
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 mt-6">
          <div className="h-72 bg-white border border-[#E2E8F0] rounded-xl" />
          <div className="h-72 bg-white border border-[#E2E8F0] rounded-xl" />
        </div>
      </div>
    </main>
  );
}
