import type { AiFieldData } from '../event-details.api';
import { CELL_TIER_COLORS, CELL_TIER_OPACITY, type CellTier } from '../event-details.utils';

interface DownscaledFieldProps {
  field: AiFieldData;
  showGrid: boolean;
}

const SVG_WIDTH = 540;
const SVG_HEIGHT = 410;
const CELL_SIZE = 18;

export default function DownscaledField({ field, showGrid }: DownscaledFieldProps) {
  const epicenterCell = field.cells.find((c) => c.isEpicenter);
  const epicenterX = epicenterCell ? epicenterCell.col * CELL_SIZE : 0;
  const epicenterY = epicenterCell ? epicenterCell.row * CELL_SIZE : 0;

  return (
    <div className="flex flex-col bg-white rounded-xl shadow-sm overflow-hidden ring-2 ring-violet-200">
      <div className="p-4 bg-[#EFF4FF] flex items-center justify-between">
        <div className="flex flex-col gap-0.5">
          <div className="flex items-center gap-2">
            <span className="text-headline-sm text-[#0F172A]">AI DOWNSCALED HAZARD FIELD</span>
            <span className="inline-flex items-center font-mono text-[10px] px-2 py-0.5 rounded bg-violet-100 text-[#6D28D9] font-semibold">
              {field.resolutionKm} KM AI REFINED
            </span>
          </div>
          <p className="text-body-sm text-[#475569]">Conditional Diffusion Model with Orographic &amp; Moisture Constraints</p>
        </div>
        <span className="material-symbols-outlined text-[#7C3AED] text-[20px]">neurology</span>
      </div>

      <div className="relative w-full h-[410px] bg-[#0c1829] overflow-hidden select-none">
        <svg className="w-full h-full" preserveAspectRatio="none" viewBox={`0 0 ${SVG_WIDTH} ${SVG_HEIGHT}`}>
          <defs>
            <pattern id="fine5kmGrid" width={CELL_SIZE} height={CELL_SIZE} patternUnits="userSpaceOnUse">
              <rect width={CELL_SIZE} height={CELL_SIZE} fill="none" stroke="#475569" strokeOpacity="0.6" strokeWidth="0.4" />
            </pattern>
          </defs>

          <path d="M 0,220 Q 140,240 240,210 T 420,130 T 540,90 L 540,410 L 0,410 Z" fill="#091320" />
          <path d="M 0,0 L 540,0 L 540,90 Q 420,130 240,210 T 0,220 Z" fill="#0f2238" />
          <path
            d="M 0,220 Q 140,240 240,210 T 420,130 T 540,90"
            fill="none"
            stroke="#64748B"
            strokeDasharray="2 2"
            strokeWidth="1.5"
          />

          {field.cells.map((cell) => {
            const tier = cell.tier as CellTier;
            return (
              <rect
                key={`${cell.col}-${cell.row}`}
                x={cell.col * CELL_SIZE}
                y={cell.row * CELL_SIZE}
                width={CELL_SIZE}
                height={CELL_SIZE}
                fill={CELL_TIER_COLORS[tier]}
                fillOpacity={CELL_TIER_OPACITY[tier]}
                stroke={cell.isEpicenter ? '#f8fafc' : undefined}
                strokeWidth={cell.isEpicenter ? 1.5 : undefined}
                className={cell.isEpicenter ? 'animate-pulse' : undefined}
              >
                <title>
                  Cell ({cell.col},{cell.row}) — {tier} risk tier
                </title>
              </rect>
            );
          })}

          {showGrid && <rect width="100%" height="100%" fill="url(#fine5kmGrid)" />}

          <g fill="#94a3b8" fontFamily="Inter" fontSize="10" letterSpacing="1">
            <text x="30" y="50">ODISHA INTERIOR</text>
            <text x="210" y="270">CHILIKA</text>
            <text x="310" y="160">PURI SECTOR</text>
            <text fill="#38bdf8" x="390" y="360">BAY OF BENGAL</text>
          </g>

          {epicenterCell && (
            <g transform={`translate(${epicenterX + 24}, ${epicenterY - 4})`}>
              <rect x="0" y="-14" width="168" height="34" rx="4" fill="#0f172a" fillOpacity="0.92" stroke="#ef4444" strokeWidth="1" />
              <text fill="#ef4444" fontFamily="JetBrains Mono" fontSize="10" fontWeight="700" x="8" y="0">
                CELL #{field.epicenter.cellId} (HOTSPOT)
              </text>
              <text fill="#ffffff" fontFamily="JetBrains Mono" fontSize="9" x="8" y="14">
                Peak: {field.epicenter.peak.value} {field.epicenter.peak.unit} (+{field.epicenter.peakChangePercent}%)
              </text>
            </g>
          )}
        </svg>

        <div className="absolute top-3 left-3 px-2 py-1 bg-violet-200/90 text-[#6D28D9] backdrop-blur rounded font-mono text-[10px] font-semibold">
          AI DOWNSCALED MESH: {field.gridMeshLabel}
        </div>
        <div className="absolute bottom-3 right-3 px-2.5 py-1 bg-[#0b1220]/80 backdrop-blur rounded text-white font-mono text-[10px] flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-[#EF4444] animate-ping" />
          HOVER ANY CELL TO INSPECT
        </div>
      </div>

      <div className="p-3 bg-[#EFF4FF] flex flex-wrap items-center justify-between gap-2 font-mono text-[11px] text-[#45464D]">
        <span>
          True Local Peak: <strong className="text-[#EF4444] font-bold">{field.truePeak.value} {field.truePeak.unit}</strong> (+{field.peakRecoveryPercent}% peak recovery)
        </span>
        <span>•</span>
        <span>
          Grid Size: <strong className="text-[#0F172A]">{field.resolutionKm} km × {field.resolutionKm} km</strong>
        </span>
        <span>•</span>
        <span>
          High-Risk Cells: <strong className="text-[#EF4444] font-bold">{field.highRiskCells}</strong>
        </span>
      </div>
    </div>
  );
}
