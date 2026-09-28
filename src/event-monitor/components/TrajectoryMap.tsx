import { useRef } from 'react';
import type { EventMonitorTrajectory, MonitoredEvent } from '../event-monitor.api';
import { kmToSvgLength, projectGeoPointToSvg } from '../event-monitor.utils';
import MapControls, { type MapLayerVisibility } from './MapControls';
import MapLegend from './MapLegend';

interface TrajectoryMapProps {
  event: MonitoredEvent;
  trajectory: EventMonitorTrajectory;
  selectedLeadHour: number;
  zoom: number;
  onZoomIn: () => void;
  onZoomOut: () => void;
  showGrid: boolean;
  onToggleGrid: () => void;
  layersOpen: boolean;
  onToggleLayersOpen: () => void;
  visibleLayers: MapLayerVisibility;
  onToggleLayer: (key: keyof MapLayerVisibility) => void;
}

const SVG_WIDTH = 1000;
const SVG_HEIGHT = 600;

export default function TrajectoryMap({
  event,
  trajectory,
  selectedLeadHour,
  zoom,
  onZoomIn,
  onZoomOut,
  showGrid,
  onToggleGrid,
  layersOpen,
  onToggleLayersOpen,
  visibleLayers,
  onToggleLayer,
}: TrajectoryMapProps) {
  const viewportRef = useRef<HTMLDivElement>(null);
  const bounds = event.mapMetadata.domain;

  const project = (lat: number, lon: number) => projectGeoPointToSvg(lat, lon, bounds, SVG_WIDTH, SVG_HEIGHT);

  const currentSvg = project(event.currentPosition.latitude, event.currentPosition.longitude);
  const landfallSvg = project(event.landfall.latitude, event.landfall.longitude);

  const historicalPath = [...trajectory.historical, { ...event.currentPosition }]
    .map((p) => {
      const svg = project(p.latitude, p.longitude);
      return `${svg.x},${svg.y}`;
    })
    .join(' L ');

  const forecastPath = trajectory.forecast
    .map((p) => {
      const svg = project(p.latitude, p.longitude);
      return `${svg.x},${svg.y}`;
    })
    .join(' L ');

  const conePolygon = trajectory.uncertaintyCone.points
    .map((p) => {
      const svg = project(p.latitude, p.longitude);
      return `${svg.x},${svg.y}`;
    })
    .join(' ');

  const gridTopLeft = project(trajectory.downscaling.bounds.north, trajectory.downscaling.bounds.west);
  const gridBottomRight = project(trajectory.downscaling.bounds.south, trajectory.downscaling.bounds.east);

  const hazardCenter = project(trajectory.hazardFootprint.center.latitude, trajectory.hazardFootprint.center.longitude);
  const outerRx = kmToSvgLength(trajectory.hazardFootprint.windRadiusKm, bounds, 'lon', SVG_WIDTH, SVG_HEIGHT);
  const outerRy = kmToSvgLength(trajectory.hazardFootprint.windRadiusKm, bounds, 'lat', SVG_WIDTH, SVG_HEIGHT);
  const innerRx = kmToSvgLength(trajectory.hazardFootprint.rainfallCoreRadiusKm, bounds, 'lon', SVG_WIDTH, SVG_HEIGHT);
  const innerRy = kmToSvgLength(trajectory.hazardFootprint.rainfallCoreRadiusKm, bounds, 'lat', SVG_WIDTH, SVG_HEIGHT);

  const calloutX = Math.max(10, Math.min(landfallSvg.x - 65, SVG_WIDTH - 270));
  const calloutY = Math.max(10, Math.min(landfallSvg.y + 40, SVG_HEIGHT - 90));

  const latLabels = [bounds.maxLat, (bounds.maxLat + bounds.minLat) / 2, bounds.minLat];
  const lonLabels = [bounds.minLon, (bounds.minLon + bounds.maxLon) / 2, bounds.maxLon];

  const handleFullscreen = () => {
    const el = viewportRef.current;
    if (!el) return;
    if (document.fullscreenElement) {
      void document.exitFullscreen();
    } else if (el.requestFullscreen) {
      void el.requestFullscreen();
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-sm p-4 flex flex-col justify-between relative overflow-hidden">
      <div className="flex flex-wrap items-center justify-between gap-3 pb-3 mb-2">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-[#E5EEFF] flex items-center justify-center text-black">
            <span className="material-symbols-outlined text-[20px]">explore</span>
          </div>
          <div>
            <div className="text-headline-sm text-[#0F172A]">Geospatial Trajectory &amp; Cone of Uncertainty</div>
            <div className="font-mono text-code-sm text-[#475569]">
              Domain: {event.mapMetadata.domainLabel} • Projected {event.mapMetadata.projection === 'MERCATOR_WGS84' ? 'EPSG:4326' : event.mapMetadata.projection}
            </div>
          </div>
        </div>
        <MapControls
          onZoomIn={onZoomIn}
          onZoomOut={onZoomOut}
          showGrid={showGrid}
          onToggleGrid={onToggleGrid}
          layersOpen={layersOpen}
          onToggleLayersOpen={onToggleLayersOpen}
          visibleLayers={visibleLayers}
          onToggleLayer={onToggleLayer}
          onFullscreen={handleFullscreen}
        />
      </div>

      <div ref={viewportRef} className="relative w-full h-[540px] rounded-lg bg-[#0F172A] overflow-hidden select-none">
        {showGrid && (
          <svg className="absolute inset-0 w-full h-full pointer-events-none opacity-25">
            <defs>
              <pattern id="geoGrid" width="60" height="60" patternUnits="userSpaceOnUse">
                <path d="M 60 0 L 0 0 0 60" fill="none" stroke="#94A3B8" strokeWidth="0.5" strokeDasharray="2 3" />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#geoGrid)" />
          </svg>
        )}

        <div
          className="absolute inset-0 transition-transform duration-200"
          style={{ transform: `scale(${zoom})`, transformOrigin: 'center' }}
        >
          <svg className="absolute inset-0 w-full h-full object-contain" viewBox={`0 0 ${SVG_WIDTH} ${SVG_HEIGHT}`}>
            <defs>
              <linearGradient id="coneGradient" x1="0%" y1="100%" x2="50%" y2="0%">
                <stop offset="0%" stopColor="#EF4444" stopOpacity="0.12" />
                <stop offset="60%" stopColor="#F59E0B" stopOpacity="0.22" />
                <stop offset="100%" stopColor="#DC2626" stopOpacity="0.35" />
              </linearGradient>
              <radialGradient id="hazardPulse" cx="50%" cy="50%" r="50%">
                <stop offset="0%" stopColor="#EF4444" stopOpacity="0.7" />
                <stop offset="40%" stopColor="#F97316" stopOpacity="0.4" />
                <stop offset="100%" stopColor="#FBBF24" stopOpacity="0" />
              </radialGradient>
              <pattern id="downscaleTiles" width="14" height="14" patternUnits="userSpaceOnUse">
                <rect width="13" height="13" fill="#3B82F6" fillOpacity="0.08" stroke="#60A5FA" strokeOpacity="0.4" strokeWidth="0.3" />
              </pattern>
            </defs>

            {/* Stylized Bay of Bengal / Eastern India coastline (basemap chrome) */}
            <path
              d="M 0,0 L 480,0 L 490,40 L 530,90 L 570,110 L 610,125 L 680,135 L 750,110 L 820,120 L 860,160 L 830,220 L 780,260 L 690,250 L 570,220 L 510,180 L 460,195 L 420,225 L 390,270 L 360,330 L 340,390 L 310,460 L 260,520 L 220,600 L 0,600 Z"
              fill="#1E293B"
              stroke="#334155"
              strokeWidth="1.2"
            />
            <path d="M 520,110 Q 420,150 360,250" fill="none" stroke="#475569" strokeDasharray="4 4" strokeWidth="0.8" />
            <path d="M 420,225 Q 350,290 280,380" fill="none" stroke="#475569" strokeDasharray="4 4" strokeWidth="0.8" />

            <text x="140" y="80" fill="#64748B" fontFamily="Inter" fontSize="12" fontWeight="600" letterSpacing="0.1em">
              INDIA (EASTERN SEABOARD)
            </text>
            <text x="320" y="190" fill="#94A3B8" fontFamily="Inter" fontSize="11" fontWeight="500">ODISHA</text>
            <text x="210" y="420" fill="#94A3B8" fontFamily="Inter" fontSize="11" fontWeight="500">ANDHRA PRADESH</text>
            <text x="560" y="80" fill="#94A3B8" fontFamily="Inter" fontSize="11" fontWeight="500">WEST BENGAL</text>
            <text x="730" y="90" fill="#64748B" fontFamily="Inter" fontSize="11" fontWeight="500">BANGLADESH</text>
            <text x="740" y="460" fill="#38BDF8" fontFamily="Inter" fontSize="14" fontWeight="700" letterSpacing="0.15em" opacity="0.4">
              BAY OF BENGAL
            </text>

            {/* 5km downscaling grid (data-driven bounds) */}
            {showGrid && (
              <>
                <rect
                  x={Math.min(gridTopLeft.x, gridBottomRight.x)}
                  y={Math.min(gridTopLeft.y, gridBottomRight.y)}
                  width={Math.abs(gridBottomRight.x - gridTopLeft.x)}
                  height={Math.abs(gridBottomRight.y - gridTopLeft.y)}
                  fill="url(#downscaleTiles)"
                />
                <rect
                  x={Math.min(gridTopLeft.x, gridBottomRight.x)}
                  y={Math.min(gridTopLeft.y, gridBottomRight.y)}
                  width={Math.abs(gridBottomRight.x - gridTopLeft.x)}
                  height={Math.abs(gridBottomRight.y - gridTopLeft.y)}
                  fill="none"
                  stroke="#3B82F6"
                  strokeDasharray="3 3"
                  strokeWidth="0.8"
                />
                <text
                  x={Math.min(gridTopLeft.x, gridBottomRight.x)}
                  y={Math.min(gridTopLeft.y, gridBottomRight.y) - 5}
                  fill="#60A5FA"
                  fontFamily="JetBrains Mono"
                  fontSize="9"
                >
                  {trajectory.downscaling.resolutionKm}KM DOWNSCALING APPLIED [N={trajectory.downscaling.affectedCells} CELLS]
                </text>
              </>
            )}

            {/* Cone of uncertainty */}
            {visibleLayers.uncertaintyCone && (
              <polygon points={conePolygon} fill="url(#coneGradient)" />
            )}

            {/* Hazard footprint: outer wind isovel + inner precipitation core */}
            {visibleLayers.hazardFootprint && (
              <>
                <ellipse
                  cx={hazardCenter.x}
                  cy={hazardCenter.y}
                  rx={outerRx}
                  ry={outerRy}
                  fill="#FBBF24"
                  fillOpacity="0.12"
                  stroke="#F59E0B"
                  strokeDasharray="3 2"
                  strokeWidth="1"
                  transform={`rotate(${trajectory.hazardFootprint.rotationDeg} ${hazardCenter.x} ${hazardCenter.y})`}
                />
                <ellipse
                  cx={hazardCenter.x}
                  cy={hazardCenter.y}
                  rx={innerRx}
                  ry={innerRy}
                  fill="url(#hazardPulse)"
                  stroke="#EF4444"
                  strokeWidth="1.5"
                  transform={`rotate(${trajectory.hazardFootprint.rotationDeg} ${hazardCenter.x} ${hazardCenter.y})`}
                />
              </>
            )}

            {/* Historical track */}
            {visibleLayers.historicalTrack && (
              <>
                <path d={`M ${historicalPath}`} fill="none" stroke="#94A3B8" strokeDasharray="2 3" strokeWidth="2.5" />
                {trajectory.historical.map((p) => {
                  const svg = project(p.latitude, p.longitude);
                  return (
                    <g key={p.leadHour}>
                      <circle cx={svg.x} cy={svg.y} r="4.5" fill="#0F172A" stroke="#94A3B8" strokeWidth="1.8" />
                      <text x={svg.x + 12} y={svg.y + 4} fill="#94A3B8" fontFamily="JetBrains Mono" fontSize="9">
                        {`T${p.leadHour}h`}
                      </text>
                    </g>
                  );
                })}
              </>
            )}

            {/* Current position */}
            {visibleLayers.currentPosition && (
              <g>
                <circle cx={currentSvg.x} cy={currentSvg.y} r="14" fill="none" stroke="#38BDF8" strokeWidth="1.2" opacity="0.5" className="animate-ping" />
                <circle cx={currentSvg.x} cy={currentSvg.y} r="8" fill="#0284C7" fillOpacity="0.4" stroke="#38BDF8" strokeWidth="1.5" />
                <circle cx={currentSvg.x} cy={currentSvg.y} r="3.5" fill="#FFFFFF" />
                <text x={currentSvg.x + 14} y={currentSvg.y + 4} fill="#E0F2FE" fontFamily="JetBrains Mono" fontSize="10" fontWeight="700">
                  T+00h (OBSERVED)
                </text>
              </g>
            )}

            {/* Forecast track */}
            {visibleLayers.forecastTrack && (
              <path d={`M ${forecastPath}`} fill="none" stroke="#F43F5E" strokeLinecap="round" strokeWidth="3" />
            )}

            {visibleLayers.forecastNodes &&
              trajectory.forecast
                .filter((p) => p.status !== 'landfall' && p.status !== 'observed')
                .map((p) => {
                  const svg = project(p.latitude, p.longitude);
                  const isSelected = p.leadHour === selectedLeadHour;
                  return (
                    <g key={p.leadHour}>
                      <circle cx={svg.x} cy={svg.y} r={isSelected ? 5.5 : 4} fill={isSelected ? '#BE123C' : '#E11D48'} stroke="#FFFFFF" strokeWidth={isSelected ? 1.5 : 1} />
                      <text x={svg.x + 10} y={svg.y + 4} fill="#FDA4AF" fontFamily="JetBrains Mono" fontSize="9">
                        {`T+${p.leadHour}h`}
                      </text>
                    </g>
                  );
                })}

            {/* Landfall marker */}
            {visibleLayers.landfallMarker &&
              (() => {
                const landfallPoint = trajectory.forecast.find((p) => p.status === 'landfall');
                if (!landfallPoint) return null;
                const svg = project(landfallPoint.latitude, landfallPoint.longitude);
                return (
                  <g transform={`translate(${svg.x}, ${svg.y})`}>
                    <circle
                      cx="0"
                      cy="0"
                      r="18"
                      fill="none"
                      stroke="#EF4444"
                      strokeDasharray="4 2"
                      strokeWidth="1.5"
                      className="animate-spin"
                      style={{ transformOrigin: '0 0', animationDuration: '8s' }}
                    />
                    <circle cx="0" cy="0" r="7" fill="#EF4444" stroke="#FFFFFF" strokeWidth="2" />
                    <circle cx="0" cy="0" r="2.5" fill="#FFFFFF" />
                  </g>
                );
              })()}

            {/* Scientific landfall callout */}
            <g transform={`translate(${calloutX}, ${calloutY})`}>
              <rect width="260" height="74" rx="6" fill="#0B1220" fillOpacity="0.94" stroke="#334155" strokeWidth="1" />
              <rect width="4" height="74" rx="2" fill="#EF4444" />
              <text x="14" y="18" fill="#F87171" fontFamily="Inter" fontSize="10" fontWeight="700" letterSpacing="0.06em">
                CRITICAL IMPACT PREDICTION
              </text>
              <text x="14" y="34" fill="#F1F5F9" fontFamily="JetBrains Mono" fontSize="11" fontWeight="600">
                Landfall: {event.landfall.eta}
              </text>
              <text x="14" y="49" fill="#94A3B8" fontFamily="JetBrains Mono" fontSize="10">
                Coord: {event.landfall.latitude.toFixed(2)}°N, {event.landfall.longitude.toFixed(2)}°E ({event.landfall.sector})
              </text>
              <text x="14" y="64" fill="#38BDF8" fontFamily="JetBrains Mono" fontSize="10">
                Peak Wind: {event.landfall.peakWind} km/h • Max Rain: {event.landfall.maxRain} mm/d
              </text>
            </g>

            {/* Coordinate scale graticules */}
            <text x="20" y={SVG_HEIGHT - 20} fill="#475569" fontFamily="JetBrains Mono" fontSize="9">
              LAT: {latLabels[2].toFixed(2)}°N
            </text>
            <text x="20" y={SVG_HEIGHT / 2} fill="#475569" fontFamily="JetBrains Mono" fontSize="9">
              LAT: {latLabels[1].toFixed(2)}°N
            </text>
            <text x="20" y="30" fill="#475569" fontFamily="JetBrains Mono" fontSize="9">
              LAT: {latLabels[0].toFixed(2)}°N
            </text>
            <text x="300" y={SVG_HEIGHT - 15} fill="#475569" fontFamily="JetBrains Mono" fontSize="9">
              LON: {lonLabels[0].toFixed(2)}°E
            </text>
            <text x="600" y={SVG_HEIGHT - 15} fill="#475569" fontFamily="JetBrains Mono" fontSize="9">
              LON: {lonLabels[1].toFixed(2)}°E
            </text>
            <text x="900" y={SVG_HEIGHT - 15} fill="#475569" fontFamily="JetBrains Mono" fontSize="9">
              LON: {lonLabels[2].toFixed(2)}°E
            </text>
          </svg>
        </div>

        <MapLegend
          uncertaintyConfidence={trajectory.uncertaintyCone.confidence}
          hazardThresholdMmDay={trajectory.hazardFootprint.rainfallThresholdMmDay}
          downscalingResolutionKm={trajectory.downscaling.resolutionKm}
        />

        <div className="absolute top-3 right-3 bg-[#0B1220]/80 backdrop-blur rounded px-2.5 py-1 font-mono text-[10px] text-[#38BDF8] flex items-center gap-2">
          <span className="w-1.5 h-1.5 rounded-full bg-[#38BDF8] animate-pulse" />
          PROJECTION: {event.mapMetadata.projection} • RES: {event.mapMetadata.resolution}
        </div>
      </div>
    </div>
  );
}
