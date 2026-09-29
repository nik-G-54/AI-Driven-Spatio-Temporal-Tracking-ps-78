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
import AnomalyTypeDistribution from './components/AnomalyTypeDistribution';
import DailyAnomalyAlertDensity from './components/DailyAnomalyAlertDensity';
import DetectedEventsTable from './components/DetectedEventsTable';
import { BentoGrid } from '../shared/ui/bento-grid';

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
        setSelectedAnomalyId((prev) => prev ?? null);
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

  const handleSelectAnomaly = (id: string) => {
    setSelectedAnomalyId((prev) => (prev === id ? null : id));
  };

  const activeAnomalies = data.activeAnomalies;
  const selectedId = selectedAnomalyId ?? '';

  return (
    <main className="relative min-h-screen bg-background text-foreground transition-colors duration-200">
      <div className="max-w-[1440px] mx-auto px-7 py-6">
        <div className="flex flex-col w-full gap-6">
          {/* Header & Page Context */}
          <DashboardHeader overview={data.overview} onRefresh={handleRefresh} isRefreshing={isRefreshing} />

          {/* 4 KPI Cards */}
          <DashboardKpis anomalies={activeAnomalies} />

          {/* Bento Grid Container for Map, Anomaly Distribution, Severity Distribution, and Priority Table */}
          <BentoGrid className="auto-rows-auto gap-6">
            {/* Bento Item 1: Main Weather Anomaly Map (Full Width: col-span-3) */}
            <div className="col-span-3">
              <MapPlaceholder
                domain={data.anomalyOverview.domain}
                anomalies={activeAnomalies}
                selectedId={selectedId}
                onSelect={handleSelectAnomaly}
              />
            </div>

            {/* Bento Item 2: Anomaly Type Distribution (1/3 Width: col-span-3 lg:col-span-1) */}
            <div className="col-span-3 lg:col-span-1">
              <AnomalyTypeDistribution anomalies={activeAnomalies} />
            </div>

            {/* Bento Item 3: Severity Distribution (2/3 Width: col-span-3 lg:col-span-2) */}
            <div className="col-span-3 lg:col-span-2">
              <DailyAnomalyAlertDensity anomalies={activeAnomalies} />
            </div>

            {/* Bento Item 4: Priority Events Table (Full Width: col-span-3) */}
            <div className="col-span-3">
              <DetectedEventsTable
                anomalies={activeAnomalies}
                selectedId={selectedId}
                onSelect={handleSelectAnomaly}
              />
            </div>
          </BentoGrid>
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
