import { useEffect, useRef, useState } from 'react';
import './historical-replay.css';
import {
  getComparisonModes,
  getHistoricalEvents,
  getHistoricalReplay,
  type ComparisonMode,
  type HistoricalEventOption,
  type HistoricalReplayBundle,
} from './historical-replay.api';
import HistoricalReplayHeader from './components/HistoricalReplayHeader';
import EventSelector from './components/EventSelector';
import EventMeta from './components/EventMeta';
import ReplayMap from './components/ReplayMap';
import EventSummary from './components/EventSummary';
import ReplayAnalysisMosaic from './components/ReplayAnalysisMosaic';

const DEFAULT_EVENT_ID = 'amphan-2020';
const BASE_INTERVAL_MS = 1200;

export default function HistoricalReplay() {
  const [events, setEvents] = useState<HistoricalEventOption[]>([]);
  const [comparisonModes, setComparisonModes] = useState<ComparisonMode[]>([]);
  const [selectedEventId, setSelectedEventId] = useState(DEFAULT_EVENT_ID);
  const [selectedComparisonModeId, setSelectedComparisonModeId] = useState<string | null>(null);

  const [bundle, setBundle] = useState<HistoricalReplayBundle | null>(null);
  const [hasError, setHasError] = useState(false);
  const [loadedEventId, setLoadedEventId] = useState<string | null>(null);

  const [currentFrameIndex, setCurrentFrameIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [speed, setSpeed] = useState(1);

  const bundleRef = useRef<HistoricalReplayBundle | null>(null);

  useEffect(() => {
    let ignore = false;
    getHistoricalEvents().then((result) => {
      if (!ignore) setEvents(result);
    });
    getComparisonModes().then((result) => {
      if (ignore) return;
      setComparisonModes(result);
      setSelectedComparisonModeId((prev) => prev ?? result[0]?.id ?? null);
    });
    return () => {
      ignore = true;
    };
  }, []);

  useEffect(() => {
    let ignore = false;
    getHistoricalReplay(selectedEventId)
      .then((result) => {
        if (ignore) return;
        setBundle(result);
        bundleRef.current = result;
        setCurrentFrameIndex(result.timeline.defaultFrameIndex);
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

  // Playback: advances one frame every BASE_INTERVAL_MS / speed, stops
  // automatically at the final frame rather than looping.
  useEffect(() => {
    if (!isPlaying || !bundle) return;
    const lastIndex = bundle.timeline.frames.length - 1;
    const timer = setInterval(() => {
      setCurrentFrameIndex((prev) => {
        if (prev >= lastIndex) {
          setIsPlaying(false);
          return prev;
        }
        return prev + 1;
      });
    }, BASE_INTERVAL_MS / speed);
    return () => clearInterval(timer);
  }, [isPlaying, speed, bundle]);

  const handleExportCaseStudy = () => {
    const current = bundleRef.current;
    if (!current) return;
    const lines = [
      `Historical Case Study: ${current.selectedEvent.name}`,
      `Severity: ${current.selectedEvent.severityTag}`,
      `Gusts: ${current.selectedEvent.metaPill.gusts.value} ${current.selectedEvent.metaPill.gusts.unit}`,
      `Rainfall: ${current.selectedEvent.metaPill.rainfall.value} ${current.selectedEvent.metaPill.rainfall.unit}`,
      `Landfall: ${current.selectedEvent.metaPill.landfall}`,
      `Track Duration: ${current.selectedEvent.metaPill.trackDurationHours} hrs`,
      ``,
      current.selectedEvent.synopticAssessment,
      ``,
      `-- Verified Event Validation --`,
      `Observed Peak Rainfall: ${current.metrics.validation.observedPeakRainfall.value} ${current.metrics.validation.observedPeakRainfall.unit} (${current.metrics.validation.observedPeakRainfall.source})`,
      `AI Downscaled Peak: ${current.metrics.validation.aiDownscaledPeak.value} ${current.metrics.validation.aiDownscaledPeak.unit} (${current.metrics.validation.aiDownscaledPeak.capturePercent}% capture)`,
      `Raw 12km NWP Peak: ${current.metrics.validation.rawNwpPeak.value} ${current.metrics.validation.rawNwpPeak.unit} (${current.metrics.validation.rawNwpPeak.note})`,
      `Landfall Track Error: ${current.metrics.validation.landfallTrackError.value} ${current.metrics.validation.landfallTrackError.unit}`,
      `Historical Reconstruction — Verified Against IMD & ECMWF ERA5 Reanalysis. DEMO / SIMULATION.`,
    ];
    downloadTextFile(`${current.selectedEvent.id}-case-study.txt`, lines.join('\n'));
  };

  const handleExportDataset = () => {
    const current = bundleRef.current;
    if (!current) return;
    downloadTextFile(
      `${current.selectedEvent.id}-imd-validation-dataset.json`,
      JSON.stringify({ selectedEvent: current.selectedEvent, validation: current.metrics.validation }, null, 2),
    );
  };

  if (loadedEventId !== selectedEventId) {
    return <HistoricalReplaySkeleton />;
  }

  if (hasError || !bundle) {
    return (
      <div className="max-w-[1440px] mx-auto px-7 py-6">
        <div className="p-6 rounded-xl border border-red-200 bg-red-50 text-[#B91C1C] text-body-md">
          Unable to load Historical Replay data. Please try selecting a different event or refreshing the page.
        </div>
      </div>
    );
  }

  const { selectedEvent, timeline, track, hazardEnvelope, mapLayers, metrics } = bundle;

  return (
    <main className="relative min-h-screen bg-[#F8FAFC]">
      <div className="max-w-[1440px] mx-auto px-7 py-6">
        <div className="flex flex-col w-full gap-5">
          <HistoricalReplayHeader
            events={events}
            selectedEventId={selectedEventId}
            onSelectEvent={setSelectedEventId}
            comparisonModes={comparisonModes}
            selectedComparisonModeId={selectedComparisonModeId ?? ''}
            onSelectComparisonMode={setSelectedComparisonModeId}
            onExportPdf={handleExportCaseStudy}
          />

          <div className="flex flex-col xl:flex-row items-start xl:items-center justify-between gap-4 bg-white p-4 rounded-xl shadow-sm">
            <EventSelector events={events} selectedEventId={selectedEventId} onSelectEvent={setSelectedEventId} />
            <EventMeta event={selectedEvent} />
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-12 gap-5 items-start">
            <ReplayMap
              mapTitle={selectedEvent.mapTitle}
              mapLayers={mapLayers}
              track={track}
              hazardEnvelope={hazardEnvelope}
              frames={timeline.frames}
              currentFrameIndex={currentFrameIndex}
              onSelectFrame={setCurrentFrameIndex}
              isPlaying={isPlaying}
              onTogglePlay={() => setIsPlaying((p) => !p)}
              onReset={() => {
                setIsPlaying(false);
                setCurrentFrameIndex(0);
              }}
              onStepBack={() => setCurrentFrameIndex((i) => Math.max(0, i - 1))}
              onStepForward={() =>
                setCurrentFrameIndex((i) => Math.min(timeline.frames.length - 1, i + 1))
              }
              speed={speed}
              onSetSpeed={setSpeed}
            />
            <EventSummary event={selectedEvent} validation={metrics.validation} onExportDataset={handleExportDataset} />
          </div>

          <ReplayAnalysisMosaic mosaic={metrics.mosaic} />
        </div>
      </div>
    </main>
  );
}

function downloadTextFile(filename: string, content: string) {
  const blob = new Blob([content], { type: 'text/plain' });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);
}

function HistoricalReplaySkeleton() {
  return (
    <main className="relative min-h-screen bg-[#F8FAFC]">
      <div className="max-w-[1440px] mx-auto px-7 py-6 animate-pulse flex flex-col gap-5">
        <div className="h-28 bg-white border border-[#E2E8F0] rounded-xl" />
        <div className="h-20 bg-white border border-[#E2E8F0] rounded-xl" />
        <div className="grid grid-cols-1 xl:grid-cols-12 gap-5">
          <div className="xl:col-span-8 h-[640px] bg-white border border-[#E2E8F0] rounded-xl" />
          <div className="xl:col-span-4 h-[640px] bg-white border border-[#E2E8F0] rounded-xl" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-48 bg-white border border-[#E2E8F0] rounded-xl" />
          ))}
        </div>
      </div>
    </main>
  );
}
