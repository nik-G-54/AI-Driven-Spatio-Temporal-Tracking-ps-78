import { useEffect, useState, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import './event-monitor.css';
import {
  getEventMonitorBundle,
  type EventMonitorBundle,
} from './event-monitor.api';
import { trajectoryToGeoJSON } from './event-monitor.utils';

import EventMonitorHeader from './components/EventMonitorHeader';
import EventSnapshot from './components/EventSnapshot';
import EventMap from './components/EventMap';
import TimeScrubber from './components/TimeScrubber';
import TelemetryCards from './components/TelemetryCards';
import IntensityEvolution from './components/IntensityEvolution';
import HazardOutlook from './components/HazardOutlook';
import AtmosphericDiagnostics from './components/AtmosphericDiagnostics';
import IntensityProbability from './components/IntensityProbability';
import RiskAlerts from './components/RiskAlerts';

const TIMESTEPS = [0, 12, 24, 36, 48, 72, 96, 120];
const PLAYBACK_INTERVAL_MS = 1400;

export default function EventMonitor() {
  const [searchParams, setSearchParams] = useSearchParams();
  const eventParam = searchParams.get('event') || 'BOB-02';

  const [selectedEventId, setSelectedEventId] = useState<string>(eventParam);
  const [bundle, setBundle] = useState<EventMonitorBundle | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [hasError, setHasError] = useState<boolean>(false);

  const [selectedTimestepIndex, setSelectedTimestepIndex] = useState<number>(0);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);

  const bundleRef = useRef<EventMonitorBundle | null>(null);

  // Sync URL query param when user selects another event
  const handleSelectEvent = (id: string) => {
    setSelectedEventId(id);
    setSearchParams({ event: id });
  };

  useEffect(() => {
    let isSubscribed = true;
    setIsLoading(true);
    setHasError(false);

    getEventMonitorBundle(selectedEventId)
      .then((data) => {
        if (!isSubscribed) return;
        setBundle(data);
        bundleRef.current = data;
        setSelectedTimestepIndex(0);
        setIsPlaying(false);
        setIsLoading(false);
      })
      .catch((err) => {
        console.error('[EventMonitor] Critical error fetching bundle:', err);
        if (!isSubscribed) return;
        setHasError(true);
        setIsLoading(false);
      });

    return () => {
      isSubscribed = false;
    };
  }, [selectedEventId]);

  // Scrubber playback timer
  useEffect(() => {
    if (!isPlaying) return;
    const interval = setInterval(() => {
      setSelectedTimestepIndex((prev) => (prev >= TIMESTEPS.length - 1 ? 0 : prev + 1));
    }, PLAYBACK_INTERVAL_MS);
    return () => clearInterval(interval);
  }, [isPlaying]);

  const handleExportGeoJson = () => {
    const current = bundleRef.current;
    if (!current) return;
    const trajectoryData = {
      historical: (current.trajectory.historicalWaypoints || []).map((w, idx) => ({
        latitude: w.lat,
        longitude: w.lon,
        leadHour: -((current.trajectory.historicalWaypoints.length - idx) * 12),
        timestamp: w.timestamp,
      })),
      forecast: (current.trajectory.forecastWaypoints || []).map((w, idx) => ({
        latitude: w.lat,
        longitude: w.lon,
        leadHour: (idx + 1) * 12,
        timestamp: w.timestamp,
        status: idx === current.trajectory.forecastWaypoints.length - 1 ? 'landfall' : 'forecast',
      })),
      uncertaintyCone: { confidence: 0.94, points: [] },
      hazardFootprint: {
        center: { latitude: current.eventDetails.location.lat, longitude: current.eventDetails.location.lon },
        windRadiusKm: 180,
        rainfallCoreRadiusKm: 60,
        rainfallThresholdMmDay: 200,
        rotationDeg: 45,
      },
      downscaling: {
        resolutionKm: 5,
        affectedCells: 14200,
        extremeCells: 1840,
        bounds: { north: 24, south: 14, east: 92, west: 80 },
      },
    };

    const geojson = trajectoryToGeoJSON(trajectoryData, current.eventDetails.id);
    const blob = new Blob([JSON.stringify(geojson, null, 2)], { type: 'application/geo+json' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = `${current.eventDetails.id}-trajectory.geojson`;
    anchor.click();
    URL.revokeObjectURL(url);
  };

  if (isLoading) {
    return <EventMonitorSkeleton />;
  }

  if (hasError || !bundle) {
    return (
      <div className="max-w-[1440px] mx-auto px-6 py-8">
        <div className="p-6 rounded-xl border border-red-300 bg-red-50 text-[#B91C1C] text-sm font-semibold flex items-center justify-between">
          <span>Unable to connect to the Prahari Event Monitoring API. Please check your backend connection or select another event.</span>
          <button
            onClick={() => handleSelectEvent('BOB-02')}
            className="px-4 py-2 rounded-lg bg-[#BA1A1A] text-white text-xs font-bold uppercase tracking-wider hover:bg-red-800 transition-colors"
          >
            Reset to BOB-02
          </button>
        </div>
      </div>
    );
  }

  const {
    eventList,
    eventDetails,
    trajectory,
    telemetry,
    diagnostics,
    intensityDistribution,
    riskAlerts,
  } = bundle;

  const currentLeadHour = TIMESTEPS[selectedTimestepIndex];
  const activeSeverity = eventList.find((e) => e.id === selectedEventId)?.severity || 'EXTREME';

  return (
    <main className="relative min-h-screen bg-[#F8FAFC]">
      <div className="max-w-[1440px] mx-auto px-6 py-6">
        <div className="flex flex-col w-full">
          {/* Header section */}
          <EventMonitorHeader
            eventDetails={eventDetails}
            eventList={eventList}
            selectedEventId={selectedEventId}
            onSelectEvent={handleSelectEvent}
          />

          {/* Main 2-Column Monitoring Grid */}
          <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 w-full items-start">
            {/* LEFT COLUMN (8 Cols): SeaMap Nautical Map, Time Scrubber, Telemetry Cards, Intensity Evolution Chart */}
            <div className="xl:col-span-8 flex flex-col gap-4">
              <EventMap />

              <TimeScrubber
                timesteps={TIMESTEPS}
                selectedIndex={selectedTimestepIndex}
                isPlaying={isPlaying}
                onSelectIndex={setSelectedTimestepIndex}
                onPrev={() => setSelectedTimestepIndex((i) => Math.max(0, i - 1))}
                onNext={() => setSelectedTimestepIndex((i) => Math.min(TIMESTEPS.length - 1, i + 1))}
                onTogglePlay={() => setIsPlaying((p) => !p)}
              />

              <TelemetryCards eventDetails={eventDetails} telemetry={telemetry} />

              <IntensityEvolution trajectory={trajectory} selectedLeadHour={currentLeadHour} />
            </div>

            {/* RIGHT COLUMN (4 Cols): Snapshot, Hazard Outlook, Atmospheric Diagnostics, Intensity Probability, Risk Alerts */}
            <div className="xl:col-span-4 flex flex-col gap-4">
              <EventSnapshot
                eventDetails={eventDetails}
                diagnostics={diagnostics}
                severity={activeSeverity}
              />

              <HazardOutlook eventDetails={eventDetails} riskAlerts={riskAlerts} />

              <AtmosphericDiagnostics diagnostics={diagnostics} telemetry={telemetry} />

              <IntensityProbability distribution={intensityDistribution} ensembleCount={20} />

              <RiskAlerts alerts={riskAlerts} eventId={selectedEventId} />

              {/* Action Buttons */}
              <div className="flex flex-col gap-2.5 pt-1">
                <button
                  type="button"
                  onClick={handleExportGeoJson}
                  className="w-full py-3 px-4 rounded-xl bg-white border border-[#CBD5E1] text-[#0F172A] hover:bg-[#F1F5F9] font-bold text-xs uppercase tracking-wider shadow-sm flex items-center justify-center gap-2 transition-colors cursor-pointer"
                >
                  <span className="material-symbols-outlined text-[18px] text-[#475569]">download</span>
                  <span>Export Track GeoJSON</span>
                </button>
              </div>
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
      <div className="max-w-[1440px] mx-auto px-6 py-6 animate-pulse">
        <div className="pb-6 border-b border-[#E2E8F0] mb-6 flex flex-col gap-3">
          <div className="h-5 w-48 bg-[#E2E8F0] rounded" />
          <div className="h-8 w-96 bg-[#E2E8F0] rounded" />
        </div>
        <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
          <div className="xl:col-span-8 flex flex-col gap-4">
            <div className="h-[520px] bg-white border border-[#E2E8F0] rounded-xl" />
            <div className="h-24 bg-white border border-[#E2E8F0] rounded-xl" />
            <div className="grid grid-cols-3 gap-3">
              <div className="h-24 bg-white border border-[#E2E8F0] rounded-xl" />
              <div className="h-24 bg-white border border-[#E2E8F0] rounded-xl" />
              <div className="h-24 bg-white border border-[#E2E8F0] rounded-xl" />
            </div>
            <div className="h-64 bg-white border border-[#E2E8F0] rounded-xl" />
          </div>
          <div className="xl:col-span-4 flex flex-col gap-4">
            <div className="h-64 bg-white border border-[#E2E8F0] rounded-xl" />
            <div className="h-48 bg-white border border-[#E2E8F0] rounded-xl" />
            <div className="h-40 bg-white border border-[#E2E8F0] rounded-xl" />
            <div className="h-48 bg-white border border-[#E2E8F0] rounded-xl" />
          </div>
        </div>
      </div>
    </main>
  );
}
