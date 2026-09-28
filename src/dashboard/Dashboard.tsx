import { useEffect, useState } from 'react';
import './dashboard.css';
import {
  getActiveAnomalies,
  getAnomalyOverview,
  getDashboardOverview,
  type ActiveAnomaly,
  type AnomalyOverview,
  type DashboardOverview as DashboardOverviewData,
} from './dashboard.api';
import DashboardHeader from './components/DashboardHeader';
import DashboardKpis from './components/DashboardKpis';
import MapPlaceholder from './components/MapPlaceholder';
import ZIndexForecastEvolution from './components/ZIndexForecastEvolution';
import AreaWiseSeverity from './components/AreaWiseSeverity';
import DetectedEventsTable from './components/DetectedEventsTable';

interface DashboardData {
  overview: DashboardOverviewData;
  anomalyOverview: AnomalyOverview;
  activeAnomalies: ActiveAnomaly[];
}

type LoadState = 'loading' | 'success' | 'error';

async function fetchDashboardData(): Promise<DashboardData> {
  const [overview, anomalyOverview, activeAnomalies] = await Promise.all([
    getDashboardOverview(),
    getAnomalyOverview(),
    getActiveAnomalies(),
  ]);
  return { overview, anomalyOverview, activeAnomalies };
}

export default function Dashboard() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loadState, setLoadState] = useState<LoadState>('loading');
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [selectedAnomalyId, setSelectedAnomalyId] = useState<string | null>(null);

  useEffect(() => {
    let ignore = false;

    fetchDashboardData()
      .then((result) => {
        if (ignore) return;
        setData(result);
        setSelectedAnomalyId((prev) => prev ?? result.activeAnomalies[0]?.id ?? null);
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
      const result = await fetchDashboardData();
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
        <div className="p-6 rounded-lg border border-destructive bg-destructive/10 text-destructive text-body-md flex items-center justify-between">
          <span>Unable to load Dashboard telemetry. Please check your data connection.</span>
          <button
            type="button"
            onClick={handleRefresh}
            className="px-3 py-1.5 rounded bg-destructive text-destructive-foreground text-xs font-semibold hover:opacity-90 transition-opacity"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  const activeAnomalies = data.activeAnomalies;
  const selectedId = selectedAnomalyId ?? activeAnomalies[0]?.id ?? '';

  return (
    <main className="relative min-h-screen bg-background text-foreground transition-colors duration-200">
      <div className="max-w-[1440px] mx-auto px-7 py-6">
        <div className="flex flex-col w-full gap-6">
          {/* Section 1: Header / Page Context */}
          <DashboardHeader overview={data.overview} onRefresh={handleRefresh} isRefreshing={isRefreshing} />

          {/* Section 2: Locked 4 KPI Cards (Active Anomalies | Severe Events | Next Window | Areas at Risk) */}
          <DashboardKpis anomalies={activeAnomalies} />

          {/* Section 3: Main Anomaly Map Area Placeholder */}
          <section className="w-full">
            <MapPlaceholder
              domain={data.anomalyOverview.domain}
              anomalies={activeAnomalies}
              selectedId={selectedId}
              onSelect={setSelectedAnomalyId}
            />
          </section>

          {/* Section 4: Z-Index Forecast Evolution & Area-wise Severity Visualizations */}
          <section className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <ZIndexForecastEvolution anomalies={activeAnomalies} />
            <AreaWiseSeverity anomalies={activeAnomalies} />
          </section>

          {/* Section 6: Detected Events Table */}
          <section className="w-full">
            <DetectedEventsTable
              anomalies={activeAnomalies}
              selectedId={selectedId}
              onSelect={setSelectedAnomalyId}
            />
          </section>
        </div>
      </div>
    </main>
  );
}

function DashboardSkeleton() {
  return (
    <main className="relative min-h-screen bg-background text-foreground">
      <div className="max-w-[1440px] mx-auto px-7 py-6 animate-pulse flex flex-col gap-6">
        <div className="h-24 border-b border-border pb-6 flex flex-col gap-3">
          <div className="h-4 w-64 bg-muted rounded" />
          <div className="h-8 w-96 bg-muted rounded" />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, index) => (
            <div key={index} className="h-28 bg-card border border-border rounded-lg" />
          ))}
        </div>
        <div className="w-full h-[460px] bg-card border border-border rounded-lg" />
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="h-[360px] bg-card border border-border rounded-lg" />
          <div className="h-[360px] bg-card border border-border rounded-lg" />
        </div>
        <div className="w-full h-[320px] bg-card border border-border rounded-lg" />
      </div>
    </main>
  );
}
