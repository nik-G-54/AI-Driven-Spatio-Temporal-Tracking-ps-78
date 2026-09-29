import { useRef } from 'react';
import type { ApiEventDetails, ApiTrajectoryResponse, ApiDiagnosticsResponse } from '../event-monitor.api';
import MapControls, { type MapLayerVisibility } from './MapControls';
import MapLegend from './MapLegend';

export interface MapDataContract {
  eventDetails: ApiEventDetails;
  trajectory: ApiTrajectoryResponse;
  diagnostics: ApiDiagnosticsResponse;
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
  eventDetails,
  trajectory,
  diagnostics,
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
}: MapDataContract) {
  const viewportRef = useRef<HTMLDivElement>(null);

  const allLats = [
    eventDetails.location.lat,
    ...(trajectory.historicalWaypoints || []).map((w) => w.lat),
    ...(trajectory.forecastWaypoints || []).map((w) => w.lat),
  ];
  const allLons = [
    eventDetails.location.lon,
    ...(trajectory.historicalWaypoints || []).map((w) => w.lon),
    ...(trajectory.forecastWaypoints || []).map((w) => w.lon),
  ];

  const minLat = Math.min(...allLats) - 2.5;
  const maxLat = Math.max(...allLats) + 2.5;
  const minLon = Math.min(...allLons) - 3.5;
  const maxLon = Math.max(...allLons) + 3.5;

  const bounds = { minLat, maxLat, minLon, maxLon };

  const project = (lat: number, lon: number) => {
    const x = ((lon - bounds.minLon) / (bounds.maxLon - bounds.minLon)) * SVG_WIDTH;
    const y = ((bounds.maxLat - lat) / (bounds.maxLat - bounds.minLat)) * SVG_HEIGHT;
    return { x, y };
  };

  const currentSvg = project(eventDetails.location.lat, eventDetails.location.lon);

  const historicalPath = (trajectory.historicalWaypoints || [])
    .map((p) => {
      const svg = project(p.lat, p.lon);
      return `${svg.x},${svg.y}`;
    })
    .join(' L ');

  const forecastPath = (trajectory.forecastWaypoints || [])
    .map((p) => {
      const svg = project(p.lat, p.lon);
      return `${svg.x},${svg.y}`;
    })
    .join(' L ');

  const landfallPoint = trajectory.forecastWaypoints?.slice(-1)[0] || {
    lat: eventDetails.location.lat + 2,
    lon: eventDetails.location.lon - 1,
    windKmph: eventDetails.maxWindSpeedKmph,
  };
  const landfallSvg = project(landfallPoint.lat, landfallPoint.lon);

  const forecastWaypoints = trajectory.forecastWaypoints || [];
  const conePointsLeft: Array<{ x: number; y: number }> = [];
  const conePointsRight: Array<{ x: number; y: number }> = [];

  forecastWaypoints.forEach((wp) => {
    const pt = project(wp.lat, wp.lon);
    const radiusSvg = (wp.coneRadiusKm / 111) * (SVG_WIDTH / (bounds.maxLon - bounds.minLon));
    conePointsLeft.push({ x: pt.x - radiusSvg, y: pt.y - radiusSvg * 0.5 });
    conePointsRight.push({ x: pt.x + radiusSvg, y: pt.y + radiusSvg * 0.5 });
  });

  const conePolygonStr = [
    `${currentSvg.x},${currentSvg.y}`,
    ...conePointsLeft.map((p) => `${p.x},${p.y}`),
    ...conePointsRight.reverse().map((p) => `${p.x},${p.y}`),
  ].join(' ');

  const handleFullscreen = () => {
    const el = viewportRef.current;
    if (!el) return;
    if (document.fullscreenElement) {
      void document.exitFullscreen();
    } else if (el.requestFullscreen) {
      void el.requestFullscreen();
    }
  };

  const landfallTimeFormatted = eventDetails.estimatedLandfallTime
    ? new Date(eventDetails.estimatedLandfallTime).toLocaleDateString('en-US', {
        day: '2-digit',
        month: 'short',
      }) +
      ' · ' +
      new Date(eventDetails.estimatedLandfallTime).toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
        timeZone: 'UTC',
      }) +
      ' UTC'
    : 'NO LANDFALL PROJECTED';

  const gnnConfidencePercent = Math.round((diagnostics.gnnConfidenceScore || 0.94) * 100);

  return (
    <div className="bg-white rounded-xl border border-[#e2e8f0] shadow-sm p-4 flex flex-col justify-between relative overflow-hidden font-mono">
      <div className="flex flex-wrap items-center justify-between gap-3 pb-3 mb-2 border-b border-[#e2e8f0]">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-[#1e1b4b] flex items-center justify-center text-[#e0e7ff]">
            <span className="material-symbols-outlined text-[22px]">map</span>
          </div>
          <div>
            {/* Section Header Title (Indigo Mono Spec: 13px 700 Bold 0.04em UPPERCASE #1e1b4b) */}
            <div className="font-mono text-[13px] font-[700] tracking-[0.04em] uppercase text-[#1e1b4b]">
              GEOSPATIAL TRAJECTORY &amp; CONE OF UNCERTAINTY
            </div>
            <div className="font-mono text-[11px] font-[500] text-[#64748b]">
              Center: {eventDetails.location.lat.toFixed(2)}°N, {eventDetails.location.lon.toFixed(2)}°E • EPSG:4326
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

      <div ref={viewportRef} className="relative w-full h-[520px] rounded-lg bg-[#0f172a] overflow-hidden select-none font-mono">
        {showGrid && (
          <svg className="absolute inset-0 w-full h-full pointer-events-none opacity-20">
            <defs>
              <pattern id="geoGrid" width="60" height="60" patternUnits="userSpaceOnUse">
                <path d="M 60 0 L 0 0 0 60" fill="none" stroke="#64748b" strokeWidth="0.5" strokeDasharray="2 3" />
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
                <stop offset="0%" stopColor="#4f46e5" stopOpacity={0.15} />
                <stop offset="60%" stopColor="#dc2626" stopOpacity={0.25} />
                <stop offset="100%" stopColor="#991b1b" stopOpacity={0.4} />
              </linearGradient>
              <radialGradient id="hazardPulse" cx="50%" cy="50%" r="50%">
                <stop offset="0%" stopColor="#dc2626" stopOpacity={0.6} />
                <stop offset="50%" stopColor="#c2410c" stopOpacity={0.3} />
                <stop offset="100%" stopColor="#4f46e5" stopOpacity="0" />
              </radialGradient>
              <pattern id="downscaleTiles" width="16" height="16" patternUnits="userSpaceOnUse">
                <rect width="15" height="15" fill="#4f46e5" fillOpacity="0.1" stroke="#818cf8" strokeOpacity="0.4" strokeWidth="0.5" />
              </pattern>
            </defs>

            <path
              d="M 0,0 L 480,0 L 490,40 L 530,90 L 570,110 L 610,125 L 680,135 L 750,110 L 820,120 L 860,160 L 830,220 L 780,260 L 690,250 L 570,220 L 510,180 L 460,195 L 420,225 L 390,270 L 360,330 L 340,390 L 310,460 Z"
              fill="#1e293b"
              stroke="#334155"
              strokeWidth="1.2"
            />

            <text x="720" y="460" fill="#818cf8" fontFamily="Geist Mono, monospace" fontSize="13" fontWeight="700" letterSpacing="0.15em" opacity="0.4">
              INDIAN OCEAN BASIN
            </text>

            {visibleLayers.downscaling && (
              <g>
                <rect x="250" y="150" width="450" height="300" fill="url(#downscaleTiles)" />
                <text x="260" y="142" fill="#a5b4fc" fontFamily="Geist Mono, monospace" fontSize="11" fontWeight="700">
                  5 KM TERRAIN DOWNSCALING MESH ACTIVE [RESOLUTION: 5KM]
                </text>
              </g>
            )}

            {visibleLayers.radar && (
              <circle cx={currentSvg.x} cy={currentSvg.y} r="180" fill="#166534" fillOpacity="0.15" stroke="#22c55e" strokeDasharray="3 3" strokeWidth="1" />
            )}

            {visibleLayers.uncertaintyCone && (
              <polygon points={conePolygonStr} fill="url(#coneGradient)" />
            )}

            {visibleLayers.hazardFootprint && (
              <ellipse
                cx={currentSvg.x}
                cy={currentSvg.y}
                rx="90"
                ry="65"
                fill="url(#hazardPulse)"
                stroke="#dc2626"
                strokeWidth="1.5"
              />
            )}

            {visibleLayers.historicalTrack && historicalPath && (
              <path d={`M ${historicalPath}`} fill="none" stroke="#94a3b8" strokeDasharray="3 3" strokeWidth="2.5" />
            )}

            {visibleLayers.forecastTrack && forecastPath && (
              <path d={`M ${currentSvg.x},${currentSvg.y} L ${forecastPath}`} fill="none" stroke="#f43f5e" strokeLinecap="round" strokeWidth="3" />
            )}

            {visibleLayers.currentPosition && (
              <g transform={`translate(${currentSvg.x}, ${currentSvg.y})`}>
                <circle cx="0" cy="0" r="14" fill="none" stroke="#38bdf8" strokeWidth="1.5" opacity="0.6" className="animate-ping" />
                <circle cx="0" cy="0" r="8" fill="#0284c7" fillOpacity="0.5" stroke="#38bdf8" strokeWidth="2" />
                <circle cx="0" cy="0" r="3.5" fill="#FFFFFF" />
                <text x="14" y="4" fill="#e0f2fe" fontFamily="Geist Mono, monospace" fontSize="11" fontWeight="700">
                  CURRENT (T+00h)
                </text>
              </g>
            )}

            {visibleLayers.forecastNodes &&
              forecastWaypoints.map((p, idx) => {
                const leadHour = (idx + 1) * 12;
                const pt = project(p.lat, p.lon);
                const isSelected = leadHour === selectedLeadHour;

                return (
                  <g key={leadHour} transform={`translate(${pt.x}, ${pt.y})`}>
                    <circle
                      cx="0"
                      cy="0"
                      r={isSelected ? 6 : 4}
                      fill={isSelected ? '#be123c' : '#e11d48'}
                      stroke="#FFFFFF"
                      strokeWidth={isSelected ? 2 : 1}
                    />
                    <text x="8" y="4" fill="#fda4af" fontFamily="Geist Mono, monospace" fontSize="10">
                      T+{leadHour}h
                    </text>
                  </g>
                );
              })}

            {visibleLayers.landfallMarker && (
              <g transform={`translate(${landfallSvg.x}, ${landfallSvg.y})`}>
                <circle cx="0" cy="0" r="16" fill="none" stroke="#dc2626" strokeDasharray="3 3" strokeWidth="1.5" className="animate-spin" style={{ animationDuration: '10s' }} />
                <circle cx="0" cy="0" r="6" fill="#dc2626" stroke="#FFFFFF" strokeWidth="2" />
              </g>
            )}
          </svg>
        </div>

        {/* Embedded LANDFALL FORECAST Callout Widget */}
        <div className="absolute bottom-4 left-4 bg-[#1e1b4b]/95 backdrop-blur-md border border-[#312e81] rounded-xl p-4 text-white shadow-xl max-w-sm font-mono">
          <div className="text-[11px] font-[700] text-[#f87171] tracking-[0.04em] uppercase mb-1">
            LANDFALL FORECAST
          </div>
          <div className="text-[13px] font-[700] text-white">
            {landfallTimeFormatted}
          </div>
          <div className="text-[11px] font-[500] text-[#a5b4fc] mt-0.5">
            {eventDetails.estimatedLandfallLocation || 'Open Sea Path'}
          </div>

          <div className="grid grid-cols-3 gap-2 mt-3 pt-3 border-t border-[#312e81]">
            <div>
              <div className="text-[17px] font-[800] text-[#f87171] font-mono">
                {eventDetails.maxWindSpeedKmph} <span className="text-[11px] font-[500]">km/h</span>
              </div>
              <div className="text-[11px] font-[700] text-[#a5b4fc] tracking-[0.04em] uppercase">Peak Wind</div>
            </div>
            <div>
              <div className="text-[17px] font-[800] text-[#38bdf8] font-mono">
                214 <span className="text-[11px] font-[500]">mm/d</span>
              </div>
              <div className="text-[11px] font-[700] text-[#a5b4fc] tracking-[0.04em] uppercase">Max Rain</div>
            </div>
            <div>
              <div className="text-[17px] font-[800] text-[#34d399] font-mono">
                {gnnConfidencePercent}%
              </div>
              <div className="text-[11px] font-[700] text-[#a5b4fc] tracking-[0.04em] uppercase">Confidence</div>
            </div>
          </div>
        </div>

        <MapLegend
          uncertaintyConfidence={diagnostics.gnnConfidenceScore || 0.94}
          hazardThresholdMmDay={200}
          downscalingResolutionKm={5}
        />
      </div>
    </div>
  );
}
