import { useEffect, useRef, useState } from 'react';
import './event-monitor.css';
import {
  getEventMonitor,
  getEventOptions,
  type EventMonitorBundle,
  type EventOption,
} from './event-monitor.api';
import { trajectoryToGeoJSON } from './event-monitor.utils';
import EventMonitorHeader from './components/EventMonitorHeader';
import TrajectoryMap from './components/TrajectoryMap';
import TimeScrubber from './components/TimeScrubber';
import EventTelemetry from './components/EventTelemetry';
import EventInformationPanel from './components/EventInformationPanel';
import DownstreamRiskAlerts from './components/DownstreamRiskAlerts';
import type { MapLayerVisibility } from './components/MapControls';

const DEFAULT_VISIBLE_LAYERS: MapLayerVisibility = {
  historicalTrack: true,
  forecastTrack: true,
  uncertaintyCone: true,
  hazardFootprint: true,
  currentPosition: true,
  forecastNodes: true,
  landfallMarker: true,
};

const PLAYBACK_INTERVAL_MS = 1200;
const ZOOM_MIN = 0.6;
const ZOOM_MAX = 2.4;
const ZOOM_STEP = 0.2;

export default function EventMonitor() {
  const [eventOptions, setEventOptions] = useState<EventOption[]>([]);
  const [selectedEventId, setSelectedEventId] = useState<string>('BOB-02');
  const [bundle, setBundle] = useState<EventMonitorBundle | null>(null);
  const [hasError, setHasError] = useState(false);
  const [loadedEventId, setLoadedEventId] = useState<string | null>(null);

  const [selectedTimelineIndex, setSelectedTimelineIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [mapZoom, setMapZoom] = useState(1);
  const [showGrid, setShowGrid] = useState(true);
  const [layersOpen, setLayersOpen] = useState(false);
  const [visibleLayers, setVisibleLayers] = useState<MapLayerVisibility>(DEFAULT_VISIBLE_LAYERS);

  const bundleRef = useRef<EventMonitorBundle | null>(null);

  useEffect(() => {
    let ignore = false;
    getEventOptions().then((options) => {
      if (!ignore) setEventOptions(options);
    });
    return () => {
      ignore = true;
    };
  }, []);

  useEffect(() => {
    let ignore = false;
    getEventMonitor(selectedEventId)
      .then((result) => {
        if (ignore) return;
        setBundle(result);
        bundleRef.current = result;
        setSelectedTimelineIndex(result.timeline.selectedIndex);
        setIsPlaying(false);
        setHasError(false);
        setLoadedEventId(selectedEventId);
      })
      .catch(() => {
        if (ignore) return;
        setHasError(true);
        setLoadedEventId(selectedEventId);
      });
    return () => {
      ignore = true;
    };
  }, [selectedEventId]);

  useEffect(() => {
    if (!isPlaying || !bundle) return;
    const lastIndex = bundle.timeline.steps.length - 1;
    const timer = setInterval(() => {
      setSelectedTimelineIndex((prev) => (prev >= lastIndex ? 0 : prev + 1));
    }, PLAYBACK_INTERVAL_MS);
    return () => clearInterval(timer);
  }, [isPlaying, bundle]);

  const toggleLayer = (key: keyof MapLayerVisibility) => {
    setVisibleLayers((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const handleExportGeoJson = () => {
    const current = bundleRef.current;
    if (!current) return;
    const geojson = trajectoryToGeoJSON(current.trajectory, current.event.id);
    const blob = new Blob([JSON.stringify(geojson, null, 2)], { type: 'application/geo+json' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = `${current.event.trackId}-trajectory.geojson`;
    anchor.click();
    URL.revokeObjectURL(url);
  };

  const isLoading = loadedEventId !== selectedEventId;

  if (isLoading) {
    return <EventMonitorSkeleton />;
  }

  if (hasError || !bundle) {
    return (
      <div className="max-w-[1440px] mx-auto px-7 py-6">
        <div className="p-6 rounded-xl border border-red-200 bg-red-50 text-[#B91C1C] text-body-md">
          Unable to load Event Monitor telemetry. Please try selecting a different event or refreshing the page.
        </div>
      </div>
    );
  }

  const { event, trajectory, timeline, telemetry, diagnostics, intensityDistribution, downstreamRiskAlerts } = bundle;
  const selectedLeadHour = timeline.steps[selectedTimelineIndex]?.leadHour ?? timeline.steps[0].leadHour;
  const lastTimelineIndex = timeline.steps.length - 1;

  return (
    <main className="relative min-h-screen bg-[#F8FAFC]">
      <div className="max-w-[1440px] mx-auto px-7 py-6">
        <div className="flex flex-col w-full">
          <EventMonitorHeader
            event={event}
            eventOptions={eventOptions}
            selectedEventId={selectedEventId}
            onSelectEvent={setSelectedEventId}
            ensembleMembers={timeline.ensembleMembers}
          />

          <div className="grid grid-cols-1 xl:grid-cols-12 gap-5 w-full items-start">
            <div className="xl:col-span-8 flex flex-col gap-4">
              <TrajectoryMap
                event={event}
                trajectory={trajectory}
                selectedLeadHour={selectedLeadHour}
                zoom={mapZoom}
                onZoomIn={() => setMapZoom((z) => Math.min(ZOOM_MAX, +(z + ZOOM_STEP).toFixed(2)))}
                onZoomOut={() => setMapZoom((z) => Math.max(ZOOM_MIN, +(z - ZOOM_STEP).toFixed(2)))}
                showGrid={showGrid}
                onToggleGrid={() => setShowGrid((v) => !v)}
                layersOpen={layersOpen}
                onToggleLayersOpen={() => setLayersOpen((v) => !v)}
                visibleLayers={visibleLayers}
                onToggleLayer={toggleLayer}
              />

              <TimeScrubber
                timeline={timeline}
                selectedIndex={selectedTimelineIndex}
                isPlaying={isPlaying}
                onSelectIndex={setSelectedTimelineIndex}
                onPrev={() => setSelectedTimelineIndex((i) => Math.max(0, i - 1))}
                onNext={() => setSelectedTimelineIndex((i) => Math.min(lastTimelineIndex, i + 1))}
                onTogglePlay={() => setIsPlaying((p) => !p)}
              />

              <EventTelemetry telemetry={telemetry} />
            </div>

            <div className="xl:col-span-4 flex flex-col gap-4">
              <EventInformationPanel
                event={event}
                diagnostics={diagnostics}
                intensityDistribution={intensityDistribution}
                onExportGeoJson={handleExportGeoJson}
              />
              <DownstreamRiskAlerts alerts={downstreamRiskAlerts} />
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}

function EventMonitorSkeleton() {
  return (
    <main className="relative min-h-screen bg-[#F8FAFC]">
      <div className="max-w-[1440px] mx-auto px-7 py-6 animate-pulse">
        <div className="pb-6 flex flex-col gap-3">
          <div className="h-4 w-64 bg-[#E2E8F0] rounded" />
          <div className="h-8 w-96 bg-[#E2E8F0] rounded" />
        </div>
        <div className="grid grid-cols-1 xl:grid-cols-12 gap-5">
          <div className="xl:col-span-8 flex flex-col gap-4">
            <div className="h-[620px] bg-white border border-[#E2E8F0] rounded-xl" />
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="h-16 bg-white border border-[#E2E8F0] rounded-lg" />
              ))}
            </div>
          </div>
          <div className="xl:col-span-4 flex flex-col gap-4">
            <div className="h-[560px] bg-white border border-[#E2E8F0] rounded-xl" />
            <div className="h-32 bg-white border border-[#E2E8F0] rounded-xl" />
          </div>
        </div>
      </div>
    </main>
  );
}
