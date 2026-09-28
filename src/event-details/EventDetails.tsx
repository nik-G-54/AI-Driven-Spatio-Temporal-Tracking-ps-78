import { useEffect, useRef, useState } from 'react';
import { useParams } from 'react-router-dom';
import './event-details.css';
import { DEFAULT_EVENT_ID, getEventDetail, type EventDetailBundle } from './event-details.api';
import EventDetailsHeader, { type ViewMode } from './components/EventDetailsHeader';
import EventOverview from './components/EventOverview';
import ComparisonView from './components/ComparisonView';
import IntensityAnalysis from './components/IntensityAnalysis';
import EnsembleAnalysis from './components/EnsembleAnalysis';
import GridInspector from './components/GridInspector';
import AlertOutput from './components/AlertOutput';

export default function EventDetails() {
  const { eventId: routeEventId } = useParams<{ eventId: string }>();
  const eventId = routeEventId ?? DEFAULT_EVENT_ID;

  const [bundle, setBundle] = useState<EventDetailBundle | null>(null);
  const [hasError, setHasError] = useState(false);
  const [loadedEventId, setLoadedEventId] = useState<string | null>(null);

  const [viewMode, setViewMode] = useState<ViewMode>('side-by-side');
  const [showGrid, setShowGrid] = useState(true);

  const bundleRef = useRef<EventDetailBundle | null>(null);

  useEffect(() => {
    let ignore = false;
    getEventDetail(eventId)
      .then((result) => {
        if (ignore) return;
        setBundle(result);
        bundleRef.current = result;
        setHasError(false);
        setLoadedEventId(eventId);
      })
      .catch(() => {
        if (ignore) return;
        setHasError(true);
        setLoadedEventId(eventId);
      });
    return () => {
      ignore = true;
    };
  }, [eventId]);

  const handleCopyJson = async () => {
    const current = bundleRef.current;
    if (!current) return;
    await navigator.clipboard.writeText(JSON.stringify(current.alerts.payload, null, 2));
  };

  const handleDownloadCapJson = () => {
    const current = bundleRef.current;
    if (!current) return;
    downloadTextFile(
      `${current.alerts.payload.event_id}-cap-alert.json`,
      JSON.stringify(current.alerts.payload, null, 2),
    );
  };

  const handleExportGeoJson = () => {
    const current = bundleRef.current;
    if (!current) return;
    const geojson = {
      type: 'FeatureCollection',
      features: current.map.aiField.cells.map((cell) => ({
        type: 'Feature',
        properties: {
          tier: cell.tier,
          isEpicenter: Boolean(cell.isEpicenter),
          eventId: current.alerts.payload.event_id,
        },
        geometry: {
          type: 'Point',
          coordinates: [current.alerts.payload.centroid.lon, current.alerts.payload.centroid.lat],
        },
      })),
    };
    downloadTextFile(`${current.alerts.payload.event_id}-hazard-cells.geojson`, JSON.stringify(geojson, null, 2));
  };

  const handleSendWebhook = () => {
    // No real webhook endpoint exists for this demo; this is an honest
    // client-side simulation only (see AlertOutput's confirmation message).
  };

  if (loadedEventId !== eventId) {
    return <EventDetailsSkeleton />;
  }

  if (hasError || !bundle) {
    return (
      <div className="max-w-[1440px] mx-auto px-7 py-6">
        <div className="p-6 rounded-xl border border-red-200 bg-red-50 text-[#B91C1C] text-body-md">
          Unable to load Event Detail data for this event. Please try again from Event Monitor.
        </div>
      </div>
    );
  }

  const { selectedEvent, overview, map, metrics, hazard, alerts } = bundle;

  return (
    <main className="relative min-h-screen bg-[#F8FAFC]">
      <div className="max-w-[1440px] mx-auto px-7 py-6">
        <div className="flex flex-col w-full gap-6">
          <EventDetailsHeader
            event={selectedEvent}
            viewMode={viewMode}
            onSetViewMode={setViewMode}
            showGrid={showGrid}
            onToggleGrid={() => setShowGrid((v) => !v)}
            onDownloadCapJson={handleDownloadCapJson}
          />

          <section className="flex flex-col gap-3">
            <EventOverview overview={overview} />
            <ComparisonView
              viewMode={viewMode}
              showGrid={showGrid}
              nwpField={map.nwpField}
              aiField={map.aiField}
              bounds={map.domain.bounds}
            />
          </section>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            <div className="lg:col-span-7 flex flex-col gap-6">
              <IntensityAnalysis chart={metrics.densityChart} conservationPercent={metrics.physicsNote.conservationPercent} />
              <EnsembleAnalysis ensemble={metrics.ensemble} />
            </div>
            <div className="lg:col-span-5 flex flex-col gap-6">
              <GridInspector hazard={hazard} />
              <AlertOutput
                alerts={alerts}
                onCopyJson={handleCopyJson}
                onExportGeoJson={handleExportGeoJson}
                onSendWebhook={handleSendWebhook}
              />
            </div>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 bg-white rounded-lg font-mono text-[11px] text-[#475569]">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-[16px] text-[#475569]">info</span>
              <span>DEMO / SIMULATION - Synthetic forecast cycle for technical evaluation</span>
            </div>
            <span className="text-[#0F172A] font-medium">
              {alerts.cycleLabel} • Model Run ID: {alerts.modelRunId}
            </span>
          </div>
        </div>
      </div>
    </main>
  );
}

function downloadTextFile(filename: string, content: string) {
  const blob = new Blob([content], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);
}

function EventDetailsSkeleton() {
  return (
    <main className="relative min-h-screen bg-[#F8FAFC]">
      <div className="max-w-[1440px] mx-auto px-7 py-6 animate-pulse flex flex-col gap-6">
        <div className="h-28 bg-white border border-[#E2E8F0] rounded-xl" />
        <div className="h-10 bg-white border border-[#E2E8F0] rounded-lg" />
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div className="h-[480px] bg-white border border-[#E2E8F0] rounded-xl" />
          <div className="h-[480px] bg-white border border-[#E2E8F0] rounded-xl" />
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-7 flex flex-col gap-6">
            <div className="h-72 bg-white border border-[#E2E8F0] rounded-xl" />
            <div className="h-56 bg-white border border-[#E2E8F0] rounded-xl" />
          </div>
          <div className="lg:col-span-5 flex flex-col gap-6">
            <div className="h-72 bg-white border border-[#E2E8F0] rounded-xl" />
            <div className="h-56 bg-white border border-[#E2E8F0] rounded-xl" />
          </div>
        </div>
      </div>
    </main>
  );
}
