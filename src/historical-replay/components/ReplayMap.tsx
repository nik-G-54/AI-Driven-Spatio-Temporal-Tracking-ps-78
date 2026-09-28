import type { HazardEnvelope as HazardEnvelopeData, MapLayers, ReplayTrack, TimelineFrame } from '../historical-replay.api';
import { formatCoordinate, projectCoordinateToMap } from '../historical-replay.utils';
import ReplayMapLegend from './ReplayMapLegend';
import TrackLayer from './TrackLayer';
import HazardEnvelope from './HazardEnvelope';
import ReplayControls from './ReplayControls';
import ReplayTimeline from './ReplayTimeline';

interface ReplayMapProps {
  mapTitle: string;
  mapLayers: MapLayers;
  track: ReplayTrack;
  hazardEnvelope: HazardEnvelopeData;
  frames: TimelineFrame[];
  currentFrameIndex: number;
  onSelectFrame: (index: number) => void;
  isPlaying: boolean;
  onTogglePlay: () => void;
  onReset: () => void;
  onStepBack: () => void;
  onStepForward: () => void;
  speed: number;
  onSetSpeed: (speed: number) => void;
}

const SVG_WIDTH = 800;
const SVG_HEIGHT = 450;

export default function ReplayMap({
  mapTitle,
  mapLayers,
  track,
  hazardEnvelope,
  frames,
  currentFrameIndex,
  onSelectFrame,
  isPlaying,
  onTogglePlay,
  onReset,
  onStepBack,
  onStepForward,
  speed,
  onSetSpeed,
}: ReplayMapProps) {
  const currentFrame = frames[currentFrameIndex] ?? frames[0];
  const landfallFrame = frames.find((f) => f.isLandfall) ?? null;
  const landfallReached = landfallFrame !== null && currentFrameIndex >= landfallFrame.index;

  const bounds = mapLayers.domain.bounds;
  const landfallPoint = projectCoordinateToMap(track.landfallCallout.latitude, track.landfallCallout.longitude, bounds, SVG_WIDTH, SVG_HEIGHT);
  const calloutLeftPercent = Math.min(78, Math.max(4, (landfallPoint.x / SVG_WIDTH) * 100 + 6));
  const calloutTopPercent = Math.min(70, Math.max(4, (landfallPoint.y / SVG_HEIGHT) * 100 - 8));

  const hazardFrame = hazardEnvelope.frames.find((f) => f.frameIndex === currentFrameIndex) ?? null;

  return (
    <div className="xl:col-span-8 flex flex-col justify-between bg-white rounded-xl shadow-sm p-4 min-h-[640px] relative overflow-hidden">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#E5EEFF]">
        <div className="flex items-center gap-2">
          <span className="material-symbols-outlined text-[20px] text-[#0F172A]">layers</span>
          <div>
            <h2 className="text-headline-sm text-[#0F172A] font-bold">
              Geospatial Replay: {mapTitle} Track &amp; Downscaled Footprint
            </h2>
            <div className="text-label-sm text-[#475569]">
              Domain: {mapLayers.domain.name} ({mapLayers.domain.domainLabel})
            </div>
          </div>
        </div>
        <ReplayMapLegend legend={mapLayers.legend} />
      </div>

      <div className="relative w-full h-[450px] my-3 rounded-lg overflow-hidden bg-[#0A1628] select-none">
        <div
          className="absolute inset-0 opacity-60"
          style={{
            background:
              'radial-gradient(circle at 30% 70%, rgba(37,99,235,0.18), transparent 55%), radial-gradient(circle at 70% 20%, rgba(148,163,184,0.12), transparent 50%), linear-gradient(180deg, #0A1628 0%, #0B1C30 100%)',
          }}
        />

        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute left-6 top-3 font-mono text-[10px] text-[#565E74]">
            {mapLayers.domain.bounds.north.toFixed(2)}°N
          </div>
          <div className="absolute left-6 top-1/2 -translate-y-1/2 font-mono text-[10px] text-[#565E74]">
            {((mapLayers.domain.bounds.north + mapLayers.domain.bounds.south) / 2).toFixed(2)}°N
          </div>
          <div className="absolute left-6 bottom-4 font-mono text-[10px] text-[#565E74]">
            {mapLayers.domain.bounds.south.toFixed(2)}°N
          </div>
          <div className="absolute left-1/4 bottom-2 font-mono text-[10px] text-[#565E74]">
            {mapLayers.domain.bounds.west.toFixed(2)}°E
          </div>
          <div className="absolute left-1/2 bottom-2 font-mono text-[10px] text-[#565E74]">
            {((mapLayers.domain.bounds.west + mapLayers.domain.bounds.east) / 2).toFixed(2)}°E
          </div>
          <div className="absolute right-12 bottom-2 font-mono text-[10px] text-[#565E74]">
            {mapLayers.domain.bounds.east.toFixed(2)}°E
          </div>
          <svg className="w-full h-full stroke-[#565E74]/20" fill="none">
            <line x1="0" x2="100%" y1="25%" y2="25%" strokeDasharray="3 3" />
            <line x1="0" x2="100%" y1="50%" y2="50%" strokeDasharray="3 3" />
            <line x1="0" x2="100%" y1="75%" y2="75%" strokeDasharray="3 3" />
            <line x1="25%" x2="25%" y1="0" y2="100%" strokeDasharray="3 3" />
            <line x1="50%" x2="50%" y1="0" y2="100%" strokeDasharray="3 3" />
            <line x1="75%" x2="75%" y1="0" y2="100%" strokeDasharray="3 3" />
          </svg>
        </div>

        <HazardEnvelope frame={hazardFrame} bounds={bounds} svgWidth={SVG_WIDTH} svgHeight={SVG_HEIGHT} />

        <TrackLayer
          groundTruth={track.groundTruth}
          aiTrack={track.aiTrack}
          bounds={bounds}
          currentFrameIndex={currentFrameIndex}
          landfallFrameIndex={landfallFrame?.index ?? null}
          svgWidth={SVG_WIDTH}
          svgHeight={SVG_HEIGHT}
        />

        {landfallReached && (
          <div
            className="absolute bg-white/95 backdrop-blur-sm px-2.5 py-1.5 rounded shadow-md pointer-events-none border border-[#CBD5E1]/50 flex flex-col gap-0.5 max-w-[260px]"
            style={{ left: `${calloutLeftPercent}%`, top: `${calloutTopPercent}%` }}
          >
            <div className="flex items-center gap-1 text-label-sm text-[10px] text-[#EF4444] font-bold">
              <span className="w-1.5 h-1.5 rounded-full bg-[#EF4444]" />
              {track.landfallCallout.label} ({track.landfallCallout.timeLabel})
            </div>
            <div className="font-mono text-[10px] text-[#0F172A]">
              Coord: {formatCoordinate(track.landfallCallout.latitude, track.landfallCallout.longitude)} • Track
              Error: <strong>{track.landfallCallout.trackErrorKm} km</strong>
            </div>
            <div className="font-mono text-[9px] text-[#475569]">
              AI Flood Grid: {track.landfallCallout.aiFloodGridCapturePercent.toFixed(1)}% extreme peak parity
            </div>
          </div>
        )}

        <div className="absolute bottom-[28%] left-[6%] bg-[#0B1220]/90 text-white px-2 py-1 rounded font-mono text-[10px] flex items-center gap-1.5 border border-[#565E74]/40">
          <span className="material-symbols-outlined text-[12px] text-[#DAE2FD]">speed</span>
          {currentFrame.leadLabel}: {currentFrame.pressureHpa} hPa
        </div>

        <div className="absolute bottom-6 right-6 bg-white/90 backdrop-blur-sm p-2 rounded shadow font-mono text-[11px] text-[#0F172A] flex flex-col gap-1">
          <div className="text-[#475569] text-label-sm text-[9px] tracking-wider uppercase">Lead Time Benchmark</div>
          <div className="flex items-center gap-2">
            <span className="text-[#EF4444] font-bold">
              &Delta; {track.leadTimeBenchmark.trackDivergenceKm} km
            </span>
            <span className="text-[#475569]">Track Divergence at {track.leadTimeBenchmark.trackDivergenceAtHour}h</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[#16A34A] font-bold">+{track.leadTimeBenchmark.earlierSurgeLocalizationHours} hrs</span>
            <span className="text-[#475569]">Earlier Surge Localization</span>
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-2.5 pt-2 border-t border-[#E5EEFF]">
        <ReplayControls
          currentFrame={currentFrame}
          isPlaying={isPlaying}
          onTogglePlay={onTogglePlay}
          onReset={onReset}
          onStepBack={onStepBack}
          onStepForward={onStepForward}
          speed={speed}
          onSetSpeed={onSetSpeed}
        />
        <ReplayTimeline frames={frames} currentFrameIndex={currentFrameIndex} onSelectFrame={onSelectFrame} />
      </div>
    </div>
  );
}
