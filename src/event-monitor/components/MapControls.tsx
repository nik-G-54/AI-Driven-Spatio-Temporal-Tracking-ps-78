import { classNames } from '../event-monitor.utils';

export interface MapLayerVisibility {
  historicalTrack: boolean;
  forecastTrack: boolean;
  uncertaintyCone: boolean;
  hazardFootprint: boolean;
  currentPosition: boolean;
  forecastNodes: boolean;
  landfallMarker: boolean;
}

const LAYER_LABELS: Record<keyof MapLayerVisibility, string> = {
  historicalTrack: 'Historical Track',
  forecastTrack: 'Forecast Track',
  uncertaintyCone: 'Cone of Uncertainty',
  hazardFootprint: 'Hazard Footprint',
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
    <div className="relative flex items-center gap-1.5 bg-[#F8FAFC] p-1 rounded-lg">
      <button
        type="button"
        onClick={onZoomIn}
        className="w-7 h-7 flex items-center justify-center rounded bg-white hover:bg-[#F8FAFC] text-[#0F172A] shadow-sm text-label-md"
      >
        <span className="material-symbols-outlined text-[16px]">add</span>
      </button>
      <button
        type="button"
        onClick={onZoomOut}
        className="w-7 h-7 flex items-center justify-center rounded bg-white hover:bg-[#F8FAFC] text-[#0F172A] shadow-sm text-label-md"
      >
        <span className="material-symbols-outlined text-[16px]">remove</span>
      </button>
      <div className="h-4 w-px bg-[#C6C6CD] mx-0.5" />
      <button
        type="button"
        onClick={onToggleLayersOpen}
        className={classNames(
          'h-7 px-2 flex items-center gap-1 rounded text-label-sm shadow-sm',
          layersOpen ? 'bg-[#0F172A] text-white' : 'bg-white hover:bg-[#F8FAFC] text-[#0F172A]',
        )}
      >
        <span className="material-symbols-outlined text-[14px]">layers</span>
        Layers
      </button>
      <button
        type="button"
        onClick={onToggleGrid}
        className={classNames(
          'h-7 px-2 flex items-center gap-1 rounded text-label-sm shadow-sm',
          showGrid ? 'bg-[#0F172A] text-white' : 'bg-white hover:bg-[#F8FAFC] text-[#0F172A]',
        )}
      >
        <span className="material-symbols-outlined text-[14px]">grid_4x4</span>
        5km Grid
      </button>
      <button
        type="button"
        onClick={onFullscreen}
        className="w-7 h-7 flex items-center justify-center rounded bg-white hover:bg-[#F8FAFC] text-[#0F172A] shadow-sm"
      >
        <span className="material-symbols-outlined text-[16px]">fullscreen</span>
      </button>

      {layersOpen && (
        <div className="absolute right-0 top-full mt-1.5 z-20 w-52 bg-white border border-[#E2E8F0] rounded-lg shadow-lg p-2 flex flex-col gap-1">
          {(Object.keys(LAYER_LABELS) as Array<keyof MapLayerVisibility>).map((key) => (
            <label
              key={key}
              className="flex items-center gap-2 px-1.5 py-1 rounded hover:bg-[#F8FAFC] text-body-sm text-[12px] text-[#0F172A] cursor-pointer"
            >
              <input
                type="checkbox"
                checked={visibleLayers[key]}
                onChange={() => onToggleLayer(key)}
                className="accent-[#0F172A]"
              />
              {LAYER_LABELS[key]}
            </label>
          ))}
        </div>
      )}
    </div>
  );
}
