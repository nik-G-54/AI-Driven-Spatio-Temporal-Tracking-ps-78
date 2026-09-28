import type { HazardFrame, MapBounds } from '../historical-replay.api';
import { projectCoordinateToMap } from '../historical-replay.utils';

interface HazardEnvelopeProps {
  frame: HazardFrame | null;
  bounds: MapBounds;
  svgWidth: number;
  svgHeight: number;
}

const CELL_SIZE = 22;
const GRID_COLUMNS = 5;
const GRID_ROWS = 3;

export default function HazardEnvelope({ frame, bounds, svgWidth, svgHeight }: HazardEnvelopeProps) {
  if (!frame) return null;

  const center = projectCoordinateToMap(frame.center.latitude, frame.center.longitude, bounds, svgWidth, svgHeight);
  const gridWidth = GRID_COLUMNS * CELL_SIZE;
  const gridHeight = GRID_ROWS * CELL_SIZE;
  const originX = center.x - gridWidth / 2;
  const originY = center.y - gridHeight / 2;

  return (
    <div
      className="absolute pointer-events-none"
      style={{ left: originX - 20, top: originY - 20, width: gridWidth + 40, height: gridHeight + 40 }}
    >
      <div className="w-full h-full relative">
        <div className="absolute inset-0 bg-red-500/20 rounded-xl blur-sm" />
        <div className="absolute inset-4 bg-violet-400/30 rounded-lg blur-[2px]" />
        <svg className="w-full h-full" fill="none">
          {frame.cells.map((cell) => (
            <rect
              key={`${cell.col}-${cell.row}`}
              x={20 + cell.col * CELL_SIZE}
              y={20 + cell.row * CELL_SIZE}
              width={CELL_SIZE}
              height={CELL_SIZE}
              fill="#EF4444"
              fillOpacity={cell.intensity}
              stroke="#EF4444"
              strokeOpacity={0.4}
              strokeWidth={0.8}
              className={cell.intensity >= 0.85 ? 'animate-pulse' : undefined}
            />
          ))}
        </svg>
        <div className="absolute -top-3 -right-2 bg-[#EF4444] text-white font-mono text-[9px] px-1.5 py-0.5 rounded shadow">
          SURGE PEAK: +{frame.surgePeak.value}{frame.surgePeak.unit}
        </div>
      </div>
    </div>
  );
}
