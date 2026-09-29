import { useEffect, useRef, useState } from 'react';
import * as maplibreglModule from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import { DEMO_CYCLONE } from '../mockCycloneData';

const maplibregl = maplibreglModule;
import CycloneOverlay from './CycloneOverlay';
import EventPreviewPanel from './EventPreviewPanel';

interface EventMapProps {
  onSelectEventForSatellite?: (eventId: string) => void;
}

const SEAMAP_STYLE_URL = 'https://tiles.openwaters.io/seamap/style.json';
const INITIAL_CENTER: [number, number] = [87.2, 15.0]; // [Lon, Lat]
const INITIAL_ZOOM = 5.2;

const SVG_WIDTH = 1000;
const SVG_HEIGHT = 600;

export default function EventMap({}: EventMapProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<any>(null);

  const [realTilesLoaded, setRealTilesLoaded] = useState(false);
  const [mapLoaded, setMapLoaded] = useState(true);
  const [isHovered, setIsHovered] = useState(false);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [mapVersion, setMapVersion] = useState(0); // Forces overlay re-projection on pan/zoom

  const [visibleLayers, setVisibleLayers] = useState({
    event: true,
    eventTrack: true,
    influenceRegion: true,
  });

  const [showLayerMenu, setShowLayerMenu] = useState(false);

  // Initialize MapLibre GL instance with SeaMap tiles
  useEffect(() => {
    if (!mapContainerRef.current || mapRef.current) return;

    try {
      const MapConstructor = (maplibregl as any)?.Map || (maplibregl as any)?.default?.Map || maplibregl;
      const AttributionConstructor = (maplibregl as any)?.AttributionControl || (maplibregl as any)?.default?.AttributionControl;

      if (typeof MapConstructor === 'function') {
        const map = new MapConstructor({
          container: mapContainerRef.current,
          style: SEAMAP_STYLE_URL,
          center: INITIAL_CENTER,
          zoom: INITIAL_ZOOM,
          attributionControl: false,
        });

        if (typeof AttributionConstructor === 'function') {
          map.addControl(new AttributionConstructor({ compact: true }), 'bottom-left');
        }

        map.on('load', () => {
          setRealTilesLoaded(true);
          setMapLoaded(true);
          map.resize();
        });

        map.on('move', () => {
          setMapVersion((v) => v + 1);
        });

        map.on('zoom', () => {
          setMapVersion((v) => v + 1);
        });

        // Trigger map resize after container layout stabilizes
        setTimeout(() => {
          try {
            map.resize();
          } catch {
            // Ignore resize error
          }
        }, 300);

        mapRef.current = map;

        return () => {
          try {
            map.remove();
          } catch {
            // Ignore cleanup error if unmounting
          }
          mapRef.current = null;
        };
      }
    } catch (err) {
      console.warn('[EventMap] MapLibre tile initialization fallback:', err);
      setMapLoaded(true);
    }
  }, []);

  const handleZoomIn = () => {
    try {
      mapRef.current?.zoomIn();
    } catch {
      // Ignore zoom error
    }
  };

  const handleZoomOut = () => {
    try {
      mapRef.current?.zoomOut();
    } catch {
      // Ignore zoom error
    }
  };

  const handleRecenter = () => {
    try {
      mapRef.current?.flyTo({
        center: INITIAL_CENTER,
        zoom: INITIAL_ZOOM,
        essential: true,
      });
    } catch {
      // Ignore flyTo error
    }
  };

  // Geographic projection helper to map lat/lon onto SVG canvas over SeaMap
  const projectGeoPoint = (lat: number, lon: number) => {
    if (mapRef.current) {
      try {
        const point = mapRef.current.project([lon, lat]);
        const container = mapContainerRef.current;
        if (container && container.clientWidth > 0 && container.clientHeight > 0) {
          const normX = (point.x / container.clientWidth) * SVG_WIDTH;
          const normY = (point.y / container.clientHeight) * SVG_HEIGHT;
          return { x: normX, y: normY };
        }
      } catch {
        // Fallback projection
      }
    }

    // Default projected Mercator fallback bounding box [Lat: 6 to 24, Lon: 78 to 96]
    const minLat = 6.0;
    const maxLat = 24.0;
    const minLon = 78.0;
    const maxLon = 96.0;

    const x = ((lon - minLon) / (maxLon - minLon)) * SVG_WIDTH;
    const y = ((maxLat - lat) / (maxLat - minLat)) * SVG_HEIGHT;
    return { x, y };
  };

  return (
    <div className="bg-[#0b1220] rounded-2xl border border-[#312e81] shadow-2xl p-4 flex flex-col justify-between relative overflow-hidden font-mono text-white">
      {/* Map Header & Controls */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-3 mb-2 border-b border-[#1e293b] z-10">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-[#1e1b4b] border border-[#312e81] flex items-center justify-center text-[#e0e7ff]">
            <span className="material-symbols-outlined text-[20px]">sailing</span>
          </div>
          <div>
            <div className="font-mono text-[13px] font-[700] tracking-[0.04em] uppercase text-[#1e1b4b]">
              SEAMAP NAUTICAL MONITOR • BAY OF BENGAL
            </div>
            <div className="font-mono text-[11px] font-[500] text-[#64748b]">
              OpenWaters SeaMap Tiles • Projection: EPSG:3857 (Mercator) • Center: 15.0°N, 87.2°E
            </div>
          </div>
        </div>

        {/* Minimal Map Controls */}
        <div className="relative flex items-center gap-1.5 bg-[#f8fafc] p-1 rounded-xl border border-[#e2e8f0]">
          <button
            type="button"
            onClick={handleZoomIn}
            aria-label="Zoom in"
            className="w-7 h-7 flex items-center justify-center rounded-lg bg-white border border-[#e2e8f0] text-[#1e1b4b] text-[14px] cursor-pointer hover:bg-[#e0e7ff]"
          >
            <span className="material-symbols-outlined text-[16px]">add</span>
          </button>

          <button
            type="button"
            onClick={handleZoomOut}
            aria-label="Zoom out"
            className="w-7 h-7 flex items-center justify-center rounded-lg bg-white border border-[#e2e8f0] text-[#1e1b4b] text-[14px] cursor-pointer hover:bg-[#e0e7ff]"
          >
            <span className="material-symbols-outlined text-[16px]">remove</span>
          </button>

          <button
            type="button"
            onClick={handleRecenter}
            aria-label="Recenter Map"
            title="Recenter to Bay of Bengal"
            className="h-7 px-2.5 flex items-center gap-1 rounded-lg bg-white border border-[#e2e8f0] text-[#1e1b4b] text-[11px] font-[700] cursor-pointer hover:bg-[#e0e7ff]"
          >
            <span className="material-symbols-outlined text-[14px]">center_focus_strong</span>
            Recenter
          </button>

          <button
            type="button"
            onClick={() => setShowLayerMenu((v) => !v)}
            className={`h-7 px-2.5 flex items-center gap-1.5 rounded-lg text-[11px] font-[700] cursor-pointer ${
              showLayerMenu ? 'bg-[#4f46e5] text-white' : 'bg-white border border-[#e2e8f0] text-[#1e1b4b] hover:bg-[#e0e7ff]'
            }`}
          >
            <span className="material-symbols-outlined text-[14px]">layers</span>
            Layers
          </button>

          {showLayerMenu && (
            <div className="absolute right-0 top-full mt-2 z-30 w-52 bg-white border border-[#e2e8f0] rounded-xl shadow-2xl p-2.5 space-y-1.5 font-mono">
              <div className="text-[10px] font-[700] text-[#64748b] uppercase pb-1 border-b border-[#e2e8f0]">
                MAP LAYERS
              </div>
              <label className="flex items-center gap-2 text-[11px] font-[500] text-[#0f172a] cursor-pointer hover:text-[#4f46e5]">
                <input
                  type="checkbox"
                  checked={visibleLayers.event}
                  onChange={(e) => setVisibleLayers((prev) => ({ ...prev, event: e.target.checked }))}
                  className="accent-[#4f46e5] w-3.5 h-3.5"
                />
                ☑ Cyclone Event
              </label>
              <label className="flex items-center gap-2 text-[11px] font-[500] text-[#0f172a] cursor-pointer hover:text-[#4f46e5]">
                <input
                  type="checkbox"
                  checked={visibleLayers.eventTrack}
                  onChange={(e) => setVisibleLayers((prev) => ({ ...prev, eventTrack: e.target.checked }))}
                  className="accent-[#4f46e5] w-3.5 h-3.5"
                />
                ☑ Event Track
              </label>
              <label className="flex items-center gap-2 text-[11px] font-[500] text-[#0f172a] cursor-pointer hover:text-[#4f46e5]">
                <input
                  type="checkbox"
                  checked={visibleLayers.influenceRegion}
                  onChange={(e) => setVisibleLayers((prev) => ({ ...prev, influenceRegion: e.target.checked }))}
                  className="accent-[#4f46e5] w-3.5 h-3.5"
                />
                ☑ Influence Region
              </label>
            </div>
          )}
        </div>
      </div>

      {/* Main Map Canvas Area */}
      <div className="relative w-full h-[540px] rounded-xl bg-[#080d1a] overflow-hidden">
        {/* MapLibre GL SeaMap Container */}
        <div ref={mapContainerRef} className="absolute inset-0 w-full h-full z-0" />

        {/* Fallback Grid Line Styling (Only visible before tiles finish loading) */}
        {!realTilesLoaded && (
          <div className="absolute inset-0 pointer-events-none opacity-30">
            <svg className="w-full h-full" viewBox={`0 0 ${SVG_WIDTH} ${SVG_HEIGHT}`}>
              <defs>
                <pattern id="seaGrid" width="80" height="80" patternUnits="userSpaceOnUse">
                  <path d="M 80 0 L 0 0 0 80" fill="none" stroke="#1e293b" strokeWidth="0.5" strokeDasharray="3 3" />
                </pattern>
              </defs>
              <rect width="100%" height="100%" fill="url(#seaGrid)" />
              <text x="700" y="460" fill="#312e81" fontFamily="'Geist Mono', monospace" fontSize="15" fontWeight="800" letterSpacing="0.2em" opacity="0.6">
                LOADING SEAMAP NAUTICAL TILES...
              </text>
            </svg>
          </div>
        )}

        {/* Dynamic Cyclone Anomaly Overlay Layer (key includes mapVersion to update smoothly on zoom/pan) */}
        {mapLoaded && (
          <svg key={mapVersion} className="absolute inset-0 w-full h-full pointer-events-auto z-10" viewBox={`0 0 ${SVG_WIDTH} ${SVG_HEIGHT}`}>
            <CycloneOverlay
              data={DEMO_CYCLONE}
              isHovered={isHovered}
              isSelected={isPreviewOpen}
              onHover={setIsHovered}
              onClick={() => setIsPreviewOpen(true)}
              visibleLayers={visibleLayers}
              projectGeo={projectGeoPoint}
            />
          </svg>
        )}

        {/* Hover Tooltip Popup */}
        {isHovered && !isPreviewOpen && (
          <div className="absolute top-6 left-6 bg-[#1e1b4b]/95 backdrop-blur-md border border-[#312e81] text-white p-3 rounded-xl shadow-2xl text-[12px] font-mono z-20 pointer-events-none space-y-1">
            <div className="font-[800] text-[#fef08a] uppercase tracking-wider">
              {DEMO_CYCLONE.name}
            </div>
            <div className="text-[#a5b4fc]">Location: {DEMO_CYCLONE.locationName}</div>
            <div className="flex items-center gap-3 pt-1 text-[11px]">
              <span className="font-[700] text-[#f87171]">Severity: {DEMO_CYCLONE.severity}</span>
              <span className="font-[700] text-[#34d399]">Confidence: {(DEMO_CYCLONE.confidence * 100).toFixed(0)}%</span>
            </div>
            <div className="text-[10px] text-[#94a3b8] italic">Click event to open operational preview panel</div>
          </div>
        )}

        {/* Right-Side Event Preview Panel (Slides in when event is clicked) */}
        <EventPreviewPanel
          data={DEMO_CYCLONE}
          isOpen={isPreviewOpen}
          onClose={() => setIsPreviewOpen(false)}
        />
      </div>
    </div>
  );
}
