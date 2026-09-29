import { classNames } from '../event-monitor.utils';

export interface MapLayerVisibility {
  historicalTrack: boolean;
  forecastTrack: boolean;
  uncertaintyCone: boolean;
  hazardFootprint: boolean;
  currentPosition: boolean;
  forecastNodes: boolean;
  landfallMarker: boolean;
  downscaling: boolean;
  radar: boolean;
}

const LAYER_LABELS: Record<keyof MapLayerVisibility, string> = {
  forecastTrack: 'Forecast Track',
  uncertaintyCone: 'Uncertainty Cone',
  hazardFootprint: 'Hazard Footprint',
  downscaling: '5 km Downscaling',
  radar: 'Radar',
  historicalTrack: 'Historical Track',
  currentPosition: 'Current Position',
  forecastNodes: 'Forecast Nodes',
  landfallMarker: 'Landfall Marker',
};

interface MapControlsProps {
  onZoomIn: () => void;
  onZoomOut: () => void;
  showGrid: boolean;
  onToggleGrid: () => void;
  layersOpen: boolean;
  onToggleLayersOpen: () => void;
  visibleLayers: MapLayerVisibility;
  onToggleLayer: (key: keyof MapLayerVisibility) => void;
  onFullscreen: () => void;
}

export default function MapControls({
  onZoomIn,
  onZoomOut,
  showGrid,
  onToggleGrid,
  layersOpen,
  onToggleLayersOpen,
  visibleLayers,
  onToggleLayer,
  onFullscreen,
}: MapControlsProps) {
  return (
    <div className="relative flex items-center gap-1.5 bg-[#F8FAFC] p-1 rounded-lg border border-[#CBD5E1]">
      <button
        type="button"
        onClick={onZoomIn}
        aria-label="Zoom in"
        className="w-7 h-7 flex items-center justify-center rounded bg-white hover:bg-[#F8FAFC] text-[#0F172A] shadow-xs text-label-md cursor-pointer"
      >
        <span className="material-symbols-outlined text-[16px]">add</span>
      </button>
      <button
        type="button"
        onClick={onZoomOut}
        aria-label="Zoom out"
        className="w-7 h-7 flex items-center justify-center rounded bg-white hover:bg-[#F8FAFC] text-[#0F172A] shadow-xs text-label-md cursor-pointer"
      >
        <span className="material-symbols-outlined text-[16px]">remove</span>
      </button>
      <div className="h-4 w-px bg-[#CBD5E1] mx-0.5" />
      <button
        type="button"
        onClick={onToggleLayersOpen}
        className={classNames(
          'h-7 px-2.5 flex items-center gap-1.5 rounded text-xs font-bold shadow-xs cursor-pointer',
          layersOpen ? 'bg-[#0F172A] text-white' : 'bg-white hover:bg-[#F8FAFC] text-[#0F172A] border border-[#E2E8F0]',
        )}
      >
        <span className="material-symbols-outlined text-[14px]">layers</span>
        Map Layers
      </button>
      <button
        type="button"
        onClick={onToggleGrid}
        className={classNames(
          'h-7 px-2.5 flex items-center gap-1.5 rounded text-xs font-bold shadow-xs cursor-pointer',
          showGrid ? 'bg-[#0F172A] text-white' : 'bg-white hover:bg-[#F8FAFC] text-[#0F172A] border border-[#E2E8F0]',
        )}
      >
        <span className="material-symbols-outlined text-[14px]">grid_4x4</span>
        Grid
      </button>
      <button
        type="button"
        onClick={onFullscreen}
        aria-label="Fullscreen map"
        className="w-7 h-7 flex items-center justify-center rounded bg-white hover:bg-[#F8FAFC] text-[#0F172A] shadow-xs cursor-pointer"
      >
        <span className="material-symbols-outlined text-[16px]">fullscreen</span>
      </button>

      {layersOpen && (
        <div className="absolute right-0 top-full mt-1.5 z-30 w-56 bg-white border border-[#CBD5E1] rounded-xl shadow-xl p-2.5 flex flex-col gap-1.5">
          <div className="text-[10px] font-mono font-bold text-[#64748B] uppercase px-1 pb-1 border-b border-[#E2E8F0]">
            MAP LAYERS
          </div>
          {(Object.keys(LAYER_LABELS) as Array<keyof MapLayerVisibility>).map((key) => (
            <label
              key={key}
              className="flex items-center gap-2 px-2 py-1 rounded hover:bg-[#F8FAFC] text-xs font-semibold text-[#0F172A] cursor-pointer"
            >
              <input
                type="checkbox"
                checked={visibleLayers[key]}
                onChange={() => onToggleLayer(key)}
                className="accent-[#0F172A] w-3.5 h-3.5"
              />
              {LAYER_LABELS[key]}
            </label>
          ))}
        </div>
      )}
    </div>
  );
}
